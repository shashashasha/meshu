from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('polls.views',
	# /
	url(r'^$', 'index'),

	# 23/ for example
	url(r'^(?P<poll_id>\d+)/$', 'detail'),

	# 23/results/ 
	url(r'^(?P<poll_id>\d+)/results/$', 'results'),

	# id/vote/
	url(r'^(?P<poll_id>\d+)/vote/$', 'vote'),
)
