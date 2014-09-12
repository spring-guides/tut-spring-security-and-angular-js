/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
module.exports = createRequire;

var es5Transform = require('./es5Transform');

function createRequire (loader, refId) {

	var require = function (id) { return syncRequire(id); };

	// Implement proposed require.async, just like Montage Require:
	// https://github.com/montagejs/mr, but with an added `names`
	// parameter.
	require.async = function (id) {
		var abs, args;
		try {
			abs = loader.normalize(id, refId);
		}
		catch (ex) {
			return Promise.reject(ex);
		}
		args = arguments;
		return loader.import(abs).then(function (value) {
			return getExports(args[1], value);
		});
	};

	require.named = syncRequire;

	return require;

	function syncRequire (id, names) {
		var abs, value;
		abs = loader.normalize(id, refId);
		value = loader.get(abs);
		return getExports(names, value);
	}
}

function getExports (names, value) {
	var exports, i;
	// only attempt to get names if an array-like object was supplied
	if (Object(names) === names && names.hasOwnProperty('length')) {
		exports = {};
		for (i = 0; i < names.length; i++) {
			exports[names[i]] = value[names[i]];
		}
		return exports;
	}
	else {
		return es5Transform.fromLoader(value);
	}
}
