var sb = sb || {};

sb.rasterizer = function() {
	var self = {};

	self.rasterize = function(meshu) { 
		var canvas = document.createElement('canvas');
		canvas.width = 400;
		canvas.height = 400;
		canvas.style.position = 'absolute';
		canvas.style.top = '0';
		canvas.style.left = '0';

		var frame = meshu.getFrame();
		frame.appendChild(canvas);

		console.log(canvas, frame);

		// canvg(canvas, meshu.outputSVG());
		var serializer = new XMLSerializer();
		var str = serializer.serializeToString(meshu.map().map.container());
		canvg(canvas, str);

		$.post('to_png', {
			'xhr': 'true', 
			'csrfmiddlewaretoken': $("#csrf input").val(),
			'dataurl': canvas.toDataURL(),
			'filename': meshu.outputTitle()
		}, function(data) {
			var img = document.createElement('img');
			img.src = data.url;
			frame.appendChild(img);

			setTimeout(function() {
				console.log('http://dev.meshu.io:8000' + data.url);
		        FB.ui({
		        	method: 'feed',
		        	link: 'http://meshu.io',
		        	picture: 'http://dev.meshu.io:8000' + data.url,
		        	name: 'My Meshu',
		        	caption: "Come see the jewelry I'm making out of places I've been",
		        	description: ''
		        }, function(response) {
	                if (!response || response.error) {
	                    console.log('errored');
	                } else {
	                    console.log('Post ID: ' + response.id);
	                }
	            });
			}, 250);
		}, 'json');
	};

	return self;
}();