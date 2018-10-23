from datetime import datetime

import pytz
from django.conf import settings
from django.contrib import admin
from django.utils.safestring import mark_safe
from django.contrib import messages
from api.utils import get_web3_object, get_contract_object, send_signed_transaction
from shop.models import Order, Product

admin.site.register(Product)


class OrderAdmin(admin.ModelAdmin):
    list_display = ('created', 'user', 'total_amount', 'get_payment_status', 'paid', 'shipped', 'delivered', 'refunded')
    list_display_links = ('created',)
    list_filter = ('paid', 'shipped', 'delivered', 'refunded')
    ordering = ('-created',)
    raw_id_fields = ('payment', 'user', 'product')
    readonly_fields = ('total_amount', 'paid', 'delivered', 'refunded')

    actions = ['create_transport']

    def get_payment_status(self, obj):

        if obj.payment:

            if obj.payment.active:

                if (obj.payment.timeout - obj.payment.created).total_seconds() >= settings.ETH_MERCHANT_MINIMUM_DELIVERY_TIME:
                    return mark_safe('<img src="/static/admin/img/icon-yes.svg"> Deposited: {}'.format(obj.payment.created.strftime("%d-%m-%Y %H:%M")))
                else:
                    return mark_safe('<img src="/static/admin/img/icon-no.svg"> Timeout too soon: {}'.format(obj.payment.timeout.strftime("%d-%m-%Y %H:%M")))
            else:
                if obj.refunded:
                    return mark_safe('<img src="/static/admin/img/icon-no.svg"> Refunded: {}'.format(obj.payment.refunded.strftime("%d-%m-%Y %H:%M")))
                elif obj.delivered:
                    return mark_safe('<img src="/static/admin/img/icon-yes.svg"> Delivered: {}'.format(obj.payment.delivered.strftime("%d-%m-%Y %H:%M")))

        return '-'

    get_payment_status.short_description = 'Payment status'

    def create_transport(self, request, queryset):
        delivery_ids = []

        for order in queryset.select_related('payment'):

            if (order.payment.timeout - datetime.now(pytz.utc)).total_seconds() < settings.ETH_MERCHANT_MINIMUM_DELIVERY_TIME:
                self.message_user(request,
                    'Timeout of payment {} exceeds mininum delivery time, could not transport'.format(
                        order.payment.delivery_id
                    ), level=messages.ERROR
                )
                return
            else:
                delivery_ids.append(order.payment.delivery_id)

        # Create transport

        web3 = get_web3_object()
        contract = get_contract_object(web3, 'PaymentOnDelivery')

        try:
            tx_info = contract.functions.createTransport(
                '0x26f80C9Ea4696537C002436e63d54321aA1fCA86',
                3600,
                web3.toWei(1, 'ether'),
                delivery_ids,
                web3.toWei(0.01, 'ether')
            ).buildTransaction(
                {'from': settings.ETH_MERCHANT_ADDRESS}
            )

            tx_hash = send_signed_transaction(web3, tx_info)

            self.message_user(request,
              'Transport created in tx {}'.format(
                  web3.toHex(tx_hash)
              ), level=messages.SUCCESS
            )

        except ValueError as e:
            self.message_user(request,
                              'Could not create transport: {}'.format(e), level=messages.ERROR
                              )


admin.site.register(Order, OrderAdmin)
