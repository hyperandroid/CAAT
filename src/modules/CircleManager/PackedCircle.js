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

		return this;
	};

	CAAT.modules.CircleManager.PackedCircle.prototype = {
		delegate:		null,
		position:		null,
		offset:			null,	// Offset from delegates position by this much

		targetPosition:	null,	// Where it wants to go

		isFixed:		false,
		collisionMask:	0,
		collisionGroup:	0,

		containsPoint: function(aPoint)
		{
			var distanceSquared = this.position.getDistanceSquared(aPoint);
			return distanceSquared < this.radiusSquared;
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