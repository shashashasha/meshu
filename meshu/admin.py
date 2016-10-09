from meshu.models import Meshu, MeshuImage, UserProfile, Order, ShippingInfo
from django.contrib import admin

# How Meshus are displayed
class MeshuImageInline(admin.TabularInline):
	model = MeshuImage
	extra = 2

class MeshuInline(admin.TabularInline):
	model = Meshu
	extra = 1

class MeshuAdmin(admin.ModelAdmin):
	fieldsets = [
		(None, {
            'fields': ('user_profile', 'title', 'description', 'location_data', 'svg', 'theta', 'renderer', 'metadata', 'product', 'thumbnail')
        }),
	]
	inlines = [ MeshuImageInline, ]

	raw_id_fields = ('user_profile', )
	list_display = ('title', 'date_created', 'renderer', 'user_profile')

admin.site.register(Meshu, MeshuAdmin)


# How Orders are displayed
class OrderMiniInline(admin.StackedInline):
	model = Order
	raw_id_fields = ("user_profile",)
	extra = 0

	fieldsets = [
		('Double Check', {
			'fields': ('special_instructions', 'postcard_note', 'tracking')
		}),
		('Order Details', {
			'fields': ('status', 'product', 'material', 'color')
		})
	]

class OrderInline(admin.StackedInline):
	model = Order
	raw_id_fields = ("user_profile",)
	extra = 0

class OrderAdmin(admin.ModelAdmin):
	fieldsets = [
		('Order', {
			'fields': ('user_profile', 'meshu', 'product', 'material', 'color', 'postcard_note',)
		}),
		('Order Details', {
			'fields': ('status', 'amount', 'metadata', 'special_instructions', 'coupon',)
		}),
		('Shipping', {
			'fields': ('shipping',)
		}),
		('Order Shipped Status', {
			'classes': ['collapse'],
			'fields': ['postcard_ordered', 'ship_date', 'tracking']
		})
	]

	raw_id_fields = ('meshu', 'user_profile', )
	list_display = ('__unicode__', 'user_profile','shipping', 'meshu', 'product', 'amount', 'status', 'date_created')

admin.site.register(Order, OrderAdmin)

class UserProfileAdmin(admin.ModelAdmin):
	inlines = [OrderMiniInline]
	list_display = ('user_email', 'amount_meshus', 'amount_orders', 'date_joined')

admin.site.register(UserProfile, UserProfileAdmin)


class ShippingInfoAdmin(admin.ModelAdmin):
	model = ShippingInfo
	extra = 0

	fieldsets = [
		('Contact', {
			'fields': ('contact',)
		}),
		('Shipping Information', {
			'fields': ['shipping_name', 'shipping_address', 'shipping_address_2', 'shipping_city', 'shipping_zip', 'shipping_state', 'shipping_region', 'shipping_country']
		})
	]

	inlines = [OrderMiniInline]

admin.site.register(ShippingInfo, ShippingInfoAdmin)
