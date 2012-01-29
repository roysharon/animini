// animini.js - Tween Animation Micro Javascript Library
// by Roy Sharon <roy@roysharon.com>, 2012-01-29
// with a friendly MIT License (http://creativecommons.org/licenses/MIT/)

(function () {

    'use strict';
	
	//----- Utilites ---------------------------------------------------------------
	
	var math = Math, max = math.max, min = math.min, pow = math.pow, PI = math.PI, round = math.round;
	
		
	//----- Easing functions -------------------------------------------------------

	var easingNameProp = '_easing';
	
	function markAsEasing(f, n, t) { f[easingNameProp] = n + '.' + t; return f; }

	function out(f, n) { return markAsEasing(function (pos) { return 1 - f(1 - pos); }, n, 'o'); }

	function inout(f, n) { return markAsEasing(function (pos) { return pos < 0.5 ? f(pos * 2) / 2 : (1 - f(2 - pos * 2) / 2); }, n, 'io'); }

	function easing(name, easeInFunc) {
		var f = inout(easeInFunc, name);
		f['i'] = markAsEasing(easeInFunc, name, 'i');
		f['o'] = out(easeInFunc, name);
		f['io'] = inout(easeInFunc, name);
		if (name != undefined) create[name] = f;
		return f;
	}
	
	var elastAmp = 4 / 3, elastPeriod = 1 / 3, elastc = elastPeriod * 2 * PI * math.asin(1 / elastAmp);
	
	var easingFuncs = {
		'linear' : function (pos) { return pos; },
		'quad' : function (pos) { return pow(pos, 2); },
		'cubic' : function (pos) { return pow(pos, 3); },
		'quart' : function (pos) { return pow(pos, 4); },
		'sine' : function (pos) { return 1 - math.cos(pos * PI / 2); },
		'expo' : function (pos) { return pos ? pow(2, 10 * (pos - 1)) : 0; },
		'circ' : function (pos) { return 1 - math.sqrt(1 - pow(pos, 2)); },
		'elastic' : function (pos) {
			if (pos == 0 || pos == 1) return pos;
			return -(elastAmp * pow(2, 10 * (pos - 1)) * math.sin((pos - elastc) * 2 * PI / elastPeriod));
		},
		'expect' : function (pos) { return pow(pos, 2) * (4 * pos - 3); },
		'bounce' : function (pos) { 
			var x = 1 - pos, f = function (a, b) { return 1 - 121/16 * pow(x - a / 11, 2) - b; };
			return x < 4/11 ? f(0, 0) : x < 8/11 ? f(6, 3/4) : x < 10/11 ? f(9, 15/16) : f(10.5, 63/64);
		}
	};
	
	function setupEasingFuncs() {
		for (var i in easingFuncs) easing(i, easingFuncs[i]);
	}


	//----- Animation -------------------------------------------------------------

	function dispatch(func, args) {
		setTimeout(function () { func.apply(null, args); }, 1);
	}
	
	function animate(elements, stages, callbacks) {
		var stage = 0, count = stages.length, frame = 0, startTime = new Date() - 0, endTime = 0, active = [];

		function applyOnElements(p, s) {
			for (var j = elements.length - 1; j >= 0; --j) elements[j].style[p] = s;
		}
		
		function stageFunc(stage, stageStartTime) {
			var stageFrame = 0, stagePos = 0, stageEndTime = startTime + stage.t + stage.d;
			return function (t) {
				var d = stageEndTime - t;
				if (d > 0) {
					var fpms = ++stageFrame / (t - stageStartTime);
					stagePos += (1 - stagePos) / fpms / d;
					if (stagePos >= 1) stagePos = 1;
				} else stagePos = 1;

				var y = stage.e(stagePos);
				for (var j = 0, s = [], a = stage.v, n = a.length; j < n; ++j) {
					var c = a[j];
					s.push(c[0] + c.to(c[1] + y * c[2]) + (c[3] || ''));
				}
				applyOnElements(stage.p, s.join(''));

				return stagePos == 1;
			};
		}

		function step() {
			var t = new Date() - 0, d = t - startTime;
			while (stage < count && stages[stage].t <= d) {
				var s = stages[stage++];
				endTime = max(endTime, startTime + s.t + s.d);
				if (!s.v) continue;
				if (s.v instanceof Array) active.push(stageFunc(s, t));
				else applyOnElements(s.p, s.v);
			}
			for (var i = 0, n = active.length, finished = []; i < n; ++i) if (active[i](t)) finished.push(i);
			for (i = finished.length - 1; i >= 0; --i) active.splice(finished[i], 1);

			var next = active.length ? 10
			         : stage < count ? max(0, startTime + stages[stage].t - new Date())
			         :                 endTime - new Date();
			if (next >= 0) setTimeout(step, next);
			else if (callbacks) for (i = 0; i < callbacks.length; ++i) {
				var c = callbacks[i];
				dispatch(c, elements.concat(c._animini ? callbacks : []));
			}
		}
		
		step();
	}
	
	
	//----- Animation Compiler ----------------------------------------------------
	
	function compile(args, millisec) {
		var props = {}, times = [], efuncs = [], count = 0, millis = null, efunc = null, dup;
		
		function splitValue(s) {
			var r = [], i = 0, m;
			valuesRE.lastIndex = 0;
			while (m = valuesRE.exec(s)) {
				r.push(s.substring(i, m.index));
				i = m.index + m[0].length;
				r.push(s.substring(m.index, i));
			}
			r.push(s.substring(i));
			return r;
		}
		
		function addStep(p) {
			times.push(millis); millis = null;
			efuncs.push(efunc || defaultEasing); efunc = null;
			if (!p) p = {'__':'' + count};
			else if (dup == undefined) dup = p;
			else if (dup) dup = false;
			for (var k in props) if (p[k]) {
				var a = props[k], l = a[a.length - 1], v = splitValue(p[k]), t = v.join('');
				if (l.v.length != v.length) l.z = true;
				props[k].push({v:v, t:t, i:count});
				delete p[k];
			}
			for (k in p) {
				var v = splitValue(p[k]);
				props[k] = [{v:v, t:v.join(''), i:count}];
			}
			++count;
		}
		
		for (var i = 0, n = args.length; i < n; ++i) {
			var arg = args[i], v = arg.v;
			switch (arg.p) {
				case 's': 
					addStep(parseCssText(arg.v));
					break;
					
				case 'e':
					efunc = v;
					break;
				
				case 'm':
					if (count < 0) {
						millis = v;
						addStep();
					}
					if (millis) {
						addStep();
						millis = v;
					} else millis = v;
					break;
			}
		}
		if (millis) addStep(dup);
		else if (dup) addStep(dup);
		
		if (!count) return;
		
		// calculate the duration of each stage
		for (var i = 0, m = 0, z = 0, k = 1; i < count; ++i) {
			if (times[i] != undefined) m += times[i];
			else if (i > 0) ++z;
		}
		if (z) var k = 1, d = millisec ? max(0, round((millisec - m) / z)) : 1000;
		else k = millisec ? millisec / m : 1, d = millisec || 1000;
		for (var i = 0, starts = [0]; i < count; ++i) {
			times[i] = times[i] == undefined ? i ? d : 0 : round(k * times[i]);
			starts.push(starts[i] + times[i]);
		}
		
		// build stages
		var stages = [];
		for (k in props) {
			var a = props[k], i = a.length - 1;
			if (i && k != '__') {
				while (i) {
					var before = a[i-1], after = a[i--], bi = before.i, ai = after.i;
					for (var j = bi + 1, m = 0; j <= ai; ++j) m += times[j];
					var vals = before.z ? after.t : parseAnimatedVals(before.v, after.v);
					var e = vals instanceof Array ? efuncs[ai] : undefined;
					stages.push({t:starts[bi+1], d:m, e:e, p:k, v:vals});
				}
			} else {
				while (i >= 0) {
					var state = a[i--], si = state.i, w = k == '__', s = {t:starts[si+1], d:0};
					if (!w) { s.p = k; s.v = state.t; }
					stages.push(s);
				}
			}
		}
		stages.sort(function (a, b) {
			var at = a.t, bt = b.t, ad = a.d, bd = b.d;
			return at > bt ? 1 : at < bt ? -1 : ad > bd ? 1 : ad < bd ? -1 : 0;
		});
		
		return stages;
	}


	//----- Parsing CSS Props -----------------------------------------------------
		
	function toCamelCase(s) {
		return s.replace(/-([a-z])/g, function (ig, m) { return m.toUpperCase(); });
	}
	
	function numToString(v) {
		return '' + v;
	}
	
	function colorComponentToString(v) {
		var s = '0' + round(min(max(0, v), 255)).toString(16);
		return s.substr(s.length - 2);
	}
	
	var propTrimRE = /^(?:\s*;)*\s*|\s*(?:;\s*)*$/g;
	var propSplitRE = /(?:\s*;)+\s*/g;
	var propValRE = /\s*:\s*/;
	var valRE = /^(.*?)(-?(?:\d+(?:\.\d*)?|\.\d+))(.*)$/;
	var colorRE = /#[0-9a-f]{6}(?![0-9a-f])/ig;
	var shortColorRE = /#([0-9a-f])([0-9a-f])([0-9a-f])(?![0-9a-f])/ig;
	var valuesRE = /(-?(?:\d+(?:\.\d+)?|\.\d+)|#[0-9a-f]{6}(?![0-9a-f]))/ig;
	
	function toLower(s) { return s.toLowerCase(); }
	
	function parseCssText(s) {
		for (var r = {}, a = (s || '').replace(propTrimRE, '').split(propSplitRE), i = a.length - 1; i >= 0; --i) {
			var p = a[i].split(propValRE, 2);
			if (p.length == 2 && p[1]) r[toCamelCase(p[0])] = p[1].replace(shortColorRE, '#$1$1$2$2$3$3').replace(colorRE, toLower);
		}
		return r;
	}
	
	function parseAnimatedVals(fa, ta) {
		var vals = [], last, prefix;
		
		function addVal(prefix, start, end, to) {
			vals.push(last = [prefix, start, end - start]);
			last.to = to;
		} 
				
		function compareColorComponent(fi, ti, k) {
			var fk = fi.substr(k, 2), tk = ti.substr(k, 2);
			if (fk != tk) {
				addVal(prefix, parseInt(fk, 16), parseInt(tk, 16), colorComponentToString);
				prefix = '';
			} else prefix += fk;
		}
		
		for (var i = 1, n = fa.length, b = 0; i < n; i += 2) {
			var fi = fa[i], ti = ta[i];
			if (fi == ti) continue;
			prefix = fa.slice(b, i > 0 ? i : 0).join('');
			if (/^#/.test(fi)) {
				prefix += '#';
				compareColorComponent(fi, ti, 1);
				compareColorComponent(fi, ti, 3);
				compareColorComponent(fi, ti, 5);
				
				if (prefix) last[3] = prefix;
			} else {
				var fk = parseFloat(fi), tk = parseFloat(ti);
				if (fk == tk) continue;
				
				addVal(prefix, fk, tk, numToString);
			}
			b = i + 1;
		}
		if (!last) return fa.join('');
		var postfix = (last[3] || '') + fa.slice(b).join('');
		if (postfix) last[3] = postfix;
		return vals;
	}
	
	
	//----- Animation Factory -----------------------------------------------------
	
	function create() {
		var args = [], millisec;
		var animation = function () {
			var elements = [], callbacks = [];
			
			function parseAnimation(varArg) {
				var notstart;
			
				function parseNonArrayArg(arg) {
					switch (typeof(arg)) {
						case 'string':
							if (arg) {
								var o = document.getElementById(arg);
								if (o && typeof(o.style) == 'object') elements.push(o);
								else { args.push({p:'s', v:arg}); notstart = true; }
							}
							break
						
						case 'object':
							if (typeof(arg.style) == 'object') elements.push(arg);
							break;
							
						case 'number':
							if (!notstart) { millisec = arg; notstart = true; }
							else args.push({p:'m', v:arg});
							break;
						
						case 'function':
							if (arg[easingNameProp]) {
								args.push({p:'e', v:arg});
								notstart = true;
							} else callbacks.push(arg);
							break;
					}
				}
				
				function parseArg(arg) {
					if (arg instanceof Array) for (var i = 0, n = arg.length; i < n; ++i) parseArg(arg[i]);
					else parseNonArrayArg(arg);
				}
			
				parseArg(varArg);
				var stages = compile(args, millisec);
				if (stages && elements.length) dispatch(animate, [elements, stages, callbacks]);
				return stages;
			}
			
			var a = Array.prototype.slice.call(arguments, 0);
			if (this && this.nodeType == 1) a.push(this);
			var stages = parseAnimation(a);
			animation['stages'] = stages;
			return animation;
		};
		animation._animini = 1;
		animation.apply(this, arguments);
		return animation;
	}
	
	create['easing'] = easing;
	setupEasingFuncs();
	var defaultEasing = create['sine']['io'];

	window['animini'] = create;

})();
