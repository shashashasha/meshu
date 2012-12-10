/*

	Code to generate postcards 

	Taking code/ideas from
	http://stackoverflow.com/questions/11959139/crop-screenshot-to-element-in-phantomjs
	http://stackoverflow.com/questions/6432302/phantom-js-cliprect-javascript-help

	Postcard size:
	4.25" x 5.6"

	Usage:
	phantomjs postcard.js 62

	Renders 62-back.png and 62-front.png for postcards for order #62
*/

var front = require('webpage').create(),
	back = require('webpage').create(),
	fs = require('fs'),
    system = require('system');

if (phantom.args.length != 1) {
    console.log('Usage: postcard.js order-id');
    phantom.exit();
    return;
} 


var base = phantom.args[1] || "http://dev.meshu.io:8000",
	frontURL = base + "/orders/processing/postcard/front/{id}/",
	backURL  = base + "/orders/processing/postcard/back/{id}/",
	directory = "/Users/sha/Dropbox/Meshu/raw_postcards/";

id = phantom.args[0];

// we might want to pass the filepath in via hazel
if (id.split('_').length) {
	// like little faces ('_')
	id = id.split("/").pop();
	id = parseInt(id.toString().split('_')[0]);
}

front.viewportSize = back.viewportSize = { width: 1680, height: 1400 };
front.clipRect = back.clipRect = { top: 60, left: 0, width: 1680, height: 1275 };

console.log(id, 'rendering back');
back.open(backURL.replace("{id}", id), function(status) {
	/*
		phantom dispatches the open event multiple times if there are iframes on the page
		i think this might be from olark, facebook or something?
	*/
	back.render(directory + id + '-back.png');
	console.log(id, 'rendered back');	
});

console.log('rendering front');
front.open(frontURL.replace('{id}', id), function (status) {
	if (status == 'fail') {
		console.log('failed to load', frontURL.replace('{id}', id));
		phantom.exit();
		return;
	}
	console.log(id, 'rendering front');

	var renderer = front.evaluate(function() {
		return loadedMeshu.renderer;
	});
	console.log(id, renderer);

	if (renderer == 'radial') {
		front.evaluate(function() {
			meshu.map().map.zoomBy(1);
			meshu.mesh().prerender(loadedMeshu.svg, 2);
		});
	} 

	// wait for tiles
	window.setTimeout(function() {
		front.render(directory + id + '-front.png');
		console.log(id, 'rendered front')
		phantom.exit();
	}, 10000);
});
