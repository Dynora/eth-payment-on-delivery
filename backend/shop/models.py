from django.contrib.auth.models import User
from django.db import models
from api.models import Delivery


class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return '{} - {} eth'.format(self.name, self.price)


class Order(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    payment = models.ForeignKey(Delivery, on_delete=models.PROTECT, null=True, blank=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=6)
    user = models.ForeignKey(User, models.PROTECT)
    product = models.ForeignKey(Product, models.PROTECT)
    address = models.CharField(max_length=200)
    postalcode = models.CharField(max_length=40)
    city = models.CharField(max_length=200)
    paid = models.BooleanField(default=False)
    shipped = models.BooleanField(default=False)

    def __str__(self):
        return '{} - {} - {}'.format(self.created, self.user, self.product)


