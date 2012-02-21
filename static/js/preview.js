var sb = sb || {};

$(function() {
	sb.rotator = function(rotateFrame, delaunayFrame, hiddenFrame) {
		var self = {};

		var rotation = 0;

		self.initialize = function(rotateFrame, delaunayFrame, hiddenFrame) {
			$(rotateFrame).empty();
			var main = d3.select(rotateFrame);
			main.append("svg:rect").attr("width","100%").attr("height","100%").attr("fill","#eee");
			var div = main.append("svg:g")
						.attr("id","transform")
						.attr("transform","scale(.2) translate(200,200)");

			var miniDelaunay = $(delaunayFrame).clone().attr("id","mini-delaunay");
			var bounding = $(hiddenFrame).clone().attr("id","rotate-ui");

			$("#transform").append(miniDelaunay).append(bounding);

			d3.selectAll("circle.hidden").on("mousedown",mousemove);
			main.on("mouseup",mouseup).on("mousemove",mainmove);

			var startX, startY, endX, endY, theta, oldtheta, dragging, ccw;
			var oldtheta = 0;
			rotation = 0;

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
		};

		self.rotation = function() {
			return rotation;
		};
				
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

		return self;
	}();

	$(".start-order").live("click",function(){
		sb.rotator.initialize("#rotate", "#delaunay", "#hidden");
	});	
});