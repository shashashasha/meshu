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
				orientation = sb.transforms.getOrientation(product),
				transform = sb.transforms.getTransform(product, "product");

			// resize and rotate to longest angle
			mesh.transformedDelaunay(projected, orientation.width, orientation.height);

			// clones and recenters delaunay on its centerpoint
			self.cloneSVG(group[0], meshSelector, orientation.width, orientation.height);

			// final transform
			group.attr("transform", transform + ' rotate(' + orientation.rotation + ')');

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

			if ($("body").hasClass("streets")) {

				// get the pixel data from the canvas
				var ctx = element.getContext('2d');
				var alphaPixels = 0;

				var data = ctx.getImageData(0,0, ctx.canvas.width,ctx.canvas.height).data;
				for(var i=3; i<data.length; i+=4) {
					if(data[i] > 0) alphaPixels++;
				}
				var density = alphaPixels / (ctx.canvas.width * ctx.canvas.height);
				
				d3.select("#product-preview").classed("dense",density > .33);
				if ($(".wrapper.selected")) $(".wrapper.selected").click();

				d3.select("#wrapper-" + product)
					.select(".product-transformer")
					.attr("src",element.toDataURL());
			} else {
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
			}
		};

		return self;
	}();
});