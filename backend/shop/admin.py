from django.contrib import admin

from shop.models import Order, Product

admin.site.register(Product)


class OrderAdmin(admin.ModelAdmin):
    list_display = ('created', 'user', 'total_amount', 'paid', 'shipped')
    list_display_links = ('created',)
    list_filter = ('paid', 'shipped',)
    ordering = ('-created',)


admin.site.register(Order, OrderAdmin)
