/**
 * See LICENSE file.
 *
 * 
	  ####  #####  ##### ####    ###  #   # ###### ###### ##     ##  #####  #     #      ########    ##    #  #  #####
	 #   # #   #  ###   #   #  #####  ###    ##     ##   ##  #  ##    #    #     #     #   ##   #  #####  ###   ###
	 ###  #   #  ##### ####   #   #   #   ######   ##   #########  #####  ##### ##### #   ##   #  #   #  #   # #####
 -
 File:
 	main.js
 Created By:
 	Mario Gonzalez
 Project	:
 	None
 Abstract:
 	 A simple CAAT template for hello-world applications.
*/

(function() {

	// Let's self contain our demo within a CAATHelloWorld object
	var CAATHelloWorld = function() {
		return this;
	};

	CAATHelloWorld.prototype.create = function()	{
		// Create the director instance
		var director = new CAAT.Director().initialize(600, 600);
		// Create a scene, all directors must have at least one scene - this is where all your stuff goes
		var scene = new CAAT.Scene();
		scene.create();	// Notice we call create when creating this, and ShapeActor below. Both are Actors
		scene.setFillStyle('#eeeeee');
		director.addScene(scene); // Immediately add the scene once it's created

		// Make one single circle, and set some properties
		var circle = new CAAT.ShapeActor(); // The ShapeActor constructor function does nothing interesting, simply returns 'this'
		circle.create();	// The 'create' must be called after, in order to make the object
		circle.setSize(60,60); // Set the width and hight of the circle
		circle.setFillStyle('#ff00ff');
		circle.setLocation(director.width*0.5, director.height*0.5); // Place in the center of the screen, use the director's width/height

		// Add it to the scene, if this is not done the circle will not be drawn
		scene.addChild(circle);

		// Add the director to the document
		document.getElementById('container').appendChild(director.canvas);
		// Start the render loop, with at 30FPS
		director.loop(30);

		// Every tick, the scene will call this function
		var that = this; // Store a reference to a the 'CAATHelloWorld' instnace
		scene.endAnimate = function(director,time)	{
			// Move the circle 1 pixel randomly up/down/left/right
			circle.x += Math.random() * 2 - 1;
			circle.y += Math.random() * 2 - 1;
		};
	};

	/**
	 * Stats
	 * Create stats module, and attach to top left
	 */
	CAATHelloWorld.prototype.initStats = function()	{
		var stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.left = '0px';
		stats.domElement.style.top = '0px';

		// Update
		setInterval( function () {
			stats.update();
		}, 1000 / 30 );

		// Add to <div>
		document.getElementById('container').appendChild(stats.domElement);
	};

	// Callback for when browser is ready
	var onDocumentReady = function() {
		// Create an instance of CAATHelloWorld
		var helloWorldInstance = new CAATHelloWorld();
		helloWorldInstance.create();
		helloWorldInstance.initStats();
	};

	// Listen for ready
	window.addEventListener('load', onDocumentReady, false);
})();