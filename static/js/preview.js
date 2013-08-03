var sb = sb || {};

$(function() {
	sb.rotator = function(rotateFrame, delaunayFrame, hiddenFrame) {
		var self = d3.dispatch("rotated");

		var rotation = 0,
			defaultTransform = "scale(.125) translate(380, 670) ";

		self.update = function(product) {
			$(rotateFrame).empty();

			var main = d3.select(rotateFrame);

			// image bg instead of rect
			var image = main.append('svg:image')
				.attr('id', 'previewImage')
				.attr('x', 0)
				.attr('y', 0)
				.attr("width",313)
				.attr("height",297)
				.attr('xlink:href', self.getImage(product));

			var div = main.append("svg:g")
						.attr("id","transform")
						.attr("transform", self.getTransform(product));

			var bounding = $(hiddenFrame).clone().attr("class","rotate-ui");

			var miniDelaunay = $(delaunayFrame).clone()
				.attr("class","mini-delaunay");

			$(div[0]).append(miniDelaunay).append(bounding);

			if (product == "pendant") {
				main.select(".rotate-ui").attr("class","hidden pendant")
					.selectAll("circle").attr("r","55");
			}

			d3.selectAll("circle.rotation").on("mousedown",mousemove);
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

				// dispatch rotation event
				// self.rotated(rotation);

				div.attr("transform", self.getTransform(product));
			}

			function mouseup(){
				dragging = false;
				if (d3.event) {
		          d3.event.preventDefault();
		          d3.event.stopPropagation();
		        }
			}
			function rotateBig(deg) {
				rotation = (rotation + deg) % 360;
				div.attr("transform", self.getTransform(product));
			}
			$("#rotate-cw").click(function(){
				rotateBig(22.5);
			});
			$("#rotate-ccw").click(function(){
				rotateBig(-22.5);
			});
		};

		self.updateRing = function() {
			var main = $("#final-ring .frame");

			var ringPreview = $(".ring-preview-frame").clone();

			$(main).append(ringPreview);

			var scale = d3.scale.linear().domain([4,14]).range([.8,1.2]);
			$("#ring-range").change(function(e){
				$("#ring-number").text(e.currentTarget.value);
				var s = scale(e.currentTarget.value);
    			ringPreview.css({
    				"-moz-transform" : "rotateX(20deg) rotateY(0deg) rotateZ(45deg) translate3d(0px,0px,0px) scale("+s+")",
    				"-webkit-transform" : "rotateX(20deg) rotateY(0deg) rotateZ(45deg) translate3d(0px,0px,0px) scale("+s+")"
    			});
			});
		};

		self.getTransform = function(product) {
			// using the product preview one for now, can fix later
			return sb.transforms.getTransform(product, "product") + " rotate(" + rotation + ",300,300)";
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
	}("#rotate", ".delaunay", ".hidden");
});