var sb = sb || {};

sb.rasterizer = function() {
	var self = d3.dispatch("rasterized");

	var makeCanvas = function() {
		var canvas = document.createElement('canvas');
		canvas.width = 400;
		canvas.height = 400;
		canvas.style.position = 'absolute';
		canvas.style.top = '0';
		canvas.style.left = '0';
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
		meshuCanvas.width = canvas.width;
		meshuCanvas.height = canvas.height;
		frame.appendChild(meshuCanvas);

		canvg(meshuCanvas, meshu.outputSVG(), {
			renderCallback: function() {
				// combine the canvases
				ctx.drawImage(meshuCanvas, 0, 0, canvas.width, canvas.height);
				postMeshu(frame, canvas, ctx, meshu);
			}
		});
	};

	var postMeshu = function(frame, canvas, ctx, meshu) {
		/*
			sending all the meshu information. Since we're saving on 'continue'
			we want to save a meshu in our db regardless, to associate with the MeshuImage

			this starts off as assigned to the 'guest' user_profile, 
			which once we log in we assign to the logged in user_profile
		*/
		var pngPost = {
			'xhr': 'true', 
			'csrfmiddlewaretoken': $("#csrf input").val(),
			'dataurl': canvas.toDataURL(),
			'title': meshu.outputTitle(),
			'location_data': meshu.outputLocationData(),
			'svg': meshu.outputSVG()
		};

		/* 
			attach the meshu id if we have one, 
			this is if we're starting off with a meshu
		*/
		if (meshu.id) {
			pngPost.id = meshu.id;
		}

		// send it to the server to be saved as a png
		$.post('to_png', pngPost, function(data) {
			var img = document.createElement('img');
			img.src = data.url;
			frame.appendChild(img);
			self.rasterized(data);
		}, 'json');
	}

	self.rasterize = function(meshu) { 
		snapZoom(meshu);

		// get the map canvas, the frame, and serialize the map content
		var canvas = makeCanvas(), 
			frame = meshu.getFrame(),
			ctx = canvas.getContext('2d'),
			str = serialize(meshu.map().map.container());

		// we need the canvas on the DOM to draw it
		frame.appendChild(canvas);

		// canvg it, then lighten the map and draw the meshu
		canvg(canvas, str, {
			renderCallback: function() {
				// make the map more transparent
				lightenCanvas(ctx, .7);

				// draw the meshu onto a canvas
				drawMeshu(frame, canvas, ctx, meshu);
			}
		});
	};

	return self;
}();