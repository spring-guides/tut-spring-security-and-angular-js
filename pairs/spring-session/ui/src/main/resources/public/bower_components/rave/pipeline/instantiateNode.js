/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
var findRequires = require('../lib/find/requires');
var nodeFactory = require('../lib/nodeFactory');
var addSourceUrl = require('../lib/addSourceUrl');

module.exports = instantiateNode;

function instantiateNode (load) {
	var loader, deps, factory;

	loader = load.metadata.rave.loader;
	deps = findOrThrow(load);

	// if debugging, add sourceURL
	if (load.metadata.rave.debug) {
		load.source = addSourceUrl(load.address, load.source);
	}

	factory = nodeFactory(loader, load);

	return {
		deps: deps,
		execute: function () {
			return new Module(factory.apply(this, arguments));
		}
	};
}

function findOrThrow (load) {
	try {
		return findRequires(load.source);
	}
	catch (ex) {
		ex.message += ' ' + load.name + ' ' + load.address;
		throw ex;
	}
}

