// animini.js - Miniature Animation Javascript Library
// by Roy Sharon <roy@roysharon.com>, 2010-09-27
// Using or modifying this project is subject to the very permissive MIT License (http://creativecommons.org/licenses/MIT/)

(function () {

	//----- Utilities --------------------------------------------------------------
	
	function expose(path, o) { 
		for (var i = 0, c = ('animini.'+path).split('.'), n = c.length, t = window; i < n; ++i)
			if (t[c[i]] == undefined) t = t[c[i]] = i == n-1 ? o : {}; 
			else t = t[c[i]];
	}
	
	function pre(s, n, p) {
		if (!n) return s;
		
		if (p == undefined || p == '') p = '0';
		while (p.length < n) p += p;
		
		var r = p + s;
		return r.substr(r.length - n);
	}
	
	function toCamelCase(s) {
		return s.toLowerCase().replace(/-([a-z])/g, function (ig, m) { return m.toUpperCase(); });
	}
	
	
	//----- Easing functions -------------------------------------------------------

	function out(f) { return function (pos) { return 1 - f(1 - pos); }; }

	function inout(f) { return function (pos) { return pos < 0.5 ? f(pos * 2) / 2 : (1 - f(2 - pos * 2) / 2); }; }

	function easing(easeInFunc) {
		var f = inout(easeInFunc);
		f['in'] = easeInFunc;
		f['out'] = out(easeInFunc);
		f['inout'] = inout(easeInFunc);
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
	
	function setupEasingFuncs() {
		for (var i in easingFuncs) easing[i] = easing(easingFuncs[i]);
	}
	setupEasingFuncs();
	
	expose('easing', easing);
	
	
	//----- Animation class ---------------------------------------
	
	function Animation() {}
	
	expose('Animation', Animation);
	
	Animation.prototype = {
	
		millisec : 1000,
		
		easingFunc : easing['sine']['inout'],
		
		start :
		function start() {
			this.frame = 0;
			this.pos = 1 / this.millisec;
			this.startTime = new Date().getTime();
			this.endTime = this.startTime + this.millisec;
			this.setTimer(this.step, 1);
			this.doStep();
		},
		
		stop :
		function stop() {
			if (this.timeout != undefined) clearTimeout(this.timeout);
			delete this.timeout;
			this.pos = 1;
			this.doStep();
		},
		
		step :
		function step() {
			var t = new Date().getTime(), d = this.endTime - t;
			if (d > 0) {
				this.fpms = ++this.frame / (t - this.startTime);
				this.pos += (1 - this.pos) / this.fpms / d;
				if (this.pos >= 1) this.pos = 1;
			} else this.pos = 1;
			this.doStep();
			if (this.pos < 1) this.setTimer(this.step, 10);
			else { delete this.timeout; if (this.onend) this.onend(); }
		},
		
		doStep :
		function doStep() {},
		
		setTimer :
		function setTimer(f, ms) {
			this.timeout = window.setTimeout(this.cb(f), ms);
		},
		
		cb :
		function cb(func) {
			var me = this;
			return function() { return func.apply(me, arguments); };
		}
	
	};
		
	
	//----- Parallel class ---------------------------------------------------------
	
	function Parallel(millisec, onend) {
		this.animations = [];
		if (millisec) this.millisec = millisec;
		this.onend = onend;
	}
	
	expose('Parallel', Parallel);
	
	Parallel.prototype = new Animation();
	
	Parallel.prototype.add =
	function (animation) {
		this.animations.push(animation);
	};
	
	Parallel.prototype.start =
	function () {
		for (var i = 0, n = this.animations.length; i < n; ++i) {
			var a = this.animations[i];
			a.setTimer = function(){};
			a.millisec = this.millisec;
			a.start();
		}
		Animation.prototype.start.call(this);
	};
	
	Parallel.prototype.stop =
	function () {
		for (var i = 0, n = this.animations.length; i < n; ++i) this.animations[i].stop();
	};
	
	Parallel.prototype.doStep =
	function () {
		for (var i = 0, n = this.animations.length; i < n; ++i) this.animations[i].step();
	};
	
	
	//----- Serial class -----------------------------------------------------------
	
	function Serial(onend) {
		this.animations = [];
		this.onend = onend;
		this.current = -1;
	}
	
	expose('Serial', Serial);
	
	Serial.prototype = new Animation();
	
	Serial.prototype['add'] =
	function (animation) {
		this.animations.push(animation);
	};
	
	Serial.prototype.start =
	function () {
		for (var i = 0, n = this.animations.length; i < n; ++i) this.animations[i].onend = this.cb(this.next);
		this.current = -1;
		this.next();
	};
	
	Serial.prototype.stop =
	function () {
		if (this.current != -1) this.animations[this.current].stop();;
		this.current = -1;
	};
	
	Serial.prototype.doStep =
	function () {
		if (this.current != -1) this.animations[this.current].doStep();;
	};
	
	Serial.prototype.next =
	function () {
		if (++this.current < this.animations.length) this.animations[this.current].start();
		else { this.current = -1; if (this.onend) this.onend(); }
	};
	
	
	//----- Pause class ------------------------------------------------------------
	
	function Pause(millisec, onend) {
		this.millisec = millisec;
		this.onend = onend;
	}
	
	expose('Pause', Pause);
	
	Pause.prototype = new Animation();
	
	
	//----- Animation Factory -----------------------------------------------------
	
	function Custom(o, props, millisec, easingFunc, onend) {
		this.obj = o;
		this.props = props;
		if (millisec) this.millisec = millisec;
		this.onend = onend;
		if (easingFunc) this.easingFunc = easingFunc;
	}
	
	Custom.prototype = new Animation();
	
	Custom.prototype.doStep = 
	function () {
		var y = this.easingFunc(this.pos);
		for (var p = this.props, i = p.length - 1; i >= 0; --i) {
			for (var j = 0, s = [], a = p[i].vals, n = a.length; j < n; ++j) {
				var c = a[j];
				s.push(c.prefix + c.to(y * c.delta + c.start) + c.postfix);
			}
			this.obj.style[p[i].prop] = s.join('');
		}
	};
	
	var valRE = /^(.*?)(-?(?:\d+(?:\.\d*)?|\.\d+))(.*)$/;
	var colorRE = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/;
	
	function create(o, fromCssText, toCssText, millisec, easingFunc, onend) {
		var from = parseCssText(fromCssText), to = parseCssText(toCssText), r = [];
		for (var p in from) {
			var tp = to[p];
			if (!tp) continue;
			var fa = from[p].split(/\s+/g), n = fa.length, ta = tp.split(/\s+/g);
			if (ta.length != n) continue;
			for (var i = 0, b = 0, d = [], last; i < n; ++i) {
				var fi = fa[i], ti = ta[i];
				if (fi == ti) continue;
				var c = {prefix:fa.slice(b, i > 0 ? i : 0).join(' '), postfix:''};
				if (/^#/.test(fi)) {  // possibly a color in 3 hex digits
					fi = fi.toLowerCase().replace(colorRE, '#$1$1$2$2$3$3');
					ti = ti.toLowerCase().replace(colorRE, '#$1$1$2$2$3$3');
					if (fi == ti) continue;
					
					var addToPrefix = '';
					c.prefix = appendVal(c.prefix, '#');
					function compareColorComponent(k) {
						var fk = fi.substr(k, 2), tk = ti.substr(k, 2);
						if (fk != tk) { 
							c.start = parseInt(fk, 16);
							c.delta = parseInt(tk, 16) - c.start;
							c.to = colorComponentTo;
							d.push(last = c);
							c = {prefix:'', postfix:''};
						} else c.prefix += fk;
					}
					compareColorComponent(1);
					compareColorComponent(3);
					compareColorComponent(5);
					if (c.prefix) d[d.length - 1].postfix = c.prefix;
				} else {
					var fm = valRE.exec(fi), tm = valRE.exec(ti);
					if (!fm || !tm) continue;

					addToPrefix = fm[1];
					var fk = parseFloat(fm[2]), tk = parseFloat(tm[2]);
					if (fk == tk) continue;
					
					c.start = fk;
					c.delta = tk - fk;
					c.to = numTo;
					c.postfix = fm[3];
					d.push(last = c);
				}
				last.prefix = appendVal(last.prefix, addToPrefix);
				b = i + 1;
			}
			last.postfix = appendVal(last.postfix, fa.slice(b).join(' '));
			r.push({prop:p, vals:d});
		}
		return new Custom(o, r, millisec, easingFunc, onend);
	}
	
	function appendVal(s, v) { return (s ? s + ' ' : '') + v; }

	function numTo(v) { return '' + v; }
	
	function colorComponentTo(v) { var s = '0' + Math.round(v).toString(16); return s.substr(s.length - 2); }
	
	function parseCssText(s) {
		for (var r = {}, a = (s || '').replace(/^\s+|\s*;\s*$/g, '').split(/\s*;\s*/g), i = a.length - 1; i >= 0; --i) {
			var p = a[i].split(/\s*:\s*/, 2);
			if (p.length == 2 && p[1]) r[toCamelCase(p[0])] = p[1];
		}
		return r;
	}
	
	expose('create', create);

})();
