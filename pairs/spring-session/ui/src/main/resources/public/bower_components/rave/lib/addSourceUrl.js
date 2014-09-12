/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
module.exports = addSourceUrl;

function addSourceUrl (url, source) {
	return source
		+ '\n//# sourceURL='
		+ url.replace(/\s/g, '%20')
		+ '\n';
}
