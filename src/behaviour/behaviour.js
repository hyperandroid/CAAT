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

(function () {
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
    CAAT.Behavior = function () {
		this.lifecycleListenerList = [];
		this.setDefaultInterpolator();
		return this;
	};

    /**
     * @enum
     */
    CAAT.Behavior.Status = {
        NOT_STARTED:    0,
        STARTED:        1,
        EXPIRED:        2
    };

    var DefaultInterpolator = new CAAT.Interpolator().createLinearInterpolator(false);
    var DefaultPPInterpolator = new CAAT.Interpolator().createLinearInterpolator(true);

	CAAT.Behavior.prototype = {

		lifecycleListenerList: null,   // observer list.
		behaviorStartTime: -1,             // scene time to start applying the behavior
		behaviorDuration: -1,             // behavior duration in ms.
		cycleBehavior: false,          // apply forever ?

        status: CAAT.Behavior.NOT_STARTED,

		interpolator: null,           // behavior application function. linear by default.
        actor: null,           // actor the Behavior acts on.
        id: 0,              // an integer id suitable to identify this behavior by number.

        timeOffset: 0,

        doValueApplication: true,

        solved: true,

        discardable : false,    // is true, this behavior will be removed from the this.actor instance when it expires.

        setValueApplication: function (apply) {
            this.doValueApplication = apply;
            return this;
        },

        setTimeOffset: function (offset) {
            this.timeOffset = offset;
            return this;
        },

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
			this.interpolator= DefaultInterpolator;
            return this;
		},
        /**
         * Sets default interpolator to be linear from 0..1 and from 1..0.
         * @return this
         */
		setPingPong : function() {
			this.interpolator= DefaultPPInterpolator;
            return this;
		},

        /**
         *
         * @param status {CAAT.Behavior.Status}
         */
        setStatus : function(status) {
            this.status= status;
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
            this.setStatus( CAAT.Behavior.Status.NOT_STARTED );

            return this;
		},
        /**
         * Sets behavior start time and duration but instead as setFrameTime which sets initial time as absolute time
         * regarding scene's time, it uses a relative time offset from current scene time.
         * a call to
         *   setFrameTime( scene.time, duration ) is equivalent to
         *   setDelayTime( 0, duration )
         * @param delay {number}
         * @param duration {number}
         */
        setDelayTime : function( delay, duration ) {
            this.behaviorStartTime= delay;
            this.behaviorDuration=  duration;
            this.setStatus( CAAT.Behavior.Status.NOT_STARTED );
            this.solved= false;

            return this;

        },
        setOutOfFrameTime : function() {
            this.setStatus( CAAT.Behavior.Status.EXPIRED );
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

            if ( !this.solved ) {
                this.behaviorStartTime+= time;
                this.solved= true;
            }

            time+= this.timeOffset*this.behaviorDuration;

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

            var S= CAAT.Behavior.Status;

			if ( this.status===S.EXPIRED || this.behaviorStartTime<0 )	{
				return false;
			}
			
			if ( this.cycleBehavior )	{
				if ( time>=this.behaviorStartTime )	{
					time= (time-this.behaviorStartTime)%this.behaviorDuration + this.behaviorStartTime;
				}
			}
			
			if ( time>this.behaviorStartTime+this.behaviorDuration )	{
				if ( this.status!==S.EXPIRED )	{
					this.setExpired(actor,time);
				}
				
				return false;
			}

            if ( this.status===S.NOT_STARTED ) {
                this.status=S.STARTED;
                this.fireBehaviorStartedEvent(actor,time);
            }

			return this.behaviorStartTime<=time; // && time<this.behaviorStartTime+this.behaviorDuration;
		},

        fireBehaviorStartedEvent : function(actor,time) {
            for( var i= 0, l=this.lifecycleListenerList.length; i<l; i++ )	{
                var b=this.lifecycleListenerList[i];
                if ( b.behaviorStarted ) {
                    b.behaviorStarted(this,time,actor);
                }
            }
        },

        /**
         * Notify observers about expiration event.
         * @param actor a CAAT.Actor instance
         * @param time an integer with the scene time the behavior was expired at.
         */
        fireBehaviorExpiredEvent:function (actor, time) {
            for (var i = 0, l = this.lifecycleListenerList.length; i < l; i++) {
                var b=this.lifecycleListenerList[i];
                if (b.behaviorExpired) {
                    b.behaviorExpired(this, time, actor);
                }
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
            for( var i= 0, l=this.lifecycleListenerList.length; i<l; i++ )	{
                var b= this.lifecycleListenerList[i];
                if (b.behaviorApplied) {
                    b.behaviorApplied(this,time,normalizedTime,actor,value);
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
            this.status= CAAT.Behavior.Status.EXPIRED;
			this.setForTime(this.interpolator.getPosition(1).y,actor);
			this.fireBehaviorExpiredEvent(actor,time);

            if ( this.discardable ) {
                this.actor.removeBehavior( this );
            }
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
        },
        
        getPropertyName : function() {
            return "";
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
         * Proportionally change this container duration to its children.
         * @param duration {number} new duration in ms.
         * @return this;
         */
        conformToDuration : function( duration ) {
            this.duration= duration;
            
            var f= duration/this.duration;
            var bh;
            for( var i=0; i<this.behavior.length; i++ ) {
                bh= this.behavior[i];
                bh.setFrameTime( bh.getStartTime()*f, bh.getDuration()*f );
            }

            return this;
        },

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

            time+= this.timeOffset*this.behaviorDuration;
            
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
         * This method is the observer implementation for every contained behavior.
         * If a container is Cycle=true, won't allow its contained behaviors to be expired.
         * @param behavior a CAAT.Behavior instance which has been expired.
         * @param time an integer indicating the time at which has become expired.
         * @param actor a CAAT.Actor the expired behavior is being applied to.
         */
		behaviorExpired : function(behavior,time,actor) {
			if ( this.cycleBehavior )	{
                behavior.setStatus( CAAT.Behavior.Status.STARTED );
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
                if ( /*!bb.expired*/ bb.status!==CAAT.Behavior.Status.EXPIRED ) {
                    bb.setExpired(actor,time-this.behaviorStartTime);
                }
            }
            // already notified in base class.
            // this.fireBehaviorExpiredEvent(actor,time);
            return this;
        },

        setFrameTime : function( start, duration )  {
            CAAT.ContainerBehavior.superclass.setFrameTime.call(this,start,duration);

            var bh= this.behaviors;
            for( var i=0; i<bh.length; i++ ) {
                //bh[i].expired= false;
                bh[i].setStatus( CAAT.Behavior.Status.NOT_STARTED );
            }
            return this;
        },

        calculateKeyFrameData : function(referenceTime, prefix, prevValues )  {

            var i;
            var bh;

            var retValue= {};
            var time;
            var cssRuleValue;
            var cssProperty;
            var property;

            for( i=0; i<this.behaviors.length; i++ ) {
                bh= this.behaviors[i];
                if ( /*!bh.expired*/ bh.status!==CAAT.Behavior.Status.EXPIRED && !(bh instanceof CAAT.GenericBehavior) ) {

                    // ajustar tiempos:
                    //  time es tiempo normalizado a duracion de comportamiento contenedor.
                    //      1.- desnormalizar
                    time= referenceTime * this.behaviorDuration;

                    //      2.- calcular tiempo relativo de comportamiento respecto a contenedor
                    if ( bh.behaviorStartTime<=time && bh.behaviorStartTime+bh.behaviorDuration>=time ) {
                        //      3.- renormalizar tiempo reltivo a comportamiento.
                        time= (time-bh.behaviorStartTime)/bh.behaviorDuration;

                        //      4.- obtener valor de comportamiento para tiempo normalizado relativo a contenedor
                        cssRuleValue= bh.calculateKeyFrameData(time);
                        cssProperty= bh.getPropertyName(prefix);

                        if ( typeof retValue[cssProperty] ==='undefined' ) {
                            retValue[cssProperty]= "";
                        }

                        //      5.- asignar a objeto, par de propiedad/valor css
                        retValue[cssProperty]+= cssRuleValue+" ";
                    }

                }
            }


            var tr="";
            var pv;
            function xx(pr) {
                if ( retValue[pr] ) {
                    tr+= retValue[pr];
                } else {
                    if ( prevValues ) {
                        pv= prevValues[pr];
                        if ( pv ) {
                            tr+= pv;
                            retValue[pr]= pv;
                        }
                    }
                }

            }

            xx('translate');
            xx('rotate');
            xx('scale');

            var keyFrameRule= "";

            if ( tr ) {
                keyFrameRule='-'+prefix+'-transform: '+tr+';';
            }

            tr="";
            xx('opacity');
            if( tr ) {
                keyFrameRule+= ' opacity: '+tr+';';
            }

            return {
                rules: keyFrameRule,
                ret: retValue
            };

        },

        /**
         *
         * @param prefix
         * @param name
         * @param keyframessize
         */
        calculateKeyFramesData : function(prefix, name, keyframessize) {

            if ( this.duration===Number.MAX_VALUE ) {
                return "";
            }

            if ( typeof keyframessize==='undefined' ) {
                keyframessize=100;
            }

            var i;
            var prevValues= null;
            var kfd= "@-"+prefix+"-keyframes "+name+" {";
            var ret;
            var time;
            var kfr;

            for( i=0; i<=keyframessize; i++ )    {
                time= this.interpolator.getPosition(i/keyframessize).y;
                ret= this.calculateKeyFrameData(time, prefix, prevValues);
                kfr= "" +
                    (i/keyframessize*100) + "%" + // percentage
                    "{" + ret.rules + "}\n";

                prevValues= ret.ret;
                kfd+= kfr;
            }

            kfd+= "}";

            return kfd;
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

        getPropertyName : function() {
            return "rotate";
        },

        /**
         * Behavior application function.
         * Do not call directly.
         * @param time an integer indicating the application time.
         * @param actor a CAAT.Actor the behavior will be applied to.
         * @return the set angle.
         */
		setForTime : function(time,actor) {
			var angle= this.startAngle + time*(this.endAngle-this.startAngle);

            if ( this.doValueApplication ) {
                actor.setRotationAnchored(angle, this.anchorX, this.anchorY);
            }

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
        },


        calculateKeyFrameData : function( time ) {
            time= this.interpolator.getPosition(time).y;
            return "rotate(" + (this.startAngle + time*(this.endAngle-this.startAngle)) +"rad)";
        },

        /**
         * @param prefix {string} browser vendor prefix
         * @param name {string} keyframes animation name
         * @param keyframessize {integer} number of keyframes to generate
         * @override
         */
        calculateKeyFramesData : function(prefix, name, keyframessize) {

            if ( typeof keyframessize==='undefined' ) {
                keyframessize= 100;
            }
            keyframessize>>=0;

            var i;
            var kfr;
            var kfd= "@-"+prefix+"-keyframes "+name+" {";

            for( i=0; i<=keyframessize; i++ )    {
                kfr= "" +
                    (i/keyframessize*100) + "%" + // percentage
                    "{" +
                        "-"+prefix+"-transform:" + this.calculateKeyFrameData(i/keyframessize) +
                    "}\n";

                kfd+= kfr;
            }

            kfd+="}";

            return kfd;
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

        getPropertyName : function() {
            return "scale";
        },

        /**
         * Applies corresponding scale values for a given time.
         * 
         * @param time the time to apply the scale for.
         * @param actor the target actor to Scale.
         * @return {object} an object of the form <code>{ scaleX: {float}, scaleY: {float}�}</code>
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

            if ( this.doValueApplication ) {
			    actor.setScaleAnchored( scaleX, scaleY, this.anchorX, this.anchorY );
            }

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
        },

        calculateKeyFrameData : function( time ) {
            var scaleX;
            var scaleY;

            time= this.interpolator.getPosition(time).y;
            scaleX= this.startScaleX + time*(this.endScaleX-this.startScaleX);
            scaleY= this.startScaleY + time*(this.endScaleY-this.startScaleY);

            return "scaleX("+scaleX+") scaleY("+scaleY+")";
        },

        calculateKeyFramesData : function(prefix, name, keyframessize) {

            if ( typeof keyframessize==='undefined' ) {
                keyframessize= 100;
            }
            keyframessize>>=0;

            var i;
            var kfr;
            var kfd= "@-"+prefix+"-keyframes "+name+" {";

            for( i=0; i<=keyframessize; i++ )    {
                kfr= "" +
                    (i/keyframessize*100) + "%" + // percentage
                    "{" +
                        "-"+prefix+"-transform:" + this.calculateKeyFrameData(i/keyframessize) +
                    "}";

                kfd+= kfr;
            }

            kfd+="}";

            return kfd;
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

        getPropertyName : function() {
            return "opacity";
        },

        /**
         * Applies corresponding alpha transparency value for a given time.
         *
         * @param time the time to apply the scale for.
         * @param actor the target actor to set transparency for.
         * @return {number} the alpha value set. Normalized from 0 (total transparency) to 1 (total opacity)
         */
		setForTime : function(time,actor) {
            var alpha= (this.startAlpha+time*(this.endAlpha-this.startAlpha));
            if ( this.doValueApplication ) {
                actor.setAlpha( alpha );
            }
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
        },

        calculateKeyFrameData : function( time ) {
            time= this.interpolator.getPosition(time).y;
            return  (this.startAlpha+time*(this.endAlpha-this.startAlpha));
        },

        /**
         * @param prefix {string} browser vendor prefix
         * @param name {string} keyframes animation name
         * @param keyframessize {integer} number of keyframes to generate
         * @override
         */
        calculateKeyFramesData : function(prefix, name, keyframessize) {

            if ( typeof keyframessize==='undefined' ) {
                keyframessize= 100;
            }
            keyframessize>>=0;

            var i;
            var kfr;
            var kfd= "@-"+prefix+"-keyframes "+name+" {";

            for( i=0; i<=keyframessize; i++ )    {
                kfr= "" +
                    (i/keyframessize*100) + "%" + // percentage
                    "{" +
                         "opacity: " + this.calculateKeyFrameData( i / keyframessize ) +
                    "}";

                kfd+= kfr;
            }

            kfd+="}";

            return kfd;
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

        getPropertyName : function() {
            return "translate";
        },

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

        /**
         * @see Acotr.setPositionAcchor
         * @deprecated
         * @param tx a float with xoffset.
         * @param ty a float with yoffset.
         */
        setTranslation : function( tx, ty ) {
            return this;
        },

        calculateKeyFrameData : function( time ) {
            time= this.interpolator.getPosition(time).y;
            var point= this.path.getPosition(time);
            return "translateX("+point.x+"px) translateY("+point.y+"px)" ;
        },

        calculateKeyFramesData : function(prefix, name, keyframessize) {

            if ( typeof keyframessize==='undefined' ) {
                keyframessize= 100;
            }
            keyframessize>>=0;

            var i;
            var kfr;
            var time;
            var kfd= "@-"+prefix+"-keyframes "+name+" {";

            for( i=0; i<=keyframessize; i++ )    {
                kfr= "" +
                    (i/keyframessize*100) + "%" + // percentage
                    "{" +
                        "-"+prefix+"-transform:" + this.calculateKeyFrameData(i/keyframessize) +
                    "}";

                kfd+= kfr;
            }

            kfd+="}";

            return kfd;
        },

        /**
         * Translates the Actor to the corresponding time path position.
         * If autoRotate=true, the actor is rotated as well. The rotation anchor will (if set) always be ANCHOR_CENTER.
         * @param time an integer indicating the time the behavior is being applied at.
         * @param actor a CAAT.Actor instance to be translated.
         * @return {object} an object of the form <code>{ x: {float}, y: {float}�}</code>.
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
                    actor.setLocation( point.x, point.y );
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

            if ( this.doValueApplication ) {
                actor.setLocation( point.x, point.y );
                return { x: actor.x, y: actor.y };
            } else {
                return {
                    x: point.x,
                    y: point.y
                };
            }


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

    extend( CAAT.PathBehavior, CAAT.Behavior );
})();

(function() {

    /**
     * ColorBehavior interpolates between two given colors.
     * @constructor
     */
    CAAT.ColorBehavior= function() {
        return this;
    };

    CAAT.ColorBehavior.prototype= {

    };

    extend( CAAT.ColorBehavior, CAAT.Behavior );

})();

(function() {

    /**
     *
     * Scale only X or Y axis, instead both at the same time as ScaleBehavior.
     *
     * @constructor
     */
    CAAT.Scale1Behavior= function() {
		CAAT.Scale1Behavior.superclass.constructor.call(this);
		this.anchor= CAAT.Actor.prototype.ANCHOR_CENTER;
		return this;
	};

    var AXIS_X= 0;
    var AXIS_Y= 1;

    CAAT.Scale1Behavior.AXIS_X= AXIS_X;
    CAAT.Scale1Behavior.AXIS_Y= AXIS_Y;

	CAAT.Scale1Behavior.prototype= {
        startScale: 1,
        endScale:   1,
        anchorX:    .50,
        anchorY:    .50,

        sx          : 1,
        sy          : 1,

        applyOnX    : true,

        applyOnAxis : function( axis ) {
            if ( axis === AXIS_Y ) {
                this.applyOnX= false;
            } else {
                this.applyOnX= true;
            }
        },

        getPropertyName : function() {
            return "scale";
        },

        /**
         * Applies corresponding scale values for a given time.
         *
         * @param time the time to apply the scale for.
         * @param actor the target actor to Scale.
         * @return {object} an object of the form <code>{ scaleX: {float}, scaleY: {float}�}</code>
         */
		setForTime : function(time,actor) {

			var scale= this.startScale + time*(this.endScale-this.startScale);

            // Firefox 3.x & 4, will crash animation if either scaleX or scaleY equals 0.
            if (0===scale ) {
                scale=0.01;
            }

            if ( this.doValueApplication ) {
                if ( this.applyOnX ) {
			        actor.setScaleAnchored( scale, actor.scaleY, this.anchorX, this.anchorY );
                } else {
                    actor.setScaleAnchored( actor.scaleX, scale, this.anchorX, this.anchorY );
                }
            }

            return scale;
		},
        /**
         * Define this scale behaviors values.
         *
         * Be aware the anchor values are supplied in <b>RELATIVE PERCENT</b> to
         * actor's size.
         *
         * @param start {number} initial X axis scale value.
         * @param end {number} final X axis scale value.
         * @param anchorx {float} the percent position for anchorX
         * @param anchory {float} the percent position for anchorY
         *
         * @return this.
         */
        setValues : function( start, end, applyOnX, anchorx, anchory ) {
            this.startScale= start;
            this.endScale=   end;
            this.applyOnX=   !!applyOnX;

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
        },

        calculateKeyFrameData : function( time ) {
            var scale;

            time= this.interpolator.getPosition(time).y;
            scale= this.startScale + time*(this.endScale-this.startScale);

            return this.applyOnX ? "scaleX("+scale+")" : "scaleY("+scale+")";
        },

        calculateKeyFramesData : function(prefix, name, keyframessize) {

            if ( typeof keyframessize==='undefined' ) {
                keyframessize= 100;
            }
            keyframessize>>=0;

            var i;
            var kfr;
            var kfd= "@-"+prefix+"-keyframes "+name+" {";

            for( i=0; i<=keyframessize; i++ )    {
                kfr= "" +
                    (i/keyframessize*100) + "%" + // percentage
                    "{" +
                        "-"+prefix+"-transform:" + this.calculateKeyFrameData(i/keyframessize) +
                    "}";

                kfd+= kfr;
            }

            kfd+="}";

            return kfd;
        }
    };

    extend( CAAT.Scale1Behavior, CAAT.Behavior );
})();
