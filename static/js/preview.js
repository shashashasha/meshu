var sb = sb || {};

$(function() {
	sb.rotator = function(rotateFrame, delaunayFrame, hiddenFrame) {
		var self = d3.dispatch("rotated");

		var rotation = 0,
			defaultTransform = "scale(.125) translate(380, 670) ";

		var transforms = {	
			'earrings': 'scale(.125) translate(650, 540)',
			'pendant': 'scale(.075) translate(1030, 1470)',
		  	'necklace': 'scale(.125) translate(510, 760)',
		  	'cufflinks': 'scale(.125) translate(510, 760)'
		};

		self.update = function(product) {
			$(rotateFrame).empty();

			var main = d3.select(rotateFrame);

			// image bg instead of rect
			var image = main.append('svg:image')
				.attr('id', 'previewImage')
				.attr('x', 0)
				.attr('y', 0)
				.attr('width', 200)
				.attr('height', 190)
				.attr('xlink:href', self.getImage(product));

			var div = main.append("svg:g")
						.attr("id","transform")
						.attr("transform", self.getTransform(product));

			var miniDelaunay = $(delaunayFrame).clone().attr("id","mini-delaunay");
			var bounding = $(hiddenFrame).clone().attr("id","rotate-ui");

			$(div[0]).append(miniDelaunay).append(bounding);

			d3.selectAll("circle.hidden").on("mousedown",mousemove);
			main.on("mouseup",mouseup).on("mousemove",mainmove);

			var startX, startY, endX, endY, theta, oldtheta, dragging, ccw;
			var oldtheta = 0;

			// don't reset rotation because we initialize more than once
			// rotation = 0;

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

				// dispatch rotation event
				self.rotated(rotation);

				div.attr("transform", self.getTransform(product));
			}

			function mouseup(){
				dragging = false;
				if (d3.event) {
		          d3.event.preventDefault();
		          d3.event.stopPropagation();
		        }
			}
		};

		self.getTransform = function(product) {
			return transforms[product] + " rotate(" + rotation + ",300,300)";
		};

		self.getImage = function(product) {
			return static_url + 'images/preview/preview_' + product + '.png';
		};

		self.rotation = function(r) {
			if (!arguments.length) return rotation;

			rotation = r;

			return self;
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

	// have the ids in here for now, dumb
	}("#rotate", "#delaunay", "#hidden");
});