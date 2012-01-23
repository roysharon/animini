// animini.js - Animation Micro Javascript Library
// by Roy Sharon <roy@roysharon.com>, 2010-09-27
// Using or modifying this project is subject to the very permissive MIT License (http://creativecommons.org/licenses/MIT/)

(function () {
	
		
	//----- Easing functions -------------------------------------------------------

	function markAsEasing(f, n, t) { f.isEasing = n + '.' + t; return f; }

	function out(f, n) { return markAsEasing(function (pos) { return 1 - f(1 - pos); }, n, 'out'); }

	function inout(f, n) { return markAsEasing(function (pos) { return pos < 0.5 ? f(pos * 2) / 2 : (1 - f(2 - pos * 2) / 2); }, n, 'inout'); }

	function easing(easeInFunc, name) {
		var f = inout(easeInFunc, name);
		f['in'] = markAsEasing(easeInFunc, name, 'in');
		f['out'] = out(easeInFunc, name);
		f['inout'] = inout(easeInFunc, name);
		return f;
	}
	
	var elastAmp = 4 / 3, elastPeriod = 1 / 3, elastc = elastPeriod * 2 * Math.PI * Math.asin(1 / elastAmp);
	
	var easingFuncs = {
		'linear' : function (pos) { return pos; },
		'quad' : function (pos) { return Math.pow(pos, 2); },
		'cubic' : function (pos) { return Math.pow(pos, 3); },
		'quart' : function (pos) { return Math.pow(pos, 4); },
		'sine' : function (pos) { return 1 - Math.cos(pos * Math.PI / 2); },
		'expo' : function (pos) { return pos ? Math.pow(2, 10 * (pos - 1)) : 0; },
		'circ' : function (pos) { return 1 - Math.sqrt(1 - Math.pow(pos, 2)); },
		'elastic' : function (pos) {
			if (pos == 0 || pos == 1) return pos;
			return -(elastAmp * Math.pow(2, 10 * (pos - 1)) * Math.sin((pos - elastc) * 2 * Math.PI / elastPeriod));
		},
		'expect' : function (pos) { return Math.pow(pos, 2) * (4 * pos - 3); },
		'bounce' : function (pos) { 
			var x = 1 - pos, f = function (a, b) { return 1 - 121/16 * Math.pow(x - a / 11, 2) - b; };
			return x < 4/11 ? f(0, 0) : x < 8/11 ? f(6, 3/4) : x < 10/11 ? f(9, 15/16) : f(10.5, 63/64);
		}
	};
	
	function setupEasingFuncs(o) {
		for (var i in easingFuncs) o[i] = easing(easingFuncs[i], i);
	}
	
	
	//----- Animation Compiler ----------------------------------------------------
	
	function compile(args, millisec) {
		var props = {}, times = [], efuncs = [], callbacks = [], count = 0, millis = null, efunc = null, cb = [], dup;
		
		function addStep(p) {
			times.push(millis); millis = null;
			efuncs.push(efunc || defaultEasing); efunc = null;
			callbacks.push(cb.length ? cb : undefined); cb = [];
			if (!p) p = {__:'' + count};
			else if (dup == undefined) dup = p;
			else if (dup) dup = false;
			for (var k in props) if (p[k]) {
				var a = props[k], l = a[a.length - 1], v = p[k].split(whiteSpace), t = v.join(' ');
				if (l.v.length != v.length) l.z = true;
				props[k].push({v:v, t:t, i:count});
				delete p[k];
			}
			for (k in p) {
				var v = p[k].split(whiteSpace);
				props[k] = [{v:v, t:v.join(' '), i:count}];
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
				
				case 'c':
					cb.push(v);
					if (!millis) addStep();
					break;
			}
		}
		if (millis || cb.length) addStep(dup);
		else if (dup) addStep(dup);
		
		if (!count) return;
		
		// calculate the duration of each stage
		for (var i = 0, m = 0, z = 0, k = 1; i < count; ++i) {
			if (times[i] != undefined) m += times[i];
			else if (i > 0) ++z;
		}
		if (z) var k = 1, d = millisec ? Math.max(0, Math.round((millisec - m) / z)) : 1000;
		else k = millisec ? millisec / m : 1, d = millisec || 1000;
		for (var i = 0, starts = [0]; i < count; ++i) {
			times[i] = times[i] == undefined ? i ? d : 0 : Math.round(k * times[i]);
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
					stages.push({t:starts[bi+1], d:m, c:callbacks[ai], e:e, p:k, v:vals});
				}
			} else {
				while (i >= 0) {
					var state = a[i--], si = state.i, w = k == '__', s = {t:starts[si+1], d:0, c:callbacks[si]};
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
		var s = '0' + Math.round(v).toString(16);
		return s.substr(s.length - 2);
	}
	
	function appendVal(s, v) { return v ? (s ? s + ' ' : '') + v : s; }

	var propTrimRE = /^(?:\s*;)*\s*|\s*(?:;\s*)*$/g;
	var propSplitRE = /(?:\s*;)+\s*/g;
	var propValRE = /\s*:\s*/;
	var valRE = /^(.*?)(-?(?:\d+(?:\.\d*)?|\.\d+))(.*)$/;
	var colorRE = /#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/ig;
	var shortColorRE = /#([0-9a-f])([0-9a-f])([0-9a-f])\b/g;
	var whiteSpace = /\s+/g;
	
	function toLower(s) { return s.toLowerCase(); }
	
	function parseCssText(s) {
		for (var r = {}, a = (s || '').replace(propTrimRE, '').split(propSplitRE), i = a.length - 1; i >= 0; --i) {
			var p = a[i].split(propValRE, 2);
			if (p.length == 2 && p[1]) r[toCamelCase(p[0])] = p[1].replace(colorRE, toLower).replace(shortColorRE, '#$1$1$2$2$3$3');
		}
		return r;
	}
	
	function parseAnimatedVals(fa, ta) {
		var vals = [], last;
		
		function addVal(prefix, postfix, start, end, to) {
			vals.push(last = {start:start, delta:end - start, to:to});
			if (prefix) last.prefix = prefix;
			if (postfix) last.postfix = postfix;
		} 
		
		for (var i = 0, n = fa.length, b = 0; i < n; ++i) {
			var fi = fa[i], ti = ta[i];
			if (fi == ti) continue;
			var prefix = fa.slice(b, i > 0 ? i : 0).join(' '), postfix = '';
			if (/^#/.test(fi)) {
				prefix = appendVal(prefix, '#');
				
				function compareColorComponent(k) {
					var fk = fi.substr(k, 2), tk = ti.substr(k, 2);
					if (fk != tk) { 
						addVal(prefix, postfix, parseInt(fk, 16), parseInt(tk, 16), colorComponentToString);
						prefix = postfix = '';
					} else prefix += fk;
				}
				compareColorComponent(1);
				compareColorComponent(3);
				compareColorComponent(5);
				
				if (prefix) last.postfix = prefix;
			} else {
				var fm = valRE.exec(fi), tm = valRE.exec(ti);
				if (!fm || !tm) continue;

				var fk = parseFloat(fm[2]), tk = parseFloat(tm[2]);
				if (fk == tk) continue;
				
				addVal(appendVal(prefix, fm[1]), fm[3], fk, tk, numToString);
			}
			b = i + 1;
		}
		if (!last) return fa.join(' ');
		last.postfix = appendVal(last.postfix, fa.slice(b).join(' '));
		return vals;
	}
	
	
	//----- Parsing Animations ----------------------------------------------------
	
	function parseAnimation(animation, varArg) {
		var args = animation.args, elements = animation.elements, millisec = animation.millisec, notstart;
	
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
					args.push({p:arg.isEasing ? 'e' : 'c', v:arg});
					notstart = true;
					break;
			}
		}
		
		function parseArg(arg) {
			if (arg instanceof Array) for (var i = 0, n = arg.length; i < n; ++i) parseArg(arg[i]);
			else parseNonArrayArg(arg);
		}
	
		parseArg(varArg);
		animation.millisec = millisec;
		animation.stages = compile(args, millisec);
		if (animation.stages && elements.length) setTimeout(animation.start, 1);
	}


	//----- Animation class ---------------------------------------
	
	function Animation() {
		this.args = [];
		this.elements = [];
	}
	
	Animation.prototype = {
		
		clone :
		function () {
			var r = new Animation();
			r.millisec = this.millisec;
			r.elements = this.elements.concat();
			r.args = this.args.concat();
			return r;
		},
		
		start :
		function () {
			this.stage = -1;
			this.nextStage();
		},
		
		nextStage :
		function (fastforward) {
			if (this.stage < this.stages.length - 1) {
				var s = this.stages[++this.stage];
				this.callbacks = s.c;
				if (s.p) {
					this.props = s.p;
					if (!fastforward) {
						this.frame = 0;
						this.pos = 1 / s.m;
						this.easingFunc = s.e;
						this.startTime = new Date().getTime();
						this.endTime = this.startTime + s.m;
						this.setTimer(this.step, 1);
					} else this.pos = 1;
					this.doStep();
				} else if (!fastforward) this.setTimer(this.dispatchCallbacks);
			}
		},
		
		dispatchCallbacks :
		function () {
			for (var i = 0, n = this.callbacks.length; i < n; ++i) this.callbacks[i](this.elements);
			this.nextStage();
		},
		
		stop :
		function () {
			if (this.timeout != undefined) clearTimeout(this.timeout);
			delete this.timeout;
			while (this.stage < this.stages.length) this.nextStage(true);
		},
		
		step :
		function () {
			var t = new Date().getTime(), d = this.endTime - t;
			if (d > 0) {
				this.fpms = ++this.frame / (t - this.startTime);
				this.pos += (1 - this.pos) / this.fpms / d;
				if (this.pos >= 1) this.pos = 1;
			} else this.pos = 1;
			this.doStep();
			if (this.pos < 1) this.setTimer(this.step, 10);
			else { delete this.timeout; this.dispatchCallbacks(); }
		},
		
		doStep :
		function () {
			var y = this.easingFunc(this.pos), o = this.elements;
			for (var p = this.props, i = p.length - 1; i >= 0; --i) {
				for (var j = 0, s = [], a = p[i].vals, n = a.length; j < n; ++j) {
					var c = a[j];
					s.push(c.prefix + c.to(y * c.delta + c.start) + c.postfix);
				}
				for (j = o.length - 1; j >= 0; --j) o[j].style[p[i].prop] = s.join('');
			}
		},
		
		setTimer :
		function (f, ms) {
			var me = this;
			this.timeout = window.setTimeout(function () { f.call(me); }, ms);
		}
	
	};

	
	//----- Animation Factory -----------------------------------------------------
	
	function create() {
		return parseFunc().apply(null, arguments);
	}
	
	function parseFunc(animation) {
		return function () {
			var a = animation ? animation.clone() : new Animation();
			parseAnimation(a, Array.prototype.slice.call(arguments, 0));
			var r = parseFunc(a);
			r.animation = a;
			return r;
		};
	}
	
	create['easing'] = easing;
	setupEasingFuncs(create);
	var defaultEasing = create['sine']['inout'];

	window['animini'] = create;

})();
