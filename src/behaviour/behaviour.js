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
 *  + TODO: pathBehavior.
 *
 * 20101011 Hyperandroid
 *  + ScaleBehavior: if scaleX==0 || scaleY==0, FF3/4 will stop rendering.
 *
 **/


(function() {
	CAAT.Behavior= function() {
		this.listenerList=[];
		this.setDefaultInterpolator();
		return this;
	};
	
	CAAT.Behavior.prototype= {
			
		listenerList:		null,
		behaviorStartTime:	-1,
		behaviorDuration:	-1,
		cycleBehavior:		false,
		expired:			true,
		interpolator:		null,
        actor:              null,   // actor the Behavior acts on.

		setDefaultInterpolator : function() {
			this.interpolator= new CAAT.Interpolator().createLinearInterpolator(false);
		
		},
		setPingPong : function() {
			this.interpolator= new CAAT.Interpolator().createLinearInterpolator(true);
		},
		setFrameTime : function( startTime, duration ) {
			this.behaviorStartTime= 	startTime;
			this.behaviorDuration= 	duration;
			this.expired=				false;
		},
		setInterpolator : function(interpolator) {
			this.interpolator= interpolator;
		},
		apply : function(time, actor) {
		},
		setCycle : function(bool) {
			this.cycleBehavior= bool;
		},
		addListener : function( behaviorListener ) {
			this.listenerList.push(behaviorListener);
		},
		getStartTime : function() {
			return this.behaviorStartTime;
		},
		getDuration : function() {
			return this.behaviorDuration;
			
		},
		isBehaviorInTime : function(time,actor) {
			if ( this.expired )	{
				return false;
			}
			
			if ( this.cycleBehavior )	{
				if ( time>this.behaviorStartTime )	{
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
		fireBehaviorExpiredEvent : function(actor,time)	{
			for( var i=0; i<this.listenerList.length; i++ )	{
				this.listenerList[i].behaviorExpired(this,time,actor);
			}
		},
		normalizeTime : function(time)	{
			time= time-this.behaviorStartTime;
			if ( this.cycleBehavior )	{
				time%=this.behaviorDuration;
			}
			return this.interpolator.getPosition(time/this.behaviorDuration).y;
		},
		setExpired : function(actor,time) {
            // set for final interpolator value.
            this.expired= true;
			this.setForTime(this.interpolator.getPosition(1).y,actor);
			this.fireBehaviorExpiredEvent(actor,time);
		},
		setForTime : function( time, actor ) {
			
		},
        initialize : function(overrides) {
            if (overrides) {
               for (i in overrides) {
                  this[i] = overrides[i];
               }
            }

            return this;
        }
	};
})();

/**
 * El contenedor de comportamiento, no tiene interpolador de tiempo.
 * Se debe aplicar a cada comportamiento contenido.
 */
(function() {
	CAAT.ContainerBehavior= function() {
		CAAT.ContainerBehavior.superclass.constructor.call(this);
		this.behaviors= [];
		return this;
	};
	
	extend( CAAT.ContainerBehavior, CAAT.Behavior, {
		
		behaviors:	null,
		addBehavior : function(behavior)	{

			this.behaviors.push(behavior);
			behavior.addListener(this);
		},
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
		setInterpolator : function(path) {
		},
		behaviorExpired : function(behavior,time,actor) {
			if ( this.cycleBehavior )	{
				behavior.expired =  false;
			} else {
                this.fireBehaviorExpired( this, time, actor );
            }
		},
		setForTime : function(time, actor) {
			for( var i=0; i<this.behaviors.length; i++ ) {
				this.behaviors[i].setForTime( time, actor );
			}
		}
	});
})();

(function() {
	CAAT.RotateBehavior= function() {
		CAAT.RotateBehavior.superclass.constructor.call(this);
		this.anchor= CAAT.Actor.prototype.ANCHOR_CENTER;
		return this;
	};
	
	extend( CAAT.RotateBehavior, CAAT.Behavior, {
	
		minAngle:	0,
		maxAngle:	0,
		anchor:		0,
		
		apply : function(time, actor) {
			if ( this.isBehaviorInTime(time,actor) )	{
				time= this.normalizeTime(time);
				
				this.setForTime(time, actor);
			}
		},
		setForTime : function(time,actor) {
			var angle= 
				this.minAngle + time*(this.maxAngle-this.minAngle);
			
			var obj= actor.getAnchor( this.anchor );
			actor.setRotationAnchored(angle, obj.x, obj.y);
			
		}
		
	});
})();

(function() {
	CAAT.ScaleBehavior= function() {
		CAAT.RotateBehavior.superclass.constructor.call(this);
		this.anchor= CAAT.Actor.prototype.ANCHOR_CENTER;
		return this;		
	};
	
	extend( CAAT.ScaleBehavior, CAAT.Behavior, {
		minScaleX: 	0, 
		maxScaleX:	0,
		minScaleY:	0,
		maxScaleY:	0,
		anchor:		0,		
		
		apply : function(time, actor) {
			if ( this.isBehaviorInTime(time,actor) )	{
				time= this.normalizeTime(time);
				this.setForTime(time,actor);
			}
		},
		setForTime : function(time,actor) {

			var scaleX= this.minScaleX + time*(this.maxScaleX-this.minScaleX);
			var scaleY= this.minScaleY + time*(this.maxScaleY-this.minScaleY);

            // Firefox 3.x & 4, will crash animation if either scaleX or scaleY equals 0.
            if (0==scaleX ) {
                scaleX=.01;
            }
            if (0==scaleY ) {
                scaleY=.01;
            }

			actor.setScaleAnchored( scaleX, scaleY, this.anchor );			
		}
	});
})();

(function() {
	CAAT.AlphaBehavior= function() {
		CAAT.AlphaBehavior.superclass.constructor.call(this);
		return this;
	};
	
	extend( CAAT.AlphaBehavior, CAAT.Behavior, {
		startAlpha:	0,
		endAlpha:	0,

		apply : function( time, actor )	{
			if ( this.isBehaviorInTime(time,actor) )	{
				time= this.normalizeTime(time);
				this.setForTime( time, actor );
			}
		},
		setForTime : function(time,actor) {
			var alpha= 	(this.startAlpha + time*(this.endAlpha-this.startAlpha));
			actor.setAlpha( alpha );
		}		
	});
})();

/**
 * CAAT.PathBehavior
 *
 * autoRotate:  sets actor rotation to be heading from past to current path point.
 *              take into account that this will be incompatible with rotation Behaviors
 *              since they will set their own rotation configuration.
 *
 */
(function() {
	CAAT.PathBehavior= function() {
		CAAT.PathBehavior.superclass.constructor.call(this);
        this.onPath= this.innerPath;
		return this;
	};

	extend( CAAT.PathBehavior, CAAT.Behavior, {
		path:           null,
        autoRotate :    false,
        posInPath:      CAAT.Actor.prototype.ANCHOR_CENTER,
        prevX:          -1,
        prevY:          -1,

        outerPath:      1,
        innerPath:      2,
        middlePath:     3,

        onPath:         -1,

        mc:             null,

        setPath : function(path) {
            this.path= path;
            var contour= path.getContour();
            this.mc= new CAAT.Point();
            for( var i=0; i<contour.length; i++ ) {
                this.mc.x+= contour[i].x;
                this.mc.y+= contour[i].y;
            }
            this.mc.x/= contour.length;
            this.mc.y/= contour.length;
        },
        setFrameTime : function( startTime, duration ) {
            CAAT.PathBehavior.superclass.setFrameTime.call(this, startTime, duration );
            this.prevX= -1;
            this.prevY= -1;
        },
		apply : function( time, actor )	{
			if ( this.isBehaviorInTime(time,actor) )	{
				time= this.normalizeTime(time);
				this.setForTime( time, actor );
			}
		},
		setForTime : function(time,actor) {
            if ( this.autoRotate ) {

                var point= this.path.getPosition(time);

                if ( -1==this.prevX && -1==this.prevY )	{
                    this.prevX= point.x;
                    this.prevY= point.y;
                }

                var ax= point.x-this.prevX;
                var ay= point.y-this.prevY;

                if ( ax==0 && ay==0 ) {
                    return;
                }

                var angle= Math.atan2( ay, ax );

                if ( this.prevX<=point.x )	{
                    actor.transformation= CAAT.SpriteActor.prototype.TR_NONE;
                }
                else	{
                    actor.transformation= CAAT.SpriteActor.prototype.TR_FLIP_HORIZONTAL;
                    angle+=Math.PI;
                }

                actor.setRotation(angle);

                this.prevX= point.x;
                this.prevY= point.y;

                var modulo= Math.sqrt(ax*ax+ay*ay);
                ax/=modulo;
                ay/=modulo;

                actor.setLocation(
                        point.x - actor.width/2,  //- ay*actor.height/2,
                        point.y - actor.height/2 //+ ax*actor.height/2);
                );

            } else {
                var pointInPath= this.path.getPosition( time );
                if ( null!=actor ) {
                    actor.setLocation( pointInPath.x, pointInPath.y );
                }
            }

		},
        positionOnTime : function(time) {
			if ( this.isBehaviorInTime(time,null) )	{
				time= this.normalizeTime(time);
                return this.path.getPosition( time );
            }

            return {x:-1, y:-1};

        }
	});
})();
