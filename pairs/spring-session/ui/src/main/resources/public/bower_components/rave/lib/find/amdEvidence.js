/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
module.exports = findAmdEvidence;

var createCodeFinder = require('./createCodeFinder');

findAmdEvidence.rx = /(\bdefine\s*\()|(\bdefine\.amd\b)/g;

var finder = createCodeFinder(findAmdEvidence.rx);

function findAmdEvidence (source) {
	var isAmd = false;

	finder(source, function () {
		isAmd = true;
		return 1e10; // stop searching
	});

	return { isAmd: isAmd };
}
