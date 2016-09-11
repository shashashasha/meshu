from django.conf.urls.defaults import *
from django.conf import settings
from django.views.generic.simple import direct_to_template

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

from django import shortcuts
from django.http import HttpResponse

# separate these patterns because they don't use the polls.views prefix
urlpatterns = patterns('',
	# robots.txt
	(r'^robots\.txt$', lambda r: HttpResponse("User-agent: *\nDisallow: /view/4e6f6e65*\nDisallow: /edit/4e6f6e65*", mimetype="text/plain")),
	(r'^favicon\.ico$', 'django.views.generic.simple.redirect_to', {'url': '/static/images/icons/favicon.ico'}),

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

# meshu item functions, manipulating things
urlpatterns += patterns('meshu.item',
	url(r'^make/template/(?P<item_encoded>\d+)/to_png', 'processing_dataurl_to_image'),
	url(r'^make/template/(?P<item_encoded>\d+)', 'item_from_preset'),

	# begin ordering an existing user meshu
	url(r'^make/(?P<item_encoded>\d+)/to_png', 'item_topng'),
	url(r'^make/(?P<item_encoded>\d+)/', 'item_begin_order'),


	url(r'^make/to_png', 'processing_dataurl_to_image'),
	url(r'^make/data/to_png', 'processing_dataurl_to_image'),

	url(r'^make/geojson', 'item_from_geojson'),
	url(r'^make/data', 'item_from_data'),
	url(r'^make/create/', 'item_create'),
	url(r'^make/assign/', 'item_assign'),

	# save/new always creates a new meshu
	url(r'^edit/(?P<item_encoded>\d+)/save', 'item_save'),
	url(r'^edit/(?P<item_encoded>\d+)/update', 'item_update'),

	# edit an existing user meshu
	url(r'^edit/(?P<item_encoded>\d+)', 'item_edit'),

	# display
	url(r'^view/(?P<item_encoded>\w+)/to_png', 'item_topng'),
	url(r'^view/(?P<item_encoded>\w+)', 'item_display'),

	# users own meshus
	url(r'^user/(?P<item_encoded>\d+)/save', 'item_save'),
	# url(r'^user/(?P<item_encoded>\d+)/delete', 'item_delete'),
)

urlpatterns += patterns('meshu.views',

	# meshu begin
	url(r'^$', 'base_view', {
		'template': 'meshu/index.html'
	}),

	# cart operations

	url(r'^cart/update/(?P<order_id>\d+)/(?P<quantity>\d+)', 'cart_update'),
	url(r'^cart/remove/(?P<order_id>\d+)', 'cart_remove'),
	url(r'^cart/checkout', 'cart_checkout'),
	url(r'^cart/empty', 'cart_empty'),
	url(r'^cart/view', 'cart_view'),
	url(r'^cart/add/', 'cart_add'),

	url(r'^order/apply_coupon', 'order_verify_coupon'),

	# new order function, buys everythng in the cart
	url(r'^order/', 'submit_orders'),

	# gallery of meshus
	url(r'^gallery/', 'base_view', {
		'template': 'meshu/base_gallery.html'
	}),

	# about page
	url(r'^about/', 'base_view', {
		'template': 'meshu/base_about.html'
	}),

	# radial road test
	url(r'^radial/', 'base_view', {
		'template': 'meshu/item/radial.html'
	}),

	##
	##	base make pages
	##
	url(r'^make/foursquare', 'base_view', {
		'template': 'meshu/gallery/foursquare_auth_completed.html'
	}),

	url(r'^make/facebook', 'base_view', {
		'template': 'meshu/gallery/facebook_auth.html'
	}),

	url(r'^make/facet', 'base_view', {
		'template': 'meshu/item/item.html'
	}),
	url(r'^make/orbit', 'base_view', {
		'template': 'meshu/item/circle.html'
	}),
	url(r'^make/radial', 'base_view', {
		'template': 'meshu/item/radial.html'
	}),
	url(r'^make/arc', 'base_view', {
		'template': 'meshu/item/print.html'
	}),
	url(r'^make/streets', 'base_view', {
		'template': 'meshu/item/streets.html'
	}),

	# root way to begin making a meshu
	url(r'^make/', 'base_view', {
		'template': 'meshu/make_landing.html'
	}),

	# internal to see email templates
	url(r'^email/(?P<template>\w+)', 'mail_viewer'),
)

# meshu/accounts.py
urlpatterns += patterns('meshu.accounts',
	url(r'^user/login/', 'user_login'),
	# fb
    url(r'^user/facebook/inline_login/', 'user_facebook_login'),
	url(r'^user/logout/', 'user_logout'),
	# after successful signup we run the create user view
	url(r'^user/create/', 'user_create'),

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
)

# meshu/processing.py
urlpatterns += patterns('meshu.pipeline',
	url(r'^orders/processing/postcard/front/(?P<order_id>\d+)', 'processing_postcard_front'),
	url(r'^orders/processing/postcard/back/(?P<order_id>\d+)', 'processing_postcard_back'),

	url(r'^orders/processing/print/(?P<order_id>\d+)', 'processing_print'),

	# backend for our orders
	url(r'^orders/(?P<order_id>\d+)/update/', 'processing_order_update_status'),
	url(r'^orders/(?P<order_id>\d+)/toggle_postcard/', 'processing_order_postcard_toggle'),


	url(r'^orders/postcard/(?P<item_id>\d+)', 'item_postcard'),

	# convenience views for different states
	url(r'^orders/shipped', 'view_orders_shipped'),
	url(r'^orders/received', 'view_orders_received'),
	url(r'^orders/sent', 'view_orders_sent'),
	url(r'^orders/ordered', 'view_orders_ordered'),
	url(r'^orders/canceled', 'view_orders_canceled'),

	url(r'^orders/addresses', 'view_addresses'),
	url(r'^orders/notes', 'view_notes'),
	url(r'^orders/all', 'view_all'),
	url(r'^orders/emails', 'view_emails'),
	url(r'^orders/', 'view_orders'),
)

# api proxies for loading external resources
urlpatterns += patterns('meshu.proxy',
	url(r'^proxy/tiles/(?P<subdomain>\w+)/(?P<zoom>\d+)/(?P<x>\d+)/(?P<y>\d+)', 'processing_tiles'),
	url(r'^proxy/geocoder/', 'processing_geocoder'),
	url(r'^proxy/router/', 'processing_router'),
	url(r'^proxy/jsoner/', 'processing_jsoner'),
)

# facebook specific
urlpatterns += patterns('facebook.views',
    url(r'^facebook/login$', 'login'),
    url(r'^facebook/authentication_callback', 'authentication_callback'),
)

if settings.DEBUG:
    urlpatterns += patterns('',
        url(r'^media/(?P<path>.*)$', 'django.views.static.serve', {
            'document_root': settings.MEDIA_ROOT,
        }),
   )
