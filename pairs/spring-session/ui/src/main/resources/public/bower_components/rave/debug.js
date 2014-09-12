/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
var auto = require('./auto');
var uid = require('./lib/uid');
//var override = require('./load/override');
var metadata = require('./lib/metadata');

module.exports = {
	main: startDebug
};

var debugging = "\
┏( ˆ◡ˆ)┛ ┗(ˆ◡ˆ )┓ Welcome to the RaveJS debug party! ┏( ˆ◡ˆ)┛ ┗(ˆ◡ˆ )┓\n\
\n\
If you see some 404s for JSON files, that's ok! \
They'll go away when you build your app.\n\
If the 404s are spoiling your debug party, the README.md shows how to evict them.\n\n\
-> Type rave() to turn on REPL commands. (experimental)";

var replCommands = "Available commands:\n\
-> rave.dump() - returns rave's context to be viewed or manipulated.\n\
-> rave.version - shows rave's version.\n\
-> rave.checkVersions() - checks if extensions are compatible.\n\
-> rave.help() - shows these commands.\n\
-> what else should we provide????";

var replEnabled = "Rave {raveVersion} REPL enabled! \n"
	+ replCommands;

var multipleRaves = "Warning: multiple versions of rave are installed. \
Update the app's dependencies or try the rave.checkVersions() REPL function.";

var raveResolution = "Warning: rave conflict indicated in bower.json. \
Update the app's dependencies or try the rave.checkVersions() REPL function.";

var semverNotInstalled = "Note: rave.checkVersions() requires the npm semver \
package to verify rave extension semver conflicts. However, the semver \n\
package isn't needed if you understand semver.\nTry updating your npm or \
bower dependencies.  If updating doesn't resolve the problem, reload \
and try rave.checkVersions() again after installing the npm semver package:\n\
$ npm install --save semver\n";

var updateDepsInstructions = "To update npm dependencies:\n\
$ npm cache clean && npm update && npm dedupe\n\
To update bower dependencies:\n\
$ bower cache clean && bower update";

var semverMissing = "  ?  {extName} does not specify a rave version. \
Please ask the author to add rave to peerDependencies (npm) or \
dependencies (bower). {bugsLink}";

var semverValid = "  ✓  {extName} depends on rave {raveSemver}.";

var semverInfo = "  -  {extName} depends on rave {raveSemver}.";

var semverInvalid = " !!! {extName} depends on rave {raveSemver}. \
If this extension is old, please ask the author to update it. {bugsLink}";

var currRaveVersion = "Rave version is {raveVersion}.";

var unknownPackage = "Unknown package when importing {0} from {1}\n\
Did you forget to specify `--save` when installing?";

var wrongModuleType = "Possible moduleType mismatch? Module {name} appears \
to be of type {sourceType}? \nPlease ask the package author to add or update \
moduleType.";

var overriddenPackage = "Package `{overrider}` overrode metadata properties \
of package `{overridee}`.";

var defaultedPackage = "Package `{overrider}` provided default metadata for \
missing properties of package `{overridee}`.";

function startDebug (context) {
	var rave, enabled;

	console.log(debugging);

	rave = global.rave = function () {
		var message, version;

		version = findVersion(context);
		message = render({ raveVersion: version }, replEnabled);

		if (enabled) {
			console.log(message);
			return;
		}

		enabled = true;

		// TODO: load a debug REPL module?
		rave.dump = function () {
			return context;
		};
		rave.version = version;
		rave.checkVersions = function () {
			runSemverOnExtensions(context);
		};
		rave.help = function () {
			console.log(replCommands);
		};

		console.log(message);
	};

	var applyHooks = auto.applyLoaderHooks;
	auto.applyLoaderHooks = function (context, extensions) {
		return applyHooks.call(this, context, extensions).then(function (result) {
			var normalize = context.loader.normalize;
			// log an error if rave encounters an unknown package
			context.loader.normalize = function (name, refName, refUrl) {
				try {
					var normalized = normalize(name, refName, refUrl);
				}
				catch (ex) {
					console.error(render(arguments, unknownPackage));
					throw ex;
				}
				return normalized;
			};
			// log an error if it looks like an incorrect module type was applied
			// override instantiate to catch throws of ReferenceError
			// errors can happen when instantiate hook runs (AMD) or when returned factory runs (node)
			// if /\bdefine\b/ in message, module is AMD, but was not declared as AMD
			// if /\brequire\b|\exports\b|\bmodule\b/ in message, module is node, but was not declared as node
			var instantiate = context.loader.instantiate;
			context.loader.instantiate = function (load) {
				try {
					return Promise.resolve(instantiate(load)).then(createCheckedFactory, checkError);
				}
				catch (ex) {
					checkError(ex);
					throw ex;
				}
				function createCheckedFactory (result) {
					var execute = result.execute;
					if (execute) {
						result.execute = function () {
							try {
								return execute.apply(this, arguments);
							}
							catch (ex) {
								checkError(ex);
								throw ex;
							}
						}
					}
					return result;
				}
				function checkError (ex) {
					var info = {
						name: load.name,
						declaredType: metadata.findPackage(context.packages, load.name).moduleType
					};
					if (ex instanceof ReferenceError) {
						if (!/\bdefine\b/.test(ex.message)) {
							if (/\brequire\b|\exports\b|\bmodule\b/.test(ex.message)) {
								info.sourceType = 'node';
							}
						}
						else {
							info.sourceType = 'AMD';
						}
						if (info.sourceType) {
							console.error(render(info, wrongModuleType));
						}
					}
					return ex;
				}
			};
			return result;
		});
	};

	auto.main(context)
		.then(
			function (context) {
				return detectExtensionConflict(context);
			},
			function (ex) {
				detectExtensionConflict(context);
				throw ex;
			}
		)
		.then(logOverrides);
}

function findVersion (context) {
	try {
		return context.packages.rave.metadata.version;
	}
	catch (ex) {
		console.error('Rave metadata not found! Did you forget to install rave with the --save option?');
		return "(unknown version)";
	}
}

function render (values, template) {
	return template.replace(/\{([^\}]+)\}/g, function (m, key) {
		return values[key];
	});
}

function detectExtensionConflict (context) {
	// 1. check for more than one rave package. this indicates an npm conflict
	// caused by using "dependencies" instead of "peerDependencies" and
	// "devDependencies". it could also indicate that the user has installed
	// rave via one package manager and extensions via the other.
	if (hasMultipleRaves(context)) {
		console.warn(multipleRaves);
		console.log(updateDepsInstructions);
	}
	// 2. check for resolutions.rave in bower.json which indicates a bower conflict.
	// TODO: how do we detect this if the user hasn't chosen to save the resolution?
	if (hasRaveResolution(context)) {
		console.warn(raveResolution);
		console.log(updateDepsInstructions);
	}
	return context;
}

function hasMultipleRaves (context) {
	var packages, version;
	packages = context.packages;
	for (var name in packages) {
		if (packages[name].name === 'rave') {
			if (typeof version === 'undefined') {
				version = packages[name].version;
			}
			else if (version !== packages[name].version) {
				return true;
			}
		}
	}
	return false;
}

function hasRaveResolution (context) {
	var metadata = context.metadata;
	for (var i = 0; i < metadata.length; i++) {
		if (metadata.resolutions && metadata.resolutions.rave) {
			return true;
		}
	}
	return false;
}

function runSemverOnExtensions (context) {
	return require.async('semver').then(runSemver, noSemver);
	function runSemver (semver) {
		var packages = context.packages;
		var seen = {};
		var name, pkg, raveSemver, currVer, meta, extName, satisfies, info;
		currVer = findVersion(context);
		console.log(render({ raveVersion: currVer }, currRaveVersion));
		for (name in packages) {
			pkg = packages[name];
			if (!(pkg.name in seen)) {
				seen[pkg.name] = true;
				meta = pkg.metadata;
				extName = meta.rave && (typeof meta.rave === 'string'
					? meta.rave
					: meta.rave.extension);
				if (extName) {
					raveSemver = meta.dependencies && meta.dependencies.rave
						|| meta.peerDependencies && meta.peerDependencies.rave;
					satisfies = semver && semver.satisfies(currVer, raveSemver);
					info = {
						extName: meta.name,
						raveSemver: raveSemver,
						bugsLink: findBugsLink(meta) || ''
					};
					if (!raveSemver) {
						console.log(render(info, semverMissing));
					}
					else if (!semver) {
						console.log(render(info, semverInfo));
					}
					else if (satisfies) {
						console.log(render(info, semverValid));
					}
					else {
						console.log(render(info, semverInvalid));
					}
				}
			}
		}
		console.log('\n' + updateDepsInstructions);
	}
	function noSemver () {
		console.log(semverNotInstalled);
		runSemver();
	}
}

function findBugsLink (meta) {
	var link = '';
	if (meta.bugs) {
		link = typeof meta.bugs === 'string'
			? meta.bugs
			: meta.bugs.url || meta.bugs.email;
	}
	if (!link && meta.homepage) {
		link = meta.homepage;
	}
	if (!link && meta.maintainers) {
		link = findPersonLink(meta.maintainers[0]);
	}
	if (!link && meta.contributors) {
		link = findPersonLink(meta.contributors[0]);
	}
	if (!link && meta.authors) {
		link = findPersonLink(meta.authors[0]);
	}
	if (!link && meta.author) {
		link = findPersonLink(meta.author);
	}
	return link;
}

function findPersonLink (person) {
	if (typeof person === 'string') {
		return person;
	}
	else {
		return person.url || person.web || person.homepage || person.email;
	}
}

function logOverrides (context) {
	var seen, name, pkg, extMeta, oname;
	seen = {};
	for (name in context.packages) {
		pkg = context.packages[name];
		// packages are keyed by versioned and unversioned names
		if (!(pkg.name in seen) && pkg.metadata && pkg.metadata.rave) {
			seen[pkg.name] = true;
			extMeta = pkg.metadata.rave;
			// TODO: ensure that overridee is found
			if (extMeta.missing) {
				for (oname in extMeta.missing) {
					if (oname in context.packages) {
						console.log(render({ overrider: pkg.name, overridee: oname }, defaultedPackage));
					}
				}
			}
			if (extMeta.overrides) {
				for (oname in extMeta.overrides) {
					if (oname in context.packages) {
						console.log(render({ overrider: pkg.name, overridee: oname }, overriddenPackage));
					}
				}
			}
		}
	}
	return context;
}
