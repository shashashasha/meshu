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
					self.previewFromSelector(product.type, meshTarget, "#preview-" + product.type);
				} else {
					self.previewFromElement(product.type, meshTarget);
				}
			}
		};

		self.resetPreviewImage = function(product) {
			var svg = d3.select("#preview-" + product);
			svg.select(".product-transformer").remove();
		};

		/*
			do preview for facet
		*/
		self.previewFromSelector = function(product, meshSelector, destinationSelector) {
			var group = d3.select(destinationSelector)
				.append("g")
	            .attr("class", "product-transformer"),
				mesh = meshu.mesh(),
				projected = mesh.projectPoints(mesh.getLongestRotation()),
				proportion = projected.width / projected.height,
				transform = sb.transforms.getTransform(product, "product"),
				endRotation = -mesh.getRotationAngle(),
				endWidth = 0, endHeight = 0;

			switch (product) {
				// no rotation, squarify
				case 'cufflinks':
					endWidth = 450;
					endHeight = 400;
					break;
				// rotate to horizontal if it's skinny, stretch if skinny
				case 'necklace':
					endWidth = 450;
					endHeight = 450 / proportion;
					if (proportion > 2) {
						endHeight = (450 / proportion) * 1.5;
						endRotation = 0;
					}
					break;
				// rotate to vertical if it's skinny, stretch if skinny
				case 'earrings':
				case 'pendant':
				default:
					endWidth = 450;
					endHeight = 450 / proportion;
					if (proportion > 2) {
						endHeight = (450 / proportion) * 2;
						endRotation = 90;
					}
					break;
			}

			// resize and rotate to longest angle
			mesh.transformedDelaunay(projected, endWidth, endHeight);

			// clones and recenters delaunay on its centerpoint
			self.cloneSVG(group[0], meshSelector, endWidth, endHeight);

			// final transform
			group.attr("transform", transform + ' rotate(' + endRotation + ')');

			// clear mesh geometry
			mesh.refresh();

			return group;
		};

		self.cloneSVG = function(parent, childSelector, w, h) {
			var miniDelaunay = $(childSelector).clone()
				.attr("class","product-delaunay")
				.attr("transform", "translate(-" + w/2 + ", -" + h/2 + ")");
			$(parent).append(miniDelaunay);
		};

		/*
			creates product preview from canvas element, turns to dataurl
		*/
		self.previewFromElement = function(product, element) {
			var svg = d3.select("#preview-" + product),
				transform = sb.transforms.getTransform(product, "product");

			var g = svg.append("g")
				.attr("class", "product-transformer")
				.attr("transform", transform);

			g.append("svg:image")
				.attr('x', 0)
				.attr('y', 0)
				.attr('width', '600px')
				.attr('height', '600px')
				.attr("class","product-delaunay")
				.attr("transform", "translate(-300, -300)")
				.attr('xlink:href', element.toDataURL());
		};

		return self;
	}();
});