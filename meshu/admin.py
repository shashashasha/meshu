from meshu.models import Meshu
from django.contrib import admin

class MeshuAdmin(admin.ModelAdmin):
	fieldsets = [
		('Date information', {'fields': ['date_created'], 'classes': ['collapse']}),
	]
	list_display = ('user', 'date_created')
	list_filter = ['date_created']

admin.site.register(Meshu, MeshuAdmin)
