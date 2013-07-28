/*

	Pulling apart some JQuery listeners
	from app.js into here.

	The idea is that stuff in here either
	listens to events related to the purchasing
	form or modifies the purchasing form.

*/
$(function() {
	// switching from international to domestic, or vice versa
	$("#shipping-destination li").click(function() {
        var mode = this.id.split("-").pop();

        var form = $("#shipping-destination");

        $("#shipping-form").attr("class", mode);
        form.find("li").removeClass("active");
        $(this).addClass("active");

        console.log('switching mode', mode);
        cashier.shippingMode(mode);
	});

	// set default shipping mode
	cashier.update();

	$("#coupon-code").submit(function() {
		var value = $("#coupon-code-value").val();
		cashier.applyCoupon(value, function(data) {
			if (!data.success) {
				$("#coupon-message").fadeIn('fast').html('Invalid code.');
				return;
			}

			$("<h2>").attr("id","subtotal-coupon")
				.addClass("review-header")
				.html("Coupon:<span>" + data.message + "</span>")
				.insertAfter("#subtotal-price");

			// turn the input form into text
			$("#coupon-message").fadeIn('fast').html(value + ' discount applied!')
			$(".coupon-form").hide();

			// store it in our hidden form
			$("#coupon").val(value);
			cashier.update();
		});

		return false;
	});


	/*
		We're using JQuery validate to check all the forms
		of our shipping and credit card input

		If it's valid, we populate the review
	*/
	var checkoutForm = $("#payment-form").validate({
		debug: true,
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
		    	minlength: 4
		    },
		    email_address: {
		    	email: true
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
		submitHandler: function(form) {
			// don't actually submit the form
			// stripe.js needs to get the token,
			// then the form can be submitted
			cashier.submit();
			return false;
		}
	});

	return self;
});