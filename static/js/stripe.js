Stripe.setPublishableKey('pk_GtEuTncR1hDqm7tP3oz9RRM9XOLub');

var cashier = function() {
    var self = {},
        // grab from the page right away
        // this is probably dumb
        currentAmount = totalPrice || 0,
        discountAmount = 0,
        discountPercent = 1,
        shipping = 7, // default domestic
        domesticShipping = 7,
        internationalShipping = 35,
        multipleInternationalShipping = 70;

    function stripeResponseHandler(status, response) {
        if (response.error) {
            // re-enable the submit button
            $('#submit-button').removeAttr("disabled").removeClass("inactive");

            $(".payment-note").css({
                color: '#FF3FB4'
            }).html('There was an error processing your card. Maybe there was a typo?');

            // click anywhere to revert this
            $(window).click(function() {
                $(".payment-note").css({
                    color: '#8F8F8F'
                }).html('All of our payments are securely handled through <a href="https://stripe.com/help/security" target="_blank">Stripe</a>');
            });
        } else {
            var form$ = $("#payment-form");
            // token contains id, last4, and card type
            var token = response['id'];
            // insert the token into the form so it gets submitted to the server
            form$.append("<input type='hidden' name='stripe_token' value='" + token + "' />");
            form$.append("<input type='hidden' name='coupon_amount' value='" + self.getDiscountCents() + "' />");
            form$.append("<input type='hidden' name='shipping_amount' value='" + self.getShippingCents() + "' />");
            form$.append("<input type='hidden' name='final_amount' value='" + self.getFinalCents() + "' />");

            form$.get(0).submit();
        }
    }

    self.submit = function() {
        // if we're charging under $20, something's wrong
        if (self.getFinalCents() < 2000)   return;

        $('#submit-button')
            .attr("disabled", "disabled")
            .addClass("inactive");
        $(".card-info").removeAttr("name");

        $(".loading").show();

        // createToken returns immediately
        // the supplied callback submits the form if there are no errors
        Stripe.createToken({
            number: $('#card-number').val(),
            cvc: $('#card-cvc').val(),
            exp_month: $('#card-expiry-month').val(),
            exp_year: $('#card-expiry-year').val()
        }, self.getFinalCents(), stripeResponseHandler);

        // submit form callback
        return false;
    };

    self.update = function() {
        if (shipping == 0) {
            $("#shipping-price .dollar").html('<span class="pink">free!&nbsp;</span>')
            $("#shipping-price .num").html('<span style="text-decoration: line-through;">$5.00</span>');
        } else {
            $("#shipping-price .dollar").text('$')
            $("#shipping-price .num").text(shipping + '.00');
        }
        $("#total-price .num").text(self.getTotal() + '.00');
    };

    // update the shipping value
    self.shippingMode = function(value) {
        var numRings = 0, boxedItems = 0;
        // $(".cart-row .num").each(function(v,i){ numItems += parseInt($(this).text()); });

        $(".earrings .num").each(function(v,i){ boxedItems += parseInt($(this).text()); });
        $(".necklace .num").each(function(v,i){ boxedItems += parseInt($(this).text()); });
        $(".pendant .num").each(function(v,i){ boxedItems += parseInt($(this).text()); });
        $(".cufflinks .num").each(function(v,i){ boxedItems += parseInt($(this).text()); });

        $(".ring .num").each(function(v,i){ numRings += parseInt($(this).text()); });

        if (boxedItems > 0 || numRings > 0)
            shipping = value == 'international' ?
                            (boxedItems > 2 ? multipleInternationalShipping : internationalShipping)
                            : domesticShipping;
        else shipping = domesticShipping;

        if (value == 'international') {
            $(".medium_poster .num").each(function(v,i){ 
                shipping += parseInt($(this).text())*4; 
            });
            $(".large_poster .num").each(function(v,i){ 
                shipping += parseInt($(this).text())*10; 
            });
            $(".small_poster .num").each(function(v,i){ 
                shipping += parseInt($(this).text())*4; 
            });
        }

        self.update();
    };

    self.shippingCountry = function(country) {
        switch (country) {
            case 'United States':
                shipping = domesticShipping;
                break;
            case 'Canada':
                shipping = internationalShipping = 25;
                break;
            default:
                shipping = internationalShipping = 35;
        }
        self.shippingMode(country == 'United States' ? 'domestic' : 'international');
    };

    self.applyCoupon = function(value, callback) {
        $.get('/order/apply_coupon', {
            code: value
        }, function(data) {
            if (data.success) {
                // store the actual code used
                $("#payment-form").append("<input type='hidden' name='coupon_code' value='" + value + "' />");

                var amt = parseFloat(data.amount);
                if (amt < 1 && amt > 0) {
                    discountPercent = amt;

                    discountAmount = Math.round(self.getPrice() * (1 - discountPercent));
                    var percentOff = Math.round((1 - discountPercent) * 100);
                    data.message = '(' + percentOff + '% off!) -$' + discountAmount + '.00';
                } else if (amt > 0) {
                    discountAmount = parseInt(data.amount);
                    data.message = '-$' + discountAmount + '.00';
                }
            } else {
                discountAmount = 0;
                discountPercent = 1;
            }

            if (callback) {
                callback(data);
            }
        }, 'json');
    };

    // dollars
    self.getPrice = function() {
        return currentAmount;
    };

    self.getTotal = function() {
        return Math.floor(self.getPrice() - discountAmount) + shipping;
    };

    self.getShippingCents = function() {
        return shipping * 100;
    };

    self.getDiscountCents = function() {
        return discountAmount * 100;
    };

    self.getFinalCents = function() {
        return Math.floor(self.getTotal() * 100);
    };

    return self;
}();