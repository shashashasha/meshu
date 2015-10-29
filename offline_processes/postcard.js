/*

	code to generate postcards

	using phantomjs's cliprect and render:
	http://stackoverflow.com/questions/11959139/crop-screenshot-to-element-in-phantomjs
	http://stackoverflow.com/questions/6432302/phantom-js-cliprect-javascript-help

	postcard size:
	4.25" x 5.6"

	usage:
	$ phantomjs postcard.js 62

	which renders 62-back.png and 62-front.png for postcards for order #62
*/

// separate pages to not falsely trigger 'open' events
var front = require('webpage').create(),
	back = require('webpage').create();

var system = require('system');


if (system.args.length < 1) {
    console.log('Usage: postcard.js order-id');
    phantom.exit();
}

// urls to view postcards
var base = "http://meshu.io",
	frontURL = base + "/orders/processing/postcard/front/{id}/",
	backURL  = base + "/orders/processing/postcard/back/{id}/",

	// saving images
	directory = "/Users/binx/Dropbox/Meshu/raw_postcards/";

// order id
id = system.args[1];

// handle the case where it's a filename/filepath
if (id.split('_').length) {
	// like little faces ('_')
	id = id.split("/").pop();
	id = parseInt(id.toString().split('_')[0]);
}

// set the viewport to be the size of our postcard at 300dpi
front.viewportSize = back.viewportSize = { width: 1680, height: 1400 };
// front.clipRect = back.clipRect = { top: 60, left: 0, width: 1680, height: 1275 };
front.clipRect = back.clipRect = { top: 68, left: 8, width: 1680, height: 1275 };

console.log(id, 'rendering back');

/*
	load the back of the postcard, logo + link + note

	phantom dispatches the open event multiple times if there are iframes on the page
	i think this might be from olark, facebook or something?
*/
back.open(backURL.replace("{id}", id), function(status) {
	back.render(directory + id + '-back.png');
	console.log(id, 'rendered back');
});


/*
	load the front of the postcard, ie map + meshu
*/
console.log(id, 'rendering front');
front.open(frontURL.replace('{id}', id), function (status) {
	if (status == 'fail') {
		console.log('failed to load', frontURL.replace('{id}', id));
		phantom.exit();
		return;
	}
	console.log(id, 'rendering front');

	/*
		grab the renderer from the actual page
	*/
	var renderer = front.evaluate(function() {
		return loadedMeshu.renderer;
	});

	/*
		if it's a radial, we need to zoom in
		and double the size of the radial svg

		otherwise have a handle for zooming in
		(many global facet meshus need this)
	*/
	if (renderer == 'radial') {
		front.evaluate(function() {
			meshu.map().map.zoomBy(1);
			meshu.mesh().prerender(loadedMeshu.svg, 2);
		});
	} else if (system.args[1] == 'zoomin') {
		front.evaluate(function() {
			meshu.map().map.zoomBy(.75);
			meshu.mesh().refresh();
		});
	} else if (system.args[1] == 'zoomout') {
		front.evaluate(function() {
			meshu.map().map.zoomBy(-.5);
			meshu.mesh().refresh();
		});
	}

	// artificially wait for tiles, etc to load
	window.setTimeout(function() {
		front.render(directory + id + '-front.png');
		console.log(id, 'rendered front');
		phantom.exit();
	}, 10000);
});