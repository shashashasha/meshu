// if the user clicks the fb login, log them in to meshu as well
function userFacebookLoggedIn() {
	FB.getLoginStatus(function(response) {
        if (response.status == "connected") {
            user.facebookLogin(response);
        }
    });
}

// if the user clicks the fb login in the checkout process, advance the view
function userFlowFacebookLoggedIn() {
	FB.getLoginStatus(function(response) {
        if (response.status == "connected") {
            user.facebookLogin(response, function() {
            	// this is a wrapper div around the fb login iframe
            	$("#inline-facebook-signin").click();
            });
        }
	});
}

// Load the SDK Asynchronously
(function(d){
    var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement('script'); js.id = id; js.async = true;
    js.src = "//connect.facebook.net/en_US/all.js";
    ref.parentNode.insertBefore(js, ref);
}(document));