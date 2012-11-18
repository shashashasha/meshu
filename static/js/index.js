/*
	Slideshow for the index.html page
*/
$(function() {
	var index = 0;
	var sum = $(".macro").length;
	setInterval(function(){
		$("#macro-" + index).fadeOut('slow');
		$("#macro-" + (index + 1) % sum).fadeIn('slow');
		index = (index + 1) % sum;
	}, 7000);

});