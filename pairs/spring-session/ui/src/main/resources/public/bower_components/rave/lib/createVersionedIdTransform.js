/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
var createUid = require('./uid').create;
var metadata = require('./metadata');
var path = require('./path');

module.exports = createVersionedIdTransform;

function createVersionedIdTransform (context) {
	var packages;

	packages = context.packages;

	return function (normalized, refUid, refUrl) {
		var refPkg, depPkg;

		refPkg = metadata.findPackage(packages, refUid);
		depPkg = metadata.findDepPackage(packages, refPkg, normalized);

		if (!depPkg) {
			depPkg = metadata.findPackage(packages, normalized);
		}

		if (!depPkg) {
			throw new Error('Package not found for ' + normalized);
		}

		// translate package main (e.g. "rest" --> "rest/rest")
		if (normalized === depPkg.name && depPkg.main) {
			normalized = depPkg.main.charAt(0) === '.'
				? path.reduceLeadingDots(depPkg.main, path.ensureEndSlash(depPkg.name))
				: path.joinPaths(depPkg.name, depPkg.main);
		}

		if (normalized.indexOf('#') < 0) {
			// it's not already an uid
			normalized = createUid(depPkg, normalized);
		}

		return normalized;
	};
}
