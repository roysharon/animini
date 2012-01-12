# Features

* Very small - less than 4K minified.
* Tween animations for all style properties.
* Extensive easing functions (a.k.a. interpoletors) support: Linear, Quadratic, Cubic, Quartic, Sine, Exponential, Circular, Elastic, Expecting, and Bounce.   
Each easing function has its own versions of easing-in, easing-out, and easing-in-out.
* Parallelizing or serializing animations.
* Cross browser compatibility.
* No external dependencies.


# Usage Example

	var o = document.getElementById('myDiv');
	
	// animini.Tween(element, stylePropName, startVal, endVal, postfix, millisec, easingFunc, onend)
	var animateDown  = new animini.Tween(o, 'top', 100, 200, 'px', 1000, animini.easing.bounce.out;);
	var animateUp    = new animini.Tween(o, 'top', 200, 100, 'px', 1000, animini.easing.bounce.out;);
	var animateShow  = new animini.Tween(o, 'opacity', 1, 0, null, 1000, animini.easing.expo.in;);
	var animateHide  = new animini.Tween(o, 'opacity', 0, 1, null, 1000, animini.easing.expo.in;);
	
	// animini.Pause(millisec, onend)
	var pause        = new animini.Pause(250);
	
	// animini.Parallel(millisec, onend)
	var parallelDown = new animini.Parallel(1000); // duration will override duration of child animations
	var parallelUp   = new animini.Parallel(1000);
	parallelDown.add(animateDown);
	parallelDown.add(animateHide);
	parallelUp.add(animateUp);
	parallelUp.add(animateShow);
	
	// animini.Serial(onend)
	var serial = new animini.Serial(animate);
	serial.add(parallelDown);
	serial.add(pause);
	serial.add(parallelUp);
	serial.add(pause);
	
	serial.start();


# Documentation

### The animini.Animation class
The base animation class. It is abstract and should not be created directly - create one of the derived classes instead (`Tween`, `Pause`, `Parallel` or `Serial`). However, it exposes the following methods and properties:

* `millisec` property - the duration of the animation. Defaults to 1000 (i.e., one second)
* `easingFunc` property - the easing function that should be used. Defaults to `animini.easing.sine.inout`
* `onend` property - the callback function that should be called once the animation ends naturally (i.e., not due to a call to `stop()`)
* `start()` method - tells animini to start playing the animation
* `stop()` method - tells animini to stop plaing the animation

### The animini.Tween class
The tweening animation class. It exposes the following methods and properties, in addition to those exposed by `animini.Animation`:

* `animini.Tween(element, stylePropName, startVal, endVal, postfix, millisec, easingFunc, onend)` - the constructor. Use with `new` (see example above). The arguments:
	* *element* - the HTML DOM element that should be animated. Stored in the `obj` property.
	* *stylePropName* - the name of the style property that should be animated. Stored in the `prop` property.
	* *startVal* - the start value of the animated property. Stored in the `startVal` property.
	* *endVal* - the end value of the animated property. Stored in the `endVal` property.
	* *postfix* - an optional postfix that should be appended to the value of the animated property (e.g., `'px'`, `'%'`). Defaults to `''`. Stored in the `postfix` property.
	* *millisec* - an optional duration of the animation. Defaults to `1000`. Stored in the `millisec` property.
	* *easingFunc* - an optional easing function that should be used. Defaults to `animini.easing.sine.inout`. Stored in the `easingFunc` property.
	* *onend* - an optional callback function that should be invoked when the animation ends. The callback will be called only if the animation ends naturally, not due to a call to `stop()`. Stored in the `onend` property.
* `obj` property - the HTML DOM element that should be animated.
* `prop` property - the name of the style property that should be animated.
* `startVal` property - the start value of the animated property.
* `endVal` property - the end value of the animated property.
* `postfix` property - the postfix that should be appended to the value of the animated property (e.g., `'px'`, `'%'`).

### The animini.Pause class
Used for pausing for a specified amount of time (usually as a part of `animini.Serial` animation). It exposes the following methods and properties, in addition to those exposed by `animini.Animation`:

* `animini.Pause(millisec, onend)` - the constructor. Use with `new` (see example above). The arguments:
	* *millisec* - an optional duration of the pause. Defaults to `1000`. Stored in the `millisec` property.
	* *onend* - an optional callback function that should be invoked when the pause ends. The callback will be called only if the pause ends naturally, not due to a call to `stop()`. Stored in the `onend` property.

### The animini.Parallel class
Used to parallelize several animations. It exposes the following methods and properties, in addition to those exposed by `animini.Animation`:

* `animini.Parallel(millisec, onend)` - the constructor. Use with `new` (see example above). The arguments:
	* *millisec* - an optional duration of the parallelized animations (overrides these animations' `millisec` properties). Defaults to `1000`. Stored in the `millisec` property.
	* *onend* - an optional callback function that should be invoked when the parallelized animations end (in addition to any callbacks specified in those animations). The callback will be called only if the animation ends naturally, not due to a call to `stop()`. Stored in the `onend` property.
* `add(animation)` method - adds an animation to the parallelization list.

### The animini.Serial class
Used to serlize several animations one after the other. It exposes the following methods and properties, in addition to those exposed by `animini.Animation`:

* `animini.Serial(onend)` - the constructor. Use with `new` (see example above). The arguments:
	* *onend* - an optional callback function that should be invoked when the serlized animations end (in addition to any callbacks specified in those animations). The callback will be called only if the animation ends naturally, not due to a call to `stop()`. Stored in the `onend` property.
* `add(animation)` method - adds an animation to the serialize queue.

### The animini.easing functions
An easing function is any function that takes a single numeric argument and returns a numeric result. Both the argument and the return value should be between 0 and 1. Some easing function (for example `elastic`) return sometimes values below 0 or above 1, but this does not always make sense for all properties (for example for opacity). In any case, the easing function should return 0 for 0, and 1 for 1.

Each easing type includes a triplet of functions:

* `in` - the easing in function
* `out` - the easing out function
* `inout` - easing in till midway, and then easing out till the end

So for example, the linear easing triplet `animini.easing.linear` includes the functions `animini.easing.linear.in`, `animini.easing.linear.out` and `animini.easing.linear.inout`.

The animini library includes the following easing function triplets:

* `animini.easing.linear` - linear easing: `y = x`
* `animini.easing.quad` - quadratic easing: `y = pow(x, 2)`
* `animini.easing.cubic` - cubic easing: `y = pow(x, 3)`
* `animini.easing.quart` - quartic easing: `y = pow(x, 4)`
* `animini.easing.sine` - sinosuidal easing: `y = -cos(x * PI/2)`
* `animini.easing.expo` - exponential easing: `y = pow(2, 10*(x-1))`
* `animini.easing.circ` - circular easing: `y = 1 - sqrt(1 - pow(x, 2))`
* `animini.easing.elastic` - elastic easing: `y = -(4/3 * pow(2, 10*(x-1)) * sin((x - 2*PI*asin(3/4)/3) * 2*PI * 3))`
* `animini.easing.expect` - expecting easing: `y = pow(x, 2) * (4*x - 3)`
* `animini.easing.bounce` - bounce easing: a four part hyperbollic animation that produce a bouncing effect

# License
Using or modifying this project is subject to the very permissive [MIT License](http://creativecommons.org/licenses/MIT/).
