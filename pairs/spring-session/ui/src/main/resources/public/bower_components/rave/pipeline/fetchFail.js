/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
module.exports = fetchFail;

function fetchFail (load) {
	throw new TypeError('Default implementation cannot fetch.');
}
