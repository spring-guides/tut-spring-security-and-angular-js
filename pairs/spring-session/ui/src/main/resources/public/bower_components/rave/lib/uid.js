/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
exports.create = createUid;
exports.parse = parseUid;
exports.getName = getName;

function createUid (descriptor, normalized) {
	return /*descriptor.pmType + ':' +*/ descriptor.name
		+ (descriptor.version ? '@' + descriptor.version : '')
		+ (normalized ? '#' + normalized : '');
}


function parseUid (uid) {
	var uparts = uid.split('#');
	var name = uparts.pop();
	var nparts = name.split('/');
	return {
		name: name,
		pkgName: nparts.shift(),
		modulePath: nparts.join('/'),
		pkgUid: uparts[0]
	};
}


function getName (uid) {
	return uid.split("#").pop();
}
