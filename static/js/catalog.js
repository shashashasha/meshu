var sb = sb || {};
sb.catalog = function(renderer, promo) {
	var self = {},
		materialOptions = {},
		renderer = renderer || 'facet';

	materialOptions.facet = {"earrings":
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
						{"silver":{"price":150}}
					};

	materialOptions.radial = {"earrings":
						{"wood":{"price":75,"colors":["Amber"]},
						"acrylic":{"price":80,"colors":["Black","White"]},
						"nylon":{"price":90,"colors":["Black","White"]}},
				   "pendant":
				   		{"wood":{"price":75,"colors":["Amber"]},
				   		"acrylic":{"price":85,"colors":["Black","White"]},
						"nylon":{"price":95,"colors":["Black","White"]},
						"silver":{"price":140,"colors":["Sterling Silver"]}}
					};

	// set the product type options with either facet or radial
	var options = materialOptions[renderer];

	var promotions = {};
	promotions.marathon = {
					"earrings":
						{"wood":{"price":64,"colors":["Amber"], "discount": .85, "originalPrice": 75}},
				   	"pendant":
				   		{"wood":{"price":64,"colors":["Amber"], "discount": .85, "originalPrice": 75}},
				   	"necklace":
				   		{"wood":{"price":68,"colors":["Amber"], "discount": .85, "originalPrice": 80}}
				   	};

	if (promo && promotions[promo]) {
		options = promotions[promo];
	}

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

	/*
		this is ugly, but I want to remove catalog.marathon.js
	*/
	if (promo) {
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
	} else {
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
	}

	self.getMaterials = function(type) {
		var materials = [];

		for (var i in options[type]) {
			materials.push(i);
		}
		return materials;
	};

	return self;
};