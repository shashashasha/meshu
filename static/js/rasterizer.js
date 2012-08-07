var sb = sb || {};

sb.rasterizer = function() {
	var self = {};

	var makeCanvas = function() {
		var canvas = document.createElement('canvas');
		canvas.width = 400;
		canvas.height = 400;
		return canvas;
	};

	var lightenCanvas = function(ctx, percent) {
		ctx.fillStyle = 'rgba(255, 255, 255, ' + percent + ')';
		ctx.fillRect(0, 0, ctx.width, ctx.height);
		ctx.fill();
	};

	var serialize = function(svg) {
		var serializer = new XMLSerializer();
		return serializer.serializeToString(svg);
	};

	var snapZoom = function(meshu) {
		var zoom = meshu.map().map.zoom();
		meshu.map().map.zoom(Math.round(zoom));
		meshu.mesh().refresh();
	};

	var drawMeshu = function(frame, canvas, ctx, meshu) {
		var meshuCanvas = document.createElement('canvas');
		meshuCanvas.width = 400;
		meshuCanvas.height = 400;
		frame.appendChild(meshuCanvas);
		canvg(meshuCanvas, meshu.outputSVG());

		// combine the canvases
		ctx.drawImage(meshuCanvas, 0, 0, canvas.width, canvas.height);
	};

	self.rasterize = function(meshu) { 
		snapZoom(meshu);

		var canvas = makeCanvas();
		canvas.style.position = 'absolute';
		canvas.style.top = '0';
		canvas.style.left = '0';

		var frame = meshu.getFrame();
		frame.appendChild(canvas);

		// canvg(canvas, meshu.outputSVG());
		
		var str = serialize(meshu.map().map.container())
		canvg(canvas, str);

		setTimeout(function() {

			// make the map more transparent
			var ctx = canvas.getContext('2d');
			lightenCanvas(ctx, .7);

			// draw the meshu onto a canvas
			drawMeshu(frame, canvas, ctx, meshu);

			// send it to the server to be saved as a png
			$.post('to_png', {
				'xhr': 'true', 
				'csrfmiddlewaretoken': $("#csrf input").val(),
				'dataurl': canvas.toDataURL(),
				'filename': meshu.outputTitle()
			}, onPNGSaved, 'json');

		}, 100);
	};

	var onPNGSaved = function(data) {

		var img = document.createElement('img');
		img.src = data.url;
		frame.appendChild(img);

		// popup the facebook dialog
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
                    console.log(response);
                } else {
                    console.log('Post ID: ' + response.id);
                }
            });
		}, 100);
	};

	return self;
}();