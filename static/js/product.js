var sb = sb || {};

$(function() {
	sb.product = function() {
		var self = {};

		var products = ["earrings","pendant","necklace","cufflinks"];
		var transforms = ["scale(.09) translate(830, 710) ","scale(.045) translate(1570, 2200)",
						  "scale(.09) translate(650, 980) ","scale(.075) translate(870, 1170)"];

		self.initialize = function(delaunayFrame) {
			// initialize all products
			for (var i = 0; i < products.length; i++) {
				self.initializeProduct(products[i], transforms[i], delaunayFrame);
			}
		};

		self.initializeProduct = function(product, transform, delaunayFrame) {
			var svg = d3.select("#preview-" + product);
			svg.selectAll("*").remove();
			
			svg.append("svg:image")
				.attr('x', 0)
				.attr('y', 0)
				.attr('width', '100%')
				.attr('height', '100%')
				.attr('xlink:href', static_url + 'images/preview/preview_' + product + '.png');

			var miniDelaunay = $(delaunayFrame).clone()
									// .attr("id","")
									.attr("class","product-delaunay")
									.attr("transform", transform);

			$(svg[0]).append(miniDelaunay);
		};

		self.rotation = function(r) {
			d3.selectAll(".product-delaunay")
				.attr("transform", function(d, i) {
					return transforms[i] + " rotate(" + r + ", 300, 300)";
				});
		};

		return self;
	}();
});