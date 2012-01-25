$(function() {

	var desc = ["Japan","European Countries","SE Asia","US Cities","Spain","China"];

	for (var i = 1; i < 9; i++){
		$("<li>")
			.attr("class","object")
			.append($("<div>").addClass("image").css("background-image","url(../../static/images/meshu_0"+i+".png)"))
			.append($("<div>").addClass("description").text(desc[Math.floor(Math.random()*6)]))
			.append($("<div>").addClass("detail").text("Click for more information"))
			.appendTo("ul.gallery");
	}
	
});