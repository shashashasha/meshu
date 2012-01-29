$(function() {
	var options = {"earrings":
						{"acrylic":{"price":"40","colors":["Black","Grey","White"]},
						"wood":{"price":"45","colors":["Amber","Blonde"]},
						"nylon":{"price":"60","colors":["Black","Grey","White"]},
						"silver":{"price":"120","colors":["Silver"]}},
				   "smallNecklace":
				   		{"acrylic":{"price":"30","colors":["Black","Grey","White"]},
						"wood":{"price":"35","colors":["Amber","Blonde"]},
						"nylon":{"price":"50","colors":["Black","Grey","White"]},
						"silver":{"price":"110","colors":["Silver"]}},
				   "largeNecklace":
				   		{"acrylic":{"price":"50","colors":["Black","Grey","White"]},
						"wood":{"price":"55","colors":["Amber","Blonde"]},
						"nylon":{"price":"70","colors":["Black","Grey","White"]},
						"silver":{"price":"140","colors":["Silver"]}}};
	var views = ["edit","make","checkout"];
	var content = $("#content");

	// create a meshu object for every frame class div
	$(".frame").each(function(i, e) {
		var meshu = sb.meshu(e);
	});
	$(".next").click(function(){
		var index = views.indexOf(content.attr("class"));
		content.attr("class",views[index+1]);
	});
	$(".back").click(function(){
	    var index = views.indexOf(content.attr("class"));
		content.attr("class",views[index-1]);
	});

	var currentObject;
	$("#object-list li").click(function(){
		currentObject = $(this).attr("id");
		$("#material-list li").each(function(){
			var material = $(this).attr("id");
			$(this).find(".price").text("$"+options[currentObject][material].price+".00");
			if ($(this).hasClass("selected"))
				$("#total-cost").text("$"+options[currentObject][material].price+".00");
		});
	});
	$("#material-list li").click(function(){
		var material = $(this).attr("id");
		$("#total-cost").text("$"+options[currentObject][material].price+".00");
		if (options[currentObject][material].colors) {
			var list = $("#color-list").empty().show();
			$.each(options[currentObject][material].colors, function(i, value){
				$("<li>").text(value).addClass((i == 0) ? "selected" : "").appendTo(list);
			});
		} else $(".color-list").hide();
	});
	$(".option-list li").live("click",function(){
		var li = $(this);
		li.parent().find("li").removeClass("selected");
		li.addClass("selected");
	});
	$("#object-list li:first").click();
	$("#material-list li:first").click();

	
});