/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
module.exports = findCjsEvidence;

var createCodeFinder = require('./createCodeFinder');

findCjsEvidence.rx = /(\btypeof\s+exports\b|\bmodule\.exports\b|\bexports\.\b)/g;

var finder = createCodeFinder(findCjsEvidence.rx);

function findCjsEvidence (source) {
	var isCjs = false;

	finder(source, function () {
		isCjs = true;
		return 1e10; // stop searching
	});

	return { isCjs: isCjs };
}
