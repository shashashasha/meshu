$(function() {
	// var options = {"earrings":
	// 					{"acrylic":{"price":"75","colors":["Black","Grey","White"]},
	// 					"wood":{"price":"80","colors":["Amber","Blonde"]},
	// 					"nylon":{"price":"90","colors":["Black","Grey","White"]},
	// 					"silver":{"price":"150"}},
	// 			   "smallNecklace":
	// 			   		{"acrylic":{"price":"70","colors":["Black","Grey","White"]},
	// 					"wood":{"price":"75","colors":["Amber","Blonde"]},
	// 					"nylon":{"price":"85","colors":["Black","Grey","White"]},
	// 					"silver":{"price":"130"}},
	// 			   "largeNecklace":
	// 			   		{"acrylic":{"price":"80","colors":["Black","Grey","White"]},
	// 					"wood":{"price":"85","colors":["Amber","Blonde"]},
	// 					"nylon":{"price":"95","colors":["Black","Grey","White"]},
	// 					"silver":{"price":"150"}}};
	var options = {"earrings":
						{"acrylic":{"price":"50","colors":["Black","Grey","White"]},
						"wood":{"price":"55","colors":["Amber","Blonde"]},
						"nylon":{"price":"60","colors":["Black","Grey","White"]},
						"silver":{"price":"120"}},
				   "smallNecklace":
				   		{"acrylic":{"price":"45","colors":["Black","Grey","White"]},
						"wood":{"price":"50","colors":["Amber","Blonde"]},
						"nylon":{"price":"60","colors":["Black","Grey","White"]},
						"silver":{"price":"100"}},
				   "largeNecklace":
				   		{"acrylic":{"price":"50","colors":["Black","Grey","White"]},
						"wood":{"price":"55","colors":["Amber","Blonde"]},
						"nylon":{"price":"65","colors":["Black","Grey","White"]},
						"silver":{"price":"120"}}};
	var displayNames = {"earrings":"pair of earrings",
						"smallNecklace":"small necklace pendant",
						"largeNecklace":"large necklace pendant"};

	// the type of object we're ordering
	var objectType;
	
	// here's the list of views we have in this flow
	var views = ["edit","make","checkout","review"];
	var content = $("#content");

	// create a stripe payment object
	stripe.options(options);

	// create a meshu object for a single meshu container
	var meshu = sb.meshu($("#meshu-container")[0]);

	if (loadedMeshu) {
		// create a saver object, in saver.js
		saver.initialize(meshu, loadedMeshu.view_url);

		meshu.locationData(loadedMeshu.location_data);

		// checking the page view type, setting our flows accordingly
		switch (pageType) {
			case 'edit':
				views = ["edit","make","checkout","review"];
				break;

			case 'make':
				views = ["edit","make","checkout","review"];
				sb.rotator.initialize("#rotate", "#delaunay", "#hidden");
				break;

			case 'view':
				views = ["view","make","checkout","review"];
				break;

			default:
				views = ["readymade","checkout","review"];

				$("#materials").addClass("ready");
				objectType = loadedMeshu.product;

				var type = displayNames[loadedMeshu.product];
				var capitalized = type.charAt(0).toUpperCase() + type.slice(1);
				$("#readymade-type").text(capitalized);
				break;
		}

		$("#finish-button").addClass("active");
		$("#meshu-container").removeClass("inactive");
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
			meshu.updateBounds();
			meshu.mesh().updateCircleBehavior();
		}
		else if (view == "make") {
			meshu.mesh().updateCircleBehavior(true);
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

			// animate meshu
			meshu.animateTransform(50, 50, .83, sb.rotator ? sb.rotator.rotation() : 0);
		} else if (view == "readymade") {
			meshu.mesh().updateCircleBehavior(true);
		}

		var index = views.indexOf(view);
		content.attr("class", views[index+1]);
	});
	
	$(".back").click(function(){
	    var index = views.indexOf(content.attr("class"));
		content.attr("class", views[index-1]);
		if (views[index-1] == "edit") meshu.mesh().updateCircleBehavior();
		if (views[index-1] == "make" || views[index-1] == "readymade") {
			meshu.mesh().updateCircleBehavior();
			meshu.animateTransform(0, 0, 1, 0);
		}
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
	var objectMaterial, objectColor;
	var objectList = $("#object-list li");
	var materialList = $("#material-list li");
	var colorList = $("#color-list li");
	
	objectList.click(function(){
		objectType = $(this).attr("id");
		materialList.each(function(){
			var material = $(this).attr("id");
			if ($(this).hasClass("selected"))
				$("#total-cost").text("$"+options[objectType][material].price+".00");
		});
	});

	materialList.click(function(){
		var material = objectMaterial = $(this).attr("id");
		$("#total-cost").text("$"+options[objectType][material].price+".00");
		if (options[objectType][material].colors) {
			$(".right-div").fadeIn();
			colorList.find(".color-title").empty();
			colorList.find("img").attr("scr","");

			$.each(options[objectType][material].colors, function(i, value) {
				var li = colorList.eq(i);
				var imgURL = "../static/images/materials/" + material + "_" + value.toLowerCase() + ".png";

				li.find(".color-title").text(value);
				li.find(".color-img img").attr("src", imgURL);
			});
			colorList.eq(0).click();
		} else {
			objectColor = "";
			$(".right-div").fadeOut();
		}
	});
	colorList.click(function(){ 
		objectColor = $(this).find(".color-title").text();
	});

	$(".option-list li").live("click",function(){
		var li = $(this);
		li.parent().find("li").removeClass("selected");
		li.addClass("selected");
	});
	objectList.eq(0).click();
	materialList.eq(0).click();


	/*
		We're using JQuery validate to check all the forms 
		of our shipping and credit card input

		If it's valid, we populate the review
	*/
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
	
	/*
		populateReview runs when we click 'review your order'
		here's where we populate our hidden form with all of the data we'll be sending
		also telling stripe how much to charge once the "submit" button is pressed
	*/
	function populateReview() {
		$("#object-type").val(objectType);
		$("#object-material").val(objectMaterial);
		$("#object-color").val(objectColor);
		$("#object-amount").val(options[objectType][objectMaterial].price + "00");
		
		$("#svg-theta").val(sb.rotator ? sb.rotator.rotation() : 0);

		// outputting meshu data
		$("#svg-file").val(meshu.outputSVG());
		$("#meshu-data").val(meshu.outputLocationData());
		$("#meshu-title").val(loadedMeshu ? loadedMeshu.title : meshu.outputTitle());

		// let our stripe object know what object we're purchasing
		// it'll know the price, given the options beforehand
		// we also can't change options once it's set, so no one can mess with it
		stripe.updateProduct(objectType, objectMaterial);

		updateReviewText();

		$("#review-shipping").empty();
		$(".ship-row input").each(function(){
			$("<p>").text($(this).val()).appendTo("#review-shipping");
		});
		var digits = $("#card-number").val();
		$("#review-payment").text("XXXX-XXXX-XXXX-"+digits.substring(12,16));
	}
	
	/*
		Updating the review order divs
	*/
	function updateReviewText() {
		var title = loadedMeshu ? loadedMeshu.title : meshu.outputTitle();
		$("#review-title").text('"' + title + '"');

		var product = "One " + displayNames[objectType];
		var productType = objectColor.toLowerCase() + " " + objectMaterial;
		$("#review-description").text(product + ", made out of " + productType);

		var price = options[objectType][objectMaterial].price;
		$("#review-price").text("Total Cost: $" + price + ".00");
	}

});