from django.conf.urls.defaults import *
from django.views.generic.simple import direct_to_template

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

# separate these patterns because they don't use the polls.views prefix
urlpatterns = patterns('',
	# polls urls
	# "url/polls/34/vote/" will be passed to polls/urls.py as "34/vote/"

	# Uncomment the admin/doc line below to enable admin documentation:
	url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

	# Uncomment the next line to enable the admin:
	url(r'^admin/', include(admin.site.urls)),

	# account stuff
	url(r'^signup/', direct_to_template, {
		'template': 'meshu/users/signup.html'
	}),
	url(r'^login/', 'django.contrib.auth.views.login', {
		'template_name': 'meshu/users/login.html'
	}),
	url(r'^logout/', 'django.contrib.auth.views.logout', {
		'template_name': 'meshu/users/logout.html'
	}),

	# after successful signup/login we go here
	url(r'^user/profile/', direct_to_template, {
		'template': 'meshu/gallery/gallery.html'
	}),
)

urlpatterns += patterns('meshu.views',

	# meshu begin
	url(r'^$', 'index'),
	
	url(r'^make/$', 'make'),

	url(r'^shop/', 'shop'),

	url(r'^edit/(?P<item_id>\d+)', 'edit'),

	# after successful signup we run the create user view
	url(r'^user/create/', 'create_user'),

	# after successful meshu we create an item
	url(r'^item/create/', 'create_item'),
)
