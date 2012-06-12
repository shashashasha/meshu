from django.template import RequestContext
from django.shortcuts import render_to_response, get_object_or_404

# user stuff
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
import uuid

from django.http import HttpResponse, HttpResponseRedirect
from django.utils import simplejson

# for emailing html
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

# our models
from meshu.models import Meshu, Order, UserProfile

import string
import random

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
codes = ['5976bfc9a4dce7b1c50a537a9c18f76d0bc5fc46', 'a058609e29ab93bc9bf43ff86575d96e14e7caa0']
amounts = [25, .85]
invite_code = '241b1e96d1666f7d38ff6ffe155f0e563bb294c3'

# meshu.views.index
def index(request):
	# no more invite code to enter
	return render_to_response('meshu/index.html', {}, context_instance=RequestContext(request))

# meshu.views.shop
def shop(request):
	# assume username = shop is all our admin created readymades
	meshus = Meshu.objects.filter(user_profile__user__username='shop')

	return render_to_response('meshu/gallery/gallery.html', {
		"meshus": meshus,
		"view": 'shop',
	}, context_instance=RequestContext(request))

def invite(request):
	code = request.POST.get('code', '')

	hashed = sha.new(code).hexdigest()

	# if you found this, you're trying too hard
	if hashed == invite_code:
		return render_to_response('meshu/invited.html', {}, context_instance=RequestContext(request))
	else:
		return notify(request, 'invite_failed')

#
# Views for Items
#

# meshu.views.make
def item_make(request):
	return render_to_response('meshu/item/item.html', {
			'view' : 'edit'
		}, context_instance=RequestContext(request))

def item_begin_order(request, item_encoded):
	item_id = int(str(item_encoded).decode("hex"))
	item = get_object_or_404(Meshu, pk=item_id)

	# check user id
	if request.user.id != item.user_profile.user.id:
		return notify(request, 'authorization_required')

	return item_handler(request, item_id, 'usermade.html', 'product')

def item_edit(request, item_encoded):
	item_id = int(str(item_encoded).decode("hex"))
	item = get_object_or_404(Meshu, pk=item_id)

	# check user id
	if request.user.id != item.user_profile.user.id:
		return notify(request, 'authorization_required')

	return item_handler(request, item_id, 'usermade.html', 'edit')

def item_display(request, item_encoded):
	item_id = int(str(item_encoded).decode("hex"))
	return item_handler(request, item_id, 'display.html', 'view')

def item_postcard(request, item_id):
	item = get_object_or_404(Meshu, pk=item_id)

	# don't let people 'shop' for other users items yet
	if request.user.is_staff == False:
		return notify(request, 'authorization_required')

	return item_handler(request, item_id, 'postcard.html', 'postcard')

def item_readymade(request, item_id):
	item = get_object_or_404(Meshu, pk=item_id)

	# don't let people 'shop' for other users items yet
	if item.user_profile.user.username != 'shop':
		return notify(request, 'authorization_required')

	return item_handler(request, item_id, 'readymade.html', 'readymade')

def item_delete(request, item_id):
	# item_permissions(request, item_id)

	meshu = meshu_delete(request, item_id)
	return notify(request, 'meshu_deleted')

# generalized handler for all our item pages
def item_handler(request, item_id, template, view):
	item = get_object_or_404(Meshu, pk=item_id)
	return render_to_response('meshu/item/' + template, {
			'meshu': item,
			'view': view
		}, context_instance = RequestContext(request))

def item_from_data(request):

	if request.POST.has_key('location_data') == False or request.POST.has_key('location_data') == False:
		return render_to_response('404.html', {}, context_instance=RequestContext(request))

	meshu = Meshu()

	meshu.title = request.POST.get('title', 'My Meshu')
	meshu.description = request.POST.get('description', '')

	# meshu data
	meshu.location_data = request.POST['location_data']	
	meshu.svg = request.POST['svg']

	# wtf dawg
	meshu.theta = int(float(request.POST.get('theta', '0.0')))

	return render_to_response('meshu/item/item.html', {
		'meshu': meshu,
		'view': 'edit'
	}, context_instance = RequestContext(request))

def item_create(request):
	xhr = request.POST.has_key('xhr')

	profile = current_profile(request)

	meshu = meshu_get_or_create(request, profile)

	if xhr:
		return meshu_xhr_response(meshu)

	return HttpResponseRedirect('/view/' + meshu.get_encoded_id() + '/')
	return item_handler(request, meshu.id, 'display.html', 'view')

def item_update(request, item_encoded):
	xhr = request.GET.has_key('xhr')

	item_id = int(str(item_encoded).decode("hex"))
	old = Meshu.objects.get(id=item_id)

	old = meshu_update(request, old)
	old.save()

	if xhr:
		return meshu_xhr_response(old)

	return item_handler(request, item_id, 'display.html', 'view')

def item_save(request, item_encoded):
	xhr = request.GET.has_key('xhr')

	item_id = int(str(item_encoded).decode("hex"))
	old = Meshu.objects.get(id=item_id)

	meshu = Meshu()
	meshu.user_profile = old.user_profile
	meshu = meshu_update(request, meshu)
	meshu.save()

	if xhr:
		return meshu_xhr_response(meshu)

	return item_handler(request, item_id, 'display.html', 'view')

#
# Views for Users
#
def user_login(request, *args, **kwargs):
	email = request.POST['email']

	try:
		dupes = User.objects.filter(email=email)
		if len(dupes) > 1:
			return user_duplicate_error(request)
	except User.DoesNotExist:
		pass

	user = authenticate(username=email, password=request.POST['password'])
	if user is not None:
		if user.is_active:
			response = login(request, user)
			return user_login_success(request, user)
		else:
			return user_login_error(request, user)
	else:
	    return user_login_error(request, user)

def user_login_success(request, user):
	xhr = request.POST.has_key('xhr')

	profile = user.get_profile()
	meshus = Meshu.objects.filter(user_profile=profile)

	if xhr:
		response_dict = {}
		response_dict.update({ 'success' : True })
		response_dict.update({ 'username' : user.username })
		response_dict.update({ 'meshus' : meshus.count() })
		return HttpResponse(simplejson.dumps(response_dict), mimetype='application/javascript')
	else:
		return render_to_response('meshu/gallery/gallery.html', {
				'view' : 'user',
				'profile' : profile,
				'meshus': meshus
		}, context_instance=RequestContext(request))

def user_login_error(request, user):
	xhr = request.POST.has_key('xhr')

	if xhr:
		response_dict = {}
		response_dict.update({ 'success' : False })
		return HttpResponse(simplejson.dumps(response_dict), mimetype='application/javascript')
	else:
		return notify(request, 'login_error')

def user_duplicate_error(request):
	xhr = request.POST.has_key('xhr')

	if xhr:
		response_dict = {}
		response_dict.update({ 'success' : False })
		response_dict.update({ 'duplicate' : True })
		return HttpResponse(simplejson.dumps(response_dict), mimetype='application/javascript')
	else:
		return notify(request, 'login_error')

def user_logout(request, *args, **kwargs):
	xhr = request.GET.has_key('xhr')
	response = logout(request)

	if xhr:
		response_dict = {}
		response_dict.update({ 'success' : True })
		return HttpResponse(simplejson.dumps(response_dict), mimetype='application/javascript')

	return notify(request, request.GET['xhr'])

def user_create(request):
	username = uuid.uuid4().hex[:30]

	email = request.POST['email']
	password = request.POST['password']

	# check if we have someone with the same username	
	try:
		while True:
			User.objects.get(username=username)
			username = uuid.uuid4().hex[:30]
	except User.DoesNotExist:
		pass

	# check if we have someone with the same email
	try:
		dupes = User.objects.filter(email=email)
		if len(dupes) > 0:
			return user_duplicate_error(request)
	except User.DoesNotExist:
		pass


	# create user shortcut
	user = User.objects.create_user(username, email, password)

	user.is_staff = False
	user.save()

	# if it's an ajax request, assume you want to log in immediately
	xhr = request.POST.has_key('xhr')
	if xhr:
		return user_login(request)
	else:
		return notify('signedup')

def user_profile(request):
	# show all meshus belonging to the current user
	profile = current_profile(request)

	if request.user.is_authenticated() == False:
		return notify(request, 'authorization_required')

	meshus = Meshu.objects.filter(user_profile=profile)

	return render_to_response('meshu/gallery/gallery.html', {
			'view' : 'user',
			'profile' : profile,
			'meshus': meshus
	}, context_instance=RequestContext(request))

def user_forgot_password(request):
	profile = current_profile(request)

	email = request.POST.get('email', 'noemail')
	response_dict = {}

	try:
		user = User.objects.get(email=email)
	except User.DoesNotExist:
		response_dict.update({ 'message' : 'User with that email does not exist' })
		return HttpResponse(simplejson.dumps(response_dict), mimetype='application/javascript')

	if user.username == 'shop':
		response_dict.update({ 'message' : "You can't reset your password this way" })
		return HttpResponse(simplejson.dumps(response_dict), mimetype='application/javascript')

	password = random_password(4)

	user.set_password(password)

	user.save()

	# mail the user the reset password
	mail_forgotten_password(user.email, password)

	return notify(request, 'password_reset')

def user_change_password(request):
	user = authenticate(username=request.POST['email'], password=request.POST['password'])

	if user is not None:
		if user.is_active:
			response = login(request, user)

			# update password
			if request.POST['new_password'] != '':
				new_pass = request.POST['new_password']
				user.set_password(new_pass)
				user.save()

			return notify(request, 'password_reset_success')
		else:
			return user_login_error(request, user)
	else:
	    return user_login_error(request, user)



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

	response_dict = {}
	response_dict.update({ 'success' : matched })

	if matched:
		amount = amounts[codes.index(hashed)]
		response_dict.update({ 'amount' : amount })

	return HttpResponse(simplejson.dumps(response_dict), mimetype='application/javascript')

def order_meshu(request, item_id):
	# gets logged in user profile, or anonymous profile
	profile = current_profile(request)

	item_id = request.POST.get('meshu_id', item_id)
	
	# get existing meshu
	meshu = Meshu.objects.get(id=item_id)

	return make_order(request, profile, meshu)

# ordering a new meshu
def order_new(request):
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

	# create the charge on Stripe's servers - this will charge the user's card
	charge = stripe.Charge.create(
	    amount=int(float(request.POST.get('amount', '0.0'))), # amount in cents, again
	    currency="usd",
	    card=token,
	    description="hi@meshu.io"
	)

	# create a new order
	# every order is new
	order = order_create(request, profile, meshu)

	# mail the current user if they're logged in
	if request.user.is_authenticated():
		mail_order_confirmation(profile.user.email, meshu, order)

	return render_to_response('meshu/notification/ordered.html', {
			'view' : 'paid',
			'order': order,
			'meshu': meshu
	}, context_instance=RequestContext(request))

#
# helper functions, ie functions that don't render views
#

# grab the current user profile, if a user is logged in, 
# otherwise grabs anonymous profile
def current_profile(request):
	if request.user.is_authenticated():
		return request.user.get_profile()
	else:
		return UserProfile.objects.get(user__username='shop')


#
# creating or updating model functions, saves them to databases
#
def meshu_update(request, meshu):
	meshu.title = request.GET.get('title', meshu.title)
	meshu.description = request.GET.get('description', meshu.description)

	meshu.location_data = request.GET.get('location_data', meshu.location_data)
	meshu.svg = request.GET.get('svg', meshu.svg)
	meshu.theta = request.GET.get('theta', meshu.theta)
	return meshu

def meshu_get_or_create(request, profile):
	has_id = request.POST.has_key('id')

	if has_id:
		meshu_id = int(request.POST['id'])
		meshu = Meshu.objects.get(id=meshu_id)
	else:
		meshu = Meshu()
		meshu.user_profile = profile

	meshu.title = request.POST.get('title', 'My Meshu')
	meshu.description = request.POST.get('description', '')

	# meshu data
	meshu.location_data = request.POST['location_data']	
	meshu.svg = request.POST['svg']

	# wtf dawg
	meshu.theta = int(float(request.POST.get('theta', '0.0')))

	meshu.save()
	return meshu


def meshu_xhr_response(meshu):
	response_dict = {}
	response_dict.update({ 'success' : True })
	response_dict.update({ 'meshu_id' : meshu.id })
	response_dict.update({ 'meshu_url' : meshu.get_absolute_url() })
	return HttpResponse(simplejson.dumps(response_dict), mimetype='application/javascript')


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

	# stripe uses cents, which makes none
	amount = float(request.POST.get('amount', '0.0')) / 100.0
	order.amount = str(amount)

	# set the status to ORDERED
	order.status = 'OR'

	if request.user.is_authenticated() == False:
		order.contact = request.POST.get('shipping_contact', '')
	else:
		order.contact = profile.user.email
	
	# foreign keys
	order.user_profile = profile
	order.meshu = meshu

	order.save()
	return order

# Processing Orders!
def processing_orders(request):
	if request.user.is_authenticated() == False or request.user.is_staff == False:
		return render_to_response('404.html', {}, context_instance=RequestContext(request))

	# get all orders that haven't been shipped
	orders = Order.objects.exclude(status='SH')
	orders_shipped = Order.objects.filter(status='SH')

	return render_to_response('meshu/processing/orders.html', {
			'orders': orders,
			'orders_shipped' : orders_shipped
	}, context_instance=RequestContext(request))

def processing_order_update_status(request, order_id):
	order = Order.objects.get(id=order_id)

	# don't send duplicate emails
	if order.status != request.GET.get('status'):
		order.status = request.GET.get('status')
		order.tracking = request.GET.get('tracking', '')

		# update the ship date
		if order.status == 'SH':
			order.ship_date = datetime.now()

		order.save()

		if order.status == 'SE' or order.status == 'SH':
			mail_order_status_change(order.contact, order.meshu, order)
	
	# go back to gallery view
	return HttpResponseRedirect('/orders/')

def processing_all(request):
	meshus = Meshu.objects.all()

	return render_to_response('meshu/processing/allview.html', {
		'meshus': meshus
	}, context_instance=RequestContext(request))

# proxy yahoo api
import urllib2, urllib
def processing_geocoder(request):
	base = 'http://where.yahooapis.com/geocode?flags=J&location='
	key = '&appid=dj0yJmk9M1hsekZBSDY1ZjRxJmQ9WVdrOU5uUjZiRzE0TXpRbWNHbzlNVEV5TURZMU1qRTJNZy0tJnM9Y29uc3VtZXJzZWNyZXQmeD00OQ--'
	location = request.GET.get('location', '')

	url = urllib.quote(location)

	try:
		response = urllib2.urlopen(base + url + key)
		json = response.read()
		return HttpResponse(json, mimetype='application/json')
	except urllib2.URLError:
		return HttpResponse('', mimetype='application/json')

# for potentially having geojson urls
def processing_jsoner(request):
	url = request.GET.get('url', '')

	try:
		response = urllib2.urlopen(url)
		json = response.read()
		return HttpResponse(json, mimetype='application/json')
	except urllib2.URLError:
		return HttpResponse('', mimetype='application/json')

# import cairo, rsvg
# def processing_svg_to_image(request):
# 	svgString = request.POST.get('svg', '')

# 	svg = rsvg.Handle(data=svgString)
# 	width = svg.props.width 
# 	height = svg.props.height
	
# 	new_file = File()
	
# 	# create image
# 	png = cairo.ImageSurface(cairo.FORMAT_ARGB32, width, height)
# 	# png = cairo.ImageSurface(request.user.username + '.png', width, height) 
# 	cr = cairo.Context(surf) 
# 	svg.render_cairo(cr) 
# 	png.write_to_png(new_file)
# 	png.finish()

# 	response = {}
# 	response.update({ 'success' : True })
# 	response.update({ 'image_url' : image.get_absolute_url() })
# 	return HttpResponse(simplejson.dumps(response), mimetype='application/javascript')

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