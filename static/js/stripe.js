Stripe.setPublishableKey('pk_GtEuTncR1hDqm7tP3oz9RRM9XOLub');

var orderer = function() {
    var self = {},
        //amount you want to charge, in cents. 1000 = $10.00, 2000 = $20.00 ...
        currentAmount = 0, 
        discountAmount = 0,
        type = null,
        material = null,
        product = null,
        shipping = 4,
        options = null;

    function stripeResponseHandler(status, response) {
        if (response.error) {
            // re-enable the submit button
            $('#submit-button').removeAttr("disabled");
            // show the errors on the form
            $(".payment-errors").html(response.error.message);
        } else {
            var form$ = $("#payment-form");
            // token contains id, last4, and card type
            var token = response['id'];
            // insert the token into the form so it gets submitted to the server
            form$.append("<input type='hidden' name='stripeToken' value='" + token + "' />");
            // and submit
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

    self.applyCoupon = function(value, callback) {
        $.get('/order/apply_coupon', {
            code: value
        }, function(data) {
            if (data.success) {
                discountAmount = parseInt(data.amount);
            }

            if (callback)
                callback(data);
        }, 'json');
    };

    // let's ... not allow anyone to change these options
    self.options = function(o) {
        if (options) return;

        options = o;
        return self;
    };

    self.updateProduct = function(t, m, s) {
        console.log(t, m, s, options);
        // ignore if we haven't heard about this product before
        if (!options[t] || !options[t][m]) return;

        // update values
        shipping = s || 4;
        type = t;
        material = m;

        // keep currentAmount in cents
        currentAmount = (options[type][material].price + shipping - discountAmount) * 100;
        
        return self;
    };

    self.getPrice = function() {
        if (!options) return null;
        return options[type][material].price;
    };

    self.getPriceString = function() {
        if (!options) return null;
        
        return '$' + options[type][material].price + '.00';
    };

    self.getTotal = function() {
        if (!options) return null;

        return options[type][material].price + shipping - discountAmount;
    };

    self.getTotalCents = function() {
        if (!options) return null;

        return (options[type][material].price + shipping - discountAmount) * 100;
    };

    self.getTotalString = function() {
        if (!options) return null;

        return '$' + (options[type][material].price + shipping - discountAmount) + '.00';
    };

    self.getColors = function(type, material) {
        if (!options) return null;
        return options[type][material].colors;
    };

    return self;
}();