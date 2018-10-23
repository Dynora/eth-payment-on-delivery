from django.contrib import admin

from api.models import Delivery, Transport
from django.contrib import messages
from api.utils import get_web3_object, get_contract_object, send_signed_transaction
from django.conf import settings


class DeliveryAdmin(admin.ModelAdmin):
    list_display = ('created', 'customer_address', 'deposit', 'active')
    list_display_links = ('created',)
    list_filter = ('active',)
    search_fields = ('customer_address',)
    date_hierarchy = 'created'
    ordering = ('-created',)

    readonly_fields = ('delivery_id', 'customer_address', 'merchant_address', 'deposit', 'created', 'timeout',
                       'refunded', 'delivered', 'active', 'transport_id')


admin.site.register(Delivery, DeliveryAdmin)


class TransportAdmin(admin.ModelAdmin):
    list_display = ('transport_id',)
    list_display_links = ('transport_id',)

    readonly_fields = ('transport_id', 'transporter_address', )

    actions = ['cancel_transport']

    def cancel_transport(self, request, queryset):

        for transport in queryset:

            # Create transport

            web3 = get_web3_object()
            contract = get_contract_object(web3, 'PaymentOnDelivery')

            try:
                tx_info = contract.functions.cancelTransport(
                    transport.transport_id
                ).buildTransaction(
                    {'from': settings.ETH_MERCHANT_ADDRESS}
                )

                tx_hash = send_signed_transaction(web3, tx_info)

                self.message_user(request,
                                  'Cancelled transport: {}'.format(transport.transport_id), level=messages.SUCCESS
                                  )

                transport.delete()

            except ValueError as e:
                self.message_user(request,
                                  'Could not cancel transport: {}'.format(transport.transport_id), level=messages.ERROR
                                  )


admin.site.register(Transport, TransportAdmin)