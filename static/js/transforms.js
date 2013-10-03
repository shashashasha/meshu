sb.transforms = {
	"earrings": {
		"product": {
			scale: .19,
			transform: {x: 135, y: 105}
		},
		"render": {
			scale: .45,
			transform: {x: 530, y: 450}
		}
	},
	"pendant": {
		"product": {
			scale: .125,
			transform: {x: 110, y: 170}
		},
		"render": {
			scale: .25,
			transform: {x: 900, y: 1375}
		}
	},
	"necklace": {
		"product": {
			scale: .18,
			transform: {x: 80, y: 155}
		},
		"render": {
			scale: .4,
			transform: {x: 450, y: 750}
		}
	},
	"cufflinks": {
		"product": {
			scale: .14,
			transform: {x: 120, y: 170}
		},
		"render": {
			scale: .4,
			transform: {x: 450, y: 750}
		}
	},
	"coasters": {
		"product": {
			scale: .3,
			transform: {x: 200, y: 200}
		},
		"render": {
			scale: .4,
			transform: {x: 450, y: 750}
		}
	},
	"ring": {
		"product": {
			scale: .3,
			transform: {x: 200, y: 200}
		},
		"render": {
			scale: .4,
			transform: {x: 450, y: 750}
		}
	}
};

sb.transforms.getTransform = function(product, type, rotation) {
	var t = sb.transforms[product][type],
		r = 0;

	return "translate(" + t.transform.x + "," + t.transform.y + ") scale(" + t.scale + ")";
};