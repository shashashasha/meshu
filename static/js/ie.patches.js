if (!window.addEventListener) {
	window.addEventListener = function(e, f) {
		// window.attachEvent(e, f);
	};
}

if (!document.createElementNS) {
	document.createElementNS = function(ns, element) {
		return document.createElement(element);
	};
}