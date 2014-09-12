/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
module.exports = locatePackage;

var path = require('../lib/path');
var parseUid = require('../lib/uid').parse;
var metadata = require('../lib/metadata');

function locatePackage (load) {
	var options, parts, packageName, modulePath, moduleName, descriptor,
		location;

	options = load.metadata.rave;

	if (!options.packages) throw new Error('Packages not provided: ' + load.name);

	parts = parseUid(load.name);
	packageName = parts.pkgUid || parts.pkgName;
	modulePath = parts.modulePath;

	descriptor = options.packages[packageName];
	if (!descriptor) throw new Error('Package not found: ' + load.name);

	moduleName = modulePath || descriptor.main;
	if (!load.metadata.dontAddExt) {
		moduleName = path.ensureExt(moduleName, '.js')
	}

	location = descriptor.location;
	if (!path.isAbsUrl(location) && options.baseUrl) {
		// prepend baseUrl
		location = path.joinPaths(options.baseUrl, location);
	}

	return path.joinPaths(location, moduleName);
}
