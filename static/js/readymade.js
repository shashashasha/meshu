var readymade = {};
$(function() {
	/*
		How we flip between images of readymades
	*/
	var previous = null;
	var thumbnailHandler = function(){
		// looks like "image-1", "image-2"
		var id = $(this).attr("id").split('-').pop();

		$(".other-view").each(function(i, e) {
			// clear all previous ones
			var current = $(e);
			if (current.hasClass('hidden') && i == id) {
				current.removeClass('hidden z-1');
				current.addClass('z-2');
				current.hide().fadeIn('normal', function() {

				});
			} else if (i != id && !current.hasClass('hidden')) {
				if (current.hasClass('z-2')) {
					current.removeClass('z-2');
					current.addClass('z-1');
				}
				current.fadeOut('normal', function() {
					$(this).addClass('hidden');
				})
			}
		});

		// looks like "main-image-2"
		// var current = $("#main-" + id);
		// if (current.length) {
		// 	next.removeClass('hidden z-1');
		// 	next.addClass('z-2');
		// 	next.hide().fadeIn("normal", function() {
		// 		if (previous && previous[0] != next[0]) {
		// 			// viva pinterest
		// 			previous.addClass('hidden');
		// 		}

		// 		previous = next;
		// 	});	
		// } else if (previous) {
		// 	previous.fadeOut("normal", function() {
		// 		// viva pinterest
		// 		$(this).addClass('hidden');
		// 	});
		// }
	};

	var readymadePreview = $(".readymade-preview");
	// viva pinterest
	$(".other-view").addClass('hidden');
	$("#img-thumbs img").click(thumbnailHandler);

	// special case for Africa, or anywhere else that we delete parts of a meshu
	if (loadedMeshu.title == "Continental Africa") {
		$("#meshu-container").hide();
		readymadePreview.hide();
		$("#img-thumbs img").eq(0).click();
		return;
	}

	readymadePreview.click(thumbnailHandler);

	/*
		this is called from within app.js to make sure 
		we don't draw the thumbnail before a mesh is loaded
	*/
	readymade.initialize = function(meshu) {
		meshu.mesh().on("refreshed", function() {
			var transform = 'scale(.175) translate(-30, -30)';
			sb.product.thumbnail($(".meshu-svg .delaunay"), readymadePreview, transform);	
		});
	};

	// remove the first thumbnail if we have the svg version
	// if we have the svg version
	if ($("html").hasClass("svg")) {
		$($("#img-thumbs img")[0]).hide();
	}
});