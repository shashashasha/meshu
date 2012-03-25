$(function() {
	var options = {"earrings":
						{"acrylic":{"price":75,"colors":["Black","Grey","White"]},
						"wood":{"price":80,"colors":["Amber","Blonde"]},
						"nylon":{"price":90,"colors":["Black","Grey","White"]},
						"silver":{"price":150}},
				   "pendant":
				   		{"acrylic":{"price":75,"colors":["Black","Grey","White"]},
						"wood":{"price":80,"colors":["Amber","Blonde"]},
						"nylon":{"price":90,"colors":["Black","Grey","White"]},
						"silver":{"price":130}},
				   "necklace":
				   		{"acrylic":{"price":80,"colors":["Black","Grey","White"]},
						"wood":{"price":85,"colors":["Amber","Blonde"]},
						"nylon":{"price":95,"colors":["Black","Grey","White"]},
						"silver":{"price":150}},
					"cufflinks":
						{"stainless":{"price":85},
						"silver":{"price":160}}};
	var displayNames = {"earrings":"pair of earrings",
						"pendant":"small pendant necklace",
						"necklace":"large necklace",
						"cufflinks": "pair of cufflinks"};
	var productNames = {"earrings":"earrings",
						"pendant":"pendant necklace",
						"necklace":"large necklace",
						"cufflinks": "cufflinks"};
	var shipPrice = 4;
	
	// here's the list of views we have in this flow
	var views = ["edit","product","make","account","checkout","review"];
	var content = $("#content");

	// create a stripe payment object
	orderer.options(options);

	// create a meshu object for a single meshu container
	var meshu = sb.meshu($("#meshu-container")[0]);

	sb.materializer.initialize(options, displayNames);

	if (loadedMeshu) {
		// create a saver object, in saver.js
		saver.initialize(meshu, loadedMeshu.view_url);

		meshu.locationData(loadedMeshu.location_data);

		// checking the page view type, setting our flows accordingly
		user.updateLogoutActions(pageType);

		// initialize product picker
		sb.product.initialize("#delaunay");

		switch (pageType) {
			case 'edit':
				views = ["edit","product","make","account","checkout","review"];
				break;

			case 'make':
				views = ["edit","product","make","account","checkout","review"];
				break;

			case 'view':
				views = ["view","product","make","account","checkout","review"];
				break;

			case 'product':
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
		views.splice(-3,1);	
		$("#account").hide();
	}
	if (!user.loggedIn && !(loadedMeshu && pageType != "edit") && window.location.hash != '#skipintro') {
		$("#edit-help").fadeIn();
		$("#modal-bg").fadeIn();
		$("#close-help").click(function(){
			$("#edit-help").fadeOut();
			$("#modal-bg").fadeOut();
		});
	} else if (window.location.hash == '#skipintro') {
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

		if (view == 'make' && !user.loggedIn) {
			user.afterLogIn = function() {
				saver.createOrUpdateMeshu();
				saver.postCreateCallback = function() {
					button.click();
				};
			};
		}

		makeNextView(view);
		user.updateLogoutActions(view);
		advanceView();
	});
	
	$(".back").click(function(){
	    var index = views.indexOf(content.attr("class"));
	    var view = views[index-1];
		content.attr("class", view);

		makePrevView(view);
	});

	/*
		Save and View the meshu, go to the view page
	*/
	$("#save-and-view").click(function() {
		// if the user is not logged in we should force them to log in
		var createAndView = function() {
			saver.createOrUpdateMeshu();

			saver.postCreateCallback = function(data) {
				window.location.href = data.meshu_url;
			};
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
				sb.product.initialize("#delaunay");
				break;

			case 'make':
				meshu.mesh().updateCircleBehavior(true);
				// animate meshu
				meshu.animateTransform(sb.rotator ? sb.rotator.rotation() : 0);
				break;

			case 'readymade':
				meshu.mesh().updateCircleBehavior(true);
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
				meshu.animateTransform(0);
				break;
		}
	}

	/*
		How we flip between images of readymades
	*/
	var timer;
	$("#img-thumbs img").click(function(){
		clearTimeout(timer);

		// <3
		var id = $(this).attr("id");
		if (!id) {
			$(".other-view").removeClass("active");
			timer = setTimeout(function(){ $(".other-view").removeClass("z-1"); },1000);
		}
		else {
			$("#l-"+id).addClass("active z-1");
		}
	});

	$(".show-places").click(function(){
		$("#display-places").slideToggle();
		$(".show-places").toggle();
	});

	/*
		We're using JQuery validate to check all the forms 
		of our shipping and credit card input

		If it's valid, we populate the review
	*/
	$("#payment-form").validate({
		rules: {
			shipping_zip: {
				digits: true,
		      	minlength: 5
		    },
		    shipping_state: {
		    	minlength: 2
		    },
		    card_number: {
		    	creditcard: true
		    },
		    card_cvc: {
		    	digits: true,
		    	minlength: 3
		    },
		    card_month: {
		    	digits: true,
		    	minlength: 2
		    },
		    card_year: {
		    	digits: true,
		    	minlength: 4,
		    }
		},
		messages: {
			shipping_state: "Please enter the two-letter state abbreviation.",
			card_cvc: "Sorry, that is not a valid CVC code",
			card_month: {
				minlength: "Please enter the month as a two-digit number."
			}, card_year: {
				minlength: "Please enter the year as a four-digit number.",
			},
		},
		submitHandler: onFormValidated
	});
	
	$("#coupon-code").submit(function() {
		var value = $("#coupon-code-value").val();
		orderer.applyCoupon(value, function(data) {
			if (data.success) {
				var couponPrice = data.amount;

				$("<h2>").attr("id","subtotal-coupon")
					.addClass("review-header")
					.html("Coupon:<span>-$" + couponPrice + ".00</span>")
					.insertAfter("#subtotal-price");

				// turn the input form into text
				$("#coupon-message").fadeIn('fast').html(value + ' discount applied!')
				$(".coupon-form").hide();
			} else {
				$("#coupon-message").fadeIn('fast').html('Oops, invalid code.');
			}

			populateReview();
		});

		return false;
	});

    $("#submit-button").click(function(){ 
        if (!user.loggedIn) {
        	forceUserLogin();
        	return false;
        }

        orderer.submit(); 
    });

	function onFormValidated() {
		if (!user.loggedIn) {
			forceUserLogin(onFormValidated);
			return;
		}

		content.attr("class", "review");
		makeNextView('review');
	}

	function forceUserLogin(callback) {
		user.showModal();

		// after a user logs in, click the button
		user.afterLogIn = function() {
			if (callback) {
				saver.createOrUpdateMeshu();	
				saver.postCreateCallback = function() {
					// wait a bit... 
					setTimeout(callback, 200);
				}
			}
		};
	}

	/*
		populateReview runs when we click 'review your order'
		here's where we populate our hidden form with all of the data we'll be sending
		also telling stripe how much to charge once the "submit" button is pressed
	*/
	function populateReview() {
		// let our stripe object know what object we're purchasing
		// it'll know the price, given the options beforehand
		// we also can't change options once it's set, so no one can mess with it
		orderer.updateProduct(sb.materializer.product(), sb.materializer.material(), shipPrice);

		$("#object-type").val(productNames[sb.materializer.product()]);
		$("#object-material").val(sb.materializer.material());
		$("#object-color").val(sb.materializer.color().toLowerCase());
		$("#object-amount").val(orderer.getTotalCents());
		
		$("#svg-theta").val(sb.rotator ? sb.rotator.rotation() : 0);

		// outputting meshu data
		$("#svg-file").val(meshu.outputSVG());
		$("#meshu-data").val(meshu.outputLocationData());
		$("#meshu-title").val(loadedMeshu ? loadedMeshu.title : meshu.outputTitle());

		// update the review
		updateReviewText();

		$("#review-shipping").empty();
		$(".ship-row input").each(function(){
			var div;

			// because i'm anal, sorry
			// - s.
			var titleCase = function(str) {
			    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
			};

			this.value = titleCase(this.value);

			switch (this.id) {
				case 'ship-city':
				case 'ship-zip':
					div = $("<span>");
					break;

				case 'ship-state':
					this.value = this.value.toUpperCase();
					div = $("<span>");
					break;
				default:
					div = $("<p>");
					break;
			}

			div.text($(this).val()).appendTo("#review-shipping");
		});
		var digits = $("#card-number").val();
		$("#review-payment").text("XXXX-XXXX-XXXX-"+digits.substring(12,16));
	}
	
	/*
		Updating the review order divs
	*/
	function updateReviewText() {

		var product = "One " + displayNames[sb.materializer.product()];
		var productType = sb.materializer.color() + " " + sb.materializer.material();
		$("#review-description").text(product + ", made out of " + productType);

		$("#subtotal-price span").text(orderer.getPriceString());

		$("#shipping-price span").text("$" + shipPrice + ".00");

		$("#total-price span").text(orderer.getTotalString());
	}
});