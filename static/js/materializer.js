var sb = sb || {};

sb.materializer = function() {
	var self = d3.dispatch("update"),
		options,
		display,
		productNames,
		product,
		material,
		color;

	self.initialize = function(o, d, p) {
		options = o;
		display = d;
		productNames = p;

		// list elements
		self.materials = $("#material-list li");
		self.colors = $("#color-list li");

		self.materials.click(function(e) {
			self.material(e.target.id);
		});

		self.colors.click(function(e) {
			self.color(e.target.innerHTML);
		});

		$(".option-list li").live("click",function(){
			var li = $(this);
			li.parent().find("li").removeClass("selected");
			li.addClass("selected");
		});
	};

	self.product = function(p) {
		if (!arguments.length) return product;

		product = p;
		var materials = options[p];

		self.materials.hide();

		// reset the material
		material = null;

		// loop through the material options
		for (var i in materials) {
			if (!material) {
				self.material(i);
			}

			$("#" + i).show();
		}

		var type = display[product];
		var capitalized = type.charAt(0).toUpperCase() + type.slice(1);
		$("#readymade-type").text(capitalized);

		return self;
	};

	/*
		Sets the internal material variable
		And adds a 'selected' class to the material list element
		Updates the selected color
	*/
	self.material = function(m) {
		if (!arguments.length)	return material;

		material = m;

		self.materials.removeClass("selected");
		$("#" + material).addClass("selected");

		var colors = options[product][material].colors;
		if (colors) {
			self.colors.find(".color-title").empty();
			self.colors.find("img").attr("src","");
		
			$(".options.right").fadeIn();
			$.each(colors, function(i, c) {
				var li = self.colors.eq(i);
				var imgURL = static_url + "images/materials/" + material + "_" + c.toLowerCase() + ".png";

				li.find(".color-title").text(c);
				li.find(".color-img img").attr("src", imgURL);
				li.attr("id", "color-" + c.toLowerCase());
			});

			// select the first color
			self.color(colors[0]);
		} else {
			$(".options.right").fadeOut();
			self.color('');
		}

		// update the pricing
		orderer.updateProduct(product, material);
		$("#total-cost").text(orderer.getPriceString());

		return self;
	};

	/*
		Sets the internal color variable
		And adds a 'selected' class to the list element
	*/
	self.color = function(c) {
		if (!arguments.length) return color;

		color = c;

		self.colors.removeClass("selected");
		$("#color-" + color.toLowerCase()).addClass("selected");
		self.update();

		return self;
	};

	self.productName = function() {
		return productNames[product];
	};

	self.displayName = function() {
		return display[product].toLowerCase();
	};

	return self;
}();