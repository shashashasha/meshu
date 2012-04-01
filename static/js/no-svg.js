$(function() {
	$("#modal-bg").fadeIn();
	$("#edit-help").hide();
	var div = $("<div>").attr("id","no-svg").append(
		$("<h2>").text("Oh no, it looks like your browser doesn't support SVG."),
		$("<p>").text("Unfortunately, this page can't display properly in your browser."),
		$("<p>").html('Why not try with another browser, such as <a href="https://www.google.com/chrome" target="_blank">Chrome</a>, <a href="http://www.apple.com/safari/download/" target="_blank">Safari</a>, or <a href="http://www.mozilla.org/en-US/firefox/new/" target="_blank">Firefox</a>?'),
		$("<h2>").html('Or, check out <a href="/shop/" class="button pink">our shop</a>.')
		);
	$("#content").append(div).fadeIn();
});