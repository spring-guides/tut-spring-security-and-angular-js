/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
module.exports = instantiateEs6;

function instantiateEs6 (load) {

}

var parseTopScope = /\bimport\b|\bexport\b/; // --> import || export statement
var parseImport = /(?:(\{)|([$_a-zA-Z]+[$_a-zA-Z0-9]*))/; // --> bindings || identifier
var parseBindings = /([$_a-zA-Z]+[$_a-zA-Z0-9]*)(?:\s+as\s+([$_a-zA-Z]+[$_a-zA-Z0-9]*))\s*,?/;
var parseString = /(["'])([^\1]*)\1/;

function parseEs6 (source) {

	var findStatics = new RegExp(
//			// filter out some false positives that we can't eliminate in the
//			// rest of the regexps since we may grab too many chars if we do.
//			// these are not captured.
//			'[.$_]require\\s*\\(|[.$_]define\\s*\\('
//			// also find "require('id')" (r-val)
//			+ '|\\brequire\\s*\\(\\s*["\']([^"\']+)["\']\\s*\\)'
//			// find "define ( 'id'? , [deps]? ," capturing id and deps
//			+ '|(\\bdefine)\\s*\\(' // define call
//			+ '|\'([^\']*)\'\\s*,|["]([^"]*)["]\\s*,' // id (with comma)
//			+ '|(?:\\[([^\\]]*?)\\]\\s*,)' // deps array (with comma)
//			// find "function name? (args?) {" OR "{"
//			// args doesn't match on quotes ([^)\'"]*) to prevent this snippet from
//			// lodash from capturing an extra quote: `'function(' + x + ') {\n'`
//			+ '|(?:(function)\\s*[0-9a-zA-Z_$]*\\s*\\(([^)\'"]*)\\))?\\s*({)'

		''
		// block comments
		+ '|(\\/\\*)|(\\*\\/)'
		// line comments
		+ '|(\\/{2})|(\\n|\\r|$)'
		// regexp literals. to disambiguate division sign, check for leading
		// operators. Note: this will falsely identify a division sign
		// at the start of a line as a regexp when there is a second division
		// sign on the same line.  Seriously edgy case, imho.
		+ '|[+\\-*\/=\\,%&|^!(;\\{\\[<>]\\s*(\\/)[^\\/\\n]+\\/' // TODO: escaped slashes
		// quotes and double-quotes
		// escaped quotes are captured, too, but double escapes are ignored
		+ '|(?:\\\\\\\\)|(\\\\["\'])|(["\'])',
		'g'
	);

}
