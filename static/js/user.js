$(function() {
    $("#login").click(function(e) {
        $("#login-form").slideDown();
    });

    $("#login-submit").click(function(e) {
        $.get('/login/', { 
            'xhr': 'true', 

            // need to pass these securely
            'username': $("#id_username").val(), 
            'password': $("#id_password").val() 
        }, function(data) {
            // format this better
            $("#logout").show().html(data.username + ': logout');
            $("#profile").show();

            $("#login").hide();
            $("#login-form").slideUp();
        }, 'json');
    });

    $("#login-cancel").click(function(e) {
        $("#login-form").slideUp();
    }); 

    $("#logout").click(function(e) {
        $.get('/logout/', { 'xhr': 'true' }, function(data) {
            $("#login").show();
            
            $("#profile").hide();
            $("#logout").hide().html('');
        }, 'json');
    }); 
});