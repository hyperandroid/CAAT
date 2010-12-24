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

	CAAT.modules.CircleManager.PackedCircle= function()
	{
		this.delegate = null;
		this.position = null;
		this.offset = null;

		this.targetPosition = null;

		this.radius = 0;
		this.radiusSquared = 0;

		// Collision properties
		this.isFixed = 0;
		this.collisionMask = 0;
		this.collisionGroup = 0;

		this.boundsRule = CAAT.modules.CircleManager.PackedCircle.BOUNDS_RULE_IGNORE;
		return this;
	};

	CAAT.modules.CircleManager.PackedCircle.prototype = {
		delegate:		null,
		position:		null,
		offset:			null,	// Offset from delegates position by this much

		targetPosition:	null,	// Where it wants to go

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