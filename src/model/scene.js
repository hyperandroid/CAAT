/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * Scene is the top level ActorContainer of the Director at any given time.
 * The only time when 2 scenes could be active will be during scene change.
 * An scene controls the way it enters/exits the scene graph.
 *
 *
 *
 */
(function() {
	CAAT.Scene= function() {
		CAAT.Scene.superclass.constructor.call(this);
		return this;
	};
	
	extend( CAAT.Scene, CAAT.ActorContainer, {
		
		easeContainerBehaviour:			null,
		easeContainerBehaviourListener: null,
		easeIn:							false,
		EASE_ROTATION:					1,
		EASE_SCALE:						2,
		EASE_TRANSLATE:					3,

		createAlphaBehaviour: function(time, isIn) {
			var ab= new CAAT.AlphaBehavior();
			ab.setFrameTime( 0, time );
			ab.startAlpha= isIn ? 0 : 1;
			ab.endAlpha= isIn ? 1 : 0;
			this.easeContainerBehaviour.addBehavior(ab);
		},
		easeTranslationIn : function( time, alpha, anchor, interpolator ) {
            this.easeTranslation( time, alpha, anchor, true, interpolator );
        },
        easeTranslationOut : function( time, alpha, anchor, interpolator ) {
            this.easeTranslation( time, alpha, anchor, false, interpolator );
        },
		easeTranslation : function( time, alpha, anchor, isIn, interpolator ) {

            this.easeContainerBehaviour= new CAAT.ContainerBehavior();
            this.easeIn= isIn;

            var pb= new CAAT.PathBehavior();
            if ( interpolator ) {
                pb.setInterpolator( interpolator );
            }

            pb.setFrameTime( 0, time );

            // BUGBUG anchors: 1..4
            anchor%=4;
            anchor++;

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
		easeScaleIn : function(starttime,time,alpha,anchor,interpolator) {
			this.easeScale(starttime,time,alpha,anchor,true,interpolator);
			this.easeIn= true;
		},
		easeScaleOut : function(starttime,time,alpha,anchor,interpolator) {
			this.easeScale(starttime,time,alpha,anchor,false,interpolator);
			this.easeIn= false;
		},
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
			
			var sb= new CAAT.ScaleBehavior();
			sb.setFrameTime( starttime, time );
			sb.minScaleX= x;
			sb.minScaleY= y;
			sb.maxScaleX= x2;
			sb.maxScaleY= y2;
			sb.anchor= anchor;

            if ( interpolator ) {
                sb.setInterpolator(interpolator);
            }

			this.easeContainerBehaviour.addBehavior(sb);
			
			this.easeContainerBehaviour.setFrameTime( this.time, time );
			this.easeContainerBehaviour.addListener(this);
			
			this.emptyBehaviorList();
			CAAT.Scene.superclass.addBehavior.call( this, this.easeContainerBehaviour );
		},
		/*
		 * Do not use directly.
		 */
		addBehavior : function(behaviour) {
			
		},
		easeRotationIn : function(time,alpha,anchor,interpolator) {
			this.easeRotation(time,alpha,anchor,true, interpolator);
			this.easeIn= true;
		},
		easeRotationOut : function(time,alpha,anchor,interpolator) {
			this.easeRotation(time,alpha,anchor,false,interpolator);
			this.easeIn= false;
		},
		easeRotation : function(time,alpha,anchor,isIn,interpolator) {
			this.easeContainerBehaviour= new CAAT.ContainerBehavior();
			
			var start=0;
			var end=0;
			switch(anchor) {
			case CAAT.Actor.prototype.ANCHOR_CENTER:
				anchor= CAAT.Actor.prototype.ANCHOR_TOP;
			case CAAT.Actor.prototype.ANCHOR_TOP:
			case CAAT.Actor.prototype.ANCHOR_BOTTOM:
			case CAAT.Actor.prototype.ANCHOR_LEFT:
			case CAAT.Actor.prototype.ANCHOR_RIGHT:
				start= Math.PI * (Math.random()<.5 ? 1 : -1);
				break;
			case CAAT.Actor.prototype.ANCHOR_TOP_LEFT:
			case CAAT.Actor.prototype.ANCHOR_TOP_RIGHT:
			case CAAT.Actor.prototype.ANCHOR_BOTTOM_LEFT:
			case CAAT.Actor.prototype.ANCHOR_BOTTOM_RIGHT:
				start= Math.PI/2 * (Math.random()<.5 ? 1 : -1);
				break;
			default:
				alert('rot anchor ?? '+anchor);
			}

			if ( false==isIn ) {
				var tmp= start;
				start=end;
				end= tmp;
			}

			if ( alpha ) {
				this.createAlphaBehaviour(time,isIn);
			}
			
			var rb= new CAAT.RotateBehavior();
			rb.setFrameTime( 0, time );
			rb.minAngle= start;
			rb.maxAngle= end;
			rb.anchor= anchor;

            if ( interpolator ) {
                rb.setInterpolator(interpolator);
            }
			this.easeContainerBehaviour.addBehavior(rb);
			
			
			this.easeContainerBehaviour.setFrameTime( this.time, time );
			this.easeContainerBehaviour.addListener(this);
			
			this.emptyBehaviorList();
			CAAT.Scene.superclass.addBehavior.call( this, this.easeContainerBehaviour );
		},
		setEaseListener : function( listener ) {
			this.easeContainerBehaviourListener=listener;
		},
		behaviorExpired : function(actor) {
			this.easeContainerBehaviourListener.easeEnd(this, this.easeIn);
		},
        activated : function() {
        },
        /**
         * Scenes, do not expire the same way Actors do.
         * It simply will be set expired=true, but the frameTime won't be modified.
         */
        setExpired : function(bExpired) {
            this.expired= bExpired;
        }
	});
})();