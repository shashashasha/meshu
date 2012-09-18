var sb = sb || {};
sb.catalog = function() {
	var self = {};
	var options = {"earrings":
						{"wood":{"price":64,"colors":["Amber"], "discount": .85}},
				   "pendant":
				   		{"wood":{"price":64,"colors":["Amber"], "discount": .85}},
				   "necklace":
				   		{"wood":{"price":68,"colors":["Amber"], "discount": .85}}
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
				product = options[type];
			for (var material in product) {
				prices.push(product[material].price);
			}

			products.push({
				type: type,
				prices: prices,
				discount: .85
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