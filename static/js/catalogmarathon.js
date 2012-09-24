var sb = sb || {};
sb.catalog = function() {
	var self = {};
	var options = {"earrings":
						{"wood":{"price":64,"colors":["Amber"], "discount": .85, "originalPrice": 75}},
				   "pendant":
				   		{"wood":{"price":64,"colors":["Amber"], "discount": .85, "originalPrice": 75}},
				   "necklace":
				   		{"wood":{"price":68,"colors":["Amber"], "discount": .85, "originalPrice": 80}}
				   	};

	// check if this exists
	self.check = function(type, material) {
		return options[type] && options[type][material];
	};

	self.get = function(type, material, key) {
		if (!options[type] || !options[type][material])	
			return 'N/A';

		return options[type][material][key];
	};

	self.getPrice = function(type, material) {
		return self.get(type, material, 'price');
	};

	self.getColors = function(type, material) {
		return self.get(type, material, 'colors');
	};

	self.getProducts = function() {
		var products = [];

		for (var type in options) {
			var prices = [],
				originals = [],
				discounts = [],
				product = options[type];

			for (var material in product) {
				prices.push(product[material].price);

				if (product[material].originalPrice)
					originals.push(product[material].originalPrice);

				if (product[material].discount)
					discounts.push(product[material].discount);
			}

			products.push({
				type: type,
				prices: prices,
				originals: originals,
				// just use one discount for now
				// assuming we won't have multiple different ones
				discount: discounts.length ? discounts[0] : undefined
			});
		}

		return products;
	};

	self.getMaterials = function(type) {
		var materials = [];

		for (var i in options[type]) {
			materials.push(i);
		}
		return materials;
	};

	return self;
}();