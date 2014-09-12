/*
 * ES6 Module Loader Polyfill
 * https://github.com/ModuleLoader/es6-module-loader
 *
 * Based on the 2013-12-02 specification draft
 * System loader based on example implementation as of 2013-12-03
 *
 * Copyright (c) 2013 Guy Bedford, Luke Hoban, Addy Osmani
 * Licensed under the MIT license.
 *
 */

/*
  ToDo
  - Traceur ModuleTransformer update for new system
  - getImports to use visitor pattern
  - Loader Iterator support
  - Tracking these and spec issues with 'NB' comments in this code
*/
(function () {
  (function() {

    var isBrowser = typeof window != 'undefined';
    var global = isBrowser ? window : this;
    var exports = isBrowser ? window : module.exports;

    var nextTick = isBrowser ? function(fn) { setTimeout(fn, 1); } : process.nextTick;

    /*
    *********************************************************************************************

      Simple Promises A+ Implementation
      Adapted from https://github.com/RubenVerborgh/promiscuous
      Copyright 2013 Ruben Verborgh

    *********************************************************************************************
    */

    var Promise = global.Promise;
    if (Promise) {
      // check if native promises have what we need
      if (Promise.all && Promise.resolve && Promise.reject) {
        Promise = global.Promise;
        var p = new Promise(function(r) {
          if (typeof r != 'function')
            Promise = null;
        });
      }
      else
        Promise = null;
    }
    // export the promises polyfill
    if (!Promise)
    global.Promise = Promise = (function(setImmediate, func, obj) {
      // Type checking utility function
      function is(type, item) { return (typeof item)[0] == type; }

      // Creates a promise, calling callback(resolve, reject), ignoring other parameters.
      function Promise(callback, handler) {
        // The `handler` variable points to the function that will
        // 1) handle a .then(resolved, rejected) call
        // 2) handle a resolve or reject call (if the first argument === `is`)
        // Before 2), `handler` holds a queue of callbacks.
        // After 2), `handler` is a finalized .then handler.
        handler = function pendingHandler(resolved, rejected, value, queue, then, i) {
          queue = pendingHandler.q;

          // Case 1) handle a .then(resolved, rejected) call
          if (resolved != is) {
            return Promise(function(resolve, reject) {
              queue.push({ p: this, r: resolve, j: reject, 1: resolved, 0: rejected });
            });
          }

          // Case 2) handle a resolve or reject call
          // (`resolved` === `is` acts as a sentinel)
          // The actual function signature is
          // .re[ject|solve](<is>, success, value)

          // Check if the value is a promise and try to obtain its `then` method
          if (value && (is(func, value) | is(obj, value))) {
            try { then = value.then; }
            catch (reason) { rejected = 0; value = reason; }
          }
          // If the value is a promise, take over its state
          if (is(func, then)) {
            function valueHandler(resolved) {
              return function(value) { then && (then = 0, pendingHandler(is, resolved, value)); };
            }
            try { then.call(value, valueHandler(1), rejected = valueHandler(0)); }
            catch (reason) { rejected(reason); }
          }
          // The value is not a promise; handle resolve/reject
          else {
            // Replace this handler with a finalized resolved/rejected handler
            handler = createFinalizedThen(callback, value, rejected);
            // Resolve/reject pending callbacks
            i = 0;
            while (i < queue.length) {
              then = queue[i++];
              // If no callback, just resolve/reject the promise
              if (!is(func, resolved = then[rejected]))
                (rejected ? then.r : then.j)(value);
              // Otherwise, resolve/reject the promise with the result of the callback
              else
                finalize(then.p, then.r, then.j, value, resolved);
            }
          }
        };
        // The queue of pending callbacks; garbage-collected when handler is resolved/rejected
        handler.q = [];

        // Create and return the promise (reusing the callback variable)
        callback.call(callback = { then: function (resolved, rejected) { return handler(resolved, rejected); },
                                    catch: function (rejected)           { return handler(0,        rejected); } },
                      function(value)  { handler(is, 1,  value); },
                      function(reason) { handler(is, 0, reason); });
        return callback;
      }

      // Creates a resolved or rejected .then function
      function createFinalizedThen(promise, value, success) {
        return function(resolved, rejected) {
          // If the resolved or rejected parameter is not a function, return the original promise
          if (!is(func, (resolved = success ? resolved : rejected)))
            return promise;
          // Otherwise, return a finalized promise, transforming the value with the function
          return Promise(function(resolve, reject) { finalize(this, resolve, reject, value, resolved); });
        };
      }

      // Finalizes the promise by resolving/rejecting it with the transformed value
      function finalize(promise, resolve, reject, value, transform) {
        setImmediate(function() {
          try {
            // Transform the value through and check whether it's a promise
            value = transform(value);
            transform = value && (is(obj, value) | is(func, value)) && value.then;
            // Return the result if it's not a promise
            if (!is(func, transform))
              resolve(value);
            // If it's a promise, make sure it's not circular
            else if (value == promise)
              reject(new TypeError());
            // Take over the promise's state
            else
              transform.call(value, resolve, reject);
          }
          catch (error) { reject(error); }
        });
      }

      // Export the main module
      Promise.resolve = function (value) { return Promise(function (resolve)         { resolve(value) }); };
      Promise.reject = function (reason) { return Promise(function (resolve, reject) { reject(reason) }); };
      Promise.all = function(promises) {
        return new Promise(function(resolve, reject) {
          if (!promises.length)
            return setImmediate(resolve);

          var outputs = [];
          var resolved = 0;
          for (var i = 0, l = promises.length; i < l; i++) (function(i) {
            promises[i].then(function(resolvedVal) {
              outputs[i] = resolvedVal;
              resolved++;
              if (resolved == promises.length)
                resolve(outputs);
            }, reject);
          })(i);
        });
      }
      return Promise;
    })(nextTick, 'f', 'o');


    /*
    *********************************************************************************************

      Loader Polyfill

        - Implemented exactly to the 2013-12-02 Specification Draft -
          https://github.com/jorendorff/js-loaders/blob/e60d3651/specs/es6-modules-2013-12-02.pdf
          with the only exceptions as described here

        - Abstract functions have been combined where possible, and their associated functions
          commented

        - Declarative Module Support is entirely disabled, and an error will be thrown if
          the instantiate loader hook returns undefined

        - With this assumption, instead of Link, LinkDynamicModules is run directly

        - ES6 support is thus provided through the translate function of the System loader

        - EnsureEvaluated is removed, but may in future implement dynamic execution pending
          issue - https://github.com/jorendorff/js-loaders/issues/63

        - Realm implementation is entirely omitted. As such, Loader.global and Loader.realm
          accessors will throw errors, as well as Loader.eval

        - Loader module table iteration currently not yet implemented

    *********************************************************************************************
    */

    // Some Helpers

    // logs a linkset snapshot for debugging
    /* function snapshot(loader) {
      console.log('\n');
      for (var i = 0; i < loader._loads.length; i++) {
        var load = loader._loads[i];
        var linkSetLog = load.name + ' (' + load.status + '): ';

        for (var j = 0; j < load.linkSets.length; j++) {
          linkSetLog += '{'
          linkSetLog += logloads(load.linkSets[j].loads);
          linkSetLog += '} ';
        }
        console.log(linkSetLog);
      }
      console.log('\n');
    }
    function logloads(loads) {
      var log = '';
      for (var k = 0; k < loads.length; k++)
        log += loads[k].name + (k != loads.length - 1 ? ' ' : '');
      return log;
    } */

    function assert(name, expression) {
      if (!expression)
        console.log('Assertion Failed - ' + name);
    }
    function defineProperty(obj, prop, opt) {
      if (Object.defineProperty)
        Object.defineProperty(obj, prop, opt);
      else
         obj[prop] = opt.value || opt.get.call(obj);
    };
    function preventExtensions(obj) {
      if (Object.preventExtensions)
        Object.preventExtensions(obj);
    }

    // Define an IE-friendly shim good-enough for purposes
    var indexOf = Array.prototype.indexOf || function (item) {
      for (var i = 0, thisLen = this.length; i < thisLen; i++) {
        if (this[i] === item) {
          return i;
        }
      }
      return -1;
    };

    // Load Abstract Functions

    function createLoad(name) {
      return {
        status: 'loading',
        name: name,
        metadata: {},
        linkSets: []
      };
    }

    // promise for a load record, can be in registry, already loading, or not
    function requestLoad(loader, request, refererName, refererAddress) {
      return new Promise(function(resolve, reject) {
        // CallNormalize
        resolve(loader.normalize(request, refererName, refererAddress));
      })

      // GetOrCreateLoad
      .then(function(name) {
        var load;
        if (loader._modules[name]) {
          load = createLoad(name);
          load.status = 'linked';
          return load;
        }

        for (var i = 0, l = loader._loads.length; i < l; i++) {
          load = loader._loads[i];
          if (load.name == name) {
            assert('loading or loaded', load.status == 'loading' || load.status == 'loaded');
            return load;
          }
        }

        // CreateLoad
        load = createLoad(name);
        loader._loads.push(load);

        proceedToLocate(loader, load);

        return load;
      });
    }
    function proceedToLocate(loader, load) {
      proceedToFetch(loader, load,
        Promise.resolve()
        // CallLocate
        .then(function() {
          return loader.locate({ name: load.name, metadata: load.metadata });
        })
      );
    }
    function proceedToFetch(loader, load, p) {
      proceedToTranslate(loader, load,
        p
        // CallFetch
        .then(function(address) {
          if (load.status == 'failed') // NB https://github.com/jorendorff/js-loaders/issues/88
            return undefined;
          load.address = address;
          return loader.fetch({ name: load.name, metadata: load.metadata, address: address });
        })
      );
    }
    function proceedToTranslate(loader, load, p) {
      p
      // CallTranslate
      .then(function(source) {
        if (load.status == 'failed')
          return undefined;
        return loader.translate({ name: load.name, metadata: load.metadata, address: load.address, source: source })
      })

      // CallInstantiate
      .then(function(source) {
        if (load.status == 'failed')
          return undefined;
        load.source = source;
        return loader.instantiate({ name: load.name, metadata: load.metadata, address: load.address, source: source });
      })

      // InstantiateSucceeded
      .then(function(instantiateResult) {
        if (load.status == 'failed')
          return undefined;

        var depsList;
        if (instantiateResult === undefined)
          throw 'Declarative parsing is not implemented by the polyfill.';

        else if (typeof instantiateResult == 'object') {
          depsList = instantiateResult.deps || [];
          load.execute = instantiateResult.execute;
          load.kind = 'dynamic';
        }
        else
          throw TypeError('Invalid instantiate return value');

        // ProcessLoadDependencies
        load.dependencies = {};
        var loadPromises = [];
        for (var i = 0, l = depsList.length; i < l; i++) (function(request) {
          var p = requestLoad(loader, request, load.name, load.address);

          // AddDependencyLoad (load is parentLoad)
          p.then(function(depLoad) {
            assert('not already a dependency', !load.dependencies[request]);
            load.dependencies[request] = depLoad.name;

            if (depLoad.status != 'linked') {
              var linkSets = load.linkSets.concat([]);
              for (var i = 0, l = linkSets.length; i < l; i++)
                addLoadToLinkSet(linkSets[i], depLoad);
            }
          });

          loadPromises.push(p);
        })(depsList[i]);

        return Promise.all(loadPromises);
      })

      // LoadSucceeded
      .then(function() {
        assert('is loading', load.status == 'loading');

        load.status = 'loaded';

        // console.log('load succeeeded ' + load.name);
        // snapshot(loader);

        var linkSets = load.linkSets.concat([]);
        for (var i = 0, l = linkSets.length; i < l; i++)
          updateLinkSetOnLoad(linkSets[i], load);
      }

      // LoadFailed
      , function(exc) {
        assert('is loading on fail', load.status == 'loading');
        load.status = 'failed';
        load.exception = exc;
        for (var i = 0, l = load.linkSets.length; i < l; i++)
          linkSetFailed(load.linkSets[i], exc);
        assert('fail linkSets removed', load.linkSets.length == 0);
      });
    }


    // LinkSet Abstract Functions
    function createLinkSet(loader, startingLoad) {
      var resolve, reject, promise = new Promise(function(_resolve, _reject) { resolve = _resolve; reject = _reject; });
      var linkSet = {
        loader: loader,
        loads: [],
        done: promise,
        resolve: resolve,
        reject: reject,
        loadingCount: 0
      };
      addLoadToLinkSet(linkSet, startingLoad);
      return linkSet;
    }
    function addLoadToLinkSet(linkSet, load) {
      assert('loading or loaded on link set', load.status == 'loading' || load.status == 'loaded');

      for (var i = 0, l = linkSet.loads.length; i < l; i++)
        if (linkSet.loads[i] == load)
          return;

      linkSet.loads.push(load);
      load.linkSets.push(linkSet);

      if (load.status != 'loaded')
        linkSet.loadingCount++;

      var loader = linkSet.loader;

      for (var dep in load.dependencies) {
        var name = load.dependencies[dep];

        if (loader._modules[name])
          continue;

        for (var i = 0, l = loader._loads.length; i < l; i++)
          if (loader._loads[i].name == name) {
            addLoadToLinkSet(linkSet, loader._loads[i]);
            break;
          }
      }
      // console.log('add to linkset ' + load.name);
      // snapshot(linkSet.loader);
    }
    function updateLinkSetOnLoad(linkSet, load) {
      // NB https://github.com/jorendorff/js-loaders/issues/85
      // assert('no load when updated ' + load.name, indexOf.call(linkSet.loads, load) != -1);
      assert('loaded or linked', load.status == 'loaded' || load.status == 'linked');

      // console.log('update linkset on load ' + load.name);
      // snapshot(linkSet.loader);

      // see https://github.com/jorendorff/js-loaders/issues/80
      linkSet.loadingCount--;
      /* for (var i = 0; i < linkSet.loads.length; i++) {
        if (linkSet.loads[i].status == 'loading') {
          return;
        }
      } */

      if (linkSet.loadingCount > 0)
        return;

      var startingLoad = linkSet.loads[0];
      try {
        link(linkSet.loads, linkSet.loader);
      }
      catch(exc) {
        return linkSetFailed(linkSet, exc);
      }

      assert('loads cleared', linkSet.loads.length == 0);
      linkSet.resolve(startingLoad);
    }
    function linkSetFailed(linkSet, exc) {
      var loads = linkSet.loads.concat([]);
      for (var i = 0, l = loads.length; i < l; i++) {
        var load = loads[i];
        var linkIndex = indexOf.call(load.linkSets, linkSet);
        assert('link not present', linkIndex != -1);
        load.linkSets.splice(linkIndex, 1);
        if (load.linkSets.length == 0) {
          var globalLoadsIndex = indexOf.call(linkSet.loader._loads, load);
          if (globalLoadsIndex != -1)
            linkSet.loader._loads.splice(globalLoadsIndex, 1);
        }
      }
      linkSet.reject(exc);
    }
    function finishLoad(loader, load) {
      // if not anonymous, add to the module table
      if (load.name) {
        assert('load not in module table', !loader._modules[load.name]);
        loader._modules[load.name] = load.module;
      }
      var loadIndex = indexOf.call(loader._loads, load);
      if (loadIndex != -1)
        loader._loads.splice(loadIndex, 1);
      for (var i = 0, l = load.linkSets.length; i < l; i++) {
        loadIndex = indexOf.call(load.linkSets[i].loads, load);
        load.linkSets[i].loads.splice(loadIndex, 1);
      }
      load.linkSets = [];
    }
    function loadModule(loader, name, options) {
      return new Promise(asyncStartLoadPartwayThrough(loader, name, options && options.address ? 'fetch' : 'locate', undefined, options && options.address, undefined)).then(function(load) {
        return load;
      });
    }
    function asyncStartLoadPartwayThrough(loader, name, step, meta, address, source) {
      return function(resolve, reject) {
        if (loader._modules[name])
          throw new TypeError('Module "' + name + '" already exists in the module table');
        for (var i = 0, l = loader._loads.length; i < l; i++)
          if (loader._loads[i].name == name)
            throw new TypeError('Module "' + name + '" is already loading');

        var load = createLoad(name);

        if (meta)
          load.metadata = meta;

        var linkSet = createLinkSet(loader, load);

        loader._loads.push(load);

        // NB spec change as in https://github.com/jorendorff/js-loaders/issues/79
        linkSet.done.then(resolve, reject);

        if (step == 'locate')
          proceedToLocate(loader, load);

        else if (step == 'fetch')
          proceedToFetch(loader, load, Promise.resolve(address));

        else {
          assert('translate step', step == 'translate');
          load.address = address;
          proceedToTranslate(loader, load, Promise.resolve(source));
        }
      }
    }
    function evaluateLoadedModule(loader, load) {
      assert('is linked ' + load.name, load.status == 'linked');

      assert('is a module', load.module instanceof Module);

      // ensureEvaluated(load.module, [], loader);

      return load.module;
    }

    // Module Object
    function Module(obj) {
      if (typeof obj != 'object')
        throw new TypeError('Expected object');

      if (!(this instanceof Module))
        return new Module(obj);

      var self = this;
      for (var key in obj) {
        (function (key, value) {
          defineProperty(self, key, {
            configurable: false,
            enumerable: true,
            get: function () {
              return value;
            }
          });
        })(key, obj[key]);
      }
      preventExtensions(this);
    }
    // Module.prototype = null;


    // Linking
    // Link is directly LinkDynamicModules assuming all modules are dynamic
    function link(loads, loader) {
      // console.log('linking {' + logloads(loads) + '}');

      // continue until all linked
      // NB circular dependencies will stall this loop
      var loopCnt = 0;
      while (loads.length) {
        loopCnt++;
        // search through to find a load with all its dependencies linked
        search: for (var i = 0; i < loads.length; i++) {
          var load = loads[i];
          var depNames = [];
          for (var d in load.dependencies) {
            var depName = load.dependencies[d];
            // being in the module table means it is linked
            if (!loader._modules[depName])
              continue search;
            depNames.push(depName);
          }

          // all dependencies linked now, so we can execute
          var module = load.execute.apply(null, depNames);
          if (!(module instanceof Module))
            throw new TypeError('Execution must define a Module instance');
          load.module = module;
          load.status = 'linked';
          finishLoad(loader, load);
        }
        if (loopCnt === 1000) {
          console.log('Circular Dependency Detected');
          return;
        }
      }
      // console.log('linked');
    }

    // Loader
    function Loader(options) {
      if (typeof options != 'object')
        throw new TypeError('Options must be an object');

      if (options.normalize)
        this.normalize = options.normalize;
      if (options.locate)
        this.locate = options.locate;
      if (options.fetch)
        this.fetch = options.fetch;
      if (options.translate)
        this.translate = options.translate;
      if (options.instantiate)
        this.instantiate = options.instantiate;

      defineProperty(this, 'global', {
        get: function() {
          throw new TypeError('global accessor not provided by polyfill');
        }
      });
      defineProperty(this, 'realm', {
        get: function() {
          throw new TypeError('Realms not implemented in polyfill');
        }
      });

      this._modules = {};
      this._loads = [];
    }

    // NB importPromises hacks ability to import a module twice without error - https://github.com/jorendorff/js-loaders/issues/60
    var importPromises = {};
    Loader.prototype = {
      define: function(name, source, options) {
        if (importPromises[name])
          throw new TypeError('Module is already loading.');
        importPromises[name] = new Promise(asyncStartLoadPartwayThrough(this, name, options && options.address ? 'fetch' : 'translate', options && options.meta || {}, options && options.address, source));
        return importPromises[name].then(function() { delete importPromises[name]; });
      },
      load: function(request, options) {
        if (this._modules[request])
          return Promise.resolve(this._modules[request]);
        if (importPromises[request])
          return importPromises[request];
        importPromises[request] = loadModule(this, request, options);
        return importPromises[request].then(function() { delete importPromises[request]; })
      },
      module: function(source, options) {
        var load = createLoad();
        load.address = options && options.address;
        var linkSet = createLinkSet(this, load);
        var sourcePromise = Promise.resolve(source);
        var p = linkSet.done.then(function() {
          evaluateLoadedModule(this, load);
        });
        proceedToTranslate(this, load, sourcePromise);
        return p;
      },
      import: function(name, options) {
        if (this._modules[name])
          return Promise.resolve(this._modules[name]);
        return (importPromises[name] || (importPromises[name] = loadModule(this, name, options)))
          .then(function(load) {
            delete importPromises[name];
            return evaluateLoadedModule(this, load);
          });
      },
      eval: function(source) {
        throw new TypeError('Eval not implemented in polyfill')
      },
      get: function(key) {
        // NB run ensure evaluted here when implemented
        return this._modules[key];
      },
      has: function(name) {
        return !!this._modules[name];
      },
      set: function(name, module) {
        if (!(module instanceof Module))
          throw new TypeError('Set must be a module');
        this._modules[name] = module;
      },
      delete: function(name) {
        return this._modules[name] ? delete this._modules[name] : false;
      },
      // NB implement iterations
      entries: function() {
        throw new TypeError('Iteration not yet implemented in the polyfill');
      },
      keys: function() {
        throw new TypeError('Iteration not yet implemented in the polyfill');
      },
      values: function() {
        throw new TypeError('Iteration not yet implemented in the polyfill');
      },
      normalize: function(name, refererName, refererAddress) {
        return name;
      },
      locate: function(load) {
        return load.name;
      },
      fetch: function(load) {
        throw new TypeError('Fetch not implemented');
      },
      translate: function(load) {
        return load.source;
      },
      instantiate: function(load) {
      }
    };



    /*
    *********************************************************************************************

      System Loader Implementation

        - Implemented to https://github.com/jorendorff/js-loaders/blob/master/browser-loader.js,
          except for Instantiate function

        - Instantiate function determines if ES6 module syntax is being used, if so parses with
          Traceur and returns a dynamic InstantiateResult for loading ES6 module syntax in ES5.

        - Custom loaders thus can be implemented by using this System.instantiate function as
          the fallback loading scenario, after other module format detections.

        - Traceur is loaded dynamically when module syntax is detected by a regex (with over-
          classification), either from require('traceur') on the server, or the
          'data-traceur-src' property on the current script in the browser, or if not set,
          'traceur.js' in the same URL path as the current script in the browser.

        - <script type="module"> supported, but <module> tag not

    *********************************************************************************************
    */

    // Helpers
    // Absolute URL parsing, from https://gist.github.com/Yaffle/1088850
    function parseURI(url) {
      var m = String(url).replace(/^\s+|\s+$/g, '').match(/^([^:\/?#]+:)?(\/\/(?:[^:@]*(?::[^:@]*)?@)?(([^:\/?#]*)(?::(\d*))?))?([^?#]*)(\?[^#]*)?(#[\s\S]*)?/);
      // authority = '//' + user + ':' + pass '@' + hostname + ':' port
      return (m ? {
        href     : m[0] || '',
        protocol : m[1] || '',
        authority: m[2] || '',
        host     : m[3] || '',
        hostname : m[4] || '',
        port     : m[5] || '',
        pathname : m[6] || '',
        search   : m[7] || '',
        hash     : m[8] || ''
      } : null);
    }
    function toAbsoluteURL(base, href) {
      function removeDotSegments(input) {
        var output = [];
        input.replace(/^(\.\.?(\/|$))+/, '')
          .replace(/\/(\.(\/|$))+/g, '/')
          .replace(/\/\.\.$/, '/../')
          .replace(/\/?[^\/]*/g, function (p) {
            if (p === '/..')
              output.pop();
            else
              output.push(p);
        });
        return output.join('').replace(/^\//, input.charAt(0) === '/' ? '/' : '');
      }

      href = parseURI(href || '');
      base = parseURI(base || '');

      return !href || !base ? null : (href.protocol || base.protocol) +
        (href.protocol || href.authority ? href.authority : base.authority) +
        removeDotSegments(href.protocol || href.authority || href.pathname.charAt(0) === '/' ? href.pathname : (href.pathname ? ((base.authority && !base.pathname ? '/' : '') + base.pathname.slice(0, base.pathname.lastIndexOf('/') + 1) + href.pathname) : base.pathname)) +
        (href.protocol || href.authority || href.pathname ? href.search : (href.search || base.search)) +
        href.hash;
    }

    var fetchTextFromURL;
    if (isBrowser) {
      fetchTextFromURL = function(url, fulfill, reject) {
        var xhr = new XMLHttpRequest();
        if (!('withCredentials' in xhr)) {
          // check if same domain
          var sameDomain = true,
          domainCheck = /^(\w+:)?\/\/([^\/]+)/.exec(url);
          if (domainCheck) {
            sameDomain = domainCheck[2] === window.location.host;
            if (domainCheck[1])
              sameDomain &= domainCheck[1] === window.location.protocol;
          }
          if (!sameDomain)
            xhr = new XDomainRequest();
        }

        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            if (xhr.status === 200 || (xhr.status == 0 && xhr.responseText)) {
              fulfill(xhr.responseText);
            } else {
              reject(xhr.statusText + ': ' + url || 'XHR error');
            }
          }
        };
        xhr.open("GET", url, true);
        xhr.send(null);
      }
    }
    else {
      var fs = require('fs');
      fetchTextFromURL = function(url, fulfill, reject) {
        return fs.readFile(url, function(err, data) {
          if (err)
            return reject(err);
          else
            fulfill(data + '');
        });
      }
    }

    var System = new Loader({
      global: isBrowser ? window : global,
      strict: true,
      normalize: function(name, parentName, parentAddress) {
        if (typeof name != 'string')
          throw new TypeError('Module name must be a string');

        var segments = name.split('/');

        if (segments.length == 0)
          throw new TypeError('No module name provided');

        // current segment
        var i = 0;
        // is the module name relative
        var rel = false;
        // number of backtracking segments
        var dotdots = 0;
        if (segments[0] == '.') {
          i++;
          if (i == segments.length)
            throw new TypeError('Illegal module name "' + name + '"');
          rel = true;
        }
        else {
          while (segments[i] == '..') {
            i++;
            if (i == segments.length)
              throw new TypeError('Illegal module name "' + name + '"');
          }
          if (i)
            rel = true;
          dotdots = i;
        }

        for (var j = i; j < segments.length; j++) {
          var segment = segments[j];
          if (segment == '' || segment == '.' || segment == '..')
            throw new TypeError('Illegal module name"' + name + '"');
        }

        if (!rel)
          return name;

        // build the full module name
        var normalizedParts = [];
        var parentParts = (parentName || '').split('/');
        var normalizedLen = parentParts.length - 1 - dotdots;

        normalizedParts = normalizedParts.concat(parentParts.splice(0, parentParts.length - 1 - dotdots));
        normalizedParts = normalizedParts.concat(segments.splice(i));

        return normalizedParts.join('/');
      },
      locate: function(load) {
        var name = load.name;

        // NB no specification provided for System.paths, used ideas discussed in https://github.com/jorendorff/js-loaders/issues/25

        // most specific (longest) match wins
        var pathMatch = '', wildcard;

        // check to see if we have a paths entry
        for (var p in this.paths) {
          var pathParts = p.split('*');
          if (pathParts.length > 2)
            throw new TypeError('Only one wildcard in a path is permitted');

          // exact path match
          if (pathParts.length == 1) {
            if (name == p && p.length > pathMatch.length)
              pathMatch = p;
          }

          // wildcard path match
          else {
            if (name.substr(0, pathParts[0].length) == pathParts[0] && name.substr(name.length - pathParts[1].length) == pathParts[1]) {
              pathMatch = p;
              wildcard = name.substr(pathParts[0].length, name.length - pathParts[1].length - pathParts[0].length);
            }
          }
        }

        var outPath = this.paths[pathMatch];
        if (wildcard)
          outPath = outPath.replace('*', wildcard);

        return toAbsoluteURL(this.baseURL, outPath);
      },
      fetch: function(load) {
        var resolve, reject, promise = new Promise(function(_resolve, _reject) { resolve = _resolve; reject = _reject; });
        fetchTextFromURL(toAbsoluteURL(this.baseURL, load.address), function(source) {
          resolve(source);
        }, reject);
        return promise;
      },
      instantiate: function(load) {

        // allow empty source
        if (!load.source) {
          return {
            deps: [],
            execute: function() {
              return new global.Module({});
            }
          };
        }

        // normal eval (non-module code)
        // note that anonymous modules (load.name == undefined) are always
        // anonymous <module> tags, so we use Traceur for these
        if (!load.metadata.es6 && load.name && (load.metadata.es6 === false || !load.source.match(es6RegEx))) {
          return {
            deps: [],
            execute: function() {
              __eval(load.source, global, load.address, load.name);

              // when loading traceur, it overwrites the System
              // global. The only way to synchronously ensure it is
              // reverted in time not to cause issue is here
              if (load.name == 'traceur' && isBrowser) {
                global.traceur = global.System.get('../src/traceur.js');
                global.System = System;
              }

              // return an empty module
              return new Module({});
            }
          };
        }

        var match;
        var loader = this;
        // alias check is based on a "simple form" only
        // eg import * from 'jquery';
        if (match = load.source.match(aliasRegEx)) {
          return {
            deps: [match[1] || match[2]],
            execute: function(dep) {
              return loader._modules[dep];
            }
          };
        }

        // ES6 -> ES5 conversion
        load.address = load.address || 'anonymous-module-' + anonCnt++;
        // load traceur and the module transformer
        return getTraceur()
        .then(function(traceur) {

          traceur.options.sourceMaps = true;
          traceur.options.modules = 'parse';
          // traceur.options.blockBinding = true;

          var reporter = new traceur.util.ErrorReporter();

          reporter.reportMessageInternal = function(location, kind, format, args) {
            throw kind + '\n' + location;
          }

          var parser = new traceur.syntax.Parser(reporter, new traceur.syntax.SourceFile(load.address, load.source));

          var tree = parser.parseModule();


          var imports = getImports(tree);

          return {
            deps: imports,
            execute: function() {

              // write dependencies as unique globals
              // creating a map from the unnormalized import name to the unique global name
              var globalMap = {};
              for (var i = 0; i < arguments.length; i++) {
                var name = '__moduleDependency' + i;
                global[name] = System.get(arguments[i]);
                globalMap[imports[i]] = name;
              }

              // transform
              var transformer = new traceur.codegeneration.FromOptionsTransformer(reporter);
              transformer.append(function(tree) {
                return new traceur.codegeneration.ModuleLoaderTransformer(globalMap, '__exports').transformAny(tree);
              });
              tree = transformer.transform(tree);

              // convert back to a source string
              var sourceMapGenerator = new traceur.outputgeneration.SourceMapGenerator({ file: load.address });
              var options = { sourceMapGenerator: sourceMapGenerator };

              source = traceur.outputgeneration.TreeWriter.write(tree, options);
              if (isBrowser && window.btoa)
                source += '\n//# sourceMappingURL=data:application/json;base64,' + btoa(unescape(encodeURIComponent(options.sourceMap))) + '\n';

              global.__exports = {};

              __eval(source, global, load.address, load.name);

              var exports = global.__exports;

              delete global.__exports;
              for (var i = 0; i < arguments.length; i++)
                delete global['__moduleDependency' + i];

              return new Module(exports);
            }
          };
        });
      }
    });

    // count anonymous evals to have unique name
    var anonCnt = 1;

    if (isBrowser) {
      var href = window.location.href.split('#')[0].split('?')[0];
      System.baseURL = href.substring(0, href.lastIndexOf('\/') + 1);
    }
    else {
      System.baseURL = './';
    }
    System.paths = { '*': '*.js' };


    // ES6 to ES5 parsing functions

    // comprehensively overclassifying regex detectection for es6 module syntax
    var es6RegEx = /(?:^\s*|[}{\(\);,\n]\s*)(import\s+['"]|(import|module)\s+[^"'\(\)\n;]+\s+from\s+['"]|export\s+(\*|\{|default|function|var|const|let|[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*))/;

    // es6 module forwarding - allow detecting without Traceur
    var aliasRegEx = /^\s*export\s*\*\s*from\s*(?:'([^']+)'|"([^"]+)")/;

    // dynamically load traceur when needed
    // populates the traceur, reporter and moduleLoaderTransfomer variables

    // NB we need to queue getTraceur callbacks due to https://github.com/jorendorff/js-loaders/issues/60
    var traceur, traceurPromise;
    function getTraceur() {
      if (traceur)
        return Promise.resolve(traceur || (traceur = global.traceur));

      if (traceurPromise)
        return traceurPromise;

      return traceurPromise = (isBrowser ? exports.System.import : function(name, src, callback) {
        return Promise.resolve(require('traceur'));
      }).call(exports.System, 'traceur', { address: traceurSrc }).then(function(_traceur) {
        traceurPromise = null;

        if (isBrowser)
          _traceur = global.traceur;

        traceur = _traceur;

        traceur.codegeneration.ModuleLoaderTransformer = createModuleLoaderTransformer(
          traceur.codegeneration.ParseTreeFactory,
          traceur.codegeneration.ParseTreeTransformer
        );

        return traceur;
      });
    }

    // NB update to new transformation system
    function createModuleLoaderTransformer(ParseTreeFactory, ParseTreeTransformer) {
      var createAssignmentExpression = ParseTreeFactory.createAssignmentExpression;
      var createVariableDeclaration = ParseTreeFactory.createVariableDeclaration;

      var createCallExpression = ParseTreeFactory.createCallExpression;

      var createVariableDeclarationList = ParseTreeFactory.createVariableDeclarationList;
      var createStringLiteral = ParseTreeFactory.createStringLiteral;
      var createIdentifierExpression = ParseTreeFactory.createIdentifierExpression;

      var createMemberLookupExpression = ParseTreeFactory.createMemberLookupExpression;

      var createCommaExpression = ParseTreeFactory.createCommaExpression;
      var createVariableStatement = ParseTreeFactory.createVariableStatement;

      var createAssignmentStatement = ParseTreeFactory.createAssignmentStatement;
      var createExpressionStatement = ParseTreeFactory.createExpressionStatement;


      var self = this;
      var ModuleLoaderTransformer = function(globalMap, exportGlobal) {
        this.depMap = globalMap;
        this.exportGlobal = exportGlobal;
      }
      ModuleLoaderTransformer.prototype = Object.create(ParseTreeTransformer.prototype);

      // var VARIABLE = __moduleDependencyX['VALUE'], ...
      // var VARIABLE = __moduleDependencyX, ...
      ModuleLoaderTransformer.prototype.createModuleVariableDeclaration = function(moduleName, variables, values, location) {
        var self = this;
        var variableDeclarations = variables.map(function(variable, i) {
          return createVariableDeclaration(variable, self.createImportExpression(moduleName, values[i]));
        });
        var varList = createVariableDeclarationList('var', variableDeclarations);
        varList.location = location;
        return createVariableStatement(varList);
      }

      // __moduleDependencyX['VALUE']
      ModuleLoaderTransformer.prototype.createImportExpression = function(moduleName, value) {
        var expression = createIdentifierExpression(this.depMap[moduleName]);
        return value ? createMemberLookupExpression(expression, createStringLiteral(value)) : expression;
      }

      // __exports['EXPORT_NAME']
      ModuleLoaderTransformer.prototype.createExportExpression = function(exportName) {
        return createMemberLookupExpression(createIdentifierExpression(this.exportGlobal), createStringLiteral(exportName));
      }

      ModuleLoaderTransformer.prototype.transformImportDeclaration = function(tree) {
        var moduleName = tree.moduleSpecifier.token.processedValue;

        var variables = [];
        var values = [];

        // import 'jquery';
        if (!tree.importClause) {
          return;
        }
        // import $ from 'jquery';
        else if (tree.importClause && tree.importClause.binding) {
          variables.push(tree.importClause.binding.identifierToken);
          values.push('default');
        }
        // import { ... } from 'jquery';
        else if (tree.importClause) {
          var specifiers = tree.importClause.specifiers;
          for (var i = 0; i < specifiers.length; i++) {
            var specifier = specifiers[i];
            variables.push(specifier.rhs ? specifier.rhs.value : specifier.lhs.value);
            values.push(specifier.lhs.value);
          }
        }
        return this.createModuleVariableDeclaration(moduleName, variables, values, tree.location);
      }
      ModuleLoaderTransformer.prototype.transformModuleDeclaration = function(tree) {
        var moduleName = tree.expression.token.processedValue;
        return this.createModuleVariableDeclaration(moduleName, [tree.identifier], [null], tree.location);
      }
      ModuleLoaderTransformer.prototype.transformExportDeclaration = function(tree) {
        var declaration = tree.declaration;

        if (declaration.type == 'NAMED_EXPORT') {
          var moduleName = declaration.moduleSpecifier && declaration.moduleSpecifier.token.processedValue;
          // export {a as b, c as d}
          // export {a as b, c as d} from 'module'
          if (declaration.specifierSet.type != 'EXPORT_STAR') {
            var expressions = [];
            var specifiers = declaration.specifierSet.specifiers;
            for (var i = 0; i < specifiers.length; i++) {
              var specifier = specifiers[i];
              expressions.push(createAssignmentExpression(
                this.createExportExpression(specifier.rhs ? specifier.rhs.value : specifier.lhs.value),
                moduleName
                  ? this.createImportExpression(moduleName, specifier.lhs.value)
                  : createIdentifierExpression(specifier.lhs.value)
              ));
            }
            var commaExpression = createExpressionStatement(createCommaExpression(expressions));
            commaExpression.location = tree.location;
            return commaExpression;
          }
          else {
            var exportStarStatement = createAssignmentStatement(createIdentifierExpression(this.exportGlobal), this.createImportExpression(moduleName));
            exportStarStatement.location = tree.location;
            return exportStarStatement;
          }
        }

        // export var p = 4;
        else if (declaration.type == 'VARIABLE_STATEMENT') {
          // export var p = ...
          var varDeclaration = declaration.declarations.declarations[0];
          varDeclaration.initialiser = createAssignmentExpression(
            this.createExportExpression(varDeclaration.lvalue.identifierToken.value),
            this.transformAny(varDeclaration.initialiser)
          );
          return declaration;
        }
        // export function q() {}
        else if (declaration.type == 'FUNCTION_DECLARATION') {
          var varDeclaration = createVariableDeclaration(
            declaration.name.identifierToken.value,
            createAssignmentStatement(
              this.createExportExpression(declaration.name.identifierToken.value),
              this.transformAny(declaration)
            )
          );
          varDeclaration.location = tree.location;
          return createVariableDeclarationList('var', [varDeclaration]);
        }
        // export default ...
        else if (declaration.type == 'EXPORT_DEFAULT') {
          return createAssignmentStatement(
            this.createExportExpression('default'),
            this.transformAny(declaration.expression)
          );
        }

        return tree;
      }
      return ModuleLoaderTransformer;
    }

    // tree traversal, NB should use visitor pattern here
    function traverse(object, iterator, parent, parentProperty) {
      var key, child;
      if (iterator(object, parent, parentProperty) === false)
        return;
      for (key in object) {
        if (!object.hasOwnProperty(key))
          continue;
        if (key == 'location' || key == 'type')
          continue;
        child = object[key];
        if (typeof child == 'object' && child !== null)
          traverse(child, iterator, object, key);
      }
    }

    // given a syntax tree, return the import list
    function getImports(moduleTree) {
      var imports = [];

      function addImport(name) {
        if (indexOf.call(imports, name) == -1)
          imports.push(name);
      }

      traverse(moduleTree, function(node) {
        // import {} from 'foo';
        // export * from 'foo';
        // export { ... } from 'foo';
        // module x from 'foo';
        if (node.type == 'EXPORT_DECLARATION') {
          if (node.declaration.moduleSpecifier)
            addImport(node.declaration.moduleSpecifier.token.processedValue);
        }
        else if (node.type == 'IMPORT_DECLARATION')
          addImport(node.moduleSpecifier.token.processedValue);
        else if (node.type == 'MODULE_DECLARATION')
          addImport(node.expression.token.processedValue);
      });
      return imports;
    }


    // Export the Loader class
    exports.Loader = Loader;
    // Export the Module class
    exports.Module = Module;
    // Export the System object
    exports.System = System;

    var traceurSrc;

    // <script type="module"> support
    // allow a data-init function callback once loaded
    if (isBrowser) {
      var curScript = document.getElementsByTagName('script');
      curScript = curScript[curScript.length - 1];

      // set the path to traceur
      traceurSrc = curScript.getAttribute('data-traceur-src')
        || curScript.src.substr(0, curScript.src.lastIndexOf('/') + 1) + 'traceur.js';

      document.onreadystatechange = function() {
        if (document.readyState == 'interactive') {
          var scripts = document.getElementsByTagName('script');

          for (var i = 0; i < scripts.length; i++) {
            var script = scripts[i];
            if (script.type == 'module') {
              // <script type="module" name="" src=""> support
              var name = script.getAttribute('name');
              var address = script.getAttribute('src');
              var source = script.innerHTML;

              (name
                ? System.define(name, source, { address: address })
                : System.module(source, { address: address })
              ).then(function() {}, function(err) { nextTick(function() { throw err; }); });
            }
          }
        }
      }

      // run the data-init function on the script tag
      if (curScript.getAttribute('data-init'))
        window[curScript.getAttribute('data-init')]();
    }

  })();

  function __eval(__source, global, __sourceURL, __moduleName) {
    try {
      Function('global', 'var __moduleName = "' + (__moduleName || '').replace('"', '\"') + '"; with(global) { ' + __source + ' \n }'
        + (__sourceURL && !__source.match(/\/\/[@#] ?(sourceURL|sourceMappingURL)=([^\n]+)/)
        ? '\n//# sourceURL=' + __sourceURL : '')).call(global, global);
    }
    catch(e) {
      if (e.name == 'SyntaxError')
        e.message = 'Evaluating ' + __sourceURL + '\n\t' + e.message;
      throw e;
    }
  }

})();


// es6-module-loader doesn't export to the current scope in node
var Loader, Module;
if (typeof exports !== 'undefined') {
	if (typeof Loader === 'undefined') Loader = exports.Loader;
	if (typeof Module === 'undefined') Module = exports.Module;
}

/** RaveJS */
/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
(function (exports, global) {
var rave, document, defaultMain, debugMain, hooksName,
	context, loader, define;

rave = exports || {};

document = global.document;

defaultMain = 'rave/auto';
debugMain = 'rave/debug';
hooksName = 'rave/src/hooks';

// export testable functions
rave.boot = boot;
rave.getCurrentScript = getCurrentScript;
rave.mergeBrowserOptions = mergeBrowserOptions;
rave.mergeNodeOptions = mergeNodeOptions;
rave.simpleDefine = simpleDefine;

// initialize
rave.scriptUrl = getCurrentScript();
rave.scriptPath = getPathFromUrl(rave.scriptUrl);
rave.baseUrl = document
	? getPathFromUrl(document.location.origin + document.location.pathname)
	: __dirname;

context = (document ? mergeBrowserOptions : mergeNodeOptions)({
	raveMain: defaultMain,
	raveScript: rave.scriptUrl,
	baseUrl: rave.baseUrl,
	loader: new Loader({})
});

loader = context.loader;
define = simpleDefine(loader);
define.amd = {};

function boot (context) {
	var main = context.raveMain;
	try {
		// check if we should load debugMain instead
		if (context.debug || context.raveDebug) {
			// don't override main if user changed it with <html> attr
			if (context.raveMain === defaultMain) context.raveMain = debugMain;
		}
		// apply hooks overrides to loader
		var hooks = fromLoader(loader.get(hooksName));
		// extend loader
		hooks(context);
		loader.import(context.raveMain).then(go, failLoudly);
	}
	catch (ex) {
		failLoudly(ex);
	}
	function go (main) {
		main = fromLoader(main);
		if (!main) failLoudly(new Error('No main module.'));
		else if (typeof main.main === 'function') main.main(context);
		else if (typeof main === 'function') main(context);
	}
	function failLoudly (ex) {
		console.error(ex);
		throw ex;
	}
}

function getCurrentScript () {
	var stack, matches;

	// HTML5 way
	if (document && document.currentScript) return document.currentScript.src;

	// From https://gist.github.com/cphoover/6228063
	// (Note: Ben Alman's shortcut doesn't work everywhere.)
	// TODO: see if stack trace trick works in IE8+.
	// Otherwise, loop to find script.readyState == 'interactive' in IE.
	stack = '';
	try { throw new Error(); } catch (ex) { stack = ex.stack; }
	matches = stack.match(/(?:http:|https:|file:|\/).*?\.js/);

	return matches && matches[0];
}

function getPathFromUrl (url) {
	var last = url.lastIndexOf('/');
	return url.slice(0, last) + '/';
}

function mergeBrowserOptions (context) {
	var el = document.documentElement, i, attr, prop;
	for (i = 0; i < el.attributes.length; i++) {
		attr = el.attributes[i];
		prop = attr.name.slice(5).replace(/(?:data)?-(.)/g, camelize);
		if (prop) context[prop] = attr.value || true;
	}
	return context;
	function camelize (m, l) { return l.toUpperCase();}
}

function mergeNodeOptions (context) {
	// TODO
	return context;
}

function simpleDefine (loader) {
	var _global;
	// temporary work-around for es6-module-loader which throws when
	// accessing loader.global
	try { _global = loader.global } catch (ex) { _global = global; }
	return function (id, deps, factory) {
		var scoped, modules, i, len, isCjs = false, value;
		scoped = {
			require: function (id) { return fromLoader(loader.get(id)); },
			exports: {},
			global: _global
		};
		scoped.module = { exports: scoped.exports };
		modules = [];
		// if deps has been omitted
		if (arguments.length === 2) {
			factory = deps;
			deps = ['require', 'exports', 'module'].slice(factory.length);
		}
		for (i = 0, len = deps.length; i < len; i++) {
			modules[i] = deps[i] in scoped
				? scoped[deps[i]]
				: scoped.require(deps[i]);
			isCjs |= deps[i] === 'exports' || deps[i] === 'module';
		}
		// eager instantiation.
		value = factory.apply(null, modules);
		// find result, preferring a returned value
		if (typeof value !== 'undefined') {
			value = toLoader(value);
		}
		else if (isCjs) {
			value = scoped.exports;
			if (scoped.module.exports !== value) {
				value = toLoader(scoped.module.exports);
			}
		}
		else {
			value = {}; // es6 needs an object
		}
		loader.set(id, new Module(value));
	};
}

function fromLoader (value) {
	return value && value.__es5Module ? value.__es5Module : value;
}

function toLoader (value) {
	return {
		// for real ES6 modules to consume this module
		'default': value,
		// for modules transpiled from ES6
		__es5Module: value
	};
}



;define('rave/pipeline/locateAsIs', ['require', 'exports', 'module'], function (require, exports, module, define) {module.exports = locateAsIs;

function locateAsIs (load) {
	return load.name;
}

});


;define('rave/pipeline/translateAsIs', ['require', 'exports', 'module'], function (require, exports, module, define) {module.exports = translateAsIs;

function translateAsIs (load) {
	return load.source;
}

});


;define('rave/lib/path', ['require', 'exports', 'module'], function (require, exports, module, define) {var absUrlRx, findDotsRx;

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

});


;define('rave/lib/beget', ['require', 'exports', 'module'], function (require, exports, module, define) {module.exports = beget;

function Begetter () {}
function beget (base) {
	var obj;
	Begetter.prototype = base;
	obj = new Begetter();
	Begetter.prototype = null;
	return obj;
}

});


;define('rave/lib/fetchText', ['require', 'exports', 'module'], function (require, exports, module, define) {module.exports = fetchText;

function fetchText (url, callback, errback) {
	var xhr;
	xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.onreadystatechange = function () {
		if (xhr.readyState === 4) {
			if (xhr.status < 400) {
				callback(xhr.responseText);
			}
			else {
				errback(
					new Error(
						'fetchText() failed. url: "' + url
						+ '" status: ' + xhr.status + ' - ' + xhr.statusText
					)
				);
			}
		}
	};
	xhr.send(null);
}

});


;define('rave/lib/addSourceUrl', ['require', 'exports', 'module'], function (require, exports, module, define) {module.exports = addSourceUrl;

function addSourceUrl (url, source) {
	return source
		+ '\n//# sourceURL='
		+ url.replace(/\s/g, '%20')
		+ '\n';
}

});


;define('rave/lib/es5Transform', ['require', 'exports', 'module'], function (require, exports, module, define) {module.exports = {
	fromLoader: function (value) {
		return value && value.__es5Module ? value.__es5Module : value;
	},
	toLoader: function (module) {
		return {
			// for real ES6 modules to consume this module
			'default': module,
			// for modules transpiled from ES5
			__es5Module: module
		};
	}
};

});


;define('rave/load/predicate', ['require', 'exports', 'module'], function (require, exports, module, define) {exports.composePredicates = composePredicates;
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

});


;define('rave/load/specificity', ['require', 'exports', 'module'], function (require, exports, module, define) {exports.compare = compareFilters;
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


});


;define('rave/lib/uid', ['require', 'exports', 'module'], function (require, exports, module, define) {exports.create = createUid;
exports.parse = parseUid;
exports.getName = getName;

function createUid (descriptor, normalized) {
	return /*descriptor.pmType + ':' +*/ descriptor.name
		+ (descriptor.version ? '@' + descriptor.version : '')
		+ (normalized ? '#' + normalized : '');
}


function parseUid (uid) {
	var uparts = uid.split('#');
	var name = uparts.pop();
	var nparts = name.split('/');
	return {
		name: name,
		pkgName: nparts.shift(),
		modulePath: nparts.join('/'),
		pkgUid: uparts[0]
	};
}


function getName (uid) {
	return uid.split("#").pop();
}

});


;define('rave/lib/find/createCodeFinder', ['require', 'exports', 'module'], function (require, exports, module, define) {module.exports = createCodeFinder;

// Export private functions for testing
createCodeFinder.composeRx = composeRx;
createCodeFinder.rxStringContents = rxStringContents;
createCodeFinder.skipTo = skipTo;

var trimRegExpRx = /^\/|\/[gim]*$/g;

// Look for code transitions.
var defaultTransitionsRx = composeRx(
	// Detect strings, blank strings, and comments.
	/(''?|""?|\/\/|\/\*)/,
	// Detect RegExps by excluding division sign and comments
	/(?:[\-+*\/=\,%&|^!(;\{\[<>]\s*)(\/)(?!\/|\*)/,
	'g'
);

// RegExps to find end of strings, comments, RegExps in code
// We can't detect blank strings easily, so we handle those specifically.
var defaultSkippers = {
	"''": false,
	'""': false,
	"'": /\\\\'|[^\\]'/g,
	'"': /\\\\"|[^\\]"/g,
	'//': /\n|$/g,
	'/*': /\*\//g,
	'/': /\\\\\/|[^\\]\//g
};

/**
 * Creates a function that will call a callback function with a set of matches
 * for each occurrence of a pattern match for a given RegExp.  Only true
 * JavaScript is searched.  Comments, strings, and RegExps are skipped.
 * The onMatch callback is called with a single parameter: an array containing
 * the result of calling the RegExp's exec() method.  If onMatch returns a
 * very large number, the pattern matching stops.
 * @param {RegExp} codeRx is a RegExp for the code pattern to find.
 * @param {RegExp} [codeTransitionsRx] is a RegExp to detect transitions into
 *   comments, strings, RegExps, etc.  If omitted, the default RegExp is suited
 *   to JavaScript code.
 * @param {function(matches:Array):number} [skip] is a function that returns
 *   a new position to resume searching the source code.
 * @returns {function(source:string, onMatch:function):string}
 */
function createCodeFinder (codeRx, codeTransitionsRx, skip) {
	var flags, comboRx;

	if (!codeTransitionsRx) codeTransitionsRx = defaultTransitionsRx;
	if (!skip) skip = skipNonCode;

	flags = 'g';
	if (codeRx.multiline) flags += 'm';
	if (codeRx.ignoreCase) flags += 'i';

	comboRx = composeRx(codeRx, codeTransitionsRx, flags);

	return function (source, onMatch) {
		var matches, index, rx, trans;

		comboRx.lastIndex = 0; // reset

		while (matches = comboRx.exec(source)) {

			index = skip(matches);

			if (index < 0) {
				// call onMatch and let it optionally skip forward
				index = onMatch(matches);
			}

			if (index >= 0) {
				comboRx.lastIndex = index;
			}

		}

		return source;
	};
}

function skipNonCode (matches) {
	var rx, trans, index;
	// pop off matches for regexp and other transitions
	rx = matches.pop();
	trans = matches.pop() || rx;
	if (!trans) return -1;
	if (defaultSkippers[trans]) {
		index = matches.index + matches[0].length;
		return skipTo(matches.input, defaultSkippers[trans], index);
	}
}

function skipTo (source, rx, index) {
	rx.lastIndex = index;

	if (!rx.exec(source)) {
		throw new Error(
			'Unterminated comment, string, or RegExp at '
			+ index + ' near ' + source.slice(index - 50, 100)
		);
	}

	return rx.lastIndex;
}

function composeRx (rx1, rx2, flags) {
	return new RegExp(rxStringContents(rx1)
		+ '|' + rxStringContents(rx2), flags);
}

function rxStringContents (rx) {
	return rx.toString().replace(trimRegExpRx, '');
}

});


;define('rave/pipeline/normalizeCjs', ['require', 'exports', 'module', 'rave/lib/path'], function (require, exports, module, $cram_r0, define) {var path = $cram_r0;

module.exports = normalizeCjs;

var reduceLeadingDots = path.reduceLeadingDots;

function normalizeCjs (name, refererName, refererUrl) {
	return reduceLeadingDots(String(name), refererName || '');
}

});


;define('rave/pipeline/fetchAsText', ['require', 'exports', 'module', 'rave/lib/fetchText'], function (require, exports, module, $cram_r0, define) {module.exports = fetchAsText;

var fetchText = $cram_r0;

function fetchAsText (load) {
	return new Promise(function(resolve, reject) {
		fetchText(load.address, resolve, reject);
	});

}

});


;define('rave/load/override', ['require', 'exports', 'module', 'rave/load/predicate', 'rave/load/specificity', 'rave/lib/uid'], function (require, exports, module, $cram_r0, $cram_r1, $cram_r2, define) {var predicate = $cram_r0;
var specificity = $cram_r1;
var parse = $cram_r2.parse;

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

});


;define('rave/pipeline/instantiateJson', ['require', 'exports', 'module', 'rave/lib/es5Transform', 'rave/lib/addSourceUrl'], function (require, exports, module, $cram_r0, $cram_r1, define) {var es5Transform = $cram_r0;
var addSourceUrl = $cram_r1;

module.exports = instantiateJson;

function instantiateJson (load) {
	var source;

	source = '(' + load.source + ')';

	// if debugging, add sourceURL
	if (load.metadata.rave.debug) {
		source = addSourceUrl(load.address, source);
	}

	return {
		execute: function () {
			return new Module(es5Transform.toLoader(eval(source)));
		}
	};
}

});


;define('rave/lib/find/requires', ['require', 'exports', 'module', 'rave/lib/find/createCodeFinder'], function (require, exports, module, $cram_r0, define) {module.exports = findRequires;

var createCodeFinder = $cram_r0;

var findRValueRequiresRx = /require\s*\(\s*(["'])(.*?[^\\])\1\s*\)/g;
var idMatch = 2;

var finder = createCodeFinder(findRValueRequiresRx);

function findRequires (source) {
	var deps, seen;

	deps = [];
	seen = {};

	finder(source, function (matches) {
		var id = matches[idMatch];
		if (id) {
			// push [relative] id into deps list and seen map
			if (!(id in seen)) {
				seen[id] = true;
				deps.push(id)
			}
		}
	});

	return deps;
}

});


;define('rave/lib/createRequire', ['require', 'exports', 'module', 'rave/lib/es5Transform'], function (require, exports, module, $cram_r0, define) {module.exports = createRequire;

var es5Transform = $cram_r0;

function createRequire (loader, refId) {

	var require = function (id) { return syncRequire(id); };

	// Implement proposed require.async, just like Montage Require:
	// https://github.com/montagejs/mr, but with an added `names`
	// parameter.
	require.async = function (id) {
		var abs, args;
		try {
			abs = loader.normalize(id, refId);
		}
		catch (ex) {
			return Promise.reject(ex);
		}
		args = arguments;
		return loader.import(abs).then(function (value) {
			return getExports(args[1], value);
		});
	};

	require.named = syncRequire;

	return require;

	function syncRequire (id, names) {
		var abs, value;
		abs = loader.normalize(id, refId);
		value = loader.get(abs);
		return getExports(names, value);
	}
}

function getExports (names, value) {
	var exports, i;
	// only attempt to get names if an array-like object was supplied
	if (Object(names) === names && names.hasOwnProperty('length')) {
		exports = {};
		for (i = 0; i < names.length; i++) {
			exports[names[i]] = value[names[i]];
		}
		return exports;
	}
	else {
		return es5Transform.fromLoader(value);
	}
}

});


;define('rave/lib/nodeFactory', ['require', 'exports', 'module', 'rave/lib/es5Transform', 'rave/lib/createRequire'], function (require, exports, module, $cram_r0, $cram_r1, define) {module.exports = nodeFactory;

var es5Transform = $cram_r0;
var createRequire = $cram_r1;

var nodeEval = new Function(
	'require', 'exports', 'module', 'global',
	'eval(arguments[4]);'
);

var _global;

_global = typeof global !== 'undefined' ? global : window;

function nodeFactory (loader, load) {
	var name, source, exports, module, require;

	name = load.name;
	source = load.source;
	exports = {};
	module = { id: name, uri: load.address, exports: exports };
	require = createRequire(loader, name);

	return function () {
		// TODO: use loader.global when es6-module-loader implements it
		nodeEval(require, module.exports, module, _global, source);
		// figure out what author intended to export
		return exports === module.exports
			? exports // a set of named exports
			: es5Transform.toLoader(module.exports); // a single default export
	};
}

});


;define('rave/pipeline/instantiateNode', ['require', 'exports', 'module', 'rave/lib/find/requires', 'rave/lib/nodeFactory', 'rave/lib/addSourceUrl'], function (require, exports, module, $cram_r0, $cram_r1, $cram_r2, define) {var findRequires = $cram_r0;
var nodeFactory = $cram_r1;
var addSourceUrl = $cram_r2;

module.exports = instantiateNode;

function instantiateNode (load) {
	var loader, deps, factory;

	loader = load.metadata.rave.loader;
	deps = findOrThrow(load);

	// if debugging, add sourceURL
	if (load.metadata.rave.debug) {
		load.source = addSourceUrl(load.address, load.source);
	}

	factory = nodeFactory(loader, load);

	return {
		deps: deps,
		execute: function () {
			return new Module(factory.apply(this, arguments));
		}
	};
}

function findOrThrow (load) {
	try {
		return findRequires(load.source);
	}
	catch (ex) {
		ex.message += ' ' + load.name + ' ' + load.address;
		throw ex;
	}
}


});


;define('rave/src/hooks', ['require', 'exports', 'module', 'rave/pipeline/normalizeCjs', 'rave/pipeline/locateAsIs', 'rave/pipeline/fetchAsText', 'rave/pipeline/translateAsIs', 'rave/pipeline/instantiateNode', 'rave/pipeline/instantiateJson', 'rave/lib/path', 'rave/lib/beget', 'rave/load/override'], function (require, exports, module, $cram_r0, $cram_r1, $cram_r2, $cram_r3, $cram_r4, $cram_r5, $cram_r6, $cram_r7, $cram_r8, define) {var normalizeCjs = $cram_r0;
var locateAsIs = $cram_r1;
var fetchAsText = $cram_r2;
var translateAsIs = $cram_r3;
var instantiateNode = $cram_r4;
var instantiateJson = $cram_r5;
var path = $cram_r6;
var beget = $cram_r7;
var override = $cram_r8;

module.exports = baseHooks;

function baseHooks (context) {
	var nativeHooks, resetOverride, raveOverride, jsonOverride, overrides,
		newHooks;

	nativeHooks = getLoaderHooks(context.loader);
	context.load = { nativeHooks: nativeHooks };

	context = beget(context);

	// we need this until Loader spec and shim stabilize
	resetOverride = {
		hooks: {
			normalize: normalizeCjs,
			fetch: fetchAsText,
			translate: translateAsIs
		}
	};

	// load things in rave package
	raveOverride = {
		package: 'rave',
		hooks: {
			locate: locateRaveWithContext(context),
			instantiate: instantiateNode
		}
	};

	// load json metadata files
	jsonOverride = {
		extensions: [ '.json' ],
		hooks: {
			locate: withContext(context, locateAsIs),
			instantiate: instantiateJson
		}
	};

	overrides = [resetOverride, raveOverride, jsonOverride];
	newHooks = override.hooks(nativeHooks, overrides);
	setLoaderHooks(context.loader, newHooks);

	return context;
}

function getLoaderHooks (loader) {
	return {
		normalize: loader.normalize,
		locate: loader.locate,
		fetch: loader.fetch,
		translate: loader.translate,
		instantiate: loader.instantiate
	};
}

function setLoaderHooks (loader, hooks) {
	for (var p in hooks) loader[p] = hooks[p];
	return loader;
}

function withContext (context, func) {
	return function (load) {
		load.metadata.rave = context;
		return func.call(this, load);
	};
}

function locateRaveWithContext (context) {
	var parts = context.raveScript.split('/');
	parts.pop(); // script file
	parts.pop(); // script directory
	var base = parts.join('/');
	return function (load) {
		load.metadata.rave = context;
		return path.joinPaths(base, path.ensureExt(load.name, '.js'));
	};
}

});



// start!
rave.boot(context);

}(
	typeof exports !== 'undefined' ? exports : void 0,
	typeof global !== 'undefined' && global
		|| typeof window !== 'undefined' && window
		|| typeof self !== 'undefined' && self
));
