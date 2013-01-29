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
	url = "http://yboss.yahooapis.com/geo/placefinder"
	location = request.GET.get('location', '')

	# Set up instances of our Token and Consumer. The Consumer.key and 
	# Consumer.secret are given to you by the API provider. 
	consumer = oauth.Consumer(key=settings.OAUTH_CONSUMER_KEY, secret=settings.OAUTH_CONSUMER_SECRET)

	# Set the base oauth_* parameters along with any other parameters required
	# for the API call.
	params = {
	    'oauth_version': "1.0",
	    'oauth_nonce': oauth.generate_nonce(),
	    'oauth_timestamp': int(time.time()),
	    'flags': 'J',
	    'location': urllib.quote(location),
	    'oauth_consumer_key': consumer.key
	}

	# Create our request. Change method, etc. accordingly.
	req = oauth.Request(method="GET", url=url, parameters=params)

	signature_method = oauth.SignatureMethod_HMAC_SHA1()

	# no token because reasons
	req.sign_request(signature_method, consumer, None)

	try:
		response = urllib2.urlopen(req.to_url())
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
    