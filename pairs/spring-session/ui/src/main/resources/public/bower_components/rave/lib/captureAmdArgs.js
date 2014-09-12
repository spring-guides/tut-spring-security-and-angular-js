/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
module.exports = captureAmdArgs;

// TODO: deal with multiple define() calls?

var amdEval = new Function ('define', 'eval(arguments[1]);');

function captureAmdArgs (source) {
	var result, capture;

	capture = function captureDefine () {
		var args;

		args = Array.prototype.slice.call(arguments);

		// last arg is always the factory (or a plain value)
		result = { factory: ensureFactory(args.pop()) };

		// if there are other args
		if (args.length > 0) {
			// get list of dependency module ids
			result.depsList = args.pop();
			// if this is a string, then there are no deps
			if (typeof result.depsList === 'string') {
				result.name = result.depsList;
				delete result.depsList;
			}
			else {
				result.name = args.pop() || null;
			}
			if (args.length > 0) {
				throw new Error('Error parsing AMD source.');
			}
		}
	};

	// indicate we are AMD and we can handle the jqueries
	capture.amd = { jQuery: {} };

	amdEval(capture, source);

	if (!result) {
		throw new Error('AMD define not called.');
	}

	return result;
}

function ensureFactory (thing) {
	return typeof thing === 'function'
		? thing
		: function () { return thing; }
}
