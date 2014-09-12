/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
var path = require('../path');
var base = require('./base');
var normalize = require('../../pipeline/normalizeCjs');

var npmCrawler = Object.create(base);

module.exports = npmCrawler;

npmCrawler.libFolder = 'node_modules';

npmCrawler.metaName = 'package.json';

npmCrawler.setPackage = function (name) {
	base.setPackage.call(this, name);
	this.depRoot = path.joinPaths(this.pkgRoot, this.libFolder);
	return name;
};

npmCrawler.fetchMetaFile = function () {
	var url = path.joinPaths(this.pkgRoot, this.metaName);
	return this.fetchMetaFileAt(url);
};

npmCrawler.fetchMetaFileAt = function (url) {
	return require.async(url)
		['catch'](function (ex) {
			this.pkgRoot = this.traverseUpMetaDirectory(this.pkgRoot);
			this.depRoot = path.joinPaths(this.pkgRoot, this.libFolder);
			url = path.joinPaths(this.pkgRoot, this.metaName);
			return this.fetchMetaFileAt(url);
		}.bind(this))
		['catch'](function (ex) {
			return Promise.reject(new Error('Did not find ' + url));
		});
};

npmCrawler.traverseUpMetaDirectory = function (url) {
	// /client/node_modules/foo/node_modules/bar/package.json
	// /client/node_modules/bar/package.json
	// /client/package.json
	var parts = url.split(this.libFolder + '/');
	if (parts.length < 2) throw new Error('Parent package directory not found');
	if (parts.length === 2) {
		// remove package name because we're now at the top (application) level
		parts[1] = parts[1].replace(/^[^\/]+\//, '');
		return parts.join('');
	}
	else {
		// remove next-to-last package
		parts.splice(parts.length - 2, 1);
		return parts.join(this.libFolder + '/');
	}
};

npmCrawler.createDescriptor = function (metadata) {
	var descr, pkgRoot;
	descr = base.createDescriptor.call(this, metadata);
	descr.pmType = 'npm';
	descr.moduleType = metadata.moduleType || ['node'];
	if (metadata.main) {
		descr.main = path.removeExt(metadata.main);
	}
	if (metadata.browser) {
		if (typeof metadata.browser === "string") {
			descr.main = path.removeExt(metadata.browser);
		} else {
			pkgRoot = descr.name + "/index";
			descr.map = this.normalizeMap(metadata.browser, pkgRoot);
		}
	}
	return descr;
};

npmCrawler.normalizeMap = function (map, refId) {
	var normalized = {}, path;
	for (path in map) {
		normalized[normalize(path, refId)] = map[path]
			? normalize(map[path], refId)
			: false;
	}
	return normalized;
};
