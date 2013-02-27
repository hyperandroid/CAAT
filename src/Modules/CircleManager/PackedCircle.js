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
 Project    :
 None
 Abstract:
 A single packed circle.
 Contains a reference to it's div, and information pertaining to it state.
 Basic Usage:
 http://onedayitwillmake.com/CirclePackJS/
 */

CAAT.Module({

    /**
     * @name CircleManager
     * @memberOf CAAT.Module
     * @namespace
     */

    /**
     * @name PackedCircle
     * @memberOf CAAT.Module.CircleManager
     * @constructor
     */

    defines:"CAAT.Module.CircleManager.PackedCircle",
    depends:[
        "CAAT.Module.CircleManager.PackedCircle",
        "CAAT.Math.Point"
    ],
    constants:{

        /**
         * @lends CAAT.Module.CircleManager.PackedCircle
         */

        /** @const */ BOUNDS_RULE_WRAP:1, // Wrap to otherside
        /** @const */ BOUNDS_RULE_CONSTRAINT:2, // Constrain within bounds
        /** @const */ BOUNDS_RULE_DESTROY:4, // Destroy when it reaches the edge
        /** @const */ BOUNDS_RULE_IGNORE:8        // Ignore when reaching bounds
    },
    extendsWith:{

        /**
         * @lends CAAT.Module.CircleManager.PackedCircle.prototype
         */

        __init:function () {
            this.boundsRule = CAAT.Module.CircleManager.PackedCircle.BOUNDS_RULE_IGNORE;
            this.position = new CAAT.Math.Point(0, 0, 0);
            this.offset = new CAAT.Math.Point(0, 0, 0);
            this.targetPosition = new CAAT.Math.Point(0, 0, 0);
            return this;
        },

        /**
         *
         */
        id:0,

        /**
         *
         */
        delegate:null,

        /**
         *
         */
        position:null,

        /**
         *
         */
        offset:null,

        /**
         *
         */
        targetPosition:null, // Where it wants to go

        /**
         *
         */
        targetChaseSpeed:0.02,

        /**
         *
         */
        isFixed:false,

        /**
         *
         */
        boundsRule:0,

        /**
         *
         */
        collisionMask:0,

        /**
         *
         */
        collisionGroup:0,

        containsPoint:function (aPoint) {
            var distanceSquared = this.position.getDistanceSquared(aPoint);
            return distanceSquared < this.radiusSquared;
        },

        getDistanceSquaredFromPosition:function (aPosition) {
            var distanceSquared = this.position.getDistanceSquared(aPosition);
            // if it's shorter than either radius, we intersect
            return distanceSquared < this.radiusSquared;
        },

        intersects:function (aCircle) {
            var distanceSquared = this.position.getDistanceSquared(aCircle.position);
            return (distanceSquared < this.radiusSquared || distanceSquared < aCircle.radiusSquared);
        },

        /**
         * ACCESSORS
         */
        setPosition:function (aPosition) {
            this.position = aPosition;
            return this;
        },

        setDelegate:function (aDelegate) {
            this.delegate = aDelegate;
            return this;
        },

        setOffset:function (aPosition) {
            this.offset = aPosition;
            return this;
        },

        setTargetPosition:function (aTargetPosition) {
            this.targetPosition = aTargetPosition;
            return this;
        },

        setTargetChaseSpeed:function (aTargetChaseSpeed) {
            this.targetChaseSpeed = aTargetChaseSpeed;
            return this;
        },

        setIsFixed:function (value) {
            this.isFixed = value;
            return this;
        },

        setCollisionMask:function (aCollisionMask) {
            this.collisionMask = aCollisionMask;
            return this;
        },

        setCollisionGroup:function (aCollisionGroup) {
            this.collisionGroup = aCollisionGroup;
            return this;
        },

        setRadius:function (aRadius) {
            this.radius = aRadius;
            this.radiusSquared = this.radius * this.radius;
            return this;
        },

        initialize:function (overrides) {
            if (overrides) {
                for (var i in overrides) {
                    this[i] = overrides[i];
                }
            }

            return this;
        },

        dealloc:function () {
            this.position = null;
            this.offset = null;
            this.delegate = null;
            this.targetPosition = null;
        }
    }
});
