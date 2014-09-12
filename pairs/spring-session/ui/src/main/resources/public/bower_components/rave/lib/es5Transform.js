/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
module.exports = {
	fromLoader: function (value) {
		return value && value.__es5Module ? value.__es5Module : value;
	},
	toLoader: function (module) {
		return {
			// for real ES6 modules to consume this module
			'default': module,
			// for modules transpiled from ES5
			__es5Module: module
		};
	}
};
