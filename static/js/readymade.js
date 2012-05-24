$(function() {
	/*
		How we flip between images of readymades
	*/
	var previous = null;
	var thumbnailHandler = function(){
		var id = $(this).attr("id");

		// handle the image thumbnails
		if (previous) {
			previous.removeClass('z-2');
			previous.addClass('z-1');
		}

		var next = $("#l-" + id);
		if (next.length) {
			next.removeClass('hidden z-1');
			next.addClass('z-2');
			next.hide().fadeIn("normal", function() {
				if (previous && previous[0] != next[0]) {
					// viva pinterest
					previous.addClass('hidden');
				}

				previous = next;
			});	
		} else if (previous) {
			previous.fadeOut("normal", function() {
				// viva pinterest
				$(this).addClass('hidden');
			});
		}
	};
	// viva pinterest
	$(".other-view").addClass('hidden');
	$("#img-thumbs img").click(thumbnailHandler);
	$(".readymade-preview").click(thumbnailHandler);

	/*
		Adding the product preview
	*/
	var product = loadedMeshu.product, 
		transform = 'scale(.175) translate(-30, -30)';
	sb.product.thumbnail($(".meshu-svg .delaunay"), $(".readymade-preview"), transform);

	
	$($("#img-thumbs img")[0]).hide();
});