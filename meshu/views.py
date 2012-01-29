from django.template import RequestContext
from django.shortcuts import render_to_response, get_object_or_404

# user stuff
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login

# our models
from meshu.models import Meshu, UserProfile

#
# The views for our Meshu app
#

# meshu.views.index
def index(request):
	return render_to_response('meshu/index.html', {}, context_instance=RequestContext(request))

# meshu.views.shop
def shop(request):
	return render_to_response('meshu/gallery/gallery.html', {}, context_instance=RequestContext(request))

# meshu.views.make
def make(request):
	meshu = Meshu()

	return render_to_response('meshu/item/item.html', {
			'view' : 'edit'
		}, context_instance=RequestContext(request))

def edit(request, item_id):
	item = get_object_or_404(Meshu, pk=item_id)
	return render_to_response('meshu/item/item.html', {
			'meshu': item,
			'view' : 'edit'
		}, context_instance = RequestContext(request))

def view_item(request, item_id):
	item = get_object_or_404(Meshu, pk=item_id)
	return render_to_response('meshu/item/item.html', {
			'meshu': item,
			'view' : 'view'
		}, context_instance = RequestContext(request))

def view_readymade(request, item_id):
	item = get_object_or_404(Meshu, pk=item_id)
	return render_to_response('meshu/item/readymade.html', {
			'meshu': item,
		}, context_instance = RequestContext(request))

def create_item(request):
	username = request.POST['username']
	title = request.POST['title']
	description = request.POST['description']
	points_blob = request.POST['points_blob']

	# create a meshu
	meshu = Meshu(title=title, description=description, points_blob=points_blob)
	meshu.save()

	return render_to_response('meshu/item/item.html', {
		'meshu' : meshu,
		'view' : 'edit'
	}, context_instance=RequestContext(request))


def create_user(request):
	username = request.POST['username']
	email = request.POST['email']
	password = request.POST['password']

	# create user shortcut
	user = User.objects.create_user(username, email, password)

	user.is_staff = False
	user.save()

	return render_to_response('meshu/gallery/gallery.html', {
			'view' : 'user_profile'
	}, context_instance=RequestContext(request))
