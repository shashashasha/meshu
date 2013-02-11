from django.conf import settings
from django.template import RequestContext
from django.shortcuts import render_to_response, get_object_or_404

# user stuff
from django.contrib.auth.models import User

from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.utils import simplejson

# our models
from meshu.models import Meshu, MeshuImage, Order, UserProfile

import string, random

# this is how i get dates. 
from datetime import datetime


from meshu.views import *
from meshu.item import *

# not sure if this should go in views.py, but here for now. this is also why we need the previous import statement

def item_postcard(request, item_id):
	item = get_object_or_404(Meshu, pk=item_id)

	# don't let people 'shop' for other users items yet
	if request.user.is_staff == False:
		return notify(request, 'authorization_required')

	return item_handler(request, item_id, 'postcard.html', 'postcard')

def processing_postcard_front(request, order_id):
	order = get_object_or_404(Order, pk=order_id)

	return render_to_response('meshu/processing/postcard_front.html', {
		'meshu': order.meshu,
		'view': 'postcard'
	}, context_instance = RequestContext(request))

def processing_postcard_back(request, order_id):
	order = get_object_or_404(Order, pk=order_id)

	return render_to_response('meshu/processing/postcard_back.html', {
		'order': order
	}, context_instance=RequestContext(request))


def view_orders(request):
	if request.user.is_authenticated() == False or request.user.is_staff == False:
		return render_to_response('404.html', {}, context_instance=RequestContext(request))

	# get all orders that haven't been shipped or canceled
	orders = Order.objects.exclude(status='SH').exclude(status='CA')

	return render_to_response('meshu/processing/orders.html', {
			'orders': orders
	}, context_instance=RequestContext(request))

def view_orders_status(request, view_status):
	if request.user.is_authenticated() == False or request.user.is_staff == False:
		return render_to_response('404.html', {}, context_instance=RequestContext(request))

	# get all orders that match view_status
	orders = Order.objects.filter(status=view_status)

	return render_to_response('meshu/processing/shipped.html', {
		'status': view_status,	
		'orders': orders
	}, context_instance=RequestContext(request))


def view_orders_shipped(request):
	return view_orders_status(request, 'SH')


def view_orders_received(request):
	return view_orders_status(request, 'RE')

def view_orders_sent(request):
	return view_orders_status(request, 'SE')

def view_orders_canceled(request):
	return view_orders_status(request, 'CA')
	
	
def processing_order_update_status(request, order_id):
	if request.user.is_authenticated() == False or request.user.is_staff == False:
		return json_dump({})
		
	order = Order.objects.get(id=order_id)
	last_status = order.status

	if request.GET.has_key('postcard_ordered'):
		postcard_status = request.GET.get('postcard_ordered', '')
		order.postcard_ordered = postcard_status

	# don't send duplicate emails
	status = request.GET.get('status', '')
	if order.status != status:
		order.status = status
		order.tracking = request.GET.get('tracking', '')

		# update the ship date
		if order.status == 'SH':
			order.ship_date = datetime.now()

		order.save()

		if order.status == 'SE' or order.status == 'SH' or order.status == 'RE':
			mail_order_status_change(order.contact, order.meshu, order)
	
	# returning json now, the orders status updating is all ajax
	return json_dump({
		'success' : True,
		'order_id': order.id,
		'last_status' : last_status,
		'order_status': order.status
	})

def processing_order_postcard_toggle(request, order_id):
	if request.user.is_authenticated() == False or request.user.is_staff == False:
		return json_dump({})

	order = Order.objects.get(id=order_id)

	if order.postcard_ordered == 'true':
		order.postcard_ordered = 'false'
	else:
		order.postcard_ordered = 'true'
	
	order.save()

	# returning json now, the orders status updating is all ajax
	return json_dump({
		'success' : True,
		'order_id': order.id,
		'postcard_ordered': order.postcard_ordered
	})

def view_addresses(request): 
	if request.user.is_authenticated() == False or request.user.is_staff == False:
		return render_to_response('404.html', {}, context_instance=RequestContext(request))

	# get all orders that haven't been shipped
	orders = Order.objects.exclude(status='SH')

	return render_to_response('meshu/processing/order_shipping_export.html', {
			'orders': orders
	}, context_instance=RequestContext(request))

def view_notes(request): 
	if request.user.is_authenticated() == False or request.user.is_staff == False:
		return render_to_response('404.html', {}, context_instance=RequestContext(request))

	# get all orders that have notes
	orders = Order.objects.exclude(postcard_note='')

	return render_to_response('meshu/processing/notes.html', {
			'orders': orders,
	}, context_instance=RequestContext(request))

def view_all(request):
	meshus = Meshu.objects.all()

	return render_to_response('meshu/processing/allview.html', {
		'meshus': meshus
	}, context_instance=RequestContext(request))
