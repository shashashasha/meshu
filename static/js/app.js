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

	// create a meshu object for a single meshu container
	var meshu = sb.meshu($("#meshu-container")[0]);

	if (loadedMeshu) {
		// create a saver object, in saver.js
		saver.initialize(meshu, loadedMeshu.view_url);

		meshu.locationData(loadedMeshu.location_data);
		if (pageType == "edit")
			views = ["edit","make","checkout","review"];
		else if (pageType == "make") {
			views = ["edit","make","checkout","review"];
			sb.rotator.initialize("#rotate", "#delaunay", "#hidden");
		}
		else if (pageType == "view")
			views = ["view","make","checkout","review"];
		else {
			views = ["readymade","checkout","review"];
			$("#materials").addClass("ready");
		}
		$("#finish-button").addClass("active");
		var rows = loadedMeshu.location_data.split("|");
		$.each(rows,function(i,row){
			var cols = row.split("\t");
			if (cols.length == 3) {
				$("<li>").text(cols[2]).appendTo($("#display-places"));	
			}
		});
		d3.select("#place-number").attr("class","").select(".title-text")
            .text(function(d){
                d.title = loadedMeshu.title;
                meshu.updateTitle(d.title);
                return d.title;
            });
	}

	if (!user.loggedIn && !(loadedMeshu && pageType != "edit")) {
		var helpdiv = $("<div>").attr("id","edit-help")
						.append($("<h2>").text("It's easy to get started!"),
							$("<p>").text("Search for a place"),
							$("<p>").text("Or just click on the map"),
							$("<p>").text("Ok, I'm ready!").attr("id","close-help"));
		content.append(helpdiv);
		$("#modal-bg").fadeIn();
		$("#close-help").click(function(){
			$("#edit-help").fadeOut();
			$("#modal-bg").fadeOut();
		});
	}

	//navigation
	$(".next").click(function(){
		if (!$(this).hasClass("active")) return;
		var view = content.attr("class");
		
		if (view == "edit") {
			meshu.mesh().updateCircleBehavior();
		}
		else if (view == "make") {
			// break the flow if they're not logged in
			if (!user.loggedIn)	{
				user.showModal();
				var button = $(this);

				// after a user logs in, click the "checkout button"
				user.afterLogIn = function() {
					button.click();
				};
				return;
			}

			var counter = 0;
			var rotateInterval = setInterval(function(){
				if (counter < 20){
					d3.select("#delaunay")
						.attr("transform","translate(50,50) scale(.83) rotate("+(sb.rotator ? sb.rotator.rotation() : 0)+",300,300)");
					counter++;
				}
				else
				clearInterval(rotateInterval);
			},40);
		}

		var index = views.indexOf(view);
		content.attr("class", views[index+1]);
	});
	
	$(".back").click(function(){
	    var index = views.indexOf(content.attr("class"));
		content.attr("class", views[index-1]);
		if (views[index-1] == "edit") meshu.mesh().updateCircleBehavior();
		if (views[index-1] == "make") 
			d3.select("#delaunay")
				.attr("transform","translate(0,0) scale(1) rotate(0,300,300)");
	});

	var timer;
	$("#img-thumbs img").click(function(){
		clearTimeout(timer);

		// <3
		var id = $(this).attr("id");
		if (!id) {
			$(".other-view").removeClass("active");
			timer = setTimeout(function(){ $(".other-view").removeClass("z-1"); },1000);
		}
		else {
			$("#l-"+id).addClass("active z-1");
		}
	});

	$(".show-places").click(function(){
		$("#display-places").slideToggle();
		$(".show-places").toggle();
	})

	//materials selection
	var objectType = "earrings";
	var objectMaterial, objectColor;
	$("#object-list li").click(function(){
		objectType = $(this).attr("id");
		$("#material-list li").each(function(){
			var material = $(this).attr("id");
			if ($(this).hasClass("selected"))
				$("#total-cost").text("$"+options[objectType][material].price+".00");
		});
	});
	$("#material-list li").click(function(){
		var material = objectMaterial = $(this).attr("id");
		$("#total-cost").text("$"+options[objectType][material].price+".00");
		if (options[objectType][material].colors) {
			$(".right-div").fadeIn();
			var list = $("#color-list li").empty();
			$.each(options[objectType][material].colors, function(i, value){
				$("#color-list li").eq(i).text(value);
			});
		} else {
			objectColor = "";
			$(".right-div").fadeOut()
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


	//validating!
	$("#payment-form").validate({
			rules: {
				shipping_zip: {
					digits: true,
			      	minlength: 5
			    },
			    shipping_state: {
			    	minlength: 2
			    },
			    card_number: {
			    	creditcard: true
			    },
			    card_cvc: {
			    	digits: true,
			    	minlength: 3
			    },
			    card_month: {
			    	digits: true,
			    	minlength: 2
			    },
			    card_year: {
			    	digits: true,
			    	minlength: 4,
			    }
			},
			messages: {
				shipping_state: "Please enter the two-letter state abbreviation.",
				card_cvc: "Sorry, that is not a valid CVC code",
				card_month: {
					minlength: "Please enter the month as a two-digit number."
				}, card_year: {
					minlength: "Please enter the year as a four-digit number.",
				},
			},
			submitHandler: function(){
				content.attr("class","review");
				populateReview();
			}
	});

	function populateReview() {
		$("#object-type").val(objectType);
		$("#object-material").val(objectMaterial);
		$("#object-color").val(objectColor);
		$("#object-amount").val(options[objectType][objectMaterial].price+"00");
		
		$("#svg-theta").val(sb.rotator ? sb.rotator.rotation() : 0);

		// outputting meshu data
		$("#svg-file").val(meshu.outputSVG());
		$("#meshu-data").val(meshu.outputLocationData());
		$("#meshu-title").val(loadedMeshu ? loadedMeshu.title : meshu.outputTitle());

		$("#review-title").text('"'+(loadedMeshu ? loadedMeshu.title : meshu.outputTitle())+'"');
		$("#review-description").text(objectType + ", made out of " + objectColor + " " + objectMaterial);
		$("#review-price").text("Total Cost: $"+options[objectType][objectMaterial].price+".00");

		$("#review-shipping").empty();
		$(".ship-row input").each(function(){
			$("<p>").text($(this).val()).appendTo("#review-shipping");
		});
		var digits = $("#card-number").val();
		$("#review-payment").text("XXXX-XXXX-XXXX-"+digits.substring(12,16));
	}
	
});