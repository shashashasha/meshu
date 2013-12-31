from django.conf import settings
from django.shortcuts import render, get_object_or_404

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

#for subscribing to mailchimp
from mailsnake import MailSnake

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
codes = ['e735f1df5b04eb0d66a0f80ab31b33e3add56e2b','3b118ae6e033f58901ef134ed06d7fa540e7d9ef','b4bd367940a9078df02a7b1898201bbc92c825ec','7f97765b7bec56b4df101cb2a5c6b094517ebd71']
amounts = [100, 75, 85, 50]

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
	return render(request, 'meshu/notification/base_notification.html', {
		'view' : view,
		'cart_count': Cart(request).count()
	})

def base_view(request, template):
	return render(request, template, {
		'cart_count': Cart(request).count()
	})

#
# Ordering!
#

def cart_add(request):
	# check if we have location data, otherwise we 404
	# to protect against malicious requests
	loc_check = request.POST.get('location_data', 'blank')
	if loc_check == 'blank' or loc_check == '':
		print loc_check
		print request.POST
		raise Http404

	profile = current_profile(request)
	meshu = meshu_get_or_create(request, profile)

	order = order_create(request, profile, meshu)

	current_cart = Cart(request)
	current_cart.add(order, order.amount, 1)

	return HttpResponseRedirect("/cart/view")

def cart_update(request, order_id, quantity):
	order = Order.objects.get(id=order_id)
	current_cart = Cart(request)
	current_cart.update(order, int(quantity))

	return HttpResponseRedirect("/cart/view")

def cart_remove(request, order_id):
	current_cart = Cart(request)
	order = get_object_or_404(Order, pk=order_id)
	current_cart.remove(order)

	return HttpResponseRedirect("/cart/view")

def cart_view(request):
	current_cart = cart_assign(request)

	return render(request, 'meshu/cart/cart.html', {
		'cart' : current_cart,
		'cart_count' : current_cart.count()
	})

def cart_checkout(request):
	current_cart = cart_assign(request)

	return render(request, 'meshu/cart/checkout.html', {
		'cart' : current_cart,
		'cart_count' : current_cart.count()
	})

def cart_assign(request):
	current_cart = Cart(request)

	# only assign if the user is logged in
	if request.user.is_authenticated() is False:
		return current_cart

	# grab all items, for double checking
	items = current_cart.cart.item_set.all()

	profile = current_profile(request)

	for item in items:
		order = item.product
		order.user_profile = profile

		# only assign meshu user_profile if created as guest
		# allows for marathon type meshu's that the user doesn't 'own'
		if order.meshu.user_profile.user.username == 'guest':
			order.meshu.user_profile = profile
			order.meshu.save()

		order.save()

	return current_cart

def cart_empty(request):
	current_cart = Cart(request)
	current_cart.clear()

	return HttpResponseRedirect("/cart/view")

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
	# gets logged in user profile, or anonymous profile
	profile = current_profile(request)
	current_cart = Cart(request)

	# the cart has its own discount logic
	# plus we need to account for any user submitted coupons
	total_amount = current_cart.discount_applied() * 100
	discount_amount = current_cart.discount() * 100.0
	coupon_amount = float(request.POST.get('coupon_amount', 0.0))
	shipping_amount = float(request.POST.get('shipping_amount', 0.0))

	# actual amount to charge with stripe
	final_amount = total_amount - coupon_amount + shipping_amount

	print(str(current_cart.count()) + ' items')
	print('total ' + str(total_amount))
	print('coupon amount ' + str(coupon_amount))
	print('shipping amount ' + str(shipping_amount))
	print('final amount ' + str(final_amount))

	# grab email for reference in stripe
	if profile.user.username == 'guest':
		email = request.POST.get('email_address', '')
	else:
		email = profile.user.email

	# subscribing people to mailchimp
	if request.POST.get('email_checkbox','') and email != '':
		ms = MailSnake(settings.MAILCHIMP_KEY)
		lists = ms.lists()
		ms.listSubscribe(
		    id = lists['data'][0]['id'],
		    email_address = email,
		    update_existing = True,
		    double_optin = False,
		)

	# see your keys here https://manage.stripe.com/account
	stripe.api_key = settings.STRIPE_SECRET_KEY # key the binx gave
	stripe_desc = str(email) + ", " + str(current_cart.count()) + " meshus"

	print(stripe_desc)

	# get the credit card details submitted by the form
	token = request.POST['stripe_token']

	# create the charge on Stripe's servers - this will charge the user's card
	charge = stripe.Charge.create(
	    amount = int(final_amount), # amount in cents, again
	    currency = "usd",
	    card = token,
	    description = stripe_desc
	)

	# store the shipping address information
	shipping = ShippingInfo()
	shipping.contact = email
	shipping.shipping_name = request.POST['shipping_name']
	shipping.shipping_address = request.POST['shipping_address']
	shipping.shipping_address_2 = request.POST['shipping_address_2']
	shipping.shipping_city = request.POST['shipping_city']
	shipping.shipping_zip = request.POST['shipping_zip']
	shipping.shipping_region = request.POST['shipping_region']
	shipping.shipping_state = request.POST['shipping_state']
	shipping.shipping_country = request.POST['shipping_country']

	# save shipping separately now, not in Order
	shipping.amount = shipping_amount

	shipping.save()

	items = current_cart.cart.item_set.all()

	if current_cart.count() > 1:
		return submit_multiple(request, shipping, items, final_amount, discount_amount, coupon_amount)
	elif current_cart.count() == 1:
		return submit_single(request, shipping, items, final_amount, coupon_amount)

def submit_multiple(request, shipping, items, final_amount, discount_cents, coupon_cents):
	print('submit_multiple:', shipping.contact)

	discount_per = float(((discount_cents + coupon_cents) / Cart(request).count())/100.0)
	print('discount per:', discount_per)

	orders = []
	for item in items:
		order = item.product
		order.shipping = shipping
		order.status = 'OR'
		order.coupon = request.POST.get('coupon_code', '')

		# reduce the order amount by coupon / volume discounts
		order.amount = float(order.amount) - discount_per

		order.save()
		orders.append(order)

		# if there is more than one of this necklace/pendant/whatever,
		# spoof new orders of it. using this method here:
		# https://docs.djangoproject.com/en/1.4/topics/db/queries/#copying-model-instances
		if item.quantity > 1:
			for x in range(0, item.quantity-1):
				order.pk = None
				order.save()
				orders.append(order)

		# send a mail to ifttt that creates an svg in our dropbox for processing
		mail_ordered_svg(order)

	current_cart = Cart(request)
	current_cart.clear()

	mail_multiple_order_confirmation(shipping.contact, orders, final_amount)

	return render(request, 'meshu/notification/ordered_multiple.html', {
		'orders': orders,
		'view': 'paid'
	})

def submit_single(request, shipping, items, final_amount, coupon_amount):
	print('submit_single:', shipping.contact)

	item = items[0]
	order = item.product
	order.shipping = shipping
	order.status = 'OR'
	order.amount = float(order.amount) - (coupon_amount / 100.0);
	order.coupon = request.POST.get('coupon_code', '')

	order.save()

	mail_order_confirmation(shipping.contact, order.meshu, order)

	# send a mail to ifttt that creates an svg in our dropbox for processing
	mail_ordered_svg(order)

	current_cart = Cart(request)
	current_cart.clear()

	return render(request, 'meshu/notification/ordered.html', {
		'view': 'paid',
		'order': order,
		'meshu': order.meshu
	})

# create an Order object given a Meshu and UserProfile
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

	# AD = 'Added to Cart'
	order.status = 'AD'

	# postcard note
	order.postcard_note = request.POST.get('postcard_note', '')

	# ring sizes, special notes
	order.metadata = request.POST.get('order_metadata', '')

	# foreign keys
	order.user_profile = profile
	order.meshu = meshu

	order.save()
	return order

#
# creating or updating meshu functions, saves them to databases
#
def meshu_update(request, meshu):
	meshu.title = request.POST.get('title', meshu.title)
	meshu.description = request.POST.get('description', meshu.description)

	meshu.location_data = request.POST.get('location_data', meshu.location_data)
	meshu.svg = request.POST.get('svg', meshu.svg)
	meshu.theta = int(float(request.POST.get('theta', meshu.theta)))

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
	meshu.save()
	return meshu

def meshu_xhr_response(meshu):
	return json_dump({
		'success': True,
		'meshu_id': meshu.id,
		'meshu_url': meshu.get_absolute_url()
	})


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
