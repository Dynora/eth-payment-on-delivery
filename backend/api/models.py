from django.db import models


class Delivery(models.Model):
    delivery_id = models.CharField(max_length=128, unique=True, db_index=True)
    customer_address = models.CharField(max_length=64, db_index=True)
    merchant_address = models.CharField(max_length=64, db_index=True)
    deposit = models.DecimalField(max_digits=12, decimal_places=6, null=True)
    created = models.DateTimeField(blank=True, null=True)
    timeout = models.DateTimeField(blank=True, null=True)
    refunded = models.DateTimeField(blank=True, null=True)
    delivered = models.DateTimeField(blank=True, null=True)
    active = models.BooleanField(default=False)

    def __str__(self):
        return self.delivery_id
