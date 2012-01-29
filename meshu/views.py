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
	# assume user__id = 1 is all our admin created readymades
	meshus = Meshu.objects.filter(user__id=1)
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

	return render_to_response('meshu/gallery/gallery.html', {
			'view' : 'user'
	}, context_instance=RequestContext(request))

def user_profile(request):
	# show all meshus belonging to the current user
	meshus = Meshu.objects.filter(user=request.user)

	return render_to_response('meshu/gallery/gallery.html', {
			'view' : 'user',
			'meshus': meshus
	}, context_instance=RequestContext(request))