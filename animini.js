// animini.js - Miniature Animation Javascript Library
// by Roy Sharon <roy@roysharon.com>, 2010-09-27

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
	
	
	//----- Easing functions -------------------------------------------------------

	var elastAmp = 4 / 3, elastPeriod = 1 / 3, elastc = elastPeriod * 2 * Math.PI * Math.asin(1 / elastAmp);
	
	var easing = {
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
		},
	};
	
	function out(f) { return function (pos) { return 1 - f(1 - pos); }; }
	function inout(f) { return function (pos) { return pos < 0.5 ? f(pos * 2) / 2 : (1 - f(2 - pos * 2) / 2); }; }
	function setupEasingFuncs() {
		for (var i in easing) {
			var f = easing[i];
			easing[i] = {'in':f, 'out':out(f), 'inout':inout(f)};
		}
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
	
	
	//----- Tween class ------------------------------------------------------------
	
	function Tween(o, prop, startVal, endVal, postfix, millisec, easingFunc, onend) {
		this.obj = o;
		this.prop = prop;
		if (postfix == undefined) postfix = /^(?:left|top|width|height)$/.test(prop) ? 'px' : '';
		this.cssVal = /[Cc]olor/.test(prop) ? function (v) { return '#' + pre(v.toString(16), 6); } : function (v) { return v + postfix; };
		this.startVal = startVal;
		this.endVal = endVal;
		this.deltaVal = this.endVal - this.startVal;
		if (millisec) this.millisec = millisec;
		this.onend = onend;
		if (easingFunc) this.easingFunc = easingFunc;
	}
	
	expose('Tween', Tween);
	
	Tween.prototype = new Animation();
	
	Tween.prototype.doStep = 
	function () {
		this.obj.style[this.prop] = this.cssVal(this.easingFunc(this.pos) * this.deltaVal + this.startVal);
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
	
	Serial.prototype.add =
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

})();
