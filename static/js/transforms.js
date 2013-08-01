sb.transforms = {
	"earrings": {
		"product": {
			scale: .175,
			transform: {x: 143, y: 112}
		},
		"preview": {
			scale: .125,
			transform: {x: 650, y: 540}
		},
		"render": {
			scale: .45,
			transform: {x: 530, y: 450}
		}
	},
	"pendant": {
		"product": {
			scale: .125,
			transform: {x: 119, y: 167}
		},
		"preview": {
			scale: .075,
			transform: {x: 1030, y: 1470}
		},
		"render": {
			scale: .25,
			transform: {x: 900, y: 1375}
		}
	},
	"necklace": {
		// "product": {
		// 	scale: .09,
		// 	transform: {x: 650, y: 980}
		// },
		"product": {
			scale: .2,
			transform: {x: 90, y: 150}
		},
		"preview": {
			scale: .125,
			transform: {x: 510, y: 760}
		},
		"render": {
			scale: .4,
			transform: {x: 450, y: 750}
		}
	},
	"cufflinks": {
		"product": {
			scale: .15,
			transform: {x: 115, y: 155}
		},
		"preview": {
			scale: .125,
			transform: {x: 510, y: 760}
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
		"preview": {
			scale: .125,
			transform: {x: 510, y: 760}
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
		"preview": {
			scale: .125,
			transform: {x: 510, y: 760}
		},
		"render": {
			scale: .4,
			transform: {x: 450, y: 750}
		}
	}
};

sb.transforms.getTransform = function(product, type) {
	var t = sb.transforms[product][type];
	return "translate(" + t.transform.x + "," + t.transform.y + ") scale(" + t.scale + ")";
};