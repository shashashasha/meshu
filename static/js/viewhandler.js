var sb = sb || {};

sb.viewhandler = function() {
	var self = d3.dispatch("updated", "next", "prev");

	// here's the list of views we have in this flow
	var views = ["edit","product","make","account","checkout","review"];
	var content = $("#content");

	self.updateViews = function(pageType) {
		switch (pageType) {
			case 'edit':
				views = ["edit","product","make","account","checkout","review"];
				break;

			case 'view':
				views = ["view"];
				break;

			case 'product':
				views = ["product","make","account","checkout","review"];
				break;

			default:
				views = ["readymade","account","checkout","review"];
				break;
		}
	};

	self.updateAccountView = function() {
		if (user.loggedIn) {
			//take out account view
			checkAccountView();
		}
	};

	self.initialize = function() {
		$(".next").live("click", onNext);
		$(".back").click(onPrev);
	};

	//navigation
	function onNext() {
		if (!$(this).hasClass("active")) return;

		var button = $(this);
		var view = self.view();
		var index = views.indexOf(view);
		var advanceView = function() {
			content.attr("class", views[index+1]);
		};

		// if you're logged in, let's just save it as you go
		if (view == 'edit' && user.loggedIn) {
			// save this meshu
			saver.createOrUpdateMeshu();
		}

		if (view == 'make' || view == 'readymade') {
			checkAccountView();

			/*
				if we're on a readymade or make page, 
				we need to click the next button after we log in
			*/
			user.afterLogIn = function() {
				saver.createOrUpdateMeshu(function() {
					button.click();
				});
			};
		}
		
		if (view == 'account' && !user.loggedIn) {
			/*
				i don't understand why this callback is not... getting called back anymore
				but it may have something to do with user.js and the facebook login flow
			*/
			user.afterLogIn = function() {
				saver.createOrUpdateMeshu(function() {
					button.click();
				});
			};

			return;
		}

		self.next();
		user.updateLogoutActions(view);
		advanceView();
	};
	
	function onPrev() {
		var view = self.view();

		if (view == 'checkout') {
			checkAccountView();
		}

		/*
			if we logged ourselves out during the flow, 
			make sure that the next time we hit the login screen
			we click 'a' next button. this is dumb.
		*/
		if (!user.loggedIn) {
			user.afterLogIn = function() {
				saver.createOrUpdateMeshu(function() {
					$($(".next")[0]).click();
				});
			};
		}

	    var index = views.indexOf(view);
	    var prev = views[index-1];
	    
		content.attr("class", prev);
		self.prev();
	};

	/*
		add or remove the login/signup screen in the order flow
		this makes it so if someone logs in or out during the order
		we can adapt to it, vs checking on load
	*/
	function checkAccountView() {
		var i = views.indexOf("account");
		if (user.loggedIn) {
			if (i >= 0) {
				views.splice(i, 1);
			}
			$("#account").css("visibility","hidden");
			
		} else {
			if (i == -1) {
				views.splice(-2, 0, "account");
			}
			$("#account").css("visibility","visible");
				$("#account li").click(function(){
	            var mode = $(this).attr("id").split("-")[1];
	            var form = $("#account");

	            form.attr("class",mode); 
	            form.find("li").removeClass("active");

	            $(this).addClass("active");
	        });
		}
	};

	self.view = function(v) {
		if (!arguments.length) return content.attr("class");

		var index = views.indexOf(v);
		if (index != -1) {
			content.attr("class", views[index]);
			view = v;	
		}
	};

	return self;
}();