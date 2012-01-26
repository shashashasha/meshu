from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('meshu.views',
	url(r'^shop/', 'shop'),

	url(r'^make/', 'make'),

	url(r'^edit/(?P<item_id>\d+)', 'edit'),

	url(r'^create/user/(?P<user_id>\d+)', 'create_user'),

	url(r'^$', 'index'),
)
