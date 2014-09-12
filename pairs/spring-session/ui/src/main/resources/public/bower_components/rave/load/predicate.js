/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */

exports.composePredicates = composePredicates;
exports.createPackageMatcher = createPackageMatcher;
exports.createPatternMatcher = createPatternMatcher;
exports.createExtensionsMatcher = createExtensionsMatcher;

function composePredicates (matchPackage, matchPattern, matchExtensions, override) {
	var predicate, predicates = [];

	predicate = override.predicate || always;

	if (override.package && override.package !== '*') {
		predicates.push(matchPackage);
	}

	if (override.pattern) {
		predicates.push(matchPattern);
	}

	if (override.extensions) {
		predicates.push(matchExtensions);
	}

	return predicates.length > 0
		? testAllPredicates
		: predicate;

	function testAllPredicates (load) {
		for (var i = 0, len = predicates.length; i < len; i++) {
			if (!predicates[i](load)) return false;
		}
		return predicate.apply(this, arguments);
	}
}

function createPackageMatcher (samePackage, override) {
	return function (load) {
		return samePackage(load.name, override.package);
	};
}

function createPatternMatcher (override) {
	var patternRx = typeof override.pattern === 'string'
		? new RegExp(override.pattern)
		: override.pattern;
	return function (load) {
		return patternRx.test(load.name);
	};
}

function createExtensionsMatcher (override) {
	var extensions = override.extensions && override.extensions.map(function (ext) {
		return ext.charAt(0) === '.' ? ext : '.' + ext;
	});
	return function (load) {
		var name = load.name;
		return extensions.some(function (ext) {
			return name.slice(-ext.length) === ext;
		});
	};
}

function always () { return true; }
