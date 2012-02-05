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
	var delaunay;
	var rotation = 0;

	// create a meshu object for every frame class div
	$(".frame").each(function(i, e) {
		var meshu = sb.meshu(e);
	});

	$("#finish").live("click",function(){
		$("#rotate").empty();
		var main = d3.select("#rotate");
		main.append("svg:rect").attr("width","100%").attr("height","100%").attr("fill","#eee");
		var div = main.append("svg:g").attr("id","transform")
					.attr("transform","scale(.2) translate(200,200)");
		delaunay = $("#delaunay");
		var miniDelaunay = delaunay.clone().attr("id","mini-delaunay");
		var bounding = $("#hidden").clone().attr("id","rotate-ui");
		$("#transform").append(miniDelaunay).append(bounding);
		d3.selectAll("circle.hidden").on("mousedown",mousemove);
		main.on("mouseup",mouseup).on("mousemove",mainmove);
		var startX, startY, endX, endY, theta, oldtheta, dragging, ccw;
		var oldtheta = 0;

		function mousemove(){
			var m = d3.svg.mouse(main.node());
			startX = m[0] - 100, startY = m[1] - 100;
			dragging = true;
		}
		function mainmove() {
			if (!dragging) return;
			var m = d3.svg.mouse(main.node());
			endX = m[0] - 100, endY = m[1] - 100;
			ccw = clockize(startX, startY, endX, endY);
			var start = Math.sqrt(Math.pow(startX,2)+Math.pow(startY,2));
			var end = Math.sqrt(Math.pow(endX,2)+Math.pow(endY,2));
			theta =  Math.acos((startX*endX + startY*endY)/(start*end)) * 180/Math.PI;
			rotation = ccw ? (rotation - theta) % 360 : (rotation + theta) % 360;
			if (isNaN(rotation)) rotation = 0;
			startX = endX, startY = endY;
			div.attr("transform","scale(.2) translate(200,200) rotate("+(rotation)+",300,300)");
		}
		function mouseup(){
			dragging = false;
			if (d3.event) {
	          d3.event.preventDefault();
	          d3.event.stopPropagation();
	        }
		}
	});

	function clockize(x1, y1, x2, y2) {
		if (x2 > x1) {
			if (y1 > 0 && y2 > 0) return true;
			else return false;
		} else if (x2 < x1) {
			if (y1 < 0 && y2 < 0) return true;
			else return false;
		} else {
			if (y2 < y1){
				if (x1 > 0) return true;
				else return false
			} else {
				if (x1 < 0) return true;
				else return false;
			}
		}
	}

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
		var dataString = "";
		$.each(places, function(i){
			var dataPoint = lats[i] + "\t" + lons[i] + "\t" + places[i] + "\n";
			dataString += dataPoint;
		});

		$("#object-type").val(objectType);
		$("#object-material").val(objectMaterial);
		$("#object-color").val(objectColor);
		$("#object-amount").val(options[objectType][objectMaterial].price+"00");
		
		// serializing svg
		var serializedSVG = $("#delaunay").parent().parent().html();
		$("#svg-file").val(serializedSVG);

		$("#svg-theta").val(rotation);
		$("#meshu-data").val(dataString);

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