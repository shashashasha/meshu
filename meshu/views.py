from django.conf import settings
from django.template import RequestContext
from django.shortcuts import render_to_response, get_object_or_404

# user stuff
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
import uuid

from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.utils import simplejson

# for emailing html
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

# our models
from meshu.models import *
from meshu.email import *

import string, random

# this is how i get dates.
from datetime import datetime

# got to get paid.
import stripe

# not sure why i can't do cart.models import Cart
from cart import Cart

# YAY!
import sha

#
# The views for our Meshu app
#

# hashed codes
codes = []
amounts = []

# util function
def json_dump(json):
	return HttpResponse(simplejson.dumps(json), mimetype='application/javascript')

# grab the current user profile, if a user is logged in,
# otherwise grabs guest profile, for saving interim meshus
def current_profile(request):
	if request.user.is_authenticated():
		return request.user.get_profile()
	else:
		return UserProfile.objects.get(user__username='guest')


def notify(request, view):
	return render_to_response('meshu/notification/base_notification.html', {
		'view' : view
	}, context_instance=RequestContext(request))

#
# Ordering!
#

def cart_add(request):
	# check if we have location data, otherwise we 404
	# to protect against malicious requests
	loc_check = request.POST.get('location_data', 'blank')
	if loc_check == 'blank' or loc_check == '':
		raise Http404

	profile = current_profile(request)
	meshu = meshu_get_or_create(request, profile)

	order = order_create(request, profile, meshu)

	current_cart = Cart(request)
	current_cart.add(order, order.amount, 1)

	return json_dump({ 'success' : 'true', 'order': order.id, 'amount': order.amount })

def cart_add_and_checkout(request, item_id):
	order_add_to_cart(request, item_id)
	return order_checkout(request)

def cart_update(request, item_id, quantity):
	order = Order.objects.get(id=item_id)
	current_cart = Cart(request)
	current_cart.update(order, int(quantity))
	return json_dump({
		'success' : 'true',
		'order': order.id,
		'amount': order.amount,
		'quantity': quantity
	})

def cart_remove(request, item_id):
	current_cart = Cart(request)
	order = get_object_or_404(Order, pk=item_id)
	current_cart.remove(order)
	return json_dump({ 'success' : 'true' })

def cart_checkout(request):
	current_cart = Cart(request)
	items = current_cart.cart.item_set.all()

	return render_to_response('meshu/cart/cart.html', {
			'items' : items
	}, context_instance=RequestContext(request))

def cart_empty(request):
	current_cart = Cart(request)

	items = current_cart.cart.item_set.all()

	for item in items:
		current_cart.remove(item.product)

	return render_to_response('meshu/cart/cart.html', {
			'items' : items
	}, context_instance=RequestContext(request))

# verify_coupon has to be an xhr request, we don't want to refresh the page
def order_verify_coupon(request):
	coupon = request.GET.get('code', '').upper()

	hashed = sha.new(coupon).hexdigest()

	matched = hashed in codes

	response_dict = { 'success' : matched }

	if matched:
		index = codes.index(hashed)
		coupon_amount = amounts[index]
		response_dict.update({ 'amount' : coupon_amount })

	return json_dump(response_dict)

# to replace the old meshu_new and order_meshu functions
def submit_orders(request):
	items = current_cart.cart.item_set.all()

	email = profile.user.email
	desc = str(email) + ", " + len(items)

	# set your secret key: remember to change this to your live secret key in production
	# see your keys here https://manage.stripe.com/account
	stripe.api_key = "oE92kq5OZuv3cwdBoGqkeLqB45PjKOym" # key the binx gave

	# get the credit card details submitted by the form
	# token = request.POST['stripeToken']

	# create the charge on Stripe's servers - this will charge the user's card
	# charge = stripe.Charge.create(
	#     amount=int(float(request.POST.get('amount', 0.0))), # amount in cents, again
	#     currency="usd",
	#     card=token,
	#     description=desc
	# )

	# store the shipping address information
	shipping = ShippingInfo()
	shipping.shipping_name = request.POST['shipping_name']
	shipping.shipping_address = request.POST['shipping_address']
	shipping.shipping_address_2 = request.POST['shipping_address_2']
	shipping.shipping_city = request.POST['shipping_city']
	shipping.shipping_zip = request.POST['shipping_zip']
	shipping.shipping_region = request.POST['shipping_region']
	shipping.shipping_state = request.POST['shipping_state']
	shipping.shipping_country = request.POST['shipping_country']

	if request.user.is_authenticated() == False:
		shipping.contact = request.POST.get('shipping_contact', '')
	else:
		shipping.contact = profile.user.email

	shipping.save()

	orders = []
	for item in items:
		order = item.product
		order.shipping = shipping
		order.status = 'OR'

		# save this order
		order.save()
		orders.append(order)

		# send a mail to ifttt that creates an svg in our dropbox for processing
		mail_ordered_svg(order)

	# mail the current user if they're logged in
	if (len(orders) == 1)
		mail_order_confirmation(shipping.contact, orders[0].meshu, order)
		return render_to_response('meshu/notification/ordered.html', {
				'view' : 'paid',
				'order': order,
				'meshu': meshu
		}, context_instance=RequestContext(request))
	elif (len(orders) > 1)
		mail_multiple_order_confirmation(shipping.contact, order)
		return render_to_response('meshu/notification/ordered_multiple.html', {
				'view' : 'paid',
				'orders': orders
		}, context_instance=RequestContext(request))


def order_meshu(request, item_id):
	# check if we have location data, otherwise we 404
	# to protect against malicious requests
	loc_check = request.POST.get('location_data', 'blank')
	if loc_check == 'blank' or loc_check == '':
		raise Http404

	# gets logged in user profile, or anonymous profile
	profile = current_profile(request)

	item_id = request.POST.get('meshu_id', item_id)

	# get existing meshu
	meshu = get_object_or_404(Meshu, pk=item_id)

	return make_order(request, profile, meshu)

# ordering a new meshu
def order_new(request):
	# check if we have location data, otherwise we 404
	# to protect against malicious requests
	loc_check = request.POST.get('location_data', 'blank')
	if loc_check == 'blank' or loc_check == '':
		raise Http404

	# gets logged in user profile, or anonymous profile
	profile = current_profile(request)

	# create a new meshu
	# add logic later if it's not new, ie readymade
	meshu = meshu_get_or_create(request, profile)

	return make_order(request, profile, meshu)


def make_order(request, profile, meshu):
	# set your secret key: remember to change this to your live secret key in production
	# see your keys here https://manage.stripe.com/account
	stripe.api_key = "oE92kq5OZuv3cwdBoGqkeLqB45PjKOym" # key the binx gave

	# get the credit card details submitted by the form
	# token = request.POST['stripeToken']
	email = profile.user.email
	desc = str(email) + ", meshu id " + str(meshu.id)

	# create the charge on Stripe's servers - this will charge the user's card
	# charge = stripe.Charge.create(
	#     amount=int(float(request.POST.get('amount', 0.0))), # amount in cents, again
	#     currency="usd",
	#     card=token,
	#     description=desc
	# )

	# create a new order
	# every order is new
	order = order_create(request, profile, meshu)

	# store the shipping address information
	shipping = ShippingInfo()
	shipping.shipping_name = request.POST['shipping_name']
	shipping.shipping_address = request.POST['shipping_address']
	shipping.shipping_address_2 = request.POST['shipping_address_2']
	shipping.shipping_city = request.POST['shipping_city']
	shipping.shipping_zip = request.POST['shipping_zip']
	shipping.shipping_region = request.POST['shipping_region']
	shipping.shipping_state = request.POST['shipping_state']
	shipping.shipping_country = request.POST['shipping_country']

	if request.user.is_authenticated() == False:
		shipping.contact = request.POST.get('shipping_contact', '')
	else:
		shipping.contact = profile.user.email

	shipping.save()

	order.shipping = shipping
	order.save()

	# mail the current user if they're logged in
	if request.user.is_authenticated():
		mail_order_confirmation(email, meshu, order)

	# send a mail to ifttt that creates an svg in our dropbox for processing
	mail_ordered_svg(order)

	return render_to_response('meshu/notification/ordered.html', {
			'view' : 'paid',
			'order': order,
			'meshu': meshu
	}, context_instance=RequestContext(request))

#
# creating or updating model functions, saves them to databases
#
def meshu_update(request, meshu):
	meshu.title = request.POST.get('title', meshu.title)
	meshu.description = request.POST.get('description', meshu.description)

	meshu.location_data = request.POST.get('location_data', meshu.location_data)
	meshu.svg = request.POST.get('svg', meshu.svg)
	meshu.theta = request.POST.get('theta', meshu.theta)

	meshu.renderer = request.POST.get('renderer', meshu.renderer)
	meshu.metadata = request.POST.get('metadata', meshu.metadata)

	meshu.promo = request.POST.get('promo', meshu.promo)
	return meshu

def meshu_get_or_create(request, profile):
	if request.POST.has_key('id') and request.POST['id'] != 'None':
		meshu_id = int(request.POST['id'])
		meshu = get_object_or_404(Meshu, pk=meshu_id)
	elif request.POST.has_key('meshu_id') and request.POST['meshu_id'] != 'None':
		meshu_id = int(request.POST['meshu_id'])
		meshu = get_object_or_404(Meshu, pk=meshu_id) # Meshu.objects.get(id=meshu_id)
	else:
		meshu = Meshu()
		meshu.user_profile = profile

	# use our existing update function, less repetitive
	meshu = meshu_update(request, meshu)

	# wtf dawg
	theta = request.POST.get('theta', 0.0)
	if theta:
		meshu.theta = int(float(theta))

	meshu.save()
	return meshu

def meshu_xhr_response(meshu):
	return json_dump({
		'success': True,
		'meshu_id': meshu.id,
		'meshu_url': meshu.get_absolute_url()
	})

def meshu_delete(request, item_id):
	meshu = Meshu.objects.get(id=item_id)
	meshu.delete()
	return meshu

def order_create(request, profile, meshu):
	order = Order()

	# set the meshu materials, *required*
	order.material = request.POST['material']
	order.color = request.POST['color']
	order.product = request.POST['product']

	order.coupon = request.POST.get('coupon', '')

	# stripe uses cents
	amount = float(request.POST.get('amount', '0.0')) / 100.0
	order.amount = str(amount)

	# set the status to ORDERED
	order.status = 'OR'

	# postcard note
	order.postcard_note = request.POST.get('postcard_note', '')

	# foreign keys
	order.user_profile = profile
	order.meshu = meshu

	order.save()
	return order


# don't judge me, i think this is funny
def random_password(length):
	phrases = ['me', 'mi', 'ma', 'mu', 'shu', 'ki', 'ku', 'shi', 'wa', 'do', 'ka', 'de', 'sa', 'su', 'ji']
	numbers = string.digits

	password = ''

	for i in range(length):
		randid = random.randint(0, 14)
		password += phrases[randid]

	for j in range(3):
		randid = random.randint(0, 9)
		password += numbers[randid]

	return password
