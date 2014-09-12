/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
var path = require('../lib/path');

module.exports = normalizeCjs;

var reduceLeadingDots = path.reduceLeadingDots;

function normalizeCjs (name, refererName, refererUrl) {
	return reduceLeadingDots(String(name), refererName || '');
}
