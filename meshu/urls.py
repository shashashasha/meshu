from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('meshu.views',
	url(r'^shop/', 'shop'),

	url(r'^make/', 'make'),

	url(r'^$', 'index'),
)
