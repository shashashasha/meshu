/*

	Pulling apart some JQuery listeners
	from app.js into here.

	The idea is that stuff in here either
	listens to events related to the purchasing
	form or modifies the purchasing form.

*/
$(function() {
	var self = d3.dispatch("validated", "updated");

	// switching from international to domestic, or vice versa
	$("#shipping-destination li").click(function() {
        var mode = $(this).attr("id").split("-").pop();

        var form = $("#shipping-destination");

        $("#shipping-form").attr("class", mode);
        form.find("li").removeClass("active");
        $(this).addClass("active");

        cashier.shippingMode(mode);
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

    $("#submit-button").click(function(e) {
        console.log('submitting');

        $("#payment-form")[0].submit();
    });

	function onFormValidated() {
		console.log('submit validated');

		self.updated();
		self.validated();
		return false;
	}

	return self;
});