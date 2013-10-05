var sb = sb || {};

// using a new sb.ui object, hopefully to pull more out of app.js
sb.ui = sb.ui || {};

/*

	Pulling apart some JQuery listeners
	from app.js into here.

	This stuff handles the social sharing buttons,
	both rasterizing the meshu when needed
	and creating the button destinations when
	the meshu has been successfully rasterized

*/
sb.ui.socialsharer = function(meshu) {
	$(".share-facebook").click(function() {
		if (!sb.rasterizer.generated) {
			sb.rasterizer.rasterize(meshu, postOnFacebook);
		} else {
			postOnFacebook();
		}
	});

	$(".action-button").click(function() {
		var button = this;

		if (!sb.rasterizer.generated) {
			sb.rasterizer.rasterize(meshu, function(data) {
				button.click();
			});
			return false;
		}
	});

	sb.rasterizer.on("rasterized", function(data) {
		saver.updateMeshuData(data);

		/*
			prep all social buttons
		*/
		prepShareButtons();

		$(".social-media").fadeIn();
	});

	var prepShareButtons = function(data) {

		var twitterBase = "https://twitter.com/intent/tweet?text=";
		var pinterestBase = "http://pinterest.com/pin/create/button/?url=";
		var base = 'http://' + window.location.host;
		var image_url = base + meshu.image_url;
		var url = encodeURIComponent(base + meshu.view_url);

		// twessage
		var msg;
		switch (meshu.getRenderer()) {
			case 'radial':
				msg = "Take a look at this radial I just made of a place I've been";
				break;
			case 'facet':
			default:
				msg = "Take a look at this meshu I just made of the places I've been";
				break;
		}

		$(".share-pinterest").attr("href", pinterestBase + url + "&media=" + image_url);
		$(".share-twitter").attr("href", twitterBase + msg + '&url=' + url);

	};

	var postOnFacebook = function() {
		var base = 'http://' + window.location.host;
		FB.ui({
        	method: 'feed',
        	link: base + meshu.view_url,
        	picture: base + meshu.image_url,
        	name: meshu.title + ' on meshu.io',
        	caption: '',
        	description: ''
        }, function(response) {
            if (!response || response.error) {
            } else {
            }
        });
	};

};