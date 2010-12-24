/**
	  ####  #####  ##### ####    ###  #   # ###### ###### ##     ##  #####  #     #      ########    ##    #  #  #####
	 #   # #   #  ###   #   #  #####  ###    ##     ##   ##  #  ##    #    #     #     #   ##   #  #####  ###   ###
	 ###  #   #  ##### ####   #   #   #   ######   ##   #########  #####  ##### ##### #   ##   #  #   #  #   # #####
 -
 File:
 	PackedCircle.js
 Created By:
 	Mario Gonzalez
 Project	:
 	None
 Abstract:
 	 A single packed circle.
	 Contains a reference to it's div, and information pertaining to it state.
 Basic Usage:
	http://onedayitwillmake.com/CirclePackJS/
*/
(function()
{
	CAAT.modules = CAAT.modules || {};
	CAAT.modules.CircleManager = CAAT.modules.CircleManager || {};

	CAAT.modules.CircleManager.PackedCircleManager= function()
	{
		this.allCircles = [];
		this.position = null;
		this.offset = null;

		this.targetPosition = null;

		this.radius = 0;
		this.radiusSquared = 0;

		// Collision properties
		this.isFixed = 0;
		this.collisionMask = 0;
		this.collisionGroup = 0;

		return this;
	};

	CAAT.modules.CircleManager.PackedCircleManager.prototype = {
		allCircles:					[],
		numberOfCollisionPasses:	1,
		numberOfTargetingPasses:	0,
		bounds:						new CAAT.Rectangle(),

		addCircle: function(aCircle)
		{
			this.allCircles.push(aCircle);
		},

		/**
		 * Removes a circle
		 * @param aCircle	Circle to remove
		 */
		removeCircle: function(aCircle)
		{
			var index = 0,
				found = false,
				len = this.allCircles.length;

			if(len === 0) {
				throw "Error: (PackedCircleManager) attempting to remove circle, and allCircles.length === 0!!"
			}

			while (len--) {
				if(this.allCircles[len] === aCircle) {
					found = true;
					index = len;
					break;
				}
			}

			if(!found) {
				throw "Could not locate circle in allCircles array!"
			}

			// Remove
			this.allCircles[index].dealloc();
			this.allCircles[index] = null;
		},

		/**
		 * Forces all circles to move to where their target's position is
		 * Assumes all targets have a 'position' property!
		 */
		forceCirclesToMatchViewPositions: function()
		{
			var len = this.allCircles.length;

			// push toward target position
			for(var n = 0; n < len; n++)
			{
				var aCircle = this.allCircles[n];
				if(!aCircle || !aCircle.view) {
					continue;
				}

				aCircle.position.x = aCircle.view.position.x + aCircle.offset.x;
				aCircle.position.y = aCircle.view.position.y + aCircle.offset.y;
			}
		},

		pushAllCirclesTowardTarget: function(aTarget)
		{
			var v = new CAAT.Point().set(0,0),
				circleList = this.allCircles,
				len = circleList.length;

			// push toward target position
			for(var n = 0; n < this.numberOfTargetingPasses; n++)
			{
				var damping = 0.03;
				for(var i = 0; i < len; i++)
				{
					var c = circleList[i];

					if(c.isFixed) continue;

					v.x = c.position.x - aTarget.x;
					v.y = c.position.y - aTarget.y;
					v.multiply(damping);

					c.position.x -= v.x;
					c.position.y -= v.y;
				}
			}
		},


		removeExpiredElements: function()
		{
			// remove null elements
			for (var k = this.allCircles.length; k >= 0; k--) {
				if (this.allCircles[k] === null)
					this.allCircles.splice(k, 1);
			}
		},

		/**
		 * Packs the circles towards the center of the bounds.
		 * Each circle will have it's own 'targetPosition' later on
		 */
		handleCollisions: function()
		{
			this.removeExpiredElements();

			var v = new CAAT.Point().set(0, 0),
				circleList = this.allCircles,
				len = circleList.length;

			// Collide circles
			for(var n = 0; n < this.numberOfCollisionPasses; n++)
			{
				for(var i = 0; i < len; i++)
				{
					var ci = circleList[i];


					for (var j = i + 1; j< len; j++)
					{
						var cj = circleList[j];

						if( !this.circlesCanCollide(ci, cj) ) continue;   // It's us!


						var dx = cj.position.x - ci.position.x,
							dy = cj.position.y - ci.position.y;

						// The distance between the two circles radii, but we're also gonna pad it a tiny bit
						var r = (ci.radius + cj.radius) * 1.08,
							d = ci.position.getDistanceSquared(cj.position);

						/**
						 * Collision detected!
						 */
						if (d < (r * r) - 0.02 )
						{
							v.x = dx;
							v.y = dy;
							v.normalize();

							var inverseForce = (r - Math.sqrt(d)) * 0.5;
							v.multiply(inverseForce);

							// Move cj opposite of the collision as long as its not fixed
							if(!cj.isFixed)
							{
								if(ci.isFixed) v.multiply(2.2);	// Double inverse force to make up for the fact that the other object is fixed

								// ADD the velocity
								(cj.view) ? cj.view.position.add(v) : cj.position.add(v);
							}

							// Move ci opposite of the collision as long as its not fixed
							if(!ci.isFixed)
							{
								if(cj.isFixed) v.multiply(2.2);	// Double inverse force to make up for the fact that the other object is fixed

								 // SUBTRACT the velocity
								(ci.view) ? ci.view.position.sub(v) : ci.position.sub(v);
							}

							// Emit the collision event from each circle, with itself as the first parameter
//							if(this.dispatchCollisionEvents && n == this.numberOfCollisionPasses-1)
//							{
//								this.eventEmitter.emit('collision', cj, ci, v);
//							}
						}
					}
				}
			}
		},

		handleBoundaryForCircle: function(aCircle, boundsRule)
		{
//			if(aCircle.boundsRule === true) return; // Ignore if being dragged

			var xpos = aCircle.position.x;
			var ypos = aCircle.position.y;

			var radius = aCircle.radius;
			var diameter = radius*2;

			// Toggle these on and off,
			// Wrap and bounce, are opposite behaviors so pick one or the other for each axis, or bad things will happen.
			var wrapXMask = 1 << 0;
			var wrapYMask = 1 << 2;
			var constrainXMask = 1 << 3;
			var constrainYMask = 1 << 4;
			var emitEvent = 1 << 5;

			// TODO: Promote to member variable
			// Convert to bitmask - Uncomment the one you want, or concact your own :)
	//		boundsRule = wrapY; // Wrap only Y axis
	//		boundsRule = wrapX; // Wrap only X axis
	//		boundsRule = wrapXMask | wrapYMask; // Wrap both X and Y axis
			boundsRule = wrapYMask | constrainXMask;  // Wrap Y axis, but constrain horizontally

//			Wrap X
			if(boundsRule & wrapXMask && xpos-diameter > this.bounds.right) {
				aCircle.position.x = this.bounds.left + radius;
			} else if(boundsRule & wrapXMask && xpos+diameter < this.bounds.left) {
				aCircle.position.x = this.bounds.right - radius;
			}
//			Wrap Y
			if(boundsRule & wrapYMask && ypos-diameter > this.bounds.bottom) {
				aCircle.position.y = this.bounds.top - radius;
			} else if(boundsRule & wrapYMask && ypos+diameter < this.bounds.top) {
				aCircle.position.y = this.bounds.bottom + radius;
			}

//			Constrain X
			if(boundsRule & constrainXMask && xpos+radius >= this.bounds.right) {
				aCircle.position.x = aCircle.position.x = this.bounds.right-radius;
			} else if(boundsRule & constrainXMask && xpos-radius < this.bounds.left) {
				aCircle.position.x = this.bounds.left + radius;
			}

//			  Constrain Y
			if(boundsRule & constrainYMask && ypos+radius > this.bounds.bottom) {
				aCircle.position.y = this.bounds.bottom - radius;
			} else if(boundsRule & constrainYMask && ypos-radius < this.bounds.top) {
				aCircle.position.y = this.bounds.top + radius;
			}
		},

		/**
		 * Given an x,y position finds circle underneath and sets it to the currently grabbed circle
		 * @param xpos
		 * @param ypos
		 * @param buffer	A radiusSquared around the point in question where something is considered to match
		 */
		getCircleAt: function(xpos, ypos, buffer)
		{
			var circleList = this.allCircles;
			var len = circleList.length;
			var grabVector = new CAAT.Point(xpos, ypos);

			// These are set every time a better match i found
			var closestCircle = null;
			var closestDistance = Number.MAX_VALUE;

			// Loop thru and find the closest match
			for(var i = 0; i < len; i++)
			{
				var aCircle = circleList[i];
				if(!aCircle) continue;
				var distanceSquared = aCircle.position.getDistanceSquared(grabVector);

				if(distanceSquared < closestDistance && distanceSquared < aCircle.radiusSquared + buffer)
				{
					closestDistance = distanceSquared;
					closestCircle = aCircle;
				}
			}

			return closestCircle;
		},

		sortOnDistanceToCenter: function(circleA, circleB)
		{
			var valueA = circleA.getDistanceSquaredFromPosition(circleA.targetPosition);
			var valueB = circleB.getDistanceSquaredFromPosition(circleA.targetPosition);
			var comparisonResult = 0;

			if(valueA > valueB) comparisonResult = -1;
			else if(valueA < valueB) comparisonResult = 1;

			return comparisonResult;
		},

		circlesCanCollide: function(circleA, circleB)
		{
			if(!circleA || !circleB || circleA === circleB) return false; 					// one is null (will be deleted next loop), or both point to same obj.
			if(circleA.view == null || circleB.view == null) return false;					// This circle will be removed next loop, it's entity is already removed

			if(circleA.isFixed & circleB.isFixed) return false;
//			if(circleA.view.clientID === circleB.view.clientID) return false; 				// Don't let something collide with stuff it owns

			// They dont want to collide
			if((circleA.collisionGroup & circleB.collisionMask) == 0) return false;
			if((circleB.collisionGroup & circleA.collisionMask) == 0) return false;

			return true;
		},


		setBounds: function(aRect)
		{
			this.bounds = aRect;
		},

		distanceSquaredFromTargetPosition: function()
		{
			var distanceSquared = this.position.getDistanceSquared(this.targetPosition);
			// if it's shorter than either radius, we intersect
			return distanceSquared < this.radiusSquared;
		},

		intersects: function(aCircle)
		{
			var distanceSquared = this.position.getDistanceSquared(aCircle.position);
			return (distanceSquared < this.radiusSquared || distanceSquared < aCircle.radiusSquared);
		},

/**
 * ACCESSORS
 */
		setPosition: function(aPosition)
		{
			this.position = aPosition;
		},

		setDelegate: function(aDelegate)
		{
			this.delegate = aDelegate;
		},

		setOffset: function(aPosition)
		{
		  this.offset = aPosition;
		},

		setTargetPosition: function(aTargetPosition)
		{
			this.targetPosition = aTargetPosition;
		},

		setIsFixed: function(value)
		{
			this.isFixed = value;
		},

		setCollisionMask: function(aCollisionMask)
		{
			this.collisionMask = aCollisionMask;
		},

		setCollisionGroup: function(aCollisionGroup)
		{
			this.collisionGroup = aCollisionGroup;
		},

		setRadius: function(aRadius)
		{
			this.radius = aRadius;
			this.radiusSquared = this.radius*this.radius;
		},

		initialize : function(overrides)
		{
			if (overrides)
			{
				for (var i in overrides)
				{
					this[i] = overrides[i];
				}
			}

			return this;
		}
	};
})();