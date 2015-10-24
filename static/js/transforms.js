sb.transforms = {
	"earrings": {
		"product": {
			scale: .17,
			transform: {x: 195, y: 165}
		},
		"render": {
			scale: .45,
			transform: {x: 530, y: 450}
		}
	},
	"pendant": {
		"product": {
			scale: .125,
			transform: {x: 155, y: 205}
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
			scale: .4,
			transform: {x: 150, y: 150}
		},
		"render": {
			scale: .4,
			transform: {x: 450, y: 750}
		}
	},
	"ring": {
		// "product": {
		// 	scale: .3,
		// 	transform: {x: 200, y: 200}
		// },
		"product": {
			scale: .5,
			transform: {x: 150, y: 150}
		},
		"render": {
			scale: .4,
			transform: {x: 450, y: 750}
		}
	},
	"small_poster": {
		"product": {
			scale: .25,
			transform: {x: 150, y: 150}
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

sb.transforms.getOrientation = function(product) {
	var orientation = {},
		mesh = meshu.mesh(),
		projected = mesh.projectPoints(mesh.getLongestRotation()),
		proportion = projected.width / projected.height;

	orientation.width = 450;
	orientation.rotation = -mesh.getRotationAngle();

	switch (product) {
		// no rotation, squarify
		case 'small_poster':
			orientation.height = 450 / proportion;
			break;
		case 'cufflinks':
			orientation.height = 400;
			break;
		// rotate to horizontal if it's skinny, stretch if skinny
		case 'necklace':
			orientation.height = 450 / proportion;
			if (proportion > 2) {
				orientation.height = (450 / proportion) * 1.5;
				orientation.rotation = 0;
			}
			break;
		case 'ring':
			orientation.height = 150;
			orientation.rotation = 0;
			break;
		// rotate to vertical if it's skinny, stretch if skinny
		case 'earrings':
		case 'pendant':
		default:
			orientation.height = 450 / proportion;
			if (proportion > 2) {
				orientation.height = (450 / proportion) * 2;
				orientation.rotation = 90;
			}
			break;
	}

	return orientation;
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