/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */

require('angular');
require('angular-route');

var uid = require('rave/lib/uid');

var angular = typeof global !== 'undefined'
	? global.angular
	: typeof window !== 'undefined' ? window.angular
	: void 0;

exports.create = create;

if (typeof angular === 'undefined') {
	throw new Error('Angular (angular.js) did not load.');
}
else if (!angular.isDefined('ngRoute')) {
	throw new Error('ngRoute (angular-route.js) did not load.');
}

function create (context) {
	// TODO: devs shouldn't have to deal with the internal unique ids
	var main;
	main = getUid(context, 'angular');
	context.loader.set(main, new Module(angular));
	main = getUid(context, 'angular-route');
	context.loader.set(main, new Module(angular.module('ngRoute')));
}

function getUid (context, pkgName) {
	var pkgUid, pkg;
	pkgUid = context.packages[pkgName].uid;
	pkg = context.packages[pkgUid];
	return uid.create(pkg, pkgName + '/' + pkgName);
}
