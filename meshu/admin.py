from meshu.models import Meshu, MeshuImage, UserProfile, Order
from django.contrib import admin

class MeshuImageInline(admin.TabularInline):
	model = MeshuImage
	extra = 2

class MeshuInline(admin.TabularInline):
	model = Meshu
	extra = 1

class MeshuAdmin(admin.ModelAdmin):
	fieldsets = [
		(None, {
            'fields': ('user', 'title', 'description', 'points_blob')
        }),
	]
	inlines = [ MeshuImageInline, ]

admin.site.register(Meshu, MeshuAdmin)

class OrderInline(admin.StackedInline):
	model = Order
	raw_id_fields = ("user",)
	extra = 0

class OrderAdmin(admin.ModelAdmin):
	fieldsets = [
		('Order', {
			'fields': ('user', 'meshu', 'product', 'material', 'color')
		}),
		('Order Details', {
			'fields': ('status', 'amount')
		}),
		('Shipping Information', {
			'classes': ['collapse'],
			'fields': ['shipping_address', 'shipping_address_2', 'shipping_city', 'shipping_zip']
		})
	]

admin.site.register(Order, OrderAdmin)

class UserProfileAdmin(admin.ModelAdmin):
	inlines = [OrderInline]

admin.site.register(UserProfile, UserProfileAdmin)