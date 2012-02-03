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
		'template': 'meshu/user/signup.html'
	}),
	url(r'^login/', 'django.contrib.auth.views.login', {
		'template_name': 'meshu/user/login.html'
	}),
	url(r'^logout/', 'django.contrib.auth.views.logout', {
		'template_name': 'meshu/user/logout.html'
	}),
)

urlpatterns += patterns('meshu.views',

	# meshu begin
	url(r'^$', 'index'),
	
	# shopping for readymades
	url(r'^shop/(?P<item_id>\d+)', 'item_readymade'),
	url(r'^shop/', 'shop'),

	url(r'^make/', 'item_make'),
	
	url(r'^edit/(?P<item_id>\d+)', 'item_edit'),

	url(r'^view/(?P<item_id>\d+)', 'item_display'),

	# after successful meshu we create an item
	url(r'^item/create/', 'item_create'),

	url(r'^item/order/', 'order'),

	# after successful signup we run the create user view
	url(r'^user/create/', 'user_create'),

	# users own meshus
	url(r'^user/(?P<item_id>\d+)', 'item_view'),
	
	# after successful signup/login we go here
	url(r'^user/', 'user_profile'),

	# about page
	url(r'^about/', direct_to_template, {
		'template': 'meshu/base_about.html'
	}),
)
