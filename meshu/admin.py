from meshu.models import Meshu, Order
from django.contrib import admin

class MeshuAdmin(admin.ModelAdmin):
	fieldsets = [
		(None, {
            'fields': ('user', 'title', 'description', 'points_blob')
        }),
		('Date information', {
			'classes': ['collapse'],
			'fields': ['date_created']
		}),
	]
	list_filter = ['date_created']

admin.site.register(Meshu, MeshuAdmin)

class OrderAdmin(admin.ModelAdmin):
	fieldsets = [
		('Order', {
			'fields': ('user', 'meshu', 'product', 'material', 'color')
		}),
		('Order Details', {
			'fields': ('status', 'amount', 'date_created')
		}),
		('Shipping Information', {
			'classes': ['collapse'],
			'fields': ['shipping_address', 'shipping_address_2', 'shipping_city', 'shipping_zip']
		})
	]

admin.site.register(Order, OrderAdmin)
