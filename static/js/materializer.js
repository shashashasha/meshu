var sb = sb || {};

sb.materializer = function() {
	var self = d3.dispatch("update"),
		catalog,
		product,
		material,
		color;

	self.initialize = function(o) {
		catalog = o;

		// list elements
		self.materials = $("#material-list");

		self.materials.find("li").live("click",function(e) {
			var props = e.currentTarget.id.split("-");
			self.material(props[1]);
			self.color(props[0]);

			var li = $(this);
			li.parent().find("li").removeClass("selected");
			li.addClass("selected");
		});
	};

	self.product = function(p) {
		if (!arguments.length) return product;

		product = p;
		var materials = catalog.getMaterials(p);

		$.each(materials,function(i,v){
			self.materials.find("#"+v[0]+" .price").text("$"+v[1])
		});

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

		orderer.updateProduct(product, material);

		return self;
	};

	/*
		Sets the internal color variable
		And adds a 'selected' class to the list element
	*/
	self.color = function(c) {
		if (!arguments.length) return color;

		color = c;

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