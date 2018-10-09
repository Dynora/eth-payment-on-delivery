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

            if created:
                delivery.customer_address = contract.functions.getDeliveryCustomer(payment_id).call()
                delivery.merchant_address = contract.functions.getDeliveryMerchant(payment_id).call()
                delivery.deposit = web3.fromWei(contract.functions.getDeliveryDeposit(payment_id).call(), 'ether')
                delivery.created = datetime.fromtimestamp(contract.functions.getDeliveryCreated(payment_id).call(),
                                                          tz=pytz.utc)
                delivery.timeout = datetime.fromtimestamp(contract.functions.getDeliveryTimeout(payment_id).call(),
                                                          tz=pytz.utc)

            delivery.refunded = datetime.fromtimestamp(contract.functions.getDeliveryRefunded(payment_id).call(), tz=pytz.utc)
            delivery.delivered = datetime.fromtimestamp(contract.functions.getDeliveryDelivered(payment_id).call(), tz=pytz.utc)
            delivery.active = contract.functions.getDeliveryActive(payment_id).call()

            delivery.save()


            # TODO if active and not used in order try to reconcile on same customer and deposit
            if delivery.active:

                # Check if payment is already used
                used_count = Order.objects.filter(payment=delivery).count()

                if used_count == 0:

                    orders = Order.objects.filter(
                        user__username__iexact=delivery.customer_address,
                        paid=False,
                        payment__isnull=True,
                        total_amount=delivery.deposit
                    ).order_by('created')

                    if len(orders) > 0:
                        # Link to oldest order
                        orders[0].payment = delivery
                        orders[0].paid = True
                        orders[0].save()

                        self.stdout.write(self.style.SUCCESS('Linked to order #{}'.format(orders[0].id)))

        self.stdout.write(self.style.SUCCESS('Successfully updated payments'))
