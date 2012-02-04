$(function() {
	var options = {"earrings":
						{"acrylic":{"price":"40","colors":["Black","Grey","White"]},
						"wood":{"price":"45","colors":["Amber","Blonde"]},
						"nylon":{"price":"60","colors":["Black","Grey","White"]},
						"silver":{"price":"120"}},
				   "smallNecklace":
				   		{"acrylic":{"price":"30","colors":["Black","Grey","White"]},
						"wood":{"price":"35","colors":["Amber","Blonde"]},
						"nylon":{"price":"50","colors":["Black","Grey","White"]},
						"silver":{"price":"110"}},
				   "largeNecklace":
				   		{"acrylic":{"price":"50","colors":["Black","Grey","White"]},
						"wood":{"price":"55","colors":["Amber","Blonde"]},
						"nylon":{"price":"70","colors":["Black","Grey","White"]},
						"silver":{"price":"140"}}};
	
	var views = ["edit","make","checkout","review"];
	var content = $("#content");

	// create a meshu object for every frame class div
	$(".frame").each(function(i, e) {
		var meshu = sb.meshu(e);
	});

	//navigation
	$(".next").click(function(){
		if (!$(this).hasClass("active")) return;
		var index = views.indexOf(content.attr("class"));
		content.attr("class",views[index+1]);
	});
	$(".back").click(function(){
	    var index = views.indexOf(content.attr("class"));
		content.attr("class",views[index-1]);
	});

	//materials selection
	var objectType, objectMaterial, objectColor;
	$("#object-list li").click(function(){
		objectType = $(this).attr("id");
		$("#material-list li").each(function(){
			var material = $(this).attr("id");
			$(this).find(".price").text("$"+options[objectType][material].price+".00");
			if ($(this).hasClass("selected"))
				$("#total-cost").text("$"+options[objectType][material].price+".00");
		});
	});
	$("#material-list li").click(function(){
		var material = objectMaterial = $(this).attr("id");
		$("#total-cost").text("$"+options[objectType][material].price+".00");
		if (options[objectType][material].colors) {
			var list = $("#color-list li").empty().show();
			$.each(options[objectType][material].colors, function(i, value){
				$("#color-list li").eq(i).text(value).addClass((i == 0) ? "selected" : "");
			});
		} else {
			objectColor = "";
			$(".color-list").hide()
		}
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
	$("#color-list li:first").click();

	//creating the review form
	$("#populateReview").click(function(){

		$("#object-type").val(objectType);
		$("#object-material").val(objectMaterial);
		$("#object-color").val(objectColor);
		$("#object-amount").val(options[objectType][objectMaterial].price+"00");

		$("#review-description").text(objectType + ", made out of " + objectColor + " " + objectMaterial);
		$("#review-price").text("Total Cost: $"+options[objectType][objectMaterial].price+".00");

		$("#shipping-review").empty();
		$(".ship-row input").each(function(){
			$("<p>").text($(this).val()).appendTo("#review-shipping");
		});
		var digits = $(".card-number").val();
		$("#review-payment").text("XXXX-XXXX-XXXX-"+digits.substring(12,16));
	})
	
});