var sb = sb || {};

sb.viewhandler = function() {
	var self = d3.dispatch("updated", "next", "prev");

	// here's the list of views we have in this flow
	var views = ["edit","product","make","add-ons","checkout","review"];
	var content = $("#content");

	$("#content").waypoint(function(){
		$("body").addClass("scrolled");
	}, { offset: 10 });

	$("#edit").waypoint(function(direction) {
		if (direction == "down") {
			onNext();
		}
		else onPrev();
	}, { offset: function() {
	    return -70;
	  } });

	$("#add-ons").waypoint(function(direction) {
		if (direction == "down")
			// populate review forms, update prices
			sb.ui.orderer.updated();
	}, { offset: "bottom-in-view" });

	//navigation
	function onNext() {
		var view = self.view();
		var index = views.indexOf(view);
		var advanceView = function() {
			content.attr("class", views[index+1]);
		};

		self.next();
		advanceView();
	};

	function onPrev() {
		var view = self.view();

	    var index = views.indexOf(view);
	    var prev = views[index-1];

		content.attr("class", prev);
		self.prev();
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