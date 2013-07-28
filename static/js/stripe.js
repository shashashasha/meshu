Stripe.setPublishableKey('pk_GtEuTncR1hDqm7tP3oz9RRM9XOLub');

var cashier = function() {
    var self = {},
        // grab from the page right away
        currentAmount = totalPrice * 100,
        discountAmount = 0,
        discountPercent = 1,
        type = null,
        material = null,
        shipping = 5,
        domesticShipping = 5,
        internationalShipping = 38,
        catalog = null;

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
            form$.append("<input type='hidden' name='stripeToken' value='" + token + "' />");

            form$.get(0).submit();
        }
    }

    self.submit = function() {
        // if we're charging under $20, something's wrong
        if (currentAmount < 2000)   return;

        $('#submit-button')
            .attr("disabled", "disabled")
            .addClass("inactive");
        $(".card-info").removeAttr("name");

        // createToken returns immediately
        // the supplied callback submits the form if there are no errors
        Stripe.createToken({
            number: $('#card-number').val(),
            cvc: $('#card-cvc').val(),
            exp_month: $('#card-expiry-month').val(),
            exp_year: $('#card-expiry-year').val()
        }, currentAmount, stripeResponseHandler);

        // submit form callback
        return false;
    };

    // update the shipping value
    self.shippingMode = function(value) {
        var amount = value == 'international' ? internationalShipping : domesticShipping;
        self.updateProduct(type, material, amount);

        $("#shipping-price span").text(getPriceString(amount));
    };

    self.applyCoupon = function(value, callback) {
        $.get('/order/apply_coupon', {
            code: value
        }, function(data) {
            if (data.success) {
                var amt = parseFloat(data.amount);
                if (amt < 1 && amt > 0) {
                    discountPercent = amt;
                } else if (amt > 0) {
                    discountAmount = parseInt(data.amount);
                }
            }

            if (callback) {
                callback(data);
            }
        }, 'json');
    };

    // let's ... not allow anyone to change these catalog options
    self.catalog = function(o) {
        if (catalog) return;

        catalog = o;
        return self;
    };

    self.updateProduct = function(t, m, s) {
        // ignore if we haven't heard about this product before
        if (!catalog.check(t, m))   return;

        // update values
        shipping = s || 5;
        type = t;
        material = m;

        // keep currentAmount in cents
        currentAmount = self.getTotal() * 100;

        return self;
    };

    self.getPrice = function() {
        return catalog.getPrice(type, material);
    };

    self.getPriceString = function() {
        if (!catalog) return null;

        return '$' + self.getPrice() + '.00';
    };

    self.getShipping = function() {
        return shipping;
    };

    self.getTotal = function() {
        if (!catalog) return null;

        return Math.floor(discountPercent * (self.getPrice() - discountAmount)) + shipping;
    };

    self.getTotalCents = function() {
        if (!catalog) return null;

        return self.getTotal() * 100;
    };

    self.getTotalString = function() {
        if (!catalog) return null;

        return '$' + self.getTotal() + '.00';
    };

    self.getColors = function(type, material) {
        if (!catalog) return null;
        return catalog.getColors(type, material);
    };

    return self;
}();