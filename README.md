# Features

* Very lightweight and small - less than 5K minified.
* Automatically create a tween animation between two styles.
* Extensive easing functions (a.k.a. interpoletors) support: Linear, Quadratic, Cubic, Quartic, Sine, Exponential, Circular, Elastic, Expecting, and Bounce.   
Each easing function has its own versions of easing-in, easing-out, and easing-in-out.
* Parallelizing or serializing animations.
* Cross browser compatibility.
* No external dependencies on other libraries.


# Usage Example

	var o = document.getElementById('myDiv');
	
	// animini.create(element, fromCssText, toCssText, millisec, easingFunc, onend)
	var animateDown = animini.create(o, 'top:100px; color:#000000;', 'top:200px; color:#ff0000;', 1000, easingFunc);
	var animateUp   = animini.create(o, 'top:200px; color:#ff0000;', 'top:100px; color:#000000;', 1000, easingFunc);
	
	// animini.Pause(millisec, onend)
	var pause       = new animini.Pause(250);

	// animini.Serial(onend)
	var serial      = new animini.Serial();
	serial.add(animateDown);
	serial.add(pause);
	serial.add(animateUp);
	
	serial.start();


# Documentation

## The animini.create() factory method

	animini.create(element, fromStyle, toStyle, millisec, easingFunc, onend)

Use this method to automatically create a tween animation between two styles. The styles can be written in the css notation (e.g., `margin-top`) or the property notation (e.g., `marginTop`). You can have as many style properties as you like, and the order doesn't need to match between the fromStyle and the toStyle.

Arguments:

* *element* - the HTML DOM element that should be animated. Stored in the `obj` property of the returned animation.
* *fromStyle* - the 'before' style (e.g., `'top: 10ex; color: #FD0; opacity: 0.75'`).
* *toStyle* - the 'after' style (e.g., `'top: 15ex; color: #D80; opacity: 0.9'`).
* *millisec* - an optional duration of the animation. Defaults to `1000`. Stored in the `millisec` property of the returned animation.
* *easingFunc* - an optional easing function that should be used. Defaults to `animini.easing.sine.inout`. Stored in the `easingFunc` property of the returned animation.
* *onend* - an optional callback function that should be invoked when the animation ends. The callback will be called only if the animation ends naturally, not due to a call to `stop()`. Stored in the `onend` property of the returned animation.

Returns: An animation object. To run the animation, simply call the returned animation's `start()` method.

For example:

	animini.create(document.getElementById('myElement'), 'left:20px', 'left:50px').start();


## The animini.Animation class
The base animation class. It is abstract and should not be created directly. Use the `animini.create()` factory method instead, or create one of the derived classes (`Pause`, `Parallel` or `Serial`). However, it exposes the following methods and properties:

* `millisec` property - the duration of the animation. Defaults to 1000 (i.e., one second)
* `easingFunc` property - the easing function that should be used. Defaults to `animini.easing.sine.inout`
* `onend` property - the callback function that should be called once the animation ends naturally (i.e., not due to a call to `stop()`)
* `start()` method - tells animini to start playing the animation
* `stop()` method - tells animini to stop plaing the animation

## The animini.Pause class
Used for pausing for a specified amount of time (usually as a part of `animini.Serial` animation). It exposes the following methods and properties, in addition to those exposed by `animini.Animation`:

* `animini.Pause(millisec, onend)` - the constructor. Use with `new` (see example above). The arguments:
	* *millisec* - an optional duration of the pause. Defaults to `1000`. Stored in the `millisec` property.
	* *onend* - an optional callback function that should be invoked when the pause ends. The callback will be called only if the pause ends naturally, not due to a call to `stop()`. Stored in the `onend` property.


## The animini.Parallel class
Used to parallelize several animations. It exposes the following methods and properties, in addition to those exposed by `animini.Animation`:

* `animini.Parallel(millisec, onend)` - the constructor. Use with `new` (see example above). The arguments:
	* *millisec* - an optional duration of the parallelized animations (overrides these animations' `millisec` properties). Defaults to `1000`. Stored in the `millisec` property.
	* *onend* - an optional callback function that should be invoked when the parallelized animations end (in addition to any callbacks specified in those animations). The callback will be called only if the animation ends naturally, not due to a call to `stop()`. Stored in the `onend` property.
* `add(animation)` method - adds an animation to the parallelization list.


## The animini.Serial class
Used to serlize several animations one after the other. It exposes the following methods and properties, in addition to those exposed by `animini.Animation`:

* `animini.Serial(onend)` - the constructor. Use with `new` (see example above). The arguments:
	* *onend* - an optional callback function that should be invoked when the serlized animations end (in addition to any callbacks specified in those animations). The callback will be called only if the animation ends naturally, not due to a call to `stop()`. Stored in the `onend` property.
* `add(animation)` method - adds an animation to the serialize queue.


## The animini.easing functions
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
