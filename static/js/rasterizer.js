var sb = sb || {};

sb.rasterizer = function() {
	var self = d3.dispatch("rasterized", "rasterizedThumbnail"),
		generated = false,
		canvases = [];

	var makeCanvas = function(name, manualTracking) {
		var canvas = document.createElement('canvas');
		canvas.width = 400;
		canvas.height = 400;
		canvas.style.position = 'absolute';
		canvas.style.top = '0';
		canvas.style.left = '0';
		canvas.className = name;

		$(canvas).addClass("hidden");

		if (!manualTracking)
			canvases.push(canvas);
		return canvas;
	};

	// lighten the canvas for the map tiles, then draw the meshu
	var lightenCanvas = function(ctx, percent) {
		ctx.fillStyle = 'rgba(255, 255, 255, ' + percent + ')';
		ctx.fillRect(0, 0, ctx.width, ctx.height);
		ctx.fill();
	};

	var serialize = function(svg) {
		var serializer = new XMLSerializer();
		return serializer.serializeToString(svg);
	};

	/*
		only snap if we have to
	*/
	var snapZoom = function(meshu) {
		var map = meshu.map().map,
			zoom = map.zoom(),
			roundedZoom = Math.round(zoom);

		if (zoom != roundedZoom) {
			map.zoom(roundedZoom);
			meshu.mesh().refresh();
		}
	};

	var drawMeshu = function(frame, canvas, ctx, meshu, callback) {
		var meshuCanvas = makeCanvas();
		frame.appendChild(meshuCanvas);

		meshu.mesh().bakeStyles();

		canvg(meshuCanvas, meshu.outputSVG(), {
			renderCallback: function() {
				// combine the canvases
				meshu.mesh().unBakeStyles();
				ctx.drawImage(meshuCanvas, 0, 0, canvas.width, canvas.height);
				var logo = new Image();
				logo.onload = function(){
					ctx.drawImage(logo, canvas.width-130, canvas.height-35, 117, 22);
					postMeshu(frame, canvas, meshu, callback);
				};
				logo.src = '/static/images/logo_io.png';
			}
		});
	};

	var postMeshu = function(frame, canvas, meshu, callback) {
		/*
			sending all the meshu information. Since we're saving on 'continue'
			we want to save a meshu in our db regardless, to associate with the MeshuImage

			this starts off as assigned to the 'guest' user_profile,
			which once we log in we assign to the logged in user_profile
		*/
		var xhr = meshu.xhr();
		xhr.csrfmiddlewaretoken = $("#csrf input").val();
		xhr.dataurl = canvas.toDataURL();

		/*
			attach the meshu id if we have one,
			this is if we're starting off with a meshu
		*/
		if (meshu.id) {
			xhr.id = meshu.id;
		}

		// TODO just commenting out for now, for rings
		self.clearCanvases();

		// send it to the server to be saved as a png
		$.post('to_png', xhr, function(data) {
			var img = document.createElement('img');
			img.src = data.image_url;
			$(img).addClass("hidden");

			frame.appendChild(img);
			self.generated = true;
			self.rasterized(data);

			if (callback) {
				callback(data);
			}
		}, 'json');
	};

	self.clearCanvases = function() {
		while (canvases.length) {
			var c = canvases.pop()
			// c.getContext('2d').clearRect(0, 0, c.width, c.height);
			$(c).remove();
		}
	};

	self.rasterize = function(meshu, callback) {
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
				drawMeshu(frame, canvas, ctx, meshu, callback);
			}
		});
	};

	// create a canvas version of the mesh that we can use as a thumbnail
	// for products, etc
	self.thumbnail = function(meshu, callback) {
		meshu.mesh().bakeStyles();

		// draw the mesh object
		var canvas = makeCanvas(),
			frame = meshu.getFrame(),
			ctx = canvas.getContext('2d'),
			str = meshu.outputSVG();

		// we need the canvas on the DOM to draw it
		frame.appendChild(canvas);

		canvg(canvas, str, {
			renderCallback: function() {
				// combine the canvases
				meshu.mesh().unBakeStyles();

				if (callback) {
					callback(canvas);
				}
			}
		});
	};

	var furthestPoints = function(map, points) {
		var max = 0,
			pair = [];

		if (points.length < 2) return;

		// find the furthest points
		for (var i = 0; i < points.length; i++) {
			var pi = map.l2p({ lat: points[i][1], lon: points[i][0] });

			for (var j = i + 1; j < points.length; j++) {
				var pj = map.l2p({ lat: points[j][1], lon: points[j][0] });
				var dx = pi.x - pj.x;
				var dy = pi.y - pj.y;

				var dist = Math.sqrt((dx * dx) + (dy * dy));
				if (dist > max) {
					max = dist;
					pair = [pj, pi];
				}
			}
		}

		return pair;
	};

	var lineAngle = function(p1, p2) {
		var dpy = p2.y - p1.y,
			dpx = p2.x - p1.x;

		return Math.atan2(dpy, dpx) * (180 / Math.PI);
	};

	var distance = function(p1, p2) {
		var dpy = p2.y - p1.y,
			dpx = p2.x - p1.x;

		return Math.sqrt((dpx * dpx) + (dpy * dpy));
	};

	self.ringPreview = function(meshu, callback) {
		meshu.mesh().bakeStyles();

		if (meshu.mesh().points().length < 3) {
			return;
		}

		var map = meshu.map(),
			points = meshu.mesh().points(),
			pair = furthestPoints(map, points),
			angle = lineAngle(pair[0], pair[1]),
			normalizedAngle = -angle + 180,
			rotate = "rotate(" + [normalizedAngle, 300, 300].join(',') + ") ";

		/*
			new strategy:
			draw a projected delaunay triangulation for the ring preview.
			get the global points from the circles after they've been rotated,
			then use that to find the rotated "bbox", then use that to scale
			into our destination ring-preview-delaunay-container
		*/
		var projected = meshu.mesh().projectPoints(rotate),
			projWidth = 600,
			projHeight = 150,
			buffer = 20;

		meshu.mesh().transformedDelaunay(projected, projWidth, projHeight - buffer, buffer/2);

		// create our own canvas and don't autoremove it
		var canvas = makeCanvas('ring-canvas', true),
			frame = meshu.getFrame(),
			ctx = canvas.getContext('2d'),
			str = meshu.outputSVG();

		// we need the canvas on the DOM to draw it
		frame.appendChild(canvas);

		canvg(canvas, str, {
			renderCallback: function() {
				// reset mesh
				meshu.mesh().unBakeStyles();
				meshu.mesh().refresh();

				// clear transform and canvas
				d3.select("#delaunay-ui").attr("transform", "translate(0,0) scale(1) rotate(0,300,300)");
				d3.selectAll(".ring-canvas").remove();

				// drawing extra so the white part covers the "back side" of the ring
				var background = document.getCSSCanvasContext('2d', 'ring-preview', projWidth, projHeight + 100);
				background.clearRect(0, 0, projWidth, projHeight + 100);
				background.fillStyle = 'rgba(255, 255, 255, .75)';
				background.fillRect(0, 0, projWidth, projHeight + 100);
				background.drawImage(canvas, 0, 0, projWidth, projHeight, 0, 50, projWidth, projHeight);

				if (callback) {
					callback(canvas);
				}
			}
		});
	}

	return self;
}();