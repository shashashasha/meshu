$(function() {
    $("#login").click(function(e) {
        $("#content").addClass("modal");
        $("#login-form").fadeIn();

        $("#id_username").val('');
        $("#id_password").val('');
        $("#repeat_password").val('');
    });

    $("#login-cancel").click(function(e) {
        $("#content").removeClass("modal");
        $("#login-form").fadeOut();

        $("#id_username").val('');
        $("#id_password").val('');
        $("#repeat_password").val('');
    }); 

    // switching mode
    $("#login-form li").click(function(){
       var mode = $(this).attr("id").split("-")[1];
       var form = $("#login-form");
       form.attr("class",mode); 
       form.find("li").removeClass("active");
       $(this).addClass("active");
    });

    /* 
        when logging in 
    */
    $("#login-submit").click(function(e) {
        $.post('/user/login/', { 
            'xhr': 'true', 

            'csrfmiddlewaretoken': $("#csrf input").val(),
            'email': $("#id_username").val(), 
            'password': $("#id_password").val() 
        }, loggedIn, 'json');
    });

    /* 
        when creating an account
    */
    $("#login-create").click(function(e) {
        $.post('/user/create/', {
            'xhr': 'true',

            'csrfmiddlewaretoken': $("#csrf input").val(),
            'email': $("#id_username").val(), 
            'password': $("#id_password").val() 
        }, loggedIn, 'json');
    })

    $("#logout").click(function(e) {
        $.get('/user/logout/', { 'xhr': 'true' }, loggedOut, 'json');
    }); 

    function loggedOut(data) {
        $("#login").show();
        
        $("#profile").hide();
        $("#logout").hide().html('');
    }

    function loggedIn(data) {
        // format this better
        $("#logout").show().html('logout');
        $("#profile").show();

        $("#login").hide();
        $("#content").removeClass("modal");
        $("#login-form").hide();
    }
});