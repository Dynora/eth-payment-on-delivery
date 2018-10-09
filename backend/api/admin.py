from django.contrib import admin

from api.models import Delivery


class DeliveryAdmin(admin.ModelAdmin):
    list_display = ('created', 'customer_address', 'deposit', 'active')
    list_display_links = ('created',)
    ordering = ('-created',)


admin.site.register(Delivery, DeliveryAdmin)
