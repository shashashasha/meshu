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
            'fields': ('user_profile', 'title', 'description', 'location_data', 'svg')
        }),
	]
	inlines = [ MeshuImageInline, ]

admin.site.register(Meshu, MeshuAdmin)

# How Orders are displayed
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
			'fields': ['shipping_address', 'shipping_address_2', 'shipping_city', 'shipping_zip']
		})
	]

admin.site.register(Order, OrderAdmin)

class UserProfileAdmin(admin.ModelAdmin):
	inlines = [OrderInline]

admin.site.register(UserProfile, UserProfileAdmin)