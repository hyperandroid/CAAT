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
 *  + modify event pumping: prevent default, bubbling, etc.
 *
 **/


(function() {
	CAAT.Director= function() {
		CAAT.Director.superclass.constructor.call(this);
        this.scenes= [];
	};

	extend( CAAT.Director, CAAT.ActorContainer, {

        debug:          false,  // flag indicating debug mode. It will draw affedted screen areas.

		scenes:			null,   // Scenes collection. An array.
		currentScene:	null,   // The current Scene. This and only this will receive events.
        canvas:         null,   // The canvas the Director draws on.
		crc:			null,	// @deprecated. canvas rendering context
        ctx:            null,   // refactoring crc for a more convenient name
        time:           0,      // virtual actor time.
        timeline:       0,      // global director timeline.
        imagesCache:    null,   // An array of JSON elements of the form { id:string, image:Image }
        clear:          true,
		onRenderCallback: null,
        /**
         * This method performs Director initialization. Must be called once.
         * If the canvas parameter is not set, it will create a Canvas itself,
         * and the developer must explicitly add the canvas to the desired DOM position.
         * This method will also set the Canvas dimension to the specified values
         * by width and height parameters.
         * @param width canvas width
         * @param height canvas height
         * @param canvas optional. A Canvas object.
         */
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
                CAAT.GlobalEnableEvents();
            }
            CAAT.director.push(this);
            this.timeline= new Date().getTime();

            return this;
        },
        createScene : function() {
            var scene= new CAAT.Scene().create();
            this.addScene(scene);
            return scene;
        },
        /**
         * This is the entry point for the animation system of the Director.
         * The director is fed with the elapsed time value to maintain a virtual timeline.
         * This virtual timeline will provide each Scene with its own virtual timeline, and will only
         * feed time when the Scene is the current Scene, or is being switched.
         *
         * @param time integer indicating the elapsed time between two consecutive frames of the
         * Director.
         */
        render : function(time) {
			this.time+= time;
			this.crc.globalAlpha=1;
            this.crc.globalCompositeOperation='source-over';

            if ( this.clear ) {
                this.crc.clearRect(0,0,this.width,this.height);
            }

			this.crc.setTransform(1,0,0,1,0,0);

            /**
             * calculate animable elements and their bbox.
             */
            var i,tt;
			for( i=0; i<this.childrenList.length; i++ ) {
				if (this.childrenList[i].isInAnimationFrame(this.time)) {
                    tt= this.childrenList[i].time - this.childrenList[i].start_time;
					this.childrenList[i].animate(this, tt);
				}
			}

            /**
             * draw actors on scene.
             */
			for( i=0; i<this.childrenList.length; i++ ) {
				if (this.childrenList[i].isInAnimationFrame(this.time)) {
					this.crc.save();
                    tt= this.childrenList[i].time - this.childrenList[i].start_time;
					this.childrenList[i].paintActor(this, tt);
                    this.childrenList[i].time+= time;
					this.crc.restore();

                    if ( this.debug ) {
                        this.childrenList[i].drawScreenBoundingBox(this, tt);
                    }
				}
			}

            this.endAnimate();

		},
        /**
         * Add a new Scene to Director's Scene list. By adding a Scene to the Director
         * does not mean it will be immediately visible, you should explicitly call either
         *  <li>easeIn
         *  <li>easeInOut
         *  <li>easeInOutRandom
         *  <li>setScene
         *  <li>or any of the scene switching methods
         * @param scene an CAAT.Scene object.
         */
		addScene : function( scene ) {
			scene.setBounds(0,0,this.width,this.height);
			this.scenes.push(scene);
			scene.setEaseListener(this);
            if ( null==this.currentScene ) {
                this.setScene(0);
            }
		},
        /**
         * return the number of scenes contained in the Director.
         */
		getNumScenes : function() {
			return this.scenes.length;
		},
        /**
         * This method offers full control over the process of switching between any given two Scenes.
         *
         * To apply this method, you must specify the type of transition to apply for each Scene and
         * the anchor to keep the Scene pinned at.
         *
         * The type of transition will be one of the following values defined in CAAT.Scene.prototype:
         *  <li>EASE_ROTATION
         *  <li>EASE_SCALE
         *  <li>EASE_TRANSLATION
         *
         * The anchor will be any of these values defined in CAAT.Actor.prototype:
         *  <li>ANCHOR_CENTER
		 *  <li>ANCHOR_TOP
		 *  <li>ANCHOR_BOTTOM
		 *  <li>ANCHOR_LEFT
         *  <li>ANCHOR_RIGHT
		 *  <li>ANCHOR_TOP_LEFT
		 *  <li>ANCHOR_TOP_RIGHT
		 *  <li>ANCHOR_BOTTOM_LEFT
		 *  <li>ANCHOR_BOTTOM_RIGHT
         *
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

			this.childrenList= [];

			this.addChild(sout);
			this.addChild(ssin);
		},
        /**
         * This method will switch between two given Scene indexes (ie, take away scene number 2,
         * and bring in scene number 5).
         *
         * It will randomly choose for each Scene the type of transition to apply and the anchor
         * point of each transition type.
         *
         * It will also set for different kind of transitions the following interpolators:
         * EASE_ROTATION    -> ExponentialInOutInterpolator, exponent 4.
         * EASE_SCALE       -> ElasticOutInterpolator, 1.1 and .4
         * EASE_TRANSLATION -> BounceOutInterpolator
         *
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
        /**
         * This method changes Director's current Scene to the scene index indicated by
         * inSceneIndex parameter.
         * The Scene running in the director won't be eased out.
         *
         * @see CAAT.Interpolator
         * @see CAAT.Actor
         * @see CAAT.Scene
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
		easeIn : function( inSceneIndex, type, time, alpha, anchor, interpolator ) {
			var sin= this.scenes[ inSceneIndex ];
			if (type==CAAT.Scene.prototype.EASE_ROTATION) {
				sin.easeRotationIn(time, alpha, anchor, interpolator );
			} else if (type==CAAT.Scene.prototype.EASE_SCALE) {
				sin.easeScaleIn(0,time, alpha, anchor, interpolator );
			} else {
                sin.easeTranslationIn( time, alpha, anchor, interpolator );
            }
			this.childrenList= [];
			this.addChild(sin);

			sin.resetTransform();
            sin.setLocation(0,0);
            sin.alpha = 1;
            sin.mouseEnabled= false;
            sin.setExpired(false);
		},
        /**
         * Changes (or sets) the current Director scene to the index
         * parameter. There will be no transition on scene change.
         * @param sceneIndex an integer indicating the index of the target Scene
         * to be shown.
         */
		setScene : function( sceneIndex ) {
			var sin= this.scenes[ sceneIndex ];
			this.childrenList= [];
			this.addChild(sin);
			this.currentScene= sin;

            sin.setExpired(false);
            sin.mouseEnabled= true;
			sin.resetTransform();
            sin.setLocation(0,0);
            sin.alpha = 1;

            sin.activated();
		},
        /**
         * This method will change the current Scene by the Scene indicated as parameter.
         * It will apply random values for anchor and transition type.
         * @see easeInOutRandom
         *
         * @param iNewSceneIndex integer indicating the index of the new scene to run on the Director.
         * @param time integer indicating the time the Scene transition will take.
         * @param alpha boolean indicating whether Scene transition should be fading.
         * @param transition boolean indicating whether the scene change must smoothly animated.
         */
		switchToScene : function( iNewSceneIndex, time, alpha, transition ) {
			var currentSceneIndex= this.getSceneIndex(this.currentScene);

			if (!transition) {
				this.setScene(iNewSceneIndex);
			}
			else {
				this.easeInOutRandom( iNewSceneIndex, currentSceneIndex, time, alpha );
			}
		},
        /**
         * Sets the previous Scene in sequence as the current Scene.
         * @see switchToScene.
         *
         * @param time integer indicating the time the Scene transition will take.
         * @param alpha boolean indicating whether Scene transition should be fading.
         * @param transition boolean indicating whether the scene change must smoothly animated.
         */
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
        /**
         * Sets the previous Scene in sequence as the current Scene.
         * @see switchToScene.
         *
         * @param time integer indicating the time the Scene transition will take.
         * @param alpha boolean indicating whether Scene transition should be fading.
         * @param transition boolean indicating whether the scene change must smoothly animated.
         */
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
		/**
		 * Scene easing listener.
		 */
		easeEnd : function( scene, b_easeIn ) {
			// scene is going out
			if ( !b_easeIn ) {
				scene.setExpired(true);
			} else {
				this.currentScene= scene;
                this.currentScene.activated();
			}

            scene.mouseEnabled= true;
			scene.emptyBehaviorList();
		},
        /**
         * Return the index for a given Scene object contained in the Director.
         * @param scene
         */
		getSceneIndex : function( scene ) {
			for( var i in this.scenes ) {
				if ( this.scenes[i]==scene ) {
					return i>>0;
				}
			}
			return -1;
		},
        /**
         * Get a concrete director's scene.
         * @param index an integer indicating the scene index.
         * @return a CAAT.Scene object instance or null if the index is oob.
         */
        getScene : function( index ) {
            return this.scenes[index];
        },
        /**
         * Return the index of the current scene in the Director's scene list.
         */
		getCurrentSceneIndex : function() {
			return this.getSceneIndex(this.currentScene);
		},
        /**
         * Return the running browser name.
         */
		getBrowserName : function() {
			return BrowserDetect.browser;
		},
        /**
         * Return the running browser version.
         */
		getBrowserVersion : function() {
			return BrowserDetect.version;
		},
        /**
         * Return the operating system name.
         */
		getOSName : function() {
			return BrowserDetect.OS;
		},
        /**
         * Gets the resource with the specified resource name.
         * The Director holds a parameter called <code>imagesCache</code>
         * where you can store a JSON of the form
         *  <code>[ { id: imageId, image: imageObject } ]</code>.
         * This structure will be used as a resources cache.
         * There's a CAAT.ImagePreloader class to preload resources and
         * generate this structure on loading finalization.
         *
         * @param sId an String identifying a resource.
         */
        getImage : function(sId) {
            for( var i=0; i<this.imagesCache.length; i++ ) {
                if ( this.imagesCache[i].id==sId ) {
                    return this.imagesCache[i].image;
                }
            }
        },
        /**
         * Removes Director scenes.
         */
        emptyScenes : function() {
            this.scenes= [];
        },
        /**
         * Starts the director animation.
         * If no scene is explicitly selected, the current Scene will
         * be the first scene added to the Director.
         * The fps parameter will set the animation quality. Higher values,
         * means CAAT will try to render more frames in the same second (at the
         * expense of cpu power at least until hardware accelerated canvas rendering
         * context are available).
         *
         * A value of 60 is a high frame rate and should not be exceeded.
         *
         * @param fps integer value indicating the target frames per second to run
         * the animation at.
         */
        loop : function(fps, callback) {
            fps= fps || 30;
            fps= 1000/fps;

            var me= this;
            var floop= function loop() {
                var t= new Date().getTime(),
					delta = t - me.timeline;

                me.render( delta );
                me.timeline= t;

				if(callback) {
					callback(me, delta);
				}
            };

            floop();
            setInterval( floop, fps);

        },
        /**
         * This method states whether the director must clear background before rendering
         * each frame.
         * @param clear a boolean.
         * @return this.
         */
        setClear : function(clear) {
            this.clear= clear;
            return this
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