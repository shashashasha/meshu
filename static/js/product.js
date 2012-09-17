var sb = sb || {};

$(function() {
	sb.product = function() {
		var self = {};

		var products = [];

		self.initialize = function(delaunayFrame, catalog) {
			products = catalog.getProducts();

			/* 
				pretty hacky, but seeing which products are used and hiding the rest
			*/
			var seenProducts = {};

			// initialize all products
			for (var i = 0; i < products.length; i++) {
				var product = products[i],
					prices = product.prices;


				self.initializeProduct(product.type, delaunayFrame);
				seenProducts[product.type] = true;

				var range = prices.length == 1 
					? "$" + prices[0] 
					: "$" + prices[0] + "-" + prices[prices.length - 1];

				if (product.discount != undefined) {
					range += product.discount < 1 
						? " (" + Math.floor((1 - product.discount) * 100) + "% off!)"
						: " ($" + product.discount + " off!)";
				}
				console.log(product, product.discount, range);
				
				$("#range-" + product.type).html(range);
			}

			$("#product-preview .wrapper").each(function(i, e) {
				var id = e.id.split('-').pop();
				if (!seenProducts[id]) {
					$(e).hide();
				}
			});
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
					var transform = sb.transforms.getTransform(products[i], "product");
					return transform + " rotate(" + r + ", 300, 300)";
				});
		};

		return self;
	}();
});