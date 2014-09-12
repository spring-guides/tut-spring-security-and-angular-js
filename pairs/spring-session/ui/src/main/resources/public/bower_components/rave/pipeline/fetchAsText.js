/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
module.exports = fetchAsText;

var fetchText = require('../lib/fetchText');

function fetchAsText (load) {
	return new Promise(function(resolve, reject) {
		fetchText(load.address, resolve, reject);
	});

}
