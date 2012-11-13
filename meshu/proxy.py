from django.conf import settings
from django.template import RequestContext
from django.shortcuts import render_to_response, get_object_or_404

from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.utils import simplejson

import string, random

# this is how i get dates. 
from datetime import datetime

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

def processing_router(request):
	base = "http://open.mapquestapi.com/directions/v1/route?routeType=pedestrian&outFormat=json&shapeFormat=raw&generalize=200&from="
	start = request.GET.get('from', '')
	end = request.GET.get('to', '')
	print(start)
	print(end)

	try:
		response = urllib2.urlopen(base + start + '&to=' + end)
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

# proxying the tiles to draw them in canvas
def processing_tiles(request, subdomain, zoom, x, y):
	# print(subdomain)
	# print(zoom)
	# print('x:' + str(x))
	# print('y:' + str(y))
	url = 'http://{0}.tile.stamen.com/toner/{1}/{2}/{3}.png'.format(subdomain, zoom, x, y)

	try:
		response = urllib2.urlopen(url)
		return HttpResponse(response.read(), mimetype="image/png")
	except urllib2.URLError:
		return HttpResponse('', mimetype='application/json')
    