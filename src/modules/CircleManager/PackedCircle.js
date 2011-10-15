/**
 * See LICENSE file.
 *
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

(function() {

    /**
     * @constructor
     */
	CAAT.modules.CircleManager.PackedCircle= function()
	{
		this.boundsRule = CAAT.modules.CircleManager.PackedCircle.BOUNDS_RULE_IGNORE;
		this.position = new CAAT.Point(0,0,0);
		this.offset = new CAAT.Point(0,0,0);
		this.targetPosition = new CAAT.Point(0,0,0);
		return this;
	};

	CAAT.modules.CircleManager.PackedCircle.prototype = {
		id:             0,
		delegate:		null,
		position:		new CAAT.Point(0,0,0),
		offset:			new CAAT.Point(0,0,0),	// Offset from delegates position by this much

		targetPosition:	null,	// Where it wants to go
		targetChaseSpeed: 0.02,

		isFixed:		false,
		boundsRule:		0,
		collisionMask:	0,
		collisionGroup:	0,

		BOUNDS_RULE_WRAP:		1,      // Wrap to otherside
		BOUNDS_RULE_CONSTRAINT:	2,      // Constrain within bounds
		BOUNDS_RULE_DESTROY:	4,      // Destroy when it reaches the edge
		BOUNDS_RULE_IGNORE:		8,		// Ignore when reaching bounds

		containsPoint: function(aPoint)
		{
			var distanceSquared = this.position.getDistanceSquared(aPoint);
			return distanceSquared < this.radiusSquared;
		},

		getDistanceSquaredFromPosition: function(aPosition)
		{
			var distanceSquared = this.position.getDistanceSquared(aPosition);
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
			return this;
		},

		setDelegate: function(aDelegate)
		{
			this.delegate = aDelegate;
			return this;
		},

		setOffset: function(aPosition)
		{
			this.offset = aPosition;
			return this;
		},

		setTargetPosition: function(aTargetPosition)
		{
			this.targetPosition = aTargetPosition;
			return this;
		},

		setTargetChaseSpeed: function(aTargetChaseSpeed)
		{
			this.targetChaseSpeed = aTargetChaseSpeed;
			return this;
		},

		setIsFixed: function(value)
		{
			this.isFixed = value;
			return this;
		},

		setCollisionMask: function(aCollisionMask)
		{
			this.collisionMask = aCollisionMask;
			return this;
		},

		setCollisionGroup: function(aCollisionGroup)
		{
			this.collisionGroup = aCollisionGroup;
			return this;
		},

		setRadius: function(aRadius)
		{
			this.radius = aRadius;
			this.radiusSquared = this.radius*this.radius;
			return this;
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
		},

		dealloc: function()
		{
			this.position = null;
			this.offset = null;
			this.delegate = null;
			this.targetPosition = null;
		}
	};
})();