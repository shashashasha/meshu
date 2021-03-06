from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
import datetime, json, urllib

# Create your models here.
class UserProfile(models.Model):
	user = models.OneToOneField(User, default=1)

	# fb specific stuff
	facebook_id = models.BigIntegerField(default=0, blank=True)
	access_token = models.CharField(max_length=300, default='', blank=True)

    # fb profile in json
	def get_facebook_profile(self):
		fb_profile = urllib.urlopen('https://graph.facebook.com/me?access_token=%s' % self.access_token)
		return json.load(fb_profile)

	def num_orders(self):
		return self.order_set.all().count()

	def amount_orders(self):
		return str(self.num_orders()) + ' orders'

	def amount_meshus(self):
		return str(self.meshu_set.all().count()) + ' meshus'

	def date_joined(self):
		return str(self.user.date_joined)

	def user_email(self):
		return str(self.user.email)

	# other fields here
	def __unicode__(self):
		details = ''
		details += self.user.email
		details += ', ' + str(self.meshu_set.all().count()) + ' meshus'
		details += ', ' + str(self.order_set.all().count()) + ' orders'
		return details

# function to create a UserProfile whenever a new User is .save()'d
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        profile = UserProfile.objects.create(user=instance)
        profile.save()

post_save.connect(create_user_profile, sender=User)


class Meshu(models.Model):
	user_profile = models.ForeignKey(UserProfile, default=1, null=True)
	date_created = models.DateTimeField('date created', auto_now_add=True)
	title = models.CharField(max_length=140, default='My Meshu', blank=True)
	description = models.CharField(max_length=400, blank=True)

	# tab separated list of locations
	location_data = models.TextField(blank=True)

	# svg of the meshu
	svg = models.TextField(blank=True)

	# rotation angle, around the center
	theta = models.IntegerField(default=0, blank=True)

	# if it's a readymade, we need to define what product it is
	product = models.CharField(max_length=140, default='', blank=True)

	# thumbnail in case we need gallery views
	thumbnail = models.ImageField(upload_to="images/meshus/thumbnails/", default="images/default_thumbnail.png")

	# whether or not its facet or radial
	renderer = models.CharField(max_length=140, default='', blank=True)

	# store visual style, zoom level, etc.
	# format is "product:radial&zoom:10"
	metadata = models.CharField(max_length=1000, default='', blank=True)

	# the equivalent of overriding the .toString() function
	def __unicode__(self):
		return str(self.id) + ' - ' + self.title

	def get_png_filename(self):
		return str(self.id) + '_' + self.user_profile.user.username + '.png'

	def get_encoded_id(self):
		return str(self.id).encode("hex")

	def get_order_url(self):
		return "/make/%s/" % self.get_encoded_id()

	def get_edit_url(self):
		return "/edit/%s/" % self.get_encoded_id()

	# for short urling
	def get_absolute_url(self):
		return "/view/%s/" % self.get_encoded_id()

class MeshuImage(models.Model):
	meshu = models.ForeignKey(Meshu, default=1)
	image = models.ImageField(upload_to="images/meshus/")


class ShippingInfo(models.Model):

	# order status email address
	contact = models.CharField(max_length=200, default='')

	# shipping information
	shipping_name = models.CharField(max_length=200, default='')
	shipping_address = models.CharField(max_length=200, default='')
	shipping_address_2 = models.CharField(max_length=140, default='', blank=True)
	shipping_city = models.CharField(max_length=100, default='')
	shipping_zip = models.CharField(max_length=20, default='') # account for postcodes too hopefully
	shipping_region = models.CharField(max_length=100, default='', blank=True) # regions, county
	shipping_state = models.CharField(max_length=2, default='', blank=True)
	shipping_country = models.CharField(max_length=100, default='', blank=True)

	amount = models.DecimalField(max_digits=6, decimal_places=2, default=0) # dollar amount

	def get_full_address(self):
		strings = [self.shipping_address, self.shipping_address_2, self.shipping_city, self.shipping_zip, self.shipping_country]
		return ' '.join(strings)

	def __unicode__(self):
		strings = [self.shipping_address, self.shipping_city, self.shipping_country]
		return ', '.join(strings)


class Order(models.Model):
	user_profile = models.ForeignKey(UserProfile, default=1)
	meshu = models.ForeignKey(Meshu, default=1)

	# order details
	ORDER_STATUSES = (
		(u'AD', u'Added'),
		(u'OR', u'Ordered'), #
		(u'PR', u'Processed'), #
		(u'SE', u'Sent to Fabricator'), #
		(u'RE', u'Received from Fabricator'), #
		(u'PA', u'Packaged'), #
		(u'SH', u'Shipped'),
		(u'CA', u'Canceled'),
	)
	date_created = models.DateTimeField('date created', auto_now_add=True)
	status = models.CharField(max_length=2, choices=ORDER_STATUSES, default='AD')

	# order information
	material = models.CharField(max_length=140) # acrylic, silver, bamboo
	color = models.CharField(max_length=140, blank=True) # black, white, grey
	product = models.CharField(max_length=140) # necklace, pendant, etc
	amount = models.DecimalField(max_digits=6, decimal_places=2, default=0) # dollar amount

	shipping = models.ForeignKey(ShippingInfo, null=True, blank=True)

	# postcard status
	postcard_ordered = models.CharField(max_length=10, default='false', blank=True)
	postcard_note = models.TextField(blank=True)

	# notes on shipping, paypal orders, etc
	special_instructions = models.CharField(max_length=200, default='', blank=True)

	# ring sizes, rotations, etc
	metadata = models.CharField(max_length=200, default='', blank=True)

	# track the coupon codes used
	coupon = models.CharField(max_length=100, default='', blank=True)

	# to hook back to usps
	ship_date = models.DateTimeField('date shipped', null=True, blank=True)
	tracking = models.CharField(max_length=140, default='', blank=True)

	def get_display_name(self):
		if (self.material == 'framed' or self.material == 'unframed'):
			return self.material + ' ' + self.product.replace("_"," ")
		elif (self.product == 'dense_pendant'):
			return self.color + ' ' + self.material + ' pendant'
		else:
			return self.color + ' ' + self.material + ' ' + self.product

	def get_processing_time(self):
		if self.material == 'silver':
			return '2-3 weeks for silver'
		elif self.material == 'brass':
			return '2-3 weeks for brass'
		elif self.material == 'nylon':
			return '2-3 weeks for nylon'
		elif self.material == 'acrylic':
			return '1-2 weeks for acrylic'
		elif self.material == 'bamboo':
			return '1-2 weeks for bamboo'
		elif self.material == 'unframed':
			return '1-2 weeks for unframed prints'
		elif self.material == 'framed':
			return '2-3 weeks for framed prints'

	def get_svg_filename(self):
		# returns "49_294_silver_pendant"
		return str(self.id) + '_' + str(self.meshu.id) + '_' + self.color + '_' + self.material + '_' + self.product

	def get_status_message(self):
		if self.status == 'AD':
			return 'Added'
		if self.status == 'OR':
			return 'Ordered'
		elif self.status == 'PR':
			return 'Processed'
		elif self.status == 'SE':
			return 'Sent to Fabricator'
		elif self.status == 'RE':
			return 'Received from Fabricator'
		elif self.status == 'PA':
			return 'Packaged'
		elif self.status == 'SH':
			return 'Shipped'
		else:
			return 'Unknown Status'

	# "Black Acrylic Necklace ordered by Sha, $60.00"
	def __unicode__(self):
		strings = [self.color, self.material, self.product]
		return ' '.join(strings)