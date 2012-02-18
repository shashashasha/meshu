from django.template import RequestContext
from django.shortcuts import render_to_response, get_object_or_404

# user stuff
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
import uuid

from django.http import HttpResponse
from django.utils import simplejson

# for emailing html
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

# our models
from meshu.models import Meshu, Order, UserProfile

# this is how i get dates. 
import datetime

# got to get paid.
import stripe

#
# The views for our Meshu app
#

# meshu.views.index
def index(request):
	return render_to_response('meshu/index.html', {}, context_instance=RequestContext(request))

# meshu.views.shop
def shop(request):
	# assume user__id = 1 is all our admin created readymades
	meshus = Meshu.objects.filter(user_profile__id=1)
	return render_to_response('meshu/gallery/gallery.html', {
		"meshus": meshus,
		"view": 'shop',
	}, context_instance=RequestContext(request))

#
# Views for Items
#

# meshu.views.make
def item_make(request):
	return render_to_response('meshu/item/item.html', {
			'view' : 'edit'
		}, context_instance=RequestContext(request))

def item_edit(request, item_id):
	item = get_object_or_404(Meshu, pk=item_id)

	# check user id
	if request.user.id != item.user_profile.user.id:
		return render_to_response('meshu/notification/base_notification.html', {
				'view' : 'authorization_required'
		}, context_instance=RequestContext(request))

	return item_handler(request, item_id, 'item.html', 'edit')

def item_display(request, item_encoded):
	item_id = int(str(item_encoded).decode("hex"))
	return item_handler(request, item_id, 'usermade.html', 'view')

def item_readymade(request, item_id):
	return item_handler(request, item_id, 'readymade.html', 'readymade')

def item_delete(request, item_id):
	item_permissions(request, item_id)

	meshu = meshu_delete(request, item_id)
	return render_to_response('meshu/notification/base_notification.html', {
			'view' : 'meshu_deleted',
			'meshu': meshu
	}, context_instance=RequestContext(request))

# generalized handler for all our item pages
def item_handler(request, item_id, template, view):
	item = get_object_or_404(Meshu, pk=item_id)
	return render_to_response('meshu/item/' + template, {
			'meshu': item,
			'view': view
		}, context_instance = RequestContext(request))

def item_save(request, item_id):
	xhr = request.GET.has_key('xhr')

	old = Meshu.objects.get(id=item_id)

	meshu = Meshu()
	meshu.user_profile = old.user_profile
	meshu = meshu_update(request, meshu)
	meshu.save()

	if xhr:
		response_dict = {}
		response_dict.update({ 'success' : True })
		response_dict.update({ 'meshu_id' : meshu.id })
		return HttpResponse(simplejson.dumps(response_dict), mimetype='application/javascript')

	return item_handler(request, item_id, 'item.html', 'view')


#
# Views for Users
#
def user_login(request, *args, **kwargs):
	xhr = request.POST.has_key('xhr')

	user = authenticate(username=request.POST['email'], password=request.POST['password'])
	response = login(request, user)

	if xhr:
		meshus = Meshu.objects.filter(user_profile=request.user.get_profile())

		response_dict = {}
		response_dict.update({ 'success' : True })
		response_dict.update({ 'username' : user.username })
		response_dict.update({ 'meshus' : meshus.count() })
		return HttpResponse(simplejson.dumps(response_dict), mimetype='application/javascript')

	return render_to_response('meshu/notification/base_notification.html', {
			'view' : request.POST['xhr']
	}, context_instance=RequestContext(request))

def user_logout(request, *args, **kwargs):
	xhr = request.GET.has_key('xhr')
	response = logout(request)

	if xhr:
		response_dict = {}
		response_dict.update({ 'success' : True })
		return HttpResponse(simplejson.dumps(response_dict), mimetype='application/javascript')

	return render_to_response('meshu/notification/base_notification.html', {
			'view' : request.GET['xhr']
	}, context_instance=RequestContext(request))

def user_create(request):
	username = uuid.uuid4().hex[:30]
	
	try:
		while True:
			User.objects.get(username=username)
			username = uuid.uuid4().hex[:30]
	except User.DoesNotExist:
		pass

	# username = request.POST['username']
	email = request.POST['email']
	password = request.POST['password']

	# create user shortcut
	user = User.objects.create_user(username, email, password)

	user.is_staff = False
	user.save()

	# if it's an ajax request, assume you want to log in immediately
	xhr = request.POST.has_key('xhr')
	if xhr:
		return user_login(request)

	return render_to_response('meshu/notification/base_notification.html', {
			'view' : 'signedup'
	}, context_instance=RequestContext(request))

def user_profile(request):
	# show all meshus belonging to the current user
	profile = current_profile(request)

	meshus = Meshu.objects.filter(user_profile=profile)

	return render_to_response('meshu/gallery/gallery.html', {
			'view' : 'user',
			'profile' : profile,
			'meshus': meshus
	}, context_instance=RequestContext(request))

def mail_order_confirmation(email, meshu, order):
	subject, from_email, to = 'Order Confirmation', 'meshbot@meshu.io', email
	html_content = render_to_string('meshu/email/order_confirmation.html', { 
		'view':'paid',
		'meshu': meshu,
		'order': order
	})
	text_content = strip_tags(html_content)
	# create the email, and attach the HTML version as well.
	msg = EmailMultiAlternatives(subject, text_content, from_email, [to])
	msg.attach_alternative(html_content, "text/html")
	msg.send()
	return

#
# Ordering!
#
def item_order(request, item_id):
	# gets logged in user profile, or anonymous profile
	profile = current_profile(request)

	item_id = request.POST.get('meshu_id', item_id)
	
	# get existing meshu
	meshu = Meshu.objects.get(id=item_id)

	return make_order(request, profile, meshu)

# ordering a new meshu
def order(request):
	# gets logged in user profile, or anonymous profile
	profile = current_profile(request)

	# create a new meshu
	# add logic later if it's not new, ie readymade
	meshu = meshu_get_or_create(request, profile)

	return make_order(request, profile, meshu)


def make_order(request, profile, meshu):
	# set your secret key: remember to change this to your live secret key in production
	# see your keys here https://manage.stripe.com/account
	stripe.api_key = "4HpS6PRbhNrY0YBLrsGZNietuNJYjNcb" # key the binx gave

	# get the credit card details submitted by the form
	token = request.POST['stripeToken']

	# create the charge on Stripe's servers - this will charge the user's card
	charge = stripe.Charge.create(
	    amount=1000, # amount in cents, again
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
		return UserProfile.objects.get(id=1)


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
	meshu = Meshu()
	meshu.title = request.POST.get('title', 'My Meshu')
	meshu.description = request.POST.get('description', '')

	# meshu data
	meshu.location_data = request.POST['location_data']	
	meshu.svg = request.POST['svg']

	# wtf dawg
	meshu.theta = int(float(request.POST.get('theta', '0.0')))

	meshu.user_profile = profile
	meshu.save()
	return meshu

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
	order.shipping_state = request.POST['shipping_state']

	# set the meshu materials
	order.material = request.POST['material']
	order.color = request.POST['color']
	order.product = request.POST['product']

	# stripe uses cents, which makes none
	amount = float(request.POST.get('amount', '0.0')) / 100.0
	order.amount = str(amount)

	# set the status to ORDERED
	order.status = 'OR'

	if profile.id == 1:
		order.contact = request.POST.get('shipping_contact', '')
	else:
		order.contact = profile.user.email
	
	# foreign keys
	order.user_profile = profile
	order.meshu = meshu

	order.save()
	return order