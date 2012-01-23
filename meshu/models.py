from django.db import models
from django.contrib.auth.models import User
import datetime

# Create your models here.
class UserProfile(models.Model):
	user = models.OneToOneField(User)

	# other fields here

class Meshu(models.Model):
	user = models.ForeignKey(User)
	date_created = models.DateTimeField('date created')	
