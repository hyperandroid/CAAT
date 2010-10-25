/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * Director is the animator scene graph manager.
 * The director elements is an ActorContainer itself. It manages different Scenes.
 * It is responsible for:
 *  + scene changes.
 *  + route input to the appropriate scene graph actor.
 *  + be the central point for resource caching.
 *  + manage the timeline.
 *
 *
 * TODO:
 *  + add more scene change transitions (translations and flip)
 *  + expose more events.
 *  + pump keyboard events
 *  + modify event pumping: prevent default, bubling, etc.
 *
 * 20101010 Hyperandroid
 *  + Added imagesCache and method getImage(sId).
 * 20101011 Hyperandroid
 *  + Reenabled all transitions for FF. Discovered that if ScaleX==0 || ScaleY==0, it will
 *    stop rendering frames.
 *
 **/


(function() {
	CAAT.Director= function() {
		CAAT.Director.superclass.constructor.call(this);
        this.scenes= [];
	};

	extend( CAAT.Director, CAAT.ActorContainer, {

        debug:          false,

		scenes:			null,
		currentScene:	null,
        canvas:         null,
		crc:			null,	// canvas rendering context
        ctx:            null,   // refactoring crc for a more convenient name
        time:           0,

        meIn:           null,
        meOut:          null,

        timeline:       0,      // global director timeline.

        /**
         * ImagesCache is an array of JSON elements of the form:
         * { id:string, image:Image }
         */
        imagesCache:    null,

        initialize : function(width,height,canvas) {

            canvas= canvas || document.createElement('canvas');
            canvas.width= width;
            canvas.height=height;

            this.setBounds(0, 0, canvas.width, canvas.height);
            this.create();
            this.canvas= canvas;
            this.ctx= canvas.getContext('2d');
            this.crc= this.ctx;

            if ( !CAAT.director ) {
                CAAT.director=[];
                __GlobalEnableEvents(this);
            }
            CAAT.director.push(this);
            this.timeline= new Date().getTime();

            return this;
        },
        render : function(time) {
			this.time+= time;
			this.crc.globalAlpha=1;
            this.crc.globalCompositeOperation='source-over';
            this.crc.clearRect(0,0,this.width,this.height);

			this.crc.setTransform(1,0,0,1,0,0);

            /**
             * calculate animable elements and their bbox.
             */
            var i,tt;
			for( i=0; i<this.childList.length; i++ ) {
				if (this.childList[i].isInAnimationFrame(this.time)) {
                    tt= this.childList[i].time - this.childList[i].start_time;
					this.childList[i].animate(this, tt);
				}
			}

            /**
             * draw actors on scene.
             */
			for( i=0; i<this.childList.length; i++ ) {
				if (this.childList[i].isInAnimationFrame(this.time)) {
					this.crc.save();
                    tt= this.childList[i].time - this.childList[i].start_time;
					this.childList[i].paintActor(this, tt);
                    this.childList[i].time+= time;
					this.crc.restore();

                    if ( this.debug ) {
                        this.childList[i].drawScreenBoundingBox(this, tt);
                    }
				}
			}

            this.endAnimate();

		},
		addScene : function( scene ) {
			scene.setBounds(0,0,this.width,this.height);
			this.scenes.push(scene);
			scene.setEaseListener(this);
            if ( null==this.currentScene ) {
                this.setScene(0);
            }
		},
		getNumScenes : function() {
			return this.scenes.length;
		},
		easeInOut : function( inSceneIndex, typein, anchorin, outSceneIndex, typeout, anchorout, time, alpha, interpolatorIn, interpolatorOut ) {

            if ( inSceneIndex==this.getCurrentSceneIndex() ) {
                return;
            }

			var ssin=this.scenes[ inSceneIndex ];
			var sout=this.scenes[ outSceneIndex ];

            ssin.setExpired(false);
            sout.setExpired(false);

            ssin.mouseEnabled= false;
            sout.mouseEnabled= false;

			ssin.resetTransform();
			sout.resetTransform();

            ssin.setLocation(0,0);
            sout.setLocation(0,0);

            ssin.alpha = 1;
            sout.alpha = 1;

			if (typein==CAAT.Scene.prototype.EASE_ROTATION) {
				ssin.easeRotationIn(time, alpha, anchorin, interpolatorIn );
			} else if (typein==CAAT.Scene.prototype.EASE_SCALE) {
				ssin.easeScaleIn(0,time, alpha, anchorin, interpolatorIn );
			} else {
                ssin.easeTranslationIn(time,alpha,anchorin,interpolatorIn );
            }

			if (typeout==CAAT.Scene.prototype.EASE_ROTATION) {
				sout.easeRotationOut(time, alpha, anchorout, interpolatorOut );
			} else if (typeout==CAAT.Scene.prototype.EASE_SCALE) {
				sout.easeScaleOut(0,time, alpha, anchorout, interpolatorOut );
			} else {
                sout.easeTranslationOut(time,alpha,anchorout, interpolatorOut);
            }

			this.childList= [];

			this.addChild(sout);
			this.addChild(ssin);
		},
		easeInOutRandom : function(inIndex,outIndex,time,alpha) {

            var pin=Math.random();
            var pout=Math.random();

            var typeIn;
            var interpolatorIn;

            if (pin<.33) {
                typeIn= CAAT.Scene.prototype.EASE_ROTATION;
                interpolatorIn= new CAAT.Interpolator().createExponentialInOutInterpolator(4);
            } else if (pin<.66) {
                typeIn= CAAT.Scene.prototype.EASE_SCALE;
                interpolatorIn= new CAAT.Interpolator().createElasticOutInterpolator(1.1, .4);
            } else {
                typeIn= CAAT.Scene.prototype.EASE_TRANSLATE;
                interpolatorIn= new CAAT.Interpolator().createBounceOutInterpolator();
            }

            var typeOut;
            var interpolatorOut;

            if (pout<.33) {
                typeOut= CAAT.Scene.prototype.EASE_ROTATION;
                interpolatorOut= new CAAT.Interpolator().createExponentialInOutInterpolator(4);
            } else if (pout<.66) {
                typeOut= CAAT.Scene.prototype.EASE_SCALE;
                interpolatorOut= new CAAT.Interpolator().createExponentialOutInterpolator(4);
            } else {
                typeOut= CAAT.Scene.prototype.EASE_TRANSLATE;
                interpolatorOut= new CAAT.Interpolator().createBounceOutInterpolator();
            }

            this.easeInOut(
                    inIndex,
                    typeIn,
                    (Math.random()*8.99)>>0,

                    outIndex,
                    typeOut,
                    (Math.random()*8.99)>>0,

                    time,
                    alpha,

                    interpolatorIn,
                    interpolatorOut);

		},
		easeIn : function( inSceneIndex, type, time, alpha, anchor, interpolator ) {
			var sin= this.scenes[ inSceneIndex ];
			if (type==CAAT.Scene.prototype.EASE_ROTATION) {
				sin.easeRotationIn(time, alpha, anchor, interpolator );
			} else if (type==CAAT.Scene.prototype.EASE_SCALE) {
				sin.easeScaleIn(0,time, alpha, anchor, interpolator );
			} else {
                sin.easeTranslationIn( time, alpha, anchor, interpolator );
            }
			this.childList= [];
			this.addChild(sin);

			sin.resetTransform();
            sin.setLocation(0,0);
            sin.alpha = 1;
            sin.mouseEnabled= false;
            sin.setExpired(false);
		},
		setScene : function( sceneIndex ) {
			var sin= this.scenes[ sceneIndex ];
			this.childList= [];
			this.addChild(sin);
			this.currentScene= sin;

			sin.setFrameTime(this.time, Number.MAX_VALUE);
		},
		switchToScene : function( iNewSceneIndex, time, alpha, transition ) {
			var currentSceneIndex= this.getSceneIndex(this.currentScene);

			if (!transition) {
				this.setScene(iNewSceneIndex);
			}
			else {
				this.easeInOutRandom( iNewSceneIndex, currentSceneIndex, time, alpha );
			}
		},
		switchToPrevScene : function(time, alpha, transition) {

			var currentSceneIndex= this.getSceneIndex(this.currentScene);

			if ( this.getNumScenes()<=1 || currentSceneIndex==0 ) {
				return;
			}

			if (!transition) {
				this.setScene(currentSceneIndex-1);
			}
			else {
				this.easeInOutRandom( currentSceneIndex-1, currentSceneIndex, time, alpha );
			}
		},
		switchToNextScene: function(time, alpha, transition) {

			var currentSceneIndex= this.getSceneIndex(this.currentScene);

			if ( this.getNumScenes()<=1 || currentSceneIndex==this.getNumScenes()-1 ) {
				return;
			}

			if (!transition) {
				this.setScene(currentSceneIndex+1);
			}
			else {
				this.easeInOutRandom( currentSceneIndex+1, currentSceneIndex, time, alpha );
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
		/*
		 * Scene easing listener.
		 */
		easeEnd : function( scene, b_easeIn ) {
			// scene is going out
			if ( false==b_easeIn ) {
				scene.setExpired(true);
			} else {
				this.currentScene= scene;
                this.currentScene.activated();
			}

            scene.mouseEnabled= true;
			scene.emptyBehaviorList();
		},
		getSceneIndex : function( scene ) {
			for( var i in this.scenes ) {
				if ( this.scenes[i]==scene ) {
					return i>>0;
				}
			}
			return -1;
		},
		getCurrentSceneIndex : function() {
			return this.getSceneIndex(this.currentScene);
		},
		getBrowserName : function() {
			return BrowserDetect.browser;
		},
		getBrowserVersion : function() {
			return BrowserDetect.version;
		},
		getOSName : function() {
			return BrowserDetect.OS;
		},
        getImage : function(sId) {
            for( var i=0; i<this.imagesCache.length; i++ ) {
                if ( this.imagesCache[i].id==sId ) {
                    return this.imagesCache[i].image;
                }
            }
        },
        emptyScenes : function() {
            this.scenes= [];
        },
        loop : function(fps) {
            fps= fps || 30;
            fps= 1000/fps;

            var me= this;
            var floop= function loop() {
                var t= new Date().getTime();
                me.render( t - me.timeline );
                me.timeline= t;
            };

            floop();
            setInterval( floop, fps);

        }

    });
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
		},*/