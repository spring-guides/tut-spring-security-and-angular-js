/** @license MIT License (c) copyright 2014 original authors */
/** @author Brian Cavalier */
/** @author John Hann */
module.exports = {
	loadScript: loadScript,
	injectScript: injectScript
};

var readyStates = { 'loaded': 1, 'complete': 1 };

function loadScript (options, callback, errback) {
	var exports = options.exports;
	injectScript(options, exports ? exportOrFail : callback, errback);
	function exportOrFail () {
		if (!(exports in global)) {
			errback(
				new Error('"' + exports + '" not found: "' + url + '"')
			);
		}
		callback(global[exports])
	}
}

function injectScript (options, callback, errback) {
	var el, head;

	el = document.createElement('script');
	el.onload = el.onreadystatechange = process;
	el.onerror = fail;
	el.type = options.mimetype || 'text/javascript';
	el.charset = options.charset || 'utf-8';
	el.async = !options.order;
	el.src = options.url;

	head = document.head || document.getElementsByTagName('head')[0];
	head.appendChild(el);

	function process (ev) {
		ev = ev || global.event;
		// IE6-9 need to use onreadystatechange and look for
		// el.readyState in {loaded, complete} (yes, we need both)
		if (ev.type === 'load' || el.readyState in readyStates) {
			// release event listeners
			el.onload = el.onreadystatechange = el.onerror = '';
			callback();
		}
	}

	function fail () {
		errback(new Error('Syntax or http error: ' + options.url));
	}

}
