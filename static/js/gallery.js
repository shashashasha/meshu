$(function() {

	var desc = ["Japan","European Countries","SE Asia","US Cities","Spain","China"];

	for (var i = 1; i < 9; i++){
		$("<li>")
			.attr("class","object")
			.append($("<div>").addClass("image").css("background-image","url(../../static/images/meshu_0"+i+".png)"))
			.append($("<p>").addClass("description").text(desc[Math.floor(Math.random()*6)]))
			.append($("<a>").addClass("clickthrough").text("Click for more information"))
			.appendTo("ul.gallery")
			.click(function() {
				var j = i;
				return function() {
					window.location = '/shop/' + j;
				};
			}());
	}
	d3.selectAll("#master-svg").attr("class","meshu-svg");
	d3.selectAll("#delaunay").attr("transform","scale(.36)");
	
});