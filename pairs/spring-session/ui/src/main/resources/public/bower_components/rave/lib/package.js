/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
var path = require('./path');

/**
 * @module rave/lib/package
 * Functions for CommonJS-style module packages
 */
module.exports = {

	normalizeDescriptor: normalizeDescriptor,
	normalizeCollection: normalizeCollection

};

function normalizeCollection (collection) {
	var result = {}, i, descriptor;
	if (collection && collection.length && collection[0]) {
		// array
		for (i = 0; i < collection.length; i++) {
			descriptor = normalizeDescriptor(collection[i]);
			result[descriptor.name] = descriptor;
		}
	}
	else if (collection) {
		// object hashmap
		for (i in collection) {
			descriptor = normalizeDescriptor(collection[i], i);
			result[descriptor.name] = descriptor;
		}
	}
	return result;
}

function normalizeDescriptor (thing, name) {
	var descriptor;

	descriptor = typeof thing === 'string'
		? fromString(thing)
		: fromObject(thing, name);

	if (name) descriptor.name = name; // override with hashmap key
	if (!descriptor.name) throw new Error('Package requires a name: ' + thing);
	descriptor.main = path.removeExt(descriptor.main);
	descriptor.location = path.ensureEndSlash(descriptor.location);
	descriptor.deps = {};

	return descriptor;
}

function fromString (str) {
	var parts = str.split('/');
	return {
		main: parts.pop(),
		location: parts.join('/'),
		name: parts.pop()
	};
}

function fromObject (obj, name) {
	return {
		main: obj.main || 'main', // or index?
		location: obj.location || '',
		name: obj.name || name
	};
}
