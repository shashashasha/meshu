from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
import datetime

# Create your models here.
class UserProfile(models.Model):
	user = models.OneToOneField(User)

	# other fields here

class Meshu(models.Model):
	user = models.ForeignKey(User)
	date_created = models.DateTimeField('date created')	
	title = models.CharField(max_length=140)
	description = models.CharField(max_length=400)
	points_blob = models.CharField(max_length=4000)
	
	# the equivalent of overriding the .toString() function
	def __unicode__(self):
		return self.title

# function to create a UserProfile whenever a new User is .save()'d
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

post_save.connect(create_user_profile, sender=User)