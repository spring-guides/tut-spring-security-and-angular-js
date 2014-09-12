/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */

var predicate = require('./predicate');
var specificity = require('./specificity');
var parse = require('../lib/uid').parse;

exports.hooks = overrideHooks;
exports.hook = overrideHook;
exports.sortByPredicate = sortByPredicate;
exports.toFastOverride = toFastOverride;
exports.callHook = callHook;
exports.callNormalize = callNormalize;
exports.packageMatch = sameCommonJSPackages;

var notCalled = false;

function sortByPredicate (overrides) {
	return overrides.sort(specificity.compare);
}

/**
 * Creates a unified set of loader hooks given the overrides collected
 * from rave load extensions.
 * @param {Object} originalHooks is an object whose properties are the loader's
 *   original hooks (or at least the ones that were present before rave first
 *   overrode any hooks).
 * @param {Array} overrides is the collection of overrides to apply.  These
 *   must be concatenated with any previous overrides or the previous ones will
 *   be lost if this method is applied multiple times.
 * @returns {{normalize: Function, locate: Function, fetch: Function, translate: Function, instantiate: Function}}
 */
function overrideHooks (originalHooks, overrides) {
	var sorted;

	sorted = sortByPredicate(overrides)
		.map(toFastOverride);

	return {
		normalize: overrideHook('normalize', originalHooks.normalize, sorted, callNormalize),
		locate: overrideHook('locate', originalHooks.locate, sorted),
		fetch: overrideHook('fetch', originalHooks.fetch, sorted),
		translate: overrideHook('translate', originalHooks.translate, sorted),
		instantiate: overrideHook('instantiate', originalHooks.instantiate, sorted)
	};
}

/**
 * Creates an overridden loader hook given an array of overrides and the
 * name of the hook.
 * @private
 * @param {string} name is the name of the hook.
 * @param {function():*} originalHook is the loader's original hook.
 * @param {Array<Object>} overrides is the collection of rave extension
 *   override definitions.
 * @param {function} [eachOverride] is a function that creates a function that
 *   will test a predicate and possibly call a hook override.  Called for each
 *   override for the named hook.
 * @returns {function():*}
 */
function overrideHook (name, originalHook, overrides, eachOverride) {
	var hooks;

	if (!eachOverride) eachOverride = callHook;
	hooks = overrides.reduce(reduceByName, []);

	return hooks.length ? callHooks : originalHook;

	function callHooks () {
		var result;
		for (var i = 0, len = hooks.length; i < len; i++) {
			result = hooks[i].apply(this, arguments);
			if (result !== notCalled) return result;
		}
		return originalHook.apply(this, arguments);
	}

	function reduceByName (hooks, override) {
		if (override.hooks[name]) {
			hooks.push(eachOverride(override.predicate, override.hooks[name], notCalled));
		}
		return hooks;
	}

}

function callHook (predicate, hook, defaultValue) {
	return function (load) {
		return predicate(load) ? hook(load) : defaultValue;
	};
}

function callNormalize (predicate, normalize, defaultValue) {
	return function (name, refName, refUrl) {
		var normalized = normalize(name, refName, refUrl);
		return predicate({ name: normalized }) ? normalized : defaultValue;
	};
}

function toFastOverride (override) {
	var samePackage, pred;

	samePackage = override.samePackage || sameCommonJSPackages;

	pred = predicate.composePredicates(
		predicate.createPackageMatcher(samePackage, override),
		predicate.createPatternMatcher(override),
		predicate.createExtensionsMatcher(override),
		override
	);

	return {
		predicate: pred,
		hooks: override.hooks
	};
}

function sameCommonJSPackages (a, b) {
	return parse(a).pkgName === parse(b).pkgName;
}
