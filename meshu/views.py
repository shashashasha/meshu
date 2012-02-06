from django.template import RequestContext
from django.shortcuts import render_to_response, get_object_or_404

# user stuff
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login

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
	return item_handler(request, item_id, 'item.html', 'edit')

def item_view(request, item_id):
	return item_handler(request, item_id, 'item.html', 'view')

def item_display(request, item_id):
	return item_handler(request, item_id, 'display.html', 'display')

def item_readymade(request, item_id):
	return item_handler(request, item_id, 'readymade.html', 'readymade')

# generalized handler for all our item pages
def item_handler(request, item_id, template, view):
	item = get_object_or_404(Meshu, pk=item_id)
	return render_to_response('meshu/item/' + template, {
			'meshu': item,
			'view': view
		}, context_instance = RequestContext(request))

def item_create(request):
	username = request.POST['username']
	title = request.POST['title']
	description = request.POST['description']
	points_blob = request.POST['points_blob']

	# create a meshu
	meshu = Meshu(title=title, description=description, points_blob=points_blob)
	meshu.date_created = datetime.now()
	meshu.save()

	return render_to_response('meshu/item/item.html', {
		'meshu' : meshu,
		'view' : 'edit'
	}, context_instance=RequestContext(request))


#
# Views for Users
#

def user_create(request):
	username = request.POST['username']
	email = request.POST['email']
	password = request.POST['password']

	# create user shortcut
	user = User.objects.create_user(username, email, password)

	user.is_staff = False
	user.save()

	return render_to_response('meshu/notification/base_notification.html', {
			'view' : 'signedup'
	}, context_instance=RequestContext(request))

def user_profile(request):
	# show all meshus belonging to the current user
	meshus = Meshu.objects.filter(user_profile=request.user.get_profile())

	return render_to_response('meshu/gallery/gallery.html', {
			'view' : 'user',
			'meshus': meshus
	}, context_instance=RequestContext(request))

#
# Ordering!
#
def get_current_profile(request):
	if request.user.is_authenticated():
		return request.user.get_profile()
	else 
		return UserProfile.objects.get(id=1)

def meshu_create_or_update(request, profile):
	meshu = Meshu()
	meshu.title = request.POST.get('title', 'My Meshu')
	meshu.description = request.POST.get('description', '')
	meshu.location_data = request.POST['location_data']	
	meshu.svg = request.POST['svg']
	meshu.theta = int(float(request.POST['theta']))

	meshu.user_profile = profile
	meshu.save()
	return meshu

def order_create(request, profile):
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
	order.amount = str(float(request.POST['amount']) / 100.0)

	# set the status to ORDERED
	order.status = 'OR'
	order.user_profile = profile

	if profile.user.id == 1:
		order.contact = request.POST['shipping_contact']
	else:
		order.contact = profile.user.email

	order.save()
	return order

def order(request):
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

	# gets logged in user profile, or anonymouse profile
	profile = get_current_profile(request)

	# create a new meshu
	# add logic later if it's not new, ie readymade
	meshu = meshu_create_or_update(request)

	# create a new order
	# every order is new
	order = order_create(request)

	return render_to_response('meshu/notification/base_notification.html', {
			'view' : 'paid'
	}, context_instance=RequestContext(request))
