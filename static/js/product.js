/*

	Product Previews for Meshus
	- copying the delaunay bit over various thumbnails
	- scaling and rotating accordingly

*/
var sb = sb || {};

$(function() {
	sb.product = function() {
		var self = {};

		var products = [];

		self.initialize = function(meshTarget, catalog) {
			products = catalog.getProducts();
			/*
				pretty hacky, but seeing which products are used and hiding the rest
			*/
			// var seenProducts = {};

			// initialize all products
			for (var i = 0; i < products.length; i++) {
				var product = products[i];

				self.resetPreviewImage(product.type);

				if (typeof meshTarget == "string") {
					self.previewFromSelector(product.type, meshTarget);
				} else {
					self.previewFromElement(product.type, meshTarget);
				}

				// seenProducts[product.type] = true;

				// var range = self.describeProductRange(product);
				// $("#range-" + product.type).html(range);
			}

			// $("#product-preview .wrapper").each(function(i, e) {
			// 	var id = e.id.split('-').pop();
			// 	if (!seenProducts[id]) {
			// 		$(e).hide();
			// 	}
			// });
		};

		self.resetPreviewImage = function(product) {
			var svg = d3.select("#preview-" + product);
			svg.select(".product-delaunay").remove();
		};

		/*
			do preview for facet
		*/
		self.previewFromSelector = function(product, meshSelector) {
			var svg = d3.select("#preview-" + product),
				rotation = meshu.mesh().getLongestRotation(),
				projected = meshu.mesh().projectPoints(rotation),
				proportion = projected.width / projected.height,
				transform = sb.transforms.getTransform(product, "product", projected),
				rotatedTransform = transform + meshu.mesh().getLongestRotation(90);

			if (product == 'cufflinks') {
				meshu.mesh().transformedDelaunay(projected, 450, 400, 0);

				var miniDelaunay = $(meshSelector).clone()
					.attr("class","product-delaunay")
					.attr("transform", transform);

				$(svg[0]).append(miniDelaunay);

				meshu.mesh().refresh();

			} else if (product == 'necklace') {
				var endWidth = 450,
					endHeight = 450 / proportion;

				var derotation = 'rotate(-' + [meshu.mesh().getRotationAngle(), 300, 300].join(',') + ')';
				if (proportion > 1.5) {
					endHeight = endHeight * 2;
				}

				meshu.mesh().transformedDelaunay(projected, endWidth, endHeight, 0);

				var miniDelaunay = $(meshSelector).clone()
					.attr("class","product-delaunay")
					.attr("transform", transform + derotation);

				$(svg[0]).append(miniDelaunay);

				meshu.mesh().refresh();

			} else if (product == 'earrings' || product == 'pendant') {
				var miniDelaunay = $(meshSelector).clone()
					.attr("class","product-delaunay")
					.attr("transform", proportion > 1.5 ? rotatedTransform : transform);

				$(svg[0]).append(miniDelaunay);
			}
		};

		/*
			creates product preview from canvas element, turns to dataurl
		*/
		self.previewFromElement = function(product, element) {
			var svg = d3.select("#preview-" + product),
				transform = sb.transforms.getTransform(product, "product");

			svg.append("svg:image")
				.attr('x', 0)
				.attr('y', 0)
				.attr('width', '600px')
				.attr('height', '600px')
				.attr("class","product-delaunay")
				.attr("transform", transform)
				.attr('xlink:href', element.toDataURL());
		};

		self.rotation = function(r) {
			d3.selectAll(".product-delaunay")
				.attr("transform", function(d, i) {
					var transform = sb.transforms.getTransform(products[i].type, "product");
					return transform + " rotate(" + r + ", 300, 300)";
				});
		};

		return self;
	}();
});