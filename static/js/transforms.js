sb.transforms = {
	"earrings": {
		"product": {
			scale: .17,
			transform: {x: 135, y: 115}
		},
		"render": {
			scale: .45,
			transform: {x: 530, y: 450}
		}
	},
	"pendant": {
		"product": {
			scale: .125,
			transform: {x: 110, y: 180}
		},
		"render": {
			scale: .25,
			transform: {x: 900, y: 1375}
		}
	},
	"necklace": {
		"product": {
			scale: .22,
			transform: {x: 80, y: 145}
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
	var t = sb.transforms[product][type];

	var transform = "translate(" + t.transform.x + "," + t.transform.y + ") scale(" + t.scale + ")";

	if (rotation != undefined)
		transform = transform + 'rotate(' + rotation + ',300,300)';
	return transform;
};

sb.transforms.getDefaultRotation = function(product) {
	var mesh = meshu.mesh();

	switch (product) {
		case 'cufflinks':
			return mesh.getRotationAngle();

		case 'earrings':
		case 'pendant':
			var rotation = mesh.getLongestRotation(),
				projected = mesh.projectPoints(rotation),
				proportion = projected.width / projected.height;
			return proportion > 1.5 ? mesh.getRotationAngle() + 90 : 0;

		case 'necklace':
		default:
			return 0;
	}
};