/*
	Slideshow for the index.html page
*/
$(function() {
	if ($(window).width() < 768) return;
	var macroIndex = 0;
	var macroSum = $(".macro").length;
	setInterval(function(){
		$("#macro-" + macroIndex).fadeOut('slow');
		$("#macro-" + (macroIndex + 1) % macroSum).fadeIn('slow');
		macroIndex = (macroIndex + 1) % macroSum;
	}, 7000);

	var bannerIndex = 0;
	var bannerSum = $(".banner").length;
	setInterval(function(){
		$("#banner-" + bannerIndex).fadeOut('slow');
		$("#banner-" + (bannerIndex + 1) % bannerSum).fadeIn('slow');
		bannerIndex = (bannerIndex + 1) % bannerSum;
	}, 7000);
});