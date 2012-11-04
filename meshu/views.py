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
from meshu.models import Meshu, MeshuImage, Order, UserProfile

import string, random

# this is how i get dates. 
from datetime import datetime

# got to get paid.
import stripe

# YAY!
import sha

#
# The views for our Meshu app
#

# hashed codes
codes = ['5976bfc9a4dce7b1c50a537a9c18f76d0bc5fc46', 'a058609e29ab93bc9bf43ff86575d96e14e7caa0', '344ad3cafaee08927ce5ac4b6922ddd6a78f0313', 'bbf5865f40e0701ee165f953ca455909b21db589']
amounts = [25, .85, .85, .79]

# util function
def json_dump(json):
	return HttpResponse(simplejson.dumps(json), mimetype='application/javascript')

# meshu.views.index
def index(request):
	# no more invite code to enter
	return render_to_response('meshu/index.html', {}, context_instance=RequestContext(request))

def invite(request):
	code = request.POST.get('code', '')

	hashed = sha.new(code).hexdigest()

	# if you found this, you're trying too hard
	if hashed == invite_code:
		return render_to_response('meshu/invited.html', {}, context_instance=RequestContext(request))
	else:
		return notify(request, 'invite_failed')


def mail_viewer(request, template):
	profile = current_profile(request)

	orders = Order.objects.filter(user_profile=profile)

	order = orders[0]
	meshu = order.meshu

	return render_to_response('meshu/email/' + template + '.html', {
			'profile' : profile,
			'meshu' : meshu,
			'order' : order
 	}, context_instance=RequestContext(request))


def mail_order_confirmation(email, meshu, order):
	mail_template('meshu/email/order_confirmation.html', {
		'subject' : 'Order Confirmation: ' + meshu.title,
		'from' : 'orders@meshu.io',
		'to': email,
		'meshu': meshu,
		'order': order
	})

	if (meshu.promo == 'marathon'):
		mail_template('meshu/email/order_confirmation.html', {
			'subject' : 'Order Confirmation: ' + meshu.title,
			'from' : 'orders@meshu.io',
			'to': 'area@royalparksfoundation.org',
			'meshu': meshu,
			'order': order
		})
		mail_template('meshu/email/order_confirmation.html', {
			'subject' : 'Order Confirmation: ' + meshu.title,
			'from' : 'orders@meshu.io',
			'to': 'sbarney@royalparksfoundation.org',
			'meshu': meshu,
			'order': order
		})
	return

def mail_order_status_change(email, meshu, order):

	if order.status == 'SH':
		subject = 'Your order, "' + meshu.title + '" has been shipped!'
		template = 'order_shipped'
	elif order.status == 'SE':
		subject = 'Your order, "' + meshu.title + '" has been sent to the fabricator!'
		template = 'order_sent_to_fabricator'

	# only send an email if it's been Shipped or Sent to the fabricator
	if order.status == 'SH' or order.status == 'SE':
		mail_template('meshu/email/' + template + '.html', {
			'subject' : subject,
			'from' : 'orders@meshu.io',
			'to': email,
			'meshu': meshu,
			'order': order
		})

	return

def mail_forgotten_password(email, password):
	# subject, from_email, to = 'Your password has been reset', 'accounts@meshu.io', email

	mail_template('meshu/email/reset_password.html', {
		'subject' : 'Your password has been reset',
		'from' : 'accounts@meshu.io',
		'to': email,
		'password': password
	})
	return

# mails ordered svg to an ifttt routine 
# that puts it in our dropbox queue for sending to the manufacturer
def mail_ordered_svg(order):
	# has to be my email because ifttt is expecting that
	from_email = 'shashashasha@gmail.com'
	to_email = 'trigger@ifttt.com'
	msg = EmailMultiAlternatives(order.get_svg_filename(), order.meshu.svg, from_email, [to_email])
	msg.send()
	return

def mail_template(template, arguments):

	html_content = render_to_string(template, arguments)
	text_content = strip_tags(html_content)
	
	# create the email, and attach the HTML version as well.
	subject = arguments['subject']
	from_email = arguments['from']
	to_email = arguments['to']

	msg = EmailMultiAlternatives(arguments['subject'], text_content, from_email, [to_email])
	msg.attach_alternative(html_content, "text/html")
	msg.send()
	return

def notify(request, view):
	return render_to_response('meshu/notification/base_notification.html', {
		'view' : view
	}, context_instance=RequestContext(request))

#
# Ordering!
#

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
	token = request.POST['stripeToken']
	email = profile.user.email
	desc = str(email) + ", meshu id " + str(meshu.id)

	# create the charge on Stripe's servers - this will charge the user's card
	charge = stripe.Charge.create(
	    amount=int(float(request.POST.get('amount', 0.0))), # amount in cents, again
	    currency="usd",
	    card=token,
	    description=desc
	)

	# create a new order
	# every order is new
	order = order_create(request, profile, meshu)

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
# helper functions, ie functions that don't render views
#

# grab the current user profile, if a user is logged in, 
# otherwise grabs guest profile, for saving interim meshus
def current_profile(request):
	if request.user.is_authenticated():
		return request.user.get_profile()
	else:
		return UserProfile.objects.get(user__username='guest')


#
# creating or updating model functions, saves them to databases
#
def meshu_update(request, meshu):
	meshu.title = request.POST.get('title', meshu.title)
	meshu.description = request.POST.get('description', meshu.description)

	meshu.location_data = request.POST.get('location_data', meshu.location_data)
	meshu.svg = request.POST.get('svg', meshu.svg)
	meshu.theta = request.POST.get('theta', meshu.theta)

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

	# store the shipping address information
	order.shipping_name = request.POST['shipping_name']
	order.shipping_address = request.POST['shipping_address']
	order.shipping_address_2 = request.POST['shipping_address_2']
	order.shipping_city = request.POST['shipping_city']
	order.shipping_zip = request.POST['shipping_zip']
	order.shipping_region = request.POST['shipping_region']
	order.shipping_state = request.POST['shipping_state']
	order.shipping_country = request.POST['shipping_country']

	# set the meshu materials
	order.material = request.POST['material']
	order.color = request.POST['color']
	order.product = request.POST['product']

	# stripe uses cents
	amount = float(request.POST.get('amount', '0.0')) / 100.0
	order.amount = str(amount)

	# set the status to ORDERED
	order.status = 'OR'

	if request.user.is_authenticated() == False:
		order.contact = request.POST.get('shipping_contact', '')
	else:
		order.contact = profile.user.email
	
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
