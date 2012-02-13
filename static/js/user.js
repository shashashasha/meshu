var user = function() {
    var self = {};

    self.loggedIn = false;

    self.showModal = function() {
        $("#content").addClass("modal");
        $("#login-form").fadeIn();

        $("#id_username").val('');
        $("#id_password").val('');
        $("#repeat_password").val('');
    };

    self.hideModal = function() {
        $("#content").removeClass("modal");
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
        $("#content").removeClass("modal");
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