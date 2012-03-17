from django.conf.urls.defaults import *
from django.views.generic.simple import direct_to_template

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

from django import shortcuts

# separate these patterns because they don't use the polls.views prefix
urlpatterns = patterns('',

	# Uncomment the admin/doc line below to enable admin documentation:
	url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

	# Uncomment the next line to enable the admin:
	url(r'^admin/', include(admin.site.urls)),

	# account stuff
	url(r'^signup/', direct_to_template, {
		'template': 'meshu/user/signup.html'
	}),

	url(r'^signin/', 'django.contrib.auth.views.login', {
		'template_name': 'meshu/user/login.html'
	}),

	url(r'^m/', include('shorturls.urls'))
)

urlpatterns += patterns('meshu.views',

	# meshu begin
	url(r'^$', 'index'),
	
	# begin ordering an existing user meshu
	url(r'^make/(?P<item_encoded>\d+)/', 'item_begin_order'),
	url(r'^make/foursquare', direct_to_template, {
		'template': 'meshu/gallery/foursquare_auth_completed.html'
	}),
	url(r'^make/create/', 'item_create'),
	# root way to begin making a meshu
	url(r'^make/', 'item_make'),
	
	# save/new always creates a new meshu
	url(r'^edit/(?P<item_encoded>\d+)/save', 'item_save'),
	url(r'^edit/(?P<item_encoded>\d+)/update', 'item_update'),

	# edit an existing user meshu
	url(r'^edit/(?P<item_encoded>\d+)', 'item_edit'),

	# display
	url(r'^view/(?P<item_encoded>\w+)', 'item_display'),

	url(r'^user/login/', 'user_login'),
	url(r'^user/logout/', 'user_logout'),
	# after successful signup we run the create user view
	url(r'^user/create/', 'user_create'),

	# users own meshus
	url(r'^user/(?P<item_encoded>\d+)/save', 'item_save'),
	# url(r'^user/(?P<item_encoded>\d+)/delete', 'item_delete'),

	# user profile
	url(r'^user/forgot', direct_to_template, {
		'template': 'meshu/user/forgot.html'
	}),
	url(r'^user/reset', direct_to_template, {
		'template': 'meshu/user/change.html'
	}),
	url(r'^user/password/reset', 'user_forgot_password'),
	url(r'^user/password/change', 'user_change_password'),
	url(r'^user/', 'user_profile'),


	# order an existing meshu
	url(r'^order/apply_coupon', 'order_verify_coupon'),
	url(r'^order/(?P<item_id>\d+)', 'order_meshu'),
	# order a new meshu, not saved yet
	url(r'^order/', 'order_new'),

	# shopping for readymades
	url(r'^shop/(?P<item_id>\d+)', 'item_readymade'),
	url(r'^shop/', 'shop'),

	url(r'^invite/', 'invite'),

	# about page
	url(r'^about/', direct_to_template, {
		'template': 'meshu/base_about.html'
	}),

	# backend for our orders
	url(r'^orders/(?P<order_id>\d+)/update/', 'processing_order_update_status'),
	url(r'^orders/', 'processing_orders'),

	# internal to see email templates
	url(r'^email/(?P<template>\w+)', 'mail_viewer'),
)