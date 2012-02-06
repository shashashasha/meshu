$(function() {
	var patternNames = ["amber,blonde,silver"];
	$(".start-order").live("click",function(){
		setUpRotation();
	});

	function setUpRotation() {
		$("#rotate").empty();
		var main = d3.select("#rotate");
		main.append("svg:rect").attr("width","100%").attr("height","100%").attr("fill","#eee");
		var div = main.append("svg:g")
					.attr("id","transform")
					.attr("transform","scale(.2) translate(200,200)");

		var miniDelaunay = $("#delaunay").clone().attr("id","mini-delaunay");
		var bounding = $("#hidden").clone().attr("id","rotate-ui");

		$("#transform").append(miniDelaunay).append(bounding);

		// this is where pattern support would be put in, it's spec'd out now but needs images and logic
		var patternGroup = main.append("svg:g").attr("id","patterns");
		var patterns = patternGroup.selectAll("pattern").data(patternNames);
			patterns.enter()
				.append("svg:pattern")
				.append("svg:image")
					.attr("id",function(d){ return "pattern-"+d; })
					.attr("xlink:href",function(d){ return "url(../../static/images/patterns/"+d+".png)"; });

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
	}
			
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
});