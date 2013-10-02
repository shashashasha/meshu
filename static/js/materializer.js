var sb = sb || {};

sb.materializer = function() {
	var self = d3.dispatch("update"),
		catalog,
		display,
		productNames,
		product,
		material,
		color;

	// used for product previews
	display = {"earrings":"pair of earrings",
    	"pendant":"small pendant necklace",
		"necklace":"large necklace",
		"cufflinks": "pair of cufflinks"};

	productNames = {"earrings":"earrings",
		"pendant":"pendant necklace",
		"necklace":"large necklace",
		"cufflinks": "cufflinks"};

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

		$.each(self.materials.find("li"),function(i,v){
			var item = $(this).attr("id");
			if (materials[item]) {
				$(v).removeClass("inactive").find(".price").text("$"+materials[item]);
				$(v).find(".img-wrapper").attr("class","img-wrapper "+p);
			} else {
				$(v).addClass("inactive").removeClass("selected").find(".price").text("");
				$(v).find(".img-wrapper").attr("class","img-wrapper");
			}
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

		if (m == "reset")
			material = null;
		else
			material = m;

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