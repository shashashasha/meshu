from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
import datetime

class Meshu(models.Model):
	user = models.ForeignKey(User)
	date_created = models.DateTimeField('date created')	
	title = models.CharField(max_length=140)
	description = models.CharField(max_length=400)
	points_blob = models.CharField(max_length=4000)
	
	# the equivalent of overriding the .toString() function
	def __unicode__(self):
		return self.title

class Order(models.Model):
	user = models.ForeignKey(User)
	meshu = models.ForeignKey(Meshu)

	# order details
	ORDER_STATUSES = (
		(u'OR', u'Ordered'), # 
		(u'PR', u'Processed'), # 
		(u'SE', u'Sent to Fabricator'), #
		(u'RE', u'Received from Fabricator'), # 
		(u'PA', u'Packaged'), # 
		(u'SH', u'Shipped'),
	)
	date_created = models.DateTimeField('date created')	
	status = models.CharField(max_length=2, choices=ORDER_STATUSES)

	# order information
	material = models.CharField(max_length=140) # acrylic, silver, wood
	color = models.CharField(max_length=140) # black, white, grey
	product = models.CharField(max_length=140) # necklace, pendant, etc
	amount = models.DecimalField(max_digits=6, decimal_places=2)

	# shipping information
	shipping_address = models.CharField(max_length=140)
	shipping_address_2 = models.CharField(max_length=140)
	shipping_city = models.CharField(max_length=100)
	shipping_zip = models.CharField(max_length=5)
	shipping_state = models.CharField(max_length=2)

	# "Black Acrylic Necklace ordered by Sha, "
	def __unicode__(self):
		strings = [self.color, self.material, self.product]
		details = ' '.join(strings)
		details += ' ordered by ' + self.user.username
		details += ', $' + str(self.amount)
		return details

# Create your models here.
class UserProfile(models.Model):
	user = models.OneToOneField(User)
	# other fields here

# function to create a UserProfile whenever a new User is .save()'d
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

post_save.connect(create_user_profile, sender=User)
