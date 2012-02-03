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
	
	var views = ["edit","make","checkout","review"];
	var content = $("#content");

	// create a meshu object for every frame class div
	$(".frame").each(function(i, e) {
		var meshu = sb.meshu(e);
	});

	//navigation
	$(".next").click(function(){
		var index = views.indexOf(content.attr("class"));
		content.attr("class",views[index+1]);
	});
	$(".back").click(function(){
	    var index = views.indexOf(content.attr("class"));
		content.attr("class",views[index-1]);
	});

	//materials selection
	var currentObject, objectMaterial, objectColor;
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
		var material = objectMaterial = $(this).attr("id");
		$("#total-cost").text("$"+options[currentObject][material].price+".00");
		if (options[currentObject][material].colors) {
			var list = $("#color-list li").empty().show();
			$.each(options[currentObject][material].colors, function(i, value){
				$("#color-list li").eq(i).text(value).addClass((i == 0) ? "selected" : "");
			});
		} else $(".color-list").hide();
	});
	$("#color-list li").click(function(){ 
		objectColor = $(this).text();
	});

	$(".option-list li").live("click",function(){
		var li = $(this);
		li.parent().find("li").removeClass("selected");
		li.addClass("selected");
	});
	$("#object-list li:first").click();
	$("#material-list li:first").click();

	//creating the review form
	$("#populateReview").click(function(){
		$("#review-description").text("You want a " + objectColor + " " + currentObject + " made out of " + objectMaterial);
		$("#review-shipping").text("Ship to: " + $(".ship-name").val());
	})
	
});