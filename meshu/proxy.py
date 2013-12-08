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

# from https://github.com/simplegeo/python-oauth2
import oauth2 as oauth
import time


def processing_geocoder(request):
	# Set the API endpoint
	url = "http://open.mapquestapi.com/geocoding/v1/address"
	location = urllib.quote(request.GET.get('location', ''))

	# because the api key has annoying characters,
	# we're just passing the url as a string directly
	key = settings.MAPQUEST_API_KEY

	# sigh
	full_url = url + '?location=' + location + '&key=' + key;

	try:
		response = urllib2.urlopen(full_url)
		json = response.read()
		return HttpResponse(json, mimetype='application/json')
	except urllib2.URLError:
		return HttpResponse('', mimetype='application/json')

def processing_router(request):
	base = "http://open.mapquestapi.com/directions/v1/route?routeType=pedestrian&outFormat=json&shapeFormat=raw&generalize=200&from="
	start = request.GET.get('from', '')
	end = request.GET.get('to', '')
	callback = request.GET.get('callback', '')

	try:
		response = urllib2.urlopen(base + start + '&to=' + end + '&callback=' + callback)
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
	url = 'http://{0}.tile.stamen.com/toner/{1}/{2}/{3}.png'.format(subdomain, zoom, x, y)

	try:
		response = urllib2.urlopen(url)
		return HttpResponse(response.read(), mimetype="image/png")
	except urllib2.URLError:
		return HttpResponse('', mimetype='application/json')
