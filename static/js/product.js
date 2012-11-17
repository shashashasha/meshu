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
			var seenProducts = {};

			console.log('initializing product display', meshTarget, catalog);

			// initialize all products
			for (var i = 0; i < products.length; i++) {
				var product = products[i];

				if (typeof meshTarget == "string") {
					self.previewFromSelector(product.type, meshTarget);
				} else {
					console.log(typeof meshTarget);
					self.previewFromElement(product.type, meshTarget);
				}
				
				seenProducts[product.type] = true;

				var range = self.describeProductRange(product);
				$("#range-" + product.type).html(range);
			}

			$("#product-preview .wrapper").each(function(i, e) {
				var id = e.id.split('-').pop();
				if (!seenProducts[id]) {
					$(e).hide();
				}
			});
		};

		self.previewFromSelector = function(product, meshSelector) {
			var svg = d3.select("#preview-" + product),
				transform = sb.transforms.getTransform(product, "product");

			svg.selectAll("*").remove();
			
			svg.append("svg:image")
				.attr('x', 0)
				.attr('y', 0)
				.attr('width', '100%')
				.attr('height', '100%')
				.attr('xlink:href', static_url + 'images/preview/preview_' + product + '.png');

			var miniDelaunay = $(meshSelector).clone()
				.attr("class","product-delaunay")
				.attr("transform", transform);

			$(svg[0]).append(miniDelaunay);
		};

		self.previewFromElement = function(product, element) {
			var svg = d3.select("#preview-" + product),
				transform = sb.transforms.getTransform(product, "product");

			svg.selectAll("*").remove();
			
			svg.append("svg:image")
				.attr('x', 0)
				.attr('y', 0)
				.attr('width', '100%')
				.attr('height', '100%')
				.attr('xlink:href', static_url + 'images/preview/preview_' + product + '.png');

			var frame = svg.append("svg:foreignobject")
				.attr("transform", transform)
				.append("body");

			console.log('appending', element, d3.select(element));
			$(frame[0]).append(element);
			// frame.append(d3.select(element));
		};

		self.range = function(prices) {
			return prices.length == 1 
					? "$" + prices[0] 
					: "$" + prices[0] + "-" + prices[prices.length - 1];
		};

		self.describeProductRange = function(product) {
			if (product.discount != undefined) {
				var range = "<del>" + self.range(product.originals) + "</del>";
				
				range += " " + self.range(product.prices);

				range += product.discount < 1 
					? " (" + Math.floor((1 - product.discount) * 100) + "% off!)"
					: " ($" + product.discount + " off!)";
					
				return range;
			} else {
				return self.range(product.prices);
			}
		};

		self.attachMeshu = function(mesh, frame, transform) {
		};

		self.thumbnail = function(mesh, frame, transform) {
			var miniDelaunay = $(mesh).clone()
				.attr("class","product-delaunay")
				.attr("transform", transform);

			d3.select(frame[0])
				.append('svg:rect')
					.attr('x', 0)
					.attr('y', 0)
					.attr('width', '100%')
					.attr('height', '100%');

			frame.append(miniDelaunay);
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