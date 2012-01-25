from django.template import RequestContext
from django.shortcuts import render_to_response, get_object_or_404

# meshu.views.index
def index(request):
	return render_to_response('meshu/index.html', {}, context_instance=RequestContext(request))

# meshu.views.shop
def shop(request):
	return render_to_response('meshu/gallery/gallery.html', {}, context_instance=RequestContext(request))

# meshu.views.make
def make(request):
	return render_to_response('meshu/item/item.html', {}, context_instance=RequestContext(request))
