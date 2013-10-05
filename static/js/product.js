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

			// initialize all products
			for (var i = 0; i < products.length; i++) {
				var product = products[i];

				self.resetPreviewImage(product.type);

				if (typeof meshTarget == "string") {
					self.previewFromSelector(product.type, meshTarget);
				} else {
					self.previewFromElement(product.type, meshTarget);
				}
			}
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
				mesh = meshu.mesh(),
				rotation = mesh.getLongestRotation(),
				projected = mesh.projectPoints(rotation),
				proportion = projected.width / projected.height,
				transform = sb.transforms.getTransform(product, "product"),
				rotatedTransform = transform + mesh.getLongestRotation(90),
				derotation = 'rotate(-' + [mesh.getRotationAngle(), 140, 200].join(',') + ')';

			// sf|honolulu|nyc|miami|detroit
			if (product == 'cufflinks' || product == 'necklace') {
				var endWidth = 450,
					endHeight = 400,
					finaltransform = product == 'necklace' ? derotation + transform : transform;

				if (product == 'necklace') {
					endHeight = 450 / proportion;
					if (proportion > 2) {
						endHeight = endHeight * 2;
					}
				}

				mesh.transformedDelaunay(projected, endWidth, endHeight);

				var miniDelaunay = $(meshSelector).clone()
					.attr("class","product-delaunay")
					.attr("transform", finaltransform);

				$(svg[0]).append(miniDelaunay);

				mesh.refresh();

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