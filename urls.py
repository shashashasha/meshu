from django.conf.urls.defaults import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

# separate these patterns because they don't use the polls.views prefix
urlpatterns = patterns('',
	# polls urls
	# "url/polls/34/vote/" will be passed to polls/urls.py as "34/vote/"
	url(r'^polls/', include('polls.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),

	# meshu begin
	url(r'^meshu/', include('meshu.urls')),
)
