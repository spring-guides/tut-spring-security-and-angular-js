/** @license MIT License (c) copyright 2014 original authors */
/** @author Karolis Narkevicius */
var metadata = require('./metadata');
var path = require('./path');

module.exports = createMapper;

function createMapper (context) {
	var packages;

	packages = context.packages;

	return function (normalizedName, refUid) {
		var refPkg, mappedId;

		refPkg = metadata.findPackage(packages, refUid);

		if (refPkg.map) {
			for (mappedId in refPkg.map) {
				if (mappedId === normalizedName) {
					return refPkg.map[mappedId]
						? refPkg.map[mappedId]
						: 'rave/lib/blank';
				}
			}
		}

		return normalizedName;
	};
}
