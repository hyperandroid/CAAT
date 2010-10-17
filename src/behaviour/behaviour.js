/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * Behaviours are keyframing elements.
 * By using a BehaviourContainer, you can specify different actions on any animation Actor.
 * An undefined number of behaviours can be defined for each Actor.
 *
 * There're the following behaviours:
 *  + AlphaBehaviour:   controls container/actor global alpha.
 *  + RotateBehaviour:  takes control of rotation affine transform.
 *  + ScaleBehaviour:   takes control of scaling on x/y axis affine transform.
 *  + TODO: pathBehaviour.
 *
 * 20101011 Hyperandroid
 *  + ScaleBehaviour: if scaleX==0 || scaleY==0, FF3/4 will stop rendering.
 *
 **/


(function() {
	CAAT.Behaviour= function() {
		this.listenerList=[];
		this.setDefaultInterpolator();
		return this;
	};
	
	CAAT.Behaviour.prototype= {
			
		listenerList:		null,
		behaviourStartTime:	-1,
		behaviourDuration:	-1,
		cycleBehaviour:		false,
		expired:			true,
		interpolator:		null,
        actor:              null,   // actor the behaviour acts on.

		setDefaultInterpolator : function() {
			this.interpolator= new CAAT.Interpolator().createLinearInterpolator(false);
		
		},
		setPingPong : function() {
			this.interpolator= new CAAT.Interpolator().createLinearInterpolator(true);
		},
		setFrameTime : function( startTime, duration ) {
			this.behaviourStartTime= 	startTime;
			this.behaviourDuration= 	duration;
			this.expired=				false;
		},
		setInterpolator : function(interpolator) {
			this.interpolator= interpolator;
		},
		apply : function(time, actor) {
		},
		setCycle : function(bool) {
			this.cycleBehaviour= bool;
		},
		addListener : function( behaviourListener ) {
			this.listenerList.push(behaviourListener);
		},
		getStartTime : function() {
			return this.behaviourStartTime;
		},
		getDuration : function() {
			return this.behaviourDuration;
			
		},
		isBehaviourInTime : function(time,actor) {
			if ( this.expired )	{
				return false;
			}
			
			if ( this.cycleBehaviour )	{
				if ( time>this.behaviourStartTime )	{
					time= (time-this.behaviourStartTime)%this.behaviourDuration + this.behaviourStartTime;
				}
			}
			
			if ( time>this.behaviourStartTime+this.behaviourDuration )	{
				if ( !this.expired )	{
					this.setExpired(actor,time);
				}
				
				return false;
			}
			
			return this.behaviourStartTime<=time && time<this.behaviourStartTime+this.behaviourDuration;			
		},
		fireBehaviourExpiredEvent : function(time)	{
			for( var i=0; i<this.listenerList.length; i++ )	{
				this.listenerList[i].behaviourExpired(this,time);
			}
		},
		normalizeTime : function(time)	{
			time= time-this.behaviourStartTime;
			if ( this.cycleBehaviour )	{
				time%=this.behaviourDuration;
			}
			return this.interpolator.getPosition(time/this.behaviourDuration).y;
		},
		setExpired : function(actor,time) {
            // set for final interpolator value.
            this.expired= true;
			this.setForTime(this.interpolator.getPosition(1).y,actor);
			this.fireBehaviourExpiredEvent(time);
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
	CAAT.ContainerBehaviour= function() {
		CAAT.ContainerBehaviour.superclass.constructor.call(this);
		this.behaviours= [];
		return this;
	};
	
	extend( CAAT.ContainerBehaviour, CAAT.Behaviour, {
		
		behaviours:	null,
		addBehaviour : function(behaviour)	{

			this.behaviours.push(behaviour);
			behaviour.addListener(this);
		},
		apply : function(time, actor) {
			if ( this.isBehaviourInTime(time,actor) )	{
				time-= this.getStartTime();
				if ( this.cycleBehaviour ){
					time%= this.getDuration();
				}

				for( var i=0; i<this.behaviours.length; i++ )	{
					this.behaviours[i].apply(time, actor);
				}
			}
		},
		setInterpolator : function(path) {
		},
		behaviourExpired : function(behaviour,time) {
			if ( this.cycleBehaviour )	{
				behaviour.setExpired(false,time);
			} else {
                this.fireBehaviourExpired( this, time );
            }
		},
		setForTime : function(time, actor) {
			for( var i=0; i<this.behaviours.length; i++ ) {
				this.behaviours[i].setForTime( time, actor );
			}
		}
	});
})();

(function() {
	CAAT.RotateBehaviour= function() {
		CAAT.RotateBehaviour.superclass.constructor.call(this);
		this.anchor= CAAT.Actor.prototype.ANCHOR_CENTER;
		return this;
	};
	
	extend( CAAT.RotateBehaviour, CAAT.Behaviour, {
	
		minAngle:	0,
		maxAngle:	0,
		anchor:		0,
		
		apply : function(time, actor) {
			if ( this.isBehaviourInTime(time,actor) )	{
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
	CAAT.ScaleBehaviour= function() {
		CAAT.RotateBehaviour.superclass.constructor.call(this);
		this.anchor= CAAT.Actor.prototype.ANCHOR_CENTER;
		return this;		
	};
	
	extend( CAAT.ScaleBehaviour, CAAT.Behaviour, {
		minScaleX: 	0, 
		maxScaleX:	0,
		minScaleY:	0,
		maxScaleY:	0,
		anchor:		0,		
		
		apply : function(time, actor) {
			if ( this.isBehaviourInTime(time,actor) )	{
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
	CAAT.AlphaBehaviour= function() {
		CAAT.AlphaBehaviour.superclass.constructor.call(this);
		return this;
	};
	
	extend( CAAT.AlphaBehaviour, CAAT.Behaviour, {
		startAlpha:	0,
		endAlpha:	0,

		apply : function( time, actor )	{
			if ( this.isBehaviourInTime(time,actor) )	{
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
 * CAAT.PathBehaviour
 *
 * autoRotate:  sets actor rotation to be heading from past to current path point.
 *              take into account that this will be incompatible with rotation behaviours
 *              since they will set their own rotation configuration.
 *
 */
(function() {
	CAAT.PathBehaviour= function() {
		CAAT.PathBehaviour.superclass.constructor.call(this);
        this.onPath= this.innerPath;
		return this;
	};

	extend( CAAT.PathBehaviour, CAAT.Behaviour, {
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
            CAAT.PathBehaviour.superclass.setFrameTime.call(this, startTime, duration );
            this.prevX= -1;
            this.prevY= -1;
        },
		apply : function( time, actor )	{
			if ( this.isBehaviourInTime(time,actor) )	{
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
			if ( this.isBehaviourInTime(time,null) )	{
				time= this.normalizeTime(time);
                return this.path.getPosition( time );
            }

            return {x:-1, y:-1};

        }
	});
})();
