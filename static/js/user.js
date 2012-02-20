var user = function() {
    var self = {};

    self.loggedIn = false;

    self.mode = 'signin';

    self.showModal = function() {
        $("#modal-bg").fadeIn();
        $("#login-form").fadeIn();

        $("#id_username").val('');
        $("#id_password").val('');
        $("#repeat_password").val('');
    };

    self.hideModal = function() {
        $("#modal-bg").fadeOut();
        $("#login-form").fadeOut();

        $("#id_username").val('');
        $("#id_password").val('');
        $("#repeat_password").val('');
    };

    self.initialize = function() {
        $("#login").click(self.showModal);

        $("#login-cancel").click(self.hideModal); 

        // switching mode
        $("#login-form li").click(function(){
           var mode = $(this).attr("id").split("-")[1];
           var form = $("#login-form");
           form.attr("class",mode); 
           form.find("li").removeClass("active");
           $(this).addClass("active");

           self.mode = mode;
        });

        $("#login-form input").keypress(function(event) {
            if ( event.which == 13 ) {
                 if (self.mode == 'signin') {
                     $("#login-submit").click();
                 } else if (self.mode == 'account') {
                     $("#login-create").click();
                 }
            }
        });

        /* 
            when logging in 
        */
        // $("#login-form").validate({
        //   rules: {
        //     password: "required",
        //     password_again: {
        //       equalTo: "#password"
        //     }
        $("#login-submit").click(function(e) {
            $.post('/user/login/', { 
                'xhr': 'true', 

                'csrfmiddlewaretoken': $("#csrf input").val(),
                'email': $("#id_username").val(), 
                'password': $("#id_password").val() 
            }, onLogIn, 'json');
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
            }, onLogIn, 'json');
        })

        $("#logout").click(function(e) {
            $.get('/user/logout/', { 'xhr': 'true' }, onLogOut, 'json');
        }); 
    };

    function onLogOut(data) {
        $("#login").show();
        
        $("#profile").hide();
        $("#logout").hide().html('');

        self.loggedIn = false;
    }

    function onLogIn(data) {
        // format this better
        $("#logout").show().html('logout');
        $("#profile").show();

        $("#login").hide();
        $("#modal-bg").fadeOut();
        $("#login-form").hide();

        self.loggedIn = true;

        if (self.afterLogIn) {
            self.afterLogIn();
            self.afterLogIn = null;
        }
    }

    return self;
}();

$(function() {
    user.initialize();
});