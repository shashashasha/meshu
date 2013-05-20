sb.transforms = {
	"earrings": {
		// "product": { 
		// 	scale: .09, 
		// 	transform: {x: 830, y: 710}
		// },
		"product": {
			scale: .15,
			transform: {x: 900, y: 750}	
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
		// "product": { 
		// 	scale: .045, 
		// 	transform: {x: 1570, y: 2200}
		// },
		"product": {
			scale: .1, 
			transform: {x: 1200, y: 1700}	
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
			scale: .175, 
			transform: {x: 550, y: 850}	
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
			scale: .075, 
			transform: {x: 870, y: 1170}
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
	return "scale(" + t.scale + ") translate(" + t.transform.x + "," + t.transform.y + ") ";
};