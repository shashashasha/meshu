sb.transforms = {
	"earrings": {
		"product": {
			scale: .175,
			transform: {x: 65, y: 112}
		},
		"render": {
			scale: .45,
			transform: {x: 530, y: 450}
		}
	},
	"pendant": {
		"product": {
			scale: .125,
			transform: {x: 60, y: 170}
		},
		"render": {
			scale: .25,
			transform: {x: 900, y: 1375}
		}
	},
	"necklace": {
		"product": {
			scale: .2,
			transform: {x: 20, y: 140}
		},
		"render": {
			scale: .4,
			transform: {x: 450, y: 750}
		}
	},
	"cufflinks": {
		"product": {
			scale: .15,
			transform: {x: 75, y: 155}
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
		
	// auto-rotation for facet
	if (typeof meshu.mesh().getRotationAngle == "function") {
		r = meshu.mesh().getRotationAngle()+90;
		if (product == "necklace" || product == "cufflinks")
			r = meshu.mesh().getRotationAngle() + 180;
	}
	if (rotation)
		r = (rotation + r)%360;
	
	return "translate(" + t.transform.x + "," + t.transform.y + ") scale(" + t.scale + ") rotate("+r+",650,300)";
};