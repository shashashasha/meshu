import cgi, urllib, json

from django.conf import settings
from django.contrib.auth.models import User, AnonymousUser
from django.db import IntegrityError

# using our existing UserProfile model, messy :(
from meshu.models import UserProfile

class FacebookBackend:
    def authenticate(self, token=None, request=None, use_token=False):
        """ Reads in a Facebook code and asks Facebook if it's valid and what user it points to. """
        args = {
            'client_id': settings.FACEBOOK_APP_ID,
            'client_secret': settings.FACEBOOK_APP_SECRET,
            'redirect_uri': request.build_absolute_uri('/facebook/authentication_callback'),
            'code': token,
        }
        
        # If we already have a good token, just use that shit
        if use_token:
            access_token = token
        # Otherwise get a legit access token
        else:
            target = urllib.urlopen('https://graph.facebook.com/oauth/access_token?' + urllib.urlencode(args)).read()
            response = cgi.parse_qs(target)
            access_token = response['access_token'][-1]

        # Read the user's profile information
        fb_profile = urllib.urlopen('https://graph.facebook.com/me?access_token=%s' % access_token)
        fb_profile = json.load(fb_profile)

        try:
            user = User.objects.get(email=fb_profile['email'])
            fb_user = UserProfile.objects.get(user=user)

            fb_user.facebook_id = fb_profile['id']
            fb_user.access_token = access_token
            fb_user.save()
            return user

        # we don't care if it doesn't exist, we'll create a user later
        except (User.DoesNotExist, UserProfile.DoesNotExist):
            pass

        try:
            # Try and find existing user
            fb_user = UserProfile.objects.get(facebook_id=fb_profile['id'])
            user = fb_user.user

            # Update access_token
            fb_user.access_token = access_token
            fb_user.save()

        except UserProfile.DoesNotExist:
            # No existing user

            # Not all users have usernames
            username = fb_profile.get('username', fb_profile['email'].split('@')[0])

            # No existing user, create one
            try:
                user = User.objects.create_user(username, fb_profile['email'])
            except IntegrityError:
                # Username already exists, make it unique
                user = User.objects.create_user(username + fb_profile['id'], fb_profile['email'])
            user.first_name = fb_profile['first_name']
            user.last_name = fb_profile['last_name']
            user.save()

            # UserProfile is automatically created when a User is created
            fb_user = UserProfile.objects.get(user=user)
            fb_user.access_token = access_token
            fb_user.facebook_id = fb_profile['id']
            fb_user.save()

        return user

    def get_user(self, user_id):
        """ Just returns the user of a given ID. """
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None

    supports_object_permissions = False
    supports_anonymous_user = True
