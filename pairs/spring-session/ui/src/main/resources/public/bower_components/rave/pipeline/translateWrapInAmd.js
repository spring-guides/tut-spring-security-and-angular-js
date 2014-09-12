/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
module.exports = translateWrapInAmd;

function translateWrapInAmd (load) {
	// The \n allows for a comment on the last line!
	return 'define(' + load.source + '\n);';
}
