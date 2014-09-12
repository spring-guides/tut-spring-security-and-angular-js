/** @license MIT License (c) copyright 2014 original authors */
/** @author Karolis Narkevicius */
var createMapper = require('./createMapper');
var uid = require('./uid');

module.exports = createPackageMapper;

function createPackageMapper (context) {
	var mapper = createMapper(context);
	return function (normalizedName, refUid, refUrl) {
		return mapper(uid.getName(normalizedName), refUid, refUrl);
	};
}
