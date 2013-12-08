$(function() {
	/*
		Only block page interaction if we're on the /make page
	*/
	var pageWidth = $(window).width();

	$("#modal-bg").fadeIn();
	$("#edit-help").hide();
	var div = $("<div>").attr("id","no-svg").css("left",(pageWidth-590)/2+"px").append(
		$("<h2>").text("Sorry, this page only works in modern browsers"),
		$("<p>").text("We won't be able to display it properly :("),
		$("<p>").html('Why not try with another browser, such as <a href="https://www.google.com/chrome" target="_blank">Chrome</a>, <a href="http://www.apple.com/safari/download/" target="_blank">Safari</a>, <a href="http://www.mozilla.org/en-US/firefox/new/" target="_blank">Firefox</a>, or <a href="http://www.microsoft.com/download/en/details.aspx?id=13950">IE9</a>?')
	);
	$("#content").append(div).fadeIn();	
});