/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
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
			this.behaviorDuration= 	duration;
            this.expired=			false;

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
         * Private.
         * Sets the behavior as expired.
         * This method must not be called directly. It is an auxiliary method to isBehaviorInTime method.
         * @param actor a CAAT.Actor instance.
         * @param time an integer with the scene time.
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

				for( var i=0; i<this.behaviors.length; i++ )	{
					this.behaviors[i].apply(time, actor);
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
/*            else {
                this.fireBehaviorExpiredEvent( actor, time );
            }*/
		},
        /**
         * Implementation method of the behavior.
         * Just call implementation method for its contained behaviors.
         * @param time an intenger indicating the time the behavior is being applied at.
         * @param actor a CAAT.Actor the behavior is being applied to.
         */
		setForTime : function(time, actor) {
			for( var i=0; i<this.behaviors.length; i++ ) {
				this.behaviors[i].setForTime( time, actor );
			}

            return null;
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
		anchor:		0,  // rotation anchor
        rx:         0,  // rotation center x.
        ry:         0,  // rotation center y.

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

            if ( this.anchor==CAAT.Actor.prototype.ANCHOR_CUSTOM ) {
                actor.setRotationAnchored(angle, this.rx, this.ry);
            } else {
			    var obj= actor.getAnchor( this.anchor );
			    actor.setRotationAnchored(angle, obj.x, obj.y);
            }

            return angle;
			
		},
        /**
         * Set behavior bound values.
         * @param startAngle a float indicating the starting angle.
         * @param endAngle a float indicating the ending angle.
         */
        setValues : function( startAngle, endAngle ) {
            this.startAngle= startAngle;
            this.endAngle= endAngle;
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
         * Set the behavior rotation anchor.
         * @see CAAT.Actor
         * @param anchor any of CAAT.Actor.prototype.ANCHOR_* constants.
         *
         * These parameters are to set a custom rotation anchor point. if <code>anchor==CAAT.Actor.prototype.ANCHOR_CUSTOM
         * </code> the custom rotation point is set.
         * @param rx
         * @param ry
         */
        setAnchor : function( anchor, rx, ry ) {
            this.anchor= anchor;
            if ( anchor==CAAT.Actor.prototype.ANCHOR_CUSTOM ) {
                this.rx= rx;
                this.ry= ry;
            }
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
		startScaleX: 	0,
		endScaleX:      0,
		startScaleY:	0,
		endScaleY:	    0,
		anchor:		    0,

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
            if (0==scaleX ) {
                scaleX=.01;
            }
            if (0==scaleY ) {
                scaleY=.01;
            }

			actor.setScaleAnchored( scaleX, scaleY, this.anchor );

            return { scaleX: scaleX, scaleY: scaleY };
		},
        /**
         * Define this scale behaviors values.
         *
         * @param startX {number} initial X axis scale value.
         * @param endX {number} final X axis scale value.
         * @param startY {number} initial Y axis scale value.
         * @param endY {number} final Y axis scale value.
         *
         * @return this.
         */
        setValues : function( startX, endX, startY, endY ) {
            this.startScaleX= startX;
            this.endScaleX=   endX;
            this.startScaleY= startY;
            this.endScaleY=   endY;

            return this;
        },
        /**
         * <p>
         * Defines scale application anchor.
         * <p>
         * Any of CAAT.Actor.ANCHOR_xxxx values.
         *
         * @param anchor {number} any of CAAT.Actor.ANCHOR_xxxx constant values.
         *
         * @return this.
         */
        setAnchor : function( anchor ) {
            this.anchor= anchor;
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
			var alpha= 	(this.startAlpha + time*(this.endAlpha-this.startAlpha));
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

	CAAT.PathBehavior.prototype= {
		path:           null,   // the path to traverse
        autoRotate :    false,  // set whether the actor must be rotated tangentially to the path.
        prevX:          -1,     // private, do not use.
        prevY:          -1,     // private, do not use.

        translateX:     0,
        translateY:     0,

        /**
         * Sets an actor rotation to be heading from past to current path's point.
         * Take into account that this will be incompatible with rotation Behaviors
         * since they will set their own rotation configuration.
         * @param autorotate {boolean}
         * @return this.
         */
        setAutoRotate : function( autorotate ) {
            this.autoRotate= autorotate;
            return this;
        },
        /**
         * Set the behavior path.
         * The path can be any length, and will take behaviorDuration time to be traversed.
         * @param {CAAT.Path}
         */
        setPath : function(path) {
            this.path= path;
            return this;
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

                if ( -1==this.prevX && -1==this.prevY )	{
                    this.prevX= point.x;
                    this.prevY= point.y;
                }

                var ax= point.x-this.prevX;
                var ay= point.y-this.prevY;

                if ( ax==0 && ay==0 ) {
                    actor.setLocation( point.x-this.translateX, point.y-this.translateY );
                    return { x: actor.x, y: actor.y };
                }

                var angle= Math.atan2( ay, ax );

                if ( this.prevX<=point.x )	{
                    //actor.transformation= CAAT.SpriteActor.prototype.TR_NONE;
                }
                else	{
                    //actor.transformation= CAAT.SpriteActor.prototype.TR_FLIP_HORIZONTAL;
                    //angle+=Math.PI;
                    
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
