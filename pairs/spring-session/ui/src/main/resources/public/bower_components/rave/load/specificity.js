/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */

exports.compare = compareFilters;
exports.pkgSpec = packageSpecificity;
exports.patSpec = patternSpecificity;
exports.extSpec = extensionSpecificity;
exports.predSpec = predicateSpecificity;

function packageSpecificity (filter) {
	if (!filter.package || filter.package === '*') return 0;
//	else if (filter.package.indexOf('*') >= 0) return 1;
	else return 1;
}

function patternSpecificity (filter) {
	return filter.pattern ? 1 : 0;
}

function extensionSpecificity (filter) {
	return filter.extensions && filter.extensions.length
		? 1 / filter.extensions.length
		: 0;
}

function predicateSpecificity (filter) {
	return filter.predicate ? 1 : 0;
}

function compareFilters (a, b) {
	// packages have highest priority
	var diff = packageSpecificity(a) - packageSpecificity(b);
	// after packages, patterns are priority
	if (diff === 0) diff = patternSpecificity(a) - patternSpecificity(b);
	// next priority is extensions
	if (diff === 0) diff = extensionSpecificity(a) - extensionSpecificity(b);
	// last priority is custom predicates
	if (diff === 0) diff = predicateSpecificity(a) - predicateSpecificity(b);
	// sort higher specificity filters to beginning of array
	return -diff;
}

