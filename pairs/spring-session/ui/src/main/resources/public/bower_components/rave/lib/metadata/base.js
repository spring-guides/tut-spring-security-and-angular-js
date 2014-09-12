/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
var createUid = require('../uid').create;
var path = require('../path');

module.exports = {

	libFolder: null,

	metaName: null,

	root: null,

	depRoot: null,

	pkgName: null,

	pkgRoot: null,

	setRootUrl: function (url) {
		this.pkgRoot = path.splitDirAndFile(url)[0];
		this.root = this.pkgRoot;
		this.depRoot = path.joinPaths(this.pkgRoot, this.libFolder);
		return url;
	},

	setPackage: function (name) {
		this.pkgRoot = path.joinPaths(this.depRoot, name);
		return this.pkgName = name;
	},

	fetchMetaFile: function () {
		var url = path.joinPaths(this.pkgRoot, this.metaName);
		return require.async(url);
	},

	createDescriptor: function (metadata) {
		var descr;
		descr = {
			name: metadata.name,
			version: metadata.version,
			location: this.pkgRoot,
			main: metadata.main,
			metadata: metadata
		};
		descr.uid = createUid(descr);
		return descr;
	}

};
