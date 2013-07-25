var sb = sb || {};

// using a new sb.ui object, hopefully to pull more out of app.js
sb.ui = sb.ui || {};

/*

	Pulling apart some JQuery listeners
	from app.js into here.

	The idea is that stuff in here either
	listens to events related to the purchasing
	form or modifies the purchasing form.

*/
sb.ui.orderer = function(meshu) {
	var self = d3.dispatch("validated", "updated");

	self.on("updated", function() {
		// update hidden form
		updateForm();

		// update the 'review order' screen
		// updateReviewText();
	});

	// switching from international to domestic, or vice versa
	$("#shipping-destination li").click(function() {
        var mode = $(this).attr("id").split("-").pop();

        var form = $("#shipping-destination");

        $("#shipping-form").attr("class", mode);
        form.find("li").removeClass("active");
        $(this).addClass("active");

        cashier.shippingMode(mode);
	});


	$("#postcard-note-form").keyup(function(e) {
		var note = e.target.value;
		$("#postcard-note").val(note);
	});

	$("#coupon-code").submit(function() {
		var value = $("#coupon-code-value").val();
		cashier.applyCoupon(value, function(data) {
			if (data.success) {
				var couponPrice = parseFloat(data.amount);

				// detect whether the coupon is for an amount or a percentage
				if (couponPrice < 1 && couponPrice > 0) {
					var amountOff = Math.round(cashier.getPrice() * (1 - couponPrice));
					var percentOff = Math.round((1 - couponPrice) * 100);
					$("<h2>").attr("id","subtotal-coupon")
						.addClass("review-header")
						.html("Coupon:<span>" + percentOff + "% off! -$" + amountOff + ".00</span>")
						.insertAfter("#subtotal-price");
				} else if (couponPrice > 1) {
					$("<h2>").attr("id","subtotal-coupon")
						.addClass("review-header")
						.html("Coupon:<span>-$" + couponPrice + ".00</span>")
						.insertAfter("#subtotal-price");
				}

				// turn the input form into text
				$("#coupon-message").fadeIn('fast').html(value + ' discount applied!')
				$(".coupon-form").hide();

				// store it in our hidden form
				$("#coupon").val(value);
			} else {
				$("#coupon-message").fadeIn('fast').html('Invalid code.');
			}

			self.updated();
		});

		return false;
	});


	/*
		We're using JQuery validate to check all the forms
		of our shipping and credit card input

		If it's valid, we populate the review
	*/
	var checkoutForm = $("#payment-form").validate({
		rules: {
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

	$("#review-button").click(function() {
		if (!user.loggedIn) {
        	forceUserLogin();
        	return false;
        }

        // save this for now
        saver.createOrUpdateMeshu();
	});

    $("#submit-button").click(function(e) {
        if (!user.loggedIn) {
        	forceUserLogin();
        	return false;
        }

        // cash money
        cashier.submit();
    });

    $("#add-to-cart").click(function(){
    	cashier.submit();
    });

	function onFormValidated() {
		if (!user.loggedIn) {
			forceUserLogin(onFormValidated);
			return;
		}

		self.updated();
		self.validated();
		return false;
	}

	function forceUserLogin(callback) {
		user.showModal();

		// after a user logs in, click the button
		user.afterLogIn = function() {
			if (callback) {
				saver.createOrUpdateMeshu(function() {
					// wait a bit...
					setTimeout(callback, 200);
				});
			}
		};
	}


	/*
		updateForm runs when we click 'review your order'
		here's where we populate our hidden form with all of the data we'll be sending
		also telling stripe how much to charge once the "submit" button is pressed
	*/
	function updateForm() {
		// let our stripe object know what object we're purchasing
		// it'll know the price, given the options beforehand
		// we also can't change options once it's set, so no one can mess with it
		var product = sb.materializer.product(),
			material = sb.materializer.material();

		cashier.updateProduct(product, material, cashier.getShipping());

		$("#object-type").val(product);
		$("#object-material").val(material);
		$("#object-color").val(sb.materializer.color().toLowerCase());
		$("#object-amount").val(cashier.getTotalCents());

		$("#svg-theta").val(sb.rotator ? sb.rotator.rotation() : 0);

		// outputting meshu data
		$("#svg-file").val(meshu.outputSVG());
		$("#meshu-data").val(meshu.outputLocationData());
		$("#meshu-title").val(loadedMeshu ? loadedMeshu.title : meshu.outputTitle());

		$("#meshu-renderer").val(meshu.mesh().name);
		$("#meshu-metadata").val(meshu.mesh().outputStyle());

		$("#postcard-note").val($("#postcard-note-form").val());
	}

	/*
		Updating the review order divs
	*/
	function updateReviewText() {

		var product = "One " + sb.materializer.displayName();
		var productType = sb.materializer.color().toLowerCase() + " " + sb.materializer.material();
		$("#review-description").text(product + ", made out of " + productType);

		$("#subtotal-price span").text(cashier.getPriceString());

		$("#shipping-price span").text("$" + cashier.getShipping() + ".00");

		$("#total-price span").text(cashier.getTotalString());

		$("#review-shipping").empty();
		$(".ship-row input").each(function(){
			// skip it if we don't have a value
			if (this.value.length == 0) {
				return;
			}

			// because i'm anal, sorry
			// - s.
			var titleCase = function(str) {
			    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
			};

			this.value = titleCase(this.value);

			var div;
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

	return self;
};