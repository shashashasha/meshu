from meshu.views import *

import urllib2, urllib

#
# Views for Items
#

def item_begin_order(request, item_encoded):
	item_id = int(str(item_encoded).decode("hex"))

	# check user id
	# for the marathon, we can just let anyone order anything

	# item = get_object_or_404(Meshu, pk=item_id)
	# if request.user.id != item.user_profile.user.id:
	# 	return notify(request, 'authorization_required')

	return item_handler(request, item_id, 'usermade.html', 'product')

def item_edit(request, item_encoded):
	item_id = int(str(item_encoded).decode("hex"))
	item = get_object_or_404(Meshu, pk=item_id)

	# check user id
	username = item.user_profile.user.username
	if username != 'guest' and request.user.username != username:
		return notify(request, 'authorization_required')

	if item.renderer == "radial":
		return item_handler(request, item_id, 'usermade_radial.html', 'radial edit')
	elif item.renderer == "print":
		return item_handler(request, item_id, 'usermade_print.html', 'print edit')
	elif item.renderer == "orbit":
		return item_handler(request, item_id, 'usermade_circle.html', 'orbit edit')
	elif item.renderer == "streets":
		return item_handler(request, item_id, 'usermade_streets.html', 'streets edit')
	else:
		return item_handler(request, item_id, 'usermade.html', 'edit')

def item_display(request, item_encoded):
	item_id = int(str(item_encoded).decode("hex"))
	return item_handler(request, item_id, 'display.html', 'view')

def item_delete(request, item_id):

	meshu = meshu_delete(request, item_id)
	return notify(request, 'meshu_deleted')

# generalized handler for all our item pages
def item_handler(request, item_id, template, view):
	item = get_object_or_404(Meshu, pk=item_id)

	return render(request, 'meshu/item/' + template, {
		'meshu': item,
		'view': view,
		'cart_count': Cart(request).count()
	})

def item_from_geojson(request):
	if request.POST.has_key('geojson') == False and request.GET.has_key('url') == False:
		return render(request, '404.html')

	meshu = Meshu()

	if request.GET.has_key('url'):
		meshu.title = request.GET.get('title', 'My Meshu')
		response = urllib2.urlopen(request.GET.get('url'))
		geojson = response.read()

	if request.POST.has_key('geojson'):
		meshu.title = request.POST.get('title', 'My Meshu')
		geojson = request.POST.get('geojson', '')

	meshu.save()

	return render(request, 'meshu/item/geojson.html', {
		'meshu': meshu,
		'geojson' : geojson,
		'view': 'edit'
	})

def item_from_preset(request, item_encoded):
	item_id = int(str(item_encoded).decode("hex"))
	item = get_object_or_404(Meshu, pk=item_id)

	meshu = Meshu()

	meshu.title = item.title
	meshu.description = item.description

	# meshu data
	meshu.location_data = item.location_data
	meshu.svg = item.svg

	# wtf dawg
	meshu.theta = item.theta

	return render(request, 'meshu/item/item.html', {
		'meshu': meshu,
		'view': 'edit'
	})

def item_from_data(request):

	if request.POST.has_key('location_data') == False:
		return render(request, '404.html')

	meshu = Meshu()

	meshu.title = request.POST.get('title', 'My Meshu')
	meshu.description = request.POST.get('description', '')

	# meshu data
	meshu.location_data = request.POST['location_data']
	meshu.svg = request.POST['svg']

	# wtf dawg
	theta = request.POST.get('theta', 0.0)
	if theta:
		meshu.theta = int(float(theta))

	return render(request, 'meshu/item/item.html', {
		'meshu': meshu,
		'view': 'edit'
	})



def item_create(request):
	xhr = request.POST.has_key('xhr')

	profile = current_profile(request)

	meshu = meshu_get_or_create(request, profile)

	if xhr:
		return meshu_xhr_response(meshu)

	return HttpResponseRedirect(meshu.get_absolute_url())

def item_assign(request):
	xhr = request.POST.has_key('xhr')

	profile = current_profile(request)

	meshu = meshu_get_or_create(request, profile)
	meshu.user_profile = profile
	meshu.save()

	if xhr:
		return meshu_xhr_response(meshu)

	return HttpResponseRedirect(meshu.get_absolute_url())


def item_update(request, item_encoded):
	xhr = request.POST.has_key('xhr')

	item_id = int(str(item_encoded).decode("hex"))

	old = Meshu.objects.get(id=item_id)

	old = meshu_update(request, old)
	old.save()

	if xhr:
		return meshu_xhr_response(old)

	return HttpResponseRedirect(old.get_absolute_url())

def item_save(request, item_encoded):
	xhr = request.POST.has_key('xhr')

	item_id = int(str(item_encoded).decode("hex"))
	old = Meshu.objects.get(id=item_id)

	meshu = Meshu()
	meshu.user_profile = old.user_profile
	meshu = meshu_update(request, meshu)
	meshu.save()

	if xhr:
		return meshu_xhr_response(meshu)

	return item_handler(request, item_id, 'display.html', 'view')



from django.core.files.images import ImageFile
import re
# convert an existing, where we're guaranteed a meshu
# ie on /view/3242342 and /make/3242342 pages, not /make/
def item_topng(request, item_encoded):
	xhr = request.GET.has_key('xhr')

	item_id = int(str(item_encoded).decode("hex"))
	meshu = Meshu.objects.get(id=item_id)

	return processing_make_png(request, meshu)

def processing_dataurl_to_image(request, item_encoded=0):

	profile = current_profile(request)

	meshu = meshu_get_or_create(request, profile)

	return processing_make_png(request, meshu)

def processing_make_png(request, meshu):
	dataurl = request.POST.get('dataurl')
	imgstr = re.search(r'base64,(.*)', dataurl).group(1)

	output = open(settings.STATIC_ROOT + 'images/meshus/rendered.png', 'r+b')
	output.write(imgstr.decode('base64'))
	image = ImageFile(output)

	filename = meshu.get_png_filename()

	meshu_image = MeshuImage(meshu=meshu)
	meshu_image.image.save(filename, image)

	output.close()
	return json_dump({
		'success': True,
		'filename': filename,
		'id': meshu.id,
		'title': meshu.title,
		'username': meshu.user_profile.user.username,
		'view_url': meshu.get_absolute_url(),
		'image_url': meshu_image.image.url
	})