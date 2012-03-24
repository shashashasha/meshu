var sb = sb || {};

$(function() {
	sb.product = function(rotateFrame, delaunayFrame) {
		var self = {};

		var products = ["earrings","pendant","necklace","cufflinks"];
		var transforms = ["scale(.09) translate(830, 710) ","scale(.045) translate(1570, 2200)",
						  "scale(.09) translate(650, 980) ","scale(.075) translate(1030, 1470) "];

		self.initialize = function(rotateFrame, delaunayFrame) {
			var main = d3.select(rotateFrame);

			for (var i = 0; i < products.length; i++) {
				var svg = d3.select("#preview-"+products[i]);
				svg.selectAll("*").remove();
				
				svg.append("svg:image")
					.attr('x', 0)
					.attr('y', 0)
					.attr('width', '100%')
					.attr('height', '100%')
					.attr('xlink:href', static_url + 'images/preview/preview_'+products[i]+'.png');

				var miniDelaunay = $(delaunayFrame).clone()
										.attr("id","")
										.attr("class","product-delaunay")
										.attr("transform",transforms[i]);

				$(svg[0]).append(miniDelaunay);
			}
		}

		self.rotation = function(r) {
			d3.selectAll(".product-delaunay")
				.attr("transform", function(d, i) {
					return transforms[i] + " rotate(" + r + ", 300, 300)";
				});
		};

		return self;
	}();
});