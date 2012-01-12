### Features

* Very small - less than 4K minified.
* Tween animations for all style properties.
* Extensive easing functions (a.k.a. interpoletors) support:
	* Linear
	* Quadratic
	* Cubic
	* Quartic
	* Sine
	* Exponential
	* Circular
	* Elastic
	* Expecting
	* Bounce
* Parallelizing or serializing animations.
* Cross browser compatibility.
* No external dependencies.


### Usage Example

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
