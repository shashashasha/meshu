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
		meshu.locationData(loadedMeshu.location_data);
		if (pageType == "view")
			views = ["edit","view","make","checkout","review"];
		else {
			views = ["readymade","checkout","review"];
			$("#materials").addClass("ready");
		}
		var rows = loadedMeshu.location_data.split("|");
		$.each(rows,function(i,row){
			var cols = row.split("\t");
			if (cols.length == 3) {
				$("<li>").text(cols[2]).appendTo($("#display-places"));	
			}
			checkListHeight();
		})
	} 

	//navigation
	$(".next").click(function(){
		if (!$(this).hasClass("active")) return;
		var view = content.attr("class");
		var index = views.indexOf(view);
		content.attr("class",views[index+1]);
		if (view == "edit") meshu.mesh().updateCircleBehavior();
	});
	$(".back").click(function(){
	    var index = views.indexOf(content.attr("class"));
		content.attr("class",views[index-1]);
	});
	// this only applies to usermade meshus
	$("#save-button").click(function() {
		$("#save-button").html('saving');

		$.get(window.location.href + '/save', { 
      'xhr': 'true', 
			'svg': meshu.outputSVG(),
			'location_data': meshu.outputLocationData()
    }, function(data) {

    	// create new meshu_id element in the form
    	var id = data.meshu_id;
	    $("#hidden-form-values").append('<input type="hidden" id="meshu-id" name="meshu_id" />');
    	$("#meshu-id").val(id);

    	setTimeout(function() {
    		$("#save-button").html('saved!');
    	}, 200);

    	setTimeout(function() {
      	// advance to the next 'page'
			var index = views.indexOf(content.attr("class"));
			content.attr("class",views[index+1]);
      	}, 500);

      	setTimeout(function() {
      		$("#save-button").html('save');
      	}, 1000);
      }, 'json');

      var list = $("#display-places");
      list.empty();
      $(".place .name").each(function(){
      	$("<li>").text($(this).text()).appendTo(list);	
      });
      checkListHeight();
	});

	function checkListHeight() {
		var list = $("#display-places");
		if (list.height() > 410){
            list.css("overflow-y","scroll");
        } else list.css("overflow-y","auto");
	}

	//materials selection
	var objectType, objectMaterial, objectColor;
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
			$(".right-div").slideDown();
			var list = $("#color-list li").empty();
			$.each(options[objectType][material].colors, function(i, value){
				$("#color-list li").eq(i).text(value);
			});
		} else {
			objectColor = "";
			$(".right-div").slideUp()
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
	$("#review-button").click(function(){
		
		$("#object-type").val(objectType);
		$("#object-material").val(objectMaterial);
		$("#object-color").val(objectColor);
		$("#object-amount").val(options[objectType][objectMaterial].price+"00");
		
		$("#svg-theta").val(sb.rotator ? sb.rotator.rotation() : 0);

		// outputting meshu data
		$("#svg-file").val(meshu.outputSVG());
		$("#meshu-data").val(meshu.outputLocationData());

		$("#review-description").text(objectType + ", made out of " + objectColor + " " + objectMaterial);
		$("#review-price").text("Total Cost: $"+options[objectType][objectMaterial].price+".00");

		$("#review-shipping").empty();
		$(".ship-row input").each(function(){
			$("<p>").text($(this).val()).appendTo("#review-shipping");
		});
		var digits = $(".card-number").val();
		$("#review-payment").text("XXXX-XXXX-XXXX-"+digits.substring(12,16));
	});
	
});