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
 *  + ScaleBehavior:   takes control of scaling on x and y axis affine transform.
 *  + Scale1Behavior:  takes control of scaling on x or y axis affine transform.
 *  + PathBehavior:    takes control of translating an Actor/ActorContainer across a path [ie. pathSegment collection].
 *  + GenericBehavior: applies a behavior to any given target object's property, or notifies a callback.
 *
 *
 **/

CAAT.Module({
    defines:        "CAAT.Behavior.BaseBehavior",
    constants:      {
        Status: {
            NOT_STARTED: 0,
            STARTED:    1,
            EXPIRED:    2
        }
    },
    depends:        ["CAAT.Behavior.Interpolator"],
    extendsWith:   function() {

        var DefaultInterpolator=    new CAAT.Behavior.Interpolator().createLinearInterpolator(false);
        var DefaultInterpolatorPP=  new CAAT.Behavior.Interpolator().createLinearInterpolator(true);

        return {
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
            __init:function () {
                this.lifecycleListenerList = [];
                this.setDefaultInterpolator();
                return this;
            },

            lifecycleListenerList:null, // observer list.
            behaviorStartTime:-1, // scene time to start applying the behavior
            behaviorDuration:-1, // behavior duration in ms.
            cycleBehavior:false, // apply forever ?

            status: CAAT.Behavior.BaseBehavior.Status.NOT_STARTED, // Status.NOT_STARTED

            interpolator:null, // behavior application function. linear by default.
            actor:null, // actor the Behavior acts on.
            id:0, // an integer id suitable to identify this behavior by number.

            timeOffset:0,

            doValueApplication:true,

            solved:true,

            discardable:false, // is true, this behavior will be removed from the this.actor instance when it expires.

            setValueApplication:function (apply) {
                this.doValueApplication = apply;
                return this;
            },

            setTimeOffset:function (offset) {
                this.timeOffset = offset;
                return this;
            },

            setStatus : function(st) {
                this.status= st;
                return this;
            },

            /**
             * Sets this behavior id.
             * @param id an integer.
             *
             */
            setId:function (id) {
                this.id = id;
                return this;
            },
            /**
             * Sets the default interpolator to a linear ramp, that is, behavior will be applied linearly.
             * @return this
             */
            setDefaultInterpolator:function () {
                this.interpolator = DefaultInterpolator;
                return this;
            },
            /**
             * Sets default interpolator to be linear from 0..1 and from 1..0.
             * @return this
             */
            setPingPong:function () {
                this.interpolator = DefaultInterpolatorPP;
                return this;
            },

            /**
             * Sets behavior start time and duration.
             * Scene time will be the time of the scene the behavior actor is bound to.
             * @param startTime {number} an integer indicating behavior start time in scene time in ms..
             * @param duration {number} an integer indicating behavior duration in ms.
             */
            setFrameTime:function (startTime, duration) {
                this.behaviorStartTime = startTime;
                this.behaviorDuration = duration;
                this.status =CAAT.Behavior.BaseBehavior.Status.NOT_STARTED;

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
            setDelayTime:function (delay, duration) {
                this.behaviorStartTime = delay;
                this.behaviorDuration = duration;
                this.status =CAAT.Behavior.BaseBehavior.Status.NOT_STARTED;
                this.solved = false;

                return this;

            },
            setOutOfFrameTime:function () {
                this.status =CAAT.Behavior.BaseBehavior.Status.EXPIRED;
                this.behaviorStartTime = Number.MAX_VALUE;
                this.behaviorDuration = 0;
                return this;
            },
            /**
             * Changes behavior default interpolator to another instance of CAAT.Interpolator.
             * If the behavior is not defined by CAAT.Interpolator factory methods, the interpolation function must return
             * its values in the range 0..1. The behavior will only apply for such value range.
             * @param interpolator a CAAT.Interpolator instance.
             */
            setInterpolator:function (interpolator) {
                this.interpolator = interpolator;
                return this;
            },
            /**
             * This method must no be called directly.
             * The director loop will call this method in orther to apply actor behaviors.
             * @param time the scene time the behaviro is being applied at.
             * @param actor a CAAT.Actor instance the behavior is being applied to.
             */
            apply:function (time, actor) {

                if (!this.solved) {
                    this.behaviorStartTime += time;
                    this.solved = true;
                }

                time += this.timeOffset * this.behaviorDuration;

                var orgTime = time;
                if (this.isBehaviorInTime(time, actor)) {
                    time = this.normalizeTime(time);
                    this.fireBehaviorAppliedEvent(
                        actor,
                        orgTime,
                        time,
                        this.setForTime(time, actor));
                }
            },

            /**
             * Sets the behavior to cycle, ie apply forever.
             * @param bool a boolean indicating whether the behavior is cycle.
             */
            setCycle:function (bool) {
                this.cycleBehavior = bool;
                return this;
            },
            /**
             * Adds an observer to this behavior.
             * @param behaviorListener an observer instance.
             */
            addListener:function (behaviorListener) {
                this.lifecycleListenerList.push(behaviorListener);
                return this;
            },
            /**
             * Remove all registered listeners to the behavior.
             */
            emptyListenerList:function () {
                this.lifecycleListenerList = [];
                return this;
            },
            /**
             * @return an integer indicating the behavior start time in ms..
             */
            getStartTime:function () {
                return this.behaviorStartTime;
            },
            /**
             * @return an integer indicating the behavior duration time in ms.
             */
            getDuration:function () {
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
            isBehaviorInTime:function (time, actor) {

                var st= CAAT.Behavior.BaseBehavior.Status;

                if (this.status === st.EXPIRED || this.behaviorStartTime < 0) {
                    return false;
                }

                if (this.cycleBehavior) {
                    if (time >= this.behaviorStartTime) {
                        time = (time - this.behaviorStartTime) % this.behaviorDuration + this.behaviorStartTime;
                    }
                }

                if (time > this.behaviorStartTime + this.behaviorDuration) {
                    if (this.status !== st.EXPIRED) {
                        this.setExpired(actor, time);
                    }

                    return false;
                }

                if (this.status === st.NOT_STARTED) {
                    this.status = st.STARTED;
                    this.fireBehaviorStartedEvent(actor, time);
                }

                return this.behaviorStartTime <= time; // && time<this.behaviorStartTime+this.behaviorDuration;
            },

            fireBehaviorStartedEvent:function (actor, time) {
                for (var i = 0, l = this.lifecycleListenerList.length; i < l; i++) {
                    var b = this.lifecycleListenerList[i];
                    if (b.behaviorStarted) {
                        b.behaviorStarted(this, time, actor);
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
                    var b = this.lifecycleListenerList[i];
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
            fireBehaviorAppliedEvent:function (actor, time, normalizedTime, value) {
                for (var i = 0, l = this.lifecycleListenerList.length; i < l; i++) {
                    var b = this.lifecycleListenerList[i];
                    if (b.behaviorApplied) {
                        b.behaviorApplied(this, time, normalizedTime, actor, value);
                    }
                }
            },
            /**
             * Convert scene time into something more manageable for the behavior.
             * behaviorStartTime will be 0 and behaviorStartTime+behaviorDuration will be 1.
             * the time parameter will be proportional to those values.
             * @param time the scene time to be normalized. an integer.
             */
            normalizeTime:function (time) {
                time = time - this.behaviorStartTime;
                if (this.cycleBehavior) {
                    time %= this.behaviorDuration;
                }

                return this.interpolator.getPosition(time / this.behaviorDuration).y;
            },
            /**
             * Sets the behavior as expired.
             * This method must not be called directly. It is an auxiliary method to isBehaviorInTime method.
             * @param actor {CAAT.Actor}
             * @param time {integer} the scene time.
             *
             * @private
             */
            setExpired:function (actor, time) {
                // set for final interpolator value.
                this.status = CAAT.Behavior.BaseBehavior.Status.EXPIRED;
                this.setForTime(this.interpolator.getPosition(1).y, actor);
                this.fireBehaviorExpiredEvent(actor, time);

                if (this.discardable) {
                    this.actor.removeBehavior(this);
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
            setForTime:function (time, actor) {

            },
            /**
             * @param overrides
             */
            initialize:function (overrides) {
                if (overrides) {
                    for (var i in overrides) {
                        this[i] = overrides[i];
                    }
                }

                return this;
            },

            getPropertyName:function () {
                return "";
            }
        }
    }
});



