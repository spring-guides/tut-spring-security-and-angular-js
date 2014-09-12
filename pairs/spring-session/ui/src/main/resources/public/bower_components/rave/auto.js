/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
var metadata = require('./lib/metadata');
var fromMetadata = require('./lib/hooksFromMetadata');
var beget = require('./lib/beget');
var path = require('./lib/path');
var pkg = require('./lib/package');
var override = require('./load/override');

module.exports = {
	main: autoConfigure,
	applyLoaderHooks: applyLoaderHooks
};

var defaultMeta = 'bower.json,package.json';

function autoConfigure (context) {
	var urls, applyLoaderHooks;

	if (!context.raveMeta) context.raveMeta = defaultMeta;

	urls = context.raveMeta.split(/\s*,\s*/);

	context.packages = {};

	applyLoaderHooks = this.applyLoaderHooks;

	// TODO: consider returning this promise to rave.js to handle rejections
	return pmap(urls, function (url) {
		return metadata.crawl(context, url)['catch'](logMissing)
	}).then(done)['catch'](failHard);

	function done (metadatas) {

		context = gatherAppMetadata(context, metadatas);
		return configureLoader(context)
			.then(applyRavePackageMetadata)
			.then(gatherExtensions)
			.then(function (extensions) {
				// TODO: remove || [] when Promise shim is fixed
				return applyLoaderHooks(context, extensions || []);
			})
			.then(function (extensions) {
				// TODO: remove || [] when Promise shim is fixed
				return applyFirstMain(context, extensions || []);
			})
			.then(function (alreadyRanMain) {
				return !alreadyRanMain && initApplication(context);
			});
	}

	function logMissing (ex) {
		console.error('Did not find metadata file', ex);
		console.error(ex.stack);
	}
}

function gatherAppMetadata (context, metadatas) {
	// TODO: if no main modules found, look for one in a conventional place
	// TODO: warn if multiple main modules were found, but only the first was run
	var i, meta, first;
	context.metadata = [];
	for (i = 0; i < metadatas.length; i++) {
		meta = metadatas[i];
		// skip missing metadata files
		if (meta) {
			// save metadata
			context.metadata.push(meta);
			if (!first) first = meta;
		}
	}
	if (first) {
		context.app = {
			name: first.name,
			main: path.joinPaths(first.name, first.main),
			metadata: first
		};
	}
	else {
		logNoMetadata(context);
	}
	return context;
}

function configureLoader (context) {
	var overrides = fromMetadata(context);
	context.load.overrides = overrides;
	var hooks = override.hooks(context.load.nativeHooks, overrides);
	for (var name in hooks) {
		context.loader[name] = hooks[name];
	}
	return Promise.resolve(context);
}

function gatherExtensions (context) {
	var seen, name, pkg, promises, extensionMeta;
	seen = {};
	promises = [];
	for (name in context.packages) {
		pkg = context.packages[name];
		// packages are keyed by versioned and unversioned names
		if (!(pkg.name in seen)) {
			seen[pkg.name] = true;
			if (pkg.metadata && pkg.metadata.rave) {

				extensionMeta = pkg.metadata.rave;
				if (typeof extensionMeta === 'string') {
					extensionMeta = { extension: extensionMeta };
				}

				if (extensionMeta.missing) {
					// apply missing
					applyOverrides(context.packages, extensionMeta.missing, true);
				}

				if (extensionMeta.overrides) {
					// apply overrides
					applyOverrides(context.packages, extensionMeta.overrides);
				}

				if (extensionMeta.extension) {
					promises.push(initExtension(context, pkg.name, extensionMeta.extension));
				}

			}
		}
	}
	return Promise.all(promises);
}

function applyRavePackageMetadata (context) {
	var app = context.app;
	var rave = app.metadata.metadata.rave;

	if (rave) {
		if (rave.missing) {
			applyOverrides(context.packages, rave.missing, app.metadata, true);
		}
		if (rave.overrides) {
			applyOverrides(context.packages, rave.overrides, app.metadata);
		}
	}

	return context;
}

function applyOverrides (packages, overrides, fromPkg, ifMissing) {
	var name, pkg, key, pkgOverrides;
	for (name in overrides) {
		pkg = metadata.findDepPackage(packages, fromPkg, name);
		if (pkg) {
			pkgOverrides = overrides[name];
			for (key in pkgOverrides) {
				if (!ifMissing || typeof pkg[key] === 'undefined') {
					pkg[key] = pkgOverrides[key];
				}
			}
		}
	}
}

function initExtension (context, packageName, moduleName) {
	return fetchExtension(path.joinPaths(packageName, moduleName))
		.then(extractExtensionCtor)
		.then(function (api) {
			return createExtensionApi(context, api);
		})
		['catch'](function (ex) {
			ex.message = 'Failed to initialize rave extension, "'
				+ packageName + '": ' + ex.message;
			throw ex;
		})
		.then(function (api) {
			return { name: packageName, api: api };
		});
}

function fetchExtension (extModuleName) {
	return require.async(extModuleName);
}

function extractExtensionCtor (extModule) {
	var create;
	if (extModule) {
		create = typeof extModule === 'function'
			? extModule
			: extModule.create;
	}
	if (!create) {
		throw new Error('API not found.');
	}
	return create;
}

function createExtensionApi (context, extension) {
	return extension(context);
}

function applyLoaderHooks (context, extensions) {
	return pmap(extensions, function (extension) {
		var api = extension.api;
		if (!api) return;
		if (api.load) {
			context.load.overrides = context.load.overrides.concat(api.load);
		}
	}).then(function () {
		var hooks = override.hooks(context.load.nativeHooks, context.load.overrides);
		for (var name in hooks) {
			context.loader[name] = hooks[name];
		}
	}).then(function () {
		return extensions;
	});
}

function applyFirstMain (context, extensions) {
	var appliedMain;
	map(extensions, function (extension) {
		var api = extension.api;
		if (api && api.main) {
			if (appliedMain) {
				throw new Error('Found multiple extensions with main().');
			}
			appliedMain = Promise.resolve(api.main(beget(context))).then(function () {
				return true;
			});
		}
	});
	return Promise.resolve(appliedMain);
}

function initApplication (context) {
	var mainModule;
	mainModule = context.app && context.app.main;
	if (mainModule) {
		return runMain(context, mainModule)
			.then(function () { return context; });
	}
	else {
		return context;
	}
}

function runMain (context, mainModule) {
	return require.async(mainModule)
		.then(function (main) {
			if (typeof main === 'function') {
				main(beget(context));
			}
			else if (typeof main.main === 'function') {
				main.main(beget(context));
			}
		});
}

function logNoMetadata (context) {
	console.error('Did not find any metadata files', context.raveMeta);
}

function failHard (ex) {
	setTimeout(function () { throw ex; }, 0);
}

function pmap (array, f) {
	return Promise.all(map(array, function (x) {
		return Promise.resolve(x).then(f);
	}));
}

function map (array, f) {
	var r = [];
	for (var i = 0; i < array.length; ++i) {
		r[i] = f(array[i]);
	}
	return r;
}
