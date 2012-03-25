$(function() {
	var index = 0;
	var sum = $(".bleed").length;
	setInterval(function(){
		$("#banner-" + index).hide('slide', {direction: 'left'}, 1000);
		$("#banner-" + (index + 1) % sum).show('slide', {direction: 'right'}, 1000);
		index = (index + 1) % sum;
	}, 7000);
});