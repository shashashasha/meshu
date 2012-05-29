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
		Adding the product preview
	*/
	var product = loadedMeshu.product, 
		transform = 'scale(.175) translate(-30, -30)';
	sb.product.thumbnail($(".meshu-svg .delaunay"), readymadePreview, transform);

	// remove the first thumbnail if we have the svg version
	// if we have the svg version
	if ($("html").hasClass("svg")) {
		$($("#img-thumbs img")[0]).hide();
	}
});