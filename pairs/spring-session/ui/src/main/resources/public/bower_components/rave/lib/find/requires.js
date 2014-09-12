/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
module.exports = findRequires;

var createCodeFinder = require('./createCodeFinder');

var findRValueRequiresRx = /require\s*\(\s*(["'])(.*?[^\\])\1\s*\)/g;
var idMatch = 2;

var finder = createCodeFinder(findRValueRequiresRx);

function findRequires (source) {
	var deps, seen;

	deps = [];
	seen = {};

	finder(source, function (matches) {
		var id = matches[idMatch];
		if (id) {
			// push [relative] id into deps list and seen map
			if (!(id in seen)) {
				seen[id] = true;
				deps.push(id)
			}
		}
	});

	return deps;
}
