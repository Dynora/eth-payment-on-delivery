from datetime import datetime

import pytz
from django.db import models

from api.utils import get_web3_object, get_contract_object


class Transport(models.Model):
    transport_id = models.CharField(max_length=128, unique=True, db_index=True)
    transporter_address = models.CharField(max_length=64, db_index=True)
    merchant_address = models.CharField(max_length=64, db_index=True)
    created = models.DateTimeField(blank=True, null=True)
    timeout = models.DateTimeField(blank=True, null=True)
    finished = models.DateTimeField(blank=True, null=True)
    deposit_received = models.DateTimeField(blank=True, null=True)
    cancelled = models.DateTimeField(blank=True, null=True)
    deposit_claimed = models.DateTimeField(blank=True, null=True)
    deposit = models.DecimalField(max_digits=12, decimal_places=6, null=True)
    delivery_fee = models.DecimalField(max_digits=12, decimal_places=6, null=True)


class Delivery(models.Model):
    delivery_id = models.CharField(max_length=128, unique=True, db_index=True)
    transport_id = models.CharField(max_length=128, db_index=True, null=True, blank=True)
    customer_address = models.CharField(max_length=64, db_index=True)
    merchant_address = models.CharField(max_length=64, db_index=True)
    deposit = models.DecimalField(max_digits=12, decimal_places=6, null=True)
    created = models.DateTimeField(blank=True, null=True)
    timeout = models.DateTimeField(blank=True, null=True)
    refunded = models.DateTimeField(blank=True, null=True)
    delivered = models.DateTimeField(blank=True, null=True)
    active = models.BooleanField(default=False)

    def save(self, force_insert=False, force_update=False, using=None,
             update_fields=None, **kwargs):

        if 'contract' in kwargs:
            contract = kwargs['contract']
            web3 = contract.web3
        else:
            web3 = get_web3_object()
            contract = get_contract_object(web3, 'PaymentOnDelivery')

        if not self.id:
            self.customer_address = contract.functions.getDeliveryCustomer(self.delivery_id).call()
            self.merchant_address = contract.functions.getDeliveryMerchant(self.delivery_id).call()
            self.deposit = web3.fromWei(contract.functions.getDeliveryDeposit(self.delivery_id).call(), 'ether')
            self.created = datetime.fromtimestamp(contract.functions.getDeliveryCreated(self.delivery_id).call(),
                                                      tz=pytz.utc)
            self.timeout = datetime.fromtimestamp(contract.functions.getDeliveryTimeout(self.delivery_id).call(),
                                                      tz=pytz.utc)

        self.transport_id = web3.toHex(contract.functions.getDeliveryTransportId(self.delivery_id).call())

        if self.transport_id and self.transport_id != '0x0000000000000000000000000000000000000000000000000000000000000000':
            # Check if transport exists
            transport, created = Transport.objects.get_or_create(transport_id=self.transport_id)
        else:
            self.transport_id = None

        refunded = contract.functions.getDeliveryRefunded(self.delivery_id).call()
        if refunded:
            self.refunded = datetime.fromtimestamp(refunded, tz=pytz.utc)
        else:
            self.refunded = None
        delivered = contract.functions.getDeliveryDelivered(self.delivery_id).call()
        if delivered:
            self.delivered = datetime.fromtimestamp(delivered, tz=pytz.utc)
        else:
            self.delivered = None

        self.active = contract.functions.getDeliveryActive(self.delivery_id).call()

        super(Delivery, self).save()

    def __str__(self):
        return self.delivery_id

