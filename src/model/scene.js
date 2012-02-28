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
        },
        /**
         * Find a pointed actor at position point.
         * This method tries lo find the correctly pointed actor in two different ways.
         *  + first of all, if inputList is defined, it will look for an actor in it.
         *  + if no inputList is defined, it will traverse the scene graph trying to find a pointed actor.
         * @param point <CAAT.Point>
         */
        findActorAtPosition : function(point) {
            var i,j;

            var p= new CAAT.Point();

            if ( this.inputList ) {
                var il= this.inputList;
                for( i=0; i<il.length; i++ ) {
                    var ill= il[i];
                    for( j=0; j<ill.length; j++ ) {
                        p.set(point.x, point.y);
                        var modelViewMatrixI= ill[j].worldModelViewMatrix.getInverse();
                        modelViewMatrixI.transformCoord(p);
                        if ( ill[j].contains(p.x, p.y) ) {
                            return ill[j];
                        }
                    }
                }
            }

            p.set(point.x, point.y);
            return CAAT.Scene.superclass.findActorAtPosition.call(this,p);
        },

        /**
         * Enable a number of input lists.
         * These lists are set in case the developer doesn't want the to traverse the scene graph to find the pointed
         * actor. The lists are a shortcut whete the developer can set what actors to look for input at first instance.
         * The system will traverse the whole lists in order trying to find a pointed actor.
         *
         * Elements are added to each list either in head or tail.
         *
         * @param size <number> number of lists.
         */
        enableInputList : function( size ) {
            this.inputList= [];
            for( var i=0; i<size; i++ ) {
                this.inputList.push([]);
            }

            return this;
        },

        /**
         * Add an actor to a given inputList.
         * @param actor <CAAT.Actor> an actor instance
         * @param index <number> the inputList index to add the actor to. This value will be clamped to the number of
         * available lists.
         * @param position <number> the position on the selected inputList to add the actor at. This value will be
         * clamped to the number of available lists.
         */
        addActorToInputList : function( actor, index, position ) {
            if ( index<0 ) index=0; else if ( index>=this.inputList.length ) index= this.inputList.length-1;
            var il= this.inputList[index];

            if ( typeof position==="undefined" || position>=il.length ) {
                il.push( actor );
            } else if (position<=0) {
                il.unshift( actor );
            } else {
                il.splice( position, 0, actor );
            }

            return this;
        },

        /**
         * Remove all elements from an input list.
         * @param index <number> the inputList index to add the actor to. This value will be clamped to the number of
         * available lists so take care when emptying a non existant inputList index since you could end up emptying
         * an undesired input list.
         */
        emptyInputList : function( index ) {
            if ( index<0 ) index=0; else if ( index>=this.inputList.length ) index= this.inputList.length-1;
            this.inputList[index]= [];
            return this;
        },

        /**
         * remove an actor from a given input list index.
         * If no index is supplied, the actor will be removed from every input list.
         * @param actor <CAAT.Actor>
         * @param index <!number> an optional input list index. This value will be clamped to the number of
         * available lists.
         */
        removeActorFromInputList : function( actor, index ) {
            if ( typeof index==="undefined" ) {
                var i,j;
                for( i=0; i<this.inputList.length; i++ ) {
                    var il= this.inputList[i];
                    for( j=0; j<il.length; j++ ) {
                        if ( il[j]==actor ) {
                            il.splice( j,1 );
                        }
                    }
                }
                return this;
            }

            if ( index<0 ) index=0; else if ( index>=this.inputList.length ) index= this.inputList.length-1;
            var il= this.inputList[index];
            for( j=0; j<il.length; j++ ) {
                if ( il[j]==actor ) {
                    il.splice( j,1 );
                }
            }

            return this;
        }
	};

    extend( CAAT.Scene, CAAT.ActorContainer );
})();