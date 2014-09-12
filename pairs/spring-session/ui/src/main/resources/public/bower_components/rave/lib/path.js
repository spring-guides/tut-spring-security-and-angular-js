/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
var absUrlRx, findDotsRx;

absUrlRx = /^\/|^[^:]+:\/\//;
findDotsRx = /(\.)(\.?)(?:$|\/([^\.\/]+.*)?)/g;

/** @module path */
module.exports = {
	isAbsUrl: isAbsUrl,
	isRelPath: isRelPath,
	joinPaths: joinPaths,
	ensureEndSlash: ensureEndSlash,
	ensureExt: ensureExt,
	removeExt: removeExt,
	reduceLeadingDots: reduceLeadingDots,
	splitDirAndFile: splitDirAndFile
};

/**
 * Returns true if the url is absolute (not relative to the document)
 * @param {string} url
 * @return {Boolean}
 */
function isAbsUrl (url) {
	return absUrlRx.test(url);
}

/**
 * Returns true if the path provided is relative.
 * @param {string} path
 * @return {Boolean}
 */
function isRelPath (path) {
	return path.charAt(0) == '.';
}

/**
 * Joins path parts together.
 * @param {...string} parts
 * @return {string}
 */
function joinPaths () {
	var result, parts;
	parts = Array.prototype.slice.call(arguments);
	result = [parts.pop() || ''];
	while (parts.length) {
		result.unshift(ensureEndSlash(parts.pop()))
	}
	return result.join('');
}

/**
 * Ensures a trailing slash ("/") on a string.
 * @param {string} path
 * @return {string}
 */
function ensureEndSlash (path) {
	return path && path.charAt(path.length - 1) !== '/'
		? path + '/'
		: path;
}

/**
 * Checks for an extension at the end of the url or file path.  If one isn't
 * specified, it is added.
 * @param {string} path is any url or file path.
 * @param {string} ext is an extension, starting with a dot.
 * @returns {string} a url with an extension.
 */
function ensureExt (path, ext) {
	var hasExt = path.lastIndexOf(ext) > path.lastIndexOf('/');
	return hasExt ? path : path + ext;
}

/**
 * Removes a file extension from a path.
 * @param {string} path
 * @returns {string} path without a file extension.
 */
function removeExt (path) {
	var dotPos = path.lastIndexOf('.'), slashPos = path.lastIndexOf('/');
	return dotPos > slashPos ? path.slice(0, dotPos) : path;
}

/**
 * Normalizes a CommonJS-style (or AMD) module id against a referring
 * module id.  Leading ".." or "." path specifiers are folded into
 * the referer's id/path.  Interprets module ids of "." and ".." as meaning
 * "grab the module whose name is the same as my folder or parent folder".
 * These special folder ids are not included in the AMD spec, but seem to
 * work in RequireJS, curl.js, and dojo -- as well as node.js.
 * @param {string} childId
 * @param {string} refId
 * @return {string}
 */
function reduceLeadingDots (childId, refId) {
	var removeLevels, normId, levels, diff;

	if (isRelPath(childId)) {
		// detect if childId refers to a directory or to a module
		removeLevels = childId.slice(-1) === '.' ? 0 : 1;

		// replaceDots() also counts levels.
		normId = childId.replace(findDotsRx, replaceDots);

		levels = refId.split('/');
		diff = levels.length - removeLevels;

		if (diff < 0) {
			// This is an attempt to navigate above parent module.
			// maybe this is a url? Punt and return url;
			return childId;
		}

		levels.splice(diff, removeLevels);

		// normId || [] prevents concat from adding extra "/" when
		// normId is reduced to a blank string.
		return levels.concat(normId || []).join('/');
	}
	else {
		return childId;
	}

	function replaceDots (m, dot, dblDot, remainder) {
		if (dblDot) removeLevels++;
		return remainder || '';
	}
}

function splitDirAndFile (url) {
	var parts, file;
	parts = url.split('/');
	file = parts.pop();
	return [
		parts.join('/'),
		file
	];
}
