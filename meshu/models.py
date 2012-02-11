from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
import datetime

# Create your models here.
class UserProfile(models.Model):
	user = models.OneToOneField(User, default=1)

	def num_orders(self):
		# return Order.objects.filter(user=self.user).count()
		return self.meshu_set.all().count()

	# other fields here
	def __unicode__(self):
		details = ''
		details += self.user.username
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
	
	thumbnail = models.ImageField(upload_to="images/meshus/thumbnails/", default="images/meshu_01.png")

	# the equivalent of overriding the .toString() function
	def __unicode__(self):
		return str(self.id) + ' - ' + self.title + ', ' + str(self.date_created)

	# for short urling
	def get_absolute_url(self):
		return "/view/%s/" % str(self.id).encode("hex")

class MeshuImage(models.Model):
	meshu = models.ForeignKey(Meshu, default=1)
	image = models.ImageField(upload_to="images/meshus/")


class Order(models.Model):
	user_profile = models.ForeignKey(UserProfile, default=1)
	meshu = models.ForeignKey(Meshu, default=1)

	# order details
	ORDER_STATUSES = (
		(u'OR', u'Ordered'), # 
		(u'PR', u'Processed'), # 
		(u'SE', u'Sent to Fabricator'), #
		(u'RE', u'Received from Fabricator'), # 
		(u'PA', u'Packaged'), # 
		(u'SH', u'Shipped'),
	)
	date_created = models.DateTimeField('date created', auto_now_add=True)	
	status = models.CharField(max_length=2, choices=ORDER_STATUSES, default='OR')

	# order status email address
	contact = models.CharField(max_length=200, default='')

	# order information
	material = models.CharField(max_length=140) # acrylic, silver, wood
	color = models.CharField(max_length=140, blank=True) # black, white, grey
	product = models.CharField(max_length=140) # necklace, pendant, etc
	amount = models.DecimalField(max_digits=6, decimal_places=2, default=0) # dollar amount

	# shipping information
	shipping_name = models.CharField(max_length=200, default='')
	shipping_address = models.CharField(max_length=200, default='')
	shipping_address_2 = models.CharField(max_length=140, default='', blank=True)
	shipping_city = models.CharField(max_length=100, default='')
	shipping_zip = models.CharField(max_length=5, default='')
	shipping_state = models.CharField(max_length=2, default='')

	# "Black Acrylic Necklace ordered by Sha, $60.00"
	def __unicode__(self):
		strings = [self.color, self.material, self.product]
		details = ' '.join(strings)
		details += ' ordered by ' + self.user_profile.user.username
		details += ', $' + str(self.amount)
		return details