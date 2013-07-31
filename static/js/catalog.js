var sb = sb || {};
sb.catalog = function(renderer, promo) {
	var self = {},
		materialOptions = {},
		renderer = renderer || 'facet';

	materialOptions.facet = {"earrings":
						{"bamboo":{"price":70,"colors":["amber"]},
						"acrylic":{"price":75,"colors":["black","white"]},
						"nylon":{"price":85,"colors":["black","white"]}
						// "silver":{"price":145,"colors":["sterling"]}
						},
				   "pendant":
				   		{"bamboo":{"price":75,"colors":["amber"]},
				   		"acrylic":{"price":80,"colors":["black","white"]},
						"nylon":{"price":85,"colors":["black","white"]},
						"silver":{"price":145,"colors":["sterling"]}
						},
				   "necklace":
				   		{"bamboo":{"price":80,"colors":["amber"]},
				   		"acrylic":{"price": 85,"colors":["black","white"]},
						"nylon":{"price":90,"colors":["black","white"]},
						"silver":{"price":165,"colors":["sterling"]}
						},
					"cufflinks":
						{"silver":{"price":165,"colors":["sterling"]}
						},
					"ring":
						{"nylon":{"price":30,"colors":["white"]},
						"silver":{"price":120,"colors":["sterling"]}
						}
					};

	materialOptions.radial = {"earrings":
						{"bamboo":{"price":75,"colors":["amber"]},
						"acrylic":{"price":80,"colors":["black","white"]},
						"nylon":{"price":90,"colors":["black","white"]}
						},
				   "pendant":
				   		{"bamboo":{"price":80,"colors":["amber"]},
				   		"acrylic":{"price":85,"colors":["black","white"]},
						"nylon":{"price":95,"colors":["black","white"]},
						"silver":{"price":160,"colors":["sterling"]}
						},
					"coasters":
				   		{"bamboo":{"price":40,"colors":["amber"]},
				   		"acrylic":{"price":45,"colors":["black"]}
						}
					};

	// set the product type options with either facet or radial
	var options = materialOptions[renderer];

	var promotions = {};
	promotions.marathon = {
					"earrings":
						{"bamboo":{"price":64,"colors":["Amber"], "discount": .85, "originalPrice": 75}},
				   	"pendant":
				   		{"bamboo":{"price":64,"colors":["Amber"], "discount": .85, "originalPrice": 75}},
				   	"necklace":
				   		{"bamboo":{"price":68,"colors":["Amber"], "discount": .85, "originalPrice": 80}}
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
		var materials = {};

		for (var i in options[type]) {
			$.each(options[type][i].colors, function(j,v){
				materials[v+"-"+i] = options[type][i].price;
			});
		}
		return materials;
	};

	return self;
};