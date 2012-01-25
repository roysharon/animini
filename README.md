# Animini Features

* Very lightweight and small - less than 5K minified.
* Create tween animations by specifying CSS styles textually.
* Easing functions (a.k.a. interpoletors): Linear, Quadratic, Cubic, Quartic, Sine, Exponential, Circular, Elastic, Expecting, and Bounce. Each easing function has its own versions of easing-in, easing-out, and easing-in-out.
* Cross browser compatibility.
* No external dependencies on other libraries.


# Usage Example
	  
	  
	animini('myDiv', 'top:100px; color:#008C00', 1000, 'top:200px; color:#ff0000');
	  
	  

# Documentation

## The animini() factory method

Use this method to create a tween animation between several styles. The styles can be written in the css notation (e.g., `margin-top`) or the property notation (e.g., `marginTop`). You can have as many style properties as you like, and the order of these properties is not important.

Arguments can be supplied in any order, and each argument can be supplied more than once:

* *element* - an HTML DOM element that should be animated. It can either be the element ID or the element itself (e.g., `"myDiv"`).  

* *milliseconds* - the total duration of the animation, including all transitions. This is an optional argument, but if specified it needs to be before the first style argument. If unspecified, the animation will use the total sum of the durations of all the transitions.  

* *style* - a CSS style (e.g., `'top: 10ex; color: #FD0; opacity: 0.75'`). The animation will transition from the first style specified to the second, and then to the third, and so forth. There must be at least two style arguments in an animation. 

* *duration* - the duration of a transition. This is an optional argument between a couple of style arguments (e.g., `"top:30px", 500, "top:70px"` will cause the transition to take 500 milliseconds). The default transition duration is 1000 milliseconds.  

* *easingFunc* - the easing function that should be used in a transition. This is an optional argument between a couple of style arguments (e.g., `"top:30px", animini.bounce.o, "top:70px"` will cause the transition to use the bounce-out easing function). Defaults to `animini.sine.io`. See the list of animini's [easing functions](#easing) below.  

* *callback* - an optional callback function that should be invoked when the animation ends. The callback's arguments are the elements on which the animation occured (this enables infinite loop animations by giving the animation itself as a callback; see [example](#callbacks) below).


## Animation functions

The `animini()` factory method returns an animation function. If the animation has enough parameters to run, then it will automatically start:

	// calling animini with a couple of styles and an element ID is enough to get the animation started.
	// no need to use the returned animation function, because the animation is already running
	animini('margin:0px 0px 30px 30px', 'margin:30px 30px 0px 0px', 'myImg');


However, if the animation does not have enough parameters to run, it will wait for further arguments to be supplied:

	var animation = animini('left:20px');         // not enough arguments to run: needs a finish style
	animation(300, animini.quad.o, 'left:50px');  // still not enough arguments: needs an element
	animation(300, animini.quad.i, 'left:20px');  // still not enough; still no element
	animation('myFirstElement');                  // now the animation has enough arguments, so it will start
	animation('mySecondElement');                 // run the same animation on element with ID 'mySecondElement'


## Reusing animation functions

An animation function keeps all of the animation information, except for the elements on which it should operate. This means that you can use the same animation for different elements:

	var hoverIn  = animini('background-color:#fff; color:#00f', 300, 'background-color:#00f; color:#fff');
	var hoverOut = animini('background-color:#00f; color:#fff', 300, 'background-color:#fff; color:#00f');
	document.getElementById('mySpan').onmouseover = hoverIn;
	document.getElementById('mySpan').onmouseout  = hoverOut;

Notice that animation functions can also get the element to work on from the `this` value. This is what causing the animations above to run (the event handler is being called with `this` pointing at the DOM element on which the event was fired).


## Animating several style properties in parallel

To animate several properties in parallel, simply specify them:

	animini('myDiv',
	        'color:#880088; margin-top:20px; text-shadow: 0px  0px  0px #000;',
	        'color:#ff0020; margin-top: 0px; text-shadow:20px 20px 40px #888;'
	       );


## Adding pauses to an animation

To add pauses inside an animation, add a transition without changing the style:

	// create an animation that fades in for a quarter of a second, waits half a second, and then fades out again
	var transparent = 'opacity: 0.0';
	var opaque      = 'opacity: 1.0';
	var fadeInOut   = animini(transparent, 250, opaque, 500, opaque, 250, transparent);
	
	// activate the animation
	fadeInOut('myElement');


<a name="callbacks">
## Using callbacks
</a>

To have a function be called upon the animation end, simply add it as an argument:

	function myCallback(elem) {
		// do something
	}
	
	// create the animation
	var animation = animini('top:-2em', 'top:0em', myCallback);

	// activate the animation
	animation('myDiv'); // myCallback will be called with the element 'myDiv' once the animation is finished

	// you can also create an inifinitly looping animation by supplying the animation itself as a callback function
	animation('myDiv', animation);

Note that you can add multiple callbacks. All of them will be called when the animation ends.


<a name="easing">
## Easing functions
</a>

The animini library includes the following easing types:

* `animini.linear` - linear easing: `y = x`
* `animini.quad` - quadratic easing: `y = pow(x, 2)`
* `animini.cubic` - cubic easing: `y = pow(x, 3)`
* `animini.quart` - quartic easing: `y = pow(x, 4)`
* `animini.sine` - sinosuidal easing: `y = -cos(x * PI/2)`
* `animini.expo` - exponential easing: `y = pow(2, 10*(x-1))`
* `animini.circ` - circular easing: `y = 1 - sqrt(1 - pow(x, 2))`
* `animini.elastic` - elastic easing: `y = -(4/3 * pow(2, 10*(x-1)) * sin((x - 2*PI*asin(3/4)/3) * 2*PI * 3))`
* `animini.expect` - expecting easing: `y = pow(x, 2) * (4*x - 3)`
* `animini.bounce` - bounce easing: a four part hyperbollic animation that produce a bouncing effect


Each easing type includes a triplet of functions:

* `i` - the easing in function
* `o` - the easing out function
* `io` - easing in till midway, and then easing out till the end

So for example, the linear easing triplet `animini.expect` includes the functions `animini.expect.i`, `animini.expect.o` and `animini.expect.io`. The type itself is equivalent to the in-out function, so you can use `animini.expect` and `animini.expect.io` interchangeably.  
See demo-easing.html for a demonstration of all easing functions included in animini.


### You can also create your own easing function

An easing function is any function that takes a single numeric argument and returns a numeric result. Both the argument and the return value should be between 0 and 1. Some easing function (for example `elastic`) return sometimes values below 0 or above 1, but this does not always make sense for all properties (for example for opacity). In any case, the easing function should return 0 for 0, and 1 for 1.

Note that you must register an easing function before you can use it in animations:

	function randomEasing(x) {
		return x == 1 ? 1 : Math.random() * x;
	}
	
	// registering the new easing function
	animini.easing('random', randomEasing);
	
	// note that by registering the easing function, animini creates the easing triplet .i, .o and .io,
	// under the supplied name under animini (e.g., animini.random.io)
	
	// using the new easing function
	animini('myDiv', 'margin-top:50px', animini.random.io, 'margin-top:0px');


# License
Using or modifying this project is subject to the very permissive [MIT License](http://creativecommons.org/licenses/MIT/).
