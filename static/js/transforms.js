sb.transforms = {
	"earrings": {
		"product": {
			scale: .17,
			transform: {x: 192, y: 170}
		},
		"render": {
			scale: .45,
			transform: {x: 530, y: 450}
		}
	},
	"pendant": {
		"product": {
			scale: .125,
			transform: {x: 150, y: 205}
		},
		"render": {
			scale: .25,
			transform: {x: 900, y: 1375}
		}
	},
	"necklace": {
		"product": {
			scale: .22,
			transform: {x: 150, y: 210}
		},
		"render": {
			scale: .4,
			transform: {x: 450, y: 750}
		}
	},
	"cufflinks": {
		"product": {
			scale: .14,
			transform: {x: 160, y: 210}
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
		transform = transform + 'rotate(' + rotation + ')';
	return transform;
};

sb.transforms.getDefaultRotation = function(product) {
	var mesh = meshu.mesh(),
		rotation = -mesh.getRotationAngle();

	switch (product) {
		case 'cufflinks':
			return rotation;

		case 'earrings':
		case 'pendant':
			var projected = mesh.projectPoints(mesh.getLongestRotation()),
				proportion = projected.width / projected.height;
			return proportion > 2 ? rotation + 90 : rotation;

		case 'necklace':
			var projected = mesh.projectPoints(mesh.getLongestRotation()),
				proportion = projected.width / projected.height;
			return proportion > 2 ? 0 : rotation;
		default:
			return rotation;
	}
};