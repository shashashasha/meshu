var sb = sb || {};
sb.catalog = function(renderer, promo) {
	var self = {},
		materialOptions = {},
		renderer = renderer || 'facet';

	materialOptions.facet = {"earrings":
						{"bamboo":{"price":75,"colors":["amber"]},
						"acrylic":{"price":80,"colors":["black","white"]},
						"nylon":{"price":85,"colors":["white"]}
						},
				   "pendant":
				   		{"bamboo":{"price":80,"colors":["amber"]},
				   		"acrylic":{"price":85,"colors":["black","white"]},
						"nylon":{"price":90,"colors":["white"]},
						"brass":{"price":135,"colors":["polished"]},
						"silver":{"price":145,"colors":["sterling"]}
						},
				   "necklace":
				   		{"bamboo":{"price":85,"colors":["amber"]},
				   		"acrylic":{"price": 90,"colors":["black","white"]},
						// "nylon":{"price":90,"colors":["black","white"]},
						"silver":{"price":165,"colors":["sterling"]},
						"brass":{"price":155,"colors":["polished"]}
						},
					"cufflinks":
						{"silver":{"price":155,"colors":["sterling"]},
						"brass":{"price":145,"colors":["polished"]}
						},
					"ring":
						{"nylon":{"price":30,"colors":["white"]},
						"silver":{"price":120,"colors":["sterling"]},
						"brass":{"price":110,"colors":["polished"]}
						}
					};

	materialOptions.radial = {"earrings":
						{"bamboo":{"price":80,"colors":["amber"]},
						"acrylic":{"price":85,"colors":["black","white"]},
						"nylon":{"price":95,"colors":["white"]}
						},
				   "pendant":
				   		{"bamboo":{"price":80,"colors":["amber"]},
				   		"acrylic":{"price":85,"colors":["black","white"]},
						"nylon":{"price":95,"colors":["black","white"]},
						"silver":{"price":155,"colors":["sterling"]},
						"brass":{"price":145,"colors":["polished"]}
						},
					"coasters":
				   		{"bamboo":{"price":45,"colors":["amber"]},
				   		"acrylic":{"price":90,"colors":["black"]}
						}
					};

	materialOptions.print = {
						"postcard":
						{
							"unframed":{"price":5,"colors":[]}
						},
						"small_poster":
						{
							"unframed":{"price":25,"colors":[]},
							"framed":{"price":45,"colors":[]}
						},
						"large_poster":
						{
							"unframed":{"price":45,"colors":[]},
							"framed":{"price":115,"colors":[]}
						},
					};

	makeTimes = {
		"bamboo":"2-3 Weeks",
		"acrylic":"2-3 Weeks",
		"nylon":"2-3 Weeks",
		"silver":"3-4 Weeks",
		"brass":"3-4 Weeks",
		"unframed":"1-2 Weeks",
		"framed":"2-3 Weeks",
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

	self.getMakeTime = function(material) {
		return makeTimes[material];
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