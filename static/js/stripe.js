Stripe.setPublishableKey('pk_9Lu9WnR6pvkYDKKXFFH5UFF31vQzH');

function stripeResponseHandler(status, response) {
    console.log(status, response);
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
function submit() {
        $('#submit-button').attr("disabled", "disabled").addClass("inactive");
        var chargeAmount = 1000; //amount you want to charge, in cents. 1000 = $10.00, 2000 = $20.00 ...
        // createToken returns immediately - the supplied callback submits the form if there are no errors
        Stripe.createToken({
            number: $('.card-number').val(),
            cvc: $('.card-cvc').val(),
            exp_month: $('.card-expiry-month').val(),
            exp_year: $('.card-expiry-year').val()
        }, chargeAmount, stripeResponseHandler);
        return false; // submit from callback
}

$("#submit-button").click(function(){ submit(); })

// test card 4242424242424242
$(document).ready(function() {
    
    // $("#payment-form").submit(function(event) {
    //     // disable the submit button to prevent repeated clicks
        
    // });
});