var sb = sb || {};

sb.utils = function() {
	var self = {},
		decoder = document.createElement('div');

	// decode the text
    // http://stackoverflow.com/questions/3700326/decode-amp-back-to-in-javascript
	self.decode = function(value) {
        decoder.innerHTML = value;
        return decoder.firstChild.nodeValue;
	};

	return self;
}();
