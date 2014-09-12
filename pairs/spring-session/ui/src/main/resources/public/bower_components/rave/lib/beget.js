/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
module.exports = beget;

function Begetter () {}
function beget (base) {
	var obj;
	Begetter.prototype = base;
	obj = new Begetter();
	Begetter.prototype = null;
	return obj;
}
