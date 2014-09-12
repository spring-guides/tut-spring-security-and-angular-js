/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
module.exports = findEs5ModuleTypes;

var createCodeFinder = require('./createCodeFinder');
var findAmdEvidence = require('./amdEvidence');
var findCjsEvidence = require('./cjsEvidence');

findEs5ModuleTypes.rx = createCodeFinder.composeRx(
	findAmdEvidence.rx, findCjsEvidence.rx, 'g'
);

var finder = createCodeFinder(findEs5ModuleTypes.rx);

function findEs5ModuleTypes (source, preferAmd) {
	var results, foundDefine;

	results = { isCjs: false, isAmd: false };

	finder(source, function (matches) {
		var amdDefine = matches[1], amdDetect = matches[2], cjs = matches[3];
		if (cjs) {
			// only flag as CommonJS if we haven't hit a define
			// this prevents CommonJS-wrapped AMD from being flagged as cjs
			if (!foundDefine) results.isCjs = true;
		}
		else if (amdDefine || amdDetect) {
			results.isAmd = true;
			foundDefine = amdDefine;
			// optimization: stop searching if we found AMD evidence
			if (preferAmd) return 1e10;
		}
	});

	return results;
}

