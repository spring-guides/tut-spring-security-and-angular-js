/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
module.exports = createCodeFinder;

// Export private functions for testing
createCodeFinder.composeRx = composeRx;
createCodeFinder.rxStringContents = rxStringContents;
createCodeFinder.skipTo = skipTo;

var trimRegExpRx = /^\/|\/[gim]*$/g;

// Look for code transitions.
var defaultTransitionsRx = composeRx(
	// Detect strings, blank strings, and comments.
	/(''?|""?|\/\/|\/\*)/,
	// Detect RegExps by excluding division sign and comments
	/(?:[\-+*\/=\,%&|^!(;\{\[<>]\s*)(\/)(?!\/|\*)/,
	'g'
);

// RegExps to find end of strings, comments, RegExps in code
// We can't detect blank strings easily, so we handle those specifically.
var defaultSkippers = {
	"''": false,
	'""': false,
	"'": /\\\\'|[^\\]'/g,
	'"': /\\\\"|[^\\]"/g,
	'//': /\n|$/g,
	'/*': /\*\//g,
	'/': /\\\\\/|[^\\]\//g
};

/**
 * Creates a function that will call a callback function with a set of matches
 * for each occurrence of a pattern match for a given RegExp.  Only true
 * JavaScript is searched.  Comments, strings, and RegExps are skipped.
 * The onMatch callback is called with a single parameter: an array containing
 * the result of calling the RegExp's exec() method.  If onMatch returns a
 * very large number, the pattern matching stops.
 * @param {RegExp} codeRx is a RegExp for the code pattern to find.
 * @param {RegExp} [codeTransitionsRx] is a RegExp to detect transitions into
 *   comments, strings, RegExps, etc.  If omitted, the default RegExp is suited
 *   to JavaScript code.
 * @param {function(matches:Array):number} [skip] is a function that returns
 *   a new position to resume searching the source code.
 * @returns {function(source:string, onMatch:function):string}
 */
function createCodeFinder (codeRx, codeTransitionsRx, skip) {
	var flags, comboRx;

	if (!codeTransitionsRx) codeTransitionsRx = defaultTransitionsRx;
	if (!skip) skip = skipNonCode;

	flags = 'g';
	if (codeRx.multiline) flags += 'm';
	if (codeRx.ignoreCase) flags += 'i';

	comboRx = composeRx(codeRx, codeTransitionsRx, flags);

	return function (source, onMatch) {
		var matches, index, rx, trans;

		comboRx.lastIndex = 0; // reset

		while (matches = comboRx.exec(source)) {

			index = skip(matches);

			if (index < 0) {
				// call onMatch and let it optionally skip forward
				index = onMatch(matches);
			}

			if (index >= 0) {
				comboRx.lastIndex = index;
			}

		}

		return source;
	};
}

function skipNonCode (matches) {
	var rx, trans, index;
	// pop off matches for regexp and other transitions
	rx = matches.pop();
	trans = matches.pop() || rx;
	if (!trans) return -1;
	if (defaultSkippers[trans]) {
		index = matches.index + matches[0].length;
		return skipTo(matches.input, defaultSkippers[trans], index);
	}
}

function skipTo (source, rx, index) {
	rx.lastIndex = index;

	if (!rx.exec(source)) {
		throw new Error(
			'Unterminated comment, string, or RegExp at '
			+ index + ' near ' + source.slice(index - 50, 100)
		);
	}

	return rx.lastIndex;
}

function composeRx (rx1, rx2, flags) {
	return new RegExp(rxStringContents(rx1)
		+ '|' + rxStringContents(rx2), flags);
}

function rxStringContents (rx) {
	return rx.toString().replace(trimRegExpRx, '');
}
