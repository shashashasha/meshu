from django.shortcuts import render_to_response, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect
from django.core.urlresolvers import reverse
from django.template import RequestContext
from polls.models import Choice, Poll

# polls.views.index
def index(request):
	# get the latest 5 polls
	latest_poll_list = Poll.objects.all().order_by('-pub_date')[:5]

	# render_to_response takes a template name and a dictionary to pass parameters
	return render_to_response('polls/index.html', {
		'latest_poll_list': latest_poll_list
	})

# polls.views.detail
def detail(request, poll_id):
	# shortcut for try catching an object and 404ing
	p = get_object_or_404(Poll, pk=poll_id)

	# context_instance exposes the csrf token to the template
	return render_to_response('polls/detail.html', {'poll': p}, context_instance=RequestContext(request))

def results(request, poll_id):
	p = get_object_or_404(Poll, pk=poll_id)
	return render_to_response('polls/results.html', {'poll': p})

def vote(request, poll_id):
	p = get_object_or_404(Poll, pk=poll_id)
	
	# try to post the selection
	# the POST object is a dictionary of posted variables
	try: 
		selected_choice = p.choice_set.get(pk=request.POST['choice'])
	except (KeyError, Choice.DoesNotExist):
		# go back to the poll voting form
		return render_to_response('polls/detail.html', {
			'poll': p,
			'error_message': 'Your choice wasn\'t valid',
		}, context_instance = RequestContext(request))
	else:
		selected_choice.votes += 1
		selected_choice.save()

		return HttpResponseRedirect(reverse('polls.views.results', args=(p.id,)))
