sb.transforms = {
	"earrings": {
		"product": { 
			scale: .09, 
			transform: {x: 830, y: 710}
		},
		"preview": {
			scale: .125,
			transform: {x: 650, y: 540}	
		},
		"render": {
			scale: 1, 
			transform: {x: 0, y: 0}	
		}
	},
	"pendant": {
		"product": { 
			scale: .045, 
			transform: {x: 1570, y: 2200}
		},
		"preview": {
			scale: .075, 
			transform: {x: 1030, y: 1470}	
		},
		"render": {
			scale: 1, 
			transform: {x: 0, y: 0}	
		}
	},
	"necklace": {
		"product": { 
			scale: .09, 
			transform: {x: 650, y: 980}
		},
		"preview": {
			scale: .125, 
			transform: {x: 510, y: 760}	
		},
		"render": {
			scale: 1, 
			transform: {x: 0, y: 0}	
		}
	},
	"cufflinks": {
		"product": { 
			scale: .075, 
			transform: {x: 870, y: 1170}
		},
		"preview": {
			scale: .125, 
			transform: {x: 510, y: 760}	
		},
		"render": {
			scale: .5, 
			transform: {x: 0, y: 0}	
		} 	
	}
};

sb.transforms.getTransform = function(product, type) {
	var t = sb.transforms[product][type];
	return "scale(" + t.scale + ") translate(" + t.transform.x + "," + t.transform.y + ") ";
};