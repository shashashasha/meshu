var sb = sb || {};

$(function() {
	sb.rotator = function(rotateFrame, delaunayFrame, hiddenFrame) {
		var self = d3.dispatch("rotated", "ringSizeUpdated");

		var rotation = 0,
			defaultTransform = "scale(.125) translate(380, 670) ",
			rotationDiv,
			currentProduct;

		self.update = function(product) {
			$(rotateFrame).empty();

			// set default
			currentProduct = product;
			rotation = rotation || sb.transforms.getDefaultRotation(currentProduct);
			console.log('default rotation', rotation);

			var main = d3.select(rotateFrame);

			// image bg instead of rect
			var image = main.append('svg:image')
				.attr('id', 'previewImage')
				.attr('x', 0)
				.attr('y', 0)
				.attr("width",313)
				.attr("height",297)
				.attr('xlink:href', self.getImage(currentProduct));

			rotationDiv = main.append("svg:g")
						.attr("id","transform")
						.attr("transform", self.getTransform(currentProduct, 'product', rotation));

			var miniDelaunay = $(delaunayFrame).clone()
				.attr("class","mini-delaunay");

			$(rotationDiv[0]).append(miniDelaunay);
		};

	    // save the rotation for now
	    var cr = 0, rotateInterval;
		function rotateBig(deg) {
	        if (rotateInterval) {
	            clearInterval(rotateInterval);
	        }

	        // old rotation
	        cr = rotation;
			rotation = (rotation + deg);

	        var counter = 0;
	        rotateInterval = setInterval(function(){
	            if (++counter < 30) {
	                cr += (rotation - cr) * .15;
	                var transform = sb.transforms.getTransform(currentProduct, "product", cr);
	                rotationDiv.attr("transform", transform);
	            }
	            else
	                clearInterval(rotateInterval);
	        }, 40);
		}
		$("#rotate-cw").click(function(){
			rotateBig(22.5);
		});
		$("#rotate-ccw").click(function(){
			rotateBig(-22.5);
		});

		self.updateRing = function() {
			var main = $("#final-ring .frame").empty();

			var ringPreview = $(".ring-preview-frame").clone();

			$(main).append(ringPreview);
			// self.ringSizeUpdated(7);

			var scale = d3.scale.linear().domain([4,14]).range([.8,1.2]);
			$("#ring-range").change(function(e){
				var size = e.currentTarget.value;
				$("#ring-number").text(size);
				self.ringSizeUpdated(size);
				sb.ui.orderer.updated();
				var s = scale(size);
    			ringPreview.css({
    				"-moz-transform" : "rotateX(15deg) rotateY(0deg) rotateZ(45deg) translate3d(0px,0px,0px) scale("+s+")",
    				"-webkit-transform" : "rotateX(15deg) rotateY(0deg) rotateZ(45deg) translate3d(0px,0px,0px) scale("+s+")"
    			});
			});

		};

		self.getTransform = function(product) {
			// using the product preview one for now, can fix later
			return sb.transforms.getTransform(product, "product", rotation);
		};

		self.getImage = function(product) {
			return static_url + 'images/preview/preview_' + product + '.png';
		};

		self.rotation = function(r) {
			if (!arguments.length) return rotation % 360;

			rotation = r;

			return self;
		};

		return self;

	// have the ids in here for now, dumb
	}("#rotate", ".delaunay", ".hidden");
});