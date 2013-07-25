from django.conf import settings
from django.template import RequestContext
from django.shortcuts import render_to_response, get_object_or_404

# user stuff
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
import uuid

from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.utils import simplejson

# for emailing html
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

# our models
from meshu.models import *

def mail_viewer(request, template):
	profile = current_profile(request)

	orders = Order.objects.filter(user_profile=profile)

	order = orders[0]
	meshu = order.meshu

	return render_to_response('meshu/email/' + template + '.html', {
			'profile' : profile,
			'meshu' : meshu,
			'order' : order
 	}, context_instance=RequestContext(request))

def mail_multiple_order_confirmation(email, meshu, orders):
	mail_template('meshu/email/multiple_order_confirmation.html', {
		'subject' : 'Meshu: Order Confirmation',
		'from' : 'orders@meshu.io',
		'to': email,
		'orders': orders
	})
	return

def mail_order_confirmation(email, meshu, order):
	mail_template('meshu/email/order_confirmation.html', {
		'subject' : 'Meshu: Order Confirmation',
		'from' : 'orders@meshu.io',
		'to': email,
		'meshu': meshu,
		'order': order
	})
	return

def mail_order_status_change(email, meshu, order):

	print(order.status)

	if order.status == 'SH':
		subject = 'Meshu: Your order has been shipped!'
		template = 'order_shipped'

	elif order.status == 'RE':
		subject = 'Meshu: We\'ve received your order from the fabricator!'
		template = 'order_received_from_fabricator'

	elif order.status == 'SE':
		subject = 'Meshu: Your order has been sent to the fabricator!'
		template = 'order_sent_to_fabricator'

	print(subject)

	if order.status == 'SH' or order.status == 'SE' or order.status == 'RE':
		mail_template('meshu/email/' + template + '.html', {
			'subject' : subject,
			'from' : 'orders@meshu.io',
			'to': email,
			'meshu': meshu,
			'order': order
		})

	return

def mail_forgotten_password(email, password):
	# subject, from_email, to = 'Your password has been reset', 'accounts@meshu.io', email

	mail_template('meshu/email/reset_password.html', {
		'subject' : 'Your password has been reset',
		'from' : 'accounts@meshu.io',
		'to': email,
		'password': password
	})
	return

# mails ordered svg to an ifttt routine
# that puts it in our dropbox queue for sending to the manufacturer
def mail_ordered_svg(order):
	# has to be my email because ifttt is expecting that
	from_email = 'shashashasha@gmail.com'
	to_email = 'trigger@ifttt.com'
	msg = EmailMultiAlternatives(order.get_svg_filename(), order.meshu.svg, from_email, [to_email])
	msg.send()
	return

def mail_template(template, arguments):

	html_content = render_to_string(template, arguments)
	text_content = strip_tags(html_content)

	# create the email, and attach the HTML version as well.
	subject = arguments['subject']
	from_email = arguments['from']
	to_email = arguments['to']

	msg = EmailMultiAlternatives(arguments['subject'], text_content, from_email, [to_email])
	msg.attach_alternative(html_content, "text/html")
	msg.send()
	return