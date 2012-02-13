$(function() {
    $("#login").click(function(e) {
        $("#content").addClass("modal");
        $("#login-form").show();
    });

    $("#login-form li").click(function(){
       var mode = $(this).attr("id").split("-")[1];
       var form = $("#login-form");
       form.attr("class",mode); 
       form.find("li").removeClass("active");
       $(this).addClass("active");
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
            $("#content").removeClass("modal");
            $("#login-form").hide();
        }, 'json');
    });

    $("#login-cancel").click(function(e) {
        $("#content").removeClass("modal");
        $("#login-form").hide();
    }); 

    $("#logout").click(function(e) {
        $.get('/logout/', { 'xhr': 'true' }, function(data) {
            $("#login").show();
            
            $("#profile").hide();
            $("#logout").hide().html('');
        }, 'json');
    }); 
});