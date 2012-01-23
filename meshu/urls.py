from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('meshu.views',
	# /
	url(r'^$', 'index'),

	url(r'^shop/', 'shop'),
)
