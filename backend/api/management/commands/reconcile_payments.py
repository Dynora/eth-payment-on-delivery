from datetime import datetime

import pytz
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings

from api.models import Delivery
from api.utils import get_web3_object, get_contract_object
from shop.models import Order


class Command(BaseCommand):
    help = 'Reconcile open orders'

    def handle(self, *args, **options):
        # Update deliveries

        web3 = get_web3_object()
        contract = get_contract_object(web3, 'PaymentOnDelivery')

        payment_ids = contract.functions.getMerchantDeliveries(settings.ETH_MERCHANT_ADDRESS).call()

        for payment_id in payment_ids:
            self.stdout.write('* Checking {}'.format(web3.toHex(payment_id)))

            delivery, created = Delivery.objects.get_or_create(delivery_id=web3.toHex(payment_id))

            delivery.save(contract=contract)

            # Check if payment is already used
            used_count = Order.objects.filter(payment=delivery).count()

            if used_count == 1:
                order = Order.objects.get(payment=delivery)
                order.delivered = bool(delivery.delivered)
                order.refunded = bool(delivery.refunded)
                order.save()

                self.stdout.write(self.style.SUCCESS('> Updated order #{}'.format(order.id)))

            # active and not used in order try to reconcile on same customer and deposit
            elif used_count == 0 and delivery.active:

                orders = Order.objects.filter(
                    user__username__iexact=delivery.customer_address,
                    paid=False,
                    payment__isnull=True,
                    total_amount=delivery.deposit
                ).order_by('created')

                if len(orders) > 0:
                    # Link to oldest order
                    orders[0].payment = delivery

                    # Check if timeout meets criteria
                    orders[0].paid = (delivery.timeout - delivery.created).total_seconds() >= settings.ETH_MERCHANT_MINIMUM_DELIVERY_TIME
                    orders[0].save()

                    self.stdout.write(self.style.SUCCESS('> Linked to order #{}'.format(orders[0].id)))
            else:
                self.stdout.write(self.style.ERROR('> Could not link payment {}'.format(delivery.delivery_id)))

        self.stdout.write(self.style.SUCCESS('Successfully updated payments'))
