var user = function() {
    var self = {};

    self.loggedIn = false;

    self.mode = 'account';


    self.showModal = function(mode) {
        mode = mode || 'account';

        $("#login-error").hide();

        $("#modal-bg").fadeIn();
        $("#login-form").fadeIn();

        $("#tab-" + mode).click();

        $(".login-row").find("input").val('');
    };

    self.hideModal = function() {
        $("#modal-bg").fadeOut();
        $("#login-form").fadeOut();
        $(".login-row").find("input").val('');
        $(".login-row").find(".error").remove();
    };

    self.initialize = function() {
        $("#login").click(function() {
            self.showModal('signin');
        });

        $(".login-cancel").click(self.hideModal); 

        // switching mode
        $("#login-form li").click(function(){
            var mode = $(this).attr("id").split("-")[1];

            var form = $("#login-form");

            form.attr("class",mode); 
            form.find("li").removeClass("active");

            $(this).addClass("active");

            self.mode = mode;
        });

        $(".login-row input").keypress(function(event) {
            if ( event.which == 13 ) {
                 if (self.mode == 'signin') {
                     $("#login-signin").click();
                 } else if (self.mode == 'account') {
                     $("#login-account").click();
                 }
            }
        });

        /* 
            when logging in 
        */
        $("#form-signin").validate({
            rules: {
                signin_name: {
                    email: true
                }
            },
            messages: {
                signin_name: "Sorry, that's not a valid email format."
            },
            submitHandler: function(){
                $.post('/user/login/', { 
                    'xhr': 'true', 
                    'csrfmiddlewaretoken': $("#csrf input").val(),
                    'email': $("#signin_name").val(), 
                    'password': $("#signin_password").val() 
                }, onLogIn, 'json');
            }
        });


        $("#inline-signin").validate({
            rules: {
                inline_signin_name: {
                    email: true
                }
            },
            messages: {
                inline_signin_name: "Sorry, that's not a valid email format."
            },
            submitHandler: function(){
                var post = { 
                    'xhr': 'true', 
                    'csrfmiddlewaretoken': $("#csrf input").val(),
                    'email': $("#inline_signin_name").val(), 
                    'password': $("#inline_signin_password").val() 
                };
                console.log(post);
                $.post('/user/login/', post, onLogIn, 'json');
            }
        });

        $("#form-account").validate({
            rules: {
                account_name: {
                    email: true
                },
                repeat_password: {
                    equalTo: "#account_password"
                }
            },
            messages: {
                account_name: "Sorry, that's not a valid email format.",
                repeat_password: "Oops, those passwords didn't match. Try again?"
            },
            submitHandler: function(){
                $.post('/user/create/', {
                    'xhr': 'true',

                    'csrfmiddlewaretoken': $("#csrf input").val(),
                    'email': $("#account_name").val(), 
                    'password': $("#account_password").val() 
                }, onLogIn, 'json');
            }
        });

        $("#inline-account").validate({
            rules: {
                inline_account_name: {
                    email: true
                },
                inline_repeat_password: {
                    equalTo: "#inline_account_password"
                }
            },
            messages: {
                inline_account_name: "Sorry, that's not a valid email format.",
                inline_repeat_password: "Oops, those passwords didn't match. Try again?"
            },
            submitHandler: function(){
                $.post('/user/create/', {
                    'xhr': 'true',

                    'csrfmiddlewaretoken': $("#csrf input").val(),
                    'email': $("#inline_account_name").val(), 
                    'password': $("#inline_account_password").val() 
                }, onLogIn, 'json');
            }
        });

        $("#logout").click(function(e) {
            $.get('/user/logout/', { 'xhr': 'true' }, onLogOut, 'json');
        }); 
    };

    /*
        on some views we want logout to redirect people to a new page
    */
    self.updateLogoutActions = function(view) {
        switch (view) {
            case 'user':
                self.logoutRedirect = '/shop/';
                break;

            case 'view':
                // refresh to remove the user buttons
                self.logoutRedirect = window.location.href;
                break;

            default:
                self.logoutRedirect = null;
                break;
        }
    };

    function onLogOut(data) {
        $("#login").show();
        
        $("#profile").hide();
        $("#logout").hide().html('');

        self.loggedIn = false;

        // if we want to redirect on logout, set this property
        if (self.logoutRedirect) {
            window.location.href = self.logoutRedirect;
        }
    }

    function onLogIn(data) {
        console.log('log in response:', data, self.afterLogIn);
        // if the login information was incorrect
        if (!data.success) {
            $("#login-error").fadeIn();
            $("#login-form").click(function() {
                $("#login-error").hide();
            });

            if (data.duplicate) {
                $("#account-message").html("Oops, looks like you already registered with that email.<br />Try logging in?");
            }
            return;
        }

        $("#account-message").html("Don't worry, we'll never give your email address to anyone else. We hate spam as much as you do!");

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