var sb = sb || {};

$(function() {
	sb.product = function() {
		var self = {};

		var products = ["earrings","pendant","necklace","cufflinks"];

		self.initialize = function(delaunayFrame) {
			// initialize all products
			for (var i = 0; i < products.length; i++) {
				self.initializeProduct(products[i], delaunayFrame);
			}
		};

		self.initializeProduct = function(product, delaunayFrame) {
			var svg = d3.select("#preview-" + product);
			svg.selectAll("*").remove();
			
			svg.append("svg:image")
				.attr('x', 0)
				.attr('y', 0)
				.attr('width', '100%')
				.attr('height', '100%')
				.attr('xlink:href', static_url + 'images/preview/preview_' + product + '.png');

			self.attachMeshu(delaunayFrame, $(svg[0]), sb.transforms.getTransform(product, "product"));
		};

		self.attachMeshu = function(mesh, frame, transform) {
			var miniDelaunay = $(mesh).clone()
				.attr("class","product-delaunay")
				.attr("transform", transform);

			frame.append(miniDelaunay);
		};

		self.rotation = function(r) {
			d3.selectAll(".product-delaunay")
				.attr("transform", function(d, i) {
					var transform = sb.transforms.getTransform(products[i], "product");
					return transform + " rotate(" + r + ", 300, 300)";
				});
		};

		return self;
	}();
});