/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
var path = require('../path');
var base = require('./base');

var bowerCrawler = Object.create(base);

module.exports = bowerCrawler;

bowerCrawler.libFolder = 'bower_components';

bowerCrawler.metaName = 'bower.json';

bowerCrawler.altMetaName = 'package.json';

bowerCrawler.fetchMetaFile = function () {
	var url = path.joinPaths(this.pkgRoot, this.metaName);
	return require.async(url)
		['catch'](this.fetchAltMetaFile.bind(this))
		['catch'](this.createMetaFile.bind(this));
};

// If a bower component has no bower.json, we try fetching
// package.json instead. However, we don't want to use the
// dependencies hash from package.json since those are npm
// dependencies, which won't be installed by bower.
bowerCrawler.fetchAltMetaFile = function () {
	var url = path.joinPaths(this.pkgRoot, this.altMetaName);
	return require.async(url).then(function (metadata) {
		return {
			name: metadata.name,
			version: metadata.version,
			main: metadata.main,
			moduleType: metadata.moduleType || ["node"]
		};
	});
};

bowerCrawler.createMetaFile = function () {
	return {
		name: this.pkgName,
		version: "0.0.0",
		main: this.pkgName
	};
};

bowerCrawler.createDescriptor = function (metadata) {
	var descr, mainPath;
	metadata.version = metadata.version || "0.0.0";
	descr = base.createDescriptor.call(this, metadata);
	descr.pmType = 'bower';
	descr.moduleType = metadata.moduleType;
	descr.main = metadata.main && this.findJsMain(metadata.main);
	if (descr.main) {
		descr.main = path.removeExt(descr.main);
		mainPath = path.splitDirAndFile(descr.main);
		if (mainPath[0]) {
			descr.location = path.joinPaths(descr.location, mainPath[0]);
			descr.main = mainPath[1];
		}
	}
	return descr;
};

bowerCrawler.findJsMain = function (mains) {
	if (typeof mains === 'string') return mains;
	for (var i = 0; i < mains.length; i++) {
		if (mains[i].slice(-2) === 'js') return mains[i];
	}
};
