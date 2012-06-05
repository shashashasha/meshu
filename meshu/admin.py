from meshu.models import Meshu, MeshuImage, UserProfile, Order
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
            'fields': ('user_profile', 'title', 'description', 'location_data', 'svg', 'theta', 'product', 'thumbnail')
        }),
	]
	inlines = [ MeshuImageInline, ]
	list_display = ('title', 'date_created', 'user_profile')

admin.site.register(Meshu, MeshuAdmin)

# How Orders are displayed
class OrderMiniInline(admin.StackedInline):
	model = Order
	raw_id_fields = ("user_profile",)
	extra = 0
	
	fieldsets = [
		('Order Details', {
			'fields': ('status', 'amount', 'contact')
		}),
		('Shipping Information', {
			'classes': ['collapse'],
			'fields': ['shipping_address', 'shipping_address_2', 'shipping_city', 'shipping_zip', 'shipping_state', 'shipping_region', 'shipping_country']
		}),
		('Order Shipped Status', {
			'classes': ['collapse'],
			'fields': ['ship_date', 'tracking']
		})
	]

class OrderInline(admin.StackedInline):
	model = Order
	raw_id_fields = ("user_profile",)
	extra = 0

class OrderAdmin(admin.ModelAdmin):
	fieldsets = [
		('Order', {
			'fields': ('user_profile', 'meshu', 'product', 'material', 'color')
		}),
		('Order Details', {
			'fields': ('status', 'amount', 'contact')
		}),
		('Shipping Information', {
			'classes': ['collapse'],
			'fields': ['shipping_address', 'shipping_address_2', 'shipping_city', 'shipping_zip', 'shipping_state', 'shipping_region', 'shipping_country']
		}),
		('Order Shipped Status', {
			'classes': ['collapse'],
			'fields': ['ship_date', 'tracking']
		})
	]

	list_display = ('__unicode__', 'user_profile', 'meshu', 'product', 'amount', 'status', 'date_created')

admin.site.register(Order, OrderAdmin)

class UserProfileAdmin(admin.ModelAdmin):
	inlines = [OrderMiniInline]
	list_display = ('user_email', 'amount_meshus', 'amount_orders', 'date_joined')

admin.site.register(UserProfile, UserProfileAdmin)