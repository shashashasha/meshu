$(function() {

	// here's the list of views we have in this flow
	var views = ["edit","product","make","account","checkout","review"];
	var content = $("#content");

	// create a stripe payment object
	orderer.catalog(sb.catalog);
	sb.materializer.initialize(sb.catalog);

	// create a meshu object for a single meshu container
	var meshu = sb.meshu($("#meshu-container")[0]);

	// hotfix for postcard pages
	meshu.zoomOffset = window.location.href.search("postcard") > 0 ? -.25 : 0;

	meshu.isReadymade = loadedMeshu && loadedMeshu.product != '';

	// initialize ordering ui
	sb.ui.orderer(meshu).on("validated", function() {
		content.attr("class", "review");
		makeNextView('review');
	});

	if (loadedMeshu) {
		// create a saver object, in saver.js
		saver.initialize(meshu);
		saver.updateMeshuData(loadedMeshu);

		// if svg is enabled
		if ($("html").hasClass("svg")) {
			if (meshu.isReadymade) {
				// readymade.js
				try {
					readymade.initialize(meshu);	
				}
				catch(e) {
					// ignore if we don't have readymade.js
				}
			}

			if (pageType == 'view') {
				meshu.map().buffer(0);
			}
			
			meshu.locationData(loadedMeshu.location_data);
		}

		// checking the page view type, setting our flows accordingly
		user.updateLogoutActions(pageType);

		// initialize product picker
		sb.product.initialize(".delaunay", sb.catalog);

		switch (pageType) {
			case 'edit':
				views = ["edit","product","make","account","checkout","review"];
				break;

			case 'view':
				views = ["view"];
				break;

			case 'product':
				var product = $("#product");
				product.find(".nav").remove();
				product.find(".make-wrapper").removeClass("make-wrapper");

				views = ["product","make","account","checkout","review"];
				break;

			default:
				views = ["readymade","account","checkout","review"];

				$("#materials").addClass("ready");

				var product = loadedMeshu.product.length ? loadedMeshu.product : 'necklace';
				sb.materializer.product(product);
				break;
		}

		$("#finish-button").addClass("active");
		$("#meshu-container").removeClass("inactive");
		var rows = loadedMeshu.location_data.split("|");
		$.each(rows,function(i,row){
			var cols = row.split("\t");
			if (cols.length == 3) {
				// decoder div. dumb way to do this
				// http://stackoverflow.com/questions/3700326/decode-amp-back-to-in-javascript
				var div = document.createElement('div');
				div.innerHTML = cols[2];
				var decoded = div.firstChild.nodeValue;

				$("<li>").html(decoded).appendTo($("#display-places"));	
			}
		});

		d3.select("#place-number")
			.attr("class","")
			.select(".title-text")
            .html(function(d){
                d.title = loadedMeshu.title;
                meshu.updateTitle(d.title);
                return d.title;
            });
	} else {
		saver.initializeNewMeshu(meshu);
	}

	if (user.loggedIn) {
		//take out account view
		checkAccountView();
	}

	/* 
		Checking if we need to show the initial helper modal
	*/	
	var hash = window.location.hash;
	var showIntro = function() {
		$("#edit-help").fadeIn();
		$("#modal-bg").fadeIn();
		$("#close-help").click(function(){
			$("#edit-help").fadeOut();
			$("#modal-bg").fadeOut();
		});
	};
	if (!user.loggedIn && !loadedMeshu && hash != '#skipintro') {
		showIntro();
	} else if (hash == '#showintro') {
		showIntro();
		window.location.hash = "";
	} else if (hash == '#skipintro') {
		window.location.hash = "";
	}

	//navigation
	$(".next").live("click",function(){
		if (!$(this).hasClass("active")) return;

		var button = $(this);
		var view = content.attr("class");
		var index = views.indexOf(view)
		var advanceView = function() {
			content.attr("class", views[index+1]);
		};

		// if you're logged in, let's just save it as you go
		if (view == 'edit' && user.loggedIn) {
			// save this meshu
			saver.createOrUpdateMeshu();
		}

		if (view == 'make' || view == 'readymade') {
			checkAccountView();

			/*
				if we're on a readymade or make page, 
				we need to click the next button after we log in
			*/
			user.afterLogIn = function() {
				saver.createOrUpdateMeshu(function() {
					button.click();
				});
			};
		}
		
		if (view == 'account' && !user.loggedIn) {
			/*
				i don't understand why this callback is not... getting called back anymore
				but it may have something to do with user.js and the facebook login flow
			*/
			user.afterLogIn = function() {
				saver.createOrUpdateMeshu(function() {
					button.click();
				});
			};

			return;
		}


		makeNextView(view);
		user.updateLogoutActions(view);
		advanceView();
	});
	
	$(".back").click(function(){
		var view = content.attr("class");

		if (view == 'checkout') {
			checkAccountView();
		}

		/*
			if we logged ourselves out during the flow, 
			make sure that the next time we hit the login screen
			we click 'a' next button. this is dumb.
		*/
		if (!user.loggedIn) {
			user.afterLogIn = function() {
				saver.createOrUpdateMeshu(function() {
					$($(".next")[0]).click();
				});
			};
		}

	    var index = views.indexOf(view);
	    var prev = views[index-1];
	    
		content.attr("class", prev);

		makePrevView(prev);
	});

	/*
		Save and View the meshu, go to the view page
	*/
	$("#save-and-view").click(function() {
		// if the user is not logged in we should force them to log in
		var createAndView = function() {
			saver.createOrUpdateMeshu(function(data) {
				window.location.href = data.meshu_url;
			});
		};

		if (!user.loggedIn) {
			forceUserLogin();
			user.afterLogIn = createAndView;
		} 
		else {
			createAndView();
		}	
	});

	/* 
		This handles when people select a product to order
		and go to the materials / color selection page
	*/
	$("#product-preview svg").live("click", function() {

		var product = $(this).attr("id").split("-")[1];
		
		$(".make-option").hide();

		$("#make-" + product).show();

		sb.rotator.update(product);

		/* 
			i suck.
		*/
		sb.materializer.product(product);

		// sync the rotation between the product picker and the product rotator
		sb.rotator.on("rotated", sb.product.rotation);
	});

	// called when a next button is clicked
	function makeNextView(view) {
		switch (view) {
			case 'edit':
				// if we were editing and not logged in, show the modal, and save the meshu
				meshu.updateBounds();

				meshu.mesh().updateCircleBehavior();

				// initialize product picker
				// todo - fix
				sb.product.initialize(".delaunay", sb.catalog);

				// rasterize the meshu, add it as an image on to the page 
				// this means we can then pin it / fb it
				console.log('rasterizing', meshu);
				sb.rasterizer.rasterize(meshu);
				break;

			case 'make':
			case 'readymade':
				meshu.mesh().updateCircleBehavior(true);
				// animate meshu
				var product = sb.materializer.product();
				var t = sb.transforms[product]["render"];
				meshu.animateTransform(sb.rotator ? sb.rotator.rotation() : 0, t.scale, t.transform.x, t.transform.y);
				d3.select(".delaunay").attr("class","delaunay "+product);

				// update the render background to be the product preview
				var productPreview = static_url + 'images/render/' + product + '_preview.jpg';
				$(".render").css("background-image","url(" + productPreview + ")");
				break;

			// this doesn't happen because of a 'next' class button
			// it's a little weird but it's because of jquery validate
			case 'review':
				populateReview();
				break;
		}
	}

	// called when a back button is clicked
	function makePrevView(view) {
		switch (view) {
			case 'edit':
				meshu.mesh().updateCircleBehavior();
				break;

			case 'make':
			case 'readymade':
				meshu.mesh().updateCircleBehavior();
				meshu.animateTransform(0, 1, 0, 0);
				break;
		}
	}

	function checkAccountView() {
		var i = views.indexOf("account");
		if (user.loggedIn) {
			if (i >= 0) {
				views.splice(i, 1);
			}
			$("#account").css("visibility","hidden");
			
		} else {
			if (i == -1) {
				views.splice(-2, 0, "account");
			}
			$("#account").css("visibility","visible");
				$("#account li").click(function(){
	            var mode = $(this).attr("id").split("-")[1];
	            var form = $("#account");

	            form.attr("class",mode); 
	            form.find("li").removeClass("active");

	            $(this).addClass("active");

	            self.mode = mode;
	        });
		}
	}

	$(".show-places").click(function(){
		$("#display-places").slideToggle();
		$(".show-places").toggle();
	});


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
		
		var msg = "Check out this meshu I just made of the places I've been ";

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


});