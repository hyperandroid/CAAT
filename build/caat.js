/*
The MIT License

Copyright (c) 2010-2011 Ibon Tolosana [@hyperandroid]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

Version: 0.1 build: 54

Created on:
DATE: 2011-10-27
TIME: 23:45:03
*/


/**
 * See LICENSE file.
 *
 * Library namespace.
 * CAAT stands for: Canvas Advanced Animation Tookit.
 */

/**
 * @namespace
 */
var CAAT= CAAT || {};

/**
 * Common bind function. Allows to set an object's function as callback. Set for every function in the
 * javascript context.
 */
Function.prototype.bind= function() {
    var fn=     this;                                   // the function
    var args=   Array.prototype.slice.call(arguments);  // copy the arguments.
    var obj=    args.shift();                           // first parameter will be context 'this'
    return function() {
        return fn.apply(
                obj,
                args.concat(Array.prototype.slice.call(arguments)));
    }
};
/**
 * See LICENSE file.
 *
 * Behaviors are keyframing elements.
 * By using a BehaviorContainer, you can specify different actions on any animation Actor.
 * An undefined number of Behaviors can be defined for each Actor.
 *
 * There're the following Behaviors:
 *  + AlphaBehavior:   controls container/actor global alpha.
 *  + RotateBehavior:  takes control of rotation affine transform.
 *  + ScaleBehavior:   takes control of scaling on x/y axis affine transform.
 *  + PathBehavior:    takes control of translating an Actor/ActorContainer across a path [ie. pathSegment collection].
 *  + GenericBehavior: applies a behavior to any given target object's property, or notifies a callback.
 *
 *
 **/

(function() {
    /**
     * Behavior base class.
     *
     * <p>
     * A behavior is defined by a frame time (behavior duration) and a behavior application function called interpolator.
     * In its default form, a behaviour is applied linearly, that is, the same amount of behavior is applied every same
     * time interval.
     * <p>
     * A concrete Behavior, a rotateBehavior in example, will change a concrete Actor's rotationAngle during the specified
     * period.
     * <p>
     * A behavior is guaranteed to notify (if any observer is registered) on behavior expiration.
     * <p>
     * A behavior can keep an unlimited observers. Observers are objects of the form:
     * <p>
     * <code>
     * {
     *      behaviorExpired : function( behavior, time, actor);
     *      behaviorApplied : function( behavior, time, normalizedTime, actor, value);
     * }
     * </code>
     * <p>
     * <strong>behaviorExpired</strong>: function( behavior, time, actor). This method will be called for any registered observer when
     * the scene time is greater than behavior's startTime+duration. This method will be called regardless of the time
     * granurality.
     * <p>
     * <strong>behaviorApplied</strong> : function( behavior, time, normalizedTime, actor, value). This method will be called once per
     * frame while the behavior is not expired and is in frame time (behavior startTime>=scene time). This method can be
     * called multiple times.
     * <p>
     * Every behavior is applied to a concrete Actor.
     * Every actor must at least define an start and end value. The behavior will set start-value at behaviorStartTime and
     * is guaranteed to apply end-value when scene time= behaviorStartTime+behaviorDuration.
     * <p>
     * You can set behaviors to apply forever that is cyclically. When a behavior is cycle=true, won't notify
     * behaviorExpired to its registered observers.
     * <p>
     * Other Behaviors simply must supply with the method <code>setForTime(time, actor)</code> overriden.
     *
     * @constructor
     */
    CAAT.Behavior= function() {
		this.lifecycleListenerList=[];
		this.setDefaultInterpolator();
		return this;
	};
	
	CAAT.Behavior.prototype= {
			
		lifecycleListenerList:		null,   // observer list.
		behaviorStartTime:	-1,             // scene time to start applying the behavior
		behaviorDuration:	-1,             // behavior duration in ms.
		cycleBehavior:		false,          // apply forever ?
		expired:			true,           // indicates whether the behavior is expired.
		interpolator:		null,           // behavior application function. linear by default.
        actor:              null,           // actor the Behavior acts on.
        id:                 0,              // an integer id suitable to identify this behavior by number.

        /**
         * Sets this behavior id.
         * @param id an integer.
         *
         */
        setId : function( id ) {
            this.id= id;
            return this;
        },
        /**
         * Sets the default interpolator to a linear ramp, that is, behavior will be applied linearly.
         * @return this
         */
		setDefaultInterpolator : function() {
			this.interpolator= new CAAT.Interpolator().createLinearInterpolator(false);
            return this;
		},
        /**
         * Sets default interpolator to be linear from 0..1 and from 1..0.
         * @return this
         */
		setPingPong : function() {
			this.interpolator= new CAAT.Interpolator().createLinearInterpolator(true);
            return this;
		},
        /**
         * Sets behavior start time and duration.
         * Scene time will be the time of the scene the behavior actor is bound to.
         * @param startTime {number} an integer indicating behavior start time in scene time in ms..
         * @param duration {number} an integer indicating behavior duration in ms.
         */
		setFrameTime : function( startTime, duration ) {
			this.behaviorStartTime= startTime;
			this.behaviorDuration=  duration;
            this.expired=           false;

            return this;
		},
        setOutOfFrameTime : function() {
            this.expired= true;
            this.behaviorStartTime= Number.MAX_VALUE;
            this.behaviorDuration= 0;
            return this;
        },
        /**
         * Changes behavior default interpolator to another instance of CAAT.Interpolator.
         * If the behavior is not defined by CAAT.Interpolator factory methods, the interpolation function must return
         * its values in the range 0..1. The behavior will only apply for such value range.
         * @param interpolator a CAAT.Interpolator instance.
         */
		setInterpolator : function(interpolator) {
			this.interpolator= interpolator;
            return this;
		},
        /**
         * This method must no be called directly.
         * The director loop will call this method in orther to apply actor behaviors.
         * @param time the scene time the behaviro is being applied at.
         * @param actor a CAAT.Actor instance the behavior is being applied to.
         */
		apply : function( time, actor )	{
            var orgTime= time;
			if ( this.isBehaviorInTime(time,actor) )	{
				time= this.normalizeTime(time);
				this.fireBehaviorAppliedEvent(
                        actor,
                        orgTime,
                        time,
                        this.setForTime( time, actor ) );
			}
		},
        /**
         * Sets the behavior to cycle, ie apply forever.
         * @param bool a boolean indicating whether the behavior is cycle.
         */
		setCycle : function(bool) {
			this.cycleBehavior= bool;
            return this;
		},
        /**
         * Adds an observer to this behavior.
         * @param behaviorListener an observer instance.
         */
		addListener : function( behaviorListener ) {
			this.lifecycleListenerList.push(behaviorListener);
            return this;
		},
        /**
         * Remove all registered listeners to the behavior.
         */
        emptyListenerList : function() {
            this.lifecycleListenerList= [];
            return this;
        },
        /**
         * @return an integer indicating the behavior start time in ms..
         */
		getStartTime : function() {
			return this.behaviorStartTime;
		},
        /**
         * @return an integer indicating the behavior duration time in ms.
         */
		getDuration : function() {
			return this.behaviorDuration;
			
		},
        /**
         * Chekcs whether the behaviour is in scene time.
         * In case it gets out of scene time, and has not been tagged as expired, the behavior is expired and observers
         * are notified about that fact.
         * @param time the scene time to check the behavior against.
         * @param actor the actor the behavior is being applied to.
         * @return a boolean indicating whether the behavior is in scene time.
         */
		isBehaviorInTime : function(time,actor) {
			if ( this.expired || this.behaviorStartTime<0 )	{
				return false;
			}
			
			if ( this.cycleBehavior )	{
				if ( time>=this.behaviorStartTime )	{
					time= (time-this.behaviorStartTime)%this.behaviorDuration + this.behaviorStartTime;
				}
			}
			
			if ( time>this.behaviorStartTime+this.behaviorDuration )	{
				if ( !this.expired )	{
					this.setExpired(actor,time);
				}
				
				return false;
			}
			
			return this.behaviorStartTime<=time && time<this.behaviorStartTime+this.behaviorDuration;
		},
        /**
         * Notify observers about expiration event.
         * @param actor a CAAT.Actor instance
         * @param time an integer with the scene time the behavior was expired at.
         */
		fireBehaviorExpiredEvent : function(actor,time)	{
			for( var i=0; i<this.lifecycleListenerList.length; i++ )	{
				this.lifecycleListenerList[i].behaviorExpired(this,time,actor);
			}
		},
        /**
         * Notify observers about behavior being applied.
         * @param actor a CAAT.Actor instance the behavior is being applied to.
         * @param time the scene time of behavior application.
         * @param normalizedTime the normalized time (0..1) considering 0 behavior start time and 1
         * behaviorStartTime+behaviorDuration.
         * @param value the value being set for actor properties. each behavior will supply with its own value version.
         */
        fireBehaviorAppliedEvent : function(actor,time,normalizedTime,value)	{
            for( var i=0; i<this.lifecycleListenerList.length; i++ )	{
                if (this.lifecycleListenerList[i].behaviorApplied) {
                    this.lifecycleListenerList[i].behaviorApplied(this,time,normalizedTime,actor,value);
                }
            }
        },
        /**
         * Convert scene time into something more manageable for the behavior.
         * behaviorStartTime will be 0 and behaviorStartTime+behaviorDuration will be 1.
         * the time parameter will be proportional to those values.
         * @param time the scene time to be normalized. an integer.
         */
		normalizeTime : function(time)	{
			time= time-this.behaviorStartTime;
			if ( this.cycleBehavior )	{
				time%=this.behaviorDuration;
			}
			return this.interpolator.getPosition(time/this.behaviorDuration).y;
		},
        /**
         * Sets the behavior as expired.
         * This method must not be called directly. It is an auxiliary method to isBehaviorInTime method.
         * @param actor {CAAT.Actor}
         * @param time {integer} the scene time.
         *
         * @private
         */
		setExpired : function(actor,time) {
            // set for final interpolator value.
            this.expired= true;
			this.setForTime(this.interpolator.getPosition(1).y,actor);
			this.fireBehaviorExpiredEvent(actor,time);
		},
        /**
         * This method must be overriden for every Behavior breed.
         * Must not be called directly.
         * @param actor {CAAT.Actor} a CAAT.Actor instance.
         * @param time {number} an integer with the scene time.
         *
         * @private
         */
		setForTime : function( time, actor ) {
			
		},
        /**
         * @param overrides
         */
        initialize : function(overrides) {
            if (overrides) {
               for (var i in overrides) {
                  this[i] = overrides[i];
               }
            }

            return this;
        }
	};
})();

(function() {
    /**
     * <p>
     * A ContainerBehavior is a holder to sum up different behaviors.
     * <p>
     * It imposes some constraints to contained Behaviors:
     * <ul>
     * <li>The time of every contained behavior will be zero based, so the frame time set for each behavior will
     * be referred to the container's behaviorStartTime and not scene time as usual.
     * <li>Cycling a ContainerBehavior means cycling every contained behavior.
     * <li>The container will not impose any Interpolator, so calling the method <code>setInterpolator(CAAT.Interpolator)
     * </code> will be useless.
     * <li>The Behavior application time will be bounded to the Container's frame time. I.E. if we set a container duration
     * to 10 seconds, setting a contained behavior's duration to 15 seconds will be useless since the container will stop
     * applying the behavior after 10 seconds have elapsed.
     * <li>Every ContainerBehavior adds itself as an observer for its contained Behaviors. The main reason is because
     * ContainerBehaviors modify cycling properties of its contained Behaviors. When a contained
     * Behavior is expired, if the Container has isCycle=true, will unexpire the contained Behavior, otherwise, it won't be
     * applied in the next frame. It is left up to the developer to manage correctly the logic of other posible contained
     * behaviors observers.
     * </ul>
     *
     * <p>
     * A ContainerBehavior can contain other ContainerBehaviors at will.
     * <p>
     * A ContainerBehavior will not apply any CAAT.Actor property change by itself, but will instrument its contained
     * Behaviors to do so.
     *
     * @constructor
     * @extends CAAT.Behavior
     */
    CAAT.ContainerBehavior= function() {
		CAAT.ContainerBehavior.superclass.constructor.call(this);
		this.behaviors= [];
		return this;
	};

    CAAT.ContainerBehavior.prototype= {

		behaviors:	null,   // contained behaviors array
        /**
         * Adds a new behavior to the container.
         * @param behavior
         *
         * @override
         */
		addBehavior : function(behavior)	{
			this.behaviors.push(behavior);
			behavior.addListener(this);
            return this;
		},
        /**
         * Applies every contained Behaviors.
         * The application time the contained behaviors will receive will be ContainerBehavior related and not the
         * received time.
         * @param time an integer indicating the time to apply the contained behaviors at.
         * @param actor a CAAT.Actor instance indicating the actor to apply the behaviors for.
         */
		apply : function(time, actor) {
			if ( this.isBehaviorInTime(time,actor) )	{
				time-= this.getStartTime();
				if ( this.cycleBehavior ){
					time%= this.getDuration();
				}

                var bh= this.behaviors;
				for( var i=0; i<bh.length; i++ )	{
					bh[i].apply(time, actor);
				}
			}
		},
        /**
         * This method does nothing for containers, and hence has an empty implementation.
         * @param interpolator a CAAt.Interpolator instance.
         */
		setInterpolator : function(interpolator) {
            return this;
		},
        /**
         * This method is the observer implementation for every contained behavior.
         * If a container is Cycle=true, won't allow its contained behaviors to be expired.
         * @param behavior a CAAT.Behavior instance which has been expired.
         * @param time an integer indicating the time at which has become expired.
         * @param actor a CAAT.Actor the expired behavior is being applied to.
         */
		behaviorExpired : function(behavior,time,actor) {
			if ( this.cycleBehavior )	{
				behavior.expired =  false;
			}
		},
        /**
         * Implementation method of the behavior.
         * Just call implementation method for its contained behaviors.
         * @param time an intenger indicating the time the behavior is being applied at.
         * @param actor a CAAT.Actor the behavior is being applied to.
         */
		setForTime : function(time, actor) {
            var bh= this.behaviors;
			for( var i=0; i<bh.length; i++ ) {
				bh[i].setForTime( time, actor );
			}

            return null;
		},

        setExpired : function(actor,time) {
            CAAT.ContainerBehavior.superclass.setExpired.call(this,actor,time);

            var bh= this.behaviors;
            // set for final interpolator value.
            for( var i=0; i<bh.length; i++ ) {
                var bb= bh[i];
                if (!bb.expired) {
                    bb.setExpired(actor,time-this.behaviorStartTime);
                }
            }
            this.fireBehaviorExpiredEvent(actor,time);
            return this;
        },

        setFrameTime : function( start, duration )  {
            CAAT.ContainerBehavior.superclass.setFrameTime.call(this,start,duration);

            var bh= this.behaviors;
            for( var i=0; i<bh.length; i++ ) {
                bh[i].expired= false;
            }
            return this;
        }

	};

    extend( CAAT.ContainerBehavior, CAAT.Behavior, null );
})();

(function() {
    /**
     * This class applies a rotation to a CAAt.Actor instance.
     * StartAngle, EndAngle must be supplied. Angles are in radians.
     * The RotationAnchor, if not supplied, will be ANCHOR_CENTER.
     *
     * An example os use will be
     *
     * var rb= new CAAT.RotateBehavior().
     *      setValues(0,2*Math.PI).
     *      setFrameTime(0,2500);
     *
     * @see CAAT.Actor.
     *
     * @constructor
     * @extends CAAT.Behavior
     *
     */
    CAAT.RotateBehavior= function() {
		CAAT.RotateBehavior.superclass.constructor.call(this);
		this.anchor= CAAT.Actor.prototype.ANCHOR_CENTER;
		return this;
	};
	
	CAAT.RotateBehavior.prototype= {
	
		startAngle:	0,  // behavior start angle
		endAngle:	0,  // behavior end angle
        anchorX:    .50,  // rotation center x.
        anchorY:    .50,  // rotation center y.

        /**
         * Behavior application function.
         * Do not call directly.
         * @param time an integer indicating the application time.
         * @param actor a CAAT.Actor the behavior will be applied to.
         * @return the set angle.
         */
		setForTime : function(time,actor) {
			var angle= 
				this.startAngle + time*(this.endAngle-this.startAngle);

            actor.setRotationAnchored(angle, this.anchorX, this.anchorY);

            return angle;
			
		},
        /**
         * Set behavior bound values.
         * if no anchorx,anchory values are supplied, the behavior will assume
         * 50% for both values, that is, the actor's center.
         *
         * Be aware the anchor values are supplied in <b>RELATIVE PERCENT</b> to
         * actor's size.
         *
         * @param startAngle {float} indicating the starting angle.
         * @param endAngle {float} indicating the ending angle.
         * @param anchorx {float} the percent position for anchorX
         * @param anchory {float} the percent position for anchorY
         */
        setValues : function( startAngle, endAngle, anchorx, anchory ) {
            this.startAngle= startAngle;
            this.endAngle= endAngle;
            if ( typeof anchorx!=='undefined' && typeof anchory!=='undefined' ) {
                this.anchorX= anchorx;
                this.anchorY= anchory;
            }
            return this;
        },
        /**
         * @deprecated
         * Use setValues instead
         * @param start
         * @param end
         */
        setAngles : function( start, end ) {
            return this.setValues(start,end);
        },
        /**
         * Set the behavior rotation anchor. Use this method when setting an exact percent
         * by calling setValues is complicated.
         * @see CAAT.Actor
         * @param anchor any of CAAT.Actor.prototype.ANCHOR_* constants.
         *
         * These parameters are to set a custom rotation anchor point. if <code>anchor==CAAT.Actor.prototype.ANCHOR_CUSTOM
         * </code> the custom rotation point is set.
         * @param rx
         * @param ry
         *
         */
        setAnchor : function( actor, rx, ry ) {
            this.anchorX= rx/actor.width;
            this.anchorY= ry/actor.height;
            return this;
        }
		
	};

    extend( CAAT.RotateBehavior, CAAT.Behavior, null);
    
})();

(function() {
    /**
     * <p>
     * A generic behavior is supposed to be extended to create new behaviors when the out-of-the-box
     * ones are not sufficient. It applies the behavior result to a given target object in two ways:
     *
     * <ol>
     * <li>defining the property parameter: the toolkit will perform target_object[property]= calculated_value_for_time.
     * <li>defining a callback function. Sometimes setting of a property is not enough. In example,
     * for a give property in a DOM element, it is needed to set object.style['left']= '70px';
     * With the property approach, you won't be able to add de 'px' suffix to the value, and hence won't
     * work correctly. The function callback will allow to take control by receiving as parameters the
     * target object, and the calculated value to apply by the behavior for the given time.
     * </ol>
     *
     * <p>
     * For example, this code will move a dom element from 0 to 400 px on x during 1 second:
     * <code>
     * <p>
     * var enterBehavior= new CAAT.GenericBehavior(). <br>
     * &nbsp;&nbsp;setFrameTime( scene.time, 1000 ). <br>
     * &nbsp;&nbsp;setValues( <br>
     * &nbsp;&nbsp;&nbsp;&nbsp;0, <br>
     * &nbsp;&nbsp;&nbsp;&nbsp;400, <br>
     * &nbsp;&nbsp;&nbsp;&nbsp;domElement, <br>
     * &nbsp;&nbsp;&nbsp;&nbsp;null, <br>
     * &nbsp;&nbsp;&nbsp;&nbsp;function( currentValue, target ) { <br>
     * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;target.style['left']= currentValue+'px'; <br>
     * &nbsp;&nbsp;&nbsp;&nbsp;} <br>
     * &nbsp;&nbsp;); <br>
     * </code>
     *
     * @constructor
     * @extends CAAT.Behavior
     *
     */
    CAAT.GenericBehavior= function() {
        CAAT.GenericBehavior.superclass.constructor.call(this);
        return this;
    };

    CAAT.GenericBehavior.prototype= {

        start:      0,
        end:        0,
        target:     null,
        property:   null,
        callback:   null,

        /**
         * Sets the target objects property to the corresponding value for the given time.
         * If a callback function is defined, it is called as well.
         *
         * @param time {number} the scene time to apply the behavior at.
         * @param actor {CAAT.Actor} a CAAT.Actor object instance.
         */
        setForTime : function(time, actor) {
            var value= this.start+ time*(this.end-this.start);
            if ( this.callback ) {
                this.callback( value, this.target, actor );
            }

            if ( this.property ) {
                this.target[this.property]= value;
            }
        },
        /**
         * Defines the values to apply this behavior.
         *
         * @param start {number} initial behavior value.
         * @param end {number} final behavior value.
         * @param target {object} an object. Usually a CAAT.Actor.
         * @param property {string} target object's property to set value to.
         * @param callback {function} a function of the form <code>function( target, value )</code>.
         */
        setValues : function( start, end, target, property, callback ) {
            this.start= start;
            this.end= end;
            this.target= target;
            this.property= property;
            this.callback= callback;
            return this;
        }
    };

    extend( CAAT.GenericBehavior, CAAT.Behavior, null);
})();

(function() {

    /**
     * ScaleBehavior applies scale affine transforms in both axis.
     * StartScale and EndScale must be supplied for each axis. This method takes care of a FF bug in which if a Scale is
     * set to 0, the animation will fail playing.
     *
     * This behavior specifies anchors in values ranges 0..1
     *
     * @constructor
     * @extends CAAT.Behavior
     *
     */
	CAAT.ScaleBehavior= function() {
		CAAT.ScaleBehavior.superclass.constructor.call(this);
		this.anchor= CAAT.Actor.prototype.ANCHOR_CENTER;
		return this;		
	};
	
	CAAT.ScaleBehavior.prototype= {
        startScaleX:    1,
        endScaleX:      1,
        startScaleY:    1,
        endScaleY:	    1,
        anchorX:        .50,
        anchorY:        .50,

        /**
         * Applies corresponding scale values for a given time.
         * 
         * @param time the time to apply the scale for.
         * @param actor the target actor to Scale.
         * @return {object} an object of the form <code>{ scaleX: {float}, scaleY: {float}Ê}</code>
         */
		setForTime : function(time,actor) {

			var scaleX= this.startScaleX + time*(this.endScaleX-this.startScaleX);
			var scaleY= this.startScaleY + time*(this.endScaleY-this.startScaleY);

            // Firefox 3.x & 4, will crash animation if either scaleX or scaleY equals 0.
            if (0===scaleX ) {
                scaleX=0.01;
            }
            if (0===scaleY ) {
                scaleY=0.01;
            }

			actor.setScaleAnchored( scaleX, scaleY, this.anchorX, this.anchorY );

            return { scaleX: scaleX, scaleY: scaleY };
		},
        /**
         * Define this scale behaviors values.
         *
         * Be aware the anchor values are supplied in <b>RELATIVE PERCENT</b> to
         * actor's size.
         *
         * @param startX {number} initial X axis scale value.
         * @param endX {number} final X axis scale value.
         * @param startY {number} initial Y axis scale value.
         * @param endY {number} final Y axis scale value.
         * @param anchorx {float} the percent position for anchorX
         * @param anchory {float} the percent position for anchorY
         *
         * @return this.
         */
        setValues : function( startX, endX, startY, endY, anchorx, anchory ) {
            this.startScaleX= startX;
            this.endScaleX=   endX;
            this.startScaleY= startY;
            this.endScaleY=   endY;

            if ( typeof anchorx!=='undefined' && typeof anchory!=='undefined' ) {
                this.anchorX= anchorx;
                this.anchorY= anchory;
            }

            return this;
        },
        /**
         * Set an exact position scale anchor. Use this method when it is hard to
         * set a thorough anchor position expressed in percentage.
         * @param actor
         * @param x
         * @param y
         */
        setAnchor : function( actor, x, y ) {
            this.anchorX= x/actor.width;
            this.anchorY= y/actor.height;

            return this;
        }
	};

    extend( CAAT.ScaleBehavior, CAAT.Behavior, null);
})();


(function() {
    /**
     * AlphaBehavior modifies alpha composition property for an actor.
     *
     * @constructor
     * @extends CAAT.Behavior
     */
	CAAT.AlphaBehavior= function() {
		CAAT.AlphaBehavior.superclass.constructor.call(this);
		return this;
	};
	
	CAAT.AlphaBehavior.prototype= {
		startAlpha:	0,
		endAlpha:	0,

        /**
         * Applies corresponding alpha transparency value for a given time.
         *
         * @param time the time to apply the scale for.
         * @param actor the target actor to set transparency for.
         * @return {number} the alpha value set. Normalized from 0 (total transparency) to 1 (total opacity)
         */
		setForTime : function(time,actor) {
            var alpha= (this.startAlpha+time*(this.endAlpha-this.startAlpha));
            actor.setAlpha( alpha );
            return alpha;
        },
        /**
         * Set alpha transparency minimum and maximum value.
         * This value can be coerced by Actor's property isGloblAlpha.
         *
         * @param start {number} a float indicating the starting alpha value.
         * @param end {number} a float indicating the ending alpha value.
         */
        setValues : function( start, end ) {
            this.startAlpha= start;
            this.endAlpha= end;
            return this;
        }
	};

    extend( CAAT.AlphaBehavior, CAAT.Behavior, null);
})();

(function() {
    /**
     * CAAT.PathBehavior modifies the position of a CAAT.Actor along the path represented by an
     * instance of <code>CAAT.Path</code>.
     *
     * @constructor
     * @extends CAAT.Behavior
     *
     */
	CAAT.PathBehavior= function() {
		CAAT.PathBehavior.superclass.constructor.call(this);
		return this;
	};

    /**
     * @enum
     */
    CAAT.PathBehavior.autorotate = {
        LEFT_TO_RIGHT:  0,          // fix left_to_right direction
        RIGHT_TO_LEFT:  1,          // fix right_to_left
        FREE:           2           // do not apply correction
    };

	CAAT.PathBehavior.prototype= {
		path:           null,   // the path to traverse
        autoRotate :    false,  // set whether the actor must be rotated tangentially to the path.
        prevX:          -1,     // private, do not use.
        prevY:          -1,     // private, do not use.

        autoRotateOp:   CAAT.PathBehavior.autorotate.FREE,

        translateX:     0,
        translateY:     0,

        /**
         * Sets an actor rotation to be heading from past to current path's point.
         * Take into account that this will be incompatible with rotation Behaviors
         * since they will set their own rotation configuration.
         * @param autorotate {boolean}
         * @param autorotateOp {CAAT.PathBehavior.autorotate} whether the sprite is drawn heading to the right.
         * @return this.
         */
        setAutoRotate : function( autorotate, autorotateOp ) {
            this.autoRotate= autorotate;
            if (autorotateOp!==undefined) {
                this.autoRotateOp= autorotateOp;
            }
            return this;
        },
        /**
         * Set the behavior path.
         * The path can be any length, and will take behaviorDuration time to be traversed.
         * @param {CAAT.Path}
            *
         * @deprecated
         */
        setPath : function(path) {
            this.path= path;
            return this;
        },

        /**
         * Set the behavior path.
         * The path can be any length, and will take behaviorDuration time to be traversed.
         * @param {CAAT.Path}
         * @return this
         */
        setValues : function(path) {
            return this.setPath(path);
        },

        setFrameTime : function( startTime, duration ) {
            CAAT.PathBehavior.superclass.setFrameTime.call(this, startTime, duration );
            this.prevX= -1;
            this.prevY= -1;
            return this;
        },
        /**
         * This method set an extra offset for the actor traversing the path.
         * in example, if you want an actor to traverse the path by its center, and not by default via its top-left corner,
         * you should call <code>setTranslation(actor.width/2, actor.height/2);</code>.
         *
         * Displacement will be substracted from the tarrget coordinate.
         *
         * @param tx a float with xoffset.
         * @param ty a float with yoffset.
         */
        setTranslation : function( tx, ty ) {
            this.translateX= tx;
            this.translateY= ty;
            return this;
        },
        /**
         * Translates the Actor to the corresponding time path position.
         * If autoRotate=true, the actor is rotated as well. The rotation anchor will (if set) always be ANCHOR_CENTER.
         * @param time an integer indicating the time the behavior is being applied at.
         * @param actor a CAAT.Actor instance to be translated.
         * @return {object} an object of the form <code>{ x: {float}, y: {float}Ê}</code>.
         */
		setForTime : function(time,actor) {

            if ( !this.path ) {
                return {
                    x: actor.x,
                    y: actor.y
                };
            }

            var point= this.path.getPosition(time);

            if ( this.autoRotate ) {

                if ( -1===this.prevX && -1===this.prevY )	{
                    this.prevX= point.x;
                    this.prevY= point.y;
                }

                var ax= point.x-this.prevX;
                var ay= point.y-this.prevY;

                if ( ax===0 && ay===0 ) {
                    actor.setLocation( point.x-this.translateX, point.y-this.translateY );
                    return { x: actor.x, y: actor.y };
                }

                var angle= Math.atan2( ay, ax );
                var si= CAAT.SpriteImage.prototype;
                var pba= CAAT.PathBehavior.autorotate;

                // actor is heading left to right
                if ( this.autoRotateOp===pba.LEFT_TO_RIGHT ) {
                    if ( this.prevX<=point.x )	{
                        actor.setImageTransformation( si.TR_NONE );
                    }
                    else	{
                        actor.setImageTransformation( si.TR_FLIP_HORIZONTAL );
                        angle+=Math.PI;
                    }
                } else if ( this.autoRotateOp===pba.RIGHT_TO_LEFT ) {
                    if ( this.prevX<=point.x )	{
                        actor.setImageTransformation( si.TR_FLIP_HORIZONTAL );
                    }
                    else	{
                        actor.setImageTransformation( si.TR_NONE );
                        angle-=Math.PI;
                    }
                }

                actor.setRotation(angle);

                this.prevX= point.x;
                this.prevY= point.y;

                var modulo= Math.sqrt(ax*ax+ay*ay);
                ax/=modulo;
                ay/=modulo;
            }

            actor.setLocation( point.x-this.translateX, point.y-this.translateY );

            return { x: actor.x, y: actor.y };
		},
        /**
         * Get a point on the path.
         * If the time to get the point at is in behaviors frame time, a point on the path will be returned, otherwise
         * a default {x:-1, y:-1} point will be returned.
         *
         * @param time {number} the time at which the point will be taken from the path.
         * @return {object} an object of the form {x:float y:float}
         */
        positionOnTime : function(time) {
			if ( this.isBehaviorInTime(time,null) )	{
				time= this.normalizeTime(time);
                return this.path.getPosition( time );
            }

            return {x:-1, y:-1};

        }
	};

    extend( CAAT.PathBehavior, CAAT.Behavior, null);
})();
/**
 * 
 * taken from: http://www.quirksmode.org/js/detect.html
 *
 * 20101008 Hyperandroid. IE9 seems to identify himself as Explorer and stopped calling himself MSIE.
 *          Added Explorer description to browser list. Thanks @alteredq for this tip.
 *
 */
(function() {

	CAAT.BrowserDetect = function() {
		this.init();
        return this;
	};

	CAAT.BrowserDetect.prototype = {
		browser: '',
		version: 0,
		OS: '',
		init: function()
		{
			this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
			this.version = this.searchVersion(navigator.userAgent) ||
                    this.searchVersion(navigator.appVersion) ||
                    "an unknown version";
			this.OS = this.searchString(this.dataOS) || "an unknown OS";
		},

		searchString: function (data) {
			for (var i=0;i<data.length;i++)	{
				var dataString = data[i].string;
				var dataProp = data[i].prop;
				this.versionSearchString = data[i].versionSearch || data[i].identity;
				if (dataString) {
					if (dataString.indexOf(data[i].subString) !== -1)
						return data[i].identity;
				}
				else if (dataProp)
					return data[i].identity;
			}
		},
		searchVersion: function (dataString) {
			var index = dataString.indexOf(this.versionSearchString);
			if (index === -1) return;
			return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
		},
		dataBrowser: [
			{
				string: navigator.userAgent,
				subString: "Chrome",
				identity: "Chrome"
			},
			{   string: navigator.userAgent,
			    subString: "OmniWeb",
				versionSearch: "OmniWeb/",
				identity: "OmniWeb"
			},
			{
				string: navigator.vendor,
				subString: "Apple",
				identity: "Safari",
				versionSearch: "Version"
			},
			{
				prop: window.opera,
				identity: "Opera"
			},
			{
				string: navigator.vendor,
				subString: "iCab",
				identity: "iCab"
			},
			{
				string: navigator.vendor,
				subString: "KDE",
				identity: "Konqueror"
			},
			{
				string: navigator.userAgent,
				subString: "Firefox",
				identity: "Firefox"
			},
			{
				string: navigator.vendor,
				subString: "Camino",
				identity: "Camino"
			},
			{		// for newer Netscapes (6+)
				string: navigator.userAgent,
				subString: "Netscape",
				identity: "Netscape"
			},
			{
				string: navigator.userAgent,
				subString: "MSIE",
				identity: "Explorer",
				versionSearch: "MSIE"
			},
			{
				string: navigator.userAgent,
				subString: "Explorer",
				identity: "Explorer",
				versionSearch: "Explorer"
			},
			{
				string: navigator.userAgent,
				subString: "Gecko",
				identity: "Mozilla",
				versionSearch: "rv"
			},
			{ // for older Netscapes (4-)
			    string: navigator.userAgent,
				subString: "Mozilla",
				identity: "Netscape",
				versionSearch: "Mozilla"
			}
		],

		dataOS : [
			{
				string: navigator.platform,
				subString: "Win",
				identity: "Windows"
			},
			{
				string: navigator.platform,
				subString: "Mac",
				identity: "Mac"
			},
			{
				   string: navigator.userAgent,
				   subString: "iPhone",
				   identity: "iPhone/iPod"
			},
			{
				string: navigator.platform,
				subString: "Linux",
				identity: "Linux"
			}
		]
	};
})();/**
 * See LICENSE file.
 *
 * Extend a prototype with another to form a classical OOP inheritance procedure.
 *
 * @param subc {object} Prototype to define the base class
 * @param superc {object} Prototype to be extended (derived class).
 */
function extend(subc, superc) {
    var subcp = subc.prototype;

    // Class pattern.
    var F = function() {
    };
    F.prototype = superc.prototype;

    subc.prototype = new F();       // chain prototypes.
    subc.superclass = superc.prototype;
    subc.prototype.constructor = subc;

    // Reset constructor. See Object Oriented Javascript for an in-depth explanation of this.
    if (superc.prototype.constructor === Object.prototype.constructor) {
        superc.prototype.constructor = superc;
    }

    // los metodos de superc, que no esten en esta clase, crear un metodo que
    // llama al metodo de superc.
    for (var method in subcp) {
        if (subcp.hasOwnProperty(method)) {
            subc.prototype[method] = subcp[method];

/**
 * Sintactic sugar to add a __super attribute on every overriden method.
 * Despite comvenient, it slows things down by 5fps.
 *
 * Uncomment at your own risk.
 *
            // tenemos en super un metodo con igual nombre.
            if ( superc.prototype[method]) {
                subc.prototype[method]= (function(fn, fnsuper) {
                    return function() {
                        var prevMethod= this.__super;

                        this.__super= fnsuper;

                        var retValue= fn.apply(
                                this,
                                Array.prototype.slice.call(arguments) );

                        this.__super= prevMethod;

                        return retValue;
                    };
                })(subc.prototype[method], superc.prototype[method]);
            }
            */
        }
    }
}

/**
 * Dynamic Proxy for an object or wrap/decorate a function.
 *
 * @param object
 * @param preMethod
 * @param postMethod
 * @param errorMethod
 */
function proxy(object, preMethod, postMethod, errorMethod) {

    // proxy a function
    if ( typeof object==='function' ) {

        if ( object.__isProxy ) {
            return object;
        }

        return (function(fn) {
            var proxyfn= function() {
                if ( preMethod ) {
                    preMethod({
                            fn: fn,
                            arguments:  Array.prototype.slice.call(arguments)} );
                }
                var retValue= null;
                try {
                    // apply original function call with itself as context
                    retValue= fn.apply(fn, Array.prototype.slice.call(arguments));
                    // everything went right on function call, then call
                    // post-method hook if present
                    if ( postMethod ) {
                        postMethod({
                                fn: fn,
                                arguments:  Array.prototype.slice.call(arguments)} );
                    }
                } catch(e) {
                    // an exeception was thrown, call exception-method hook if
                    // present and return its result as execution result.
                    if( errorMethod ) {
                        retValue= errorMethod({
                            fn: fn,
                            arguments:  Array.prototype.slice.call(arguments),
                            exception:  e} );
                    } else {
                        // since there's no error hook, just throw the exception
                        throw e;
                    }
                }

                // return original returned value to the caller.
                return retValue;
            };
            proxyfn.__isProxy= true;
            return proxyfn;

        })(object);
    }

    /**
     * If not a function then only non privitive objects can be proxied.
     * If it is a previously created proxy, return the proxy itself.
     */
    if ( !typeof object==='object' ||
            object.constructor===Array ||
            object.constructor===String ||
            object.__isProxy ) {

        return object;
    }

    // Our proxy object class.
    var cproxy= function() {};
    // A new proxy instance.
    var proxy= new cproxy();
    // hold the proxied object as member. Needed to assign proper
    // context on proxy method call.
    proxy.__object= object;
    proxy.__isProxy= true;

    // For every element in the object to be proxied
    for( var method in object ) {
        // only function members
        if ( typeof object[method]==='function' ) {
            // add to the proxy object a method of equal signature to the
            // method present at the object to be proxied.
            // cache references of object, function and function name.
            proxy[method]= (function(proxy,fn,method) {
                return function() {
                    // call pre-method hook if present.
                    if ( preMethod ) {
                        preMethod({
                                object:     proxy.__object,
                                method:     method,
                                arguments:  Array.prototype.slice.call(arguments)} );
                    }
                    var retValue= null;
                    try {
                        // apply original object call with proxied object as
                        // function context.
                        retValue= fn.apply( proxy.__object, arguments );
                        // everything went right on function call, the call
                        // post-method hook if present
                        if ( postMethod ) {
                            postMethod({
                                    object:     proxy.__object,
                                    method:     method,
                                    arguments:  Array.prototype.slice.call(arguments)} );
                        }
                    } catch(e) {
                        // an exeception was thrown, call exception-method hook if
                        // present and return its result as execution result.
                        if( errorMethod ) {
                            retValue= errorMethod({
                                object:     proxy.__object,
                                method:     method,
                                arguments:  Array.prototype.slice.call(arguments),
                                exception:  e} );
                        } else {
                            // since there's no error hook, just throw the exception
                            throw e;
                        }
                    }

                    // return original returned value to the caller.
                    return retValue;
                };
            })(proxy,object[method],method);
        }
    }

    // return our newly created and populated of functions proxy object.
    return proxy;
}

/** proxy sample usage

var c0= new Meetup.C1(5);

var cp1= proxy(
        c1,
        function() {
            console.log('pre method on object: ',
                    arguments[0].object.toString(),
                    arguments[0].method,
                    arguments[0].arguments );
        },
        function() {
            console.log('post method on object: ',
                    arguments[0].object.toString(),
                    arguments[0].method,
                    arguments[0].arguments );

        },
        function() {
            console.log('exception on object: ',
                    arguments[0].object.toString(),
                    arguments[0].method,
                    arguments[0].arguments,
                    arguments[0].exception);

            return -1;
        });
 **//**
 * See LICENSE file.
 *
 * Manages every Actor affine transformations.
 * Take into account that Canvas' renderingContext computes postive rotation clockwise, so hacks
 * to handle it properly are hardcoded.
 *
 * Contained classes are CAAT.Matrix and CAAT.MatrixStack.
 *
 **/

(function() {

    /**
     *
     * Define a matrix to hold three dimensional affine transforms.
     *
     * @constructor
     */
    CAAT.Matrix3= function() {
        this.matrix= [
            [1,0,0,0],
            [0,1,0,0],
            [0,0,1,0],
            [0,0,0,1]
        ];

        this.fmatrix= [1,0,0,0,  0,1,0,0,  0,0,1,0,  0,0,0,1];
        
        return this;
    };

    CAAT.Matrix3.prototype= {
        matrix: null,
        fmatrix:null,

        transformCoord : function(point) {
			var x= point.x;
			var y= point.y;
            var z= point.z;

            point.x= x*this.matrix[0][0] + y*this.matrix[0][1] + z*this.matrix[0][2] + this.matrix[0][3];
            point.y= x*this.matrix[1][0] + y*this.matrix[1][1] + z*this.matrix[1][2] + this.matrix[1][3];
            point.z= x*this.matrix[2][0] + y*this.matrix[2][1] + z*this.matrix[2][2] + this.matrix[2][3];

			return point;
		},
	    initialize : function( x0,y0,z0, x1,y1,z1, x2,y2,z2 ) {
		    this.identity( );
		    this.matrix[0][0]= x0;
            this.matrix[0][1]= y0;
            this.matrix[0][2]= z0;

		    this.matrix[1][0]= x1;
            this.matrix[1][1]= y1;
            this.matrix[1][2]= z1;

            this.matrix[2][0]= x2;
            this.matrix[2][1]= y2;
            this.matrix[2][2]= z2;

            return this;
	    },
        initWithMatrix : function(matrixData) {
            this.matrix= matrixData;
            return this;
        },
        flatten : function() {
            var d= this.fmatrix;
            var s= this.matrix;
            d[ 0]= s[0][0];
            d[ 1]= s[1][0];
            d[ 2]= s[2][0];
            d[ 3]= s[3][0];

            d[ 4]= s[0][1];
            d[ 5]= s[1][1];
            d[ 6]= s[2][1];
            d[ 7]= s[2][1];

            d[ 8]= s[0][2];
            d[ 9]= s[1][2];
            d[10]= s[2][2];
            d[11]= s[3][2];

            d[12]= s[0][3];
            d[13]= s[1][3];
            d[14]= s[2][3];
            d[15]= s[3][3];
            
            return this.fmatrix;
        },

        /**
         * Set this matrix to identity matrix.
         * @return this
         */
	    identity : function() {
		    for( var i=0; i<4; i++ ) {
			    for( var j=0; j<4; j++ ) {
				    this.matrix[i][j]= (i===j) ? 1.0 : 0.0;
                }
            }

            return this;
	    },
        /**
         * Get this matri'x internal representation data. The bakced structure is a 4x4 array of number.
         */
        getMatrix : function() {
            return this.matrix;
        },
        /**
         * Multiply this matrix by a created rotation matrix. The rotation matrix is set up to rotate around
         * xy axis.
         *
         * @param xy {Number} radians to rotate.
         *
         * @return this
         */
	    rotateXY : function( xy ) {
		    return this.rotate( xy, 0, 0 );
	    },
        /**
         * Multiply this matrix by a created rotation matrix. The rotation matrix is set up to rotate around
         * xz axis.
         *
         * @param xz {Number} radians to rotate.
         *
         * @return this
         */
	    rotateXZ : function( xz ) {
		    return this.rotate( 0, xz, 0 );
	    },
        /**
         * Multiply this matrix by a created rotation matrix. The rotation matrix is set up to rotate aroind
         * yz axis.
         *
         * @param yz {Number} radians to rotate.
         *
         * @return this
         */
	    rotateYZ : function( yz ) {
		    return this.rotate( 0, 0, yz );
	    },
        /**
         * 
         * @param xy
         * @param xz
         * @param yz
         */
        setRotate : function( xy, xz, yz ) {
            var m= this.rotate(xy,xz,yz);
            this.copy(m);
            return this;
        },
        /**
         * Creates a matrix to represent arbitrary rotations around the given planes.
         * @param xy {number} radians to rotate around xy plane.
         * @param xz {number} radians to rotate around xz plane.
         * @param yz {number} radians to rotate around yz plane.
         *
         * @return {CAAT.Matrix3} a newly allocated matrix.
         * @static
         */
	    rotate : function( xy, xz, yz ) {
		    var res=new CAAT.Matrix3();
		    var s,c,m;

		    if (xy!==0) {
			    m =new CAAT.Matrix3( );
			    s=Math.sin(xy);
			    c=Math.cos(xy);
			    m.matrix[1][1]=c;
			    m.matrix[1][2]=-s;
			    m.matrix[2][1]=s;
			    m.matrix[2][2]=c;
			    res.multiply(m);
		    }

		    if (xz!==0) {
			    m =new CAAT.Matrix3( );
			    s=Math.sin(xz);
			    c=Math.cos(xz);
			    m.matrix[0][0]=c;
			    m.matrix[0][2]=-s;
			    m.matrix[2][0]=s;
			    m.matrix[2][2]=c;
			    res.multiply(m);
		    }

		    if (yz!==0) {
			    m =new CAAT.Matrix3( );
			    s=Math.sin(yz);
			    c=Math.cos(yz);
			    m.matrix[0][0]=c;
			    m.matrix[0][1]=-s;
			    m.matrix[1][0]=s;
			    m.matrix[1][1]=c;
			    res.multiply(m);
		    }

		    return res;
	    },
        /**
         * Creates a new matrix being a copy of this matrix.
         * @return {CAAT.Matrix3} a newly allocated matrix object.
         */
        getClone : function() {
		    var m= new CAAT.Matrix3( );
            m.copy(this);
		    return m;
	    },
        /**
         * Multiplies this matrix by another matrix.
         *
         * @param n {CAAT.Matrix3} a CAAT.Matrix3 object.
         * @return this
         */
	    multiply : function( m ) {
		    var n= this.getClone( );

            var nm= n.matrix;
            var n00= nm[0][0];
            var n01= nm[0][1];
            var n02= nm[0][2];
            var n03= nm[0][3];

            var n10= nm[1][0];
            var n11= nm[1][1];
            var n12= nm[1][2];
            var n13= nm[1][3];

            var n20= nm[2][0];
            var n21= nm[2][1];
            var n22= nm[2][2];
            var n23= nm[2][3];

            var n30= nm[3][0];
            var n31= nm[3][1];
            var n32= nm[3][2];
            var n33= nm[3][3];

            var mm= m.matrix;
            var m00= mm[0][0];
            var m01= mm[0][1];
            var m02= mm[0][2];
            var m03= mm[0][3];

            var m10= mm[1][0];
            var m11= mm[1][1];
            var m12= mm[1][2];
            var m13= mm[1][3];

            var m20= mm[2][0];
            var m21= mm[2][1];
            var m22= mm[2][2];
            var m23= mm[2][3];

            var m30= mm[3][0];
            var m31= mm[3][1];
            var m32= mm[3][2];
            var m33= mm[3][3];

            this.matrix[0][0] = n00*m00 + n01*m10 + n02*m20 + n03*m30;
            this.matrix[0][1] = n00*m01 + n01*m11 + n02*m21 + n03*m31;
            this.matrix[0][2] = n00*m02 + n01*m12 + n02*m22 + n03*m32;
            this.matrix[0][3] = n00*m03 + n01*m13 + n02*m23 + n03*m33;

            this.matrix[1][0] = n10*m00 + n11*m10 + n12*m20 + n13*m30;
            this.matrix[1][1] = n10*m01 + n11*m11 + n12*m21 + n13*m31;
            this.matrix[1][2] = n10*m02 + n11*m12 + n12*m22 + n13*m32;
            this.matrix[1][3] = n10*m03 + n11*m13 + n12*m23 + n13*m33;

            this.matrix[2][0] = n20*m00 + n21*m10 + n22*m20 + n23*m30;
            this.matrix[2][1] = n20*m01 + n21*m11 + n22*m21 + n23*m31;
            this.matrix[2][2] = n20*m02 + n21*m12 + n22*m22 + n23*m32;
            this.matrix[2][3] = n20*m03 + n21*m13 + n22*m23 + n23*m33;

            return this;
        },
        /**
         * Pre multiplies this matrix by a given matrix.
         *
         * @param m {CAAT.Matrix3} a CAAT.Matrix3 object.
         *
         * @return this
         */
        premultiply : function(m) {
		    var n= this.getClone( );

            var nm= n.matrix;
            var n00= nm[0][0];
            var n01= nm[0][1];
            var n02= nm[0][2];
            var n03= nm[0][3];

            var n10= nm[1][0];
            var n11= nm[1][1];
            var n12= nm[1][2];
            var n13= nm[1][3];

            var n20= nm[2][0];
            var n21= nm[2][1];
            var n22= nm[2][2];
            var n23= nm[2][3];

            var n30= nm[3][0];
            var n31= nm[3][1];
            var n32= nm[3][2];
            var n33= nm[3][3];

            var mm= m.matrix;
            var m00= mm[0][0];
            var m01= mm[0][1];
            var m02= mm[0][2];
            var m03= mm[0][3];

            var m10= mm[1][0];
            var m11= mm[1][1];
            var m12= mm[1][2];
            var m13= mm[1][3];

            var m20= mm[2][0];
            var m21= mm[2][1];
            var m22= mm[2][2];
            var m23= mm[2][3];

            var m30= mm[3][0];
            var m31= mm[3][1];
            var m32= mm[3][2];
            var m33= mm[3][3];

		    this.matrix[0][0] = n00*m00 + n01*m10 + n02*m20;
		    this.matrix[0][1] = n00*m01 + n01*m11 + n02*m21;
		    this.matrix[0][2] = n00*m02 + n01*m12 + n02*m22;
		    this.matrix[0][3] = n00*m03 + n01*m13 + n02*m23 + n03;
		    this.matrix[1][0] = n10*m00 + n11*m10 + n12*m20;
		    this.matrix[1][1] = n10*m01 + n11*m11 + n12*m21;
		    this.matrix[1][2] = n10*m02 + n11*m12 + n12*m22;
		    this.matrix[1][3] = n10*m03 + n11*m13 + n12*m23 + n13;
		    this.matrix[2][0] = n20*m00 + n21*m10 + n22*m20;
		    this.matrix[2][1] = n20*m01 + n21*m11 + n22*m21;
		    this.matrix[2][2] = n20*m02 + n21*m12 + n22*m22;
		    this.matrix[2][3] = n20*m03 + n21*m13 + n22*m23 + n23;

            return this;
	    },
        /**
         * Set this matrix translation values to be the given parameters.
         *
         * @param x {number} x component of translation point.
         * @param y {number} y component of translation point.
         * @param z {number} z component of translation point.
         *
         * @return this
         */
        setTranslate : function(x,y,z) {
            this.identity();
		    this.matrix[0][3]=x;
		    this.matrix[1][3]=y;
		    this.matrix[2][3]=z;
            return this;
	    },
        /**
         * Create a translation matrix.
         * @param x {number}
         * @param y {number}
         * @param z {number}
         * @return {CAAT.Matrix3} a new matrix.
         */
        translate : function( x,y,z ) {
            var m= new CAAT.Matrix3();
            m.setTranslate( x,y,z );
            return m;
        },
        setScale : function( sx, sy, sz ) {
            this.identity();
            this.matrix[0][0]= sx;
            this.matrix[1][1]= sy;
            this.matrix[2][2]= sz;
            return this;
        },
        scale : function( sx, sy, sz ) {
            var m= new CAAT.Matrix3();
            m.setScale(sx,sy,sz);
            return m;
        },
        /**
         * Set this matrix as the rotation matrix around the given axes.
         * @param xy {number} radians of rotation around z axis.
         * @param xz {number} radians of rotation around y axis.
         * @param yz {number} radians of rotation around x axis.
         *
         * @return this
         */
	    rotateModelView : function( xy, xz, yz ) {
		    var sxy= Math.sin( xy );
            var sxz= Math.sin( xz );
            var syz= Math.sin( yz );
            var cxy= Math.cos( xy );
            var cxz= Math.cos( xz );
            var cyz= Math.cos( yz );

            this.matrix[0][0]= cxz*cxy;
            this.matrix[0][1]= -cxz*sxy;
            this.matrix[0][2]= sxz;
            this.matrix[0][3]= 0;
            this.matrix[1][0]= syz*sxz*cxy+sxy*cyz;
            this.matrix[1][1]= cyz*cxy-syz*sxz*sxy;
            this.matrix[1][2]= -syz*cxz;
            this.matrix[1][3]= 0;
            this.matrix[2][0]= syz*sxy-cyz*sxz*cxy;
            this.matrix[2][1]= cyz*sxz*sxy+syz*cxy;
            this.matrix[2][2]= cyz*cxz;
            this.matrix[2][3]= 0;
            this.matrix[3][0]= 0;
            this.matrix[3][1]= 0;
            this.matrix[3][2]= 0;
            this.matrix[3][3]= 1;

            return this;
	    },
        /**
         * Copy a given matrix values into this one's.
         * @param m {CAAT.Matrix} a matrix
         *
         * @return this
         */
	    copy : function( m ) {
		    for( var i=0; i<4; i++ ) {
                for( var j=0; j<4; j++ ) {
                    this.matrix[i][j]= m.matrix[i][j];
                }
            }

            return this;
        },
        /**
         * Calculate this matrix's determinant.
         * @return {number} matrix determinant.
         */
        calculateDeterminant: function () {

            var mm= this.matrix;
		    var m11= mm[0][0], m12= mm[0][1], m13= mm[0][2], m14= mm[0][3],
		        m21= mm[1][0], m22= mm[1][1], m23= mm[1][2], m24= mm[1][3],
		        m31= mm[2][0], m32= mm[2][1], m33= mm[2][2], m34= mm[2][3],
		        m41= mm[3][0], m42= mm[3][1], m43= mm[3][2], m44= mm[3][3];

            return  m14 * m22 * m33 * m41 +
                    m12 * m24 * m33 * m41 +
                    m14 * m23 * m31 * m42 +
                    m13 * m24 * m31 * m42 +

                    m13 * m21 * m34 * m42 +
                    m11 * m23 * m34 * m42 +
                    m14 * m21 * m32 * m43 +
                    m11 * m24 * m32 * m43 +

                    m13 * m22 * m31 * m44 +
                    m12 * m23 * m31 * m44 +
                    m12 * m21 * m33 * m44 +
                    m11 * m22 * m33 * m44 +

                    m14 * m23 * m32 * m41 -
                    m13 * m24 * m32 * m41 -
                    m13 * m22 * m34 * m41 -
                    m12 * m23 * m34 * m41 -

                    m14 * m21 * m33 * m42 -
                    m11 * m24 * m33 * m42 -
                    m14 * m22 * m31 * m43 -
                    m12 * m24 * m31 * m43 -

                    m12 * m21 * m34 * m43 -
                    m11 * m22 * m34 * m43 -
                    m13 * m21 * m32 * m44 -
                    m11 * m23 * m32 * m44;
	    },
        /**
         * Return a new matrix which is this matrix's inverse matrix.
         * @return {CAAT.Matrix3} a new matrix.
         */
        getInverse : function() {
            var mm= this.matrix;
		    var m11 = mm[0][0], m12 = mm[0][1], m13 = mm[0][2], m14 = mm[0][3],
		        m21 = mm[1][0], m22 = mm[1][1], m23 = mm[1][2], m24 = mm[1][3],
		        m31 = mm[2][0], m32 = mm[2][1], m33 = mm[2][2], m34 = mm[2][3],
		        m41 = mm[3][0], m42 = mm[3][1], m43 = mm[3][2], m44 = mm[3][3];
            
            var m2= new CAAT.Matrix3();
            m2.matrix[0][0]= m23*m34*m42 + m24*m32*m43 + m22*m33*m44 - m24*m33*m42 - m22*m34*m43 - m23*m32*m44;
            m2.matrix[0][1]= m14*m33*m42 + m12*m34*m43 + m13*m32*m44 - m12*m33*m44 - m13*m34*m42 - m14*m32*m43;
            m2.matrix[0][2]= m13*m24*m42 + m12*m23*m44 + m14*m22*m43 - m12*m24*m43 - m13*m22*m44 - m14*m23*m42;
            m2.matrix[0][3]= m14*m23*m32 + m12*m24*m33 + m13*m22*m34 - m13*m24*m32 - m14*m22*m33 - m12*m23*m34;

            m2.matrix[1][0]= m24*m33*m41 + m21*m34*m43 + m23*m31*m44 - m23*m34*m41 - m24*m31*m43 - m21*m33*m44;
            m2.matrix[1][1]= m13*m34*m41 + m14*m31*m43 + m11*m33*m44 - m14*m33*m41 - m11*m34*m43 - m13*m31*m44;
            m2.matrix[1][2]= m14*m23*m41 + m11*m24*m43 + m13*m21*m44 - m13*m24*m41 - m14*m21*m43 - m11*m23*m44;
            m2.matrix[1][3]= m13*m24*m31 + m14*m21*m33 + m11*m23*m34 - m14*m23*m31 - m11*m24*m33 - m13*m21*m34;

            m2.matrix[2][0]= m22*m34*m41 + m24*m31*m42 + m21*m32*m44 - m24*m32*m41 - m21*m34*m42 - m22*m31*m44;
            m2.matrix[2][1]= m14*m32*m41 + m11*m34*m42 + m12*m31*m44 - m11*m32*m44 - m12*m34*m41 - m14*m31*m42;
            m2.matrix[2][2]= m13*m24*m41 + m14*m21*m42 + m11*m22*m44 - m14*m22*m41 - m11*m24*m42 - m12*m21*m44;
            m2.matrix[2][3]= m14*m22*m31 + m11*m24*m32 + m12*m21*m34 - m11*m22*m34 - m12*m24*m31 - m14*m21*m32;

            m2.matrix[3][0]= m23*m32*m41 + m21*m33*m42 + m22*m31*m43 - m22*m33*m41 - m23*m31*m42 - m21*m32*m43;
            m2.matrix[3][1]= m12*m33*m41 + m13*m31*m42 + m11*m32*m43 - m13*m32*m41 - m11*m33*m42 - m12*m31*m43;
            m2.matrix[3][2]= m13*m22*m41 + m11*m23*m42 + m12*m21*m43 - m11*m22*m43 - m12*m23*m41 - m13*m21*m42;
            m2.matrix[3][3]= m12*m23*m31 + m13*m21*m32 + m11*m22*m33 - m13*m22*m31 - m11*m23*m32 - m12*m21*m33;
            
            return m2.multiplyScalar( 1/this.calculateDeterminant() );
        },
        /**
         * Multiply this matrix by a scalar.
         * @param scalar {number} scalar value
         *
         * @return this
         */
        multiplyScalar : function( scalar ) {
            var i,j;

            for( i=0; i<4; i++ ) {
                for( j=0; j<4; j++ ) {
                    this.matrix[i][j]*=scalar;
                }
            }

            return this;
        }

    };

})();

(function() {

    /**
     * 2D affinetransform matrix represeantation.
     * It includes matrices for
     * <ul>
     *  <li>Rotation by any anchor point
     *  <li>translation
     *  <li>scale by any anchor point
     * </ul>
     *
     */
	CAAT.Matrix = function() {
        this.matrix= [
            1.0,0.0,0.0,
            0.0,1.0,0.0, 0.0,0.0,1.0 ];
		return this;
	};
	
	CAAT.Matrix.prototype= {
		matrix:	null,

        /**
         * Transform a point by this matrix. The parameter point will be modified with the transformation values.
         * @param point {CAAT.Point}.
         * @return {CAAT.Point} the parameter point.
         */
		transformCoord : function(point) {
			var x= point.x;
			var y= point.y;

            var tm= this.matrix;

            point.x= x*tm[0] + y*tm[1] + tm[2];
            point.y= x*tm[3] + y*tm[4] + tm[5];

			return point;
		},
        /**
         * Create a new rotation matrix and set it up for the specified angle in radians.
         * @param angle {number}
         * @return {CAAT.Matrix} a matrix object.
         *
         * @static
         */
		rotate : function(angle) {
			var m= new CAAT.Matrix();
			m.setRotation(angle);
			return m;
        },
        setRotation : function( angle ) {

            this.identity();

            var tm= this.matrix;
            var c= Math.cos( angle );
            var s= Math.sin( angle );
            tm[0]= c;
            tm[1]= -s;
            tm[3]= s;
            tm[4]= c;

			return this;
		},
        /**
         * Create a scale matrix.
         * @param scalex {number} x scale magnitude.
         * @param scaley {number} y scale magnitude.
         *
         * @return {CAAT.Matrix} a matrix object.
         *
         * @static
         */
		scale : function(scalex, scaley) {
			var m= new CAAT.Matrix();

            m.matrix[0]= scalex;
            m.matrix[4]= scaley;

			return m;
		},
        setScale : function(scalex, scaley) {
            this.identity();

            this.matrix[0]= scalex;
            this.matrix[4]= scaley;

			return this;
		},
        /**
         * Create a translation matrix.
         * @param x {number} x translation magnitude.
         * @param y {number} y translation magnitude.
         *
         * @return {CAAT.Matrix} a matrix object.
         * @static
         *
         */
		translate : function( x, y ) {
			var m= new CAAT.Matrix();

            m.matrix[2]= x;
            m.matrix[5]= y;

			return m;
		},
        /**
         * Sets this matrix as a translation matrix.
         * @param x
         * @param y
         */
        setTranslate : function( x, y ) {
            this.identity();

            this.matrix[2]= x;
            this.matrix[5]= y;

            return this;
        },
        /**
         * Copy into this matrix the given matrix values.
         * @param matrix {CAAT.Matrix}
         * @return this
         */
		copy : function( matrix ) {
            matrix= matrix.matrix;

            var tmatrix= this.matrix;
			tmatrix[0]= matrix[0];
			tmatrix[1]= matrix[1];
			tmatrix[2]= matrix[2];
			tmatrix[3]= matrix[3];
			tmatrix[4]= matrix[4];
			tmatrix[5]= matrix[5];
			tmatrix[6]= matrix[6];
			tmatrix[7]= matrix[7];
			tmatrix[8]= matrix[8];

            return this;
		},
        /**
         * Set this matrix to the identity matrix.
         * @return this
         */
		identity : function() {

            var m= this.matrix;
            m[0]= 1.0;
            m[1]= 0.0;
            m[2]= 0.0;

            m[3]= 0.0;
            m[4]= 1.0;
            m[5]= 0.0;

            m[6]= 0.0;
            m[7]= 0.0;
            m[8]= 1.0;

            return this;
		},
        /**
         * Multiply this matrix by a given matrix.
         * @param m {CAAT.Matrix}
         * @return this
         */
		multiply : function( m ) {

            var tm= this.matrix;
            var mm= m.matrix;

            var tm0= tm[0];
            var tm1= tm[1];
            var tm2= tm[2];
            var tm3= tm[3];
            var tm4= tm[4];
            var tm5= tm[5];
            var tm6= tm[6];
            var tm7= tm[7];
            var tm8= tm[8];

            var mm0= mm[0];
            var mm1= mm[1];
            var mm2= mm[2];
            var mm3= mm[3];
            var mm4= mm[4];
            var mm5= mm[5];
            var mm6= mm[6];
            var mm7= mm[7];
            var mm8= mm[8];

            tm[0]= tm0*mm0 + tm1*mm3 + tm2*mm6;
            tm[1]= tm0*mm1 + tm1*mm4 + tm2*mm7;
            tm[2]= tm0*mm2 + tm1*mm5 + tm2*mm8;
            tm[3]= tm3*mm0 + tm4*mm3 + tm5*mm6;
            tm[4]= tm3*mm1 + tm4*mm4 + tm5*mm7;
            tm[5]= tm3*mm2 + tm4*mm5 + tm5*mm8;
            tm[6]= tm6*mm0 + tm7*mm3 + tm8*mm6;
            tm[7]= tm6*mm1 + tm7*mm4 + tm8*mm7;
            tm[8]= tm6*mm2 + tm7*mm5 + tm8*mm8;

            return this;
		},
        /**
         * Premultiply this matrix by a given matrix.
         * @param m {CAAT.Matrix}
         * @return this
         */
		premultiply : function(m) {

            var m00= m.matrix[0]*this.matrix[0] + m.matrix[1]*this.matrix[3] + m.matrix[2]*this.matrix[6];
            var m01= m.matrix[0]*this.matrix[1] + m.matrix[1]*this.matrix[4] + m.matrix[2]*this.matrix[7];
            var m02= m.matrix[0]*this.matrix[2] + m.matrix[1]*this.matrix[5] + m.matrix[2]*this.matrix[8];

            var m10= m.matrix[3]*this.matrix[0] + m.matrix[4]*this.matrix[3] + m.matrix[5]*this.matrix[6];
            var m11= m.matrix[3]*this.matrix[1] + m.matrix[4]*this.matrix[4] + m.matrix[5]*this.matrix[7];
            var m12= m.matrix[3]*this.matrix[2] + m.matrix[4]*this.matrix[5] + m.matrix[5]*this.matrix[8];

            var m20= m.matrix[6]*this.matrix[0] + m.matrix[7]*this.matrix[3] + m.matrix[8]*this.matrix[6];
            var m21= m.matrix[6]*this.matrix[1] + m.matrix[7]*this.matrix[4] + m.matrix[8]*this.matrix[7];
            var m22= m.matrix[6]*this.matrix[2] + m.matrix[7]*this.matrix[5] + m.matrix[8]*this.matrix[8];

            this.matrix[0]= m00;
            this.matrix[1]= m01;
            this.matrix[2]= m02;

            this.matrix[3]= m10;
            this.matrix[4]= m11;
            this.matrix[5]= m12;

            this.matrix[6]= m20;
            this.matrix[7]= m21;
            this.matrix[8]= m22;


            return this;
		},
        /**
         * Creates a new inverse matrix from this matrix.
         * @return {CAAT.Matrix} an inverse matrix.
         */
	    getInverse : function() {
            var tm= this.matrix;

			var m00= tm[0];
			var m01= tm[1];
            var m02= tm[2];
			var m10= tm[3];
			var m11= tm[4];
            var m12= tm[5];
            var m20= tm[6];
            var m21= tm[7];
            var m22= tm[8];

            var newMatrix= new CAAT.Matrix();

            var determinant= m00* (m11*m22 - m21*m12) - m10*(m01*m22 - m21*m02) + m20 * (m01*m12 - m11*m02);
            if ( determinant===0 ) {
                return null;
            }

            var m= newMatrix.matrix;

            m[0]= m11*m22-m12*m21;
            m[1]= m02*m21-m01*m22;
            m[2]= m01*m12-m02*m11;

            m[3]= m12*m20-m10*m22;
            m[4]= m00*m22-m02*m20;
            m[5]= m02*m10-m00*m12;

            m[6]= m10*m21-m11*m20;
            m[7]= m01*m20-m00*m21;
            m[8]= m00*m11-m01*m10;

            newMatrix.multiplyScalar( 1/determinant );

			return newMatrix;
	    },
        /**
         * Multiply this matrix by a scalar.
         * @param scalar {number} scalar value
         *
         * @return this
         */
        multiplyScalar : function( scalar ) {
            var i;

            for( i=0; i<9; i++ ) {
                this.matrix[i]*=scalar;
            }

            return this;
        },
        /**
         *
         * @param ctx
         */
        transformRenderingContextSet : function(ctx) {
            var m= this.matrix;
            ctx.setTransform( m[0], m[3], m[1], m[4], m[2], m[5] );
            return this;
        },

        /**
         *
         * @param ctx
         */
        transformRenderingContext : function(ctx) {
            var m= this.matrix;
            ctx.transform( m[0], m[3], m[1], m[4], m[2], m[5] );
            return this;
        }

	};
})();

(function() {
    /**
     * Implementation of a matrix stack. Each CAAT.Actor instance contains a MatrixStack to hold of its affine
     * transformations. The Canvas rendering context will be fed with this matrix stack values to keep a homogeneous
     * transformation process.
     *
     * @constructor
     */
	CAAT.MatrixStack= function() {
		this.stack= [];
		this.saved= [];
		return this;
	};

	CAAT.MatrixStack.prototype= {
		stack: null,
		saved: null,

        /**
         * Add a matrix to the transformation stack.
         * @return this
         */
		pushMatrix : function(matrix) {
			this.stack.push(matrix);
            return this;
		},
        /**
         * Remove the last matrix from this stack.
         * @return {CAAT.Matrix} the poped matrix.
         */
		popMatrix : function()	{
			return this.stack.pop();
		},
        /**
         * Create a restoration point of pushed matrices.
         * @return this
         */
		save : function() {
			this.saved.push(this.stack.length);
            return this;
		},
        /**
         * Restore from the last restoration point set.
         * @return this
         */
		restore : function() {
			var pos= this.saved.pop();
			while( this.stack.length!==pos ) {
				this.popMatrix();
			}
            return this;
		},
        /**
         * Return the concatenation (multiplication) matrix of all the matrices contained in this stack.
         * @return {CAAT.Matrix} a new matrix.
         */
        getMatrix : function() {
            var matrix= new CAAT.Matrix();

			for( var i=0; i<this.stack.length; i++ ) {
				var matrixStack= this.stack[i];
                matrix.multiply( matrixStack );
            }

            return matrix;
        }
	};
})();/**
 * See LICENSE file.
 *
 * @author: Mario Gonzalez (@onedayitwilltake) and Ibon Tolosana (@hyperandroid)
 *
 * Helper classes for color manipulation.
 *
 **/

(function() {

    /**
     * Class with color utilities.
     *
     * @constructor
     */
	CAAT.Color = function() {
		return this;
	};
	CAAT.Color.prototype= {
		/**
		 * HSV to RGB color conversion
		 * <p>
		 * H runs from 0 to 360 degrees<br>
		 * S and V run from 0 to 100
		 * <p>
		 * Ported from the excellent java algorithm by Eugene Vishnevsky at:
		 * http://www.cs.rit.edu/~ncs/color/t_convert.html
         *
         * @static
		 */
		hsvToRgb: function(h, s, v)
		{
			var r, g, b;
			var i;
			var f, p, q, t;

			// Make sure our arguments stay in-range
			h = Math.max(0, Math.min(360, h));
			s = Math.max(0, Math.min(100, s));
			v = Math.max(0, Math.min(100, v));

			// We accept saturation and value arguments from 0 to 100 because that's
			// how Photoshop represents those values. Internally, however, the
			// saturation and value are calculated from a range of 0 to 1. We make
			// That conversion here.
			s /= 100;
			v /= 100;

			if(s === 0) {
				// Achromatic (grey)
				r = g = b = v;
				return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
			}

			h /= 60; // sector 0 to 5
			i = Math.floor(h);
			f = h - i; // factorial part of h
			p = v * (1 - s);
			q = v * (1 - s * f);
			t = v * (1 - s * (1 - f));

			switch(i) {
				case 0:
					r = v;
					g = t;
					b = p;
					break;

				case 1:
					r = q;
					g = v;
					b = p;
					break;

				case 2:
					r = p;
					g = v;
					b = t;
					break;

				case 3:
					r = p;
					g = q;
					b = v;
					break;

				case 4:
					r = t;
					g = p;
					b = v;
					break;

				default: // case 5:
					r = v;
					g = p;
					b = q;
			}

			return new CAAT.Color.RGB(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
		},
        /**
         * Enumeration to define types of color ramps.
         * @enum {number}
         */
        RampEnumeration : {
            RAMP_RGBA:              0,
            RAMP_RGB:               1,
            RAMP_CHANNEL_RGB:       2,
            RAMP_CHANNEL_RGBA:      3,
            RAMP_CHANNEL_RGB_ARRAY: 4,
            RAMP_CHANNEL_RGBA_ARRAY:5
        },

        /**
         * Interpolate the color between two given colors. The return value will be a calculated color
         * among the two given initial colors which corresponds to the 'step'th color of the 'nsteps'
         * calculated colors.
         * @param r0 {number} initial color red component.
         * @param g0 {number} initial color green component.
         * @param b0 {number} initial color blue component.
         * @param r1 {number} final color red component.
         * @param g1 {number} final color green component.
         * @param b1 {number} final color blue component.
         * @param nsteps {number} number of colors to calculate including the two given colors. If 16 is passed as value,
         * 14 colors plus the two initial ones will be calculated.
         * @param step {number} return this color index of all the calculated colors.
         *
         * @return { r{number}, g{number}, b{number} } return an object with the new calculated color components.
         * @static
         */
        interpolate : function( r0, g0, b0, r1, g1, b1, nsteps, step) {
            if ( step<=0 ) {
                return {
                    r:r0,
                    g:g0,
                    b:b0
                };
            } else if ( step>=nsteps ) {
                return {
                    r:r1,
                    g:g1,
                    b:b1
                };
            }

            var r= (r0+ (r1-r0)/nsteps*step)>>0;
            var g= (g0+ (g1-g0)/nsteps*step)>>0;
            var b= (b0+ (b1-b0)/nsteps*step)>>0;

            if ( r>255 ) {r=255;} else if (r<0) {r=0;}
            if ( g>255 ) {g=255;} else if (g<0) {g=0;}
            if ( b>255 ) {b=255;} else if (b<0) {b=0;}

            return {
                r:r,
                g:g,
                b:b
            };
        },
        /**
         * Generate a ramp of colors from an array of given colors.
         * @param fromColorsArray {[number]} an array of colors. each color is defined by an integer number from which
         * color components will be extracted. Be aware of the alpha component since it will also be interpolated for
         * new colors.
         * @param rampSize {number} number of colors to produce.
         * @param returnType {CAAT.ColorUtils.RampEnumeration} a value of CAAT.ColorUtils.RampEnumeration enumeration.
         *
         * @return { [{number},{number},{number},{number}] } an array of integers each of which represents a color of
         * the calculated color ramp.
         *
         * @static
         */
        makeRGBColorRamp : function( fromColorsArray, rampSize, returnType ) {

            var ramp=   [];
            var nc=     fromColorsArray.length-1;
            var chunk=  rampSize/nc;

            for( var i=0; i<nc; i++ ) {
                var c= fromColorsArray[i];
                var a0= (c>>24)&0xff;
                var r0= (c&0xff0000)>>16;
                var g0= (c&0xff00)>>8;
                var b0= c&0xff;

                var c1= fromColorsArray[i+1];
                var a1= (c1>>24)&0xff;
                var r1= (c1&0xff0000)>>16;
                var g1= (c1&0xff00)>>8;
                var b1= c1&0xff;

                var da= (a1-a0)/chunk;
                var dr= (r1-r0)/chunk;
                var dg= (g1-g0)/chunk;
                var db= (b1-b0)/chunk;

                for( var j=0; j<chunk; j++ ) {
                    var na= (a0+da*j)>>0;
                    var nr= (r0+dr*j)>>0;
                    var ng= (g0+dg*j)>>0;
                    var nb= (b0+db*j)>>0;

                    switch( returnType ) {
                        case this.RampEnumeration.RAMP_RGBA:
                            ramp.push( 'argb('+na+','+nr+','+ng+','+nb+')' );
                            break;
                        case this.RampEnumeration.RAMP_RGB:
                            ramp.push( 'rgb('+nr+','+ng+','+nb+')' );
                            break;
                        case this.RampEnumeration.RAMP_CHANNEL_RGB:
                            ramp.push( 0xff000000 | nr<<16 | ng<<8 | nb );
                            break;
                        case this.RampEnumeration.RAMP_CHANNEL_RGBA:
                            ramp.push( na<<24 | nr<<16 | ng<<8 | nb );
                            break;
                        case this.RampEnumeration.RAMP_CHANNEL_RGBA_ARRAY:
                            ramp.push([ nr, ng, nb, na ]);
                            break;
                        case this.RampEnumeration.RAMP_CHANNEL_RGB_ARRAY:
                            ramp.push([ nr, ng, nb ]);
                            break;
                    }
                }
            }

            return ramp;

        }
	};
})();

(function() {
    /**
     * RGB color implementation
     * @param r {number} an integer in the range 0..255
     * @param g {number} an integer in the range 0..255
     * @param b {number} an integer in the range 0..255
     *
     * @constructor
     */
	CAAT.Color.RGB = function(r, g, b) {
		this.r = r || 255;
		this.g = g || 255;
		this.b = b || 255;
		return this;
	};
	CAAT.Color.RGB.prototype= {
		r: 255,
		g: 255,
		b: 255,

        /**
         * Get color hexadecimal representation.
         * @return {string} a string with color hexadecimal representation.
         */
		toHex: function() {
			// See: http://jsperf.com/rgb-decimal-to-hex/5
			return ('000000' + ((this.r << 16) + (this.g << 8) + this.b).toString(16)).slice(-6);
		}
	};
})();
/**
 * See LICENSE file.
 *
 * Rectangle Class.
 * Needed to compute Curve bounding box.
 * Needed to compute Actor affected area on change.
 *
 **/


(function() {
    /**
     * A Rectangle implementation, which defines an area positioned somewhere.
     *
     * @constructor
     */
	CAAT.Rectangle= function() {
		return this;
	};
	
	CAAT.Rectangle.prototype= {
		x:		0,
		y:		0,
		x1:		0,
		y1:		0,
		width:	-1,
		height:	-1,

        setEmpty : function() {
            this.width=-1;
            this.height=-1;
            return this;
        },
        /**
         * Set this rectangle's location.
         * @param x {number}
         * @param y {number}
         */
        setLocation: function( x,y ) {
            this.x= x;
            this.y= y;
            this.x1= this.x+this.width;
            this.y1= this.y+this.height;
            return this;
        },
        /**
         * Set this rectangle's dimension.
         * @param w {number}
         * @param h {number}
         */
        setDimension : function( w,h ) {
            this.width= w;
            this.height= h;
            this.x1= this.x+this.width;
            this.y1= this.y+this.height;
            return this;
        },
        /**
         * Return whether the coordinate is inside this rectangle.
         * @param px {number}
         * @param py {number}
         *
         * @return {boolean}
         */
		contains : function(px,py) {
			return px>=0 && px<this.width && py>=0 && py<this.height; 
		},
        /**
         * Return whether this rectangle is empty, that is, has zero dimension.
         * @return {boolean}
         */
		isEmpty : function() {
			return this.width===-1 && this.height===-1;
		},
        /**
         * Set this rectangle as the union of this rectangle and the given point.
         * @param px {number}
         * @param py {number}
         */
		union : function(px,py) {
			
			if ( this.isEmpty() ) {
				this.x= px;
                this.x1= px;
				this.y= py;
                this.y1= py;
                this.width=0;
                this.height=0;
				return;
			}
			
			this.x1= this.x+this.width;
			this.y1= this.y+this.height;
			
			if ( py<this.y ) {
				this.y= py;
			}
			if ( px<this.x ) {
				this.x= px;
			}
			if ( py>this.y1 ) {
				this.y1= py;
			}
			if ( px>this.x1 ){
				this.x1= px;
			}
			
			this.width= this.x1-this.x;
			this.height= this.y1-this.y;
		},
        unionRectangle : function( rectangle ) {
            this.union( rectangle.x , rectangle.y  );
            this.union( rectangle.x1, rectangle.y  );
            this.union( rectangle.x,  rectangle.y1 );
            this.union( rectangle.x1, rectangle.y1 );
            return this;
        }
	};
})();/**
 * See LICENSE file.
 *
 * Classes to solve and draw curves.
 * Curve is the superclass of
 *  + Bezier (quadric and cubic)
 *  + TODO: Catmull Rom
 *
 *
 **/

(function() {
    /**
     *
     * Curve class is the base for all curve solvers available in CAAT.
     *
     * @constructor
     */
	CAAT.Curve= function() {
		return this;
	};
	
	CAAT.Curve.prototype= {
		coordlist:		null,
		k:				0.05,
		length:			-1,
		interpolator:	false,
		HANDLE_SIZE:	20,
		drawHandles:	true,

        /**
         * Paint the curve control points.
         * @param director {CAAT.Director}
         */
		paint: function(director) {
            if ( false===this.drawHandles ) {
                return;
            }

			var ctx= director.ctx;
		
			// control points
			ctx.save();
			ctx.beginPath();
			
			ctx.strokeStyle='#a0a0a0';
			ctx.moveTo( this.coordlist[0].x, this.coordlist[0].y );
			ctx.lineTo( this.coordlist[1].x, this.coordlist[1].y );
			ctx.stroke();
			if ( this.cubic ) {
				ctx.moveTo( this.coordlist[2].x, this.coordlist[2].y );
				ctx.lineTo( this.coordlist[3].x, this.coordlist[3].y );
				ctx.stroke();
			} 
			
            ctx.globalAlpha=0.5;
            for( var i=0; i<this.coordlist.length; i++ ) {
                ctx.fillStyle='#7f7f00';
                ctx.beginPath();
                ctx.arc(
                        this.coordlist[i].x,
                        this.coordlist[i].y,
                        this.HANDLE_SIZE/2,
                        0,
                        2*Math.PI,
                        false) ;
                ctx.fill();
            }

			ctx.restore();
		},
        /**
         * Signal the curve has been modified and recalculate curve length.
         */
		update : function() {
			this.calcLength();
		},
        /**
         * This method must be overriden by subclasses. It is called whenever the curve must be solved for some time=t.
         * The t parameter must be in the range 0..1
         * @param point {CAAT.Point} to store curve solution for t.
         * @param t {number}
         * @return {CAAT.Point} the point parameter.
         */
		solve: function(point,t) {
		},
        /**
         * Get an array of points defining the curve contour.
         * @param numSamples {number} number of segments to get.
         */
        getContour : function(numSamples) {
            var contour= [], i;

            for( i=0; i<=numSamples; i++ ) {
                var point= new CAAT.Point();
                this.solve( point, i/numSamples );
                contour.push(point);
            }

            return contour;
        },
        /**
         * Calculates a curve bounding box.
         *
         * @param rectangle {CAAT.Rectangle} a rectangle to hold the bounding box.
         * @return {CAAT.Rectangle} the rectangle parameter.
         */
		getBoundingBox : function(rectangle) {
			if ( !rectangle ) {
				rectangle= new CAAT.Rectangle();
			}

            // thanks yodesoft.com for spotting the first point is out of the BB
            rectangle.union( this.coordlist[0].x, this.coordlist[0].y );

			var pt= new CAAT.Point();
			for(var t=this.k;t<=1+this.k;t+=this.k){
				this.solve(pt,t);
				rectangle.union( pt.x, pt.y );
			}			
			
			return rectangle;
		},
        /**
         * Calculate the curve length by incrementally solving the curve every substep=CAAT.Curve.k. This value defaults
         * to .05 so at least 20 iterations will be performed.
         *
         * @return {number} the approximate curve length.
         */
		calcLength : function() {
			var x1,x2,y1,y2;
			x1 = this.coordlist[0].x;
			y1 = this.coordlist[0].y;
			var llength=0;
			var pt= new CAAT.Point();
			for(var t=this.k;t<=1+this.k;t+=this.k){
				this.solve(pt,t);
				llength+= Math.sqrt( (pt.x-x1)*(pt.x-x1) + (pt.y-y1)*(pt.y-y1) );
				x1=pt.x;
				y1=pt.y;
			}
			
			this.length= llength;
			return llength;
		},
        /**
         * Return the cached curve length.
         * @return {number} the cached curve length.
         */
		getLength : function() {
			return this.length;
		},
        /**
         * Return the first curve control point.
         * @param point {CAAT.Point}
         * @return {CAAT.Point}
         */
		endCurvePosition : function(point) {
			return this.coordlist[ this.coordlist.length-1 ];
		},
        /**
         * Return the last curve control point.
         * @param point {CAAT.Point}
         * @return {CAAT.Point}
         */
		startCurvePosition : function(point) {
			return this.coordlist[ 0 ];
		},

        setPoints : function( points ) {
        },

        setPoint : function( point, index ) {
            if ( index>=0 && index<this.coordlist.length ) {
                this.coordlist[index]= point;
            }
        },
        applyAsPath : function( ctx ) {
        }
	};
})();


(function() {

    /**
     * Bezier quadric and cubic curves implementation.
     *
     * @constructor
     * @extends CAAT.Curve
     */
	CAAT.Bezier= function() {
		CAAT.Bezier.superclass.constructor.call(this);
		return this;
	};
	
	CAAT.Bezier.prototype= {
		
		cubic:		false,

        applyAsPath : function( ctx ) {

            var cc= this.coordlist;

            if ( this.cubic ) {
                ctx.bezierCurveTo(
                    cc[1].x,
                    cc[1].y,
                    cc[2].x,
                    cc[2].y,
                    cc[3].x,
                    cc[3].y
                );
            } else {
                ctx.quadraticCurveTo(
                    cc[1].x,
                    cc[1].y,
                    cc[2].x,
                    cc[2].y
                );
            }
            return this;
        },
        isQuadric : function() {
            return !this.cubic;
        },
        isCubic : function() {
            return this.cubic;
        },
        /**
         * Set this curve as a cubic bezier defined by the given four control points.
         * @param cp0x {number}
         * @param cp0y {number}
         * @param cp1x {number}
         * @param cp1y {number}
         * @param cp2x {number}
         * @param cp2y {number}
         * @param cp3x {number}
         * @param cp3y {number}
         */
		setCubic : function( cp0x,cp0y, cp1x,cp1y, cp2x,cp2y, cp3x,cp3y ) {
		
			this.coordlist= [];
		
			this.coordlist.push( new CAAT.Point().set(cp0x, cp0y ) );
			this.coordlist.push( new CAAT.Point().set(cp1x, cp1y ) );
			this.coordlist.push( new CAAT.Point().set(cp2x, cp2y ) );
			this.coordlist.push( new CAAT.Point().set(cp3x, cp3y ) );
			
			this.cubic= true;
			this.update();

            return this;
		},
        /**
         * Set this curve as a quadric bezier defined by the three control points.
         * @param cp0x {number}
         * @param cp0y {number}
         * @param cp1x {number}
         * @param cp1y {number}
         * @param cp2x {number}
         * @param cp2y {number}
         */
		setQuadric : function(cp0x,cp0y, cp1x,cp1y, cp2x,cp2y ) {
		
			this.coordlist= [];
		
			this.coordlist.push( new CAAT.Point().set(cp0x, cp0y ) );
			this.coordlist.push( new CAAT.Point().set(cp1x, cp1y ) );
			this.coordlist.push( new CAAT.Point().set(cp2x, cp2y ) );
			
			this.cubic= false;
			this.update();

            return this;
		},
        setPoints : function( points ) {
            if ( points.length===3 ) {
                this.coordlist= points;
                this.cubic= false;
                this.update();
            } else if (points.length===4 ) {
                this.coordlist= points;
                this.cubic= true;
                this.update();
            } else {
                throw 'points must be an array of 3 or 4 CAAT.Point instances.'
            }

            return this;
        },
        /**
         * Paint this curve.
         * @param director {CAAT.Director}
         */
		paint : function( director ) {
			if ( this.cubic ) {
				this.paintCubic(director);
			} else {
				this.paintCuadric( director );
			}
			
			CAAT.Bezier.superclass.paint.call(this,director);

		},
        /**
         * Paint this quadric Bezier curve. Each time the curve is drawn it will be solved again from 0 to 1 with
         * CAAT.Bezier.k increments.
         *
         * @param director {CAAT.Director}
         * @private
         */
		paintCuadric : function( director ) {
			var x1,y1;
			x1 = this.coordlist[0].x;
			y1 = this.coordlist[0].y;
			
			var ctx= director.ctx;
			
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(x1,y1);
			
			var point= new CAAT.Point();
			for(var t=this.k;t<=1+this.k;t+=this.k){
				this.solve(point,t);
				ctx.lineTo(point.x, point.y );
			}
			
			ctx.stroke();
			ctx.restore();
		
		},
        /**
         * Paint this cubic Bezier curve. Each time the curve is drawn it will be solved again from 0 to 1 with
         * CAAT.Bezier.k increments.
         *
         * @param director {CAAT.Director}
         * @private
         */
		paintCubic : function( director ) {

			var x1,y1;
			x1 = this.coordlist[0].x;
			y1 = this.coordlist[0].y;
			
			var ctx= director.ctx;
			
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(x1,y1);
			
			var point= new CAAT.Point();
			for(var t=this.k;t<=1+this.k;t+=this.k){
				this.solve(point,t);
				ctx.lineTo(point.x, point.y );
			}
			
			ctx.stroke();
			ctx.restore();
		},
        /**
         * Solves the curve for any given parameter t.
         * @param point {CAAT.Point} the point to store the solved value on the curve.
         * @param t {number} a number in the range 0..1
         */
		solve : function(point,t) {
			if ( this.cubic ) {
				return this.solveCubic(point,t);
			} else {
				return this.solveQuadric(point,t);
			}
		},
        /**
         * Solves a cubic Bezier.
         * @param point {CAAT.Point} the point to store the solved value on the curve.
         * @param t {number} the value to solve the curve for.
         */
		solveCubic : function(point,t) {
			
			var t2= t*t;
			var t3= t*t2;

            var cl= this.coordlist;
            var cl0= cl[0];
            var cl1= cl[1];
            var cl2= cl[2];
            var cl3= cl[3];

			point.x=(
                cl0.x + t * (-cl0.x * 3 + t * (3 * cl0.x-
                cl0.x*t)))+t*(3*cl1.x+t*(-6*cl1.x+
                cl1.x*3*t))+t2*(cl2.x*3-cl2.x*3*t)+
                cl3.x * t3;
				
			point.y=(
                    cl0.y+t*(-cl0.y*3+t*(3*cl0.y-
					cl0.y*t)))+t*(3*cl1.y+t*(-6*cl1.y+
					cl1.y*3*t))+t2*(cl2.y*3-cl2.y*3*t)+
					cl3.y * t3;
			
			return point;
		},
        /**
         * Solves a quadric Bezier.
         * @param point {CAAT.Point} the point to store the solved value on the curve.
         * @param t {number} the value to solve the curve for.
         */
		solveQuadric : function(point,t) {
            var cl= this.coordlist;
            var cl0= cl[0];
            var cl1= cl[1];
            var cl2= cl[2];
            var t1= 1-t;

			point.x= t1*t1*cl0.x + 2*t1*t*cl1.x + t*t*cl2.x;
			point.y= t1*t1*cl0.y + 2*t1*t*cl1.y + t*t*cl2.y;
			
			return point;
		}
	};

    extend(CAAT.Bezier, CAAT.Curve, null);
	
})();

(function() {

    /**
     * CatmullRom curves solver implementation.
     * <p>
     * <strong>Incomplete class, do not use.</strong>
     *
     * @constructor
     * @extends CAAT.Curve
     */
	CAAT.CatmullRom = function() {
		CAAT.CatmullRom.superclass.constructor.call(this);
		return this;
	};
	
	CAAT.CatmullRom.prototype= {

        /**
         * Set curve control points.
         * @param cp0x {number}
         * @param cp0y {number}
         * @param cp1x {number}
         * @param cp1y {number}
         * @param cp2x {number}
         * @param cp2y {number}
         * @param cp3x {number}
         * @param cp3y {number}
         */
		setCurve : function( cp0x,cp0y, cp1x,cp1y, cp2x,cp2y, cp3x,cp3y ) {
		
			this.coordlist= [];
		
			this.coordlist.push( new CAAT.Point().set(cp0x, cp0y ) );
			this.coordlist.push( new CAAT.Point().set(cp1x, cp1y ) );
			this.coordlist.push( new CAAT.Point().set(cp2x, cp2y ) );
			this.coordlist.push( new CAAT.Point().set(cp3x, cp3y ) );
			
			this.cubic= true;
			this.update();
		},
        /**
         * Paint the contour by solving again the entire curve.
         * @param director {CAAT.Director}
         */
		paint: function(director) {
			
			var x1,x2,y1,y2;
			x1 = this.coordlist[0].x;
			y1 = this.coordlist[0].y;
			
			var ctx= director.ctx;
			
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(x1,y1);
			
			var point= new CAAT.Point();
			
			for(var t=this.k;t<=1+this.k;t+=this.k){
				this.solve(point,t);
				ctx.lineTo(point.x,point.y);
			}
			
			ctx.stroke();
			ctx.restore();
			
			CAAT.CatmullRom.superclass.paint.call(this,director);
		},
        /**
         * Solves the curve for any given parameter t.
         * @param point {CAAT.Point} the point to store the solved value on the curve.
         * @param t {number} a number in the range 0..1
         */
		solve: function(point,t) {
			var t2= t*t;
			var t3= t*t2;
		
			var c= this.coordlist;

//			q(t) = 0.5 *(  	(2 * P1) +
//				 	(-P0 + P2) * t +
//				(2*P0 - 5*P1 + 4*P2 - P3) * t2 +
//				(-P0 + 3*P1- 3*P2 + P3) * t3)

			point.x= 0.5*( (2*c[1].x) + (-c[0].x+c[2].x)*t + (2*c[0].x - 5*c[1].x + 4*c[2].x - c[3].x)*t2 + (-c[0].x + 3*c[1].x - 3*c[2].x + c[3].x)*t3 );
			point.y= 0.5*( (2*c[1].y) + (-c[0].y+c[2].y)*t + (2*c[0].y - 5*c[1].y + 4*c[2].y - c[3].y)*t2 + (-c[0].y + 3*c[1].y - 3*c[2].y + c[3].y)*t3 );
			
			return point;

		}
	};

    extend(CAAT.CatmullRom, CAAT.Curve, null);
})();/**
 * See LICENSE file.
 *
 * Hold a 2D point information.
 * Think about the possibility of turning CAAT.Point into {x:,y:}.
 *
 **/
(function() {

    /**
     *
     * A point defined by two coordinates.
     *
     * @param xpos {number}
     * @param ypos {number}
     *
     * @constructor
     */
	CAAT.Point= function(xpos, ypos, zpos) {
		this.x= xpos;
		this.y= ypos;
        this.z= zpos||0;
		return this;
	};
	
	CAAT.Point.prototype= {
		x:  0,
	    y:  0,
        z:  0,

        /**
         * Sets this point coordinates.
         * @param x {number}
         * @param y {number}
         *
         * @return this
         */
		set : function(x,y,z) {
			this.x= x;
			this.y= y;
            this.z= z||0;
			return this;
		},
        /**
         * Create a new CAAT.Point equal to this one.
         * @return {CAAT.Point}
         */
        clone : function() {
            var p= new CAAT.Point(this.x, this.y, this.z );
            return p;
        },
        /**
         * Translate this point to another position. The final point will be (point.x+x, point.y+y)
         * @param x {number}
         * @param y {number}
         *
         * @return this
         */
        translate : function(x,y,z) {
            this.x+= x;
            this.y+= y;
            this.z+= z||0;

            return this;
        },
        /**
         * Translate this point to another point.
         * @param aPoint {CAAT.Point}
         * @return this
         */
		translatePoint: function(aPoint) {
		    this.x += aPoint.x;
		    this.y += aPoint.y;
            this.z += aPoint.z;
		    return this;
		},
        /**
         * Substract a point from this one.
         * @param aPoint {CAAT.Point}
         * @return this
         */
		subtract: function(aPoint) {
			this.x -= aPoint.x;
			this.y -= aPoint.y;
            this.z -= aPoint.z;
			return this;
		},
        /**
         * Multiply this point by a scalar.
         * @param factor {number}
         * @return this
         */
		multiply: function(factor) {
			this.x *= factor;
			this.y *= factor;
            this.z *= factor;
			return this;
		},
        /**
         * Rotate this point by an angle. The rotation is held by (0,0) coordinate as center.
         * @param angle {number}
         * @return this
         */
		rotate: function(angle) {
			var x = this.x, y = this.y;
		    this.x = x * Math.cos(angle) - Math.sin(angle) * y;
		    this.y = x * Math.sin(angle) + Math.cos(angle) * y;
            this.z = 0;
		    return this;
		},
        /**
         *
         * @param angle {number}
         * @return this
         */
		setAngle: function(angle) {
		    var len = this.getLength();
		    this.x = Math.cos(angle) * len;
		    this.y = Math.sin(angle) * len;
            this.z = 0;
		    return this;
		},
        /**
         *
         * @param length {number}
         * @return this
         */
		setLength: function(length)	{
		    var len = this.getLength();
		    if (len)this.multiply(length / len);
		    else this.x = this.y = this.z = length;
		    return this;
		},
        /**
         * Normalize this point, that is, both set coordinates proportionally to values raning 0..1
         * @return this
         */
		normalize: function() {
		    var len = this.getLength();
		    this.x /= len;
		    this.y /= len;
            this.z /= len;
		    return this;
		},
        /**
         * Return the angle from -Pi to Pi of this point.
         * @return {number}
         */
		getAngle: function() {
		    return Math.atan2(this.y, this.x);
		},
        /**
         * Set this point coordinates proportinally to a maximum value.
         * @param max {number}
         * @return this
         */
		limit: function(max) {
			var aLenthSquared = this.getLengthSquared();
			if(aLenthSquared+0.01 > max*max)
			{
				var aLength = Math.sqrt(aLenthSquared);
				this.x= (this.x/aLength) * max;
				this.y= (this.y/aLength) * max;
                this.z= (this.z/aLength) * max;
			}
            return this;
		},
        /**
         * Get this point's lenght.
         * @return {number}
         */
		getLength: function() {
		    var length = Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
		    if ( length < 0.005 && length > -0.005) return 0.000001;
		    return length;

		},
        /**
         * Get this point's squared length.
         * @return {number}
         */
		getLengthSquared: function() {
		    var lengthSquared = this.x*this.x + this.y*this.y + this.z*this.z;
		    if ( lengthSquared < 0.005 && lengthSquared > -0.005) return 0;
		    return lengthSquared;
		},
        /**
         * Get the distance between two points.
         * @param point {CAAT.Point}
         * @return {number}
         */
		getDistance: function(point) {
			var deltaX = this.x - point.x;
			var deltaY = this.y - point.y;
            var deltaZ = this.z - point.z;
			return Math.sqrt( deltaX*deltaX + deltaY*deltaY + deltaZ*deltaZ );
		},
        /**
         * Get the squared distance between two points.
         * @param point {CAAT.Point}
         * @return {number}
         */
		getDistanceSquared: function(point) {
			var deltaX = this.x - point.x;
			var deltaY = this.y - point.y;
            var deltaZ = this.z - point.z;
			return deltaX*deltaX + deltaY*deltaY + deltaZ*deltaZ;
		},
        /**
         * Get a string representation.
         * @return {string}
         */
		toString: function() {
			return "(CAAT.Point)" +
                    " x:" + String(Math.round(Math.floor(this.x*10))/10) +
                    " y:" + String(Math.round(Math.floor(this.y*10))/10) +
                    " z:" + String(Math.round(Math.floor(this.z*10))/10);
		}
	};
})();/**
 * See LICENSE file.
 *
 * Get realtime Debug information of CAAT's activity.
 * Set CAAT.DEBUG=1 before any CAAT.Director object creation.
 * This class expects a DOM node called 'caat-debug' being a container element (DIV) where
 * it will append itself. If this node is not present, it will append itself to the document's body.
 *
 */

(function() {

    CAAT.Debug= function() {
        return this;
    };

    CAAT.Debug.prototype= {

        width:  0,
        height: 0,
        canvas: null,
        ctx:    null,

        SCALE:  50,

        setScale : function(s) {
            this.scale= s;
            return this;
        },

        initialize: function(w,h) {
            this.width= w;
            this.height= h;

            this.canvas= document.createElement('canvas');
            this.canvas.width= w;
            this.canvas.height=h;
            this.ctx= this.canvas.getContext('2d');

            this.ctx.fillStyle= 'black';
            this.ctx.fillRect(0,0,this.width,this.height);

            var dom= document.getElementById('caat-debug');
            if ( null===dom ) {
                document.body.appendChild( this.canvas );
            } else {
                dom.appendChild( this.canvas );
            }

            return this;
        },

        debugInfo : function( total, active ) {
            this.size_total= total;
            this.size_active= active;
            this.paint();
        },

        paint : function() {
            var ctx= this.ctx;
            var t=0;

            ctx.drawImage(
                this.canvas,
                1, 0, this.width-1, this.height,
                0, 0, this.width-1, this.height );

            ctx.strokeStyle= 'black';
            ctx.beginPath();
            ctx.moveTo( this.width-.5, 0 );
            ctx.lineTo( this.width-.5, this.height );
            ctx.stroke();

            ctx.strokeStyle= CAAT.FRAME_TIME<16 ? 'green' : CAAT.FRAME_TIME<25 ? 'yellow' : 'red';
            ctx.beginPath();
            ctx.moveTo( this.width-.5, this.height );
            ctx.lineTo( this.width-.5, this.height-(CAAT.FRAME_TIME*this.height/this.SCALE) );
            ctx.stroke();

            ctx.strokeStyle= 'rgba(0,255,0,.8)';
            ctx.beginPath();

            t= this.height-((15/this.SCALE*this.height)>>0)-.5;
            ctx.moveTo( 0, t );
            ctx.lineTo( this.width, t );
            ctx.stroke();

            ctx.strokeStyle= 'rgba(255,255,0,.8)';
            ctx.beginPath();
            t= this.height-((25/this.SCALE*this.height)>>0)-.5;
            ctx.moveTo( 0, t );
            ctx.lineTo( this.width, t );
            ctx.stroke();

            ctx.fillStyle='red';
            ctx.fillRect( 0,0,120,15);
            ctx.fillStyle='white';
            ctx.fillText(
                    '  Total: '+this.size_total+
                    '  Active: '+this.size_active,
                    0,
                    12 );
        }
    };
})();/**
 * See LICENSE file.
 *
 * Classes to define animable elements.
 * Actor is the superclass of every animable element in the scene graph. It handles the whole
 * affine transformation MatrixStack, rotation, translation, globalAlpha and Behaviours. It also
 * defines input methods.
 * TODO: add text presentation/animation effects.
 **/

(function() {

    /**
     * This class is the base for all animable entities in CAAT.
     * It defines an entity able to:
     *
     * <ul>
     * <li>Position itself on screen.
     * <li>Able to modify its presentation aspect via affine transforms.
     * <li>Take control of parent/child relationship.
     * <li>Take track of behaviors (@see CAAT.Behavior).
     * <li>Define a region on screen.
     * <li>Define alpha composition scope.
     * <li>Expose lifecycle.
     * <li>Manage itself in/out scene time.
     * <li>etc.
     * </ul>
     *
     * @constructor
     */
	CAAT.Actor = function() {
		this.behaviorList= [];
        this.lifecycleListenerList= [];
        this.AABB= new CAAT.Rectangle();
        this.viewVertices= [
                new CAAT.Point(0,0,0),
                new CAAT.Point(0,0,0),
                new CAAT.Point(0,0,0),
                new CAAT.Point(0,0,0)
        ];

        this.scaleAnchor=           this.ANCHOR_CENTER;
        this.rotateAnchor=          this.ANCHOR_CENTER;

        this.modelViewMatrix=       new CAAT.Matrix();
        this.worldModelViewMatrix=  new CAAT.Matrix();
        this.modelViewMatrixI=      new CAAT.Matrix();
        this.worldModelViewMatrixI= new CAAT.Matrix();
        this.tmpMatrix=             new CAAT.Matrix();

        this.resetTransform();
        this.setScale(1,1);
        this.setRotation(0);

		return this;
	};

	CAAT.Actor.prototype= {

        tmpMatrix :             null,

        lifecycleListenerList:	null,   // Array of life cycle listener
        behaviorList:           null,   // Array of behaviors to apply to the Actor
		parent:					null,   // Parent of this Actor. May be Scene.
		x:						0,      // x position on parent. In parent's local coord. system.
		y:						0,      // y position on parent. In parent's local coord. system.
		width:					0,      // Actor's width. In parent's local coord. system.
		height:					0,      // Actor's height. In parent's local coord. system.
		start_time:				0,      // Start time in Scene time.
		duration:				Number.MAX_VALUE,   // Actor duration in Scene time
		clip:					false,  // should clip the Actor's content against its contour.
        clipPath:               null,

        scaleX:					0,      // transformation. width scale parameter
		scaleY:					0,      // transformation. height scale parameter
		scaleTX:				.50,      // transformation. scale anchor x position
		scaleTY:				.50,      // transformation. scale anchor y position
		scaleAnchor:			0,      // transformation. scale anchor
		rotationAngle:			0,      // transformation. rotation angle in radians
		rotationY:				.50,      // transformation. rotation center y
        alpha:					1,      // alpha transparency value
        rotationX:				.50,      // transformation. rotation center x
        isGlobalAlpha:          false,  // is this a global alpha
        frameAlpha:             1,      // hierarchically calculated alpha for this Actor.
		expired:				false,  // set when the actor has been expired
		discardable:			false,  // set when you want this actor to be removed if expired
		pointed:				false,  // is the mouse pointer inside this actor
		mouseEnabled:			true,   // events enabled ?

        visible:                true,

		ANCHOR_CENTER:			0,      // constant values to determine different affine transform
		ANCHOR_TOP:				1,      // anchors.
		ANCHOR_BOTTOM:			2,
		ANCHOR_LEFT:			3,
		ANCHOR_RIGHT:			4,
		ANCHOR_TOP_LEFT:		5,
		ANCHOR_TOP_RIGHT:		6,
		ANCHOR_BOTTOM_LEFT:		7,
		ANCHOR_BOTTOM_RIGHT:	8,
        ANCHOR_CUSTOM:          9,

		fillStyle:				null,   // any canvas rendering valid fill style.
        strokeStyle:            null,   // any canvas rendering valid stroke style.
        time:                   0,      // Cache Scene time.
        AABB:                   null,   // CAAT.Rectangle
        viewVertices:           null,   // model to view transformed vertices.
        inFrame:                false,  // boolean indicating whether this Actor was present on last frame.

        dirty:                  true,   // model view is dirty ?
        wdirty:                 true,   // world model view is dirty ?
        oldX:                   -1,
        oldY:                   -1,
        
        modelViewMatrix:        null,   // model view matrix.
        worldModelViewMatrix:   null,   // world model view matrix.
        modelViewMatrixI:       null,   // model view matrix.
        worldModelViewMatrixI:  null,   // world model view matrix.

        glEnabled:              false,

        backgroundImage:        null,
        id:                     null,

        size_active:            1,      // number of animated children
        size_total:             1,

        getId : function()  {
            return this.id;
        },
        setId : function(id) {
            this.id= id;
            return this;
        },
        /**
         * Set this actor's parent.
         * @param parent {CAAT.ActorContainer}
         * @return this
         */
        setParent : function(parent) {
            this.parent= parent;
            return this;
        },
        /**
         * Set this actor's background image.
         * The need of a background image is to kept compatibility with the new CSSDirector class.
         * The image parameter can be either an Image/Canvas or a CAAT.SpriteImage instance. If an image
         * is supplied, it will be wrapped into a CAAT.SriteImage instance of 1 row by 1 column.
         * If the actor has set an image in the background, the paint method will draw the image, otherwise
         * and if set, will fill its background with a solid color.
         * If adjust_size_to_image is true, the host actor will be redimensioned to the size of one
         * single image from the SpriteImage (either supplied or generated because of passing an Image or
         * Canvas to the function). That means the size will be set to [width:SpriteImage.singleWidth,
         * height:singleHeight].
         *
         * WARN: if using a CSS renderer, the image supplied MUST be a HTMLImageElement instance.
         *
         * @see CAAT.SpriteImage
         *
         * @param image {Image|HTMLCanvasElement|CAAT.SpriteImage}
         * @param adjust_size_to_image {boolean} whether to set this actor's size based on image parameter.
         *
         * @return this
         */
        setBackgroundImage : function(image, adjust_size_to_image ) {
            if ( image ) {
//                if ( image instanceof Image ) {
                if ( !(image instanceof CAAT.SpriteImage) ) {
                    image= new CAAT.SpriteImage().initialize(image,1,1);
                }

                image.setOwner(this);
                this.backgroundImage= image;
                if ( typeof adjust_size_to_image==='undefined' || adjust_size_to_image ) {
                    this.width= image.singleWidth;
                    this.height= image.singleHeight;
                }

                this.glEnabled= true;
            }
            
            return this;
        },
        /**
         * Set the actor's SpriteImage index from animation sheet.
         * @see CAAT.SpriteImage
         * @param index {number}
         *
         * @return this
         */
        setSpriteIndex: function(index) {
            if ( this.backgroundImage ) {
                this.backgroundImage.setSpriteIndex(index);
            }

            return this;

        },
        /**
         * Set this actor's background SpriteImage offset displacement.
         * The values can be either positive or negative meaning the texture space of this background
         * image does not start at (0,0) but at the desired position.
         * @see CAAT.SpriteImage
         * @param ox {number} horizontal offset
         * @param oy {number} vertical offset
         *
         * @return this
         */
        setBackgroundImageOffset : function( ox, oy ) {
            if ( this.backgroundImage ) {
                this.backgroundImage.setOffset(ox,oy);
            }

            return this;
        },
        /**
         * Set this actor's background SpriteImage its animation sequence.
         * In its simplet's form a SpriteImage treats a given image as an array of rows by columns
         * subimages. If you define d Sprite Image of 2x2, you'll be able to draw any of the 4 subimages.
         * This method defines the animation sequence so that it could be set [0,2,1,3,2,1] as the
         * animation sequence
         * @param ii {Array<number>} an array of integers.
         */
        setAnimationImageIndex : function( ii ) {
            if ( this.backgroundImage ) {
                this.backgroundImage.setAnimationImageIndex(ii);
            }
            return this;
        },
        setChangeFPS : function(time) {
            if ( this.backgroundImage ) {
                this.backgroundImage.setChangeFPS(time);
            }
            return this;

        },
        /**
         * Set this background image transformation.
         * If GL is enabled, this parameter has no effect.
         * @param it any value from CAAT.SpriteImage.TR_*
         * @return this
         */
        setImageTransformation : function( it ) {
            if ( this.backgroundImage ) {
                this.backgroundImage.setSpriteTransformation(it);
            }
            return this;
        },
        /**
         * Center this actor at position (x,y).
         * @param x {number} x position
         * @param y {number} y position
         *
         * @return this
         * @deprecated
         */
        centerOn : function( x,y ) {
            this.setLocation( x-this.width/2, y-this.height/2 );
            return this;
        },
        /**
         * Center this actor at position (x,y).
         * @param x {number} x position
         * @param y {number} y position
         *
         * @return this
         */
        centerAt : function(x,y) {
            return this.centerOn(x,y);
        },
        /**
         * If GL is enables, get this background image's texture page, otherwise it will fail.
         * @return {CAAT.GLTexturePage}
         */
        getTextureGLPage : function() {
            return this.backgroundImage.image.__texturePage;            
        },
        /**
         * Set this actor invisible.
         * The actor is animated but not visible.
         * A container won't show any of its children if set visible to false.
         *
         * @param visible {boolean} set this actor visible or not.
         * @return this
         */
        setVisible : function(visible) {
            this.visible= visible;
            return this;
        },
        /**
         * Puts an Actor out of time line, that is, won't be transformed nor rendered.
         * @return this
         */
        setOutOfFrameTime : function() {
            this.setFrameTime(-1,0);
            return this;
        },
        /**
         * Adds an Actor's life cycle listener.
         * The developer must ensure the actorListener is not already a listener, otherwise
         * it will notified more than once.
         * @param actorListener {object} an object with at least a method of the form:
         * <code>actorLyfeCycleEvent( actor, string_event_type, long_time )</code>
         */
		addListener : function( actorListener ) {
			this.lifecycleListenerList.push(actorListener);
            return this;
		},
        /**
         * Removes an Actor's life cycle listener.
         * It will only remove the first occurrence of the given actorListener.
         * @param actorListener {object} an Actor's life cycle listener.
         */
        removeListener : function( actorListener ) {
            var n= this.lifecycleListenerList.length;
            while(n--) {
                if ( this.lifecycleListenerList[n]===actorListener ) {
                    // remove the nth element.
                    this.lifecycleListenerList.splice(n,1);
                    return;
                }
            }
        },
        /**
         * Set alpha composition scope. global will mean this alpha value will be its children maximum.
         * If set to false, only this actor will have this alpha value.
         * @param global {boolean} whether the alpha value should be propagated to children.
         */
        setGlobalAlpha : function( global ) {
            this.isGlobalAlpha= global;
            return this;
        },
        /**
         * Notifies the registered Actor's life cycle listener about some event.
         * @param sEventType an string indicating the type of event being notified.
         * @param time an integer indicating the time related to Scene's timeline when the event
         * is being notified.
         */
        fireEvent : function(sEventType, time)	{
            for( var i=0; i<this.lifecycleListenerList.length; i++ )	{
                this.lifecycleListenerList[i].actorLifeCycleEvent(this, sEventType, time);
            }
        },
        /**
         * Calculates the 2D bounding box in canvas coordinates of the Actor.
         * This bounding box takes into account the transformations applied hierarchically for
         * each Scene Actor.
         *
         * @private
         *
         */
        setScreenBounds : function() {

            this.viewVertices[0].set(0,          0);
            this.viewVertices[1].set(this.width, 0);
            this.viewVertices[2].set(this.width, this.height);
            this.viewVertices[3].set(0,          this.height);

            this.modelToView( this.viewVertices );

            var xmin= Number.MAX_VALUE, xmax=Number.MIN_VALUE;
            var ymin= Number.MAX_VALUE, ymax=Number.MIN_VALUE;

            for( var i=0; i<4; i++ ) {
                if ( this.viewVertices[i].x < xmin ) {
                    xmin=this.viewVertices[i].x;
                }
                if ( this.viewVertices[i].x > xmax ) {
                    xmax=this.viewVertices[i].x;
                }
                if ( this.viewVertices[i].y < ymin ) {
                    ymin=this.viewVertices[i].y;
                }
                if ( this.viewVertices[i].y > ymax ) {
                    ymax=this.viewVertices[i].y;
                }
            }

            this.AABB.x= xmin;
            this.AABB.y= ymin;
            this.AABB.width=  (xmax-xmin);
            this.AABB.height= (ymax-ymin);

            return this;
        },
        /**
         * Sets this Actor as Expired.
         * If this is a Container, all the contained Actors won't be nor drawn nor will receive
         * any event. That is, expiring an Actor means totally taking it out the Scene's timeline.
         * @param time {number} an integer indicating the time the Actor was expired at.
         * @return this.
         */
        setExpired : function(time) {
            this.expired= true;
            this.fireEvent('expired',time);
            return this;
        },
        /**
         * Enable or disable the event bubbling for this Actor.
         * @param enable {boolean} a boolean indicating whether the event bubbling is enabled.
         * @return this
         */
        enableEvents : function( enable ) {
            this.mouseEnabled= enable;
            return this;
        },
        /**
         * Removes all behaviors from an Actor.
         * @return this
         */
		emptyBehaviorList : function() {
			this.behaviorList=[];
            return this;
		},
        /**
         * Caches a fillStyle in the Actor.
         * @param style a valid Canvas rendering context fillStyle.
         * @return this
         */
        setFillStyle : function( style ) {
			this.fillStyle= style;
            return this;
        },
        /**
         * Caches a stroke style in the Actor.
         * @param style a valid canvas rendering context stroke style.
         * @return this
         */
        setStrokeStyle : function( style ) {
            this.strokeStyle= style;
            return this;
        },
        /**
         * @deprecated
         * @param paint
         */
		setPaint : function( paint )	{
            return this.setFillStyle(paint);
		},
        /**
         * Stablishes the Alpha transparency for the Actor.
         * If it globalAlpha enabled, this alpha will the maximum alpha for every contained actors.
         * The alpha must be between 0 and 1.
         * @param alpha a float indicating the alpha value.
         * @return this
         */
		setAlpha : function( alpha )	{
			this.alpha= alpha;
            return this;
		},
        /**
         * Remove all transformation values for the Actor.
         * @return this
         */
		resetTransform : function () {
			this.rotationAngle=0;
			this.rotateAnchor=0;
			this.rotationX=.5;
			this.rotationY=.5;
			this.scaleX=1;
			this.scaleY=1;
			this.scaleTX=.5;
			this.scaleTY=.5;
			this.scaleAnchor=0;
            this.oldX=-1;
            this.oldY=-1;
            this.dirty= true;

            return this;
		},
        /**
         * Sets the time life cycle for an Actor.
         * These values are related to Scene time.
         * @param startTime an integer indicating the time until which the Actor won't be visible on the Scene.
         * @param duration an integer indicating how much the Actor will last once visible.
         * @return this
         */
		setFrameTime : function( startTime, duration ) {
			this.start_time= startTime;
			this.duration= duration;
			this.expired= false;
            this.dirty= true;

            return this;
		},
        /**
         * This method should me overriden by every custom Actor.
         * It will be the drawing routine called by the Director to show every Actor.
         * @param director the CAAT.Director instance that contains the Scene the Actor is in.
         * @param time an integer indicating the Scene time in which the drawing is performed.
         */
		paint : function(director, time) {
            if ( this.backgroundImage ) {
                this.backgroundImage.paint(director,time,0,0);
            } else if ( this.fillStyle ) {
                var ctx= director.crc;
				ctx.fillStyle= this.fillStyle;
				ctx.fillRect(0,0,this.width,this.height );
			}

		},
        /**
         * A helper method to setScaleAnchored with an anchor of ANCHOR_CENTER
         *
         * @see setScaleAnchored
         *
         * @param sx a float indicating a width size multiplier.
         * @param sy a float indicating a height size multiplier.
         * @return this
         */
		setScale : function( sx, sy )    {
			//this.setScaleAnchored( sx, sy, this.width/2, this.height/2 );
            this.setScaleAnchored( sx, sy, .5, .5 );
            this.dirty= true;
            return this;
		},
        getAnchorPercent : function( anchor ) {

            var anchors=[
                .50,.50,   .50,0,  .50,1.00,
                0,.50,   1.00,.50, 0,0,
                1.00,0,  0,1.00,  1.00,1.00
            ];

            return { x: anchors[anchor*2], y: anchors[anchor*2+1] };
        },
        /**
         * Private.
         * Gets a given anchor position referred to the Actor.
         * @param anchor
         * @return an object of the form { x: float, y: float }
         */
		getAnchor : function( anchor ) {
			var tx=0, ty=0;

			switch( anchor ) {
            case this.ANCHOR_CENTER:
//                tx= this.width/2;
//                ty= this.height/2;
                    tx= .5;
                    ty= .5;
                break;
            case this.ANCHOR_TOP:
//                tx= this.width/2;
                    tx= .5;
                ty= 0;
                break;
            case this.ANCHOR_BOTTOM:
//                tx= this.width/2;
//                ty= this.height;
                    tx= .5;
                    ty= 1;
                break;
            case this.ANCHOR_LEFT:
//                tx= 0;
//                ty= this.height/2;
                    tx= 0;
                    ty= .5;
                break;
            case this.ANCHOR_RIGHT:
//                tx= this.width;
//                ty= this.height/2;
                    tx= 1;
                    ty= .5;
                break;
            case this.ANCHOR_TOP_RIGHT:
//                tx= this.width;
                    tx= 1;
                ty= 0;
                break;
            case this.ANCHOR_BOTTOM_LEFT:
                tx= 0;
//                ty= this.height;
                    ty= 1;
                break;
            case this.ANCHOR_BOTTOM_RIGHT:
//                tx= this.width;
//                ty= this.height;
                    tx= 1;
                    ty= 1;
                break;
            case this.ANCHOR_TOP_LEFT:
                tx= 0;
                ty= 0;
                break;
	        }

			return {x: tx, y: ty};
		},
        /**
         * Modify the dimensions on an Actor.
         * The dimension will not affect the local coordinates system in opposition
         * to setSize or setBounds.
         *
         * @param sx {number} width scale.
         * @param sy {number} height scale.
         * @param anchorx {number} x anchor to perform the Scale operation.
         * @param anchory {number} y anchor to perform the Scale operation.
         *
         * @return this;
         */
		setScaleAnchored : function( sx, sy, anchorx, anchory )    {
            this.scaleTX= anchorx;
            this.scaleTY= anchory;

			this.scaleX=sx;
			this.scaleY=sy;

            this.dirty= true;

            return this;
		},
        /**
         * A helper method for setRotationAnchored. This methods stablishes the center
         * of rotation to be the center of the Actor.
         *
         * @param angle a float indicating the angle in radians to rotate the Actor.
         * @return this
         */
	    setRotation : function( angle )	{
			this.setRotationAnchored( angle, .5, .5 ); //this.width/2, this.height/2 );
            return this;
	    },
        /**
         * This method sets Actor rotation around a given position.
         * @param angle {number} indicating the angle in radians to rotate the Actor.
         * @param rx {number} value in the range 0..1
         * @param ry {number} value in the range 0..1
         * @return this;
         */
	    setRotationAnchored : function( angle, rx, ry ) {
	        this.rotationAngle= angle;
	        this.rotationX= rx?rx:0;
	        this.rotationY= ry?ry:0;
            this.dirty= true;
            return this;
	    },
        /**
         * Sets an Actor's dimension
         * @param w a float indicating Actor's width.
         * @param h a float indicating Actor's height.
         * @return this
         */
	    setSize : function( w, h )   {
	        this.width= w|0;
	        this.height= h|0;
            this.dirty= true;

            return this;
	    },
        /**
         * Set location and dimension of an Actor at once.
         *
         * @param x{number} a float indicating Actor's x position.
         * @param y{number} a float indicating Actor's y position
         * @param w{number} a float indicating Actor's width
         * @param h{number} a float indicating Actor's height
         * @return this
         */
	    setBounds : function(x, y, w, h)  {
            this.x= x|0;
            this.y= y|0;
            this.width= w|0;
            this.height= h|0;
            this.dirty= true;

            return this;
	    },
        /**
         * This method sets the position of an Actor inside its parent.
         *
         * @param x{number} a float indicating Actor's x position
         * @param y{number} a float indicating Actor's y position
         * @return this
         */
	    setLocation : function( x, y ) {

            this.x= x|0;
            this.y= y|0;

            this.oldX= x|0;
            this.oldY= y|0;

            this.dirty= true;

            return this;
	    },
        /**
         * This method is called by the Director to know whether the actor is on Scene time.
         * In case it was necessary, this method will notify any life cycle behaviors about
         * an Actor expiration.
         * @param time {number} time indicating the Scene time.
         *
         * @private
         *
         */
	    isInAnimationFrame : function(time)    {
            if ( this.expired )	{
                return false;
            }

	        if ( this.duration===Number.MAX_VALUE ) {
	            return this.start_time<=time;
	        }

			if ( time>=this.start_time+this.duration )	{
				if ( !this.expired )	{
					this.setExpired(time);
				}

				return false;
			}

	        return this.start_time<=time && time<this.start_time+this.duration;
	    },
        /**
         * Checks whether a coordinate is inside the Actor's bounding box.
         * @param x {number} a float
         * @param y {number} a float
         *
         * @return boolean indicating whether it is inside.
         */
	    contains : function(x, y) {
	        return x>=0 && y>=0 && x<this.width && y<this.height;
	    },
        /**
         * This method must be called explicitly by every CAAT Actor.
         * Making the life cycle explicitly initiated has always been a good idea.
         *
         * @return this
         * @deprecated no longer needed.
         */
		create : function()	{
            return this;
		},
        /**
         * Add a Behavior to the Actor.
         * An Actor accepts an undefined number of Behaviors.
         *
         * @param behavior {CAAT.Behavior} a CAAT.Behavior instance
         * @return this
         */
		addBehavior : function( behavior )	{
			this.behaviorList.push(behavior);
            return this;
		},
        /**
         * Remove a Behavior from the Actor.
         * If the Behavior is not present at the actor behavior collection nothing happends.
         *
         * @param behavior {CAAT.Behavior} a CAAT.Behavior instance.
         */
        removeBehaviour : function( behavior ) {
            var n= this.behaviorList.length-1;
            while(n) {
                if ( this.behaviorList[n]===behavior ) {
                    this.behaviorList.splice(n,1);
                    return this;
                }
            }

            return this;
        },
        /**
         * Remove a Behavior with id param as behavior identifier from this actor.
         * This function will remove ALL behavior instances with the given id.
         *
         * @param id {number} an integer.
         * return this;
         */
        removeBehaviorById : function( id ) {
            for( var n=0; n<this.behaviorList.length; n++ ) {
                if ( this.behaviorList[n].id===id) {
                    this.behaviorList.splice(n,1);
                }
            }

            return this;

        },
        getBehavior : function(id)  {
            for( var n=0; n<this.behaviorList.length; n++ ) {
                if ( this.behaviorList[n].id===id) {
                    return this.behaviorList[n];
                }
            }
            return null;
        },
        /**
         * Set discardable property. If an actor is discardable, upon expiration will be removed from
         * scene graph and hence deleted.
         * @param discardable {boolean} a boolean indicating whether the Actor is discardable.
         * @return this
         */
        setDiscardable : function( discardable ) {
            this.discardable= discardable;
            return this;
        },
        /**
         * This method will be called internally by CAAT when an Actor is expired, and at the
         * same time, is flagged as discardable.
         * It notifies the Actor life cycle listeners about the destruction event.
         *
         * @param time an integer indicating the time at wich the Actor has been destroyed.
         *
         * @private
         *
         */
		destroy : function(time)	{
            if ( this.parent ) {
                this.parent.removeChild(this);
            }

            this.fireEvent('destroyed',time);
		},
        /**
         * Transform a point or array of points in model space to view space.
         *
         * @param point {CAAT.Point|Array} an object of the form {x : float, y: float}
         *
         * @return the source transformed elements.
         *
         * @private
         *
         */
        modelToView : function(point) {
            if ( point instanceof Array ) {
                for( var i=0; i<point.length; i++ ) {
                    this.worldModelViewMatrix.transformCoord(point[i]);
                }
            }
            else {
                this.worldModelViewMatrix.transformCoord(point);
            }

            return point;
        },
        /**
         * Transform a local coordinate point on this Actor's coordinate system into
         * another point in otherActor's coordinate system.
         * @param point {CAAT.Point}
         * @param otherActor {CAAT.Actor}
         */
        modelToModel : function( point, otherActor )   {
            return otherActor.viewToModel( this.modelToView( point ) );
        },
        /**
         * Transform a point from model to view space.
         * <p>
         * WARNING: every call to this method calculates
         * actor's world model view matrix.
         *
         * @param point {CAAT.Point} a point in screen space to be transformed to model space.
         *
         * @return the source point object
         *
         *
         */
		viewToModel : function(point) {
            this.worldModelViewMatrixI= this.worldModelViewMatrix.getInverse();
            this.worldModelViewMatrixI.transformCoord(point);
			return point;
		},
        /**
         * Private
         * This method does the needed point transformations across an Actor hierarchy to devise
         * whether the parameter point coordinate lies inside the Actor.
         * @param point {CAAT.Point}
         *
         * @return null if the point is not inside the Actor. The Actor otherwise.
         */
	    findActorAtPosition : function(point) {
			if ( !this.mouseEnabled || !this.isInAnimationFrame(this.time) ) {
				return null;
			}

            this.modelViewMatrixI= this.modelViewMatrix.getInverse();
            this.modelViewMatrixI.transformCoord(point);
	        return this.contains(point.x, point.y) ? this :null;
	    },
        /**
         * Enables a default dragging routine for the Actor.
         * This default dragging routine allows to:
         *  <li>scale the Actor by pressing shift+drag
         *  <li>rotate the Actor by pressing control+drag
         *  <li>scale non uniformly by pressing alt+shift+drag
         *
         * @return this
         */
	    enableDrag : function() {

			this.ax= 0;
			this.ay= 0;
			this.mx= 0;
			this.my= 0;
			this.asx=1;
			this.asy=1;
			this.ara=0;
			this.screenx=0;
			this.screeny=0;

            /**
             * Mouse enter handler for default drag behavior.
             * @param mouseEvent {CAAT.MouseEvent}
             *
             * @ignore
             */
	        this.mouseEnter= function(mouseEvent) {
				this.__d_ax= -1;
				this.__d_ay= -1;
		        this.pointed= true;
		        CAAT.setCursor('move');
	        };

            /**
             * Mouse exit handler for default drag behavior.
             * @param mouseEvent {CAAT.MouseEvent}
             *
             * @ignore
             */
            this.mouseExit = function(mouseEvent) {
                this.__d_ax = -1;
                this.__d_ay = -1;
                this.pointed = false;
                CAAT.setCursor('default');
            };

            /**
             * Mouse move handler for default drag behavior.
             * @param mouseEvent {CAAT.MouseEvent}
             *
             * @ignore
             */
            this.mouseMove = function(mouseEvent) {
            };

            /**
             * Mouse up handler for default drag behavior.
             * @param mouseEvent {CAAT.MouseEvent}
             *
             * @ignore
             */
            this.mouseUp = function(mouseEvent) {
                this.__d_ax = -1;
                this.__d_ay = -1;
            };

            /**
             * Mouse drag handler for default drag behavior.
             * @param mouseEvent {CAAT.MouseEvent}
             *
             * @ignore
             */
            this.mouseDrag = function(mouseEvent) {

                var pt;

                pt= this.modelToView( new CAAT.Point(mouseEvent.x, mouseEvent.y ) );
                this.parent.viewToModel( pt );

                if (this.__d_ax === -1 || this.__d_ay === -1) {
                    this.__d_ax = pt.x;
                    this.__d_ay = pt.y;
                    this.__d_asx = this.scaleX;
                    this.__d_asy = this.scaleY;
                    this.__d_ara = this.rotationAngle;
                    this.__d_screenx = mouseEvent.screenPoint.x;
                    this.__d_screeny = mouseEvent.screenPoint.y;
                }

                if (mouseEvent.isShiftDown()) {
                    var scx = (mouseEvent.screenPoint.x - this.__d_screenx) / 100;
                    var scy = (mouseEvent.screenPoint.y - this.__d_screeny) / 100;
                    if (!mouseEvent.isAltDown()) {
                        var sc = Math.max(scx, scy);
                        scx = sc;
                        scy = sc;
                    }
                    this.setScale(scx + this.__d_asx, scy + this.__d_asy);

                } else if (mouseEvent.isControlDown()) {
                    var vx = mouseEvent.screenPoint.x - this.__d_screenx;
                    var vy = mouseEvent.screenPoint.y - this.__d_screeny;
                    this.setRotation(-Math.atan2(vx, vy) + this.__d_ara);
                } else {
                    this.x += pt.x-this.__d_ax;
                    this.y += pt.y-this.__d_ay;
                }

                this.__d_ax= pt.x;
                this.__d_ay= pt.y;
            };

            return this;
	    },
        /**
         * Default mouseClick handler.
         * Mouse click events are received after a call to mouseUp method if no dragging was in progress.
         *
         * @param mouseEvent {CAAT.MouseEvent}
         */
	    mouseClick : function(mouseEvent) {
	    },
        /**
         * Default double click handler
         *
         * @param mouseEvent {CAAT.MouseEvent}
         */
	    mouseDblClick : function(mouseEvent) {
	    },
        /**
         * Default mouse enter on Actor handler.
         * @param mouseEvent {CAAT.MouseEvent}
         */
		mouseEnter : function(mouseEvent) {
	        this.pointed= true;
		},
        /**
         * Default mouse exit on Actor handler.
         *
         * @param mouseEvent {CAAT.MouseEvent}
         */
		mouseExit : function(mouseEvent) {
			this.pointed= false;
		},
        /**
         * Default mouse move inside Actor handler.
         *
         * @param mouseEvent {CAAT.MouseEvent}
         */
		mouseMove : function(mouseEvent) {
		},
        /**
         * default mouse press in Actor handler.
         *
         * @param mouseEvent {CAAT.MouseEvent}
         */
		mouseDown : function(mouseEvent) {
		},
        /**
         * default mouse release in Actor handler.
         *
         * @param mouseEvent {CAAT.MouseEvent}
         */
		mouseUp : function(mouseEvent) {
		},
        /**
         * default Actor mouse drag handler.
         *
         * @param mouseEvent {CAAT.MouseEvent}
         */
		mouseDrag : function(mouseEvent) {
		},
        /**
         * Draw a bounding box with on-screen coordinates regardless of the transformations
         * applied to the Actor.
         *
         * @param director {CAAT.Director} object instance that contains the Scene the Actor is in.
         * @param time {number} integer indicating the Scene time when the bounding box is to be drawn.
         */
        drawScreenBoundingBox : function( director, time ) {
            if ( null!==this.AABB && this.inFrame ) {
                var s= this.AABB;
                director.ctx.strokeRect( s.x, s.y, s.width, s.height );
            }
        },
        /**
         * Private
         * This method is called by the Director instance.
         * It applies the list of behaviors the Actor has registered.
         *
         * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
         * @param time an integer indicating the Scene time when the bounding box is to be drawn.
         */
		animate : function(director, time) {
            if ( !this.isInAnimationFrame(time) ) {
                this.inFrame= false;
                this.dirty= true;
                return false;
            }

            if ( this.x!==this.oldX || this.y!==this.oldY ) {
                this.dirty= true;
                this.oldX= this.x;
                this.oldY= this.y;
            }

			for( var i=0; i<this.behaviorList.length; i++ )	{
				this.behaviorList[i].apply(time,this);
			}

            /*
                If we have a mask applied, apply behaviors as well.
             */
            if ( this.clipPath ) {
                if ( this.clipPath.applyBehaviors ) {
                    this.clipPath.applyBehaviors(time);
                }
            }

            // transformation stuff.
            this.setModelViewMatrix(director.glEnabled);

            this.inFrame= true;

            return true;
		},
        /**
         * Set this model view matrix if the actor is Dirty.
         * 
         * @return this
         */
        setModelViewMatrix : function(glEnabled) {
            var c,s,_m00,_m01,_m10,_m11;
            var mm0, mm1, mm2, mm3, mm4, mm5;
            var mm;

            this.wdirty= false;

            if ( this.dirty ) {

                mm= this.modelViewMatrix.matrix;

                mm0= 1;
                mm1= 0;
                mm2= mm[2];
                mm3= 0;
                mm4= 1;
                mm5= mm[5];

                mm2= this.x;
                mm5= this.y;

                if ( this.rotationAngle ) {

                    var rx= this.rotationX*this.width;
                    var ry= this.rotationY*this.height;

                    mm2+= mm0*rx + mm1*ry;
                    mm5+= mm3*rx + mm4*ry;

                    c= Math.cos( this.rotationAngle );
                    s= Math.sin( this.rotationAngle );
                    _m00= mm0;
                    _m01= mm1;
                    _m10= mm3;
                    _m11= mm4;
                    mm0=  _m00*c + _m01*s;
                    mm1= -_m00*s + _m01*c;
                    mm3=  _m10*c + _m11*s;
                    mm4= -_m10*s + _m11*c;

                    mm2+= -mm0*rx - mm1*ry;
                    mm5+= -mm3*rx - mm4*ry;
                }
                if ( this.scaleX!=1 || this.scaleY!=1 ) {

                    var sx= this.scaleTX*this.width;
                    var sy= this.scaleTY*this.height;

                    mm2+= mm0*sx + mm1*sy;
                    mm5+= mm3*sx + mm4*sy;

                    mm0= mm0*this.scaleX;
                    mm1= mm1*this.scaleY;
                    mm3= mm3*this.scaleX;
                    mm4= mm4*this.scaleY;

                    mm2+= -mm0*sx - mm1*sy;
                    mm5+= -mm3*sx - mm4*sy;
                }

                mm[0]= mm0;
                mm[1]= mm1;
                mm[2]= mm2;
                mm[3]= mm3;
                mm[4]= mm4;
                mm[5]= mm5;

/*
                mm[2]+= this.x;
                mm[5]+= this.y;
                if ( this.rotationAngle ) {
//                    this.modelViewMatrix.multiply( m.setTranslate( this.rotationX, this.rotationY) );
//                    this.modelViewMatrix.multiply( m.setRotation( this.rotationAngle ) );
//                    this.modelViewMatrix.multiply( m.setTranslate( -this.rotationX, -this.rotationY) );                    c= Math.cos( this.rotationAngle );
                }
                if ( this.scaleX!=1 || this.scaleY!=1 && (this.scaleTX || this.scaleTY )) {
//                    this.modelViewMatrix.multiply( m.setTranslate( this.scaleTX , this.scaleTY ) );
//                    this.modelViewMatrix.multiply( m.setScale( this.scaleX, this.scaleY ) );
//                    this.modelViewMatrix.multiply( m.setTranslate( -this.scaleTX , -this.scaleTY ) );

                }
*/
            }


            if ( this.parent ) {
                if ( this.dirty || this.parent.wdirty ) {
                    this.worldModelViewMatrix.copy( this.parent.worldModelViewMatrix );
                    this.worldModelViewMatrix.multiply( this.modelViewMatrix );
                    this.wdirty= true;
                }
            } else {
                if ( this.dirty ) {
                    this.wdirty= true;
                }
                //this.worldModelViewMatrix.copy( this.modelViewMatrix );
                this.worldModelViewMatrix.identity();
            }

            if ( glEnabled && (this.dirty || this.wdirty) ) {
                this.setScreenBounds();
            }
            this.dirty= false;


            return this;
        },
        /**
         * @private.
         * This method will be called by the Director to set the whole Actor pre-render process.
         *
         * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
         * @param time an integer indicating the Scene time when the bounding box is to be drawn.
         *
         * @return boolean indicating whether the Actor isInFrameTime
         */
        paintActor : function(director, time) {

            if (!this.visible) {
                return true;
            }

            var ctx= director.ctx;

            this.frameAlpha= this.parent ? this.parent.frameAlpha*this.alpha : 1;
            ctx.globalAlpha= this.frameAlpha;

            this.worldModelViewMatrix.transformRenderingContext(ctx);

            if ( this.clip ) {
                ctx.beginPath();
                if (!this.clipPath ) {
                    ctx.rect(0,0,this.width,this.height);
                } else {
                    this.clipPath.applyAsPath(ctx);
                }
                ctx.clip();
            }

            this.paint(director, time);

            return true;
        },
        /**
         * for js2native
         * @param director
         * @param time
         */
        __paintActor : function(director, time) {
            if (!this.visible) {
                return true;
            }
            var ctx= director.ctx;

            // global opt: set alpha as owns alpha, not take globalAlpha procedure.
            this.frameAlpha= this.alpha;

            var m= this.worldModelViewMatrix.matrix;
            ctx.setTransform( m[0], m[3], m[1], m[4], m[2], m[5], this.frameAlpha );
            this.paint(director, time);
            return true;
        },

        /**
         * Set coordinates and uv values for this actor.
         * This function uses Director's coords and indexCoords values.
         * @param director
         * @param time
         */
        paintActorGL : function(director,time) {

            this.frameAlpha= this.parent.frameAlpha*this.alpha;

            if ( !this.glEnabled || !this.visible) {
                return;
            }

            if ( this.glNeedsFlush(director) ) {
                director.glFlush();
                this.glSetShader(director);

                if ( !this.__uv ) {
                    this.__uv= new Float32Array(8);
                }
                if ( !this.__vv ) {
                    this.__vv= new Float32Array(12);
                }

                this.setGLCoords( this.__vv, 0 );
                this.setUV( this.__uv, 0 );
                director.glRender(this.__vv, 12, this.__uv);

                return;
            }

            var glCoords=       director.coords;
            var glCoordsIndex=  director.coordsIndex;

            ////////////////// XYZ
            this.setGLCoords(glCoords, glCoordsIndex);
            director.coordsIndex= glCoordsIndex+12;

            ////////////////// UV
            this.setUV( director.uv, director.uvIndex );
            director.uvIndex+= 8;
        },
        /**
         * TODO: set GLcoords for different image transformations.
         * @param glCoords
         * @param glCoordsIndex
         * @param z
         */
        setGLCoords : function( glCoords, glCoordsIndex ) {

            var vv=             this.viewVertices;
            glCoords[glCoordsIndex++]= vv[0].x;
            glCoords[glCoordsIndex++]= vv[0].y;
            glCoords[glCoordsIndex++]= 0;

            glCoords[glCoordsIndex++]= vv[1].x;
            glCoords[glCoordsIndex++]= vv[1].y;
            glCoords[glCoordsIndex++]= 0;

            glCoords[glCoordsIndex++]= vv[2].x;
            glCoords[glCoordsIndex++]= vv[2].y;
            glCoords[glCoordsIndex++]= 0;

            glCoords[glCoordsIndex++]= vv[3].x;
            glCoords[glCoordsIndex++]= vv[3].y;
            glCoords[glCoordsIndex++]= 0;

        },
        /**
         * Set UV for this actor's quad.
         *
         * @param uvBuffer {Float32Array}
         * @param uvIndex {number}
         */
        setUV : function( uvBuffer, uvIndex ) {
            this.backgroundImage.setUV(uvBuffer, uvIndex);
        },
        /**
         * Test for compulsory gl flushing:
         *  1.- opacity has changed.
         *  2.- texture page has changed.
         *
         */
        glNeedsFlush : function(director) {
             if ( this.getTextureGLPage()!==director.currentTexturePage ) {
                return true;
            }
            if ( this.frameAlpha!==director.currentOpacity ) {
                return true;
            }
            return false;
        },
        /**
         * Change texture shader program parameters.
         * @param director
         */
        glSetShader : function(director) {
            // BUGBUG BUGBUG BUGBUG change texture page if needed.
            if ( this.frameAlpha!==director.currentOpacity ) {
                director.setGLCurrentOpacity(this.frameAlpha);
            }
        },
        /**
         * @private.
         * This method is called after the Director has transformed and drawn a whole frame.
         *
         * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
         * @param time an integer indicating the Scene time when the bounding box is to be drawn.
         * @return this
         *
         * @deprecated
         */
        endAnimate : function(director,time) {
            return this;
        },
        initialize : function(overrides) {
            if (overrides) {
               for (var i in overrides) {
                  this[i] = overrides[i];
               }
            }

            return this;
        },
        /**
         * Set this Actor's clipping area.
         * @param enable {boolean} enable clip area.
         * @param clipPath {CAAT.Path=} An optional path to apply clip with. If enabled and clipPath is not set,
         *  a rectangle will be used.
         */
        setClip : function( enable, clipPath ) {
            this.clip= enable;
            this.clipPath= clipPath;
            return this;
        },
        /**
         *
         * @param time {Number=}
         * @return this
         */
        cacheAsBitmap : function(time) {
            time= time||0;
            var canvas= document.createElement('canvas');
            canvas.width= this.width;
            canvas.height= this.height;
            var ctx= canvas.getContext('2d');
            var director= {
                ctx: ctx,
                crc: ctx,
                modelViewMatrix: new CAAT.Matrix()
            };

            this.paintActor(director,time);
            this.setBackgroundImage(canvas);
            return this;
        },
        /**
         * Set this actor behavior as if it were a Button. The actor size will be set as SpriteImage's
         * single size.
         * 
         * @param buttonImage {CAAT.SpriteImage} sprite image with button's state images.
         * @param _iNormal {number} button's normal state image index
         * @param _iOver {number} button's mouse over state image index
         * @param _iPress {number} button's pressed state image index
         * @param _iDisabled {number} button's disabled state image index
         * @param fn {function(button{CAAT.Actor})} callback function
         */
        setAsButton : function( buttonImage, iNormal, iOver, iPress, iDisabled, fn ) {

            var me= this;
            
            this.setBackgroundImage(buttonImage, true);

            this.iNormal=       iNormal || 0;
            this.iOver=         iOver || iNormal;
            this.iPress=        iPress || iNormal;
            this.iDisabled=     iDisabled || iNormal;
            this.iCurrent=      iNormal;
            this.fnOnClick=     fn;
            this.enabled=       true;

            this.setSpriteIndex( iNormal );

            /**
             * Enable or disable the button.
             * @param enabled {boolean}
             * @ignore
             */
            this.setEnabled= function( enabled ) {
                this.enabled= enabled;
            };

            /**
             * This method will be called by CAAT *before* the mouseUp event is fired.
             * @param event {CAAT.MouseEvent}
             * @ignore
             */
            this.actionPerformed= function(event) {
                if ( this.enabled && null!==this.fnOnClick ) {
                    this.fnOnClick(this);
                }
            };

            /**
             * Button's mouse enter handler. It makes the button provide visual feedback
             * @param mouseEvent {CAAT.MouseEvent}
             * @ignore
             */
            this.mouseEnter= function(mouseEvent) {
                if ( this.dragging ) {
                    this.setSpriteIndex( this.iPress );
                } else {
                    this.setSpriteIndex( this.iOver );
                }
                CAAT.setCursor('pointer');
            };

            /**
             * Button's mouse exit handler. Release visual apperance.
             * @param mouseEvent {CAAT.MouseEvent}
             * @ignore
             */
            this.mouseExit= function(mouseEvent) {
                this.setSpriteIndex( this.iNormal );
                CAAT.setCursor('default');
            };

            /**
             * Button's mouse down handler.
             * @param mouseEvent {CAAT.MouseEvent}
             * @ignore
             */
            this.mouseDown= function(mouseEvent) {
                this.setSpriteIndex( this.iPress );
            };

            /**
             * Button's mouse up handler.
             * @param mouseEvent {CAAT.MouseEvent}
             * @ignore
             */
            this.mouseUp= function(mouseEvent) {
                this.setSpriteIndex( this.iNormal );
                this.dragging= false;
            };

            /**
             * Button's mouse click handler. Do nothing by default. This event handler will be
             * called ONLY if it has not been drag on the button.
             * @param mouseEvent {CAAT.MouseEvent}
             * @ignore
             */
            this.mouseClick= function(mouseEvent) {
            };

            /**
             * Button's mouse drag handler.
             * @param mouseEvent {CAAT.MouseEvent}
             * @ignore
             */
            this.mouseDrag= function(mouseEvent)  {
                this.dragging= true;
            };

            this.setButtonImageIndex= function(_normal, _over, _press, _disabled ) {
                this.iNormal=    _normal;
                this.iOver=      _over;
                this.iPress=     _press;
                this.iDisabled=  _disabled;
                this.setSpriteIndex( iNormal );
                return this;
            };

            return this;
        }
	};

    if ( CAAT.NO_PERF ) {
        CAAT.Actor.prototype.paintActor= CAAT.Actor.prototype.__paintActor;
    }

})();


(function() {

    /**
     * This class is a general container of CAAT.Actor instances. It extends the concept of an Actor
     * from a single entity on screen to a set of entities with a parent/children relationship among
     * them.
     * <p>
     * This mainly overrides default behavior of a single entity and exposes methods to manage its children
     * collection.
     *
     * @constructor
     * @extends CAAT.Actor
     */
	CAAT.ActorContainer= function() {
		CAAT.ActorContainer.superclass.constructor.call(this);
		this.childrenList= [];
        this.pendingChildrenList= [];
		return this;
	};


	CAAT.ActorContainer.prototype= {

        childrenList :          null,       // the list of children contained.
        activeChildren:         null,
        pendingChildrenList:    null,

        /**
         * Draws this ActorContainer and all of its children screen bounding box.
         *
         * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
         * @param time an integer indicating the Scene time when the bounding box is to be drawn.
         */
        drawScreenBoundingBox : function( director, time ) {

            if (!this.inFrame) {
                return;
            }

            var cl= this.childrenList;
            for( var i=0; i<cl.length; i++ ) {
                cl[i].drawScreenBoundingBox(director,time);
            }
            CAAT.ActorContainer.superclass.drawScreenBoundingBox.call(this,director,time);

        },
        /**
         * Removes all children from this ActorContainer.
         *
         * @return this
         */
        emptyChildren : function() {
            this.childrenList= [];

            return this;
        },
        /**
         * Private
         * Paints this container and every contained children.
         *
         * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
         * @param time an integer indicating the Scene time when the bounding box is to be drawn.
         */
        paintActor : function(director, time ) {

            if (!this.visible) {
                return true;
            }

            var ctx= director.ctx;
            var dmvm= director.modelViewMatrix;

            ctx.save();
            dmvm.transformRenderingContextSet( ctx );

            CAAT.ActorContainer.superclass.paintActor.call(this,director,time);
            if ( !this.isGlobalAlpha ) {
                this.frameAlpha= this.parent ? this.parent.frameAlpha : 1;
            }
//            ctx.restore();

            for( var actor= this.activeChildren; actor; actor=actor.__next ) {
                dmvm.transformRenderingContextSet( ctx );
                if ( actor.visible ) {
                    ctx.save();
                    actor.paintActor(director,time);
                    ctx.restore();
                }
            }
            ctx.restore();

            return true;
        },
        __paintActor : function(director, time ) {
            if (!this.visible) {
                return true;
            }

            var ctx= director.ctx;

            this.frameAlpha= this.parent ? this.parent.frameAlpha*this.alpha : 1;
            var m= this.worldModelViewMatrix.matrix;
            ctx.setTransform( m[0], m[3], m[1], m[4], m[2], m[5], this.frameAlpha );
            this.paint(director, time);

            if ( !this.isGlobalAlpha ) {
                this.frameAlpha= this.parent ? this.parent.frameAlpha : 1;
            }

            for( var actor= this.activeChildren; actor; actor=actor.__next ) {
                actor.paintActor(director,time);
            }
            return true;
        },
        paintActorGL : function(director,time) {

            var i, c;
            if (!this.visible) {
                return true;
            }

            CAAT.ActorContainer.superclass.paintActorGL.call(this,director,time);

            if ( !this.isGlobalAlpha ) {
                this.frameAlpha= this.parent.frameAlpha;
            }

            for( c= this.activeChildren; c; c=c.__next ) {
                c.paintActorGL(director,time);
            }

        },
        /**
         * Private.
         * Performs the animate method for this ActorContainer and every contained Actor.
         *
         * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
         * @param time an integer indicating the Scene time when the bounding box is to be drawn.
         *
         * @return {boolean} is this actor in active children list ??
         */
		animate : function(director,time) {

            this.activeChildren= null;
            var last= null;

            if (false===CAAT.ActorContainer.superclass.animate.call(this,director,time)) {
                return false;
            }

            var i,l;

            /**
             * Incluir los actores pendientes.
             * El momento es ahora, antes de procesar ninguno del contenedor.
             */
            var pcl= this.pendingChildrenList;
            for( i=0; i<pcl.length; i++ ) {
                var child= pcl[i];
                this.addChild(child);
            }

            this.pendingChildrenList= [];
            var markDelete= [];

            var cl= this.childrenList;
            this.activeChildren= null;
            this.size_active= 0;
            this.size_total= 0;
            for( i=0; i<cl.length; i++ ) {
                var actor= cl[i];
                actor.time= time;
                this.size_total+= actor.size_total;
                if ( actor.animate(director, time) ) {
                    if ( !this.activeChildren ) {
                        this.activeChildren= actor;
                        actor.__next= null;
                        last= actor;
                    } else {
                        actor.__next= null;
                        last.__next= actor;
                        last= actor;
                    }

                    this.size_active+= actor.size_active;

                } else {
                    if ( actor.expired && actor.discardable ) {
                        markDelete.push(actor);
                    }
                }
            }

            for( i=0, l=markDelete.length; i<l; i++ ) {
                markDelete[i].destroy(time);
            }

            return true;
		},
        /**
         * Removes Actors from this ActorContainer which are expired and flagged as Discardable.
         *
         * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
         * @param time an integer indicating the Scene time when the bounding box is to be drawn.
         *
         * @deprecated
         */
        endAnimate : function(director,time) {
        },
        /**
         * Adds an Actor to this Container.
         * The Actor will be added ON METHOD CALL, despite the rendering pipeline stage being executed at
         * the time of method call.
         *
         * This method is only used by CAAT.Director's transitionScene.
         *
         * @param child a CAAT.Actor instance.
         * @return this.
         */
        addChildImmediately : function(child) {
            return this.addChild(child);
        },
        /**
         * Adds an Actor to this ActorContainer.
         * The Actor will be added to the container AFTER frame animation, and not on method call time.
         * Except the Director and in orther to avoid visual artifacts, the developer SHOULD NOT call this
         * method directly.
         *
         * @param child a CAAT.Actor object instance.
         * @return this
         */
		addChild : function(child) {

            if ( child.parent!=null ) {
                throw('adding to a container an element with parent.');
            }

            child.parent= this;
            this.childrenList.push(child);
            child.dirty= true;
            return this;
		},
        /**
         * Add a child element and make it active in the next frame.
         * @param child {CAAT.Actor}
         */
        addChildDelayed : function(child) {
            this.pendingChildrenList.push(child);
            return this;
        },
        /**
         * Adds an Actor to this ActorContainer.
         *
         * @param child a CAAT.Actor object instance.
         *
         * @return this
         */
		addChildAt : function(child, index) {

			if( index <= 0 ) {
                child.parent= this;
                child.dirty= true;
                //this.childrenList.unshift(child);  // unshift unsupported on IE
                this.childrenList.splice( 0, 0, child );
				return this;
            } else {
                if ( index>=this.childrenList.length ) {
                    index= this.childrenList.length;
                }
            }

			child.parent= this;
            child.dirty= true;
			this.childrenList.splice(index, 0, child);

            return this;
		},
        /**
         * Private
         * Gets a contained Actor z-index on this ActorContainer.
         *
         * @param child a CAAT.Actor object instance.
         *
         * @return an integer indicating the Actor's z-order.
         */
		findChild : function(child) {
            var cl= this.childrenList;
            var i=0;
            var len = cl.length;

			for( i=0; i<len; i++ ) {
				if ( cl[i]===child ) {
					return i;
				}
			}
			return -1;
		},
        /**
         * Removed an Actor form this ActorContainer.
         * If the Actor is not contained into this Container, nothing happends.
         *
         * @param child a CAAT.Actor object instance.
         *
         * @return this
         */
		removeChild : function(child) {
			var pos= this.findChild(child);
            var cl= this.childrenList;
			if ( -1!==pos ) {
                cl[pos].setParent(null);
				cl.splice(pos,1);
			}

            return this;
		},
        /**
         * @private
         *
         * Gets the Actor inside this ActorContainer at a given Screen coordinate.
         *
         * @param point an object of the form { x: float, y: float }
         *
         * @return the Actor contained inside this ActorContainer if found, or the ActorContainer itself.
         */
		findActorAtPosition : function(point) {

			if( null===CAAT.ActorContainer.superclass.findActorAtPosition.call(this,point) ) {
				return null;
			}

			// z-order
            var cl= this.childrenList;
			for( var i=cl.length-1; i>=0; i-- ) {
                var child= this.childrenList[i];

                var np= new CAAT.Point( point.x, point.y, 0 );
                var contained= child.findActorAtPosition( np );
                if ( null!==contained ) {
                    return contained;
                }
			}

			return this;
		},
        /**
         * Destroys this ActorContainer.
         * The process falls down recursively for each contained Actor into this ActorContainer.
         *
         * @return this
         */
        destroy : function() {
            var cl= this.childrenList;
            for( var i=cl.length-1; i>=0; i-- ) {
                cl[i].destroy();
            }
            CAAT.ActorContainer.superclass.destroy.call(this);

            return this;
        },
        /**
         * Get number of Actors into this container.
         * @return integer indicating the number of children.
         */
        getNumChildren : function() {
            return this.childrenList.length;
        },
        getNumActiveChildren : function() {
            return this.activeChildren.length;
        },
        /**
         * Returns the Actor at the iPosition(th) position.
         * @param iPosition an integer indicating the position array.
         * @return the CAAT.Actor object at position.
         */
        getChildAt : function( iPosition ) {
            return this.childrenList[ iPosition ];
        },
        /**
         * Changes an actor's ZOrder.
         * @param actor the actor to change ZOrder for
         * @param index an integer indicating the new ZOrder. a value greater than children list size means to be the
         * last ZOrder Actor.
         */
        setZOrder : function( actor, index ) {
            var actorPos= this.findChild(actor);
            var cl= this.childrenList;
            // the actor is present
            if ( -1!==actorPos ) {

                // trivial reject.
                if ( index===actorPos ) {
                    return;
                }

                if ( index>=cl.length ) {
					cl.splice(actorPos,1);
					cl.push(actor);
                } else {
                    var nActor= cl.splice(actorPos,1);
                    if ( index<0 ) {
                        index=0;
                    } else if ( index>cl.length ) {
                        index= cl.length;
                    }

                    cl.splice( index, 1, nActor );
                }
            }
        }
	};

    if ( CAAT.NO_PERF ) {
        CAAT.ActorContainer.prototype.paintActor= CAAT.ActorContainer.prototype.__paintActor;
    }
    
    extend( CAAT.ActorContainer, CAAT.Actor, null);

})();


(function() {

    /**
     *
     * <p>
     * This class defines a simple Sprite sheet. A Sprite sheet is given by an instance of CAAT.CompoundImage,
     * which given a single image, you can define rows by columns sub-images contained in it. Then an array
     * of values indicating indexes to these sub-images is used to draw the sprite.
     *
     * <p>
     * The following is a valid example of CAAT.SpriteActor declaration:
     * <p>
     * <code>
     *  // define a compound image as 1 row by 3 columns.<br>
     *  var conpoundimage = new CAAT.CompoundImage().initialize( director.getImage('fish'), 1, 3);<br>
     *  <br>
     *  // create a fish instance<br>
     *  var fish = new CAAT.SpriteActor().<br>
     *  &nbsp;&nbsp;create().<br>
     *  &nbsp;&nbsp;setAnimationImageIndex( [0,1,2,1] ).// rotating from subimages 0,1,2,1<br>
	 *  &nbsp;&nbsp;setSpriteImage(conpoundimage).      // throughtout this compound image<br>
     *  &nbsp;&nbsp;setChangeFPS(350).                  // and change from image on the sheet every 350ms.<br>
     *  &nbsp;&nbsp;setLocation(10,10);                 // btw, the fish actor will be at 10,10 on screen.<br>
     * <br>
     * </code><br>
     *
     * @constructor
     * @extends CAAT.ActorContainer
     *
     */
	CAAT.SpriteActor = function() {
		CAAT.SpriteActor.superclass.constructor.call(this);
        this.glEnabled= true;
        this.setAnimationImageIndex([0]);
		return this;
	};

	CAAT.SpriteActor.prototype= {
		compoundbitmap:			null,   // CAAT.CompoundBitmap instance
		animationImageIndex:	null,   // an Array defining the sprite frame sequence
		prevAnimationTime:		-1,
		changeFPS:				1000,   // how much Scene time to take before changing an Sprite frame.
		transformation:			0,      // any of the TR_* constants.
		spriteIndex:			0,      // the current sprite frame

		TR_NONE:				0,      // constants used to determine how to draw the sprite image,
		TR_FLIP_HORIZONTAL:		1,
		TR_FLIP_VERTICAL:		2,
		TR_FLIP_ALL:			3,

        /**
         * Sets the Sprite image. The image will be treated as an array of rows by columns sub-images.
         *
         * @see CAAT.CompoundImage
         * @param conpoundimage a CAAT.ConpoundImage object instance.
         * @return this
         */
		setSpriteImage : function(conpoundimage) {
			this.compoundbitmap= conpoundimage;
			this.width= conpoundimage.singleWidth;
			this.height= conpoundimage.singleHeight;

            return this;
		},
        /**
         * Set the elapsed time needed to change the image index.
         * @param fps an integer indicating the time in milliseconds to change.
         * @return this
         */
        setChangeFPS : function(fps) {
            this.changeFPS= fps;
            return this;
        },
        /**
         * Set the transformation to apply to the Sprite image.
         * Any value of
         *  <li>TR_NONE
         *  <li>TR_FLIP_HORIZONTAL
         *  <li>TR_FLIP_VERTICAL
         *  <li>TR_FLIP_ALL
         *
         * @param transformation an integer indicating one of the previous values.
         * @return this
         */
        setSpriteTransformation : function( transformation ) {
            this.transformation= transformation;
            switch(transformation)	{
				case this.TR_FLIP_HORIZONTAL:
					this.compoundbitmap.paint= this.compoundbitmap.paintInvertedH;
					break;
				case this.TR_FLIP_VERTICAL:
					this.compoundbitmap.paint= this.compoundbitmap.paintInvertedV;
					break;
				case this.TR_FLIP_ALL:
					this.compoundbitmap.paint= this.compoundbitmap.paintInvertedHV;
					break;
				default:
					this.compoundbitmap.paint= this.compoundbitmap.paintN;
			}
            return this;
        },
        /**
         * Set the sprite animation images index.
         *
         * @param aAnimationImageIndex an array indicating the Sprite's frames.
         */
		setAnimationImageIndex : function( aAnimationImageIndex ) {
			this.animationImageIndex= aAnimationImageIndex;
			this.spriteIndex= aAnimationImageIndex[0];

            return this;
		},
        setSpriteIndex : function(index) {
            this.spriteIndex= index;
            return this;
        },
        /**
         * Draws the sprite image calculated and stored in spriteIndex.
         *
         * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
         * @param time an integer indicating the Scene time when the bounding box is to be drawn.
         */
		paint : function(director, time) {

            if ( this.animationImageIndex.length>1 ) {
                if ( this.prevAnimationTime===-1 )	{
                    this.prevAnimationTime= time;
                }
                else	{
                    var ttime= time;
                    ttime-= this.prevAnimationTime;
                    ttime/= this.changeFPS;
                    ttime%= this.animationImageIndex.length;
                    this.spriteIndex= this.animationImageIndex[Math.floor(ttime)];
                }
            }

			var canvas= director.ctx;
            if ( this.spriteIndex!=-1 ) {
                this.compoundbitmap.paint( canvas, this.spriteIndex, 0, 0);
            }
		},
        paintActorGL : function(director,time) {
            if ( -1===this.spriteIndex ) {
                return;
            }

            CAAT.SpriteActor.superclass.paintActorGL.call(this,director,time);
        },
        /**
         *
         * @param uv {Float32Array}
         * @param uvIndex {Number}
         */
        setUV : function( uv, uvIndex ) {
            this.compoundbitmap.setUV(this.spriteIndex, uv, uvIndex);
        },
        glNeedsFlush : function(director) {
            if ( this.compoundbitmap.image.__texturePage!==director.currentTexturePage ) {
                return true;
            }
            if ( this.frameAlpha!==director.currentOpacity ) {
                return true;
            }
            return false;
        }
    };

    extend( CAAT.SpriteActor, CAAT.ActorContainer, null);
})();

(function() {

    /**
     *
     * This class shows a simple image on screen. It can be flipped by calling the method <code>
     * setImageTransformation</code>, and offseted, that is, translated from actors 0,0 position by
     * calling the methods <code>setOffsetX( {float} ) and setOffsetY( {float} )</code>.
     *
     * @constructor
     * @extends CAAT.ActorContainer
     *
     */
	CAAT.ImageActor = function() {
		CAAT.ImageActor.superclass.constructor.call(this);
        this.glEnabled= true;
		return this;
	};

	CAAT.ImageActor.prototype= {
        image:                  null,
		transformation:			0,      // any of the TR_* constants.

		TR_NONE:				0,      // constants used to determine how to draw the sprite image,
		TR_FLIP_HORIZONTAL:		1,
		TR_FLIP_VERTICAL:		2,
		TR_FLIP_ALL:			3,
        TR_FIXED_TO_SIZE:       4,

        offsetX:                0,
        offsetY:                0,

        /**
         * Set horizontal displacement to draw image. Positive values means drawing the image more to the
         * right.
         * @param x {number}
         * @return this
         */
        setOffsetX : function(x) {
            this.offsetX= x|0;
            return this;
        },
        /**
         * Set vertical displacement to draw image. Positive values means drawing the image more to the
         * bottom.
         * @param y {number}
         * @return this
         */
        setOffsetY : function(y) {
            this.offsetY= y|0;
            return this;
        },
        setOffset : function( x,y ) {
            this.offsetX= x;
            this.offsetY= y;
            return this;
        },
        /**
         * Set the image to draw. If this CAAT.ImageActor has not set dimension, the actor will be equal
         * size to the image.
         * @param image {HTMLImageElement}
         * @return this
         */
        setImage : function(image) {
            this.image= image;
            if ( image && (this.width===0 || this.height===0) ) {
                this.width=  image.width;
                this.height= image.height;
            }
            return this;
        },
        /**
         * Set the transformation to apply to the image.
         * Any value of
         * <ul>
         *  <li>TR_NONE
         *  <li>TR_FLIP_HORIZONTAL
         *  <li>TR_FLIP_VERTICAL
         *  <li>TR_FLIP_ALL
         * </ul>
         *
         * @param transformation {number} an integer indicating one of the previous values.
         * @return this
         */
        setImageTransformation : function( transformation ) {
            this.transformation= transformation;

            switch(this.transformation)	{
                case this.TR_FLIP_HORIZONTAL:
                    //this.paintInvertedH( ctx);
                    this.paint= this.paintInvertedH;
                    break;
                case this.TR_FLIP_VERTICAL:
                    //this.paintInvertedV( ctx);
                    this.paint= this.paintInvertedV;
                    break;
                case this.TR_FLIP_ALL:
                    //this.paintInvertedHV( ctx);
                    this.paint= this.paintInvertedHV;
                    break;
                case this.TR_FIXED_TO_SIZE:
                    this.paint= this.paintFixed;
            }

            return this;
        },
        paintFixed : function(director,time) {
            if ( this.image ) {
                director.ctx.drawImage(this.image,this.offsetX,this.offsetY,this.width,this.height);
            } else {
                var ctx= director.ctx;
                ctx.fillStyle= this.fillStyle;
                ctx.fillRect(0,0,this.width,this.height);
            }
        },
        /**
         * Draws the image.
         *
         * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
         * @param time an integer indicating the Scene time when the bounding box is to be drawn.
         */
		paint : function(director, time) {
			var ctx= director.ctx;
            ctx.drawImage(this.image,this.offsetX,this.offsetY);
		},
        paintActorGL : function(director,time) {
            if ( null===this.image ) {
                return;
            }

            CAAT.ImageActor.superclass.paintActorGL.call(this,director,time);
        },
	    paintInvertedH : function( director, time) {

			var ctx= director.crc;
	        ctx.save();
		        ctx.translate( this.width, 0 );
		        ctx.scale(-1, 1);
		        ctx.drawImage( this.image,this.offsetX,this.offsetY );
	        ctx.restore();
	    },
	    paintInvertedV : function( director, time) {

			var ctx= director.crc;
	        ctx.save();
	            ctx.translate( 0, this.height );
	            ctx.scale(1, -1);
		        ctx.drawImage( this.image,this.offsetX,this.offsetY );
	        ctx.restore();
	    },
	    paintInvertedHV : function( director, time) {

			var ctx= director.crc;
	        ctx.save();
		        ctx.translate( 0, this.height );
		        ctx.scale(1, -1);
	            ctx.translate( this.width, 0 );
	            ctx.scale(-1, 1);
		        ctx.drawImage(this.image,this.offsetX,this.offsetY);
	        ctx.restore();
	    },
        /**
         *
         * @param uvBuffer {Float32Array}
         * @param uvIndex {Number}
         */
        setUV : function( uvBuffer, uvIndex ) {

            var index= uvIndex;

            var im= this.image;

            if ( !im.__texturePage ) {
                return;
            }

            var u= im.__u;
            var v= im.__v;
            var u1= im.__u1;
            var v1= im.__v1;
            if ( this.offsetX || this.offsetY ) {
                var w= this.width;
                var h= this.height;

                var tp= im.__texturePage;
                u= (im.__tx - this.offsetX) / tp.width;
                v= (im.__ty - this.offsetY) / tp.height;
                u1= u + w/tp.width;
                v1= v + h/tp.height;
            }

            if ( im.inverted ) {
                uvBuffer[index++]= u1;
                uvBuffer[index++]= v;

                uvBuffer[index++]= u1;
                uvBuffer[index++]= v1;

                uvBuffer[index++]= u;
                uvBuffer[index++]= v1;

                uvBuffer[index++]= u;
                uvBuffer[index++]= v;
            } else {
                uvBuffer[index++]= u;
                uvBuffer[index++]= v;

                uvBuffer[index++]= u1;
                uvBuffer[index++]= v;

                uvBuffer[index++]= u1;
                uvBuffer[index++]= v1;

                uvBuffer[index++]= u;
                uvBuffer[index++]= v1;
            }
        },
        glNeedsFlush : function(director) {
            if ( this.image.__texturePage!==director.currentTexturePage ) {
                return true;
            }
            if ( this.frameAlpha!==director.currentOpacity ) {
                return true;
            }
            return false;
        }
	};

    extend( CAAT.ImageActor, CAAT.ActorContainer, null);
})();

(function() {

    /**
     * TextActor draws text on screen. The text can be drawn directly on screen or make if follow a
     * path defined by an instance of <code>CAAT.Path</code>.
     *
     * @constructor
     * @extends CAAT.ActorContainer
     *
     */
	CAAT.TextActor = function() {
		CAAT.TextActor.superclass.constructor.call(this);
		this.font= "10px sans-serif";
		this.textAlign= "left";
		this.textBaseline= "top";
		this.outlineColor= "black";
        this.clip= false;

		return this;
	};

    CAAT.TextActor.TRAVERSE_PATH_FORWARD= 1;
    CAAT.TextActor.TRAVERSE_PATH_BACKWARD= -1;

	CAAT.TextActor.prototype= {
		font:			    null,   // a valid canvas rendering context font description. Default font
                                    // will be "10px sans-serif".
		textAlign:		    null,	// a valid canvas rendering context textAlign string. Any of:
                                    // start, end, left, right, center.
                                    // defaults to "left".
		textBaseline:	    null,	// a valid canvas rendering context textBaseLine string. Any of:
                                    // top, hanging, middle, alphabetic, ideographic, bottom.
                                    // defaults to "top".
		fill:			    true,   // a boolean indicating whether the text should be filled.
		text:			    null,   // a string with the text to draw.
		textWidth:		    0,      // an integer indicating text width in pixels.
        textHeight:         0,      // an integer indicating text height in pixels.
		outline:		    false,  // a boolean indicating whether the text should be outlined.
                                    // not all browsers support it.
		outlineColor:	    null,   // a valid color description string.

		path:			    null,   // a CAAT.Path which will be traversed by the text. [Optional]
        pathInterpolator:	null,   // a CAAT.Interpolator to apply to the path traversing.
        pathDuration:       10000,  // an integer indicating the time to be taken to traverse the path. ms.
		sign:			    1,      // traverse the path forward or backwards.

        /**
         * Set the text to be filled. The default Filling style will be set by calling setFillStyle method.
         * Default value is true.
         * @param fill {boolean} a boolean indicating whether the text will be filled.
         * @return this;
         */
        setFill : function( fill ) {
            this.fill= fill;
            return this;
        },
        /**
         * Sets whether the text will be outlined.
         * @param outline {boolean} a boolean indicating whether the text will be outlined.
         * @return this;
         */
        setOutline : function( outline ) {
            this.outline= outline;
            return this;
        },
        setPathTraverseDirection : function(direction) {
            this.sign= direction;
            return this;
        },
        /**
         * Defines text's outline color.
         *
         * @param color {string} sets a valid canvas context color.
         * @return this.
         */
        setOutlineColor : function( color ) {
            this.outlineColor= color;
            return this;
        },
        /**
         * Set the text to be shown by the actor.
         * @param sText a string with the text to be shwon.
         * @return this
         */
		setText : function( sText ) {
			this.text= sText;
            this.setFont( this.font );

            return this;
        },
        setTextAlign : function( align ) {
            this.textAlign= align;
            return this;
        },
        /**
         * Sets text alignment
         * @param align
         * @deprecated use setTextAlign
         */
        setAlign : function( align ) {
            return this.setTextAlign(align);
        },
        /**
         * Set text baseline.
         * @param baseline
         */
        setTextBaseline : function( baseline ) {
            this.textBaseline= baseline;
            return this;

        },
        setBaseline : function( baseline ) {
            return this.setTextBaseline(baseline);
        },
        /**
         * Sets the font to be applied for the text.
         * @param font a string with a valid canvas rendering context font description.
         * @return this
         */
        setFont : function(font) {

            if ( !font ) {
                return this;
            }

            this.font= font;

            if ( null===this.text || this.text==="" ) {
                this.width= this.height= 0;
            }

            return this;
		},
        /**
         * Calculates the text dimension in pixels and stores the values in textWidth and textHeight
         * attributes.
         * If Actor's width and height were not set, the Actor's dimension will be set to these values.
         * @param director a CAAT.Director instance.
         * @return this
         */
        calcTextSize : function(director) {

            if ( director.glEnabled ) {
                return this;
            }

            director.ctx.save();
            director.ctx.font= this.font;

            this.textWidth= director.crc.measureText( this.text ).width;
            if (this.width===0) {
                this.width= this.textWidth;
            }

            try {
                var pos= this.font.indexOf("px");
                var s =  this.font.substring(0, pos );
                this.textHeight= parseInt(s,10);

                // needed to calculate the descent.
                // no context.getDescent(font) WTF !!!
                this.textHeight+= (this.textHeight/4)>>0;
            } catch(e) {
                this.textHeight=20; // default height;
            }

            if ( this.height===0 ) {
                this.height= this.textHeight;
            }

            director.crc.restore();

            return this;
        },
        /**
         * Custom paint method for TextActor instances.
         * If the path attribute is set, the text will be drawn traversing the path.
         *
         * @param director a valid CAAT.Director instance.
         * @param time an integer with the Scene time the Actor is being drawn.
         */
		paint : function(director, time) {

            if ( this.backgroundImage ) {   // cached
                CAAT.TextActor.superclass.paint.call(this, director, time );
                return ;
            }

			if ( null===this.text) {
				return;
			}

            if ( this.textWidth===0 || this.textHeight===0 ) {
                this.calcTextSize(director);
            }

			var canvas= director.crc;

			if( null!==this.font ) {
				canvas.font= this.font;
			}
			if ( null!==this.textAlign ) {
				canvas.textAlign= this.textAlign;
			}
			if ( null!==this.textBaseline ) {
				canvas.textBaseline= this.textBaseline;
			}
			if ( null!==this.fillStyle ) {
				canvas.fillStyle= this.fillStyle;
			}

			if (null===this.path) {

                var tx=0;
                if ( this.textAlign==='center') {
                    tx= (this.width/2)|0;
                } else if ( this.textAlign==='right' ) {
                    tx= this.width;
                }

				if ( this.fill ) {
					canvas.fillText( this.text, tx, 0 );
					if ( this.outline ) {

						// firefox necesita beginPath, si no, dibujara ademas el cuadrado del
						// contenedor de los textos.
						if ( null!==this.outlineColor ) {
							canvas.strokeStyle= this.outlineColor;
						}
						canvas.beginPath();
						canvas.strokeText( this.text, tx, 0 );
					}
				} else {
					if ( null!==this.outlineColor ) {
						canvas.strokeStyle= this.outlineColor;
					}
					canvas.strokeText( this.text, tx, 0 );
				}
			}
			else {
				this.drawOnPath(director,time);
			}
		},
        /**
         * Private.
         * Draw the text traversing a path.
         * @param director a valid CAAT.Director instance.
         * @param time an integer with the Scene time the Actor is being drawn.
         */
		drawOnPath : function(director, time) {

			var canvas= director.crc;

			var textWidth=this.sign * this.pathInterpolator.getPosition(
                    (time%this.pathDuration)/this.pathDuration ).y * this.path.getLength() ;
			var p0= new CAAT.Point(0,0,0);
			var p1= new CAAT.Point(0,0,0);

			for( var i=0; i<this.text.length; i++ ) {
				var caracter= this.text[i].toString();
				var charWidth= canvas.measureText( caracter ).width;

				var pathLength= this.path.getLength();

				var currentCurveLength= charWidth/2 + textWidth;

				p0= this.path.getPositionFromLength(currentCurveLength).clone();
				p1= this.path.getPositionFromLength(currentCurveLength-0.1).clone();

				var angle= Math.atan2( p0.y-p1.y, p0.x-p1.x );

				canvas.save();

					canvas.translate( (0.5+p0.x)|0, (0.5+p0.y)|0 );
					canvas.rotate( angle );
                    if ( this.fill ) {
					    canvas.fillText(caracter,0,0);
                    }
                    if ( this.outline ) {
                        canvas.strokeStyle= this.outlineColor;
                        canvas.strokeText(caracter,0,0);
                    }

				canvas.restore();

				textWidth+= charWidth;
			}
		},
        /**
         * Set the path, interpolator and duration to draw the text on.
         * @param path a valid CAAT.Path instance.
         * @param interpolator a CAAT.Interpolator object. If not set, a Linear Interpolator will be used.
         * @param duration an integer indicating the time to take to traverse the path. Optional. 10000 ms
         * by default.
         */
		setPath : function( path, interpolator, duration ) {
			this.path= path;
            this.pathInterpolator= interpolator || new CAAT.Interpolator().createLinearInterpolator();
            this.pathDuration= duration || 10000;

            /*
                parent could not be set by the time this method is called.
                so the actors bounds set is removed.
                the developer must ensure to call setbounds properly on actor.
             */
			this.mouseEnabled= false;

            return this;
		}
	};

    extend( CAAT.TextActor, CAAT.ActorContainer, null);
})();

(function() {

    /**
     * This class works as a UI Button.
     * <p>
     * To fully define the button, four images should be supplied as well as a callback function.
     * The images define different button states:
     * <ul>
     *  <li>Normal state
     *  <li>Pointed
     *  <li>Pressed
     *  <li>Disabled
     * </ul>
     *
     * <p>
     * It is only compulsory to supply an image for the normal state. All images must be supplied in
     * a single image strip which containes all button states, concretely in a CAAT.CompoundImage
     * instance.
     *
     * @constructor
     * @extends CAAT.ActorContainer
     */
    CAAT.Button= function() {
        CAAT.Button.superclass.constructor.call(this);
        this.glEnabled= true;
        return this;
    };

    CAAT.Button.prototype= {
        iNormal:        0,
        iOver:          0,
        iPress:         0,
        iDisabled:      0,
        iCurrent:       0,
        fnOnClick:      null,
        enabled:        true,

        /**
         * Set enabled state for the button.
         * If the button is disabled, it will only show the disabled state and will discard mouse input.
         * @param enabled {boolean}
         */
        setEnabled : function( enabled ) {
            this.enabled= enabled;
        },
        /**
         * Initialize the button with the given values. The button size will be set to the size of the
         * subimages contained in the buttonImage.
         *
         * @param buttonImage {CAAT.CompoundImage} an image used as a strip of button state images.
         * @param iNormal {number} an integer indicating which image index of the buttonImage corresponds
         * with the normal state.
         * @param iOver {number} an integer indicating which image index of the buttonImage corresponds
         * with the pointed state.
         * @param iPress {number} an integer indicating which image index of the buttonImage corresponds
         * with the pressed state.
         * @param iDisabled {number} an integer indicating which image index of the buttonImage corresponds
         * with the disabled state.
         * @param fn {function} callback function to call on mouse release inside the button actor. The
         * function receives as parameter the button that fired the event.
         */
        initialize : function( buttonImage, iNormal, iOver, iPress, iDisabled, fn) {
            this.setSpriteImage(buttonImage);
            this.iNormal=       iNormal || 0;
            this.iOver=         iOver || this.iNormal;
            this.iPress=        iPress || this.iNormal;
            this.iDisabled=     iDisabled || this.iNormal;
            this.iCurrent=      this.iNormal;
            this.width=         buttonImage.singleWidth;
            this.height=        buttonImage.singleHeight;
            this.fnOnClick=     fn;
            this.spriteIndex=   iNormal;
            return this;
        },
        /**
         *
         * @param mouseEvent {CAAT.MouseEvent}
         */
        mouseEnter : function(mouseEvent) {
            this.setSpriteIndex( this.iOver );
            CAAT.setCursor('pointer');
        },
        /**
         *
         * @param mouseEvent {CAAT.MouseEvent}
         */
        mouseExit : function(mouseEvent) {
            this.setSpriteIndex( this.iNormal );
            CAAT.setCursor('default');
        },
        /**
         *
         * @param mouseEvent {CAAT.MouseEvent}
         */
        mouseDown : function(mouseEvent) {
            this.setSpriteIndex( this.iPress );
        },
        /**
         *
         * @param mouseEvent {CAAT.MouseEvent}
         */
        mouseUp : function(mouseEvent) {
            this.setSpriteIndex( this.iNormal );
        },
        /**
         *
         * @param mouseEvent {CAAT.MouseEvent}
         */
        mouseClick : function(mouseEvent) {
            if ( this.enabled && null!==this.fnOnClick ) {
                this.fnOnClick(this);
            }
        },
        toString : function() {
            return 'CAAT.Button '+this.iNormal;
        }
    };

    extend( CAAT.Button, CAAT.SpriteActor, null);
})();

(function() {

    /**
     * This Actor draws common shapes, concretely Circles and rectangles.
     *
     * @constructor
     * @extends CAAT.ActorContainer
     */
    CAAT.ShapeActor = function() {
        CAAT.ShapeActor.superclass.constructor.call(this);
        this.compositeOp= 'source-over';

        /**
         * Thanks Svend Dutz and Thomas Karolski for noticing this call was not performed by default,
         * so if no explicit call to setShape was made, nothing would be drawn.
         */
        this.setShape( this.SHAPE_CIRCLE );
        return this;
    };

    CAAT.ShapeActor.prototype= {

        shape:          0,      // shape type. One of the constant SHAPE_* values
        compositeOp:    null,   // a valid canvas rendering context string describing compositeOps.
        lineWidth:      1,
        lineCap:        null,
        lineJoin:       null,
        miterLimit:     null,

        SHAPE_CIRCLE:   0,      // Constants to describe different shapes.
        SHAPE_RECTANGLE:1,

        /**
         * 
         * @param l {number>0}
         */
        setLineWidth : function(l)  {
            this.lineWidth= l;
            return this;
        },
        /**
         *
         * @param lc {string{butt|round|square}}
         */
        setLineCap : function(lc)   {
            this.lineCap= lc;
            return this;
        },
        /**
         *
         * @param lj {string{bevel|round|miter}}
         */
        setLineJoin : function(lj)  {
            this.lineJoin= lj;
            return this;
        },
        /**
         *
         * @param ml {integer>0}
         */
        setMiterLimit : function(ml)    {
            this.miterLimit= ml;
            return this;
        },
        getLineCap : function() {
            return this.lineCap;
        },
        getLineJoin : function()    {
            return this.lineJoin;
        },
        getMiterLimit : function()  {
            return this.miterLimit;
        },
        getLineWidth : function()   {
            return this.lineWidth;
        },
        /**
         * Sets shape type.
         * No check for parameter validity is performed.
         * Set paint method according to the shape.
         * @param iShape an integer with any of the SHAPE_* constants.
         * @return this
         */
        setShape : function(iShape) {
            this.shape= iShape;
            this.paint= this.shape===this.SHAPE_CIRCLE ?
                    this.paintCircle :
                    this.paintRectangle;
            return this;
        },
        /**
         * Sets the composite operation to apply on shape drawing.
         * @param compositeOp an string with a valid canvas rendering context string describing compositeOps.
         * @return this
         */
        setCompositeOp : function(compositeOp){
            this.compositeOp= compositeOp;
            return this;
        },
        /**
         * Draws the shape.
         * Applies the values of fillStype, strokeStyle, compositeOp, etc.
         *
         * @param director a valid CAAT.Director instance.
         * @param time an integer with the Scene time the Actor is being drawn.
         */
        paint : function(director,time) {
        },
        /**
         * @private
         * Draws a circle.
         * @param director a valid CAAT.Director instance.
         * @param time an integer with the Scene time the Actor is being drawn.
         */
        paintCircle : function(director,time) {
            var ctx= director.crc;

            ctx.lineWidth= this.lineWidth;

            ctx.globalCompositeOperation= this.compositeOp;
            if ( null!==this.fillStyle ) {
                ctx.fillStyle= this.fillStyle;
                ctx.beginPath();
                ctx.arc( this.width/2, this.height/2, Math.min(this.width,this.height)/2, 0, 2*Math.PI, false );
                ctx.fill();
            }

            if ( null!==this.strokeStyle ) {
                ctx.strokeStyle= this.strokeStyle;
                ctx.beginPath();
                ctx.arc( this.width/2, this.height/2, Math.min(this.width,this.height)/2, 0, 2*Math.PI, false );
                ctx.stroke();
            }
        },
        /**
         *
         * Private
         * Draws a Rectangle.
         *
         * @param director a valid CAAT.Director instance.
         * @param time an integer with the Scene time the Actor is being drawn.
         */
        paintRectangle : function(director,time) {
            var ctx= director.crc;

            ctx.lineWidth= this.lineWidth;

            if ( this.lineCap ) {
                ctx.lineCap= this.lineCap;
            }
            if ( this.lineJoin )    {
                ctx.lineJoin= this.lineJoin;
            }
            if ( this.miterLimit )  {
                ctx.miterLimit= this.miterLimit;
            }

            ctx.globalCompositeOperation= this.compositeOp;
            if ( null!==this.fillStyle ) {
                ctx.fillStyle= this.fillStyle;
                ctx.beginPath();
                ctx.fillRect(0,0,this.width,this.height);
                ctx.fill();
            }

            if ( null!==this.strokeStyle ) {
                ctx.strokeStyle= this.strokeStyle;
                ctx.beginPath();
                ctx.strokeRect(0,0,this.width,this.height);
                ctx.stroke();
            }
        }
    };

    extend( CAAT.ShapeActor, CAAT.ActorContainer, null);
})();

(function() {

    /**
     * This actor draws stars.
     *
     * @constructor
     * @extends CAAT.ActorContainer
     */
    CAAT.StarActor= function() {
        CAAT.StarActor.superclass.constructor.call(this);
        this.compositeOp= 'source-over';
        return this;
    };

    CAAT.StarActor.prototype= {
        nPeaks:         0,
        maxRadius:      0,
        minRadius:      0,
        initialAngle:   0,
        compositeOp:    null,
        lineWidth:      1,
        lineCap:        null,
        lineJoin:       null,
        miterLimit:     null,

        /**
         *
         * @param l {number>0}
         */
        setLineWidth : function(l)  {
            this.lineWidth= l;
            return this;
        },
        /**
         *
         * @param lc {string{butt|round|square}}
         */
        setLineCap : function(lc)   {
            this.lineCap= lc;
            return this;
        },
        /**
         *
         * @param lj {string{bevel|round|miter}}
         */
        setLineJoin : function(lj)  {
            this.lineJoin= lj;
            return this;
        },
        /**
         *
         * @param ml {integer>0}
         */
        setMiterLimit : function(ml)    {
            this.miterLimit= ml;
            return this;
        },
        getLineCap : function() {
            return this.lineCap;
        },
        getLineJoin : function()    {
            return this.lineJoin;
        },
        getMiterLimit : function()  {
            return this.miterLimit;
        },
        getLineWidth : function()   {
            return this.lineWidth;
        },
        /**
         * Sets whether the star will be color filled.
         * @param filled {boolean}
         * @deprecated
         */
        setFilled : function( filled ) {
            return this;
        },
        /**
         * Sets whether the star will be outlined.
         * @param outlined {boolean}
         * @deprecated
         */
        setOutlined : function( outlined ) {
            return this;
        },
        /**
         * Sets the composite operation to apply on shape drawing.
         * @param compositeOp an string with a valid canvas rendering context string describing compositeOps.
         * @return this
         */
        setCompositeOp : function(compositeOp){
            this.compositeOp= compositeOp;
            return this;
        },
        /**
         * 
         * @param angle {number} number in radians.
         */
        setInitialAngle : function(angle) {
            this.initialAngle= angle;
            return this;
        },
        /**
         * Initialize the star values.
         * <p>
         * The star actor will be of size 2*maxRadius.
         *
         * @param nPeaks {number} number of star points.
         * @param maxRadius {number} maximum star radius
         * @param minRadius {number} minimum star radius
         *
         * @return this
         */
        initialize : function(nPeaks, maxRadius, minRadius) {
            this.setSize( 2*maxRadius, 2*maxRadius );

            this.nPeaks= nPeaks;
            this.maxRadius= maxRadius;
            this.minRadius= minRadius;

            return this;
        },
        /**
         * Paint the star.
         *
         * @param director {CAAT.Director}
         * @param timer {number}
         */
        paint : function(director, timer) {

            var ctx=        director.ctx;
            var centerX=    this.width/2;
            var centerY=    this.height/2;
            var r1=         this.maxRadius;
            var r2=         this.minRadius;
            var ix=         centerX + r1*Math.cos(this.initialAngle);
            var iy=         centerY + r1*Math.sin(this.initialAngle);

            ctx.lineWidth= this.lineWidth;
            if ( this.lineCap ) {
                ctx.lineCap= this.lineCap;
            }
            if ( this.lineJoin )    {
                ctx.lineJoin= this.lineJoin;
            }
            if ( this.miterLimit )  {
                ctx.miterLimit= this.miterLimit;
            }

            ctx.globalCompositeOperation= this.compositeOp;

            ctx.beginPath();
            ctx.moveTo(ix,iy);

            for( var i=1; i<this.nPeaks*2; i++ )   {
                var angleStar= Math.PI/this.nPeaks * i + this.initialAngle;
               var rr= (i%2===0) ? r1 : r2;
                var x= centerX + rr*Math.cos(angleStar);
                var y= centerY + rr*Math.sin(angleStar);
                ctx.lineTo(x,y);
            }

            ctx.lineTo(
                centerX + r1*Math.cos(this.initialAngle),
                centerY + r1*Math.sin(this.initialAngle) );

            ctx.closePath();
            
            if ( this.fillStyle ) {
                ctx.fillStyle= this.fillStyle;
                ctx.fill();
            }

            if ( this.strokeStyle ) {
                ctx.strokeStyle= this.strokeStyle;
                ctx.stroke();
            }

        }
    };

    extend(CAAT.StarActor, CAAT.ActorContainer, null);

})();

/**
 * An actor suitable to draw an ImageProcessor instance.
 */
(function() {

    /**
     * This Actor will show the result of an image processing operation.
     *
     * @constructor
     * @extends CAAT.ActorContainer
     */
    CAAT.IMActor= function() {
        CAAT.IMActor.superclass.constructor.call(this);
        return this;
    };

    CAAT.IMActor.prototype= {

        imageProcessor:         null,
        changeTime:             100,
        lastApplicationTime:    -1,

        /**
         * Set the image processor.
         *
         * @param im {CAAT.ImageProcessor} a CAAT.ImageProcessor instance.
         */
        setImageProcessor : function(im) {
            this.imageProcessor= im;
            return this;
        },
        /**
         * Call image processor to update image every time milliseconds.
         * @param time an integer indicating milliseconds to elapse before updating the frame.
         */
        setImageProcessingTime : function( time ) {
            this.changeTime= time;
            return this;
        },
        paint : function( director, time ) {
            if ( time-this.lastApplicationTime>this.changeTime ) {
                this.imageProcessor.apply( director, time );
                this.lastApplicationTime= time;
            }

            var ctx= director.ctx;
            this.imageProcessor.paint( director, time );
        }
    };

    extend( CAAT.IMActor, CAAT.ActorContainer, null);
})();/**
 * See LICENSE file.
 *
 * Sound implementation.
 */

(function() {

    /**
     * This class is a sound manager implementation which can play at least 'numChannels' sounds at the same time.
     * By default, CAAT.Director instances will set eight channels to play sound.
     * <p>
     * If more than 'numChannels' sounds want to be played at the same time the requests will be dropped,
     * so no more than 'numChannels' sounds can be concurrently played.
     * <p>
     * Available sounds to be played must be supplied to every CAAT.Director instance by calling <code>addSound</code>
     * method. The default implementation will accept a URL/URI or a HTMLAudioElement as source.
     * <p>
     * The cached elements can be played, or looped. The <code>loop</code> method will return a handler to
     * give the opportunity of cancelling the sound.
     * <p>
     * Be aware of Audio.canPlay, is able to return 'yes', 'no', 'maybe', ..., so anything different from
     * '' and 'no' will do.
     *
     * @constructor
     *
     */
    CAAT.AudioManager= function() {
        this.browserInfo= new CAAT.BrowserDetect();
        return this;
    };

    CAAT.AudioManager.prototype= {

        browserInfo:        null,
        musicEnabled:       true,
        fxEnabled:          true,
        audioCache:         null,   // audio elements.
        channels:           null,   // available playing channels.
        workingChannels:    null,   // currently playing channels.
        loopingChannels:    [],
        audioTypes: {               // supported audio formats. Don't remember where i took them from :S
	        'mp3': 'audio/mpeg;',
            'ogg': 'audio/ogg; codecs="vorbis"',
            'wav': 'audio/wav; codecs="1"',
            'mp4': 'audio/mp4; codecs="mp4a.40.2"'
		},

        /**
         * Initializes the sound subsystem by creating a fixed number of Audio channels.
         * Every channel registers a handler for sound playing finalization. If a callback is set, the
         * callback function will be called with the associated sound id in the cache.
         *
         * @param numChannels {number} number of channels to pre-create. 8 by default.
         *
         * @return this.
         */
        initialize : function(numChannels) {

            this.audioCache=      [];
            this.channels=        [];
            this.workingChannels= [];

            for( var i=0; i<numChannels; i++ ) {
                var channel= document.createElement('audio');

                if ( null!==channel ) {
                    channel.finished= -1;
                    this.channels.push( channel );
                    var me= this;
                    channel.addEventListener(
                            'ended',
                            // on sound end, set channel to available channels list.
                            function(audioEvent) {
                                var target= audioEvent.target;
                                var i;

                                // remove from workingChannels
                                for( i=0; i<me.workingChannels.length; i++ ) {
                                    if (me.workingChannels[i]===target ) {
                                        me.workingChannels.splice(i,1);
                                        break;
                                    }
                                }

                                if ( target.caat_callback ) {
                                    target.caat_callback(target.caat_id);
                                }

                                // set back to channels.
                                me.channels.push(target);
                            },
                            false
                    );
                }
            }

            return this;
        },
        /**
         * Tries to add an audio tag to the available list of valid audios. The audio is described by a url.
         * @param id {object} an object to associate the audio element (if suitable to be played).
         * @param url {string} a string describing an url.
         * @param endplaying_callback {function} callback to be called upon sound end.
         *
         * @return {boolean} a boolean indicating whether the browser can play this resource.
         *
         * @private
         */
        addAudioFromURL : function( id, url, endplaying_callback ) {
            var extension= null;
            var audio= document.createElement('audio');

            if ( null!==audio ) {

                if(!audio.canPlayType) {
                    return false;
                }

                extension= url.substr(url.lastIndexOf('.')+1);
                var canplay= audio.canPlayType(this.audioTypes[extension]);

                if(canplay!=="" && canplay!=="no") {
                    audio.src= url;
                    audio.preload = "auto";
                    audio.load();
                    if ( endplaying_callback ) {
                        audio.caat_callback= endplaying_callback;
                        audio.caat_id= id;
                    }
                    this.audioCache.push( { id:id, audio:audio } );

                    return true;
                }
            }

            return false;
        },
        /**
         * Tries to add an audio tag to the available list of valid audios. The audio element comes from
         * an HTMLAudioElement.
         * @param id {object} an object to associate the audio element (if suitable to be played).
         * @param audio {HTMLAudioElement} a DOM audio node.
         * @param endplaying_callback {function} callback to be called upon sound end.
         *
         * @return {boolean} a boolean indicating whether the browser can play this resource.
         *
         * @private
         */
        addAudioFromDomNode : function( id, audio, endplaying_callback ) {

            var extension= audio.src.substr(audio.src.lastIndexOf('.')+1);
            if ( audio.canPlayType(this.audioTypes[extension]) ) {
                if ( endplaying_callback ) {
                    audio.caat_callback= endplaying_callback;
                    audio.caat_id= id;
                }
                this.audioCache.push( { id:id, audio:audio } );

                return true;
            }

            return false;
        },
        /**
         * Adds an elements to the audio cache.
         * @param id {object} an object to associate the audio element (if suitable to be played).
         * @param element {URL|HTMLElement} an url or html audio tag.
         * @param endplaying_callback {function} callback to be called upon sound end.
         *
         * @return {boolean} a boolean indicating whether the browser can play this resource.
         *
         * @private
         */
        addAudioElement : function( id, element, endplaying_callback ) {
            if ( typeof element === "string" ) {
                return this.addAudioFromURL( id, element, endplaying_callback );
            } else {
                try {
                    if ( element instanceof HTMLAudioElement ) {
                        return this.addAudioFromDomNode( id, element, endplaying_callback );
                    }
                }
                catch(e) {
                }
            }

            return false;
        },
        /**
         * creates an Audio object and adds it to the audio cache.
         * This function expects audio data described by two elements, an id and an object which will
         * describe an audio element to be associated with the id. The object will be of the form
         * array, dom node or a url string.
         *
         * <p>
         * The audio element can be one of the two forms:
         *
         * <ol>
         *  <li>Either an HTMLAudioElement/Audio object or a string url.
         *  <li>An array of elements of the previous form.
         * </ol>
         *
         * <p>
         * When the audio attribute is an array, this function will iterate throught the array elements
         * until a suitable audio element to be played is found. When this is the case, the other array
         * elements won't be taken into account. The valid form of using this addAudio method will be:
         *
         * <p>
         * 1.<br>
         * addAudio( id, url } ). In this case, if the resource pointed by url is
         * not suitable to be played (i.e. a call to the Audio element's canPlayType method return 'no')
         * no resource will be added under such id, so no sound will be played when invoking the play(id)
         * method.
         * <p>
         * 2.<br>
         * addAudio( id, dom_audio_tag ). In this case, the same logic than previous case is applied, but
         * this time, the parameter url is expected to be an audio tag present in the html file.
         * <p>
         * 3.<br>
         * addAudio( id, [array_of_url_or_domaudiotag] ). In this case, the function tries to locate a valid
         * resource to be played in any of the elements contained in the array. The array element's can
         * be any type of case 1 and 2. As soon as a valid resource is found, it will be associated to the
         * id in the valid audio resources to be played list.
         *
         * @return this
         */
        addAudio : function( id, array_of_url_or_domnodes, endplaying_callback ) {

            if ( array_of_url_or_domnodes instanceof Array ) {
                /*
                 iterate throught array elements until we can safely add an audio element.
                 */
                for( var i=0; i<array_of_url_or_domnodes.length; i++ ) {
                    if ( this.addAudioElement(id, array_of_url_or_domnodes[i], endplaying_callback) ) {
                        break;
                    }
                }
            } else {
                this.addAudioElement(id, array_of_url_or_domnodes, endplaying_callback);
            }

            return this;
        },
        /**
         * Returns an audio object.
         * @param aId {object} the id associated to the target Audio object.
         * @return {object} the HTMLAudioElement addociated to the given id.
         */
        getAudio : function(aId) {
            for( var i=0; i<this.audioCache.length; i++ ) {
                if ( this.audioCache[i].id===aId ) {
                    return this.audioCache[i].audio;
                }
            }

            return null;
        },
        /**
         * Plays an audio file from the cache if any sound channel is available.
         * The playing sound will occupy a sound channel and when ends playing will leave
         * the channel free for any other sound to be played in.
         * @param id {object} an object identifying a sound in the sound cache.
         * @return this.
         */
        play : function( id ) {
            if ( !this.fxEnabled ) {
                return this;
            }

            var audio= this.getAudio(id);
            // existe el audio, y ademas hay un canal de audio disponible.
            if ( null!==audio && this.channels.length>0 ) {
                var channel= this.channels.shift();
                channel.src= audio.src;
                channel.load();
                channel.play();
                this.workingChannels.push(channel);
            }

            return this;
        },
        /**
         * This method creates a new AudioChannel to loop the sound with.
         * It returns an Audio object so that the developer can cancel the sound loop at will.
         * The user must call <code>pause()</code> method to stop playing a loop.
         * <p>
         * Firefox does not honor the loop property, so looping is performed by attending end playing
         * event on audio elements.
         *
         * @return {HTMLElement} an Audio instance if a valid sound id is supplied. Null otherwise
         */
        loop : function( id ) {

            if (!this.musicEnabled) {
                return this;
            }

            var audio_in_cache= this.getAudio(id);
            // existe el audio, y ademas hay un canal de audio disponible.
            if ( null!==audio_in_cache ) {
                var audio= document.createElement('audio');
                if ( null!==audio ) {
                    audio.src= audio_in_cache.src;
                    audio.preload = "auto";

                    if ( this.browserInfo.browser==='Firefox') {
                        audio.addEventListener(
                            'ended',
                            // on sound end, set channel to available channels list.
                            function(audioEvent) {
                                var target= audioEvent.target;
                                target.currentTime=0;
                            },
                            false
                        );
                    } else {
                        audio.loop= true;
                    }
                    audio.load();
                    audio.play();
                    this.loopingChannels.push(audio);
                    return audio;
                }
            }

            return null;
        },
        /**
         * Cancel all playing audio channels
         * Get back the playing channels to available channel list.
         *
         * @return this
         */
        endSound : function() {
            var i;
            for( i=0; i<this.workingChannels.length; i++ ) {
                this.workingChannels[i].pause();
                this.channels.push( this.workingChannels[i] );
            }

            for( i=0; i<this.loopingChannels.length; i++ ) {
                this.loopingChannels[i].pause();
            }

            return this;
        },
        setSoundEffectsEnabled : function( enable ) {
            this.fxEnabled= enable;
            return this;
        },
        isSoundEffectsEnabled : function() {
            return this.fxEnabled;
        },
        setMusicEnabled : function( enable ) {
            this.musicEnabled= enable;
            for( var i=0; i<this.loopingChannels.length; i++ ) {
                if ( enable ) {
                    this.loopingChannels[i].play();
                } else {
                    this.loopingChannels[i].pause();
                }
            }
            return this;
        },
        isMusicEnabled : function() {
            return this.musicEnabled;
        }
    };
})();/**
 * See LICENSE file.
 *
 * In this file we'll be adding every useful Actor that is specific for certain purpose.
 *
 * + CAAT.Dock: a docking container that zooms in/out its actors.
 *
 */
(function() {

    /**
     * This actor simulates a mac os-x docking component.
     * Every contained actor will be laid out in a row in the desired orientation.
     */
    CAAT.Dock = function() {
        CAAT.Dock.superclass.constructor.call(this);
        return this;
    };

    CAAT.Dock.prototype= {

        scene:              null,   // scene the actor is in.
        ttask:              null,   // resetting dimension timer.
        minSize:            0,      // min contained actor size
        maxSize:            0,      // max contained actor size
        range:              2,      // aproximated number of elements affected.
        layoutOp:           0,
        OP_LAYOUT_BOTTOM:   0,
        OP_LAYOUT_TOP:      1,
        OP_LAYOUT_LEFT:     2,
        OP_LAYOUT_RIGHT:    3,

        initialize : function(scene) {
            this.scene= scene;
            return this;
        },
        /**
         * Set the number of elements that will be affected (zoomed) when the mouse is inside the component.
         * @param range {number} a number. Defaults to 2.
         */
        setApplicationRange : function( range ) {
            this.range= range;
            return this;
        },
        /**
         * Set layout orientation. Choose from
         * <ul>
         *  <li>CAAT.Dock.prototype.OP_LAYOUT_BOTTOM
         *  <li>CAAT.Dock.prototype.OP_LAYOUT_TOP
         *  <li>CAAT.Dock.prototype.OP_LAYOUT_BOTTOM
         *  <li>CAAT.Dock.prototype.OP_LAYOUT_RIGHT
         * </ul>
         * By default, the layou operation is OP_LAYOUT_BOTTOM, that is, elements zoom bottom anchored.
         *
         * @param lo {number} one of CAAT.Dock.OP_LAYOUT_BOTTOM, CAAT.Dock.OP_LAYOUT_TOP,
         * CAAT.Dock.OP_LAYOUT_BOTTOM, CAAT.Dock.OP_LAYOUT_RIGHT.
         *
         * @return this
         */
        setLayoutOp : function( lo ) {
            this.layoutOp= lo;
            return this;
        },
        /**
         *
         * Set maximum and minimum size of docked elements. By default, every contained actor will be
         * of 'min' size, and will be scaled up to 'max' size.
         *
         * @param min {number}
         * @param max {number}
         * @return this
         */
        setSizes : function( min, max ) {
            this.minSize= min;
            this.maxSize= max;

            for( var i=0; i<this.childrenList.length; i++ ) {
                this.childrenList[i].width= min;
                this.childrenList[i].height= min;
            }

            return this;
        },
        /**
         * Lay out the docking elements. The lay out will be a row with the orientation set by calling
         * the method <code>setLayoutOp</code>.
         *
         * @private
         */
        layout : function() {
            var i,actor;

            if ( this.layoutOp===this.OP_LAYOUT_BOTTOM || this.layoutOp===this.OP_LAYOUT_TOP ) {

                var currentWidth=0, currentX=0;

                for( i=0; i<this.getNumChildren(); i++ ) {
                    currentWidth+= this.getChildAt(i).width;
                }

                currentX= (this.width-currentWidth)/2;

                for( i=0; i<this.getNumChildren(); i++ ) {
                    actor= this.getChildAt(i);
                    actor.x= currentX;
                    currentX+= actor.width;

                    if ( this.layoutOp===this.OP_LAYOUT_BOTTOM ) {
                        actor.y= this.maxSize- actor.height;
                    } else {
                        actor.y= 0;
                    }
                }
            } else {

                var currentHeight=0, currentY=0;

                for( i=0; i<this.getNumChildren(); i++ ) {
                    currentHeight+= this.getChildAt(i).height;
                }

                currentY= (this.height-currentHeight)/2;

                for( i=0; i<this.getNumChildren(); i++ ) {
                    actor= this.getChildAt(i);
                    actor.y= currentY;
                    currentY+= actor.height;

                    if ( this.layoutOp===this.OP_LAYOUT_LEFT ) {
                        actor.x= 0;
                    } else {
                        actor.x= this.width - actor.width;
                    }
                }

            }

        },
        mouseMove : function(mouseEvent) {
            this.actorNotPointed();
        },
        mouseExit : function(mouseEvent) {
            this.actorNotPointed();
        },
        /**
         * Performs operation when the mouse is not in the dock element.
         *
         * @private
         */
        actorNotPointed : function() {

            var i;
            var me= this;

            for( i=0; i<this.getNumChildren(); i++ ) {
                var actor= this.getChildAt(i);
                actor.emptyBehaviorList();
                actor.addBehavior(
                        new CAAT.GenericBehavior().
                            setValues( actor.width, this.minSize, actor, 'width' ).
                            setFrameTime( this.scene.time, 250 ) ).
                    addBehavior(
                        new CAAT.GenericBehavior().
                            setValues( actor.height, this.minSize, actor, 'height' ).
                            setFrameTime( this.scene.time, 250 ) );

                if ( i===this.getNumChildren()-1 ) {
                    actor.behaviorList[0].addListener(
                    {
                        behaviorApplied : function(behavior,time,normalizedTime,targetActor,value) {
                            targetActor.parent.layout();
                        },
                        behaviorExpired : function(behavior,time,targetActor) {
                            for( i=0; i<me.getNumChildren(); i++ ) {
                                actor= me.getChildAt(i);
                                actor.width  = me.minSize;
                                actor.height = me.minSize;
                            }
                            targetActor.parent.layout();
                        }
                    });
                }
            }
        },
        /**
         *
         * Perform the process of pointing a docking actor.
         *
         * @param x {number}
         * @param y {number}
         * @param pointedActor {CAAT.Actor}
         *
         * @private
         */
        actorPointed : function(x, y, pointedActor) {

            var index= this.findChild(pointedActor);

            var across= 0;
            if ( this.layoutOp===this.OP_LAYOUT_BOTTOM || this.layoutOp===this.OP_LAYOUT_TOP ) {
                across= x / pointedActor.width;
            } else {
                across= y / pointedActor.height;
            }
            var i;

            for( i=0; i<this.childrenList.length; i++ ) {
                var actor= this.childrenList[i];
                actor.emptyBehaviorList();

                var wwidth=0;
                if (i < index - this.range || i > index + this.range) {
                    wwidth = this.minSize;
                } else if (i === index) {
                    wwidth = this.maxSize;
                } else if (i < index) {
                    wwidth=
                        this.minSize +
                        (this.maxSize-this.minSize) *
                        (Math.cos((i - index - across + 1) / this.range * Math.PI) + 1) /
                        2;
                } else {
                    wwidth=
                        this.minSize +
                        (this.maxSize-this.minSize)*
                        (Math.cos( (i - index - across) / this.range * Math.PI) + 1) /
                        2;
                }

                actor.height= wwidth;
                actor.width= wwidth;
            }

            this.layout();
        },
        /**
         * Perform the process of exiting the docking element, that is, animate elements to the minimum
         * size.
         *
         * @param mouseEvent {CAAT.MouseEvent} a CAAT.MouseEvent object.
         *
         * @private
         */
        actorMouseExit : function(mouseEvent) {
            if ( null!==this.ttask ) {
                this.ttask.cancel();
            }

            var me= this;
            this.ttask= this.scene.createTimer(
                    this.scene.time,
                    100,
                    function timeout(sceneTime, time, timerTask) {
                        me.actorNotPointed();
                    },
                    null,
                    null);
        },
        /**
         * Perform the beginning of docking elements.
         * @param mouseEvent {CAAT.MouseEvent} a CAAT.MouseEvent object.
         *
         * @private
         */
        actorMouseEnter : function(mouseEvent) {
            if ( null!==this.ttask ) {
                this.ttask.cancel();
                this.ttask= null;
            }
        },
        /**
         * Adds an actor to Dock.
         * <p>
         * Be aware that actor mouse functions must be set prior to calling this method. The Dock actor
         * needs set his own actor input events functions for mouseEnter, mouseExit and mouseMove and
         * will then chain to the original methods set by the developer.
         *
         * @param actor {CAAT.Actor} a CAAT.Actor instance.
         *
         * @return this
         */
        addChild : function(actor) {
            var me= this;

            actor.__Dock_mouseEnter= actor.mouseEnter;
            actor.__Dock_mouseExit=  actor.mouseExit;
            actor.__Dock_mouseMove=  actor.mouseMove;

            /**
             * @ignore
             * @param mouseEvent
             */
            actor.mouseEnter= function(mouseEvent) {
                me.actorMouseEnter(mouseEvent);
                this.__Dock_mouseEnter(mouseEvent);
            };
            /**
             * @ignore
             * @param mouseEvent
             */
            actor.mouseExit= function(mouseEvent) {
                me.actorMouseExit(mouseEvent);
                this.__Dock_mouseExit(mouseEvent);
            };
            /**
             * @ignore
             * @param mouseEvent
             */
            actor.mouseMove= function(mouseEvent) {
                me.actorPointed( mouseEvent.point.x, mouseEvent.point.y, mouseEvent.source );
                this.__Dock_mouseMove(mouseEvent);
            };

            actor.width= this.minSize;
            actor.height= this.minSize;

            return CAAT.Dock.superclass.addChild.call(this,actor);
        }
    };

    extend( CAAT.Dock, CAAT.ActorContainer, null);

})();
/**
 * See LICENSE file.
 *
 **/


(function() {
    /**
     * Director is the animator scene graph manager.
     * <p>
     * The director elements is an ActorContainer itself with the main responsibility of managing
     * different Scenes.
     * <p>
     * It is responsible for:
     * <ul>
     * <li>scene changes.
     * <li>route input to the appropriate scene graph actor.
     * <li>be the central point for resource caching.
     * <li>manage the timeline.
     * <li>manage frame rate.
     * <li>etc.
     * </ul>
     *
     * <p>
     * One document can contain different CAAT.Director instances which will be kept together in CAAT
     * function.
     *
     * @constructor
     * @extends CAAT.ActorContainer
     */
    CAAT.Director = function() {
        CAAT.Director.superclass.constructor.call(this);

        this.browserInfo = new CAAT.BrowserDetect();
        this.audioManager = new CAAT.AudioManager().initialize(8);
        this.scenes = [];

        // input related variables initialization
        this.mousePoint = new CAAT.Point(0, 0, 0);
        this.prevMousePoint = new CAAT.Point(0, 0, 0);
        this.screenMousePoint = new CAAT.Point(0, 0, 0);
        this.isMouseDown = false;
        this.lastSelectedActor = null;
        this.dragging = false;

        return this;
    };

    CAAT.Director.prototype = {

        debug:              false,  // flag indicating debug mode. It will draw affedted screen areas.

        onRenderStart:      null,
        onRenderEnd:        null,

        // input related attributes
        mousePoint:         null,   // mouse coordinate related to canvas 0,0 coord.
        prevMousePoint:     null,   // previous mouse position cache. Needed for drag events.
        screenMousePoint:   null,   // screen mouse coordinates.
        isMouseDown:        false,  // is the left mouse button pressed ?
        lastSelectedActor:  null,   // director's last actor receiving input.
        dragging:           false,  // is in drag mode ?

        // other attributes

        scenes:             null,   // Scenes collection. An array.
        currentScene:       null,   // The current Scene. This and only this will receive events.
        canvas:             null,   // The canvas the Director draws on.
        crc:                null,    // @deprecated. canvas rendering context
        ctx:                null,   // refactoring crc for a more convenient name
        time:               0,      // virtual actor time.
        timeline:           0,      // global director timeline.
        imagesCache:        null,   // An array of JSON elements of the form { id:string, image:Image }
        audioManager:       null,
        clear:              true,   // clear background before drawing scenes ??

        transitionScene:    null,

        browserInfo:        null,

        gl:                 null,
        glEnabled:          false,
        glTextureManager:   null,
        glTtextureProgram:  null,
        glColorProgram:     null,

        pMatrix:            null,       // projection matrix
        coords:             null,       // Float32Array
        coordsIndex:        0,
        uv:                 null,
        uvIndex:            0,

        front_to_back:      false,
        currentTexturePage: 0,
        currentOpacity:     1,

        intervalId:         null,

        frameCounter:       0,

        RESIZE_NONE:        1,
        RESIZE_WIDTH:       2,
        RESIZE_HEIGHT:      4,
        RESIZE_BOTH:        8,
        RESIZE_PROPORTIONAL:16,
        resize:             1,
        onResizeCallback:   null,

        checkDebug : function() {
            if ( CAAT.DEBUG ) {
                var dd= new CAAT.Debug().initialize( this.width, 60 );
                this.debugInfo= dd.debugInfo.bind(dd);
            }
        },
        getRenderType : function() {
            return this.glEnabled ? 'WEBGL' : 'CANVAS';
        },
        windowResized : function(w, h) {
            switch (this.resize) {
                case this.RESIZE_WIDTH:
                    this.setBounds(0, 0, w, this.height);
                    break;
                case this.RESIZE_HEIGHT:
                    this.setBounds(0, 0, this.width, h);
                    break;
                case this.RESIZE_BOTH:
                    this.setBounds(0, 0, w, h);
                    break;
                case this.RESIZE_PROPORTIONAL:
                    this.setScaleProportional(w,h);
                    break;
            }

            if ( this.onResizeCallback )    {
                this.onResizeCallback( this, w, h );
            }

        },
        setScaleProportional : function(w,h) {

            var factor= Math.min(w/this.referenceWidth, h/this.referenceHeight);

            this.setScaleAnchored( factor, factor, 0, 0 );

            this.canvas.width = this.referenceWidth*factor;
            this.canvas.height = this.referenceHeight*factor;
            this.ctx = this.canvas.getContext(this.glEnabled ? 'experimental-webgl' : '2d');
            this.crc = this.ctx;

            if ( this.glEnabled ) {
                this.glReset();
            }
        },
        /**
         * Enable window resize events and set redimension policy. A callback functio could be supplied
         * to be notified on a Director redimension event. This is necessary in the case you set a redim
         * policy not equal to RESIZE_PROPORTIONAL. In those redimension modes, director's area and their
         * children scenes are resized to fit the new area. But scenes content is not resized, and have
         * no option of knowing so uless an onResizeCallback function is supplied.
         *
         * @param mode {number}  RESIZE_BOTH, RESIZE_WIDTH, RESIZE_HEIGHT, RESIZE_NONE.
         * @param onResizeCallback {function(director{CAAT.Director}, width{integer}, height{integer})} a callback
         * to notify on canvas resize.
         */
        enableResizeEvents : function(mode, onResizeCallback) {
            if (mode === this.RESIZE_BOTH || mode === this.RESIZE_WIDTH || mode === this.RESIZE_HEIGHT || mode===this.RESIZE_PROPORTIONAL) {
                this.referenceWidth= this.width;
                this.referenceHeight=this.height;
                this.resize = mode;
                CAAT.registerResizeListener(this);
                this.onResizeCallback= onResizeCallback;
                this.windowResized( window.innerWidth, window.innerHeight );
            } else {
                CAAT.unregisterResizeListener(this);
                this.onResizeCallback= null;
            }
        },
        /**
         * Set this director's bounds as well as its contained scenes.
         * @param x {number} ignored, will be 0.
         * @param y {number} ignored, will be 0.
         * @param w {number} director width.
         * @param h {number} director height.
         *
         * @return this
         */
        setBounds : function(x, y, w, h) {
            CAAT.Director.superclass.setBounds.call(this, x, y, w, h);
            this.canvas.width = w;
            this.canvas.height = h;
            this.ctx = this.canvas.getContext(this.glEnabled ? 'experimental-webgl' : '2d');
            this.crc = this.ctx;

            for (var i = 0; i < this.scenes.length; i++) {
                this.scenes[i].setBounds(0, 0, w, h);
            }

            if ( this.glEnabled ) {
                this.glReset();
            }

            return this;
        },
        /**
         * This method performs Director initialization. Must be called once.
         * If the canvas parameter is not set, it will create a Canvas itself,
         * and the developer must explicitly add the canvas to the desired DOM position.
         * This method will also set the Canvas dimension to the specified values
         * by width and height parameters.
         *
         * @param width {number} a canvas width
         * @param height {number} a canvas height
         * @param canvas {HTMLCanvasElement=} An optional Canvas object.
         *
         * @return this
         */
        initialize : function(width, height, canvas) {
            canvas = canvas || document.createElement('canvas');
            this.canvas = canvas;

            this.setBounds(0, 0, width, height);
            this.create();
            this.enableEvents();

            this.timeline = new Date().getTime();

            // transition scene
            this.transitionScene = new CAAT.Scene().create().setBounds(0, 0, width, height);
            var transitionCanvas = document.createElement('canvas');
            transitionCanvas.width = width;
            transitionCanvas.height = height;
            var transitionImageActor = new CAAT.Actor().create().setBackgroundImage(transitionCanvas);
            this.transitionScene.ctx = transitionCanvas.getContext('2d');
            this.transitionScene.addChildImmediately(transitionImageActor);
            this.transitionScene.setEaseListener(this);

            this.checkDebug();

            return this;
        },
        glReset : function() {
            this.pMatrix= makeOrtho( 0, this.canvas.width, this.canvas.height, 0, -1, 1 );
            this.gl.viewport(0,0,this.canvas.width,this.canvas.height);
            this.glColorProgram.setMatrixUniform(this.pMatrix);
            this.glTextureProgram.setMatrixUniform(this.pMatrix);
            this.gl.viewportWidth = this.canvas.width;
            this.gl.viewportHeight = this.canvas.height;
        },
        /**
         * Experimental.
         * Initialize a gl enabled director.
         * @param width
         * @param height
         * @param canvas
         */
        initializeGL : function(width, height, canvas) {

            canvas = canvas || document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            var i;

            try {
                this.gl = canvas.getContext("experimental-webgl"/*, {antialias: false}*/);
                this.gl.viewportWidth = width;
                this.gl.viewportHeight = height;
            } catch(e) {
            }

            if (this.gl) {
                this.canvas = canvas;
                this.create();
                this.setBounds(0, 0, width, height);

                this.crc = this.ctx;
                this.enableEvents();
                this.timeline = new Date().getTime();

                this.glColorProgram = new CAAT.ColorProgram(this.gl).create().initialize();
                this.glTextureProgram = new CAAT.TextureProgram(this.gl).create().initialize();
                this.glTextureProgram.useProgram();
                this.glReset();


                var maxTris = 2048;
                this.coords = new Float32Array(maxTris * 12);
                this.uv = new Float32Array(maxTris * 8);

                this.gl.clearColor(0.0, 0.0, 0.0, 255);

                if (this.front_to_back) {
                    this.gl.clearDepth(1.0);
                    this.gl.enable(this.gl.DEPTH_TEST);
                    this.gl.depthFunc(this.gl.LESS);
                } else {
                    this.gl.disable(this.gl.DEPTH_TEST);
                }

                this.gl.enable(this.gl.BLEND);
                this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
                this.glEnabled = true;

                this.checkDebug();
            } else {
                // fallback to non gl enabled canvas.
                return this.initialize(width, height, canvas);
            }

            return this;
        },
        /**
         * Creates an initializes a Scene object.
         * @return {CAAT.Scene}
         */
        createScene : function() {
            var scene = new CAAT.Scene().create();
            this.addScene(scene);
            return scene;
        },
        setImagesCache : function(imagesCache, tpW, tpH) {

            var i;

            if (null !== this.glTextureManager) {
                this.glTextureManager.deletePages();
                this.glTextureManager = null;
            }

            // delete previous image identifiers
            if ( this.imagesCache ) {
                var ids= [];
                for ( i = 0; i < this.imagesCache.length; i++) {
                    ids.push( this.imagesCache[i].id );
                }

                for( i=0; i<ids.length; i++ ) {
                    delete this.imagesCache[ ids[i] ];
                }
            }
            
            this.imagesCache = imagesCache;

            if ( imagesCache ) {
                for ( i = 0; i < imagesCache.length; i++) {
                    this.imagesCache[ imagesCache[i].id ] = imagesCache[i].image;
                }
            }

            this.tpW = tpW || 2048;
            this.tpH = tpH || 2048;

            this.updateGLPages();
        },
        updateGLPages : function() {
            if (this.glEnabled) {

                this.glTextureManager = new CAAT.GLTexturePageManager();
                this.glTextureManager.createPages(this.gl, this.tpW, this.tpH, this.imagesCache);

                this.currentTexturePage = this.glTextureManager.pages[0];
                this.glTextureProgram.setTexture(this.currentTexturePage.texture);
            }
        },
        /**
         * Add a new image to director's image cache. If gl is enabled and the 'noUpdateGL' is not set to true this
         * function will try to recreate the whole GL texture pages.
         * If many handcrafted images are to be added to the director, some performance can be achieved by calling
         * <code>director.addImage(id,image,false)</code> many times and a final call with
         * <code>director.addImage(id,image,true)</code> to finally command the director to create texture pages.
         *
         * @param id {string|object} an identitifier to retrieve the image with
         * @param image {Image|Canvas} image to add to cache
         * @param noUpdateGL {*boolean} unless otherwise stated, the director will
         *  try to recreate the texture pages.
         */
        addImage : function( id, image, noUpdateGL ) {
            if ( this.getImage(id) ) {
                for (var i = 0; i < this.imagesCache.length; i++) {
                    if (this.imagesCache[i].id === id) {
                        this.imagesCache[i].image = image;
                        break;
                    }
                }
                this.imagesCache[ id ] = image;
            } else {
                this.imagesCache.push( { id: id, image: image } );
                this.imagesCache[id]= image;
            }

            if ( !!!noUpdateGL ) {
                this.updateGLPages( );
            }
        },
        deleteImage : function( id, noUpdateGL ) {
            for (var i = 0; i < this.imagesCache.length; i++) {
                if (this.imagesCache[i].id === id) {
                    delete this.imagesCache[id];
                    this.imagesCache.splice(i,1);
                    break;
                }
            }
            if ( !!!noUpdateGL ) {
                this.updateGLPages();
            }
        },
        setGLCurrentOpacity : function(opacity) {
            this.currentOpacity = opacity;
            this.glTextureProgram.setAlpha(opacity);
        },
        /**
         * Render buffered elements.
         * @param vertex
         * @param coordsIndex
         * @param uv
         */
        glRender : function(vertex, coordsIndex, uv) {

            vertex = vertex || this.coords;
            uv = uv || this.uv;
            coordsIndex = coordsIndex || this.coordsIndex;

            var gl = this.gl;

            var numTris = coordsIndex / 12 * 2;
            var numVertices = coordsIndex / 3;

            this.glTextureProgram.updateVertexBuffer(vertex);
            this.glTextureProgram.updateUVBuffer(uv);

            gl.drawElements(gl.TRIANGLES, 3 * numTris, gl.UNSIGNED_SHORT, 0);

        },
        glFlush : function() {
            if (this.coordsIndex !== 0) {
                this.glRender(this.coords, this.coordsIndex, this.uv);
            }
            this.coordsIndex = 0;
            this.uvIndex = 0;
        },

        findActorAtPosition : function(point) {

            // z-order
            var cl= this.childrenList;
            for( var i=cl.length-1; i>=0; i-- ) {
                var child= this.childrenList[i];

                var np= new CAAT.Point( point.x, point.y, 0 );
                var contained= child.findActorAtPosition( np );
                if ( null!==contained ) {
                    return contained;
                }
            }

            return this;
        },


        /**
         * This is the entry point for the animation system of the Director.
         * The director is fed with the elapsed time value to maintain a virtual timeline.
         * This virtual timeline will provide each Scene with its own virtual timeline, and will only
         * feed time when the Scene is the current Scene, or is being switched.
         *
         * @param time {number} integer indicating the elapsed time between two consecutive frames of the
         * Director.
         */
        render : function(time) {

            this.time += time;

            this.animate(this,time);

            if ( CAAT.DEBUG ) {
                this.size_total=0;
                this.size_active=0;
            }

            /**
             * draw director active scenes.
             */
            var ne = this.childrenList.length;
            var i, tt;
            if (this.glEnabled) {

                this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
                this.coordsIndex = 0;
                this.uvIndex = 0;

                // FIX: prepend director affine transform.

                for (i = 0; i < ne; i++) {
                    var c = this.childrenList[i];
                    if (c.isInAnimationFrame(this.time)) {
                        tt = c.time - c.start_time;
                        if ( c.onRenderStart ) {
                            c.onRenderStart(tt);
                        }
                        c.paintActorGL(this, tt);
                        if ( c.onRenderEnd ) {
                            c.onRenderEnd(tt);
                        }

                        if ( !c.isPaused() ) {
                            c.time += time;
                        }

                        if ( CAAT.DEBUG ) {
                            this.size_total+= c.size_total;
                            this.size_active+= c.size_active;
                        }

                    }
                }

                this.glFlush();

            } else {
                this.ctx.globalAlpha = 1;
                this.ctx.globalCompositeOperation = 'source-over';




                if (this.clear) {
                    this.ctx.clearRect(0, 0, this.width, this.height);
                }

                for (i = 0; i < ne; i++) {
                    var c= this.childrenList[i];

                    if (c.isInAnimationFrame(this.time)) {
                        tt = c.time - c.start_time;
                        this.ctx.save();
                        if ( c.onRenderStart ) {
                            c.onRenderStart(tt);
                        }
                        c.paintActor(this, tt);
                        if ( c.onRenderEnd ) {
                            c.onRenderEnd(tt);
                        }
                        this.ctx.restore();
                        if (this.debug) {
                            this.ctx.strokeStyle = 'red';
                            c.drawScreenBoundingBox(this, tt);
                        }

                        if ( !c.isPaused() ) {
                            c.time += time;
                        }

                        if ( CAAT.DEBUG ) {
                            this.size_total+= c.size_total;
                            this.size_active+= c.size_active;
                        }

                    }
                }
            }

            this.frameCounter++;
        },
        /**
         * A director is a very special kind of actor.
         * Its animation routine simple sets its modelViewMatrix in case some transformation's been
         * applied.
         * No behaviors are allowed for Director instances.
         * @param director {CAAT.Director} redundant reference to CAAT.Director itself
         * @param time {number} director time.
         */
        animate : function(director, time) {
            this.setModelViewMatrix(this.glEnabled);

            for (var i = 0; i < this.childrenList.length; i++) {
                var tt = this.childrenList[i].time - this.childrenList[i].start_time;
                this.childrenList[i].animate(this, tt);
            }

            return this;
        },
        /**
         * This method draws an Scene to an offscreen canvas. This offscreen canvas is also a child of
         * another Scene (transitionScene). So instead of drawing two scenes while transitioning from
         * one to another, first of all an scene is drawn to offscreen, and that image is translated.
         * <p>
         * Until the creation of this method, both scenes where drawn while transitioning with
         * its performance penalty since drawing two scenes could be twice as expensive than drawing
         * only one.
         * <p>
         * Though a high performance increase, we should keep an eye on memory consumption.
         *
         * @param ctx a <code>canvas.getContext('2d')</code> instnce.
         * @param scene {CAAT.Scene} the scene to draw offscreen.
         */
        renderToContext : function(ctx, scene) {
            /**
             * draw actors on scene.
             */
            if (scene.isInAnimationFrame(this.time)) {
                ctx.globalAlpha = 1;
                ctx.globalCompositeOperation = 'source-over';
                ctx.clearRect(0, 0, this.width, this.height);
                ctx.setTransform(1,0,0, 0,1,0);

                var octx = this.ctx;
                var ocrc = this.crc;

                this.ctx = this.crc = ctx;
                ctx.save();

                /**
                 * to draw an scene to an offscreen canvas, we have to:
                 *   1.- save diector's world model view matrix
                 *   2.- set no transformation on director since we want the offscreen to
                 *       be drawn 1:1.
                 *   3.- set world dirty flag, so that the scene will recalculate its matrices
                 *   4.- animate the scene
                 *   5.- paint the scene
                 *   6.- restore world model view matrix.
                 */
                var matwmv=  this.worldModelViewMatrix;
                this.worldModelViewMatrix= new CAAT.Matrix();
                this.wdirty= true;
                    scene.animate(this, scene.time);
                    if ( scene.onRenderStart ) {
                        scene.onRenderStart(scene.time);
                    }
                    scene.paintActor(this, scene.time);
                    if ( scene.onRenderEnd ) {
                        scene.onRenderEnd(scene.time);
                    }
                this.worldModelViewMatrix = matwmv;

                ctx.restore();

                this.ctx = octx;
                this.crc = ocrc;
            }
        },
        /**
         * Add a new Scene to Director's Scene list. By adding a Scene to the Director
         * does not mean it will be immediately visible, you should explicitly call either
         * <ul>
         *  <li>easeIn
         *  <li>easeInOut
         *  <li>easeInOutRandom
         *  <li>setScene
         *  <li>or any of the scene switching methods
         * </ul>
         *
         * @param scene {CAAT.Scene} an CAAT.Scene object.
         */
        addScene : function(scene) {
            scene.setBounds(0, 0, this.width, this.height);
            this.scenes.push(scene);
            scene.setEaseListener(this);
            if (null === this.currentScene) {
                this.setScene(0);
            }
        },
        /**
         * Get the number of scenes contained in the Director.
         * @return {number} the number of scenes contained in the Director.
         */
        getNumScenes : function() {
            return this.scenes.length;
        },
        /**
         * This method offers full control over the process of switching between any given two Scenes.
         * To apply this method, you must specify the type of transition to apply for each Scene and
         * the anchor to keep the Scene pinned at.
         * <p>
         * The type of transition will be one of the following values defined in CAAT.Scene.prototype:
         * <ul>
         *  <li>EASE_ROTATION
         *  <li>EASE_SCALE
         *  <li>EASE_TRANSLATION
         * </ul>
         *
         * <p>
         * The anchor will be any of these values defined in CAAT.Actor.prototype:
         * <ul>
         *  <li>ANCHOR_CENTER
         *  <li>ANCHOR_TOP
         *  <li>ANCHOR_BOTTOM
         *  <li>ANCHOR_LEFT
         *  <li>ANCHOR_RIGHT
         *  <li>ANCHOR_TOP_LEFT
         *  <li>ANCHOR_TOP_RIGHT
         *  <li>ANCHOR_BOTTOM_LEFT
         *  <li>ANCHOR_BOTTOM_RIGHT
         * </ul>
         *
         * <p>
         * In example, for an entering scene performing a EASE_SCALE transition, the anchor is the
         * point by which the scene will scaled.
         *
         * @param inSceneIndex integer indicating the Scene index to bring in to the Director.
         * @param typein integer indicating the type of transition to apply to the bringing in Scene.
         * @param anchorin integer indicating the anchor of the bringing in Scene.
         * @param outSceneIndex integer indicating the Scene index to take away from the Director.
         * @param typeout integer indicating the type of transition to apply to the taking away in Scene.
         * @param anchorout integer indicating the anchor of the taking away Scene.
         * @param time inteter indicating the time to perform the process of switchihg between Scene object
         * in milliseconds.
         * @param alpha boolean boolean indicating whether alpha transparency fading will be applied to
         * the scenes.
         * @param interpolatorIn CAAT.Interpolator object to apply to entering scene.
         * @param interpolatorOut CAAT.Interpolator object to apply to exiting scene.
         */
        easeInOut : function(inSceneIndex, typein, anchorin, outSceneIndex, typeout, anchorout, time, alpha, interpolatorIn, interpolatorOut) {

            if (inSceneIndex === this.getCurrentSceneIndex()) {
                return;
            }

            var ssin = this.scenes[ inSceneIndex ];
            var sout = this.scenes[ outSceneIndex ];

            if (!this.glEnabled && !navigator.browser==='iOS') {
                this.worldModelViewMatrix.transformRenderingContext(this.transitionScene.ctx);
                this.renderToContext(this.transitionScene.ctx, sout);
                sout = this.transitionScene;
            }

            ssin.setExpired(false);
            sout.setExpired(false);

            ssin.mouseEnabled = false;
            sout.mouseEnabled = false;

            ssin.resetTransform();
            sout.resetTransform();

            ssin.setLocation(0, 0);
            sout.setLocation(0, 0);

            ssin.alpha = 1;
            sout.alpha = 1;

            if (typein === CAAT.Scene.prototype.EASE_ROTATION) {
                ssin.easeRotationIn(time, alpha, anchorin, interpolatorIn);
            } else if (typein === CAAT.Scene.prototype.EASE_SCALE) {
                ssin.easeScaleIn(0, time, alpha, anchorin, interpolatorIn);
            } else {
                ssin.easeTranslationIn(time, alpha, anchorin, interpolatorIn);
            }

            if (typeout === CAAT.Scene.prototype.EASE_ROTATION) {
                sout.easeRotationOut(time, alpha, anchorout, interpolatorOut);
            } else if (typeout === CAAT.Scene.prototype.EASE_SCALE) {
                sout.easeScaleOut(0, time, alpha, anchorout, interpolatorOut);
            } else {
                sout.easeTranslationOut(time, alpha, anchorout, interpolatorOut);
            }

            this.childrenList = [];

            this.addChild(sout);
            this.addChild(ssin);
        },
        /**
         * This method will switch between two given Scene indexes (ie, take away scene number 2,
         * and bring in scene number 5).
         * <p>
         * It will randomly choose for each Scene the type of transition to apply and the anchor
         * point of each transition type.
         * <p>
         * It will also set for different kind of transitions the following interpolators:
         * <ul>
         * <li>EASE_ROTATION    -> ExponentialInOutInterpolator, exponent 4.
         * <li>EASE_SCALE       -> ElasticOutInterpolator, 1.1 and .4
         * <li>EASE_TRANSLATION -> BounceOutInterpolator
         * </ul>
         *
         * <p>
         * These are the default values, and could not be changed by now.
         * This method in final instance delegates the process to easeInOutMethod.
         *
         * @see easeInOutMethod.
         *
         * @param inIndex integer indicating the entering scene index.
         * @param outIndex integer indicating the exiting scene index.
         * @param time integer indicating the time to take for the process of Scene in/out in milliseconds.
         * @param alpha boolean indicating whether alpha transparency fading should be applied to transitions.
         */
        easeInOutRandom : function(inIndex, outIndex, time, alpha) {

            var pin = Math.random();
            var pout = Math.random();

            var typeIn;
            var interpolatorIn;

            if (pin < 0.33) {
                typeIn = CAAT.Scene.prototype.EASE_ROTATION;
                interpolatorIn = new CAAT.Interpolator().createExponentialInOutInterpolator(4);
            } else if (pin < 0.66) {
                typeIn = CAAT.Scene.prototype.EASE_SCALE;
                interpolatorIn = new CAAT.Interpolator().createElasticOutInterpolator(1.1, 0.4);
            } else {
                typeIn = CAAT.Scene.prototype.EASE_TRANSLATE;
                interpolatorIn = new CAAT.Interpolator().createBounceOutInterpolator();
            }

            var typeOut;
            var interpolatorOut;

            if (pout < 0.33) {
                typeOut = CAAT.Scene.prototype.EASE_ROTATION;
                interpolatorOut = new CAAT.Interpolator().createExponentialInOutInterpolator(4);
            } else if (pout < 0.66) {
                typeOut = CAAT.Scene.prototype.EASE_SCALE;
                interpolatorOut = new CAAT.Interpolator().createExponentialOutInterpolator(4);
            } else {
                typeOut = CAAT.Scene.prototype.EASE_TRANSLATE;
                interpolatorOut = new CAAT.Interpolator().createBounceOutInterpolator();
            }

            this.easeInOut(
                    inIndex,
                    typeIn,
                    (Math.random() * 8.99) >> 0,

                    outIndex,
                    typeOut,
                    (Math.random() * 8.99) >> 0,

                    time,
                    alpha,

                    interpolatorIn,
                    interpolatorOut);

        },
        /**
         * This method changes Director's current Scene to the scene index indicated by
         * inSceneIndex parameter. The Scene running in the director won't be eased out.
         *
         * @see {CAAT.Interpolator}
         * @see {CAAT.Actor}
         * @see {CAAT.Scene}
         *
         * @param inSceneIndex integer indicating the new Scene to set as current.
         * @param type integer indicating the type of transition to apply to bring the new current
         * Scene to the Director. The values will be one of: CAAT.Scene.prototype.EASE_ROTATION,
         * CAAT.Scene.prototype.EASE_SCALE, CAAT.Scene.prototype.EASE_TRANSLATION.
         * @param time integer indicating how much time in milliseconds the Scene entrance will take.
         * @param alpha boolean indicating whether alpha transparency fading will be applied to the
         * entereing Scene.
         * @param anchor integer indicating the anchor to fix for Scene transition. It will be any of
         * CAAT.Actor.prototype.ANCHOR_* values.
         * @param interpolator an CAAT.Interpolator object indicating the interpolation function to
         * apply.
         */
        easeIn : function(inSceneIndex, type, time, alpha, anchor, interpolator) {
            var sin = this.scenes[ inSceneIndex ];
            if (type === CAAT.Scene.prototype.EASE_ROTATION) {
                sin.easeRotationIn(time, alpha, anchor, interpolator);
            } else if (type === CAAT.Scene.prototype.EASE_SCALE) {
                sin.easeScaleIn(0, time, alpha, anchor, interpolator);
            } else {
                sin.easeTranslationIn(time, alpha, anchor, interpolator);
            }
            this.childrenList = [];
            this.addChild(sin);

            sin.resetTransform();
            sin.setLocation(0, 0);
            sin.alpha = 1;
            sin.mouseEnabled = false;
            sin.setExpired(false);
        },
        /**
         * Changes (or sets) the current Director scene to the index
         * parameter. There will be no transition on scene change.
         * @param sceneIndex {number} an integer indicating the index of the target Scene
         * to be shown.
         */
        setScene : function(sceneIndex) {
            var sin = this.scenes[ sceneIndex ];
            this.childrenList = [];
            this.addChild(sin);
            this.currentScene = sin;

            sin.setExpired(false);
            sin.mouseEnabled = true;
            sin.resetTransform();
            sin.setLocation(0, 0);
            sin.alpha = 1;

            sin.activated();
        },
        /**
         * This method will change the current Scene by the Scene indicated as parameter.
         * It will apply random values for anchor and transition type.
         * @see easeInOutRandom
         *
         * @param iNewSceneIndex {number} an integer indicating the index of the new scene to run on the Director.
         * @param time {number} an integer indicating the time the Scene transition will take.
         * @param alpha {boolean} a boolean indicating whether Scene transition should be fading.
         * @param transition {boolean} a boolean indicating whether the scene change must smoothly animated.
         */
        switchToScene : function(iNewSceneIndex, time, alpha, transition) {
            var currentSceneIndex = this.getSceneIndex(this.currentScene);

            if (!transition) {
                this.setScene(iNewSceneIndex);
            }
            else {
                this.easeInOutRandom(iNewSceneIndex, currentSceneIndex, time, alpha);
            }
        },
        /**
         * Sets the previous Scene in sequence as the current Scene.
         * @see switchToScene.
         *
         * @param time {number} integer indicating the time the Scene transition will take.
         * @param alpha {boolean} a boolean indicating whether Scene transition should be fading.
         * @param transition {boolean} a boolean indicating whether the scene change must smoothly animated.
         */
        switchToPrevScene : function(time, alpha, transition) {

            var currentSceneIndex = this.getSceneIndex(this.currentScene);

            if (this.getNumScenes() <= 1 || currentSceneIndex === 0) {
                return;
            }

            if (!transition) {
                this.setScene(currentSceneIndex - 1);
            }
            else {
                this.easeInOutRandom(currentSceneIndex - 1, currentSceneIndex, time, alpha);
            }
        },
        /**
         * Sets the previous Scene in sequence as the current Scene.
         * @see switchToScene.
         *
         * @param time {number} integer indicating the time the Scene transition will take.
         * @param alpha {boolean} a boolean indicating whether Scene transition should be fading.
         * @param transition {boolean} a boolean indicating whether the scene change must smoothly animated.
         */
        switchToNextScene: function(time, alpha, transition) {

            var currentSceneIndex = this.getSceneIndex(this.currentScene);

            if (this.getNumScenes() <= 1 || currentSceneIndex === this.getNumScenes() - 1) {
                return;
            }

            if (!transition) {
                this.setScene(currentSceneIndex + 1);
            }
            else {
                this.easeInOutRandom(currentSceneIndex + 1, currentSceneIndex, time, alpha);
            }
        },
        mouseEnter : function(mouseEvent) {
        },
        mouseExit : function(mouseEvent) {
        },
        mouseMove : function(mouseEvent) {
        },
        mouseDown : function(mouseEvent) {
        },
        mouseUp : function(mouseEvent) {
        },
        mouseDrag : function(mouseEvent) {
        },
        /**
         * Scene easing listener. Notifies scenes when they're about to be activated (set as current
         * director's scene).
         *
         * @param scene {CAAT.Scene} the scene that has just been brought in or taken out of the director.
         * @param b_easeIn {boolean} scene enters or exits ?
         */
        easeEnd : function(scene, b_easeIn) {
            // scene is going out
            if (!b_easeIn) {

                scene.setExpired(true);
            } else {
                this.currentScene = scene;
                this.currentScene.activated();
            }

            scene.mouseEnabled = true;
            scene.emptyBehaviorList();
        },
        /**
         * Return the index for a given Scene object contained in the Director.
         * @param scene {CAAT.Scene}
         */
        getSceneIndex : function(scene) {
            for (var i = 0; i < this.scenes.length; i++) {
                if (this.scenes[i] === scene) {
                    return i;
                }
            }
            return -1;
        },
        /**
         * Get a concrete director's scene.
         * @param index {number} an integer indicating the scene index.
         * @return {CAAT.Scene} a CAAT.Scene object instance or null if the index is oob.
         */
        getScene : function(index) {
            return this.scenes[index];
        },
        /**
         * Return the index of the current scene in the Director's scene list.
         * @return {number} the current scene's index.
         */
        getCurrentSceneIndex : function() {
            return this.getSceneIndex(this.currentScene);
        },
        /**
         * Return the running browser name.
         * @return {string} the browser name.
         */
        getBrowserName : function() {
            return this.browserInfo.browser;
        },
        /**
         * Return the running browser version.
         * @return {string} the browser version.
         */
        getBrowserVersion : function() {
            return this.browserInfo.version;
        },
        /**
         * Return the operating system name.
         * @return {string} the os name.
         */
        getOSName : function() {
            return this.browserInfo.OS;
        },
        /**
         * Gets the resource with the specified resource name.
         * The Director holds a collection called <code>imagesCache</code>
         * where you can store a JSON of the form
         *  <code>[ { id: imageId, image: imageObject } ]</code>.
         * This structure will be used as a resources cache.
         * There's a CAAT.ImagePreloader class to preload resources and
         * generate this structure on loading finalization.
         *
         * @param sId {object} an String identifying a resource.
         */
        getImage : function(sId) {
            var ret = this.imagesCache[sId];
            if (ret) {
                return ret;
            }

            for (var i = 0; i < this.imagesCache.length; i++) {
                if (this.imagesCache[i].id === sId) {
                    return this.imagesCache[i].image;
                }
            }

            return null;
        },
        /**
         * Adds an audio to the cache.
         *
         * @see CAAT.AudioManager.addAudio
         * @return this
         */
        addAudio : function(id, url) {
            this.audioManager.addAudio(id, url);
            return this;
        },
        /**
         * Plays the audio instance identified by the id.
         * @param id {object} the object used to store a sound in the audioCache.
         */
        audioPlay : function(id) {
            this.audioManager.play(id);
        },
        /**
         * Loops an audio instance identified by the id.
         * @param id {object} the object used to store a sound in the audioCache.
         *
         * @return {HTMLElement|null} the value from audioManager.loop
         */
        audioLoop : function(id) {
            return this.audioManager.loop(id);
        },
        endSound : function() {
            return this.audioManager.endSound();
        },
        setSoundEffectsEnabled : function(enabled) {
            return this.audioManager.setSoundEffectsEnabled(enabled);
        },
        setMusicEnabled : function(enabled) {
            return this.audioManager.setMusicEnabled(enabled);
        },
        isMusicEnabled : function() {
            return this.audioManager.isMusicEnabled();
        },
        isSoundEffectsEnabled : function() {
            return this.audioManager.isSoundEffectsEnabled();
        },
        /**
         * Removes Director's scenes.
         */
        emptyScenes : function() {
            this.scenes = [];
        },
        /**
         * Adds an scene to this Director.
         * @param scene {CAAT.Scene} a scene object.
         */
        addChild : function(scene) {
            scene.parent = this;
            this.childrenList.push(scene);
        },
        /**
         * @Deprecated use CAAT.loop instead.
         * @param fps
         * @param callback
         * @param callback2
         */
        loop : function(fps,callback,callback2) {
            if ( callback2 ) {
                this.onRenderStart= callback;
                this.onRenderEnd= callback2;
            } else if (callback) {
                this.onRenderEnd= callback;
            }
            CAAT.loop();
        },
        /**
         * Starts the director animation.If no scene is explicitly selected, the current Scene will
         * be the first scene added to the Director.
         * <p>
         * The fps parameter will set the animation quality. Higher values,
         * means CAAT will try to render more frames in the same second (at the
         * expense of cpu power at least until hardware accelerated canvas rendering
         * context are available). A value of 60 is a high frame rate and should not be exceeded.
         *
         * @param fps {number} integer value indicating the target frames per second to run
         * the animation at.
         */
        renderFrame : function(fps, callback) {
            var t = new Date().getTime(),
                    delta = t - this.timeline;

            if ( this.onRenderStart ) {
                this.onRenderStart(delta);
            }

            this.render(delta);

            if ( this.debugInfo ) {
                this.debugInfo(this.size_total, this.size_active);
            }
            
            this.timeline = t;

            if (this.onRenderEnd) {
                this.onRenderEnd(delta);
            }
        },
        endLoop : function () {
        },
        /**
         * This method states whether the director must clear background before rendering
         * each frame.
         * @param clear {boolean} a boolean indicating whether to clear the screen before scene draw.
         * @return this.
         */
        setClear : function(clear) {
            this.clear = clear;
            return this;
        },
        /**
         * Get this Director's AudioManager instance.
         * @return {CAAT.AudioManager} the AudioManager instance.
         */
        getAudioManager : function() {
            return this.audioManager;
        },
        /**
         * Acculumate dom elements position to properly offset on-screen mouse/touch events.
         * @param node
         */
        cumulateOffset : function(node, parent, prop) {
            var left= prop+'Left';
            var top= prop+'Top';
            var x=0, y=0, style;

            while( node && node.style ) {
                if ( node.currentStyle ) {
                    style= node.currentStyle['position'];
                } else {
                    style= (node.ownerDocument.defaultView || node.ownerDocument.parentWindow).getComputedStyle(node, null);
                    style= style ? style.getPropertyValue('position') : null;
                }

//                if (!/^(relative|absolute|fixed)$/.test(style)) {
                if (!/^(fixed)$/.test(style)) {
                    x += node[left];
                    y+= node[top];
                    node = node[parent];
                } else {
                    break;
                }
            }

            return {
                x:      x,
                y:      y,
                style:  style
            };
        },
        getOffset : function( node ) {
            var res= this.cumulateOffset(node, 'offsetParent', 'offset');
            if ( res.style==='fixed' ) {
                var res2= this.cumulateOffset(node, node.parentNode ? 'parentNode' : 'parentElement', 'scroll');
                return {
                    x: res.x + res2.x,
                    y: res.y + res2.y
                };
            }

            return {
                x: res.x,
                y: res.y
            };
        },
        /**
         * Normalize input event coordinates to be related to (0,0) canvas position.
         * @param point {CAAT.Point} a CAAT.Point instance to hold the canvas coordinate.
         * @param e {MouseEvent} a mouse event from an input event.
         */
        getCanvasCoord : function(point, e) {

            var posx = 0;
            var posy = 0;
            if (!e) e = window.event;

            if (e.pageX || e.pageY) {
                posx = e.pageX;
                posy = e.pageY;
            }
            else if (e.clientX || e.clientY) {
                posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
                posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
            }

            var offset= this.getOffset(e.target);

            posx-= offset.x;
            posy-= offset.y;

            //////////////
            // transformar coordenada inversamente con affine transform de director.

            var pt= new CAAT.Point( posx, posy );
            this.modelViewMatrixI= this.modelViewMatrix.getInverse();
            this.modelViewMatrixI.transformCoord(pt);
            posx= pt.x;
            posy= pt.y

            point.set(posx, posy);
            this.screenMousePoint.set(posx, posy);

        },

        /**
         * Enable canvas input events.
         * Events sent to any CAAT.Actor instance will be as follows:
         *
         * MouseEnter
         *  if (press)
         *      MouseDown
         *      if (drag)
         *          MouseDrag
         *  if (release)
         *      MouseUp
         *      MouseClicked
         *  MouseExit
         *
         */
        enableEvents : function() {
            CAAT.RegisterDirector(this);

            var canvas = this.canvas;
            var me = this;
            var in_ = false;


            canvas.addEventListener('mouseup',
                    function(e) {
                        e.preventDefault();

                        me.isMouseDown = false;
                        me.getCanvasCoord(me.mousePoint, e);

                        var pos= null;

                        var lactor= me.lastSelectedActor;

                        if (null !== lactor) {
                            pos = lactor.viewToModel(
                                new CAAT.Point(me.screenMousePoint.x, me.screenMousePoint.y, 0));

                            if ( lactor.actionPerformed && lactor.contains(pos.x, pos.y) ) {
                                lactor.actionPerformed(e)
                            }

                            lactor.mouseUp(
                                new CAAT.MouseEvent().init(
                                    pos.x,
                                    pos.y,
                                    e,
                                    lactor,
                                    me.screenMousePoint));
                        }

                        if (!me.dragging && null !== lactor) {
                            if (lactor.contains(pos.x, pos.y)) {
                                lactor.mouseClick(
                                    new CAAT.MouseEvent().init(
                                        pos.x,
                                        pos.y,
                                        e,
                                        lactor,
                                        me.screenMousePoint));
                            }
                        }

                        me.dragging =           false;
                        in_=                    false;
                        CAAT.setCursor('default');
                    },
                    false);

            canvas.addEventListener('mousedown',
                    function(e) {

                        e.preventDefault();

                        me.getCanvasCoord(me.mousePoint, e);

                        me.isMouseDown = true;
                        var lactor = me.findActorAtPosition(me.mousePoint);

                        if (null !== lactor) {

                            var pos = lactor.viewToModel(
                                new CAAT.Point(me.screenMousePoint.x, me.screenMousePoint.y, 0));

                            // to calculate mouse drag threshold
                            lactor.mouseDown(
                                    new CAAT.MouseEvent().init(
                                        pos.x,
                                        pos.y,
                                        e,
                                        lactor,
                                        new CAAT.Point(
                                            me.screenMousePoint.x,
                                            me.screenMousePoint.y )));
                        }

                        me.lastSelectedActor= lactor;
                    },
                    false);

            canvas.addEventListener('mouseover',
                    function(e) {

                        e.preventDefault();
                        me.getCanvasCoord(me.mousePoint, e);

                        var lactor= me.findActorAtPosition( me.mousePoint );
                        var pos;

                        if (null !== lactor) {

                            pos = lactor.viewToModel(
                                new CAAT.Point(me.screenMousePoint.x, me.screenMousePoint.y, 0));

                            lactor.mouseEnter(
                                new CAAT.MouseEvent().init(
                                    pos.x,
                                    pos.y,
                                    e,
                                    lactor,
                                    me.screenMousePoint));
                        }

                        me.lastSelectedActor= lactor;
                    },
                    false);

            canvas.addEventListener('mouseout',
                    function(e) {

                        e.preventDefault();

                        if (null !== me.lastSelectedActor) {

                            me.getCanvasCoord(me.mousePoint, e);
                            var pos = new CAAT.Point(me.mousePoint.x, me.mousePoint.y, 0);
                            me.lastSelectedActor.viewToModel(pos);

                            me.lastSelectedActor.mouseExit(
                                    new CAAT.MouseEvent().init(
                                            pos.x,
                                            pos.y,
                                            e,
                                            me.lastSelectedActor,
                                            me.screenMousePoint));
                            me.lastSelectedActor = null;
                        }
                        me.isMouseDown = false;
                        in_ = false;
                    },
                    false);

            canvas.addEventListener('mousemove',
                    function(e) {

                        e.preventDefault();

                        me.getCanvasCoord(me.mousePoint, e);

                        var lactor;
                        var pos;

                        // drag
                        if (me.isMouseDown && null !== me.lastSelectedActor) {
/*
                            // check for mouse move threshold.
                            if (!me.dragging) {
                                if (Math.abs(me.prevMousePoint.x - me.mousePoint.x) < CAAT.DRAG_THRESHOLD_X &&
                                    Math.abs(me.prevMousePoint.y - me.mousePoint.y) < CAAT.DRAG_THRESHOLD_Y) {
                                    return;
                                }
                            }
*/
                            lactor = me.lastSelectedActor;
                            
                            pos = lactor.viewToModel(
                                new CAAT.Point(me.screenMousePoint.x, me.screenMousePoint.y, 0));

                            me.dragging = true;

                            var px= lactor.x;
                            var py= lactor.y;
                            lactor.mouseDrag(
                                    new CAAT.MouseEvent().init(
                                        pos.x,
                                        pos.y,
                                        e,
                                        lactor,
                                        new CAAT.Point(
                                            me.screenMousePoint.x,
                                            me.screenMousePoint.y)));

                            me.prevMousePoint.x= pos.x;
                            me.prevMousePoint.y= pos.y;
                            /**
                             * Element has not moved after drag, so treat it as a button.
                             *
                             */
                            if ( px===lactor.x && py===lactor.y )   {

                                var contains= lactor.contains(pos.x, pos.y);

                                if (in_ && !contains) {
                                    lactor.mouseExit(
                                        new CAAT.MouseEvent().init(
                                            pos.x,
                                            pos.y,
                                            e,
                                            lactor,
                                            me.screenMousePoint));
                                    in_ = false;
                                }

                                if (!in_ && contains ) {
                                    lactor.mouseEnter(
                                        new CAAT.MouseEvent().init(
                                            pos.x,
                                            pos.y,
                                            e,
                                            lactor,
                                            me.screenMousePoint));
                                    in_ = true;
                                }
                            }

                            return;
                        }

                        in_= true;

                        lactor = me.findActorAtPosition(me.mousePoint);

                        // cambiamos de actor.
                        if (lactor !== me.lastSelectedActor) {
                            if (null !== me.lastSelectedActor) {

                                pos = me.lastSelectedActor.viewToModel(
                                    new CAAT.Point(me.screenMousePoint.x, me.screenMousePoint.y, 0));

                                me.lastSelectedActor.mouseExit(
                                    new CAAT.MouseEvent().init(
                                        pos.x,
                                        pos.y,
                                        e,
                                        me.lastSelectedActor,
                                        me.screenMousePoint));
                            }
                            if (null !== lactor) {

                                pos = lactor.viewToModel(
                                    new CAAT.Point(me.screenMousePoint.x, me.screenMousePoint.y, 0));

                                lactor.mouseEnter(
                                    new CAAT.MouseEvent().init(
                                        pos.x,
                                        pos.y,
                                        e,
                                        lactor,
                                        me.screenMousePoint));
                            }
                        }

                        pos = lactor.viewToModel(
                            new CAAT.Point(me.screenMousePoint.x, me.screenMousePoint.y, 0));

                        if (null !== lactor) {

                            lactor.mouseMove(
                                new CAAT.MouseEvent().init(
                                    pos.x,
                                    pos.y,
                                    e,
                                    lactor,
                                    me.screenMousePoint));
                        }

                        me.lastSelectedActor = lactor;
                    },
                    false);

            canvas.addEventListener("dblclick",
                    function(e) {

                        e.preventDefault();

                        me.getCanvasCoord(me.mousePoint, e);
                        if (null !== me.lastSelectedActor) {

                            var pos = me.lastSelectedActor.viewToModel(
                                new CAAT.Point(me.screenMousePoint.x, me.screenMousePoint.y, 0));

                            me.lastSelectedActor.mouseDblClick(
                                    new CAAT.MouseEvent().init(
                                            me.mousePoint.x,
                                            me.mousePoint.y,
                                            e,
                                            me.lastSelectedActor,
                                            me.screenMousePoint));
                        }
                    },
                    false);


            function touchHandler(event) {
                var touches = event.changedTouches,
                        first = touches[0],
                        type = "";

                switch (event.type) {
                    case "touchstart": type = "mousedown"; break;
                    case "touchmove":  type = "mousemove"; break;
                    case "touchend":   type = "mouseup"; break;
                    default: return;
                }

                var simulatedEvent = document.createEvent("MouseEvent");
                simulatedEvent.initMouseEvent(
                        type,
                        true,
                        true,
                        me.canvas,
                        1,
                        first.screenX,
                        first.screenY,
                        first.clientX,
                        first.clientY,
                        false,
                        false,
                        false,
                        false,
                        0/*left*/,
                        null);

                me.canvas.dispatchEvent(simulatedEvent);
                event.preventDefault();
            }

            canvas.addEventListener("touchstart", touchHandler, true);
            canvas.addEventListener("touchmove", touchHandler, true);
            canvas.addEventListener("touchend", touchHandler, true);
            canvas.addEventListener("touchcancel", touchHandler, true);

        }

    };

    extend(CAAT.Director, CAAT.ActorContainer, null);
})();

// TODO: ease in out flip.
/*		flip : function( inSceneIndex, time ) {
 var ssin=this.scenes[ inSceneIndex ];
 var sout=null;

 this.childList= [];

 if ( this.currentScene!=null ) {
 sout= this.currentScene;
 this.scenes[ this.getSceneIndex(this.currentScene) ];
 sout.setFrameTime(this.time, Number.MAX_VALUE);
 sout.easeScaleOut(0, time/2, false, CAAT.Actor.prototype.ANCHOR_CENTER );
 this.addChild(sout);
 }

 ssin.setFrameTime(this.time/2, Number.MAX_VALUE);
 ssin.easeScaleIn( time/2, time/2, false, CAAT.Actor.prototype.ANCHOR_CENTER );
 this.addChild(ssin);
 },
 flipToNext : function( time ) {
 var currentSceneIndex= this.getSceneIndex(this.currentScene);

 if ( this.getNumScenes()<=1 || currentSceneIndex==this.getNumScenes()-1 ) {
 return;
 }

 this.flip( currentSceneIndex+1, time );
 },
 flipToPrev : function( time ) {
 var currentSceneIndex= this.getSceneIndex(this.currentScene);

 if ( this.getNumScenes()<=1 || currentSceneIndex==0 ) {
 return;
 }

 this.flip( currentSceneIndex-1, time );
 },*//**
 * See LICENSE file.
 *
 * MouseEvent is a class to hold necessary information of every mouse event related to concrete
 * scene graph Actors.
 *
 * Here it is also the logic to on mouse events, pump the correct event to the appropiate scene
 * graph Actor.
 *
 * TODO: add events for event pumping:
 *  + cancelBubling
 *
 **/


(function() {
    /**
     * This function creates a mouse event that represents a touch or mouse event.
     * @constructor
     */
	CAAT.MouseEvent = function() {
		this.point= new CAAT.Point(0,0,0);
		this.screenPoint= new CAAT.Point(0,0,0);
		return this;
	};
	
	CAAT.MouseEvent.prototype= {
		screenPoint:	null,
		point:			null,
		time:			0,
		source:			null,

        shift:          false,
        control:        false,
        alt:            false,
        meta:           false,

        sourceEvent:    null,

		init : function( x,y,sourceEvent,source,screenPoint ) {
			this.point.set(x,y);
			this.source=        source;
			this.screenPoint=   screenPoint;
            this.alt =          sourceEvent.altKey;
            this.control =      sourceEvent.ctrlKey;
            this.shift =        sourceEvent.shiftKey;
            this.meta =         sourceEvent.metaKey;
            this.sourceEvent=   sourceEvent;
            this.x=             x;
            this.y=             y;
			return this;
		},
		isAltDown : function() {
			return this.alt;
		},
		isControlDown : function() {
			return this.control;
		},
		isShiftDown : function() {
			return this.shift;
		},
        isMetaDown: function() {
            return this.meta;
        },
        getSourceEvent : function() {
            return this.sourceEvent;
        }
	};
})();

/**
 * Box2D point meter conversion ratio.
 */
CAAT.PMR= 64;

/**
 * Allow visual debugging artifacts.
 */
CAAT.DEBUG= false;

/**
 * Log function which deals with window's Console object.
 */
CAAT.log= function() {
    if(window.console){
        window.console.log( Array.prototype.slice.call(arguments) );
    }
};

CAAT.FRAME_TIME= 0;

/**
 * Flag to signal whether events are enabled for CAAT.
 */
CAAT.GlobalEventsEnabled=   false;

/**
 * Accelerometer related data.
 */
CAAT.prevOnDeviceMotion=    null;   // previous accelerometer callback function.
CAAT.onDeviceMotion=        null;   // current accelerometer callback set for CAAT.
CAAT.accelerationIncludingGravity= { x:0, y:0, z:0 };   // acceleration data.
CAAT.rotationRate= { alpha: 0, beta:0, gamma: 0 };      // angles data.

/**
 * Do not consider mouse drag gesture at least until you have dragged
 * 5 pixels in any direction.
 */
CAAT.DRAG_THRESHOLD_X=      5;
CAAT.DRAG_THRESHOLD_Y=      5;

// has the animation loop began ?
CAAT.renderEnabled= false;
CAAT.FPS=           60;

/**
 * On resize event listener
 */
CAAT.windowResizeListeners= [];

/**
 * Register an object as resize callback.
 * @param f {object{windowResized(width{number},height{number})}}
 */
CAAT.registerResizeListener= function(f) {
    CAAT.windowResizeListeners.push(f);
};

/**
 * Unregister a resize listener.
 * @param director {CAAT.Director}
 */
CAAT.unregisterResizeListener= function(director) {
    for( var i=0; i<CAAT.windowResizeListeners.length; i++ ) {
        if ( director===CAAT.windowResizeListeners[i] ) {
            CAAT.windowResizeListeners.splice(i,1);
            return;
        }
    }
};

/**
 * Pressed key codes.
 */
CAAT.keyListeners= [];

/**
 * Register key events notification function.
 * @param f {function(key {integer}, action {'down'|'up'})}
 */
CAAT.registerKeyListener= function(f) {
    CAAT.keyListeners.push(f);
};

CAAT.SHIFT_KEY=    16;
CAAT.CONTROL_KEY=  17;
CAAT.ALT_KEY=      18;
CAAT.ENTER_KEY=    13;

/**
 * Event modifiers.
 */
CAAT.KEY_MODIFIERS= {
    alt:        false,
    control:    false,
    shift:      false
};

/**
 * Enable window level input events, keys and redimension.
 */
CAAT.GlobalEnableEvents= function __GlobalEnableEvents() {

    if ( CAAT.GlobalEventsEnabled ) {
        return;
    }

    this.GlobalEventsEnabled= true;

    window.addEventListener('keydown',
        function(evt) {
            var key = (evt.which) ? evt.which : evt.keyCode;

            if ( key===CAAT.SHIFT_KEY ) {
                CAAT.KEY_MODIFIERS.shift= true;
            } else if ( key===CAAT.CONTROL_KEY ) {
                CAAT.KEY_MODIFIERS.control= true;
            } else if ( key===CAAT.ALT_KEY ) {
                CAAT.KEY_MODIFIERS.alt= true;
            } else {
                for( var i=0; i<CAAT.keyListeners.length; i++ ) {
                    CAAT.keyListeners[i](
                        key,
                        'down',
                        {
                            alt:        CAAT.KEY_MODIFIERS.alt,
                            control:    CAAT.KEY_MODIFIERS.control,
                            shift:      CAAT.KEY_MODIFIERS.shift
                        },
                        evt);
                }
            }
        },
        false);

    window.addEventListener('keyup',
        function(evt) {
            var key = (evt.which) ? evt.which : evt.keyCode;
            if ( key===CAAT.SHIFT_KEY ) {
                CAAT.KEY_MODIFIERS.shift= false;
            } else if ( key===CAAT.CONTROL_KEY ) {
                CAAT.KEY_MODIFIERS.control= false;
            } else if ( key===CAAT.ALT_KEY ) {
                CAAT.KEY_MODIFIERS.alt= false;
            } else {

                for( var i=0; i<CAAT.keyListeners.length; i++ ) {
                    CAAT.keyListeners[i](
                        key,
                        'up',
                        {
                            alt:        CAAT.KEY_MODIFIERS.alt,
                            control:    CAAT.KEY_MODIFIERS.control,
                            shift:      CAAT.KEY_MODIFIERS.shift
                        },
                        evt);
                }
            }
        },
        false );

    window.addEventListener('resize',
        function(evt) {
            for( var i=0; i<CAAT.windowResizeListeners.length; i++ ) {
                CAAT.windowResizeListeners[i].windowResized(
                        window.innerWidth,
                        window.innerHeight);
            }
        },
        false);
};

/**
 * Polyfill for requestAnimationFrame.
 */
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          window.oRequestAnimationFrame      ||
          window.msRequestAnimationFrame     ||
          function raf(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 1000 / CAAT.FPS);
          };
})();

/**
 * Main animation loop entry point.
 * @param fps {number} desired fps. This parameter makes no sense unless requestAnimationFrame function
 * is not present in the system.
 */
CAAT.loop= function(fps) {
    if (CAAT.renderEnabled) {
        return;
    }

    CAAT.FPS= fps || 60;
    CAAT.renderEnabled= true;
    if (CAAT.NO_PERF) {
        setInterval(
                function() {
                    for (var i = 0, l = CAAT.director.length; i < l; i++) {
                        CAAT.director[i].renderFrame();
                    }
                },
                1000 / CAAT.FPS
        );
    } else {
        CAAT.renderFrame();
    }
}

/**
 * Make a frame for each director instance present in the system.
 */
CAAT.renderFrame= function() {
    var t= new Date().getTime();
    for( var i=0, l=CAAT.director.length; i<l; i++ ) {
        CAAT.director[i].renderFrame();
    }
    t= new Date().getTime()-t;
    CAAT.FRAME_TIME= t;

    window.requestAnimFrame(CAAT.renderFrame, 0 )
}

/**
 * Set browser cursor. The preferred method for cursor change is this method.
 * @param cursor
 */
CAAT.setCursor= function(cursor) {
    if ( navigator.browser!=='iOS' ) {
        document.body.style.cursor= cursor;
    }
};

/**
 * Register and keep track of every CAAT.Director instance in the document.
 */
CAAT.RegisterDirector= function __CAATGlobal_RegisterDirector(director) {

    if ( !CAAT.director ) {
        CAAT.director=[];
    }
    CAAT.director.push(director);
    CAAT.GlobalEnableEvents();
};

/**
 * Enable at window level accelerometer events.
 */
(function() {

    function tilt(data) {
        CAAT.rotationRate= {
                alpha : 0,
                beta  : data[0],
                gamma : data[1]
            };
    }

    if (window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", function (event) {
            tilt([event.beta, event.gamma]);
        }, true);
    } else if (window.DeviceMotionEvent) {
        window.addEventListener('devicemotion', function (event) {
            tilt([event.acceleration.x * 2, event.acceleration.y * 2]);
        }, true);
    } else {
        window.addEventListener("MozOrientation", function (event) {
            tilt([-event.y * 45, event.x * 45]);
        }, true);
    }

})();/**
 * See LICENSE file.
 *
 * TODO: allow set of margins, spacing, etc. to define subimages.
 *
 **/


(function() {

    /**
     * This class is exclusively used by SpriteActor. This class is deprecated since the base CAAT.Actor
     * now is able to draw images.
     *
     * A CompoundImage is an sprite sheet. It encapsulates an Image and treates and references it as a two
     * dimensional array of row by columns sub-images. The access form will be sequential so if defined a
     * CompoundImage of more than one row, the subimages will be referenced by an index ranging from 0 to
     * rows*columns-1. Each sumimage will be of size (image.width/columns) by (image.height/rows).
     *
     * <p>
     * It is able to draw its sub-images in the following ways:
     * <ul>
     * <li>no transformed (default)
     * <li>flipped horizontally
     * <li>flipped vertically
     * <li>flipped both vertical and horizontally
     * </ul>
     *
     * <p>
     * It is supposed to be used in conjunction with <code>CAAT.SpriteActor</code> instances.
     *
     * @constructor
     *
     */
    CAAT.CompoundImage = function() {
        this.paint= this.paintN;
        return this;
    };

    CAAT.CompoundImage.prototype = {

        TR_NONE:				0,      // constants used to determine how to draw the sprite image,
        TR_FLIP_HORIZONTAL:		1,
        TR_FLIP_VERTICAL:		2,
        TR_FLIP_ALL:			3,

        image:                  null,
        rows:                   0,
        cols:                   0,
        width:                  0,
        height:                 0,
        singleWidth:            0,
        singleHeight:           0,

        xyCache:                null,

        /**
         * Initialize a grid of subimages out of a given image.
         * @param image {HTMLImageElement|Image} an image object.
         * @param rows {number} number of rows.
         * @param cols {number} number of columns
         *
         * @return this
         */
        initialize : function(image, rows, cols) {
            this.image = image;
            this.rows = rows;
            this.cols = cols;
            this.width = image.width;
            this.height = image.height;
            this.singleWidth = Math.floor(this.width / cols);
            this.singleHeight = Math.floor(this.height / rows);
            this.xyCache = [];

            var i,sx0,sy0;
            if (image.__texturePage) {
                image.__du = this.singleWidth / image.__texturePage.width;
                image.__dv = this.singleHeight / image.__texturePage.height;


                var w = this.singleWidth;
                var h = this.singleHeight;
                var mod = this.cols;
                if (image.inverted) {
                    var t = w;
                    w = h;
                    h = t;
                    mod = this.rows;
                }

                var xt = this.image.__tx;
                var yt = this.image.__ty;

                var tp = this.image.__texturePage;

                for (i = 0; i < rows * cols; i++) {


                    var c = ((i % mod) >> 0);
                    var r = ((i / mod) >> 0);

                    var u = xt + c * w;  // esquina izq x
                    var v = yt + r * h;

                    var u1 = u + w;
                    var v1 = v + h;

                    /*
                     var du= image.__du;
                     var dv= image.__dv;
                     var mod= this.cols;
                     if ( image.inverted) {
                     var t= du;
                     du= dv;
                     dv= t;
                     mod= this.rows;
                     }

                     sx0= ((i%mod)>>0)*du;
                     sy0= ((i/mod)>>0)*dv;

                     var u= image.__u+sx0;
                     var v= image.__v+sy0;

                     var u1= u+du;
                     var v1= v+dv;
                     */

                    this.xyCache.push([u / tp.width,v / tp.height,u1 / tp.width,v1 / tp.height,u,v,u1,v1]);
                }

            } else {
                for (i = 0; i < rows * cols; i++) {
                    sx0 = ((i % this.cols) | 0) * this.singleWidth;
                    sy0 = ((i / this.cols) | 0) * this.singleHeight;

                    this.xyCache.push([sx0,sy0]);
                }
            }

            return this;
        },
        /**
         * Draws the subimage pointed by imageIndex horizontally inverted.
         * @param canvas a canvas context.
         * @param imageIndex {number} a subimage index.
         * @param x {number} x position in canvas to draw the image.
         * @param y {number} y position in canvas to draw the image.
         *
         * @return this
         */
        paintInvertedH : function(canvas, imageIndex, x, y) {

            canvas.save();
            canvas.translate(((0.5 + x) | 0) + this.singleWidth, (0.5 + y) | 0);
            canvas.scale(-1, 1);

            canvas.drawImage(this.image,
                    this.xyCache[imageIndex][0], this.xyCache[imageIndex][1],
                    this.singleWidth, this.singleHeight,
                    0, 0, this.singleWidth, this.singleHeight);

            canvas.restore();

            return this;
        },
        /**
         * Draws the subimage pointed by imageIndex vertically inverted.
         * @param canvas a canvas context.
         * @param imageIndex {number} a subimage index.
         * @param x {number} x position in canvas to draw the image.
         * @param y {number} y position in canvas to draw the image.
         *
         * @return this
         */
        paintInvertedV : function(canvas, imageIndex, x, y) {

            canvas.save();
            canvas.translate((x + 0.5) | 0, (0.5 + y + this.singleHeight) | 0);
            canvas.scale(1, -1);

            canvas.drawImage(
                    this.image,
                    this.xyCache[imageIndex][0], this.xyCache[imageIndex][1],
                    this.singleWidth, this.singleHeight,
                    0, 0, this.singleWidth, this.singleHeight);

            canvas.restore();

            return this;
        },
        /**
         * Draws the subimage pointed by imageIndex both horizontal and vertically inverted.
         * @param canvas a canvas context.
         * @param imageIndex {number} a subimage index.
         * @param x {number} x position in canvas to draw the image.
         * @param y {number} y position in canvas to draw the image.
         *
         * @return this
         */
        paintInvertedHV : function(canvas, imageIndex, x, y) {

            canvas.save();
            canvas.translate((x + 0.5) | 0, (0.5 + y + this.singleHeight) | 0);
            canvas.scale(1, -1);
            canvas.translate(this.singleWidth, 0);
            canvas.scale(-1, 1);

            canvas.drawImage(
                    this.image,
                    this.xyCache[imageIndex][0], this.xyCache[imageIndex][1],
                    this.singleWidth, this.singleHeight,
                    0, 0, this.singleWidth, this.singleHeight);

            canvas.restore();

            return this;
        },
        /**
         * Draws the subimage pointed by imageIndex.
         * @param canvas a canvas context.
         * @param imageIndex {number} a subimage index.
         * @param x {number} x position in canvas to draw the image.
         * @param y {number} y position in canvas to draw the image.
         *
         * @return this
         */
        paintN : function(canvas, imageIndex, x, y) {
            canvas.drawImage(
                    this.image,
                    this.xyCache[imageIndex][0]>>0, this.xyCache[imageIndex][1]>>0,
                    this.singleWidth, this.singleHeight,
                    x>>0, y>>0, this.singleWidth, this.singleHeight);

            return this;
        },
        paint : function(canvas, imageIndex, x, y) {
            return this.paintN(canvas,imageIndex,x,y);
        },
        /**
         * Draws the subimage pointed by imageIndex scaled to the size of w and h.
         * @param canvas a canvas context.
         * @param imageIndex {number} a subimage index.
         * @param x {number} x position in canvas to draw the image.
         * @param y {number} y position in canvas to draw the image.
         * @param w {number} new width of the subimage.
         * @param h {number} new height of the subimage.
         *
         * @return this
         */
        paintScaled : function(canvas, imageIndex, x, y, w, h) {
            canvas.drawImage(
                    this.image,
                    this.xyCache[imageIndex][0], this.xyCache[imageIndex][1],
                    this.singleWidth, this.singleHeight,
                    (x + 0.5) | 0, (y + 0.5) | 0, w, h);

            return this;
        },
        /**
         * Get the number of subimages in this compoundImage
         * @return {number}
         */
        getNumImages : function() {
            return this.rows * this.cols;
        },
        setUV : function(imageIndex, uvBuffer, uvIndex) {
            var im = this.image;

            if (!im.__texturePage) {
                return;
            }

            var index = uvIndex;

            if (im.inverted) {
                uvBuffer[index++] = this.xyCache[imageIndex][2];
                uvBuffer[index++] = this.xyCache[imageIndex][1];

                uvBuffer[index++] = this.xyCache[imageIndex][2];
                uvBuffer[index++] = this.xyCache[imageIndex][3];

                uvBuffer[index++] = this.xyCache[imageIndex][0];
                uvBuffer[index++] = this.xyCache[imageIndex][3];

                uvBuffer[index++] = this.xyCache[imageIndex][0];
                uvBuffer[index++] = this.xyCache[imageIndex][1];
            } else {
                uvBuffer[index++] = this.xyCache[imageIndex][0];
                uvBuffer[index++] = this.xyCache[imageIndex][1];

                uvBuffer[index++] = this.xyCache[imageIndex][2];
                uvBuffer[index++] = this.xyCache[imageIndex][1];

                uvBuffer[index++] = this.xyCache[imageIndex][2];
                uvBuffer[index++] = this.xyCache[imageIndex][3];

                uvBuffer[index++] = this.xyCache[imageIndex][0];
                uvBuffer[index++] = this.xyCache[imageIndex][3];
            }

            //director.uvIndex= index;
        }
    };
})();


(function() {

    /**
     *
     * This class is used by CAAT.Actor to draw images. It differs from CAAT.CompoundImage in that it
     * manages the subimage change based on time and a list of animation sub-image indexes.
     * A common use of this class will be:
     * 
     * <code>
     *     var si= new CAAT.SpriteImage().
     *          initialize( an_image_instance, rows, columns ).
     *          setAnimationImageIndex( [2,1,0,1] ).                // cycle throwout image with these indexes
     *          setChangeFPS( 200 ).                                // change sprite every 200 ms.
     *          setSpriteTransformation( CAAT.SpriteImage.TR_xx);   // optionally draw images inverted, ...
     * </code>
     *
     * A SpriteImage is an sprite sheet. It encapsulates an Image and treates and references it as a two
     * dimensional array of row by columns sub-images. The access form will be sequential so if defined a
     * CompoundImage of more than one row, the subimages will be referenced by an index ranging from 0 to
     * rows*columns-1. Each sumimage will be of size (image.width/columns) by (image.height/rows).
     *
     * <p>
     * It is able to draw its sub-images in the following ways:
     * <ul>
     * <li>no transformed (default)
     * <li>flipped horizontally
     * <li>flipped vertically
     * <li>flipped both vertical and horizontally
     * </ul>
     *
     * <p>
     * It is supposed to be used in conjunction with <code>CAAT.SpriteActor</code> instances.
     *
     * @constructor
     *
     */
    CAAT.SpriteImage = function() {
        this.paint= this.paintN;
        this.setAnimationImageIndex([0]);
        return this;
    };

    CAAT.SpriteImage.prototype = {

        animationImageIndex:    null,   // an Array defining the sprite frame sequence
        prevAnimationTime:		-1,
        changeFPS:				1000,   // how much Scene time to take before changing an Sprite frame.
        transformation:			0,      // any of the TR_* constants.
        spriteIndex:			0,      // the current sprite frame

        TR_NONE:				0,      // constants used to determine how to draw the sprite image,
        TR_FLIP_HORIZONTAL:		1,
        TR_FLIP_VERTICAL:		2,
        TR_FLIP_ALL:			3,
        TR_FIXED_TO_SIZE:       4,

        image:                  null,
        rows:                   1,
        columns:                1,
        width:                  0,
        height:                 0,
        singleWidth:            0,
        singleHeight:           0,

        scaleX:                 1,
        scaleY:                 1,

        offsetX:                0,
        offsetY:                0,

        xyCache:                null,

        ownerActor:             null,

        setOwner : function(actor) {
            this.ownerActor= actor;
            return this;
        },
        getRows: function() {
            return this.rows;
        },
        getColumns : function() {
            return this.columns;
        },
        /**
         * Get a reference to the same image information (rows, columns, image and uv cache) of this
         * SpriteImage. This means that re-initializing this objects image info (that is, calling initialize
         * method) will change all reference's image information at the same time.
         */
        getRef : function() {
            var ret=            new CAAT.SpriteImage();
            ret.image=          this.image;
            ret.rows=           this.rows;
            ret.columns=        this.columns;
            ret.width=          this.width;
            ret.height=         this.height;
            ret.singleWidth=    this.singleWidth;
            ret.singleHeight=   this.singleHeight;
            ret.xyCache=        this.xyCache;
            ret.offsetX=        this.offsetX;
            ret.offsetY=        this.offsetY;
            ret.scaleX=         this.scaleX;
            ret.scaleY=         this.scaleY;
            return ret;
        },
        /**
         * Set horizontal displacement to draw image. Positive values means drawing the image more to the
         * right.
         * @param x {number}
         * @return this
         */
        setOffsetX : function(x) {
            this.offsetX= x|0;
            return this;
        },
        /**
         * Set vertical displacement to draw image. Positive values means drawing the image more to the
         * bottom.
         * @param y {number}
         * @return this
         */
        setOffsetY : function(y) {
            this.offsetY= y|0;
            return this;
        },
        setOffset : function( x,y ) {
            this.offsetX= x;
            this.offsetY= y;
            return this;
        },
        /**
         * Initialize a grid of subimages out of a given image.
         * @param image {HTMLImageElement|Image} an image object.
         * @param rows {number} number of rows.
         * @param columns {number} number of columns
         *
         * @return this
         */
        initialize : function(image, rows, columns) {
            this.image = image;
            this.rows = rows;
            this.columns = columns;
            this.width = image.width;
            this.height = image.height;
            this.singleWidth = Math.floor(this.width / columns);
            this.singleHeight = Math.floor(this.height / rows);
            this.xyCache = [];

            var i,sx0,sy0;
            if (image.__texturePage) {
                image.__du = this.singleWidth / image.__texturePage.width;
                image.__dv = this.singleHeight / image.__texturePage.height;


                var w = this.singleWidth;
                var h = this.singleHeight;
                var mod = this.columns;
                if (image.inverted) {
                    var t = w;
                    w = h;
                    h = t;
                    mod = this.rows;
                }

                var xt = this.image.__tx;
                var yt = this.image.__ty;

                var tp = this.image.__texturePage;

                for (i = 0; i < rows * columns; i++) {


                    var c = ((i % mod) >> 0);
                    var r = ((i / mod) >> 0);

                    var u = xt + c * w;  // esquina izq x
                    var v = yt + r * h;

                    var u1 = u + w;
                    var v1 = v + h;

                    this.xyCache.push([u / tp.width,v / tp.height,u1 / tp.width,v1 / tp.height,u,v,u1,v1]);
                }

            } else {
                for (i = 0; i < rows * columns; i++) {
                    sx0 = ((i % this.columns) | 0) * this.singleWidth;
                    sy0 = ((i / this.columns) | 0) * this.singleHeight;

                    this.xyCache.push([sx0,sy0]);
                }
            }

            return this;
        },
        /**
         * Draws the subimage pointed by imageIndex horizontally inverted.
         * @param canvas a canvas context.
         * @param imageIndex {number} a subimage index.
         * @param x {number} x position in canvas to draw the image.
         * @param y {number} y position in canvas to draw the image.
         *
         * @return this
         */
        paintInvertedH : function(director, time, x, y) {

            this.setSpriteIndexAtTime(time);

            var ctx= director.ctx;
            ctx.save();
            ctx.translate(((0.5 + x) | 0) + this.singleWidth, (0.5 + y) | 0);
            ctx.scale(-1, 1);

            ctx.drawImage(this.image,
                    this.xyCache[this.spriteIndex][0], this.xyCache[this.spriteIndex][1],
                    this.singleWidth, this.singleHeight,
                    this.offsetX>>0, this.offsetY>>0, this.singleWidth, this.singleHeight);

            ctx.restore();

            return this;
        },
        /**
         * Draws the subimage pointed by imageIndex vertically inverted.
         * @param canvas a canvas context.
         * @param imageIndex {number} a subimage index.
         * @param x {number} x position in canvas to draw the image.
         * @param y {number} y position in canvas to draw the image.
         *
         * @return this
         */
        paintInvertedV : function(director, time, x, y) {

            this.setSpriteIndexAtTime(time);

            var ctx= director.ctx;
            ctx.save();
            ctx.translate((x + 0.5) | 0, (0.5 + y + this.singleHeight) | 0);
            ctx.scale(1, -1);

            ctx.drawImage(
                    this.image,
                    this.xyCache[this.spriteIndex][0], this.xyCache[this.spriteIndex][1],
                    this.singleWidth, this.singleHeight,
                    this.offsetX>>0,this.offsetY>>0, this.singleWidth, this.singleHeight);

            ctx.restore();

            return this;
        },
        /**
         * Draws the subimage pointed by imageIndex both horizontal and vertically inverted.
         * @param canvas a canvas context.
         * @param imageIndex {number} a subimage index.
         * @param x {number} x position in canvas to draw the image.
         * @param y {number} y position in canvas to draw the image.
         *
         * @return this
         */
        paintInvertedHV : function(director, time, x, y) {

            this.setSpriteIndexAtTime(time);

            var ctx= director.ctx;
            ctx.save();
            ctx.translate((x + 0.5) | 0, (0.5 + y + this.singleHeight) | 0);
            ctx.scale(1, -1);
            ctx.translate(this.singleWidth, 0);
            ctx.scale(-1, 1);

            ctx.drawImage(
                this.image,
                this.xyCache[this.spriteIndex][0], this.xyCache[this.spriteIndex][1],
                this.singleWidth, this.singleHeight,
                this.offsetX>>0, this.offsetY>>0,
                this.singleWidth, this.singleHeight);

            ctx.restore();

            return this;
        },
        /**
         * Draws the subimage pointed by imageIndex.
         * @param canvas a canvas context.
         * @param imageIndex {number} a subimage index.
         * @param x {number} x position in canvas to draw the image.
         * @param y {number} y position in canvas to draw the image.
         *
         * @return this
         */
        paintN : function(director, time, x, y) {
            this.setSpriteIndexAtTime(time);

            director.ctx.drawImage(
                this.image,
                this.xyCache[this.spriteIndex][0]>>0, this.xyCache[this.spriteIndex][1]>>0,
                this.singleWidth, this.singleHeight,
                (this.offsetX+x)>>0, (this.offsetY+y)>>0,
                this.singleWidth, this.singleHeight);

            return this;
        },
        /**
         * Draws the subimage pointed by imageIndex scaled to the size of w and h.
         * @param canvas a canvas context.
         * @param imageIndex {number} a subimage index.
         * @param x {number} x position in canvas to draw the image.
         * @param y {number} y position in canvas to draw the image.
         * @param w {number} new width of the subimage.
         * @param h {number} new height of the subimage.
         *
         * @return this
         */
        paintScaled : function(director, time, x, y) {
            this.setSpriteIndexAtTime(time);
            director.ctx.drawImage(
                    this.image,
                    this.xyCache[this.spriteIndex][0], this.xyCache[this.spriteIndex][1],
                    this.singleWidth, this.singleHeight,
                    x>>0, y>>0, this.ownerActor.width, this.ownerActor.height );

            return this;
        },
        getCurrentSpriteImageCSSPosition : function() {
            return '-'+(this.xyCache[this.spriteIndex][0]-this.offsetX)+'px '+
                   '-'+(this.xyCache[this.spriteIndex][1]-this.offsetY)+'px';
        },
        /**
         * Get the number of subimages in this compoundImage
         * @return {number}
         */
        getNumImages : function() {
            return this.rows * this.columns;
        },
        /**
         * TODO: set mapping coordinates for different transformations.
         * @param imageIndex
         * @param uvBuffer
         * @param uvIndex
         */
        setUV : function(uvBuffer, uvIndex) {
            var im = this.image;

            if (!im.__texturePage) {
                return;
            }

            var index = uvIndex;
            var sIndex= this.spriteIndex;
            var u=  this.xyCache[sIndex][0];
            var v=  this.xyCache[sIndex][1];
            var u1= this.xyCache[sIndex][2];
            var v1= this.xyCache[sIndex][3];
            if ( this.offsetX || this.offsetY ) {
                var w=  this.ownerActor.width;
                var h=  this.ownerActor.height;

                var tp= im.__texturePage;

                var _u= -this.offsetX / tp.width;
                var _v= -this.offsetY / tp.height;
                var _u1=(w-this.offsetX) / tp.width;
                var _v1=(h-this.offsetY) / tp.height;

                u=      _u  + im.__u;
                v=      _v  + im.__v;
                u1=     _u1 + im.__u;
                v1=     _v1 + im.__v;
            }

            if (im.inverted) {
                uvBuffer[index++] = u1;
                uvBuffer[index++] = v;

                uvBuffer[index++] = u1;
                uvBuffer[index++] = v1;

                uvBuffer[index++] = u;
                uvBuffer[index++] = v1;

                uvBuffer[index++] = u;
                uvBuffer[index++] = v;
            } else {
                uvBuffer[index++] = u;
                uvBuffer[index++] = v;

                uvBuffer[index++] = u1;
                uvBuffer[index++] = v;

                uvBuffer[index++] = u1;
                uvBuffer[index++] = v1;

                uvBuffer[index++] = u;
                uvBuffer[index++] = v1;
            }
        },
        /**
         * Set the elapsed time needed to change the image index.
         * @param fps an integer indicating the time in milliseconds to change.
         * @return this
         */
        setChangeFPS : function(fps) {
            this.changeFPS= fps;
            return this;
        },
        /**
         * Set the transformation to apply to the Sprite image.
         * Any value of
         *  <li>TR_NONE
         *  <li>TR_FLIP_HORIZONTAL
         *  <li>TR_FLIP_VERTICAL
         *  <li>TR_FLIP_ALL
         *
         * @param transformation an integer indicating one of the previous values.
         * @return this
         */
        setSpriteTransformation : function( transformation ) {
            this.transformation= transformation;
            switch(transformation)	{
				case this.TR_FLIP_HORIZONTAL:
					this.paint= this.paintInvertedH;
					break;
				case this.TR_FLIP_VERTICAL:
					this.paint= this.paintInvertedV;
					break;
				case this.TR_FLIP_ALL:
					this.paint= this.paintInvertedHV;
					break;
                case this.TR_FIXED_TO_SIZE:
                    this.paint= this.paintScaled;
                    break;
				default:
					this.paint= this.paintN;
			}
            return this;
        },
        /**
         * Set the sprite animation images index.
         *
         * @param aAnimationImageIndex an array indicating the Sprite's frames.
         */
		setAnimationImageIndex : function( aAnimationImageIndex ) {
			this.animationImageIndex= aAnimationImageIndex;
			this.spriteIndex= aAnimationImageIndex[0];

            return this;
		},
        setSpriteIndex : function(index) {
            this.spriteIndex= index;
            return this;
        },
        /**
         * Draws the sprite image calculated and stored in spriteIndex.
         *
         * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
         * @param time an integer indicating the Scene time when the bounding box is to be drawn.
         */
		setSpriteIndexAtTime : function(time) {

            if ( this.animationImageIndex.length>1 ) {
                if ( this.prevAnimationTime===-1 )	{
                    this.prevAnimationTime= time;
                    this.spriteIndex=0;
                }
                else	{
                    var ttime= time;
                    ttime-= this.prevAnimationTime;
                    ttime/= this.changeFPS;
                    ttime%= this.animationImageIndex.length;
                    this.spriteIndex= this.animationImageIndex[Math.floor(ttime)];
                }
            }
        }

    };
})();/**
 * See LICENSE file.
 *
 * Image/Resource preloader.
 *
 *
 **/


(function() {
    /**
     * This class is a image resource loader. It accepts an object of the form:
     *
     * {
     *   id1: string_url1,
     *   id2: string_url2,
     *   id3: string_url3,
     *   ...
     * }
     *
     * and on resources loaded correctly, will return an object of the form:
     *
     * {
     *   id1: HTMLImageElement,
     *   id2: HTMLImageElement,
     *   id3: HTMLImageElement,
     *   ...
     * }
     *
     * @constructor
     */
    CAAT.ImagePreloader = function()   {
        this.images = [];
        return this;
    };

    CAAT.ImagePreloader.prototype =   {

        images:                 null,   // a list of elements to load
        notificationCallback:   null,   // notification callback invoked for each image loaded.
        imageCounter:           0,      // elements counter.

        /**
         * Start images loading asynchronous process. This method will notify every image loaded event
         * and is responsibility of the caller to count the number of loaded images to see if it fits his
         * needs.
         * 
         * @param aImages {{ id:{url}, id2:{url}, ...} an object with id/url pairs.
         * @param callback_loaded_one_image {function( imageloader {CAAT.ImagePreloader}, counter {number}, images {{ id:{string}, image: {Image}}} )}
         * function to call on every image load.
         */
        loadImages: function( aImages, callback_loaded_one_image ) {

            if (!aImages) {
                if (callback_loaded_one_image ) {
                    callback_loaded_one_image(0,[]);
                }
            }

            var me= this, i;
            this.notificationCallback = callback_loaded_one_image;
            this.images= [];
            for( i=0; i<aImages.length; i++ ) {
                this.images.push( {id:aImages[i].id, image: new Image() } );
            }

            for( i=0; i<aImages.length; i++ ) {
                this.images[i].image.onload = function imageLoaded() {
                    me.imageCounter++;
                    me.notificationCallback(me.imageCounter, me.images);
                };
                this.images[i].image.src= aImages[i].url;
            }

            if ( aImages.length===0 ) {
                callback_loaded_one_image(0,[]);
            }
        }

    };
})();/**
 * See LICENSE file.
 */
(function() {
    /**
     * This class defines a timer action which is constrained to Scene time, so every Scene has the
     * abbility to create its own TimerTask objects. They must not be created by calling scene's
     * createTime method.
     *
     * <p>
     * A TimerTask is defined at least by:
     * <ul>
     *  <li>startTime: since when the timer will be active
     *  <li>duration:  from startTime to startTime+duration, the timerTask will be notifying (if set) the callback callback_tick.
     * </ul>
     * <p>
     * Upon TimerTask expiration, the TimerTask will notify (if set) the callback function callback_timeout.
     * Upon a call to the method cancel, the timer will be set expired, and (if set) the callback to callback_cancel will be
     * invoked.
     * <p>
     * Timer notifications will be performed <strong>BEFORE<strong> scene loop.
     *
     * @constructor
     *
     */
    CAAT.TimerTask= function() {
        return this;
    };

    CAAT.TimerTask.prototype= {
        startTime:          0,
        duration:           0,
        callback_timeout:   null,
        callback_tick:      null,
        callback_cancel:    null,

        scene:              null,
        taskId:             0,
        remove:             false,

        /**
         * Create a TimerTask.
         * The taskId will be set by the scene.
         * @param startTime {number} an integer indicating TimerTask enable time.
         * @param duration {number} an integer indicating TimerTask duration.
         * @param callback_timeout {function( sceneTime {number}, timertaskTime{number}, timertask {CAAT.TimerTask} )} on timeout callback function.
         * @param callback_tick {function( sceneTime {number}, timertaskTime{number}, timertask {CAAT.TimerTask} )} on tick callback function.
         * @param callback_cancel {function( sceneTime {number}, timertaskTime{number}, timertask {CAAT.TimerTask} )} on cancel callback function.
         *
         * @return this
         */
        create: function( startTime, duration, callback_timeout, callback_tick, callback_cancel ) {
            this.startTime=         startTime;
            this.duration=          duration;
            this.callback_timeout=  callback_timeout;
            this.callback_tick=     callback_tick;
            this.callback_cancel=   callback_cancel;
            return this;
        },
        /**
         * Performs TimerTask operation. The task will check whether it is in frame time, and will
         * either notify callback_timeout or callback_tick.
         *
         * @param time {number} an integer indicating scene time.
         * @return this
         *
         * @protected
         *
         */
        checkTask : function(time) {
            var ttime= time;
            ttime-= this.startTime;
            if ( ttime>=this.duration ) {
                this.remove= true;
                if( this.callback_timeout ) {
                    this.callback_timeout( time, ttime, this );
                }
            } else {
                if ( this.callback_tick ) {
                    this.callback_tick( time, ttime, this );
                }
            }
            return this;
        },
        /**
         * Reschedules this TimerTask by changing its startTime to current scene's time.
         * @param time {number} an integer indicating scene time.
         * @return this
         */
        reset : function( time ) {
            this.remove= false;
            this.startTime=  time;
            this.scene.ensureTimerTask(this);
            return this;
        },
        /**
         * Cancels this timer by removing it on scene's next frame. The function callback_cancel will
         * be called.
         * @return this
         */
        cancel : function() {
            this.remove= true;
            if ( null!=this.callback_cancel ) {
                this.callback_cancel( this.scene.time, this.scene.time-this.startTime, this );
            }
            return this;
        }
    };
})();
/**
* See LICENSE file.
 *
 */

(function() {
    /**
     * Scene is the top level ActorContainer of the Director at any given time.
     * The only time when 2 scenes could be active will be during scene change.
     * An scene controls the way it enters/exits the scene graph. It is also the entry point for all
     * input related and timed related events to every actor on screen.
     *
     * @constructor
     * @extends CAAT.ActorContainer
     *
     */
	CAAT.Scene= function() {
		CAAT.Scene.superclass.constructor.call(this);
        this.timerList= [];
        this.fillStyle= null;
		return this;
	};
	
	CAAT.Scene.prototype= {
		
		easeContainerBehaviour:			null,   // Behavior container used uniquely for Scene switching.
		easeContainerBehaviourListener: null,   // who to notify about container behaviour events. Array.
		easeIn:							false,  // When Scene switching, this boolean identifies whether the
                                                // Scene is being brought in, or taken away.

        EASE_ROTATION:					1,      // Constant values to identify the type of Scene transition
		EASE_SCALE:						2,      // to perform on Scene switching by the Director.
		EASE_TRANSLATE:					3,

        timerList:                      null,   // collection of CAAT.TimerTask objects.
        timerSequence:                  0,      // incremental CAAT.TimerTask id.

        paused:                         false,

        isPaused :  function()  {
            return this.paused;
        },

        setPaused : function( paused ) {
            this.paused= paused;
        },
        /**
         * Check and apply timers in frame time.
         * @param time {number} the current Scene time.
         */
        checkTimers : function(time) {
            var tl= this.timerList;
            var i=tl.length-1;
            while( i>=0 ) {
                if ( !tl[i].remove ) {
                    tl[i].checkTask(time);
                }
                i--;
            }
        },
        /**
         * Make sure the timertask is contained in the timer task list by adding it to the list in case it
         * is not contained.
         * @param timertask {CAAT.TimerTask} a CAAT.TimerTask object.
         * @return this
         */
        ensureTimerTask : function( timertask ) {
            if ( !this.hasTimer(timertask) ) {
                this.timerList.push(timertask);
            }
            return this;
        },
        /**
         * Check whether the timertask is in this scene's timer task list.
         * @param timertask {CAAT.TimerTask} a CAAT.TimerTask object.
         * @return {boolean} a boolean indicating whether the timertask is in this scene or not.
         */
        hasTimer : function( timertask ) {
            var tl= this.timerList;
            var i=tl.length-1;
            while( i>=0 ) {
                if ( tl[i]===timertask ) {
                    return true;
                }
                i--;
            }

            return false;
        },
        /**
         * Creates a timer task. Timertask object live and are related to scene's time, so when an Scene
         * is taken out of the Director the timer task is paused, and resumed on Scene restoration.
         *
         * @param startTime {number} an integer indicating the scene time this task must start executing at.
         * @param duration {number} an integer indicating the timerTask duration.
         * @param callback_timeout {function} timer on timeout callback function.
         * @param callback_tick {function} timer on tick callback function.
         * @param callback_cancel {function} timer on cancel callback function.
         *
         * @return {CAAT.TimerTask} a CAAT.TimerTask class instance.
         */
        createTimer : function( startTime, duration, callback_timeout, callback_tick, callback_cancel ) {

            var tt= new CAAT.TimerTask().create(
                        startTime,
                        duration,
                        callback_timeout, 
                        callback_tick,
                        callback_cancel );

            tt.taskId= this.timerSequence++;
            tt.sceneTime = this.time;
            tt.scene= this;

            this.timerList.push( tt );

            return tt;
        },
        /**
         * Removes expired timers. This method must not be called directly.
         */
        removeExpiredTimers : function() {
            var i;
            var tl= this.timerList;
            for( i=0; i<tl.length; i++ ) {
                if ( tl[i].remove ) {
                    tl.splice(i,1);
                }
            }
        },
        /**
         * Scene animation method.
         * It extends Container's base behavior by adding timer control.
         * @param director {CAAT.Director} a CAAT.Director instance.
         * @param time {number} an integer indicating the Scene time the animation is being performed at.
         */
        animate : function(director, time) {
            this.checkTimers(time);
            CAAT.Scene.superclass.animate.call(this,director,time);
            this.removeExpiredTimers();
        },
        /**
         * Helper method to manage alpha transparency fading on Scene switch by the Director.
         * @param time {number} integer indicating the time in milliseconds the fading will take.
         * @param isIn {boolean} boolean indicating whether this Scene in the switch process is
         * being brought in.
         *
         * @private
         */
		createAlphaBehaviour: function(time, isIn) {
			var ab= new CAAT.AlphaBehavior();
			ab.setFrameTime( 0, time );
			ab.startAlpha= isIn ? 0 : 1;
			ab.endAlpha= isIn ? 1 : 0;
			this.easeContainerBehaviour.addBehavior(ab);
		},
        /**
         * Called from CAAT.Director to bring in an Scene.
         * A helper method for easeTranslation.
         * @param time integer indicating time in milliseconds for the Scene to be brought in.
         * @param alpha boolean indicating whether fading will be applied to the Scene.
         * @param anchor integer indicating the Scene switch anchor.
         * @param interpolator CAAT.Interpolator to apply to the Scene transition.
         */
		easeTranslationIn : function( time, alpha, anchor, interpolator ) {
            this.easeTranslation( time, alpha, anchor, true, interpolator );
        },
        /**
         * Called from CAAT.Director to bring in an Scene.
         * A helper method for easeTranslation.
         * @param time integer indicating time in milliseconds for the Scene to be taken away.
         * @param alpha boolean indicating whether fading will be applied to the Scene.
         * @param anchor integer indicating the Scene switch anchor.
         * @param interpolator CAAT.Interpolator to apply to the Scene transition.
         */
        easeTranslationOut : function( time, alpha, anchor, interpolator ) {
            this.easeTranslation( time, alpha, anchor, false, interpolator );
        },
        /**
         * This method will setup Scene behaviours to switch an Scene via a translation.
         * The anchor value can only be
         *  <li>CAAT.Actor.prototype.ANCHOR_LEFT
         *  <li>CAAT.Actor.prototype.ANCHOR_RIGHT
         *  <li>CAAT.Actor.prototype.ANCHOR_TOP
         *  <li>CAAT.Actor.prototype.ANCHOR_BOTTOM
         * if any other value is specified, any of the previous ones will be applied.
         *
         * @param time integer indicating time in milliseconds for the Scene.
         * @param alpha boolean indicating whether fading will be applied to the Scene.
         * @param anchor integer indicating the Scene switch anchor.
         * @param isIn boolean indicating whether the scene will be brought in.
         * @param interpolator {CAAT.Interpolator} a CAAT.Interpolator to apply to the Scene transition.
         */
		easeTranslation : function( time, alpha, anchor, isIn, interpolator ) {

            this.easeContainerBehaviour= new CAAT.ContainerBehavior();
            this.easeIn= isIn;

            var pb= new CAAT.PathBehavior();
            if ( interpolator ) {
                pb.setInterpolator( interpolator );
            }

            pb.setFrameTime( 0, time );

            // BUGBUG anchors: 1..4
            if ( anchor<1 ) {
                anchor=1;
            } else if ( anchor>4 ) {
                anchor= 4;
            }


			switch(anchor) {
			case CAAT.Actor.prototype.ANCHOR_TOP:
                if ( isIn ) {
                    pb.setPath( new CAAT.Path().setLinear( 0, -this.height, 0, 0) );
                } else {
                    pb.setPath( new CAAT.Path().setLinear( 0, 0, 0, -this.height) );
                }
                break;
            case CAAT.Actor.prototype.ANCHOR_BOTTOM:
                if ( isIn ) {
                    pb.setPath( new CAAT.Path().setLinear( 0, this.height, 0, 0) );
                } else {
                    pb.setPath( new CAAT.Path().setLinear( 0, 0, 0, this.height) );
                }
                break;
            case CAAT.Actor.prototype.ANCHOR_LEFT:
                if ( isIn ) {
                    pb.setPath( new CAAT.Path().setLinear( -this.width, 0, 0, 0) );
                } else {
                    pb.setPath( new CAAT.Path().setLinear( 0, 0, -this.width, 0) );
                }
                break;
            case CAAT.Actor.prototype.ANCHOR_RIGHT:
                if ( isIn ) {
                    pb.setPath( new CAAT.Path().setLinear( this.width, 0, 0, 0) );
                } else {
                    pb.setPath( new CAAT.Path().setLinear( 0, 0, this.width, 0) );
                }
                break;
            }

			if (alpha) {
				this.createAlphaBehaviour(time,isIn);
			}

			this.easeContainerBehaviour.addBehavior(pb);

			this.easeContainerBehaviour.setFrameTime( this.time, time );
			this.easeContainerBehaviour.addListener(this);

			this.emptyBehaviorList();
			CAAT.Scene.superclass.addBehavior.call( this, this.easeContainerBehaviour );
		},
        /**
         * Called from CAAT.Director to bring in a Scene.
         * A helper method for easeScale.
         * @param time integer indicating time in milliseconds for the Scene to be brought in.
         * @param alpha boolean indicating whether fading will be applied to the Scene.
         * @param anchor integer indicating the Scene switch anchor.
         * @param interpolator {CAAT.Interpolator} a CAAT.Interpolator to apply to the Scene transition.
         * @param starttime integer indicating in milliseconds from which scene time the behavior will be applied.
         */
		easeScaleIn : function(starttime,time,alpha,anchor,interpolator) {
			this.easeScale(starttime,time,alpha,anchor,true,interpolator);
			this.easeIn= true;
		},
        /**
         * Called from CAAT.Director to take away a Scene.
         * A helper method for easeScale.
         * @param time integer indicating time in milliseconds for the Scene to be taken away.
         * @param alpha boolean indicating whether fading will be applied to the Scene.
         * @param anchor integer indicating the Scene switch anchor.
         * @param interpolator {CAAT.Interpolator} a CAAT.Interpolator instance to apply to the Scene transition.
         * @param starttime integer indicating in milliseconds from which scene time the behavior will be applied.
         */
		easeScaleOut : function(starttime,time,alpha,anchor,interpolator) {
			this.easeScale(starttime,time,alpha,anchor,false,interpolator);
			this.easeIn= false;
		},
        /**
         * Called from CAAT.Director to bring in ot take away an Scene.
         * @param time integer indicating time in milliseconds for the Scene to be taken away.
         * @param alpha boolean indicating whether fading will be applied to the Scene.
         * @param anchor integer indicating the Scene switch anchor.
         * @param interpolator {CAAT.Interpolator} a CAAT.Interpolator to apply to the Scene transition.
         * @param starttime integer indicating in milliseconds from which scene time the behavior will be applied.
         * @param isIn boolean indicating whether the Scene is being brought in.
         */
		easeScale : function(starttime,time,alpha,anchor,isIn,interpolator) {
			this.easeContainerBehaviour= new CAAT.ContainerBehavior();

			var x=0;
			var y=0;
			var x2=0;
			var y2=0;

			switch(anchor) {
			case CAAT.Actor.prototype.ANCHOR_TOP_LEFT:
			case CAAT.Actor.prototype.ANCHOR_TOP_RIGHT:
			case CAAT.Actor.prototype.ANCHOR_BOTTOM_LEFT:
			case CAAT.Actor.prototype.ANCHOR_BOTTOM_RIGHT:
			case CAAT.Actor.prototype.ANCHOR_CENTER:
				x2=1;
				y2=1;
				break;
			case CAAT.Actor.prototype.ANCHOR_TOP:
			case CAAT.Actor.prototype.ANCHOR_BOTTOM:
				x=1;
				x2=1;
				y=0;
				y2=1;
				break;
			case CAAT.Actor.prototype.ANCHOR_LEFT:
			case CAAT.Actor.prototype.ANCHOR_RIGHT:
				y=1;
				y2=1;
				x=0;
				x2=1;
				break;
			default:
				alert('scale anchor ?? '+anchor);
			}

			if ( !isIn ) {
				var tmp;
				tmp= x;
				x= x2;
				x2= tmp;
				
				tmp= y;
				y= y2;
				y2= tmp;
			}
			
			if (alpha) {
				this.createAlphaBehaviour(time,isIn);
			}

            var anchorPercent= this.getAnchorPercent(anchor);
			var sb= new CAAT.ScaleBehavior().
			        setFrameTime( starttime, time ).
                    setValues(x,x2,y,y2, anchorPercent.x, anchorPercent.y);

            if ( interpolator ) {
                sb.setInterpolator(interpolator);
            }

			this.easeContainerBehaviour.addBehavior(sb);
			
			this.easeContainerBehaviour.setFrameTime( this.time, time );
			this.easeContainerBehaviour.addListener(this);
			
			this.emptyBehaviorList();
			CAAT.Scene.superclass.addBehavior.call( this, this.easeContainerBehaviour );
		},
		/**
         * Overriden method to disallow default behavior.
		 * Do not use directly.
		 */
		addBehavior : function(behaviour) {
			return this;
		},
        /**
         * Called from CAAT.Director to use Rotations for bringing in.
         * This method is a Helper for the method easeRotation.
         * @param time integer indicating time in milliseconds for the Scene to be brought in.
         * @param alpha boolean indicating whether fading will be applied to the Scene.
         * @param anchor integer indicating the Scene switch anchor.
         * @param interpolator {CAAT.Interpolator} a CAAT.Interpolator to apply to the Scene transition.
         */
		easeRotationIn : function(time,alpha,anchor,interpolator) {
			this.easeRotation(time,alpha,anchor,true, interpolator);
			this.easeIn= true;
		},
        /**
         * Called from CAAT.Director to use Rotations for taking Scenes away.
         * This method is a Helper for the method easeRotation.
         * @param time integer indicating time in milliseconds for the Scene to be taken away.
         * @param alpha boolean indicating whether fading will be applied to the Scene.
         * @param anchor integer indicating the Scene switch anchor.
         * @param interpolator {CAAT.Interpolator} a CAAT.Interpolator to apply to the Scene transition.
         */
		easeRotationOut : function(time,alpha,anchor,interpolator) {
			this.easeRotation(time,alpha,anchor,false,interpolator);
			this.easeIn= false;
		},
        /**
         * Called from CAAT.Director to use Rotations for taking away or bringing Scenes in.
         * @param time integer indicating time in milliseconds for the Scene to be taken away or brought in.
         * @param alpha boolean indicating whether fading will be applied to the Scene.
         * @param anchor integer indicating the Scene switch anchor.
         * @param interpolator {CAAT.Interpolator} a CAAT.Interpolator to apply to the Scene transition.
         * @param isIn boolean indicating whehter the Scene is brought in.
         */
		easeRotation : function(time,alpha,anchor,isIn,interpolator) {
			this.easeContainerBehaviour= new CAAT.ContainerBehavior();
			
			var start=0;
			var end=0;

            if (anchor==CAAT.Actor.prototype.ANCHOR_CENTER ) {
                anchor= CAAT.Actor.prototype.ANCHOR_TOP;
            }

			switch(anchor) {
			case CAAT.Actor.prototype.ANCHOR_TOP:
			case CAAT.Actor.prototype.ANCHOR_BOTTOM:
			case CAAT.Actor.prototype.ANCHOR_LEFT:
			case CAAT.Actor.prototype.ANCHOR_RIGHT:
				start= Math.PI * (Math.random()<0.5 ? 1 : -1);
				break;
			case CAAT.Actor.prototype.ANCHOR_TOP_LEFT:
			case CAAT.Actor.prototype.ANCHOR_TOP_RIGHT:
			case CAAT.Actor.prototype.ANCHOR_BOTTOM_LEFT:
			case CAAT.Actor.prototype.ANCHOR_BOTTOM_RIGHT:
				start= Math.PI/2 * (Math.random()<0.5 ? 1 : -1);
				break;
			default:
				alert('rot anchor ?? '+anchor);
			}

			if ( false===isIn ) {
				var tmp= start;
				start=end;
				end= tmp;
			}

			if ( alpha ) {
				this.createAlphaBehaviour(time,isIn);
			}

            var anchorPercent= this.getAnchorPercent(anchor);
			var rb= new CAAT.RotateBehavior().
			        setFrameTime( 0, time ).
                    setValues( start, end, anchorPercent.x, anchorPercent.y );

            if ( interpolator ) {
                rb.setInterpolator(interpolator);
            }
			this.easeContainerBehaviour.addBehavior(rb);
			this.easeContainerBehaviour.setFrameTime( this.time, time );
			this.easeContainerBehaviour.addListener(this);
			
			this.emptyBehaviorList();
			CAAT.Scene.superclass.addBehavior.call( this, this.easeContainerBehaviour );
		},
        /**
         * Registers a listener for listen for transitions events.
         * Al least, the Director registers himself as Scene easing transition listener.
         * When the transition is done, it restores the Scene's capability of receiving events.
         * @param listener {function(caat_behavior,time,actor)} an object which contains a method of the form <code>
         * behaviorExpired( caat_behaviour, time, actor);
         */
		setEaseListener : function( listener ) {
			this.easeContainerBehaviourListener=listener;
		},
        /**
         * Private.
         * listener for the Scene's easeContainerBehaviour.
         * @param actor
         */
		behaviorExpired : function(actor) {
			this.easeContainerBehaviourListener.easeEnd(this, this.easeIn);
		},
        /**
         * This method should be overriden in case the developer wants to do some special actions when
         * the scene has just been brought in.
         */
        activated : function() {
        },
        /**
         * Scenes, do not expire the same way Actors do.
         * It simply will be set expired=true, but the frameTime won't be modified.
         */
        setExpired : function(bExpired) {
            this.expired= bExpired;
        },
        /**
         * An scene by default does not paint anything because has not fillStyle set.
         * @param director
         * @param time
         */
        paint : function(director, time) {

            if ( this.fillStyle ) {
                var ctx= director.crc;
                ctx.fillStyle= this.fillStyle;
                ctx.fillRect(0,0,this.width,this.height );
            }
        }
	};

    extend( CAAT.Scene, CAAT.ActorContainer, null);
})();/**
 * See LICENSE file.
 *
 * @author  Mario Gonzalez || http://onedayitwillmake.com
 *
 **/


/**
 * @namespace
 */
CAAT.modules = CAAT.modules || {};

/**
 * @namespace
 */
CAAT.modules.CircleManager = CAAT.modules.CircleManager || {};/**
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
})();/**
 *
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
(function()
{
    /**
     * @constructor
     */
	CAAT.modules.CircleManager.PackedCircleManager= function()
	{
		return this;
	};

	CAAT.modules.CircleManager.PackedCircleManager.prototype = {
		allCircles:					[],
		numberOfCollisionPasses:	1,
		numberOfTargetingPasses:	0,
		bounds:						new CAAT.Rectangle(),

		/**
		 * Adds a circle to the simulation
		 * @param aCircle
		 */
		addCircle: function(aCircle)
		{
			aCircle.id = this.allCircles.length;
			this.allCircles.push(aCircle);
			return this;
		},

		/**
		 * Removes a circle from the simulations
		 * @param aCircle	Circle to remove
		 */
		removeCircle: function(aCircle)
		{
			var index = 0,
				found = false,
				len = this.allCircles.length;

			if(len === 0) {
				throw "Error: (PackedCircleManager) attempting to remove circle, and allCircles.length === 0!!";
			}

			while (len--) {
				if(this.allCircles[len] === aCircle) {
					found = true;
					index = len;
					break;
				}
			}

			if(!found) {
				throw "Could not locate circle in allCircles array!";
			}

			// Remove
			this.allCircles[index].dealloc();
			this.allCircles[index] = null;

			return this;
		},

		/**
		 * Forces all circles to move to where their delegate position is
		 * Assumes all targets have a 'position' property!
		 */
		forceCirclesToMatchDelegatePositions: function()
		{
			var len = this.allCircles.length;

			// push toward target position
			for(var n = 0; n < len; n++)
			{
				var aCircle = this.allCircles[n];
				if(!aCircle || !aCircle.delegate) {
					continue;
				}

				aCircle.position.set(aCircle.delegate.x + aCircle.offset.x,
						aCircle.delegate.y + aCircle.offset.y);
			}
		},

		pushAllCirclesTowardTarget: function(aTarget)
		{
			var v = new CAAT.Point(0,0,0),
				circleList = this.allCircles,
				len = circleList.length;

			// push toward target position
			for(var n = 0; n < this.numberOfTargetingPasses; n++)
			{
				for(var i = 0; i < len; i++)
				{
					var c = circleList[i];

					if(c.isFixed) continue;

					v.x = c.position.x - (c.targetPosition.x+c.offset.x);
					v.y = c.position.y - (c.targetPosition.y+c.offset.y);
					v.multiply(c.targetChaseSpeed);

					c.position.x -= v.x;
					c.position.y -= v.y;
				}
			}
		},

		/**
		 * Packs the circles towards the center of the bounds.
		 * Each circle will have it's own 'targetPosition' later on
		 */
		handleCollisions: function()
		{
			this.removeExpiredElements();

			var v = new CAAT.Point(0,0, 0),
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
								if(ci.isFixed)
									v.multiply(2.2);	// Double inverse force to make up for the fact that the other object is fixed

								// ADD the velocity
								cj.position.translatePoint(v);
							}

							// Move ci opposite of the collision as long as its not fixed
							if(!ci.isFixed)
							{
								if(cj.isFixed)
									v.multiply(2.2);	// Double inverse force to make up for the fact that the other object is fixed

								 // SUBTRACT the velocity
								ci.position.subtract(v);
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

			// Wrap X
			if(boundsRule & wrapXMask && xpos-diameter > this.bounds.right) {
				aCircle.position.x = this.bounds.left + radius;
			} else if(boundsRule & wrapXMask && xpos+diameter < this.bounds.left) {
				aCircle.position.x = this.bounds.right - radius;
			}
			// Wrap Y
			if(boundsRule & wrapYMask && ypos-diameter > this.bounds.bottom) {
				aCircle.position.y = this.bounds.top - radius;
			} else if(boundsRule & wrapYMask && ypos+diameter < this.bounds.top) {
				aCircle.position.y = this.bounds.bottom + radius;
			}

			// Constrain X
			if(boundsRule & constrainXMask && xpos+radius >= this.bounds.right) {
				aCircle.position.x = aCircle.position.x = this.bounds.right-radius;
			} else if(boundsRule & constrainXMask && xpos-radius < this.bounds.left) {
				aCircle.position.x = this.bounds.left + radius;
			}

			// Constrain Y
			if(boundsRule & constrainYMask && ypos+radius > this.bounds.bottom) {
				aCircle.position.y = this.bounds.bottom - radius;
			} else if(boundsRule & constrainYMask && ypos-radius < this.bounds.top) {
				aCircle.position.y = this.bounds.top + radius;
			}
		},

		/**
		 * Given an x,y position finds circle underneath and sets it to the currently grabbed circle
		 * @param {Number} xpos		An x position
		 * @param {Number} ypos		A y position
		 * @param {Number} buffer	A radiusSquared around the point in question where something is considered to match
		 */
		getCircleAt: function(xpos, ypos, buffer)
		{
			var circleList = this.allCircles;
			var len = circleList.length;
			var grabVector = new CAAT.Point(xpos, ypos, 0);

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

		circlesCanCollide: function(circleA, circleB)
		{
		    if(!circleA || !circleB || circleA===circleB) return false; 					// one is null (will be deleted next loop), or both point to same obj.
//			if(circleA.delegate == null || circleB.delegate == null) return false;					// This circle will be removed next loop, it's entity is already removed

//			if(circleA.isFixed & circleB.isFixed) return false;
//			if(circleA.delegate .clientID === circleB.delegate.clientID) return false; 				// Don't let something collide with stuff it owns

			// They dont want to collide
//			if((circleA.collisionGroup & circleB.collisionMask) == 0) return false;
//			if((circleB.collisionGroup & circleA.collisionMask) == 0) return false;

			return true;
		},
/**
 * Accessors
 */
		setBounds: function(x, y, w, h)
		{
			this.bounds.x = x;
			this.bounds.y = y;
			this.bounds.width = w;
			this.bounds.height = h;
		},

		setNumberOfCollisionPasses: function(value)
		{
			this.numberOfCollisionPasses = value;
			return this;
		},

		setNumberOfTargetingPasses: function(value)
		{
			this.numberOfTargetingPasses = value;
			return this;
		},

/**
 * Helpers
 */
		sortOnDistanceToTarget: function(circleA, circleB)
		{
			var valueA = circleA.getDistanceSquaredFromPosition(circleA.targetPosition);
			var valueB = circleB.getDistanceSquaredFromPosition(circleA.targetPosition);
			var comparisonResult = 0;

			if(valueA > valueB) comparisonResult = -1;
			else if(valueA < valueB) comparisonResult = 1;

			return comparisonResult;
		},

/**
 * Memory Management
 */
		removeExpiredElements: function()
		{
			// remove null elements
			for (var k = this.allCircles.length; k >= 0; k--) {
				if (this.allCircles[k] === null)
					this.allCircles.splice(k, 1);
			}
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
})();/**
 * See LICENSE file.
 *
 **/

(function() {
    /**
     * Local storage management.
     * @constructor
     */
    CAAT.modules.LocalStorage= function() {
        return this;
    };

    CAAT.modules.LocalStorage.prototype= {
        /**
         * Stores an object in local storage. The data will be saved as JSON.stringify.
         * @param key {string} key to store data under.
         * @param data {object} an object.
         * @return this
         *
         * @static
         */
        save : function( key, data ) {
            try {
                localStorage.setItem( key, JSON.stringify(data) );
            } catch(e) {
                // eat it
            }
            return this;
        },
        /**
         * Retrieve a value from local storage.
         * @param key {string} the key to retrieve.
         * @return {object} object stored under the key parameter.
         *
         * @static
         */
        load : function( key ) {
            try {
                return JSON.parse(localStorage.getItem( key ));
            } catch(e) {
                return null;
            }
        },
        /**
         * Removes a value stored in local storage.
         * @param key {string}
         * @return this
         *
         * @static
         */
        remove : function( key ) {
            try {
                localStorage.removeItem(key);
            } catch(e) {
                // eat it
            }
            return this;
        }
    };

})();
/**
 * See LICENSE file.
 */

(function() {

    CAAT.modules.ImageUtil= function() {
        return this;
    };

    CAAT.modules.ImageUtil.prototype= {
        createAlphaSpriteSheet: function(maxAlpha, minAlpha, sheetSize, image, bg_fill_style ) {

            if ( maxAlpha<minAlpha ) {
                var t= maxAlpha;
                maxAlpha= minAlpha;
                minAlpha= t;
            }

            var canvas= document.createElement('canvas');
            canvas.width= image.width;
            canvas.height= image.height*sheetSize;
            var ctx= canvas.getContext('2d');
            ctx.fillStyle = bg_fill_style ? bg_fill_style : 'rgba(255,255,255,0)';
            ctx.fillRect(0,0,image.width,image.height*sheetSize);

            var i;
            for( i=0; i<sheetSize; i++ ) {
                ctx.globalAlpha= 1-(maxAlpha-minAlpha)/sheetSize*(i+1);
                ctx.drawImage(image, 0, i*image.height);
            }

            return canvas;
        },
        /**
         * Creates a rotated canvas image element.
         * @param img
         */
        rotate : function( image, angle ) {

            angle= angle||0;
            if ( !angle ) {
                return image;
            }

            var canvas= document.createElement("canvas");
            canvas.width= image.height;
            canvas.height= image.width;
            var ctx= canvas.getContext('2d');
            ctx.globalAlpha= 1;
            ctx.fillStyle='rgba(0,0,0,0)';
            ctx.clearRect(0,0,canvas.width,canvas.height);

            var m= new CAAT.Matrix();
            m.multiply( new CAAT.Matrix().setTranslate( canvas.width/2, canvas.width/2 ) );
            m.multiply( new CAAT.Matrix().setRotation( angle*Math.PI/180 ) );
            m.multiply( new CAAT.Matrix().setTranslate( -canvas.width/2, -canvas.width/2 ) );
            m.transformRenderingContext(ctx);
            ctx.drawImage(image,0,0);

            return canvas;
        },
        /**
         * Remove an image's padding transparent border.
         * Transparent means that every scan pixel is alpha=0.
         * @param image
         * @param threshold {integer} any value below or equal to this will be optimized.
         */
        optimize : function(image, threshold) {
            threshold>>=0;

            var canvas= document.createElement('canvas');
            canvas.width= image.width;
            canvas.height=image.height;
            var ctx= canvas.getContext('2d');

            ctx.fillStyle='rgba(0,0,0,0)';
            ctx.fillRect(0,0,image.width,image.height);
            ctx.drawImage( image, 0, 0 );

            var imageData= ctx.getImageData(0,0,image.width,image.height);
            var data= imageData.data;

            var i,j;
            var miny= canvas.height, maxy=0;
            var minx= canvas.width, maxx=0;

            var alpha= false;
            for( i=0; i<canvas.height; i++ ) {
                for( j=0; j<canvas.width; j++ ) {
                    if ( data[i*canvas.width*4 + 3+j*4]>threshold ) {
                        alpha= true;
                        break;
                    }
                }

                if ( alpha ) {
                    break;
                }
            }
            // i contiene el indice del ultimo scan que no es transparente total.
            miny= i;

            alpha= false;
            for( i=canvas.height-1; i>=miny; i-- ) {
                for( j=3; j<canvas.width*4; j+=4 ) {
                    if ( data[i*canvas.width*4 + 3+j*4]>threshold ) {
                        alpha= true;
                        break;
                    }
                }

                if ( alpha ) {
                    break;
                }
            }
            maxy= i;


            alpha= false;
            for( j=0; j<canvas.width; j++ ) {
                for( i=0; i<canvas.height; i++ ) {
                    if ( data[i*canvas.width*4 + 3+j*4 ]>threshold ) {
                        alpha= true;
                        break;
                    }
                }
                if ( alpha ) {
                    break;
                }
            }
            minx= j;

            alpha= false;
            for( j=canvas.width-1; j>=minx; j-- ) {
                for( i=0; i<canvas.height; i++ ) {
                    if ( data[i*canvas.width*4 + 3+j*4 ]>threshold ) {
                        alpha= true;
                        break;
                    }
                }
                if ( alpha ) {
                    break;
                }
            }
            maxx= j;

            if ( 0===minx && 0===miny && canvas.width-1===maxx && canvas.height-1===maxy ) {
                return canvas;
            }

            var width= maxx-minx+1;
            var height=maxy-miny+1;
            var id2= ctx.getImageData( minx, miny, width, height );

            canvas.width= width;
            canvas.height= height;
            ctx= canvas.getContext('2d');
            ctx.putImageData( id2, 0, 0 );

            return canvas;
        },
        createThumb : function(image, w, h, best_fit) {
            w= w||24;
            h= h||24;
            var canvas= document.createElement('canvas');
            canvas.width= w;
            canvas.height= h;
            var ctx= canvas.getContext('2d');

            if ( best_fit ) {
                var max= Math.max( image.width, image.height );
                var ww= image.width/max*w;
                var hh= image.height/max*h;
                ctx.drawImage( image, (w-ww)/2,(h-hh)/2,ww,hh );
            } else {
                ctx.drawImage( image, 0, 0, w, h );
            }

            return canvas;
        }
    };

})();/**
 * See LICENSE file.
 */

(function() {
    CAAT.modules.LayoutUtils= {};

    CAAT.modules.LayoutUtils.row= function( dst, what_to_layout_array, constraint_object ) {

        var width= dst.width;
        var x=0, y=0, i=0, l=0;
        var actor_max_h= Number.MIN_VALUE, actor_max_w= Number.MAX_VALUE;

        // compute max/min actor list size.
        for( i=what_to_layout_array.length-1; i; i-=1 ) {
            if ( actor_max_w<what_to_layout_array[i].width ) {
                actor_max_w= what_to_layout_array[i].width;
            }
            if ( actor_max_h<what_to_layout_array[i].height ) {
                actor_max_h= what_to_layout_array[i].height;
            }
        }

        if ( constraint_object.padding_left ) {
            x= constraint_object.padding_left;
            width-= x;
        }
        if ( constraint_object.padding_right ) {
            width-= constraint_object.padding_right;
        }

        if ( constraint_object.top ) {
            var top= parseInt(constraint_object.top, 10);
            if ( !isNaN(top) ) {
                y= top;
            } else {
                // not number
                switch(constraint_object.top) {
                    case 'center':
                        y= (dst.height-actor_max_h)/2;
                        break;
                    case 'top':
                        y=0;
                        break;
                    case 'bottom':
                        y= dst.height-actor_max_h;
                        break;
                    default:
                        y= 0;
                }
            }
        }

        // space for each actor
        var actor_area= width / what_to_layout_array.length;

        for( i=0, l=what_to_layout_array.length; i<l; i++ ) {
            what_to_layout_array[i].setLocation(
                x + i * actor_area + (actor_area - what_to_layout_array[i].width) / 2,
                y);
        }

    };
})();/**
 * See LICENSE file.
 *
 * Generate interpolator.
 *
 * Partially based on Robert Penner easing equations.
 * http://www.robertpenner.com/easing/
 *
 *
 **/


(function() {
    /**
     * a CAAT.Interpolator is a function which transforms a value into another but with some constraints:
     *
     * <ul>
     * <li>The input values must be between 0 and 1.
     * <li>Output values will be between 0 and 1.
     * <li>Every Interpolator has at least an entering boolean parameter called pingpong. if set to true, the Interpolator
     * will set values from 0..1 and back from 1..0. So half the time for each range.
     * </ul>
     *
     * <p>
     * CAAt.Interpolator is defined by a createXXXX method which sets up an internal getPosition(time)
     * function. You could set as an Interpolator up any object which exposes a method getPosition(time)
     * and returns a CAAT.Point or an object of the form {x:{number}, y:{number}}.
     * <p>
     * In the return value, the x attribute's value will be the same value as that of the time parameter,
     * and y attribute will hold a value between 0 and 1 with the resulting value of applying the
     * interpolation function for the time parameter.
     *
     * <p>
     * For am exponential interpolation, the getPosition function would look like this:
     * <code>function getPosition(time) { return { x:time, y: Math.pow(time,2) }Ê}</code>.
     * meaning that for time=0.5, a value of 0,5*0,5 should use instead.
     *
     * <p>
     * For a visual understanding of interpolators see tutorial 4 interpolators, or play with technical
     * demo 1 where a SpriteActor moves along a path and the way it does can be modified by every
     * out-of-the-box interpolator.
     *
     * @constructor
     *
     */
    CAAT.Interpolator = function() {
        this.interpolated= new CAAT.Point(0,0,0);
        return this;
    };

    CAAT.Interpolator.prototype= {

        interpolated:   null,   // a coordinate holder for not building a new CAAT.Point for each interpolation call.
        paintScale:     90,     // the size of the interpolation draw on screen in pixels.

        /**
         * Set a linear interpolation function.
         *
         * @param bPingPong {boolean}
         * @param bInverse {boolean} will values will be from 1 to 0 instead of 0 to 1 ?.
         */
        createLinearInterpolator : function(bPingPong, bInverse) {
            /**
             * Linear and inverse linear interpolation function.
             * @param time {number}
             */
            this.getPosition= function getPosition(time) {

                var orgTime= time;

                if ( bPingPong ) {
                    if ( time<0.5 ) {
                        time*=2;
                    } else {
                        time= 1-(time-0.5)*2;
                    }
                }

                if ( bInverse!==null && bInverse ) {
                    time= 1-time;
                }

                return this.interpolated.set(orgTime,time);
            };

            return this;
        },
        createBackOutInterpolator : function(bPingPong) {
            this.getPosition= function getPosition(time) {
                var orgTime= time;

                if ( bPingPong ) {
                    if ( time<0.5 ) {
                        time*=2;
                    } else {
                        time= 1-(time-0.5)*2;
                    }
                }

                time = time - 1;
                var overshoot= 1.70158;

                return this.interpolated.set(
                        orgTime,
                        time * time * ((overshoot + 1) * time + overshoot) + 1);
            };

            return this;
        },
        /**
         * Set an exponential interpolator function. The function to apply will be Math.pow(time,exponent).
         * This function starts with 0 and ends in values of 1.
         *
         * @param exponent {number} exponent of the function.
         * @param bPingPong {boolean}
         */
        createExponentialInInterpolator : function(exponent, bPingPong) {
            this.getPosition= function getPosition(time) {
                var orgTime= time;

                if ( bPingPong ) {
                    if ( time<0.5 ) {
                        time*=2;
                    } else {
                        time= 1-(time-0.5)*2;
                    }
                }
                return this.interpolated.set(orgTime,Math.pow(time,exponent));
            };

            return this;
        },
        /**
         * Set an exponential interpolator function. The function to apply will be 1-Math.pow(time,exponent).
         * This function starts with 1 and ends in values of 0.
         *
         * @param exponent {number} exponent of the function.
         * @param bPingPong {boolean}
         */
        createExponentialOutInterpolator : function(exponent, bPingPong) {
            this.getPosition= function getPosition(time) {
                var orgTime= time;

                if ( bPingPong ) {
                    if ( time<0.5 ) {
                        time*=2;
                    } else {
                        time= 1-(time-0.5)*2;
                    }
                }
                return this.interpolated.set(orgTime,1-Math.pow(1-time,exponent));
            };

            return this;
        },
        /**
         * Set an exponential interpolator function. Two functions will apply:
         * Math.pow(time*2,exponent)/2 for the first half of the function (t<0.5) and
         * 1-Math.abs(Math.pow(time*2-2,exponent))/2 for the second half (t>=.5)
         * This function starts with 0 and goes to values of 1 and ends with values of 0.
         *
         * @param exponent {number} exponent of the function.
         * @param bPingPong {boolean}
         */
        createExponentialInOutInterpolator : function(exponent, bPingPong) {
            this.getPosition= function getPosition(time) {
                var orgTime= time;

                if ( bPingPong ) {
                    if ( time<0.5 ) {
                        time*=2;
                    } else {
                        time= 1-(time-0.5)*2;
                    }
                }
                if ( time*2<1 ) {
                    return this.interpolated.set(orgTime,Math.pow(time*2,exponent)/2);
                }
                
                return this.interpolated.set(orgTime,1-Math.abs(Math.pow(time*2-2,exponent))/2);
            };

            return this;
        },
        /**
         * Creates a Quadric bezier curbe as interpolator.
         *
         * @param p0 {CAAT.Point} a CAAT.Point instance.
         * @param p1 {CAAT.Point} a CAAT.Point instance.
         * @param p2 {CAAT.Point} a CAAT.Point instance.
         * @param bPingPong {boolean} a boolean indicating if the interpolator must ping-pong.
         */
        createQuadricBezierInterpolator : function(p0,p1,p2,bPingPong) {
            this.getPosition= function getPosition(time) {
                var orgTime= time;

                if ( bPingPong ) {
                    if ( time<0.5 ) {
                        time*=2;
                    } else {
                        time= 1-(time-0.5)*2;
                    }
                }

                time= (1-time)*(1-time)*p0.y + 2*(1-time)*time*p1.y + time*time*p2.y;

                return this.interpolated.set( orgTime, time );
            };

            return this;
        },
        /**
         * Creates a Cubic bezier curbe as interpolator.
         *
         * @param p0 {CAAT.Point} a CAAT.Point instance.
         * @param p1 {CAAT.Point} a CAAT.Point instance.
         * @param p2 {CAAT.Point} a CAAT.Point instance.
         * @param p3 {CAAT.Point} a CAAT.Point instance.
         * @param bPingPong {boolean} a boolean indicating if the interpolator must ping-pong.
         */
        createCubicBezierInterpolator : function(p0,p1,p2,p3,bPingPong) {
            this.getPosition= function getPosition(time) {
                var orgTime= time;

                if ( bPingPong ) {
                    if ( time<0.5 ) {
                        time*=2;
                    } else {
                        time= 1-(time-0.5)*2;
                    }
                }

                var t2= time*time;
                var t3= time*t2;

                time = (p0.y + time * (-p0.y * 3 + time * (3 * p0.y -
                        p0.y * time))) + time * (3 * p1.y + time * (-6 * p1.y +
                        p1.y * 3 * time)) + t2 * (p2.y * 3 - p2.y * 3 * time) +
                        p3.y * t3;

                return this.interpolated.set( orgTime, time );
            };

            return this;
        },
        createElasticOutInterpolator : function(amplitude,p,bPingPong) {
            this.getPosition= function getPosition(time) {

            if ( bPingPong ) {
                if ( time<0.5 ) {
                    time*=2;
                } else {
                    time= 1-(time-0.5)*2;
                }
            }

            if (time === 0) {
                return {x:0,y:0};
            }
            if (time === 1) {
                return {x:1,y:1};
            }

            var s = p/(2*Math.PI) * Math.asin (1/amplitude);
            return this.interpolated.set(
                    time,
                    (amplitude*Math.pow(2,-10*time) * Math.sin( (time-s)*(2*Math.PI)/p ) + 1 ) );
            };
            return this;
        },
        createElasticInInterpolator : function(amplitude,p,bPingPong) {
            this.getPosition= function getPosition(time) {

            if ( bPingPong ) {
                if ( time<0.5 ) {
                    time*=2;
                } else {
                    time= 1-(time-0.5)*2;
                }
            }

            if (time === 0) {
                return {x:0,y:0};
            }
            if (time === 1) {
                return {x:1,y:1};
            }

            var s = p/(2*Math.PI) * Math.asin (1/amplitude);
            return this.interpolated.set(
                    time,
                    -(amplitude*Math.pow(2,10*(time-=1)) * Math.sin( (time-s)*(2*Math.PI)/p ) ) );
            };

            return this;
        },
        createElasticInOutInterpolator : function(amplitude,p,bPingPong) {
            this.getPosition= function getPosition(time) {

            if ( bPingPong ) {
                if ( time<0.5 ) {
                    time*=2;
                } else {
                    time= 1-(time-0.5)*2;
                }
            }

            var s = p/(2*Math.PI) * Math.asin (1/amplitude);
            time*=2;
            if ( time<=1 ) {
                return this.interpolated.set(
                        time,
                        -0.5*(amplitude*Math.pow(2,10*(time-=1)) * Math.sin( (time-s)*(2*Math.PI)/p )));
            }

            return this.interpolated.set(
                    time,
                    1+0.5*(amplitude*Math.pow(2,-10*(time-=1)) * Math.sin( (time-s)*(2*Math.PI)/p )));
            };

            return this;
        },
        /**
         * @param time {number}
         * @private
         */
        bounce : function(time) {
            if ((time /= 1) < (1 / 2.75)) {
                return {x:time, y:7.5625 * time * time};
            } else if (time < (2 / 2.75)) {
                return {x:time, y:7.5625 * (time -= (1.5 / 2.75)) * time + 0.75};
            } else if (time < (2.5 / 2.75)) {
                return {x:time, y:7.5625 * (time -= (2.25 / 2.75)) * time + 0.9375};
            } else {
                return {x:time, y:7.5625*(time-=(2.625/2.75))*time+0.984375};
            }
        },
        createBounceOutInterpolator : function(bPingPong) {
            this.getPosition= function getPosition(time) {
                if ( bPingPong ) {
                    if ( time<0.5 ) {
                        time*=2;
                    } else {
                        time= 1-(time-0.5)*2;
                    }
                }
                return this.bounce(time);
            };

            return this;
        },
        createBounceInInterpolator : function(bPingPong) {

            this.getPosition= function getPosition(time) {
                if ( bPingPong ) {
                    if ( time<0.5 ) {
                        time*=2;
                    } else {
                        time= 1-(time-0.5)*2;
                    }
                }
                var r= this.bounce(1-time);
                r.y= 1-r.y;
                return r;
            };

            return this;
        },
        createBounceInOutInterpolator : function(bPingPong) {

            this.getPosition= function getPosition(time) {
                if ( bPingPong ) {
                    if ( time<0.5 ) {
                        time*=2;
                    } else {
                        time= 1-(time-0.5)*2;
                    }
                }

                var r;
                if (time < 0.5) {
                    r= this.bounce(1 - time * 2);
                    r.y= (1 - r.y)* 0.5;
                    return r;
                }
                r= this.bounce(time * 2 - 1,bPingPong);
                r.y= r.y* 0.5 + 0.5;
                return r;
            };

            return this;
        },
        /**
         * Paints an interpolator on screen.
         * @param director {CAAT.Director} a CAAT.Director instance.
         * @param time {number} an integer indicating the scene time the Interpolator will be drawn at. This value is useless.
         */
        paint : function(director,time) {

            var canvas= director.crc;
            canvas.save();
            canvas.beginPath();

            canvas.moveTo( 0, this.getPosition(0).y * this.paintScale );

            for( var i=0; i<=this.paintScale; i++ ) {
                canvas.lineTo( i, this.getPosition(i/this.paintScale).y * this.paintScale );
            }

            canvas.strokeStyle='black';
            canvas.stroke();
            canvas.restore();
        },
        /**
         * Gets an array of coordinates which define the polyline of the intepolator's curve contour.
         * Values for both coordinates range from 0 to 1. 
         * @param iSize {number} an integer indicating the number of contour segments.
         * @return array {[CAAT.Point]} of object of the form {x:float, y:float}.
         */
        getContour : function(iSize) {
            var contour=[];
            for( var i=0; i<=iSize; i++ ) {
                contour.push( {x: i/iSize, y: this.getPosition(i/iSize).y} );
            }

            return contour;
        },
        /**
         *
         */
        enumerateInterpolators : function() {
            return [
                new CAAT.Interpolator().createLinearInterpolator(false, false), 'Linear pingpong=false, inverse=false',
                new CAAT.Interpolator().createLinearInterpolator(true,  false), 'Linear pingpong=true, inverse=false',

                new CAAT.Interpolator().createLinearInterpolator(false, true), 'Linear pingpong=false, inverse=true',
                new CAAT.Interpolator().createLinearInterpolator(true,  true), 'Linear pingpong=true, inverse=true',

                new CAAT.Interpolator().createExponentialInInterpolator(    2, false), 'ExponentialIn pingpong=false, exponent=2',
                new CAAT.Interpolator().createExponentialOutInterpolator(   2, false), 'ExponentialOut pingpong=false, exponent=2',
                new CAAT.Interpolator().createExponentialInOutInterpolator( 2, false), 'ExponentialInOut pingpong=false, exponent=2',
                new CAAT.Interpolator().createExponentialInInterpolator(    2, true), 'ExponentialIn pingpong=true, exponent=2',
                new CAAT.Interpolator().createExponentialOutInterpolator(   2, true), 'ExponentialOut pingpong=true, exponent=2',
                new CAAT.Interpolator().createExponentialInOutInterpolator( 2, true), 'ExponentialInOut pingpong=true, exponent=2',

                new CAAT.Interpolator().createExponentialInInterpolator(    4, false), 'ExponentialIn pingpong=false, exponent=4',
                new CAAT.Interpolator().createExponentialOutInterpolator(   4, false), 'ExponentialOut pingpong=false, exponent=4',
                new CAAT.Interpolator().createExponentialInOutInterpolator( 4, false), 'ExponentialInOut pingpong=false, exponent=4',
                new CAAT.Interpolator().createExponentialInInterpolator(    4, true), 'ExponentialIn pingpong=true, exponent=4',
                new CAAT.Interpolator().createExponentialOutInterpolator(   4, true), 'ExponentialOut pingpong=true, exponent=4',
                new CAAT.Interpolator().createExponentialInOutInterpolator( 4, true), 'ExponentialInOut pingpong=true, exponent=4',

                new CAAT.Interpolator().createExponentialInInterpolator(    6, false), 'ExponentialIn pingpong=false, exponent=6',
                new CAAT.Interpolator().createExponentialOutInterpolator(   6, false), 'ExponentialOut pingpong=false, exponent=6',
                new CAAT.Interpolator().createExponentialInOutInterpolator( 6, false), 'ExponentialInOut pingpong=false, exponent=6',
                new CAAT.Interpolator().createExponentialInInterpolator(    6, true), 'ExponentialIn pingpong=true, exponent=6',
                new CAAT.Interpolator().createExponentialOutInterpolator(   6, true), 'ExponentialOut pingpong=true, exponent=6',
                new CAAT.Interpolator().createExponentialInOutInterpolator( 6, true), 'ExponentialInOut pingpong=true, exponent=6',

                new CAAT.Interpolator().createBounceInInterpolator(false), 'BounceIn pingpong=false',
                new CAAT.Interpolator().createBounceOutInterpolator(false), 'BounceOut pingpong=false',
                new CAAT.Interpolator().createBounceInOutInterpolator(false), 'BounceInOut pingpong=false',
                new CAAT.Interpolator().createBounceInInterpolator(true), 'BounceIn pingpong=true',
                new CAAT.Interpolator().createBounceOutInterpolator(true), 'BounceOut pingpong=true',
                new CAAT.Interpolator().createBounceInOutInterpolator(true), 'BounceInOut pingpong=true',

                new CAAT.Interpolator().createElasticInInterpolator(    1.1, 0.4, false), 'ElasticIn pingpong=false, amp=1.1, d=.4',
                new CAAT.Interpolator().createElasticOutInterpolator(   1.1, 0.4, false), 'ElasticOut pingpong=false, amp=1.1, d=.4',
                new CAAT.Interpolator().createElasticInOutInterpolator( 1.1, 0.4, false), 'ElasticInOut pingpong=false, amp=1.1, d=.4',
                new CAAT.Interpolator().createElasticInInterpolator(    1.1, 0.4, true), 'ElasticIn pingpong=true, amp=1.1, d=.4',
                new CAAT.Interpolator().createElasticOutInterpolator(   1.1, 0.4, true), 'ElasticOut pingpong=true, amp=1.1, d=.4',
                new CAAT.Interpolator().createElasticInOutInterpolator( 1.1, 0.4, true), 'ElasticInOut pingpong=true, amp=1.1, d=.4',

                new CAAT.Interpolator().createElasticInInterpolator(    1.0, 0.2, false), 'ElasticIn pingpong=false, amp=1.0, d=.2',
                new CAAT.Interpolator().createElasticOutInterpolator(   1.0, 0.2, false), 'ElasticOut pingpong=false, amp=1.0, d=.2',
                new CAAT.Interpolator().createElasticInOutInterpolator( 1.0, 0.2, false), 'ElasticInOut pingpong=false, amp=1.0, d=.2',
                new CAAT.Interpolator().createElasticInInterpolator(    1.0, 0.2, true), 'ElasticIn pingpong=true, amp=1.0, d=.2',
                new CAAT.Interpolator().createElasticOutInterpolator(   1.0, 0.2, true), 'ElasticOut pingpong=true, amp=1.0, d=.2',
                new CAAT.Interpolator().createElasticInOutInterpolator( 1.0, 0.2, true), 'ElasticInOut pingpong=true, amp=1.0, d=.2'
            ];
        }
    };
})();

/**
 * See LICENSE file.
 *
 * Interpolator actor will draw interpolators on screen.
 *
 **/
(function() {
    /**
     * This actor class draws an interpolator function by caching an interpolator contour as a polyline.
     *
     * @constructor
     * @extends CAAT.ActorContainer
     */
    CAAT.InterpolatorActor = function() {
        CAAT.InterpolatorActor.superclass.constructor.call(this);
        return this;
    };

    CAAT.InterpolatorActor.prototype= {
        interpolator:   null,   // CAAT.Interpolator instance.
        contour:        null,   // interpolator contour cache
        S:              50,     // contour samples.
        gap:            5,      // border size in pixels.

        /**
         * Sets a padding border size. By default is 5 pixels.
         * @param gap {number} border size in pixels.
         * @return this
         */
        setGap : function( gap ) {
            this.gap= gap;
            return this;
        },
        /**
         * Sets the CAAT.Interpolator instance to draw.
         *
         * @param interpolator a CAAT.Interpolator instance.
         * @param size an integer indicating the number of polyline segments so draw to show the CAAT.Interpolator
         * instance.
         *
         * @return this
         */
        setInterpolator : function( interpolator, size ) {
            this.interpolator= interpolator;
            this.contour= interpolator.getContour(size || this.S);

            return this;
        },
        /**
         * Paint this actor.
         * @param director {CAAT.Director}
         * @param time {number} scene time.
         */
        paint : function( director, time ) {

            CAAT.InterpolatorActor.superclass.paint.call(this,director,time);

            if ( this.backgroundImage ) {
                return this;
            }

            if ( this.interpolator ) {

                var canvas= director.crc;

                var xs= (this.width-2*this.gap);
                var ys= (this.height-2*this.gap);

                canvas.beginPath();
                canvas.moveTo(
                        this.gap +  xs*this.contour[0].x,
                        -this.gap + this.height - ys*this.contour[0].y);

                for( var i=1; i<this.contour.length; i++ ) {
                    canvas.lineTo(
                             this.gap + xs*this.contour[i].x,
                            -this.gap + this.height - ys*this.contour[i].y);
                }

                canvas.strokeStyle= this.strokeStyle;
                canvas.stroke();
            }
        },
        /**
         * Return the represented interpolator.
         * @return {CAAT.Interpolator}
         */
        getInterpolator : function() {
            return this.interpolator;
        }
    };

    extend( CAAT.InterpolatorActor, CAAT.ActorContainer, null);
})();/**
 * See LICENSE file.
 *
 * These classes encapsulate different kinds of paths.
 * LinearPath, defines an straight line path, just 2 points.
 * CurvePath, defines a path based on a Curve. Curves can be bezier quadric/cubic and catmull-rom.
 * Path, is a general purpose class, which composes a path of different path segments (Linear or Curve paths).
 *
 * A path, has an interpolator which stablishes the way the path is traversed (accelerating, by
 * easing functions, etc.). Normally, interpolators will be defined by CAAT,Interpolator instances, but
 * general Paths could be used as well.
 *
 **/

(function() {
    /**
     * This is the abstract class that every path segment must conform to.
     * <p>
     * It is implemented by all path segment types, ie:
     * <ul>
     *  <li>LinearPath
     *  <li>CurvePath, base for all curves: quadric and cubic bezier.
     *  <li>Path. A path built of different PathSegment implementations.
     * </ul>
     *
     * @constructor
     */
    CAAT.PathSegment = function() {
        this.bbox= new CAAT.Rectangle();
        return this;
    };

    CAAT.PathSegment.prototype =  {
        color:  'black',
        length: 0,
        bbox:   null,
        parent: null,

        /**
         * Set a PathSegment's parent
         * @param parent
         */
        setParent : function(parent) {
            this.parent= parent;
            return this;
        },
        setColor : function(color) {
            if ( color ) {
                this.color= color;
            }
            return this;
        },
        /**
         * Get path's last coordinate.
         * @return {CAAT.Point}
         */
		endCurvePosition : function() { },

        /**
         * Get path's starting coordinate.
         * @return {CAAT.Point}
         */
		startCurvePosition : function() { },

        /**
         * Set this path segment's points information.
         * @param points {Array<CAAT.Point>}
         */
        setPoints : function( points ) { },

        /**
         * Set a point from this path segment.
         * @param point {CAAT.Point}
         * @param index {integer} a point index.
         */
        setPoint : function( point, index ) { },

        /**
         * Get a coordinate on path.
         * The parameter time is normalized, that is, its values range from zero to one.
         * zero will mean <code>startCurvePosition</code> and one will be <code>endCurvePosition</code>. Other values
         * will be a position on the path relative to the path length. if the value is greater that 1, if will be set
         * to modulus 1.
         * @param time a float with a value between zero and 1 inclusive both.
         *
         * @return {CAAT.Point}
         */
        getPosition : function(time) { },

        /**
         * Gets Path length.
         * @return {number}
         */
        getLength : function() {
            return this.length;
        },

        /**
         * Gets the path bounding box (or the rectangle that contains the whole path).
         * @param rectangle a CAAT.Rectangle instance with the bounding box.
         * @return {CAAT.Rectangle}
         */
		getBoundingBox : function() {
            return this.bbox;
        },

        /**
         * Gets the number of control points needed to create the path.
         * Each PathSegment type can have different control points.
         * @return {number} an integer with the number of control points.
         */
		numControlPoints : function() { },

        /**
         * Gets CAAT.Point instance with the 2d position of a control point.
         * @param index an integer indicating the desired control point coordinate.
         * @return {CAAT.Point}
         */
		getControlPoint: function(index) { },

        /**
         * Instruments the path has finished building, and that no more segments will be added to it.
         * You could later add more PathSegments and <code>endPath</code> must be called again.
         */
        endPath : function() {},

        /**
         * Gets a polyline describing the path contour. The contour will be defined by as mush as iSize segments.
         * @param iSize an integer indicating the number of segments of the contour polyline.
         *
         * @return {[CAAT.Point]}
         */
        getContour : function(iSize) {},

        /**
         * Recalculate internal path structures.
         */
        updatePath : function(point) {},

        /**
         * Draw this path using RenderingContext2D drawing primitives.
         * The intention is to set a path or pathsegment as a clipping region.
         *
         * @param ctx {RenderingContext2D}
         */
        applyAsPath : function(ctx) {},

        /**
         * Transform this path with the given affinetransform matrix.
         * @param matrix
         */
        transform : function(matrix) {}
    };

})();

(function() {

    /**
     * Straight line segment path between two given points.
     *
     * @constructor
     * @extends CAAT.PathSegment
     */
	CAAT.LinearPath = function() {
        CAAT.LinearPath.superclass.constructor.call(this);

        this.points= [];
        this.points.push( new CAAT.Point() );
        this.points.push( new CAAT.Point() );

		this.newPosition=       new CAAT.Point(0,0,0);
		return this;
	};
	
	CAAT.LinearPath.prototype= {
        points:             null,
		newPosition:		null,   // spare holder for getPosition coordinate return.

        applyAsPath : function(ctx) {
            ctx.lineTo( this.points[0].x, this.points[1].y );
        },
        setPoint : function( point, index ) {
            if ( index===0 ) {
                this.points[0]= point;
            } else if ( index===1 ) {
                this.points[1]= point;
            }
        },
        /**
         * Update this segments length and bounding box info.
         */
        updatePath : function(point) {
            var x= this.points[1].x - this.points[0].x;
			var y= this.points[1].y - this.points[0].y;
			this.length= Math.sqrt( x*x+y*y );

            this.bbox.setEmpty();
			this.bbox.union( this.points[0].x, this.points[0].y );
			this.bbox.union( this.points[1].x, this.points[1].y );

            return this;
        },
        setPoints : function( points ) {
            this.points[0]= points[0];
            this.points[1]= points[1];
            this.updatePath();
            return this;
        },
        /**
         * Set this path segment's starting position.
         * @param x {number}
         * @param y {number}
         */
		setInitialPosition : function( x, y )	{
			this.points[0].x= x;
			this.points[0].y= y;
			this.newPosition.set(x,y);
            return this;
		},
        /**
         * Set this path segment's ending position.
         * @param finalX {number}
         * @param finalY {number}
         */
		setFinalPosition : function( finalX, finalY )	{
			this.points[1].x= finalX;
			this.points[1].y= finalY;
            return this;
		},
        /**
         * @inheritDoc
         */
        endCurvePosition : function() {
			return this.points[1];
		},
        /**
         * @inheritsDoc
         */
		startCurvePosition : function() {
			return this.points[0];
		},
        /**
         * @inheritsDoc
         */
		getPosition : function(time) {

            if ( time>1 || time<0 ) {
                time%=1;
            }
            if ( time<0 ) {
                time= 1+time;
            }

            this.newPosition.set(
						(this.points[0].x+(this.points[1].x-this.points[0].x)*time),
						(this.points[0].y+(this.points[1].y-this.points[0].y)*time) );

			return this.newPosition;
		},
        /**
         * Returns initial path segment point's x coordinate.
         * @return {number}
         */
		initialPositionX : function() {
			return this.points[0].x;
		},
        /**
         * Returns final path segment point's x coordinate.
         * @return {number}
         */
		finalPositionX : function() {
			return this.points[1].x;
		},
        /**
         * Draws this path segment on screen. Optionally it can draw handles for every control point, in
         * this case, start and ending path segment points.
         * @param director {CAAT.Director}
         * @param bDrawHandles {boolean}
         */
		paint : function(director, bDrawHandles) {
			
			var canvas= director.crc;

            canvas.save();

            canvas.strokeStyle= this.color;
			canvas.beginPath();
			canvas.moveTo( this.points[0].x, this.points[0].y );
			canvas.lineTo( this.points[1].x, this.points[1].y );
			canvas.stroke();

            if ( bDrawHandles ) {
                canvas.globalAlpha=0.5;
                canvas.fillStyle='#7f7f00';
                canvas.beginPath();
                canvas.arc(
                        this.points[0].x,
                        this.points[0].y,
                        CAAT.Curve.prototype.HANDLE_SIZE/2,
                        0,
                        2*Math.PI,
                        false) ;
                canvas.arc(
                        this.points[1].x,
                        this.points[1].y,
                        CAAT.Curve.prototype.HANDLE_SIZE/2,
                        0,
                        2*Math.PI,
                        false) ;
                canvas.fill();
            }

            canvas.restore();
		},
        /**
         * Get the number of control points. For this type of path segment, start and
         * ending path segment points. Defaults to 2.
         * @return {number}
         */
		numControlPoints : function() {
			return 2;
		},
        /**
         * @inheritsDoc
         */
		getControlPoint: function(index) {
			if ( 0===index ) {
				return this.points[0];
			} else if (1===index) {
				return this.points[1];
			}
		},
        /**
         * @inheritsDoc
         */
        getContour : function(iSize) {
            var contour= [];

            contour.push( this.getPosition(0).clone() );
            contour.push( this.getPosition(1).clone() );

            return contour;
        }
	};

    extend( CAAT.LinearPath, CAAT.PathSegment );
})();

(function() {
    /**
     * This class defines a Bezier cubic or quadric path segment.
     *
     * @constructor
     * @extends CAAT.PathSegment
     */
	CAAT.CurvePath = function() {
        CAAT.CurvePath.superclass.constructor.call(this);
		this.newPosition= new CAAT.Point(0,0,0);
		return this;
	};
	
	CAAT.CurvePath.prototype= {
		curve:	            null,   // a CAAT.Bezier instance.
		newPosition:		null,   // spare holder for getPosition coordinate return.

        applyAsPath : function(ctx) {
            this.curve.applyAsPath(ctx);
            return this;
        },
        setPoint : function( point, index ) {
            if ( this.curve ) {
                this.curve.setPoint(point,index);
            }
        },
        /**
         * Set this curve segment's points.
         * @param points {Array<CAAT.Point>}
         */
        setPoints : function( points ) {
            var curve = new CAAT.Bezier();
            curve.setPoints(points);
            this.curve = curve;
            return this;
        },
        /**
         * Set the pathSegment as a CAAT.Bezier quadric instance.
         * Parameters are quadric coordinates control points.
         *
         * @param p0x {number}
         * @param p0y {number}
         * @param p1x {number}
         * @param p1y {number}
         * @param p2x {number}
         * @param p2y {number}
         * @return this
         */
        setQuadric : function(p0x,p0y, p1x,p1y, p2x,p2y) {
	        var curve = new CAAT.Bezier();
	        curve.setQuadric(p0x,p0y, p1x,p1y, p2x,p2y);
	        this.curve = curve;
            this.updatePath();

            return this;
        },
        /**
         * Set the pathSegment as a CAAT.Bezier cubic instance.
         * Parameters are cubic coordinates control points.
         * @param p0x {number}
         * @param p0y {number}
         * @param p1x {number}
         * @param p1y {number}
         * @param p2x {number}
         * @param p2y {number}
         * @param p3x {number}
         * @param p3y {number}
         * @return this
         */
        setCubic : function(p0x,p0y, p1x,p1y, p2x,p2y, p3x,p3y) {
	        var curve = new CAAT.Bezier();
	        curve.setCubic(p0x,p0y, p1x,p1y, p2x,p2y, p3x,p3y);
	        this.curve = curve;
            this.updatePath();

            return this;
        },
        /**
         * @inheritDoc
         */
		updatePath : function(point) {
			this.curve.update();
            this.length= this.curve.getLength();
            this.curve.getBoundingBox(this.bbox);
            return this;
		},
        /**
         * @inheritDoc
         */
		getPosition : function(time) {

            if ( time>1 || time<0 ) {
                time%=1;
            }
            if ( time<0 ) {
                time= 1+time;
            }

            this.curve.solve(this.newPosition, time);

			return this.newPosition;
		},
        /**
         * Gets the coordinate on the path relative to the path length.
         * @param iLength {number} the length at which the coordinate will be taken from.
         * @return {CAAT.Point} a CAAT.Point instance with the coordinate on the path corresponding to the
         * iLenght parameter relative to segment's length.
         */
		getPositionFromLength : function(iLength) {
			this.curve.solve( this.newPosition, iLength/this.length );
			return this.newPosition;
		},
        /**
         * Get path segment's first point's x coordinate.
         * @return {number}
         */
		initialPositionX : function() {
			return this.curve.coordlist[0].x;
		},
        /**
         * Get path segment's last point's y coordinate.
         * @return {number}
         */
		finalPositionX : function() {
			return this.curve.coordlist[this.curve.coordlist.length-1].x;
		},
        /**
         * @inheritDoc
         * @param director {CAAT.Director}
         * @param bDrawHandles {boolean}
         */
		paint : function( director,bDrawHandles ) {
            this.curve.drawHandles= bDrawHandles;
            director.ctx.strokeStyle= this.color;
			this.curve.paint(director);
		},
        /**
         * @inheritDoc
         */
		numControlPoints : function() {
			return this.curve.coordlist.length;
		},
        /**
         * @inheritDoc
         * @param index
         */
		getControlPoint : function(index) {
			return this.curve.coordlist[index];
		},
        /**
         * @inheritDoc
         */
		endCurvePosition : function() {
			return this.curve.endCurvePosition();
		},
        /**
         * @inheritDoc
         */
		startCurvePosition : function() {
			return this.curve.startCurvePosition();
		},
        /**
         * @inheritDoc
         * @param iSize
         */
        getContour : function(iSize) {
            var contour=[];
            for( var i=0; i<=iSize; i++ ) {
                contour.push( {x: i/iSize, y: this.getPosition(i/iSize).y} );
            }

            return contour;
        }
	};

    extend( CAAT.CurvePath, CAAT.PathSegment, null);
	
})();

(function() {

    CAAT.ShapePath= function() {
        CAAT.ShapePath.superclass.constructor.call(this);

        this.points= [];
        this.points.push( new CAAT.Point() );
        this.points.push( new CAAT.Point() );
        this.points.push( new CAAT.Point() );
        this.points.push( new CAAT.Point() );
        this.points.push( new CAAT.Point() );

        this.newPosition= new CAAT.Point();

		return this;
    };

    CAAT.ShapePath.prototype= {
        points:             null,
        length:             -1,
        cw:                 true,   // should be clock wise traversed ?
        bbox:               null,
        newPosition:        null,   // spare point for calculations

        applyAsPath : function(ctx) {
            //ctx.rect( this.bbox.x, this.bbox.y, this.bbox.width, this.bbox.height );
            if ( this.cw ) {
                ctx.lineTo( this.points[0].x, this.points[0].y );
                ctx.lineTo( this.points[1].x, this.points[1].y );
                ctx.lineTo( this.points[2].x, this.points[2].y );
                ctx.lineTo( this.points[3].x, this.points[3].y );
                ctx.lineTo( this.points[4].x, this.points[4].y );
            } else {
                ctx.lineTo( this.points[4].x, this.points[4].y );
                ctx.lineTo( this.points[3].x, this.points[3].y );
                ctx.lineTo( this.points[2].x, this.points[2].y );
                ctx.lineTo( this.points[1].x, this.points[1].y );
                ctx.lineTo( this.points[0].x, this.points[0].y );
            }
            return this;
        },
        setPoint : function( point, index ) {
            if ( index>=0 && index<this.points.length ) {
                this.points[index]= point;
            }
        },
        /**
         * An array of {CAAT.Point} composed of two points.
         * @param points {Array<CAAT.Point>}
         */
        setPoints : function( points ) {
            this.points= [];
            this.points.push( points[0] );
            this.points.push( new CAAT.Point().set(points[1].x, points[0].y) );
            this.points.push( points[1] );
            this.points.push( new CAAT.Point().set(points[0].x, points[1].y) );
            this.points.push( points[0].clone() );
            this.updatePath();

            return this;
        },
        setClockWise : function(cw) {
            this.cw= cw!==undefined ? cw : true;
            return this;
        },
        isClockWise : function() {
            return this.cw;
        },
        /**
         * Set this path segment's starting position.
         * This method should not be called again after setFinalPosition has been called.
         * @param x {number}
         * @param y {number}
         */
		setInitialPosition : function( x, y )	{
            for( var i=0, l= this.points.length; i<l; i++ ) {
			    this.points[i].x= x;
			    this.points[i].y= y;
            }
            return this;
		},
        /**
         * Set a rectangle from points[0] to (finalX, finalY)
         * @param finalX {number}
         * @param finalY {number}
         */
		setFinalPosition : function( finalX, finalY )	{
			this.points[2].x= finalX;
            this.points[2].y= finalY;

            this.points[1].x= finalX;
            this.points[1].y= this.points[0].y;

            this.points[3].x= this.points[0].x;
            this.points[3].y= finalY;

            this.points[4].x= this.points[0].x;
            this.points[4].y= this.points[0].y;

            this.updatePath();
            return this;
		},
        /**
         * @inheritDoc
         */
        endCurvePosition : function() {
			return this.points[4];
		},
        /**
         * @inheritsDoc
         */
		startCurvePosition : function() {
			return this.points[0];
		},
        /**
         * @inheritsDoc
         */
		getPosition : function(time) {

            if ( time>1 || time<0 ) {
                time%=1;
            }
            if ( time<0 ) {
                time= 1+time;
            }

            if ( -1===this.length ) {
                this.newPosition.set(0,0);
            } else {
                var w= this.bbox.width / this.length;
                var h= this.bbox.height / this.length;
                var accTime= 0;
                var times;
                var segments;
                var index= 0;

                if ( this.cw ) {
                    segments= [0,1,2,3,4];
                    times= [w,h,w,h];
                } else {
                    segments= [4,3,2,1,0];
                    times= [h,w,h,w];
                }

                while( index<times.length ) {
                    if ( accTime+times[index]<time ) {
                        accTime+= times[index];
                        index++;
                    } else {
                        break;
                    }
                }
                time-=accTime;

                var p0= segments[index];
                var p1= segments[index+1];

                // index tiene el indice del segmento en tiempo.
                this.newPosition.set(
                        (this.points[p0].x + (this.points[p1].x - this.points[p0].x)*time/times[index]),
                        (this.points[p0].y + (this.points[p1].y - this.points[p0].y)*time/times[index]) );
            }

			return this.newPosition;
		},
        /**
         * Returns initial path segment point's x coordinate.
         * @return {number}
         */
		initialPositionX : function() {
			return this.points[0].x;
		},
        /**
         * Returns final path segment point's x coordinate.
         * @return {number}
         */
		finalPositionX : function() {
			return this.points[2].x;
		},
        /**
         * Draws this path segment on screen. Optionally it can draw handles for every control point, in
         * this case, start and ending path segment points.
         * @param director {CAAT.Director}
         * @param bDrawHandles {boolean}
         */
		paint : function(director, bDrawHandles) {

			var canvas= director.crc;

            canvas.save();

            canvas.strokeStyle= this.color;
			canvas.beginPath();
			canvas.strokeRect(
                this.bbox.x, this.bbox.y,
                this.bbox.width, this.bbox.height );

            if ( bDrawHandles ) {
                canvas.globalAlpha=0.5;
                canvas.fillStyle='#7f7f00';

                for( var i=0; i<this.points.length; i++ ) {
                    canvas.beginPath();
                    canvas.arc(
                            this.points[i].x,
                            this.points[i].y,
                            CAAT.Curve.prototype.HANDLE_SIZE/2,
                            0,
                            2*Math.PI,
                            false) ;
                    canvas.fill();
                }

            }

            canvas.restore();
		},
        /**
         * Get the number of control points. For this type of path segment, start and
         * ending path segment points. Defaults to 2.
         * @return {number}
         */
		numControlPoints : function() {
			return this.points.length;
		},
        /**
         * @inheritsDoc
         */
		getControlPoint: function(index) {
            return this.points[index];
		},
        /**
         * @inheritsDoc
         */
        getContour : function(iSize) {
            var contour= [];

            for( var i=0; i<this.points.length; i++ ) {
                contour.push( this.points[i] );
            }

            return contour;
        },
        updatePath : function(point) {

            if ( point ) {
                if ( point===this.points[0] ) {
                    this.points[1].y= point.y;
                    this.points[3].x= point.x;
                } else if ( point===this.points[1] ) {
                    this.points[0].y= point.y;
                    this.points[2].x= point.x;
                } else if ( point===this.points[2] ) {
                    this.points[3].y= point.y;
                    this.points[1].x= point.x;
                } else if ( point===this.points[3] ) {
                    this.points[0].x= point.x;
                    this.points[2].y= point.y;
                }
                this.points[4].x= this.points[0].x;
                this.points[4].y= this.points[0].y;
            }

            this.bbox.setEmpty();
            for( var i=0; i<4; i++ ) {
			    this.bbox.union( this.points[i].x, this.points[i].y );
            }

            this.length= 2*this.bbox.width + 2*this.bbox.height;

            this.points[0].x= this.bbox.x;
            this.points[0].y= this.bbox.y;

            this.points[1].x= this.bbox.x+this.bbox.width;
            this.points[1].y= this.bbox.y;

            this.points[2].x= this.bbox.x + this.bbox.width;
            this.points[2].y= this.bbox.y + this.bbox.height;

            this.points[3].x= this.bbox.x;
            this.points[3].y= this.bbox.y + this.bbox.height;

            this.points[4].x= this.bbox.x;
            this.points[4].y= this.bbox.y;

            return this;
        }
    }

    extend( CAAT.ShapePath, CAAT.PathSegment );

})();

(function() {

    /**
     * This class the top most abstraction of path related classes in CAAT. It defines a path composes un
     * an unlimited number of path segments including CAAT.Path instances.
     * <p>
     * Every operation of the CAAT.PathSegment interface is performed for every path segment. In example,
     * the method <code>getLength</code> will contain the sum of every path segment's length.
     * <p>
     * An example of CAAT.Path will be as follows:

     * <code>
     * path.beginPath(x,y).<br>
     * &nbsp;&nbsp;addLineTo(x1,y1).<br>
     * &nbsp;&nbsp;addLineTo(x2,y2).<br>
     * &nbsp;&nbsp;addQuadricTo(...).<br>
     * &nbsp;&nbsp;addCubicTo(...).<br>
     * &nbsp;&nbsp;endPath();<br>
     * </code>
     * <p>
     * This code creates a path composed of four chained segments, starting at (x,y) and having each
     * segment starting where the previous one ended.
     * <p>
     * This class is intended to wrap the other kind of path segment classes when just a one segmented
     * path is to be defined. The methods <code>setLinear, setCubic and setQuadrid</code> will make
     * a CAAT.Path instance to be defined by just one segment.
     *
     * @constructor
     * @extends CAAT.PathSegment
     */
	CAAT.Path= function()	{
        CAAT.Path.superclass.constructor.call(this);

		this.newPosition=   new CAAT.Point(0,0,0);
		this.pathSegments=  [];

        this.behaviorList=  [];
        this.matrix=        new CAAT.Matrix();
        this.tmpMatrix=     new CAAT.Matrix();
        
		return this;
	};
	
	CAAT.Path.prototype= {
			
		pathSegments:	            null,   // a collection of CAAT.PathSegment instances.
		pathSegmentDurationTime:	null,   // precomputed segment duration relative to segment legnth/path length
		pathSegmentStartTime:		null,   // precomputed segment start time relative to segment legnth/path length and duration.

		newPosition:	            null,   // spare CAAT.Point.
		
		pathLength:		            -1,     // path length (sum of every segment length)

        /*
            starting path position
         */
		beginPathX:		            -1,
		beginPathY:                 -1,

        /*
            last path coordinates position (using when building the path).
         */
		trackPathX:		            -1,
		trackPathY:		            -1,

        /*
            needed to drag control points.
          */
		ax:                         -1,
		ay:                         -1,
		point:                      [],

        interactive:                true,

        behaviorList:               null,

        /** rotation behavior info **/
        rb_angle:                   0,
        rb_rotateAnchorX:           .5,
        rb_rotateAnchorY:           .5,

        /** scale behavior info **/
        sb_scaleX:                  1,
        sb_scaleY:                  1,
        sb_scaleAnchorX:            .5,
        sb_scaleAnchorY:            .5,

        /** translate behavior info **/
        tb_x:                       0,
        tb_y:                       0,

        /** behavior affine transformation matrix **/
        matrix:                     null,
        tmpMatrix:                  null,

        /** if behaviors are to be applied, save original path points **/
        pathPoints:                 null,

        /** path width and height **/
        width:                      0,
        height:                     0,

        applyAsPath : function(ctx) {
            ctx.beginPath();
            ctx.globalCompositeOperation= 'source-out';
            ctx.moveTo(
                this.getFirstPathSegment().startCurvePosition().x,
                this.getFirstPathSegment().startCurvePosition().y
            );
            for( var i=0; i<this.pathSegments.length; i++ ) {
                this.pathSegments[i].applyAsPath(ctx);
            }
            ctx.globalCompositeOperation= 'source-over';
            return this;
        },
        /**
         * Set whether this path should paint handles for every control point.
         * @param interactive {boolean}.
         */
        setInteractive : function(interactive) {
            this.interactive= interactive;
            return this;
        },
        getFirstPathSegment : function() {
            return this.pathSegments.length ?
                this.pathSegments[0] :
                null;
        },
        getLastPathSegment : function() {
            return this.pathSegments.length ?
                this.pathSegments[ this.pathSegments.length-1 ] :
                null;
        },
        /**
         * Return the last point of the last path segment of this compound path.
         * @return {CAAT.Point}
         */
        endCurvePosition : function() {
            if ( this.pathSegments.length ) {
                return this.pathSegments[ this.pathSegments.length-1 ].endCurvePosition();
            } else {
                return new CAAT.Point().set( this.beginPathX, this.beginPathY );
            }
        },
        /**
         * Return the first point of the first path segment of this compound path.
         * @return {CAAT.Point}
         */
        startCurvePosition : function() {
            return this.pathSegments[ 0 ].startCurvePosition();
        },
        /**
         * Return the last path segment added to this path.
         * @return {CAAT.PathSegment}
         */
        getCurrentPathSegment : function() {
            return this.pathSegments[ this.pathSegments.length-1 ];
        },
        /**
         * Set the path to be composed by a single LinearPath segment.
         * @param x0 {number}
         * @param y0 {number}
         * @param x1 {number}
         * @param y1 {number}
         * @return this
         */
        setLinear : function(x0,y0,x1,y1) {
            this.beginPath(x0,y0);
            this.addLineTo(x1,y1);
            this.endPath();

            return this;
        },
        /**
         * Set this path to be composed by a single Quadric Bezier path segment.
         * @param x0 {number}
         * @param y0 {number}
         * @param x1 {number}
         * @param y1 {number}
         * @param x2 {number}
         * @param y2 {number}
         * @return this
         */
        setQuadric : function(x0,y0,x1,y1,x2,y2) {
            this.beginPath(x0,y0);
            this.addQuadricTo(x1,y1,x2,y2);
            this.endPath();

            return this;
        },
        /**
         * Sets this path to be composed by a single Cubic Bezier path segment.
         * @param x0 {number}
         * @param y0 {number}
         * @param x1 {number}
         * @param y1 {number}
         * @param x2 {number}
         * @param y2 {number}
         * @param x3 {number}
         * @param y3 {number}
         *
         * @return this
         */
        setCubic : function(x0,y0,x1,y1,x2,y2,x3,y3) {
            this.beginPath(x0,y0);
            this.addCubicTo(x1,y1,x2,y2,x3,y3);
            this.endPath();

            return this;
        },
        setRectangle : function(x0,y0, x1,y1) {
            this.beginPath(x0,y0);
            this.addRectangleTo(x1,y1);
            this.endPath();

            return this;
        },
        /**
         * Add a CAAT.PathSegment instance to this path.
         * @param pathSegment {CAAT.PathSegment}
         * @return this
         *
         * @deprecated
         */
		addSegment : function(pathSegment) {
            pathSegment.setParent(this);
			this.pathSegments.push(pathSegment);
            return this;
		},
        addRectangleTo : function( x1,y1, cw, color ) {
            var r= new CAAT.ShapePath();
            r.setPoints([
                    this.endCurvePosition(),
                    new CAAT.Point().set(x1,y1)
                ]);

            r.setClockWise(cw);
            r.setColor(color);
            r.setParent(this);

            this.pathSegments.push(r);

            return this;
        },
        /**
         * Add a Quadric Bezier path segment to this path.
         * The segment starts in the current last path coordinate.
         * @param px1 {number}
         * @param py1 {number}
         * @param px2 {number}
         * @param py2 {number}
         * @param color {color=}. optional parameter. determines the color to draw the segment with (if
         *         being drawn by a CAAT.PathActor).
         *
         * @return this
         */
		addQuadricTo : function( px1,py1, px2,py2, color ) {
			var bezier= new CAAT.Bezier();

            bezier.setPoints(
                [
                    this.endCurvePosition(),
                    new CAAT.Point().set(px1,py1),
                    new CAAT.Point().set(px2,py2)
                ]);

			this.trackPathX= px2;
			this.trackPathY= py2;
			
			var segment= new CAAT.CurvePath().setColor(color).setParent(this);
			segment.curve= bezier;

			this.pathSegments.push(segment);

            return this;
		},
        /**
         * Add a Cubic Bezier segment to this path.
         * The segment starts in the current last path coordinate.
         * @param px1 {number}
         * @param py1 {number}
         * @param px2 {number}
         * @param py2 {number}
         * @param px3 {number}
         * @param py3 {number}
         * @param color {color=}. optional parameter. determines the color to draw the segment with (if
         *         being drawn by a CAAT.PathActor).
         *
         * @return this
         */
		addCubicTo : function( px1,py1, px2,py2, px3,py3, color ) {
			var bezier= new CAAT.Bezier();

            bezier.setPoints(
                [
                    this.endCurvePosition(),
                    new CAAT.Point().set(px1,py1),
                    new CAAT.Point().set(px2,py2),
                    new CAAT.Point().set(px3,py3)
                ]);

			this.trackPathX= px3;
			this.trackPathY= py3;
			
			var segment= new CAAT.CurvePath().setColor(color).setParent(this);
			segment.curve= bezier;

			this.pathSegments.push(segment);
            return this;
		},
        /**
         * Add a Catmull-Rom segment to this path.
         * The segment starts in the current last path coordinate.
         * @param px1 {number}
         * @param py1 {number}
         * @param px2 {number}
         * @param py2 {number}
         * @param px3 {number}
         * @param py3 {number}
         * @param color {color=}. optional parameter. determines the color to draw the segment with (if
         *         being drawn by a CAAT.PathActor).
         *
         * @return this
         */
		addCatmullTo : function( px1,py1, px2,py2, px3,py3, color ) {
			var curve= new CAAT.CatmullRom().setColor(color);
			curve.setCurve(this.trackPathX,this.trackPathY, px1,py1, px2,py2, px3,py3);
			this.trackPathX= px3;
			this.trackPathY= py3;
			
			var segment= new CAAT.CurvePath().setParent(this);
			segment.curve= curve;

			this.pathSegments.push(segment);
            return this;
		},
        /**
         * Adds a line segment to this path.
         * The segment starts in the current last path coordinate.
         * @param px1 {number}
         * @param py1 {number}
         * @param color {color=}. optional parameter. determines the color to draw the segment with (if
         *         being drawn by a CAAT.PathActor).
         *
         * @return this
         */
		addLineTo : function( px1,py1, color ) {
			var segment= new CAAT.LinearPath().setColor(color);
            segment.setPoints( [
                    this.endCurvePosition(),
                    new CAAT.Point().set(px1,py1)
                ]);

            segment.setParent(this);

			this.trackPathX= px1;
			this.trackPathY= py1;
			
			this.pathSegments.push(segment);
            return this;
		},
        /**
         * Set the path's starting point. The method startCurvePosition will return this coordinate.
         * <p>
         * If a call to any method of the form <code>add<Segment>To</code> is called before this calling
         * this method, they will assume to start at -1,-1 and probably you'll get the wrong path.
         * @param px0 {number}
         * @param py0 {number}
         *
         * @return this
         */
		beginPath : function( px0, py0 ) {
			this.trackPathX= px0;
			this.trackPathY= py0;
			this.beginPathX= px0;
			this.beginPathY= py0;
            return this;
		},
        /**
         * <del>Close the path by adding a line path segment from the current last path
         * coordinate to startCurvePosition coordinate</del>.
         * <p>
         * This method closes a path by setting its last path segment's last control point
         * to be the first path segment's first control point.
         * <p>
         *     This method also sets the path as finished, and calculates all path's information
         *     such as length and bounding box.
         *
         * @return this
         */
		closePath : function()	{

            this.getLastPathSegment().setPoint(
                this.getFirstPathSegment().startCurvePosition(),
                this.getLastPathSegment().numControlPoints()-1 );


			this.trackPathX= this.beginPathX;
			this.trackPathY= this.beginPathY;
			
			this.endPath();
            return this;
		},
        /**
         * Finishes the process of building the path. It involves calculating each path segments length
         * and proportional length related to a normalized path length of 1.
         * It also sets current paths length.
         * These calculi are needed to traverse the path appropriately.
         * <p>
         * This method must be called explicitly, except when closing a path (that is, calling the
         * method closePath) which calls this method as well.
         *
         * @return this
         */
		endPath : function() {

			this.pathSegmentStartTime=[];
			this.pathSegmentDurationTime= [];

            this.updatePath();

            return this;
		},
        /**
         * This method, returns a CAAT.Point instance indicating a coordinate in the path.
         * The returned coordinate is the corresponding to normalizing the path's length to 1,
         * and then finding what path segment and what coordinate in that path segment corresponds
         * for the input time parameter.
         * <p>
         * The parameter time must be a value ranging 0..1.
         * If not constrained to these values, the parameter will be modulus 1, and then, if less
         * than 0, be normalized to 1+time, so that the value always ranges from 0 to 1.
         * <p>
         * This method is needed when traversing the path throughout a CAAT.Interpolator instance.
         *
         * @param time a value between 0 and 1 both inclusive. 0 will return path's starting coordinate.
         * 1 will return path's end coordinate.
         *
         * @return {CAAT.Point}
         */
		getPosition : function(time) {

            if ( time>1 || time<0 ) {
                time%=1;
            }
            if ( time<0 ) {
                time= 1+time;
            }

            for( var i=0; i<this.pathSegments.length; i++ ) {
                if (this.pathSegmentStartTime[i]<=time && time<=this.pathSegmentStartTime[i]+this.pathSegmentDurationTime[i]) {
                    time= this.pathSegmentDurationTime[i] ?
                            (time-this.pathSegmentStartTime[i])/this.pathSegmentDurationTime[i] :
                            0;
                    var pointInPath= this.pathSegments[i].getPosition(time);
                    this.newPosition.x= pointInPath.x;
                    this.newPosition.y= pointInPath.y;
                    break;
                }
            }

			return this.newPosition;
		},
        /**
         * Analogously to the method getPosition, this method returns a CAAT.Point instance with
         * the coordinate on the path that corresponds to the given length. The input length is
         * related to path's length.
         *
         * @param iLength {number} a float with the target length.
         * @return {CAAT.Point}
         */
		getPositionFromLength : function(iLength) {
			
			iLength%=this.getLength();
			if (iLength<0 ) {
				iLength+= this.getLength();
			}
			
			var accLength=0;
			
			for( var i=0; i<this.pathSegments.length; i++ ) {
				if (accLength<=iLength && iLength<=this.pathSegments[i].getLength()+accLength) {
					iLength-= accLength;
					var pointInPath= this.pathSegments[i].getPositionFromLength(iLength);
					this.newPosition.x= pointInPath.x;
					this.newPosition.y= pointInPath.y;
					break;
				}
				accLength+= this.pathSegments[i].getLength();
			}
			
			return this.newPosition;
		},
        /**
         * Paints the path.
         * This method is called by CAAT.PathActor instances.
         * If the path is set as interactive (by default) path segment will draw curve modification
         * handles as well.
         *
         * @param director {CAAT.Director} a CAAT.Director instance.
         */
		paint : function( director ) {
			for( var i=0; i<this.pathSegments.length; i++ ) {
				this.pathSegments[i].paint(director,this.interactive);
			}
		},
        /**
         * Method invoked when a CAAT.PathActor stops dragging a control point.
         */
		release : function() {
			this.ax= -1;
			this.ay= -1;
		},
        /**
         * Returns an integer with the number of path segments that conform this path.
         * @return {number}
         */
        getNumSegments : function() {
            return this.pathSegments.length;
        },
        /**
         * Gets a CAAT.PathSegment instance.
         * @param index {number} the index of the desired CAAT.PathSegment.
         * @return CAAT.PathSegment
         */
		getSegment : function(index) {
			return this.pathSegments[index];
		},

        numControlPoints : function() {
            return this.points.length;
        },

        getControlPoint : function(index) {
            return this.points[index];
        },

        /**
         * Indicates that some path control point has changed, and that the path must recalculate
         * its internal data, ie: length and bbox.
         */
		updatePath : function(point) {
            var i,j;

            this.length=0;
            this.bbox.setEmpty();
            this.points= [];

			for( i=0; i<this.pathSegments.length; i++ ) {
				this.pathSegments[i].updatePath(point);
                this.length+= this.pathSegments[i].getLength();
                this.bbox.unionRectangle( this.pathSegments[i].bbox );

                for( j=0; j<this.pathSegments[i].numControlPoints(); j++ ) {
                    this.points.push( this.pathSegments[i].getControlPoint( j ) );
                }
			}

            this.width= this.bbox.width;
            this.height= this.bbox.height;

            this.pathSegmentStartTime=      [];
            this.pathSegmentDurationTime=   [];
            
            var i;
            for( i=0; i<this.pathSegments.length; i++) {
                this.pathSegmentStartTime.push(0);
                this.pathSegmentDurationTime.push(0);
            }

            for( i=0; i<this.pathSegments.length; i++) {
                this.pathSegmentDurationTime[i]= this.getLength() ? this.pathSegments[i].getLength()/this.getLength() : 0;
                if ( i>0 ) {
                    this.pathSegmentStartTime[i]= this.pathSegmentStartTime[i-1]+this.pathSegmentDurationTime[i-1];
                } else {
                    this.pathSegmentStartTime[0]= 0;
                }

                this.pathSegments[i].endPath();
            }


            return this;

		},
        /**
         * Sent by a CAAT.PathActor instance object to try to drag a path's control point.
         * @param x {number}
         * @param y {number}
         */
		press: function(x,y) {
            if (!this.interactive) {
                return;
            }

            var HS= CAAT.Curve.prototype.HANDLE_SIZE/2;
			for( var i=0; i<this.pathSegments.length; i++ ) {
				for( var j=0; j<this.pathSegments[i].numControlPoints(); j++ ) {
					var point= this.pathSegments[i].getControlPoint(j);
					if ( x>=point.x-HS &&
						 y>=point.y-HS &&
						 x<point.x+HS &&
						 y<point.y+HS ) {
						
						this.point= point;
						return;
					}
				}
			}
			this.point= null;
		},
        /**
         * Drags a path's control point.
         * If the method press has not set needed internal data to drag a control point, this
         * method will do nothing, regardless the user is dragging on the CAAT.PathActor delegate.
         * @param x {number}
         * @param y {number}
         */
		drag : function(x,y) {
            if (!this.interactive) {
                return;
            }

			if ( null===this.point ) {
				return;
			}
			
			if ( -1===this.ax || -1===this.ay ) {
				this.ax= x;
				this.ay= y;
			}
			
            this.point.x+= x-this.ax;
            this.point.y+= y-this.ay;

			this.ax= x;
			this.ay= y;

			this.updatePath(this.point);
		},
        /**
         * Returns a collection of CAAT.Point objects which conform a path's contour.
         * @param iSize {number}. Number of samples for each path segment.
         * @return {[CAAT.Point]}
         */
        getContour : function(iSize) {
            var contour=[];
            for( var i=0; i<=iSize; i++ ) {
                contour.push( new CAAT.Point().set( i/iSize, this.getPosition(i/iSize).y, 0 ) );
            }

            return contour;
        },

        /**
         * Reposition this path points.
         * This operation will only take place if the supplied points array equals in size to
         * this path's already set points.
         * @param points {Array<CAAT.Point>}
         */
        setPoints : function( points ) {
            if ( this.points.length===points.length ) {
                for( var i=0; i<points.length; i++ ) {
                    this.points[i].x= points[i].x;
                    this.points[i].y= points[i].y;
                }
            }
            return this;
        },

        /**
         * Set a point from this path.
         * @param point {CAAT.Point}
         * @param index {integer} a point index.
         */
        setPoint : function( point, index ) {
            if ( index>=0 && index<this.points.length ) {
                this.points[index].x= point.x;
                this.points[index].y= point.y;
            }
            return this;
        },


        /**
         * Removes all behaviors from an Actor.
         * @return this
         */
		emptyBehaviorList : function() {
			this.behaviorList=[];
            return this;
		},

        extractPathPoints : function() {
            if ( !this.pathPoints ) {
                var i;
                this.pathPoints= [];
                for ( i=0; i<this.numControlPoints(); i++ ) {
                    this.pathPoints.push( this.getControlPoint(i).clone() );
                }
            }

            return this;
        },

        /**
         * Add a Behavior to the Actor.
         * An Actor accepts an undefined number of Behaviors.
         *
         * @param behavior {CAAT.Behavior} a CAAT.Behavior instance
         * @return this
         */
		addBehavior : function( behavior )	{
			this.behaviorList.push(behavior);
            this.extractPathPoints();
            return this;
		},
        /**
         * Remove a Behavior from the Actor.
         * If the Behavior is not present at the actor behavior collection nothing happends.
         *
         * @param behavior {CAAT.Behavior} a CAAT.Behavior instance.
         */
        removeBehaviour : function( behavior ) {
            var n= this.behaviorList.length-1;
            while(n) {
                if ( this.behaviorList[n]===behavior ) {
                    this.behaviorList.splice(n,1);
                    return this;
                }
            }

            return this;
        },
        /**
         * Remove a Behavior with id param as behavior identifier from this actor.
         * This function will remove ALL behavior instances with the given id.
         *
         * @param id {number} an integer.
         * return this;
         */
        removeBehaviorById : function( id ) {
            for( var n=0; n<this.behaviorList.length; n++ ) {
                if ( this.behaviorList[n].id===id) {
                    this.behaviorList.splice(n,1);
                }
            }

            return this;

        },

        applyBehaviors : function(time) {
            if (this.behaviorList.length) {
                for( var i=0; i<this.behaviorList.length; i++ )	{
                    this.behaviorList[i].apply(time,this);
                }

                /** calculate behavior affine transform matrix **/
                this.setATMatrix();

                for (i = 0; i < this.numControlPoints(); i++) {
                    this.setPoint(
                        this.matrix.transformCoord(
                            this.pathPoints[i].clone()), i);
                }
            }

            return this;
        },

        setATMatrix : function() {
            this.matrix.identity();

            var m= this.tmpMatrix.identity();
            var mm= this.matrix.matrix;
            var c,s,_m00,_m01,_m10,_m11;
            var mm0, mm1, mm2, mm3, mm4, mm5;

            var bbox= this.bbox;
            var bbw= bbox.width  ;
            var bbh= bbox.height ;
            var bbx= bbox.x;
            var bby= bbox.y

            mm0= 1;
            mm1= 0;
            mm3= 0;
            mm4= 1;

            mm2= this.tb_x - bbx;
            mm5= this.tb_y - bby;

            if ( this.rb_angle ) {

                var rbx= (this.rb_rotateAnchorX*bbw + bbx);
                var rby= (this.rb_rotateAnchorY*bbh + bby);

                mm2+= mm0*rbx + mm1*rby;
                mm5+= mm3*rbx + mm4*rby;

                c= Math.cos( this.rb_angle );
                s= Math.sin( this.rb_angle);
                _m00= mm0;
                _m01= mm1;
                _m10= mm3;
                _m11= mm4;
                mm0=  _m00*c + _m01*s;
                mm1= -_m00*s + _m01*c;
                mm3=  _m10*c + _m11*s;
                mm4= -_m10*s + _m11*c;

                mm2+= -mm0*rbx - mm1*rby;
                mm5+= -mm3*rbx - mm4*rby;
            }

            if ( this.sb_scaleX!=1 || this.sb_scaleY!=1 ) {

                var sbx= (this.sb_scaleAnchorX*bbw + bbx);
                var sby= (this.sb_scaleAnchorY*bbh + bby);

                mm2+= mm0*sbx + mm1*sby;
                mm5+= mm3*sbx + mm4*sby;

                mm0= mm0*this.sb_scaleX;
                mm1= mm1*this.sb_scaleY;
                mm3= mm3*this.sb_scaleX;
                mm4= mm4*this.sb_scaleY;

                mm2+= -mm0*sbx - mm1*sby;
                mm5+= -mm3*sbx - mm4*sby;
            }

            mm[0]= mm0;
            mm[1]= mm1;
            mm[2]= mm2;
            mm[3]= mm3;
            mm[4]= mm4;
            mm[5]= mm5;

            return this;

        },

        setRotationAnchored : function( angle, rx, ry ) {
            this.rb_angle=          angle;
            this.rb_rotateAnchorX=  rx;
            this.rb_rotateAnchorY=  ry;
            return this;
        },

        setScaleAnchored : function( scaleX, scaleY, sx, sy ) {
            this.sb_scaleX= scaleX;
            this.sb_scaleAnchorX= sx;
            this.sb_scaleY= scaleY;
            this.sb_scaleAnchorY= sy;
            return this;
        },

        setLocation : function( x, y ) {
            this.tb_x= x;
            this.tb_y= y;
            return this;
        }

    };

    extend( CAAT.Path, CAAT.PathSegment, null);
	
})();/**
 * See LICENSE file.
 *
 * An actor to show the path and its handles in the scene graph. 
 *
 **/
(function() {
    /**
     * This class paints and handles the interactive behavior of a path.
     *
     * @constructor
     * @extends CAAT.ActorContainer
     */
	CAAT.PathActor= function() {
		CAAT.PathActor.superclass.constructor.call(this);
		return this;
	};
	
	CAAT.PathActor.prototype= {
		path:					null,
		pathBoundingRectangle:	null,
		bOutline:				false,
        outlineColor:           'black',

        /**
         * Return the contained path.
         * @return {CAAT.Path}
         */
        getPath : function() {
            return this.path;
        },
        /**
         * Sets the path to manage.
         * @param path {CAAT.PathSegment}
         * @return this
         */
		setPath : function(path) {
			this.path= path;
			this.pathBoundingRectangle= path.getBoundingBox();
            return this;
		},
        /**
         * Paint this actor.
         * @param director {CAAT.Director}
         * @param time {number}. Scene time.
         */
		paint : function(director, time) {

            var canvas= director.crc;

            canvas.strokeStyle='black';
			this.path.paint(director);

			if ( this.bOutline ) {
				canvas.strokeStyle= this.outlineColor;
				canvas.strokeRect(0,0,this.width,this.height);
			}
		},
        /**
         * Enables/disables drawing of the contained path's bounding box.
         * @param show {boolean} whether to show the bounding box
         * @param color {*string} optional parameter defining the path's bounding box stroke style.
         */
        showBoundingBox : function(show, color) {
            this.bOutline= show;
            if ( show && color ) {
                this.outlineColor= color;
            }
        },
        /**
         * Set the contained path as interactive. This means it can be changed on the fly by manipulation
         * of its control points.
         * @param interactive
         */
        setInteractive : function(interactive) {
            if ( this.path ) {
                this.path.setInteractive(interactive);
            }
            return this;
        },
        /**
         * Route mouse dragging functionality to the contained path.
         * @param mouseEvent {CAAT.MouseEvent}
         */
		mouseDrag : function(mouseEvent) {
			this.path.drag(mouseEvent.point.x, mouseEvent.point.y);
		},
        /**
         * Route mouse down functionality to the contained path.
         * @param mouseEvent {CAAT.MouseEvent}
         */
		mouseDown : function(mouseEvent) {
			this.path.press(mouseEvent.point.x, mouseEvent.point.y);
		},
        /**
         * Route mouse up functionality to the contained path.
         * @param mouseEvent {CAAT.MouseEvent}
         */
		mouseUp : function(mouseEvent) {
			this.path.release();
		}
	};

    extend( CAAT.PathActor, CAAT.ActorContainer, null);
})();/**
 * See LICENSE file.
 *
 * This file contains some image processing effects.
 * Currently contains the following out-of-the-box effects:
 *
 *  + IMPlasma:     creates a plasma texture. The plasma is generated out of a color ramp (see color.js file)
 *  + IMBump:       creates a realtime bump-mapping from a given image. It supports multiple light sources
 *                  as well as different light colors.
 *  + IMRotoZoom:   produces a roto zoom effect out of a given square sized image. Image must be 2^n in size.
 *
 * This class must be used as fillStyle for an actor or any element that will be painted in a canvas context.
 *
 */

(function() {
    /**
     * ImageProcessor is a class to encapsulate image processing operations. These image processing
     * manipulates individual image pixels and from an array of pixels builds an image which can
     * be used as a pattern or image.
     * <p>
     * This class pre-creates a canvas of the given dimensions and extracts an imageData object to
     * hold the pixel manipulation.
     *
     * @constructor
     */
    CAAT.ImageProcessor= function() {
        return this;
    };

    CAAT.ImageProcessor.prototype= {
        canvas:     null,
        ctx:        null,
        width:      0,
        height:     0,
        imageData:  null,
        bufferImage:null,

        /**
         * Grabs an image pixels.
         *
         * @param image {HTMLImageElement}
         * @return {ImageData} returns an ImageData object with the image representation or null in
         * case the pixels can not be grabbed.
         *
         * @static
         */
        grabPixels : function(image) {
            var canvas= document.createElement('canvas');
            if ( canvas!==null ) {
                canvas.width= image.width;
                canvas.height= image.height;
                var ctx= canvas.getContext('2d');
                ctx.drawImage(image,0,0);
                try {
                    var imageData= ctx.getImageData(0,0,canvas.width,canvas.height);
                    return imageData;
                }
                catch(e) {
                    CAAT.log('error pixelgrabbing.', image);
                    return null;
                }
            }
            return null;
        },
        /**
         * Helper method to create an array.
         *
         * @param size {number} integer number of elements in the array.
         * @param initValue {number} initial array values.
         *
         * @return {[]} an array of 'initialValue' elements.
         *
         * @static
         */
        makeArray : function(size, initValue) {
            var a= [];

            for(var i=0; i<size; i++ )  {
                a.push( initValue );
            }

            return a;
        },
        /**
         * Helper method to create a bidimensional array.
         *
         * @param size {number} number of array rows.
         * @param size2 {number} number of array columns.
         * @param initvalue array initial values.
         *
         * @return {[]} a bidimensional array of 'initvalue' elements.
         *
         * @static
         *
         */
        makeArray2D : function (size, size2, initvalue)  {
            var a= [];

            for( var i=0; i<size; i++ ) {
                a.push( this.makeArray(size2,initvalue) );
            }

            return a;
        },
        /**
         * Initializes and creates an offscreen Canvas object. It also creates an ImageData object and
         * initializes the internal bufferImage attribute to imageData's data.
         * @param width {number} canvas width.
         * @param height {number} canvas height.
         * @return this
         */
        initialize : function(width,height) {

            this.width=  width;
            this.height= height;

            this.canvas= document.createElement('canvas');
            if ( this.canvas!==null ) {
                this.canvas.width= width;
                this.canvas.height= height;
                this.ctx= this.canvas.getContext('2d');
                this.imageData= this.ctx.getImageData(0,0,width,height);
                this.bufferImage= this.imageData.data;
            }

            return this;
        },
        /**
         * Clear this ImageData object to the given color components.
         * @param r {number} red color component 0..255.
         * @param g {number} green color component 0..255.
         * @param b {number} blue color component 0..255.
         * @param a {number} alpha color component 0..255.
         * @return this
         */
        clear : function( r,g,b,a ) {
            if ( null===this.imageData ) {
                return this;
            }
            var data= this.imageData.data;
            for( var i=0; i<this.width*this.height; i++ ) {
                data[i*4+0]= r;
                data[i*4+1]= g;
                data[i*4+2]= b;
                data[i*4+3]= a;
            }
this.imageData.data= data;

            return this;
        },
        /**
         * Get this ImageData.
         * @return {ImageData}
         */
        getImageData : function() {
            return this.ctx.getImageData(0,0,this.width,this.height);
        },
        /**
         * Sets canvas pixels to be the applied effect. After process pixels, this method must be called
         * to show the result of such processing.
         * @param director {CAAT.Director}
         * @param time {number}
         * @return this
         */
        apply : function(director, time) {
            if ( null!==this.imageData ) {
this.imageData.data= this.bufferImage;
                this.ctx.putImageData(this.imageData, 0, 0);
            }
            return this;
        },
        /**
         * Returns the offscreen canvas.
         * @return {HTMLCanvasElement}
         */
        getCanvas : function() {
            return this.canvas;
        },
        /**
         * Creates a pattern that will make this ImageProcessor object suitable as a fillStyle value.
         * This effect can be drawn too as an image by calling: canvas_context.drawImage methods.
         * @param type {string} the pattern type. if no value is supplied 'repeat' will be used.
         * @return CanvasPattern.
         */
        createPattern : function( type ) {
            return this.ctx.createPattern(this.canvas,type ? type : 'repeat');
        },
        /**
         * Paint this ImageProcessor object result.
         * @param director {CAAT.Director}.
         * @param time {number} scene time.
         */
        paint : function( director, time ) {
            if ( null!==this.canvas ) {
                var ctx= director.ctx;
                ctx.drawImage( this.getCanvas(), 0, 0 );
            }
        }
    };

})();

(function() {

    /**
     * Creates an additive plasma wave image.
     *
     * @constructor
     * @extends CAAT.ImageProcessor
     *
     */
    CAAT.IMPlasma= function() {
        CAAT.IMPlasma.superclass.constructor.call(this);
        return this;
    };

    CAAT.IMPlasma.prototype= {
        wavetable: null,
        m_colorMap: null,
        spd1: 1,
        spd2: 2,
        spd3: 3,
        spd4: 4,
        pos1: 0,
        pos2: 0,
        pos3: 0,
        pos4: 0,
        tpos1: 0,
        tpos2: 0,
        tpos3: 0,
        tpos4: 0,
        m_colorMapSize: 256,
        i1: 0,
        i2: 0,
        i3: 0,
        i4: 0,
        b1: false,
        b2: false,
        b3: false,
        b4: false,

        color: [0xffffffff, 0xffff00ff, 0xffffff00, 0xff00ff00, 0xffff0000, 0xff0000ff, 0xff000000],

        /**
         * Initialize the plasma image processor.
         * <p>
         * This image processor creates a color ramp of 256 elements from the colors of the parameter 'colors'.
         * Be aware of color definition since the alpha values count to create the ramp.
         *
         * @param width {number}
         * @param height {number}
         * @param colors {Array.<number>} an array of color values.
         *
         * @return this
         */
        initialize : function(width,height,colors) {
            CAAT.IMPlasma.superclass.initialize.call(this,width,height);

            this.wavetable= [];
            for (var x=0; x<256; x++)   {
                this.wavetable.push( Math.floor(32 * (1 + Math.cos(x*2 * Math.PI / 256))) );
            }

            this.pos1=Math.floor(255*Math.random());
            this.pos2=Math.floor(255*Math.random());
            this.pos3=Math.floor(255*Math.random());
            this.pos4=Math.floor(255*Math.random());

            this.m_colorMap= CAAT.Color.prototype.makeRGBColorRamp(
                    colors!==null ? colors : this.color,
                    256,
                    CAAT.Color.prototype.RampEnumeration.RAMP_CHANNEL_RGBA_ARRAY );

            this.setB();

            return this;
        },
        /**
         * Initialize internal plasma structures. Calling repeatedly this method will make the plasma
         * look different.
         */
        setB : function() {

            this.b1= Math.random()>0.5;
            this.b2= Math.random()>0.5;
            this.b3= Math.random()>0.5;
            this.b4= Math.random()>0.5;

            this.spd1= Math.floor((Math.random()*3+1)*(Math.random()<0.5?1:-1));
            this.spd2= Math.floor((Math.random()*3+1)*(Math.random()<0.5?1:-1));
            this.spd3= Math.floor((Math.random()*3+1)*(Math.random()<0.5?1:-1));
            this.spd4= Math.floor((Math.random()*3+1)*(Math.random()<0.5?1:-1));

            this.i1= Math.floor((Math.random()*2.4+1)*(Math.random()<0.5?1:-1));
            this.i2= Math.floor((Math.random()*2.4+1)*(Math.random()<0.5?1:-1));
            this.i3= Math.floor((Math.random()*2.4+1)*(Math.random()<0.5?1:-1));
            this.i4= Math.floor((Math.random()*2.4+1)*(Math.random()<0.5?1:-1));
        },
        /**
         * Apply image processing to create the plasma and call superclass's apply to make the result
         * visible.
         * @param director {CAAT.Director}
         * @param time {number}
         *
         * @return this
         */
        apply : function(director,time) {

            var v = 0;
	        this.tpos1 = this.pos1;
	        this.tpos2 = this.pos2;

            var bi= this.bufferImage;
            var cm= this.m_colorMap;
            var wt= this.wavetable;
            var z;
            var cmz;

	        for (var x=0; x<this.height; x++) {
                this.tpos3 = this.pos3;
                this.tpos4 = this.pos4;

                for(var y=0; y<this.width; y++) {
                    // mix at will, or at your own risk.
                    var o1= this.tpos1+this.tpos2+this.tpos3;
                    var o2= this.tpos2+this.tpos3-this.tpos1;
                    var o3= this.tpos3+this.tpos4-this.tpos2;
                    var o4= this.tpos4+this.tpos1-this.tpos2;

                    // set different directions. again, change at will.
                    if ( this.b1 ) o1= -o1;
                    if ( this.b2 ) o2= -o2;
                    if ( this.b3 ) o3= -o3;
                    if ( this.b4 ) o4= -o4;

                    z = Math.floor( wt[o1&255] + wt[o2&255] + wt[o3&255] + wt[o4&255] );
                    cmz= cm[z];

                    bi[ v++ ]= cmz[0];
                    bi[ v++ ]= cmz[1];
                    bi[ v++ ]= cmz[2];
                    bi[ v++ ]= cmz[3];

                    this.tpos3 += this.i1;
                    this.tpos3&=255;
                    this.tpos4 += this.i2;
                    this.tpos4&=255;
                }

                this.tpos1 += this.i3;
                this.tpos1&=255;
                this.tpos2 += this.i4;
                this.tpos2&=255;
            }

            this.pos1 += this.spd1;
            this.pos2 -= this.spd2;
            this.pos3 += this.spd3;
            this.pos4 -= this.spd4;
            this.pos1&=255;
            this.pos3&=255;
            this.pos2&=255;
            this.pos4&=255;

            return CAAT.IMPlasma.superclass.apply.call(this,director,time);
        }
    };

    extend( CAAT.IMPlasma, CAAT.ImageProcessor, null);

})();

(function() {

    /**
     * This class creates a bumpy effect from a given image. The effect can be applied by different lights
     * each of which can bump the image with a different color. The lights will have an additive color
     * effect on affected pixels.
     *
     * @constructor
     * @extends CAAT.ImageProcessor
     */
    CAAT.IMBump=function() {
        CAAT.IMBump.superclass.constructor.call(this);
        return this;
    };

    CAAT.IMBump.prototype= {

        // bump
        m_avgX:         null,
        m_avgY:         null,
        m_tt:           null,
        phong:          null,

        m_radius:       75,

        m_lightcolor:   null,
        bcolor:         false,
        lightPosition:  [],

        /**
         * Initializes internal bump effect data.
         *
         * @param image {HTMLImageElement}
         * @param radius {number} lights radius.
         *
         * @private
         */
        prepareBump : function(image, radius) {
            var i,j;

            this.m_radius= (radius ? radius : 75);

            var imageData= this.grabPixels(image);

            this.m_tt= this.makeArray(this.height,0);
            for( i=0; i<this.height; i++ ){
                this.m_tt[ i ]=this.width*i;
            }

            this.m_avgX= this.makeArray2D(this.height,this.width,0);
            this.m_avgY= this.makeArray2D(this.height,this.width,0);

            var bump=this.makeArray2D(this.height,this.width,0);

            if ( null===imageData ) {
                return;
            }
            
            var sourceImagePixels= imageData.data;

            for (i=0;i<this.height;i++) {
                for (j=0;j<this.width;j++) {
                    var pos= (i*this.width+j)*4;
                    bump[i][j]=
                        sourceImagePixels[pos  ]+
                        sourceImagePixels[pos+1]+
                        sourceImagePixels[pos+2];
                }
            }

            bump= this.soften( bump );

            for (var x=1;x<this.width-1;x++)    {
                for (var y=1;y<this.height-1;y++)   {
                    this.m_avgX[y][x]=Math.floor(bump[y][x+1]-bump[y][x-1]);
                    this.m_avgY[y][x]=Math.floor(bump[y+1][x]-bump[y-1][x]);
                }
            }

            bump=null;
        },
        /**
         * Soften source images extracted data on prepareBump method.
         * @param bump bidimensional array of black and white source image version.
         * @return bidimensional array with softened version of source image's b&w representation.
         */
        soften : function( bump ) {
            var temp;
            var sbump=this.makeArray2D( this.height,this.width, 0);

            for (var j=0;j<this.width;j++) {
                for (var i=0;i<this.height;i++) {
                    temp=(bump[i][j]);
                    temp+=(bump[(i+1)%this.height][j]);
                    temp+=(bump[(i+this.height-1)%this.height][j]);
                    temp+=(bump[i][(j+1)%this.width]);
                    temp+=(bump[i][(j+this.width-1)%this.width]);
                    temp+=(bump[(i+1)%this.height][(j+1)%this.width]);
                    temp+=(bump[(i+this.height-1)%this.height][(j+this.width-1)%this.width]);
                    temp+=(bump[(i+this.height-1)%this.height][(j+1)%this.width]);
                    temp+=(bump[(i+1)%this.height][(j+this.width-1)%this.width]);
                    temp/=9;
                    sbump[i][j]=temp/3;
                }
            }

            return sbump;
        },
        /**
         * Create a phong image to apply bump effect.
         * @private
         */
        calculatePhong : function( ) {
            this.phong= this.makeArray2D(this.m_radius,this.m_radius,0);

            var i,j,z;
            for( i=0; i<this.m_radius; i++ ) {
                for( j=0; j<this.m_radius; j++ ) {
                    var x= j/this.m_radius;
                    var y= i/this.m_radius;
                    z= (1-Math.sqrt(x*x+y*y))*0.8;
                    if ( z<0 ) {
                        z=0;
                    }
                    this.phong[ i ][ j ]= Math.floor(z*255);
                }
            }
        },
        /**
         * Generates a bump image.
         * @param dstPixels {ImageData.data} destinarion pixel array to store the calculated image.
         */
        drawColored : function(dstPixels)	{
            var i,j,k;
            for( i=0; i<this.height; i++ ) {
                for( j=0; j<this.width; j++ ){

                    var rrr=0;
                    var ggg=0;
                    var bbb=0;

                    for( k=0; k<this.m_lightcolor.length; k++ ) {

                        var lx= this.lightPosition[k].x;
                        var ly= this.lightPosition[k].y;

                        var dx=Math.floor(Math.abs(this.m_avgX[i][j]-j+lx));
                        var dy=Math.floor(Math.abs(this.m_avgY[i][j]-i+ly));

                        if (dx>=this.m_radius) {
                            dx=this.m_radius-1;
                        }
                        if (dy>=this.m_radius) {
                            dy=this.m_radius-1;
                        }

                        var c= this.phong[ dx ] [ dy ];
                        var r=0;
                        var g=0;
                        var b=0;

                        if ( c>=0 ) {// oscurecer
                            r= (this.m_lightcolor[k][0]*c/128);
                            g= (this.m_lightcolor[k][1]*c/128);
                            b= (this.m_lightcolor[k][2]*c/128);
                        }
                        else {			// blanquear.
                            c=128+c;
                            var rr= (this.m_lightcolor[k][0]);
                            var gg= (this.m_lightcolor[k][1]);
                            var bb= (this.m_lightcolor[k][2]);

                            r= Math.floor(rr+ (255-rr)*c/128);
                            g= Math.floor(gg+ (255-gg)*c/128);
                            b= Math.floor(bb+ (255-bb)*c/128);
                        }

                        rrr+=r;
                        ggg+=g;
                        bbb+=b;
                    }

                    if ( rrr>255 ) {
                        rrr=255;
                    }
                    if ( ggg>255 ) {
                        ggg=255;
                    }
                    if ( bbb>255 ) {
                        bbb=255;
                    }

                    var pos= (j+this.m_tt[i])*4;
                    dstPixels[pos  ]= rrr;
                    dstPixels[pos+1]= ggg;
                    dstPixels[pos+2]= bbb;
                    dstPixels[pos+3]= 255;
                }
            }
        },
        /**
         * Sets lights color.
         * @param colors_rgb_array an array of arrays. Each internal array has three integers defining an RGB color.
         * ie:
         *  [
         *     [ 255,0,0 ],
         *     [ 0,255,0 ]
         *  ]
         * @return this
         */
        setLightColors : function( colors_rgb_array ) {
            this.m_lightcolor= colors_rgb_array;
            this.lightPosition= [];
            for( var i=0; i<this.m_lightcolor.length; i++ ) {
                var x= this.width*Math.random();
                var y= this.height*Math.random();
                this.lightPosition.push( new CAAT.Point().set(x,y) );
            }
            return this;
        },
        /**
         * Initialize the bump image processor.
         * @param image {HTMLImageElement} source image to bump.
         * @param radius {number} light radius.
         */
        initialize : function(image,radius) {
            CAAT.IMBump.superclass.initialize.call(this,image.width,image.height);

            this.setLightColors(
                    [
                        [255,128,0],
                        [0,0,255]
                    ]);

            this.prepareBump(image,radius);
            this.calculatePhong();

            return this;
        },
        /**
         * Set a light position.
         * @param lightIndex {number} light index to position.
         * @param x {number} light x coordinate.
         * @param y {number} light y coordinate.
         * @return this
         */
        setLightPosition : function( lightIndex, x, y ) {
            this.lightPosition[lightIndex].set(x,y);
            return this;
        },
        /**
         * Applies the bump effect and makes it visible on the canvas surface.
         * @param director {CAAT.Director}
         * @param time {number}
         */
        apply : function(director,time) {
            this.drawColored(this.bufferImage);
            return CAAT.IMBump.superclass.apply.call(this,director,time);
        }
    };

    extend( CAAT.IMBump, CAAT.ImageProcessor, null);
})();

(function() {

    /**
     * This class creates an image processing Rotozoom effect.
     *
     * @constructor
     * @extends CAAT.ImageProcessor
     */
    CAAT.IMRotoZoom= function() {
        CAAT.IMRotoZoom.superclass.constructor.call(this);
        return this;
    };

    CAAT.IMRotoZoom.prototype= {
        m_alignv:       1,
        m_alignh:       1,
        distortion:     2,
        mask:           0,
        shift:          0,
        sourceImageData:null,   // pattern to fill area with.

        /**
         * Initialize the rotozoom.
         * @param width {number}
         * @param height {number}
         * @param patternImage {HTMLImageElement} image to tile with.
         *
         * @return this
         */
        initialize : function( width, height, patternImage ) {
            CAAT.IMRotoZoom.superclass.initialize.call(this,width,height);

            this.clear( 255,128,0, 255 );

            this.sourceImageData= this.grabPixels(patternImage);

            if ( null!==this.sourceImageData ) {
                // patternImage must be 2^n sized.
                switch( this.sourceImageData.width ) {
                    case 1024:
                        this.mask=1023;
                        this.shift=10;
                        break;
                    case 512:
                        this.mask=511;
                        this.shift=9;
                        break;
                    case 256:
                        this.mask=255;
                        this.shift=8;
                        break;
                    case 128:
                        this.mask=127;
                        this.shift=7;
                        break;
                    case 64:
                        this.mask=63;
                        this.shift=6;
                        break;
                    case 32:
                        this.mask=31;
                        this.shift=5;
                        break;
                    case 16:
                        this.mask=15;
                        this.shift=4;
                        break;
                    case 8:
                        this.mask=7;
                        this.shift=3;
                        break;
                }
            }

            this.setCenter();

            return this;
        },
        /**
         * Performs the process of tiling rotozoom.
         * @param director {CAAT.Director}
         * @param time {number}
         *
         * @private
         */
        rotoZoom: function(director,time)  {

            var timer = new Date().getTime();

            var angle=Math.PI*2 * Math.cos(timer * 0.0001);
            var distance= 600+ 550*Math.sin(timer*0.0002);

            var dist= this.distortion;

            var off=0;
            var ddx=Math.floor(Math.cos(angle)*distance);
            var ddy=Math.floor(Math.sin(angle)*distance);

            var hh=0, ww=0;

            switch( this.m_alignh )	{
                case 0:
                    hh = 0;
                    break;
                case 1:
                    hh = (this.height >> 1);
                    break;
                case 2:
                    hh = this.height - 1;
                    break;
            }

            switch (this.m_alignv) {
                case 0:
                    ww = 0;
                    break;
                case 1:
                    ww = (this.width >> 1);
                    break;
                case 2:
                    ww = this.width - 1;
                    break;
            }

            var i = (((this.width >> 1) << 8)  - ddx * ww + ddy * hh)&0xffff;
            var j = (((this.height >> 1) << 8) - ddy * ww - ddx * hh) & 0xffff;

            var srcwidth=   this.sourceImageData.width;
            var srcheight=  this.sourceImageData.height;
            var srcdata=    this.sourceImageData.data;
            var bi=         this.bufferImage;
            var dstoff;
            var addx;
            var addy;

            while (off < this.width * this.height * 4) {
                addx = i;
                addy = j;

                for (var m = 0; m < this.width; m++) {
                    dstoff = ((addy >> this.shift) & this.mask) * srcwidth + ((addx >> this.shift) & this.mask);
                    dstoff <<= 2;

                    bi[ off++ ] = srcdata[ dstoff++ ];
                    bi[ off++ ] = srcdata[ dstoff++ ];
                    bi[ off++ ] = srcdata[ dstoff++ ];
                    bi[ off++ ] = srcdata[ dstoff++ ];

                    addx += ddx;
                    addy += ddy;

                }

                dist += this.distortion;
                i -= ddy;
                j += ddx - dist;
            }
        },
        /**
         * Perform and apply the rotozoom effect.
         * @param director {CAAT.Director}
         * @param time {number}
         * @return this
         */
        apply : function(director,time) {
            if ( null!==this.sourceImageData ) {
                this.rotoZoom(director,time);
            }
            return CAAT.IMRotoZoom.superclass.apply.call(this,director,time);
        },
        /**
         * Change the effect's rotation anchor. Call this method repeatedly to make the effect look
         * different.
         */
        setCenter: function() {
            var d = Math.random();
            if (d < 0.33) {
                this.m_alignv = 0;
            } else if (d < 0.66) {
                this.m_alignv = 1;
            } else {
                this.m_alignv = 2;
            }

            d = Math.random();
            if (d < 0.33) {
                this.m_alignh = 0;
            } else if (d < 0.66) {
                this.m_alignh = 1;
            } else {
                this.m_alignh = 2;
            }
        }

    };

    extend( CAAT.IMRotoZoom, CAAT.ImageProcessor, null);

})();/**
 * See LICENSE file.
 */


(function() {
    CAAT.Program= function(gl) {
        this.gl= gl;
        return this;
    };

    CAAT.Program.prototype= {

        shaderProgram:  null,
        gl:             null,

        /**
         * Set fragment shader's alpha composite value.
         * @param alpha {number} float value 0..1.
         */
        setAlpha : function( alpha ) {

        },
        getShader : function (gl,type,str) {
            var shader;
            if (type === "x-shader/x-fragment") {
                shader = gl.createShader(gl.FRAGMENT_SHADER);
            } else if (type === "x-shader/x-vertex") {
                shader = gl.createShader(gl.VERTEX_SHADER);
            } else {
                return null;
            }

            gl.shaderSource(shader, str);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                alert(gl.getShaderInfoLog(shader));
                return null;
            }

            return shader;

        },
        getDomShader : function(gl, id) {
            var shaderScript = document.getElementById(id);
            if (!shaderScript) {
                return null;
            }

            var str = "";
            var k = shaderScript.firstChild;
            while (k) {
                if (k.nodeType === 3) {
                    str += k.textContent;
                }
                k = k.nextSibling;
            }

            var shader;
            if (shaderScript.type === "x-shader/x-fragment") {
                shader = gl.createShader(gl.FRAGMENT_SHADER);
            } else if (shaderScript.type === "x-shader/x-vertex") {
                shader = gl.createShader(gl.VERTEX_SHADER);
            } else {
                return null;
            }

            gl.shaderSource(shader, str);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                alert(gl.getShaderInfoLog(shader));
                return null;
            }

            return shader;
        },
        initialize : function() {
            return this;
        },
        getFragmentShader : function() {
            return null;
        },
        getVertexShader : function() {
            return null;
        },
        create : function() {
            var gl= this.gl;

            this.shaderProgram = gl.createProgram();
            gl.attachShader(this.shaderProgram, this.getVertexShader());
            gl.attachShader(this.shaderProgram, this.getFragmentShader());
            gl.linkProgram(this.shaderProgram);
            gl.useProgram(this.shaderProgram);
            return this;
        },
        setMatrixUniform : function( caatMatrix4 ) {
            this.gl.uniformMatrix4fv(
                    this.shaderProgram.pMatrixUniform,
                    false,
                    new Float32Array(caatMatrix4.flatten()));

        },
        useProgram : function() {
            this.gl.useProgram(this.shaderProgram);
            return this;
        }
    };
})();

(function() {
    CAAT.ColorProgram= function(gl) {
        CAAT.ColorProgram.superclass.constructor.call(this,gl);
        return this;
    };

    CAAT.ColorProgram.prototype= {

        colorBuffer:    null,
        vertexPositionBuffer:   null,
        vertexPositionArray:    null,

        getFragmentShader : function() {
            return this.getShader(this.gl, "x-shader/x-fragment",
                    "#ifdef GL_ES \n"+
                    "precision highp float; \n"+
                    "#endif \n"+

                    "varying vec4 color; \n"+
                            
                    "void main(void) { \n"+
                    "  gl_FragColor = color;\n"+
                    "}\n"
                    );

        },
        getVertexShader : function() {
            return this.getShader(this.gl, "x-shader/x-vertex",
                    "attribute vec3 aVertexPosition; \n"+
                    "attribute vec4 aColor; \n"+
                    "uniform mat4 uPMatrix; \n"+
                    "varying vec4 color; \n"+

                    "void main(void) { \n"+
                    "gl_Position = uPMatrix * vec4(aVertexPosition, 1.0); \n"+
                    "color= aColor; \n"+
                    "}\n"
                    );
        },
        initialize : function() {
            this.shaderProgram.vertexPositionAttribute =
                    this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
            this.gl.enableVertexAttribArray(
                    this.shaderProgram.vertexPositionAttribute);

            this.shaderProgram.vertexColorAttribute =
                    this.gl.getAttribLocation(this.shaderProgram, "aColor");
            this.gl.enableVertexAttribArray(
                    this.shaderProgram.vertexColorAttribute);

            this.shaderProgram.pMatrixUniform =
                    this.gl.getUniformLocation(this.shaderProgram, "uPMatrix");

            this.useProgram();

            this.colorBuffer= this.gl.createBuffer();
            this.setColor( [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1] );

            var maxTris=4096, i;
            /// set vertex data
            this.vertexPositionBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer );
            this.vertexPositionArray= new Float32Array(maxTris*12);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexPositionArray, this.gl.DYNAMIC_DRAW);
            this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);

            return CAAT.ColorProgram.superclass.initialize.call(this);
        },
        setColor : function( colorArray ) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer );
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colorArray), this.gl.STATIC_DRAW);

            this.gl.vertexAttribPointer(
                    this.shaderProgram.vertexColorAttribute,
                    this.colorBuffer,
                    this.gl.FLOAT,
                    false,
                    0,
                    0);
        }
    };

    extend(CAAT.ColorProgram, CAAT.Program, null );
})();

(function() {
    CAAT.TextureProgram= function(gl) {
        CAAT.TextureProgram.superclass.constructor.call(this,gl);
        return this;
    };

    CAAT.TextureProgram.prototype= {

        vertexPositionBuffer:   null,
        vertexPositionArray:    null,
        vertexUVBuffer:         null,
        vertexUVArray:          null,
        vertexIndexBuffer:      null,

        linesBuffer:            null,

        prevAlpha:              -1,
        prevR:                  -1,
        prevG:                  -1,
        prevB:                  -1,
        prevA:                  -1,
        prevTexture:            null,

        getFragmentShader : function() {
            return this.getShader( this.gl, "x-shader/x-fragment",
                    "#ifdef GL_ES \n"+
                    "precision highp float; \n"+
                    "#endif \n"+

                    "varying vec2 vTextureCoord; \n"+
                    "uniform sampler2D uSampler; \n"+
                    "uniform float alpha; \n"+
                    "uniform bool uUseColor;\n"+
                    "uniform vec4 uColor;\n"+

                    "void main(void) { \n"+

                    "if ( uUseColor ) {\n"+
                    "  gl_FragColor= vec4(uColor.rgb, uColor.a*alpha);\n"+
                    "} else { \n"+
                    "  vec4 textureColor= texture2D(uSampler, vec2(vTextureCoord)); \n"+
                    "  gl_FragColor = vec4(textureColor.rgb, textureColor.a * alpha); \n"+
                    "}\n"+

                    "}\n"
                    );
        },
        getVertexShader : function() {
            return this.getShader(this.gl, "x-shader/x-vertex",
                    "attribute vec3 aVertexPosition; \n"+
                    "attribute vec2 aTextureCoord; \n"+

                    "uniform mat4 uPMatrix; \n"+

                    "varying vec2 vTextureCoord; \n"+

                    "void main(void) { \n"+
                    "gl_Position = uPMatrix * vec4(aVertexPosition, 1.0); \n"+
                    "vTextureCoord = aTextureCoord;\n"+
                    "}\n"
                    );
        },
        useProgram : function() {
            CAAT.TextureProgram.superclass.useProgram.call(this);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer );
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexUVBuffer);
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
        },
        initialize : function() {

            var i;

            this.linesBuffer= this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.linesBuffer );
            var arr= [];
            for( i=0; i<1024; i++ ) {
                arr[i]= i;
            }
            this.linesBufferArray= new Uint16Array(arr);
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.linesBufferArray, this.gl.DYNAMIC_DRAW);


            this.shaderProgram.vertexPositionAttribute =
                    this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
            this.gl.enableVertexAttribArray(
                    this.shaderProgram.vertexPositionAttribute);

            this.shaderProgram.textureCoordAttribute =
                    this.gl.getAttribLocation(this.shaderProgram, "aTextureCoord");
            this.gl.enableVertexAttribArray(
                    this.shaderProgram.textureCoordAttribute);

            this.shaderProgram.pMatrixUniform =
                    this.gl.getUniformLocation(this.shaderProgram, "uPMatrix");
            this.shaderProgram.samplerUniform =
                    this.gl.getUniformLocation(this.shaderProgram, "uSampler");
            this.shaderProgram.alphaUniform   =
                    this.gl.getUniformLocation(this.shaderProgram, "alpha");
            this.shaderProgram.useColor =
                    this.gl.getUniformLocation(this.shaderProgram, "uUseColor");
            this.shaderProgram.color =
                    this.gl.getUniformLocation(this.shaderProgram, "uColor");

            this.setAlpha(1);
            this.setUseColor(false);

            var maxTris=4096;
            /// set vertex data
            this.vertexPositionBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer );
            this.vertexPositionArray= new Float32Array(maxTris*12);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexPositionArray, this.gl.DYNAMIC_DRAW);
            this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);

            // uv info
            this.vertexUVBuffer= this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexUVBuffer);
            this.vertexUVArray= new Float32Array(maxTris*8);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexUVArray, this.gl.DYNAMIC_DRAW);
            this.gl.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, 2, this.gl.FLOAT, false, 0, 0);

            // vertex index
            this.vertexIndexBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);            
            var vertexIndex = [];
            for( i=0; i<maxTris; i++ ) {
                vertexIndex.push(0 + i*4); vertexIndex.push(1 + i*4); vertexIndex.push(2 + i*4);
                vertexIndex.push(0 + i*4); vertexIndex.push(2 + i*4); vertexIndex.push(3 + i*4);
            }
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndex), this.gl.STATIC_DRAW);            

            return CAAT.TextureProgram.superclass.initialize.call(this);
        },
        setUseColor : function( use,r,g,b,a ) {
            this.gl.uniform1i(this.shaderProgram.useColor, use?1:0);
            if ( use ) {
                if ( this.prevA!==a || this.prevR!==r || this.prevG!==g || this.prevB!==b ) {
                    this.gl.uniform4f(this.shaderProgram.color, r,g,b,a );
                    this.prevA= a;
                    this.prevR= r;
                    this.prevG= g;
                    this.prevB= b;
                }
            }
        },
        setTexture : function( glTexture ) {
            if ( this.prevTexture!==glTexture ) {
                var gl= this.gl;

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, glTexture);
                gl.uniform1i(this.shaderProgram.samplerUniform, 0);

                this.prevTexture= glTexture;
            }

            return this;
        },
        updateVertexBuffer : function(vertexArray) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer );
            this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, vertexArray);
            return this;
        },
        updateUVBuffer : function(uvArray) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexUVBuffer );
            this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, uvArray);
            return this;
        },
        setAlpha : function(alpha) {
            if ( this.prevAlpha !== alpha ) {
                this.gl.uniform1f(
                    this.shaderProgram.alphaUniform, alpha);
                this.prevAlpha= alpha;
            }
            return this;
        },
        /**
         *
         * @param lines_data {Float32Array} array of number with x,y,z coords for each line point.
         * @param size {number} number of lines to draw.
         * @param r
         * @param g
         * @param b
         * @param a
         * @param lineWidth {number} drawing line size.
         */
        drawLines : function( lines_data, size, r,g,b,a, lineWidth ) {
            var gl= this.gl;

            this.setAlpha( a );

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.linesBuffer );
            gl.lineWidth(lineWidth);

            this.updateVertexBuffer(lines_data);
            this.setUseColor(true, r,g,b,1 );
            gl.drawElements(gl.LINES, size, gl.UNSIGNED_SHORT, 0);

            /// restore
            this.setAlpha( 1 );
            this.setUseColor(false);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
            
        },
        /**
         * 
         * @param polyline_data
         * @param size
         * @param r
         * @param g
         * @param b
         * @param a
         * @param lineWidth
         */
        drawPolylines : function( polyline_data, size, r,g,b,a, lineWidth ) {
            var gl= this.gl;

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.linesBuffer );
            gl.lineWidth(lineWidth);

            this.setAlpha(a);

            this.updateVertexBuffer(polyline_data);
            this.setUseColor(true, r,g,b,1 );
            gl.drawElements(gl.LINE_STRIP, size, gl.UNSIGNED_SHORT, 0);

            /// restore
            this.setAlpha( 1 );
            this.setUseColor(false);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);

        }
    };

    extend( CAAT.TextureProgram, CAAT.Program, null );
})();/**
 * See LICENSE file.
 *
 */

//
// gluPerspective
//
function makePerspective(fovy, aspect, znear, zfar, viewportHeight) {
    var ymax = znear * Math.tan(fovy * Math.PI / 360.0);
    var ymin = -ymax;
    var xmin = ymin * aspect;
    var xmax = ymax * aspect;

    return makeFrustum(xmin, xmax, ymin, ymax, znear, zfar, viewportHeight);
}

//
// glFrustum
//
function makeFrustum(left, right, bottom, top, znear, zfar, viewportHeight) {
    var X = 2*znear/(right-left);
    var Y = 2*znear/(top-bottom);
    var A = (right+left)/(right-left);
    var B = (top+bottom)/(top-bottom);
    var C = -(zfar+znear)/(zfar-znear);
    var D = -2*zfar*znear/(zfar-znear);

    return new CAAT.Matrix3().initWithMatrix(
            [
                [X,  0,  A, -viewportHeight/2 ],
                [0, -Y,  B,  viewportHeight/2 ],
                [0,  0,  C,                 D ],
                [0,  0, -1,                 0 ]
            ]);
}

function makeOrtho(left, right, bottom, top, znear, zfar) {
    var tx = - (right + left) / (right - left) ;
    var ty = - (top + bottom) / (top - bottom) ;
    var tz = - (zfar + znear) / (zfar - znear);

    return new CAAT.Matrix3().initWithMatrix(
            [
                [2 / (right - left), 0, 0, tx ],
                [0, 2 / (top - bottom), 0, ty ],
                [0, 0, -2 / (zfar- znear), tz ],
                [0, 0, 0,                  1  ]
            ]);
}

/**
 * See LICENSE file.
 */
(function() {

    CAAT.GLTextureElement = function() {
        return this;
    };

    CAAT.GLTextureElement.prototype= {
        inverted:   false,
        image:      null,
        u:          0,
        v:          0,
        glTexture:  null
    };

})();

(function() {
    CAAT.GLTextureScan= function(w) {
        this.freeChunks=[ {position:0, size:w||1024} ];
        return this;
    };

    CAAT.GLTextureScan.prototype= {
        freeChunks: null,

        /**
         * return an array of values where a chunk of width size fits in this scan.
         * @param width
         */
        findWhereFits : function( width ) {
            if ( this.freeChunks.length===0 ) {
                return [];
            }

            var fitsOnPosition= [];
            var i;

            for( i=0; i<this.freeChunks.length; i++ ) {
                var pos= 0;
                while( pos+width<= this.freeChunks[i].size ) {
                    fitsOnPosition.push( pos+this.freeChunks[i].position );
                    pos+= width;
                }
            }

            return fitsOnPosition;
        },
        fits : function( position, size ) {
            var i=0;

            for( i=0; i<this.freeChunks.length; i++ ) {
                var fc= this.freeChunks[i];
                if ( fc.position<=position && position+size<=fc.position+fc.size ) {
                    return true;
                }
            }

            return false;
        },
        substract : function( position, size ) {
            var i=0;

            for( i=0; i<this.freeChunks.length; i++ ) {
                var fc= this.freeChunks[i];
                if ( fc.position<=position && position+size<=fc.position+fc.size ) {
                    var lp=0;
                    var ls=0;
                    var rp=0;
                    var rs=0;

                    lp= fc.position;
                    ls= position-fc.position;

                    rp= position+size;
                    rs= fc.position+fc.size - rp;

                    this.freeChunks.splice(i,1);

                    if ( ls>0 ) {
                        this.freeChunks.splice( i++,0,{position: lp, size:ls} );
                    }
                    if ( rs>0 ) {
                        this.freeChunks.splice( i,0,{position: rp, size:rs} );
                    }

                    return true;
                }
            }

            return false;
        },
        log : function(index) {
            if ( 0===this.freeChunks.length ) {
                CAAT.log('index '+index+' empty');
            } else {
                var str='index '+index;
                for( var i=0; i<this.freeChunks.length; i++ ) {
                    var fc= this.freeChunks[i];
                    str+='['+fc.position+","+fc.size+"]";
                }
                CAAT.log(str);
            }
        }
    };
})();

(function() {
    CAAT.GLTextureScanMap= function(w,h) {
        this.scanMapHeight= h;
        this.scanMapWidth= w;

        this.scanMap= [];
        for( var i=0; i<this.scanMapHeight; i++ ) {
            this.scanMap.push( new CAAT.GLTextureScan(this.scanMapWidth) );
        }

        return this;
    };
    
    CAAT.GLTextureScanMap.prototype= {
        scanMap:        null,
        scanMapWidth:   0,
        scanMapHeight:  0,

        /**
         * Always try to fit a chunk of size width*height pixels from left-top.
         * @param width
         * @param height
         */
        whereFitsChunk : function( width, height ) {

            // trivial rejection:
            if ( width>this.width||height>this.height) {
                return null;
            }

            // find first fitting point
            var i,j,initialPosition= 0;

            while( initialPosition<=this.scanMapHeight-height) {

                // para buscar sitio se buscar‡ un sitio hasta el tama–o de alto del trozo.
                // mas abajo no va a caber.

                // fitHorizontalPosition es un array con todas las posiciones de este scan donde
                // cabe un chunk de tama–o width.
                var fitHorizontalPositions= null;
                var foundPositionOnScan=    false;

                for( ; initialPosition<=this.scanMapHeight-height; initialPosition++ ) {
                    fitHorizontalPositions= this.scanMap[ initialPosition ].findWhereFits( width );

                    // si no es nulo el array de resultados, quiere decir que en alguno de los puntos
                    // nos cabe un trozo de tama–o width.
                    if ( null!==fitHorizontalPositions && fitHorizontalPositions.length>0 ) {
                        foundPositionOnScan= true;
                        break;
                    }
                }

                if ( foundPositionOnScan ) {
                    // j es el scan donde cabe un trozo de tama–o width.
                    // comprobamos desde este scan que en todos los scan verticales cabe el trozo.
                    // se comprueba que cabe en alguno de los tama–os que la rutina de busqueda horizontal
                    // nos ha devuelto antes.

                    var minInitialPosition=Number.MAX_VALUE;
                    for( j=0; j<fitHorizontalPositions.length; j++ ) {
                        var fits= true;
                        for( i=initialPosition; i<initialPosition+height; i++ ) {
                            // hay un trozo que no cabe
                            if ( !this.scanMap[i].fits( fitHorizontalPositions[j], width ) ) {
                                fits= false;
                                break;
                            }
                        }

                        // se ha encontrado un trozo donde la imagen entra.
                        // d.p.m. incluirla en posicion, y seguir con otra.
                        if ( fits ) {
                            return { x: fitHorizontalPositions[j], y: initialPosition };
                        } 
                    }

                    initialPosition++;
                } else {
                    // no hay sitio en ningun scan.
                    return null;
                }
            }

            // no se ha podido encontrar un area en la textura para un trozo de tama–o width*height
            return null;
        },
        substract : function( x,y, width, height ) {
            for( var i=0; i<height; i++ ) {
                if ( !this.scanMap[i+y].substract(x,width) ) {
                    CAAT.log('Error: removing chunk ',width,height,' at ',x,y);
                }
            }
        },
        log : function() {
            for( var i=0; i<this.scanMapHeight; i++ ) {
                this.scanMap[i].log(i);
            }
        }
    };
})();

(function() {
    CAAT.GLTexturePage= function(w,h) {
        this.width=         w || 1024;
        this.height=        h || 1024;
        this.images=        [];

        return this;
    };

    CAAT.GLTexturePage.prototype= {

        width:                  1024,
        height:                 1024,
        gl:                     null,
        texture:                null,
        allowImagesInvertion:   false,
        padding:                4,
        scan:                   null,
        images:                 null,
        criteria:               'area',

        initialize : function(gl) {
            this.gl= gl;
            this.texture = gl.createTexture();

            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.enable( gl.BLEND );
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            var uarr= new Uint8Array(this.width*this.height*4);
            for (var jj = 0; jj < 4*this.width*this.height; ) {
                uarr[jj++]=0;
                uarr[jj++]=0;
                uarr[jj++]=0;
                uarr[jj++]=0;
            }
            gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    this.width,
                    this.height,
                    0,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    uarr);

            gl.enable( gl.BLEND );

            for( var i=0; i<this.images.length; i++ ) {

                var img= this.images[i];
                if ( img.inverted ) {
                    img= CAAT.modules.ImageUtil.prototype.rotate( img, -90 );
                }

                gl.texSubImage2D(
                        gl.TEXTURE_2D,
                        0,
                        this.images[i].__tx, this.images[i].__ty,
                        gl.RGBA,
                        gl.UNSIGNED_BYTE,
                        img );
            }

        },
        create: function(imagesCache) {

            var images= [];
            for( var i=0; i<imagesCache.length; i++ ) {
                var img= imagesCache[i].image;
                images.push( img );
            }

            this.createFromImages(images);
        },
        clear : function() {
            this.createFromImages([]);
        },
        update : function(invert,padding,width,height) {
            this.allowImagesInvertion= invert;
            this.padding= padding;

            if ( width<100 ) {
                width= 100;
            }
            if ( height<100 ) {
                height= 100;
            }

            this.width=  width;
            this.height= height;
            
            this.createFromImages(this.images);
        },
        createFromImages : function( images ) {

            var i;

            this.scan=   new CAAT.GLTextureScanMap( this.width, this.height );
            this.images= [];

            if ( this.allowImagesInvertion ) {
                for( i=0; i<images.length; i++ ) {
                    images[i].inverted= this.allowImagesInvertion && images[i].height<images[i].width;
                }
            }

            var me= this;

            images.sort( function(a,b) {

                var aarea= a.width*a.height;
                var barea= b.width*b.height;

                if ( me.criteria==='width' ) {
                    return a.width<b.width ? 1 : a.width>b.width ? -1 : 0;
                } else if ( me.criteria==='height' ) {
                    return a.height<b.height ? 1 : a.height>b.height ? -1 : 0;
                }
                return aarea<barea ? 1 : aarea>barea ? -1 : 0;
            });

            for( i=0; i<images.length; i++ ) {
                var img=  images[i];
                this.packImage(img);
            }
        },
        addImage : function( image, invert, padding ) {
            this.allowImagesInvertion= invert;
            this.padding= padding;
            this.images.push(image);
            this.createFromImages(Array.prototype.slice.call(this.images));
        },
        endCreation : function() {
            var gl= this.gl;

//            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
//            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
            gl.generateMipmap(gl.TEXTURE_2D);
        },
        deletePage : function() {
            for( var i=0; i<this.images.length; i++ ) {
                delete this.images[i].__texturePage;
                delete this.images[i].__u;
                delete this.images[i].__v;
            }

            this.gl.deleteTexture( this.texture );
        },
        toCanvas : function(canvass, outline) {

            canvass= canvass || document.createElement('canvas');
            canvass.width= this.width;
            canvass.height= this.height;
            var ctxx= canvass.getContext('2d');
            ctxx.fillStyle= 'rgba(0,0,0,0)';
            ctxx.fillRect(0,0,this.width,this.height);

            for( var i=0; i<this.images.length; i++ ) {
                ctxx.drawImage(
                        !this.images[i].inverted ?
                                this.images[i] :
                                CAAT.modules.ImageUtil.prototype.rotate( this.images[i], 90 ),
                        this.images[i].__tx,
                        this.images[i].__ty );
                if ( outline ) {
                    ctxx.strokeStyle= 'red';
                    ctxx.strokeRect(
                            this.images[i].__tx,
                            this.images[i].__ty,
                            this.images[i].__w,
                            this.images[i].__h );
                }

                if ( this.images[i].__gridC && this.images[i].__gridR ) {
                    for( var t=0; t<this.images[i].__gridR; t++ ) {
                        for( var u=0; u<this.images[i].__gridC; u++ ) {
                            ctxx.strokeStyle= 'blue';
                            ctxx.strokeRect(
                                    this.images[i].__tx+ u*this.images[i].__w/this.images[i].__gridC,
                                    this.images[i].__ty+ t*this.images[i].__h/this.images[i].__gridR,
                                    this.images[i].__w/this.images[i].__gridC,
                                    this.images[i].__h/this.images[i].__gridR
                                    );
                        }
                    }
                }
            }


            if (outline) {
                ctxx.strokeStyle= 'red';
                ctxx.strokeRect(0,0,this.width,this.height);
            }

            return canvass;
        },
        packImage : function(img) {
            var newWidth, newHeight;
            if ( img.inverted ) {
                newWidth= img.height;
                newHeight= img.width;
            } else {
                newWidth= img.width;
                newHeight= img.height;
            }

            var w= newWidth;
            var h= newHeight;

            var mod;

            // dejamos un poco de espacio para que las texturas no se pisen.
            // coordenadas normalizadas 0..1 dan problemas cuando las texturas no est‡n
            // alineadas a posici—n mod 4,8...
            if ( w && this.padding ) {
                mod= this.padding;
//                mod= (w/this.padding)>>0;
//                if ( !mod ) {mod=this.padding;}
                if ( w+mod<=this.width ) {
                    w+=mod;
                }
            }
            if ( h && this.padding ) {
                mod= this.padding;
//                mod= (h/this.padding)>>0;
//                if ( !mod ) {mod=this.padding;}
                if ( h+mod<=this.height ) {
                    h+=mod;
                }
            }
            
            var where=  this.scan.whereFitsChunk( w, h );
            if ( null!==where ) {
                this.images.push( img );

                img.__tx= where.x;
                img.__ty= where.y;
                img.__u=  where.x / this.width;
                img.__v=  where.y / this.height;
                img.__u1= (where.x+newWidth) / this.width;
                img.__v1= (where.y+newHeight) / this.height;
                img.__texturePage= this;
                img.__w= newWidth;
                img.__h= newHeight;

                this.scan.substract(where.x,where.y,w,h);
            } else {
                CAAT.log('Imagen ',img.src,' de tama–o ',img.width,img.height,' no cabe.');
            }
        },
        changeHeuristic : function(criteria) {
            this.criteria= criteria;
        }
    };
})();

(function() {
    CAAT.GLTexturePageManager= function() {
        this.pages= [];
        return this;
    };

    CAAT.GLTexturePageManager.prototype= {

        pages:  null,
        createPages:    function(gl,width,height,imagesCache) {

            var end= false;
            while( !end ) {
                var page= new CAAT.GLTexturePage(width,height);
                page.create(imagesCache);
                page.initialize(gl);
                page.endCreation();
                this.pages.push(page);

                end= true;
                for( var i=0; i<imagesCache.length; i++ ) {
                    // imagen sin asociacion de textura
                    if ( !imagesCache[i].image.__texturePage ) {
                        // cabe en la pagina ?? continua con otras paginas.
                        if ( imagesCache[i].image.width<=width && imagesCache[i].height<=height ) {
                            end= false;
                        }
                        break;
                    }
                }
            }
        },
        deletePages : function() {
            for( var i=0; i<this.pages.length; i++ ) {
                this.pages[i].deletePage();
            }
            this.pages= null;
        }
    };

})();