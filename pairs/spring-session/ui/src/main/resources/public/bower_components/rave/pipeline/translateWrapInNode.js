/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
module.exports = translateWrapInNode;

function translateWrapInNode (load) {
	// The \n allows for a comment on the last line!
	return 'module.exports = ' + load.source + '\n;';
}
