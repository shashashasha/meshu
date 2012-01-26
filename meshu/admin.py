from meshu.models import Meshu
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
