/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
module.exports = nodeFactory;

var es5Transform = require('./es5Transform');
var createRequire = require('./createRequire');

var nodeEval = new Function(
	'require', 'exports', 'module', 'global',
	'eval(arguments[4]);'
);

var _global;

_global = typeof global !== 'undefined' ? global : window;

function nodeFactory (loader, load) {
	var name, source, exports, module, require;

	name = load.name;
	source = load.source;
	exports = {};
	module = { id: name, uri: load.address, exports: exports };
	require = createRequire(loader, name);

	return function () {
		// TODO: use loader.global when es6-module-loader implements it
		nodeEval(require, module.exports, module, _global, source);
		// figure out what author intended to export
		return exports === module.exports
			? exports // a set of named exports
			: es5Transform.toLoader(module.exports); // a single default export
	};
}
