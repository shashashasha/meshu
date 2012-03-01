Stripe.setPublishableKey('pk_9Lu9WnR6pvkYDKKXFFH5UFF31vQzH');

var orderer = function() {
    var self = {},
        //amount you want to charge, in cents. 1000 = $10.00, 2000 = $20.00 ...
        currentAmount = 0, 
        options;

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
    }

    // let's ... not allow anyone to change these options
    self.options = function(o) {
        if (options) return;

        options = o;
        return self;
    };

    self.updateProduct = function(type, material) {
        // ignore if we haven't heard about this product before
        if (!options[type] || !options[type][material]) return;

        currentAmount = parseInt(options[type][material].price) * 100;
        return self;
    };

    self.getPrice = function(type, material) {
        if (!options) return null;
        return options[type][material].price;
    };

    self.getPriceString = function(type, material) {
        if (!options) return null;
        return '$' + options[type][material].price + '.00';
    };

    self.getColors = function(type, material) {
        if (!options) return null;
        return options[type][material].colors;
    };

    return self;
}();