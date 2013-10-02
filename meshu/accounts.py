from django.conf import settings
from django.shortcuts import render, get_object_or_404

# user stuff
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
import uuid

from django.http import HttpResponse, HttpResponseRedirect, Http404

# our models
from meshu.models import Meshu, MeshuImage, Order, UserProfile

# not sure why i can't do cart.models import Cart
from cart import Cart

from meshu.views import *

# preserve 'CART-ID' when logging in
from meshu.decorators import persist_session_vars

#
# Views for Users
#
@persist_session_vars(['CART-ID'])
def login_user_flow(request, user):
	if user is not None:
		if user.is_active:
			response = login(request, user)
			return user_login_success(request, user)
		else:
			return user_login_error(request, user)
	else:
	    return user_login_error(request, user)

@persist_session_vars(['CART-ID'])
def user_login(request, *args, **kwargs):
	email = request.POST['email']

	try:
		dupes = User.objects.filter(email=email)
		if len(dupes) > 1:
			return user_duplicate_error(request)
	except User.DoesNotExist:
		pass

	user = authenticate(username=email, password=request.POST['password'])
	return login_user_flow(request, user)

@persist_session_vars(['CART-ID'])
def user_login_success(request, user):
	xhr = request.POST.has_key('xhr')

	profile = user.get_profile()
	meshus = Meshu.objects.filter(user_profile=profile)

	if xhr:
		return json_dump({
			'success': True,
			'username': user.username,
			'meshus': meshus.count(),
			'facebook_id': profile.facebook_id
		})
	else:
		return render(request, 'meshu/gallery/gallery.html', {
			'view' : 'user',
			'profile' : profile,
			'meshus': meshus,
			'cart_count': Cart(request).count()
		})

def user_login_error(request, user):
	xhr = request.POST.has_key('xhr')

	if xhr:
		return json_dump({
			'success' : False
		})
	else:
		return notify(request, 'login_error')

def user_duplicate_error(request):
	xhr = request.POST.has_key('xhr')

	if xhr:
		return json_dump({
			'success' : False,
			'duplicate': True
		})
	else:
		return notify(request, 'login_error')

def user_logout(request, *args, **kwargs):
	xhr = request.GET.has_key('xhr')
	response = logout(request)

	if xhr:
		return json_dump({
			'success' : False
		})

	return notify(request, 'loggedout')

@persist_session_vars(['CART-ID'])
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
		return notify(request, 'signedup')

#
def user_facebook_login(request):
	fb_profile = request.POST
	access_token = fb_profile['access_token']
	user = authenticate(token=access_token, request=request, use_token=True)
	return login_user_flow(request, user)

def user_profile(request):
	# show all meshus belonging to the current user
	profile = current_profile(request)

	if request.user.is_authenticated() == False:
		return notify(request, 'authorization_required')

	meshus = Meshu.objects.filter(user_profile=profile)

	return render(request, 'meshu/gallery/gallery.html', {
		'view' : 'user',
		'profile' : profile,
		'meshus': meshus,
		'cart_count': Cart(request).count()
	})

def user_forgot_password(request):
	profile = current_profile(request)

	email = request.POST.get('email', 'noemail')
	response_dict = {}

	try:
		user = User.objects.get(email=email)
	except User.DoesNotExist:
		return json_dump({
			'message' : 'User with that email does not exist'
		})

	if user.username == 'shop':
		return json_dump({
			'message' : "You can't reset your password this way"
		})

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
