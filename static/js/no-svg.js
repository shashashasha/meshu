$(function() {
	$("#modal-bg").fadeIn();
	$("#edit-help").hide();
	var div = $("<div>").attr("id","no-svg").append(
		$("<h2>").text("Oh no, your browser doesn't support SVG. :("),
		$("<p>").text("Unfortunately, we can't display this page properly in your browser."),
		$("<p>").html('Why not try with another one, such as <a href="https://www.google.com/chrome" target="_blank">Chrome</a>, <a href="http://www.apple.com/safari/download/" target="_blank">Safari</a>, <a href="http://www.mozilla.org/en-US/firefox/new/" target="_blank">Firefox</a>, or <a href="http://www.microsoft.com/download/en/details.aspx?id=13950">IE9+</a>?'),
		$("<h2>").html('Or, just check out <a href="/shop/" class="button pink">our shop!</a>')
	);
	$("#content").append(div).fadeIn();
});