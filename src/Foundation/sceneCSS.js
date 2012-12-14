/**
 * See LICENSE file.
 *
 */

CAAT.Module({
    defines:"CAAT.Foundation.Scene",
    depends:[
        "CAAT.Math.Point",
        "CAAT.Math.Matrix",
        "CAAT.PathUtil.Path",
        "CAAT.Behavior.GenericBehavior",
        "CAAT.Behavior.ContainerBehavior",
        "CAAT.Behavior.ScaleBehavior",
        "CAAT.Behavior.AlphaBehavior",
        "CAAT.Behavior.RotateBehavior",
        "CAAT.Behavior.PathBehavior",
        "CAAT.Foundation.ActorContainer",
        "CAAT.Foundation.Timer.TimerManager"
    ],
    aliases:["CAAT.Scene"],
    extendsClass:"CAAT.Foundation.ActorContainer",
    constants:{
        EASE_ROTATION:1, // Constant values to identify the type of Scene transition
        EASE_SCALE:2, // to perform on Scene switching by the Director.
        EASE_TRANSLATE:3
    },
    extendsWith:function () {
        return {


            __init:function () {
                this.__super();
                this.timerList = [];
                this.style('overflow', 'hidden');
                return this;
            },

            easeContainerBehaviour:null, // Behavior container used uniquely for Scene switching.
            easeContainerBehaviourListener:null, // who to notify about container behaviour events. Array.
            easeIn:false, // When Scene switching, this boolean identifies whether the
            // Scene is being brought in, or taken away.
            /**
             * @deprecated
             */
            EASE_ROTATION:1, // Constant values to identify the type of Scene transition
            /**
             * @deprecated
             */
            EASE_SCALE:2, // to perform on Scene switching by the Director.
            /**
             * @deprecated
             */
            EASE_TRANSLATE:3,

            timerList:null, // collection of CAAT.TimerTask objects.
            timerSequence:0, // incremental CAAT.TimerTask id.

            paused:false,

            isPaused:function () {
                return this.paused;
            },

            setPaused:function (paused) {
                this.paused = paused;
            },

            /**
             * Check and apply timers in frame time.
             * @param time {number} the current Scene time.
             */
            checkTimers:function (time) {
                var i = this.timerList.length - 1;
                while (i >= 0) {
                    if (!this.timerList[i].remove) {
                        this.timerList[i].checkTask(time);
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
            ensureTimerTask:function (timertask) {
                if (!this.hasTimer(timertask)) {
                    this.timerList.push(timertask);
                }
                return this;
            },
            /**
             * Check whether the timertask is in this scene's timer task list.
             * @param timertask {CAAT.TimerTask} a CAAT.TimerTask object.
             * @return {boolean} a boolean indicating whether the timertask is in this scene or not.
             */
            hasTimer:function (timertask) {
                var i = this.timerList.length - 1;
                while (i >= 0) {
                    if (this.timerList[i] === timertask) {
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
            createTimer:function (startTime, duration, callback_timeout, callback_tick, callback_cancel) {

                var tt = new CAAT.TimerTask().create(
                    startTime,
                    duration,
                    callback_timeout,
                    callback_tick,
                    callback_cancel);

                tt.taskId = this.timerSequence++;
                tt.sceneTime = this.time;
                tt.scene = this;

                this.timerList.push(tt);

                return tt;
            },
            /**
             * Removes expired timers. This method must not be called directly.
             */
            removeExpiredTimers:function () {
                var i;
                for (i = 0; i < this.timerList.length; i++) {
                    if (this.timerList[i].remove) {
                        this.timerList.splice(i, 1);
                    }
                }
            },
            /**
             * Scene animation method.
             * It extendsClass Container's base behavior by adding timer control.
             * @param director {CAAT.Director} a CAAT.Director instance.
             * @param time {number} an integer indicating the Scene time the animation is being performed at.
             */
//            animate:function (director, time) {
//                this.checkTimers(time);
//                CAAT.Scene.superclass.animate.call(this, director, time);
//                this.removeExpiredTimers();
//            },
            /**
             * Helper method to manage alpha transparency fading on Scene switch by the Director.
             * @param time {number} integer indicating the time in milliseconds the fading will take.
             * @param isIn {boolean} boolean indicating whether this Scene in the switch process is
             * being brought in.
             *
             * @private
             */
            createAlphaBehaviour:function (time, isIn) {
                var ab = new CAAT.AlphaBehavior();
                ab.setFrameTime(0, time);
                ab.startAlpha = isIn ? 0 : 1;
                ab.endAlpha = isIn ? 1 : 0;
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
            easeTranslationIn:function (time, alpha, anchor, interpolator) {
                this.easeTranslation(time, alpha, anchor, true, interpolator);
            },
            /**
             * Called from CAAT.Director to bring in an Scene.
             * A helper method for easeTranslation.
             * @param time integer indicating time in milliseconds for the Scene to be taken away.
             * @param alpha boolean indicating whether fading will be applied to the Scene.
             * @param anchor integer indicating the Scene switch anchor.
             * @param interpolator CAAT.Interpolator to apply to the Scene transition.
             */
            easeTranslationOut:function (time, alpha, anchor, interpolator) {
                this.easeTranslation(time, alpha, anchor, false, interpolator);
            },
            /**
             * This method will setup Scene behaviours to switch an Scene via a translation.
             * The anchor value can only be
             *  <li>CAAT.Actor.ANCHOR_LEFT
             *  <li>CAAT.Actor.ANCHOR_RIGHT
             *  <li>CAAT.Actor.ANCHOR_TOP
             *  <li>CAAT.Actor.ANCHOR_BOTTOM
             * if any other value is specified, any of the previous ones will be applied.
             *
             * @param time integer indicating time in milliseconds for the Scene.
             * @param alpha boolean indicating whether fading will be applied to the Scene.
             * @param anchor integer indicating the Scene switch anchor.
             * @param isIn boolean indicating whether the scene will be brought in.
             * @param interpolator {CAAT.Interpolator} a CAAT.Interpolator to apply to the Scene transition.
             */
            easeTranslation:function (time, alpha, anchor, isIn, interpolator) {

                this.easeContainerBehaviour = new CAAT.Behavior.ContainerBehavior();
                this.easeIn = isIn;

                var pb = new CAAT.Behavior.PathBehavior();
                if (interpolator) {
                    pb.setInterpolator(interpolator);
                }

                pb.setFrameTime(0, time);

                // BUGBUG anchors: 1..4
                if (anchor < 1) {
                    anchor = 1;
                } else if (anchor > 4) {
                    anchor = 4;
                }


                switch (anchor) {
                    case CAAT.Foundation.Actor.ANCHOR_TOP:
                        if (isIn) {
                            pb.setPath(new CAAT.Path().setLinear(0, -this.height, 0, 0));
                        } else {
                            pb.setPath(new CAAT.Path().setLinear(0, 0, 0, -this.height));
                        }
                        break;
                    case CAAT.Foundation.Actor.ANCHOR_BOTTOM:
                        if (isIn) {
                            pb.setPath(new CAAT.Path().setLinear(0, this.height, 0, 0));
                        } else {
                            pb.setPath(new CAAT.Path().setLinear(0, 0, 0, this.height));
                        }
                        break;
                    case CAAT.Foundation.Actor.ANCHOR_LEFT:
                        if (isIn) {
                            pb.setPath(new CAAT.Path().setLinear(-this.width, 0, 0, 0));
                        } else {
                            pb.setPath(new CAAT.Path().setLinear(0, 0, -this.width, 0));
                        }
                        break;
                    case CAAT.Foundation.Actor.ANCHOR_RIGHT:
                        if (isIn) {
                            pb.setPath(new CAAT.Path().setLinear(this.width, 0, 0, 0));
                        } else {
                            pb.setPath(new CAAT.Path().setLinear(0, 0, this.width, 0));
                        }
                        break;
                }

                if (alpha) {
                    this.createAlphaBehaviour(time, isIn);
                }

                this.easeContainerBehaviour.addBehavior(pb);

                this.easeContainerBehaviour.setFrameTime(this.time, time);
                this.easeContainerBehaviour.addListener(this);

                var start = pb.path.startCurvePosition();
                this.setLocation(start.x, start.y);

                this.emptyBehaviorList();
                CAAT.Scene.superclass.addBehavior.call(this, this.easeContainerBehaviour);
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
            easeScaleIn:function (starttime, time, alpha, anchor, interpolator) {
                this.easeScale(starttime, time, alpha, anchor, true, interpolator);
                this.easeIn = true;
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
            easeScaleOut:function (starttime, time, alpha, anchor, interpolator) {
                this.easeScale(starttime, time, alpha, anchor, false, interpolator);
                this.easeIn = false;
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
            easeScale:function (starttime, time, alpha, anchor, isIn, interpolator) {
                this.easeContainerBehaviour = new CAAT.ContainerBehavior();

                var x = 0;
                var y = 0;
                var x2 = 0;
                var y2 = 0;

                switch (anchor) {
                    case CAAT.Foundation.Actor.ANCHOR_TOP_LEFT:
                    case CAAT.Foundation.Actor.ANCHOR_TOP_RIGHT:
                    case CAAT.Foundation.Actor.ANCHOR_BOTTOM_LEFT:
                    case CAAT.Foundation.Actor.ANCHOR_BOTTOM_RIGHT:
                    case CAAT.Foundation.Actor.ANCHOR_CENTER:
                        x2 = 1;
                        y2 = 1;
                        break;
                    case CAAT.Foundation.Actor.ANCHOR_TOP:
                    case CAAT.Foundation.Actor.ANCHOR_BOTTOM:
                        x = 1;
                        x2 = 1;
                        y = 0;
                        y2 = 1;
                        break;
                    case CAAT.Foundation.Actor.ANCHOR_LEFT:
                    case CAAT.Foundation.Actor.ANCHOR_RIGHT:
                        y = 1;
                        y2 = 1;
                        x = 0;
                        x2 = 1;
                        break;
                    default:
                        alert('scale anchor ?? ' + anchor);
                }

                if (!isIn) {
                    var tmp;
                    tmp = x;
                    x = x2;
                    x2 = tmp;

                    tmp = y;
                    y = y2;
                    y2 = tmp;
                }

                if (alpha) {
                    this.createAlphaBehaviour(time, isIn);
                }

                var anchorPercent = this.getAnchorPercent(anchor);
                var sb = new CAAT.ScaleBehavior().
                    setFrameTime(starttime, time).
                    setValues(x, x2, y, y2, anchorPercent.x, anchorPercent.y);

                if (interpolator) {
                    sb.setInterpolator(interpolator);
                }

                this.easeContainerBehaviour.addBehavior(sb);
                this.easeContainerBehaviour.setFrameTime(this.time, time);
                this.easeContainerBehaviour.addListener(this);

                this.emptyBehaviorList();
                CAAT.Scene.superclass.addBehavior.call(this, this.easeContainerBehaviour);
            },
            /**
             * Overriden method to disallow default behavior.
             * Do not use directly.
             */
            addBehavior:function (behaviour) {
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
            easeRotationIn:function (time, alpha, anchor, interpolator) {
                this.easeRotation(time, alpha, anchor, true, interpolator);
                this.easeIn = true;
            },
            /**
             * Called from CAAT.Director to use Rotations for taking Scenes away.
             * This method is a Helper for the method easeRotation.
             * @param time integer indicating time in milliseconds for the Scene to be taken away.
             * @param alpha boolean indicating whether fading will be applied to the Scene.
             * @param anchor integer indicating the Scene switch anchor.
             * @param interpolator {CAAT.Interpolator} a CAAT.Interpolator to apply to the Scene transition.
             */
            easeRotationOut:function (time, alpha, anchor, interpolator) {
                this.easeRotation(time, alpha, anchor, false, interpolator);
                this.easeIn = false;
            },
            /**
             * Called from CAAT.Director to use Rotations for taking away or bringing Scenes in.
             * @param time integer indicating time in milliseconds for the Scene to be taken away or brought in.
             * @param alpha boolean indicating whether fading will be applied to the Scene.
             * @param anchor integer indicating the Scene switch anchor.
             * @param interpolator {CAAT.Interpolator} a CAAT.Interpolator to apply to the Scene transition.
             * @param isIn boolean indicating whehter the Scene is brought in.
             */
            easeRotation:function (time, alpha, anchor, isIn, interpolator) {
                this.easeContainerBehaviour = new CAAT.Behavior.ContainerBehavior();

                var start = 0;
                var end = 0;

                if (anchor == CAAT.Foundation.Actor.ANCHOR_CENTER) {
                    anchor = CAAT.Foundation.Actor.ANCHOR_TOP;
                }

                switch (anchor) {
                    case CAAT.Foundation.Actor.ANCHOR_TOP:
                    case CAAT.Foundation.Actor.ANCHOR_BOTTOM:
                    case CAAT.Foundation.Actor.ANCHOR_LEFT:
                    case CAAT.Foundation.Actor.ANCHOR_RIGHT:
                        start = Math.PI * (Math.random() < 0.5 ? 1 : -1);
                        break;
                    case CAAT.Foundation.Actor.ANCHOR_TOP_LEFT:
                    case CAAT.Foundation.Actor.ANCHOR_TOP_RIGHT:
                    case CAAT.Foundation.Actor.ANCHOR_BOTTOM_LEFT:
                    case CAAT.Foundation.Actor.ANCHOR_BOTTOM_RIGHT:
                        start = Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1);
                        break;
                    default:
                        alert('rot anchor ?? ' + anchor);
                }

                if (false === isIn) {
                    var tmp = start;
                    start = end;
                    end = tmp;
                }

                if (alpha) {
                    this.createAlphaBehaviour(time, isIn);
                }

                var anchorPercent = this.getAnchorPercent(anchor);
                var rb = new CAAT.Behavior.RotateBehavior().
                    setFrameTime(0, time).
                    setValues(start, end, anchorPercent.x, anchorPercent.y);

                if (interpolator) {
                    rb.setInterpolator(interpolator);
                }
                this.easeContainerBehaviour.addBehavior(rb);


                this.easeContainerBehaviour.setFrameTime(this.time, time);
                this.easeContainerBehaviour.addListener(this);

                this.emptyBehaviorList();
                CAAT.Foundation.Scene.superclass.addBehavior.call(this, this.easeContainerBehaviour);
            },
            /**
             * Registers a listener for listen for transitions events.
             * Al least, the Director registers himself as Scene easing transition listener.
             * When the transition is done, it restores the Scene's capability of receiving events.
             * @param listener {function(caat_behavior,time,actor)} an object which contains a method of the form <code>
             * behaviorExpired( caat_behaviour, time, actor);
             */
            setEaseListener:function (listener) {
                this.easeContainerBehaviourListener = listener;
            },
            /**
             * Private.
             * listener for the Scene's easeContainerBehaviour.
             * @param actor
             */
            behaviorExpired:function (actor) {
                this.easeContainerBehaviourListener.easeEnd(this, this.easeIn);
            },
            /**
             * This method should be overriden in case the developer wants to do some special actions when
             * the scene has just been brought in.
             */
            activated:function () {
            },
            /**
             * Scenes, do not expire the same way Actors do.
             * It simply will be set expired=true, but the frameTime won't be modified.
             * WARN: the parameter here is treated as boolean, not number.
             */
            setExpired:function (bExpired) {
                this.expired = bExpired;
                this.style('display', bExpired ? 'none' : 'block');
            },
            /**
             * An scene by default does not paint anything because has not fillStyle set.
             * @param director
             * @param time
             */
            paint:function (director, time) {
            },

            getIn : function( out_scene ) {

            },

            goOut : function( in_scene ) {

            }
        }
    }
});