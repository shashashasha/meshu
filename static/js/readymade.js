$(function() {
	/*
		How we flip between images of readymades
	*/
	var previous = null;
	var thumbnailHandler = function(){
		var id = $(this).attr("id");

		if (!id) {
			return;
		}

		// handle the image thumbnails
		if (previous) {
			previous.removeClass('z-2');
			previous.addClass('z-1');
		}

		var next = $("#l-" + id);
		if (next.length) {


			next.removeClass('z-1');
			next.addClass('z-2');
			next.fadeIn("normal", function() {
				if (previous && previous[0] != next[0]) {
					previous.hide();
				}

				previous = next;
			});	
		} else if (previous) {
			previous.fadeOut("normal");
		}
	};
	$(".other-view").hide();
	$("#img-thumbs img").click(thumbnailHandler);
	$(".readymade-preview").click(thumbnailHandler);

	/*
		Adding the product preview
	*/
	var transforms = {	
		'earrings': 'scale(.05625) translate(650, 540)',
		'pendant': 'scale(.03375) translate(1030, 1470)',
	  	'necklace': 'scale(.05625) translate(510, 760)',
	  	'cufflinks': 'scale(.05625) translate(510, 760)'
	};
	var product = loadedMeshu.product, transform = transforms[product];

	sb.product.initializeProduct(product, transform, $(".delaunay"));
});