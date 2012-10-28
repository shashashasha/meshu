var sb = sb || {};
sb.catalog = function() {
	var self = {};
	var options = {"earrings":
						{"wood":{"price":75,"colors":["Amber"]},
						"acrylic":{"price":80,"colors":["Black","White"]},
						"nylon":{"price":90,"colors":["Black","White"]},
						"silver":{"price":150,"colors":["Sterling Silver"]}},
				   "pendant":
				   		{"wood":{"price":75,"colors":["Amber"]},
				   		"acrylic":{"price":85,"colors":["Black","White"]},
						"nylon":{"price":90,"colors":["Black","White"]},
						"silver":{"price":130,"colors":["Sterling Silver"]}},
				   "necklace":
				   		{"wood":{"price":80,"colors":["Amber"]},
				   		"acrylic":{"price": 90,"colors":["Black","White"]},
						"nylon":{"price":95,"colors":["Black","White"]},
						"silver":{"price":150,"colors":["Sterling Silver"]}},
					"cufflinks":
						{
						// "stainless":{"price":85},
						"silver":{"price":150}}};

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
				discount: product.discount
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