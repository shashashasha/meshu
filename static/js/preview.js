var sb = sb || {};

$(function() {
	sb.rotator = function(rotateFrame, delaunayFrame, hiddenFrame) {
		var self = {};

		var rotation = 0,
			defaultTransform = "scale(.125) translate(380, 670) ";

		self.initialize = function(rotateFrame, delaunayFrame, hiddenFrame, product) {
			$(rotateFrame).empty();
			var main = d3.select(rotateFrame);
			var transforms = {'earrings':'scale(.125) translate(650, 540)','pendant':'scale(.075) translate(1030, 1470)',
							  'necklace':'scale(.125) translate(510, 760)','cufflinks':'scale(.125) translate(510, 760)'};
			
			// main.append("svg:rect").attr("width","100%").attr("height","100%").attr("fill","#eee");

			// image bg instead of rect
			var image = main.append('svg:image')
				.attr('id', 'previewImage')
				.attr('x', 0)
				.attr('y', 0)
				.attr('width', 200)
				.attr('height', 190)
				.attr('xlink:href', static_url + 'images/preview/preview_'+product+'.png');

			var div = main.append("svg:g")
						.attr("id","transform")
						.attr("transform", transforms[product]);

			var miniDelaunay = $(delaunayFrame).clone().attr("id","mini-delaunay");
			var bounding = $(hiddenFrame).clone().attr("id","rotate-ui");

			$(div[0]).append(miniDelaunay).append(bounding);

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

				div.attr("transform", transforms[product] + " rotate("+(rotation)+",300,300)");
			}

			function mouseup(){
				dragging = false;
				if (d3.event) {
		          d3.event.preventDefault();
		          d3.event.stopPropagation();
		        }
			}
		};

		self.switchProduct = function(product) {
			var imageURL;

			switch(product) {
				case 'earrings':
					imageURL = static_url + 'images/preview/preview_earrings.png';
					defaultTransform = "scale(.125) translate(650, 540) ";
					break;
				case 'smallNecklace':
					imageURL = static_url + 'images/preview/preview_pendant.png';
					defaultTransform = "scale(.075) translate(1030, 1470) ";
					break;
				case 'largeNecklace':
					imageURL = static_url + 'images/preview/preview_necklace.png';
					defaultTransform = "scale(.125) translate(510, 760) ";
					break;
			}

			d3.select("#previewImage").attr("xlink:href", imageURL);
			d3.select("#transform").attr("transform", defaultTransform + " rotate(" + rotation + ",300, 300)");
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

	$("#product-preview svg").live("click",function(){
		var product = $(this).attr("id").split("-")[1];
		$(".make-option").hide();
		$("#make-"+product).show();
		sb.rotator.initialize("#rotate", "#delaunay", "#hidden", product);
	});	
});