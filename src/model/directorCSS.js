/**
 * See LICENSE file.
 *
 **/


(function() {
    /**
     * Director is the animator scene graph manager.
     * <p>
     * The director elements is an ActorContainer itself with the main responsibility of managing
     * different Scenes.
     * <p>
     * It is responsible for:
     * <ul>
     * <li>scene changes.
     * <li>route input to the appropriate scene graph actor.
     * <li>be the central point for resource caching.
     * <li>manage the timeline.
     * <li>manage frame rate.
     * <li>etc.
     * </ul>
     *
     * <p>
     * One document can contain different CAAT.Director instances which will be kept together in CAAT
     * function.
     *
     * @constructor
     * @extends CAAT.ActorContainer
     */
    CAAT.Director = function() {
        CAAT.Director.superclass.constructor.call(this);

        this.browserInfo = new CAAT.BrowserDetect();
        this.audioManager = new CAAT.AudioManager().initialize(8);
        this.scenes = [];

        // input related variables initialization
        this.mousePoint=        new CAAT.Point(0, 0, 0);
        this.prevMousePoint=    new CAAT.Point(0, 0, 0);
        this.screenMousePoint=  new CAAT.Point(0, 0, 0);
        this.isMouseDown=       false;
        this.lastSelectedActor= null;
        this.dragging=          false;

        this.setClip(true);

        return this;
    };

    CAAT.Director.prototype = {

        debug:              false,  // flag indicating debug mode. It will draw affedted screen areas.

        onRenderStart:      null,
        onRenderEnd:        null,

        // other attributes

        scenes:             null,   // Scenes collection. An array.
        currentScene:       null,   // The current Scene. This and only this will receive events.
        time:               0,      // virtual actor time.
        timeline:           0,      // global director timeline.
        imagesCache:        null,   // An array of JSON elements of the form { id:string, image:Image }
        audioManager:       null,
        clear:              true,   // clear background before drawing scenes ??

        browserInfo:        null,
        currentOpacity:     1,

        intervalId:         null,

        frameCounter:       0,

        RESIZE_NONE:        1,
        RESIZE_WIDTH:       2,
        RESIZE_HEIGHT:      4,
        RESIZE_BOTH:        8,
        RESIZE_PROPORTIONAL:16,
        resize:             1,
        onResizeCallback:   null,

        checkDebug : function() {
            if ( CAAT.DEBUG ) {
                var dd= new CAAT.Debug().initialize( this.width, 60 );
                this.debugInfo= dd.debugInfo.bind(dd);
            }
        },
        getRenderType : function() {
            return 'CSS';
        },
        windowResized : function(w, h) {
            switch (this.resize) {
                case this.RESIZE_WIDTH:
                    this.setBounds(0, 0, w, this.height);
                    break;
                case this.RESIZE_HEIGHT:
                    this.setBounds(0, 0, this.width, h);
                    break;
                case this.RESIZE_BOTH:
                    this.setBounds(0, 0, w, h);
                    break;
                case this.RESIZE_PROPORTIONAL:
                    var factor= Math.min(w/this.referenceWidth, h/this.referenceHeight);
                    this.setScaleAnchored( factor, factor, 0, 0 );
                    break;
            }

            if ( this.onResizeCallback )    {
                this.onResizeCallback( this, w, h );
            }
            
        },
        /**
         * Enable window resize events and set redimension policy. A callback functio could be supplied
         * to be notified on a Director redimension event. This is necessary in the case you set a redim
         * policy not equal to RESIZE_PROPORTIONAL. In those redimension modes, director's area and their
         * children scenes are resized to fit the new area. But scenes content is not resized, and have
         * no option of knowing so uless an onResizeCallback function is supplied.
         *
         * @param mode {number}  RESIZE_BOTH, RESIZE_WIDTH, RESIZE_HEIGHT, RESIZE_NONE.
         * @param onResizeCallback {function(director{CAAT.Director}, width{integer}, height{integer})} a callback
         * to notify on canvas resize.
         */
        enableResizeEvents : function(mode, onResizeCallback) {
            if (mode === this.RESIZE_BOTH || mode === this.RESIZE_WIDTH || mode === this.RESIZE_HEIGHT || mode===this.RESIZE_PROPORTIONAL) {
                this.referenceWidth= this.width;
                this.referenceHeight=this.height;
                this.resize = mode;
                CAAT.registerResizeListener(this);
                this.onResizeCallback= onResizeCallback;
                this.windowResized( window.innerWidth, window.innerHeight );
            } else {
                CAAT.unregisterResizeListener(this);
                this.onResizeCallback= null;
            }
        },
        /**
         * Set this director's bounds as well as its contained scenes.
         * @param x {number} ignored, will be 0.
         * @param y {number} ignored, will be 0.
         * @param w {number} director width.
         * @param h {number} director height.
         *
         * @return this
         */
        setBounds : function(x, y, w, h) {
            CAAT.Director.superclass.setBounds.call(this, x, y, w, h);
            for (var i = 0; i < this.scenes.length; i++) {
                this.scenes[i].setBounds(0, 0, w, h);
            }

            return this;
        },
        /**
         * This method performs Director initialization. Must be called once.
         * If the canvas parameter is not set, it will create a Canvas itself,
         * and the developer must explicitly add the canvas to the desired DOM position.
         * This method will also set the Canvas dimension to the specified values
         * by width and height parameters.
         *
         * @param width {number} a canvas width
         * @param height {number} a canvas height
         * @param canvas {HTMLCanvasElement=} An optional Canvas object.
         *
         * @return this
         */
        initialize : function(width, height, domElement) {
            this.setBounds(0, 0, width, height);
            this.timeline = new Date().getTime();
            this.domElement= domElement;
            this.style('position','absolute');
            this.style('width',''+width+'px');
            this.style('height',''+height+'px');
            this.style('overflow', 'hidden' );
            this.enableEvents();

            this.checkDebug();
            return this;
        },
        /**
         * Creates an initializes a Scene object.
         * @return {CAAT.Scene}
         */
        createScene : function() {
            var scene = new CAAT.Scene();
            this.addScene(scene);
            return scene;
        },
        setImagesCache : function(imagesCache, tpW, tpH) {

            var i;

            // delete previous image identifiers
            if ( this.imagesCache ) {
                var ids= [];
                for ( i = 0; i < this.imagesCache.length; i++) {
                    ids.push( this.imagesCache[i].id );
                }

                for( i=0; i<ids.length; i++ ) {
                    delete this.imagesCache[ ids[i] ];
                }
            }
            
            this.imagesCache = imagesCache;

            if ( imagesCache ) {
                for ( i = 0; i < imagesCache.length; i++) {
                    this.imagesCache[ imagesCache[i].id ] = imagesCache[i].image;
                }
            }

            this.tpW = tpW || 2048;
            this.tpH = tpH || 2048;
        },
        /**
         * Add a new image to director's image cache. If gl is enabled and the 'noUpdateGL' is not set to true this
         * function will try to recreate the whole GL texture pages.
         * If many handcrafted images are to be added to the director, some performance can be achieved by calling
         * <code>director.addImage(id,image,false)</code> many times and a final call with
         * <code>director.addImage(id,image,true)</code> to finally command the director to create texture pages.
         *
         * @param id {string|object} an identitifier to retrieve the image with
         * @param image {Image|Canvas} image to add to cache
         * @param noUpdateGL {*boolean} unless otherwise stated, the director will
         *  try to recreate the texture pages.
         */
        addImage : function( id, image, noUpdateGL ) {
            if ( this.getImage(id) ) {
                for (var i = 0; i < this.imagesCache.length; i++) {
                    if (this.imagesCache[i].id === id) {
                        this.imagesCache[i].image = image;
                        break;
                    }
                }
                this.imagesCache[ id ] = image;
            } else {
                this.imagesCache.push( { id: id, image: image } );
                this.imagesCache[id]= image;
            }

            if ( !!!noUpdateGL ) {
                this.updateGLPages( );
            }
        },
        deleteImage : function( id, noUpdateGL ) {
            for (var i = 0; i < this.imagesCache.length; i++) {
                if (this.imagesCache[i].id === id) {
                    delete this.imagesCache[id];
                    this.imagesCache.splice(i,1);
                    break;
                }
            }
            if ( !!!noUpdateGL ) {
                this.updateGLPages();
            }
        },
        /**
         * This is the entry point for the animation system of the Director.
         * The director is fed with the elapsed time value to maintain a virtual timeline.
         * This virtual timeline will provide each Scene with its own virtual timeline, and will only
         * feed time when the Scene is the current Scene, or is being switched.
         *
         * @param time {number} integer indicating the elapsed time between two consecutive frames of the
         * Director.
         */
        render : function(time) {

            this.time += time;
            this.animate(this,time);

            /**
             * draw director active scenes.
             */
            var i, l, tt;
            this.size_total=0;
            this.size_active=0;

            for (i = 0, l=this.childrenList.length; i < l; i++) {
                var c= this.childrenList[i];
                if (c.isInAnimationFrame(this.time)) {
                    tt = c.time - c.start_time;
                    if ( c.onRenderStart ) {
                        c.onRenderStart(tt);
                    }
                    c.paintActor(this, tt);
                    if ( c.onRenderEnd ) {
                        c.onRenderEnd(tt);
                    }

                    if (!c.isPaused()) {
                        c.time += time;
                    }

                    this.size_total+= this.childrenList[i].size_total;
                    this.size_active+= this.childrenList[i].size_active;

                }
            }

            this.frameCounter++;
        },
        /**
         * A director is a very special kind of actor.
         * Its animation routine simple sets its modelViewMatrix in case some transformation's been
         * applied.
         * No behaviors are allowed for Director instances.
         * @param director {CAAT.Director} redundant reference to CAAT.Director itself
         * @param time {number} director time.
         */
        animate : function(director, time) {
            /**
             * FIX: no haria falta. El director no se dibuja como elemento del grafo.
             */
            this.setModelViewMatrix(this);


            for (var i = 0; i < this.childrenList.length; i++) {
                var tt = this.childrenList[i].time - this.childrenList[i].start_time;
                this.childrenList[i].animate(this, tt);
            }

            return this;
        },
        /**
         * Add a new Scene to Director's Scene list. By adding a Scene to the Director
         * does not mean it will be immediately visible, you should explicitly call either
         * <ul>
         *  <li>easeIn
         *  <li>easeInOut
         *  <li>easeInOutRandom
         *  <li>setScene
         *  <li>or any of the scene switching methods
         * </ul>
         *
         * @param scene {CAAT.Scene} an CAAT.Scene object.
         */
        addScene : function(scene) {
            scene.setVisible(true);
            scene.setBounds(0, 0, this.width, this.height);
            this.scenes.push(scene);
            scene.setEaseListener(this);
            if (null === this.currentScene) {
                this.setScene(0);
            }

            this.domElement.appendChild( scene.domElement );
        },
        /**
         * Get the number of scenes contained in the Director.
         * @return {number} the number of scenes contained in the Director.
         */
        getNumScenes : function() {
            return this.scenes.length;
        },
        /**
         * This method offers full control over the process of switching between any given two Scenes.
         * To apply this method, you must specify the type of transition to apply for each Scene and
         * the anchor to keep the Scene pinned at.
         * <p>
         * The type of transition will be one of the following values defined in CAAT.Scene.prototype:
         * <ul>
         *  <li>EASE_ROTATION
         *  <li>EASE_SCALE
         *  <li>EASE_TRANSLATION
         * </ul>
         *
         * <p>
         * The anchor will be any of these values defined in CAAT.Actor.prototype:
         * <ul>
         *  <li>ANCHOR_CENTER
         *  <li>ANCHOR_TOP
         *  <li>ANCHOR_BOTTOM
         *  <li>ANCHOR_LEFT
         *  <li>ANCHOR_RIGHT
         *  <li>ANCHOR_TOP_LEFT
         *  <li>ANCHOR_TOP_RIGHT
         *  <li>ANCHOR_BOTTOM_LEFT
         *  <li>ANCHOR_BOTTOM_RIGHT
         * </ul>
         *
         * <p>
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
        easeInOut : function(inSceneIndex, typein, anchorin, outSceneIndex, typeout, anchorout, time, alpha, interpolatorIn, interpolatorOut) {

            if (inSceneIndex === this.getCurrentSceneIndex()) {
                return;
            }

            var ssin = this.scenes[ inSceneIndex ];
            var sout = this.scenes[ outSceneIndex ];

            ssin.resetTransform();
            sout.resetTransform();

            ssin.alpha = 1;
            sout.alpha = 1;

            if (typein === CAAT.Scene.prototype.EASE_ROTATION) {
                ssin.easeRotationIn(time, alpha, anchorin, interpolatorIn);
            } else if (typein === CAAT.Scene.prototype.EASE_SCALE) {
                ssin.easeScaleIn(0, time, alpha, anchorin, interpolatorIn);
            } else {
                ssin.easeTranslationIn(time, alpha, anchorin, interpolatorIn);
            }

            if (typeout === CAAT.Scene.prototype.EASE_ROTATION) {
                sout.easeRotationOut(time, alpha, anchorout, interpolatorOut);
            } else if (typeout === CAAT.Scene.prototype.EASE_SCALE) {
                sout.easeScaleOut(0, time, alpha, anchorout, interpolatorOut);
            } else {
                sout.easeTranslationOut(time, alpha, anchorout, interpolatorOut);
            }

            ssin.setExpired(false);
            sout.setExpired(false);

            this.childrenList = [];

            this.addChild(sout);
            this.addChild(ssin);
        },
        /**
         * This method will switch between two given Scene indexes (ie, take away scene number 2,
         * and bring in scene number 5).
         * <p>
         * It will randomly choose for each Scene the type of transition to apply and the anchor
         * point of each transition type.
         * <p>
         * It will also set for different kind of transitions the following interpolators:
         * <ul>
         * <li>EASE_ROTATION    -> ExponentialInOutInterpolator, exponent 4.
         * <li>EASE_SCALE       -> ElasticOutInterpolator, 1.1 and .4
         * <li>EASE_TRANSLATION -> BounceOutInterpolator
         * </ul>
         *
         * <p>
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
        easeInOutRandom : function(inIndex, outIndex, time, alpha) {

            var pin = Math.random();
            var pout = Math.random();

            var typeIn;
            var interpolatorIn;

            if (pin < 0.33) {
                typeIn = CAAT.Scene.prototype.EASE_ROTATION;
                interpolatorIn = new CAAT.Interpolator().createExponentialInOutInterpolator(4);
            } else if (pin < 0.66) {
                typeIn = CAAT.Scene.prototype.EASE_SCALE;
                interpolatorIn = new CAAT.Interpolator().createElasticOutInterpolator(1.1, 0.4);
            } else {
                typeIn = CAAT.Scene.prototype.EASE_TRANSLATE;
                interpolatorIn = new CAAT.Interpolator().createBounceOutInterpolator();
            }

            var typeOut;
            var interpolatorOut;

            if (pout < 0.33) {
                typeOut = CAAT.Scene.prototype.EASE_ROTATION;
                interpolatorOut = new CAAT.Interpolator().createExponentialInOutInterpolator(4);
            } else if (pout < 0.66) {
                typeOut = CAAT.Scene.prototype.EASE_SCALE;
                interpolatorOut = new CAAT.Interpolator().createExponentialOutInterpolator(4);
            } else {
                typeOut = CAAT.Scene.prototype.EASE_TRANSLATE;
                interpolatorOut = new CAAT.Interpolator().createBounceOutInterpolator();
            }

            this.easeInOut(
                    inIndex,
                    typeIn,
                    (Math.random() * 8.99) >> 0,

                    outIndex,
                    typeOut,
                    (Math.random() * 8.99) >> 0,

                    time,
                    alpha,

                    interpolatorIn,
                    interpolatorOut);

        },
        /**
         * This method changes Director's current Scene to the scene index indicated by
         * inSceneIndex parameter. The Scene running in the director won't be eased out.
         *
         * @see {CAAT.Interpolator}
         * @see {CAAT.Actor}
         * @see {CAAT.Scene}
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
        easeIn : function(inSceneIndex, type, time, alpha, anchor, interpolator) {
            var sin = this.scenes[ inSceneIndex ];
            if (type === CAAT.Scene.prototype.EASE_ROTATION) {
                sin.easeRotationIn(time, alpha, anchor, interpolator);
            } else if (type === CAAT.Scene.prototype.EASE_SCALE) {
                sin.easeScaleIn(0, time, alpha, anchor, interpolator);
            } else {
                sin.easeTranslationIn(time, alpha, anchor, interpolator);
            }
            this.childrenList = [];
            this.addChild(sin);

            sin.resetTransform();
            sin.setLocation(0, 0);
            sin.alpha = 1;
            sin.mouseEnabled = false;
            sin.setExpired(false);
        },
        /**
         * Changes (or sets) the current Director scene to the index
         * parameter. There will be no transition on scene change.
         * @param sceneIndex {number} an integer indicating the index of the target Scene
         * to be shown.
         */
        setScene : function(sceneIndex) {
            var sin = this.scenes[ sceneIndex ];
            this.childrenList = [];
            this.addChild(sin);
            this.currentScene = sin;

            sin.setExpired(false);
            sin.mouseEnabled = true;
            sin.resetTransform();
            sin.setLocation(0, 0);
            sin.alpha = 1;

            sin.activated();
        },
        /**
         * This method will change the current Scene by the Scene indicated as parameter.
         * It will apply random values for anchor and transition type.
         * @see easeInOutRandom
         *
         * @param iNewSceneIndex {number} an integer indicating the index of the new scene to run on the Director.
         * @param time {number} an integer indicating the time the Scene transition will take.
         * @param alpha {boolean} a boolean indicating whether Scene transition should be fading.
         * @param transition {boolean} a boolean indicating whether the scene change must smoothly animated.
         */
        switchToScene : function(iNewSceneIndex, time, alpha, transition) {
            var currentSceneIndex = this.getSceneIndex(this.currentScene);

            if (!transition) {
                this.setScene(iNewSceneIndex);
            }
            else {
                this.easeInOutRandom(iNewSceneIndex, currentSceneIndex, time, alpha);
            }
        },
        /**
         * Sets the previous Scene in sequence as the current Scene.
         * @see switchToScene.
         *
         * @param time {number} integer indicating the time the Scene transition will take.
         * @param alpha {boolean} a boolean indicating whether Scene transition should be fading.
         * @param transition {boolean} a boolean indicating whether the scene change must smoothly animated.
         */
        switchToPrevScene : function(time, alpha, transition) {

            var currentSceneIndex = this.getSceneIndex(this.currentScene);

            if (this.getNumScenes() <= 1 || currentSceneIndex === 0) {
                return;
            }

            if (!transition) {
                this.setScene(currentSceneIndex - 1);
            }
            else {
                this.easeInOutRandom(currentSceneIndex - 1, currentSceneIndex, time, alpha);
            }
        },
        /**
         * Sets the previous Scene in sequence as the current Scene.
         * @see switchToScene.
         *
         * @param time {number} integer indicating the time the Scene transition will take.
         * @param alpha {boolean} a boolean indicating whether Scene transition should be fading.
         * @param transition {boolean} a boolean indicating whether the scene change must smoothly animated.
         */
        switchToNextScene: function(time, alpha, transition) {

            var currentSceneIndex = this.getSceneIndex(this.currentScene);

            if (this.getNumScenes() <= 1 || currentSceneIndex === this.getNumScenes() - 1) {
                return;
            }

            if (!transition) {
                this.setScene(currentSceneIndex + 1);
            }
            else {
                this.easeInOutRandom(currentSceneIndex + 1, currentSceneIndex, time, alpha);
            }
        },
        /**
         * Scene easing listener. Notifies scenes when they're about to be activated (set as current
         * director's scene).
         *
         * @param scene {CAAT.Scene} the scene that has just been brought in or taken out of the director.
         * @param b_easeIn {boolean} scene enters or exits ?
         */
        easeEnd : function(scene, b_easeIn) {
            // scene is going out
            if (!b_easeIn) {

                scene.setExpired(true);
            } else {
                this.currentScene = scene;
                this.currentScene.activated();
            }

            scene.mouseEnabled = true;
            scene.emptyBehaviorList();
        },
        /**
         * Return the index for a given Scene object contained in the Director.
         * @param scene {CAAT.Scene}
         */
        getSceneIndex : function(scene) {
            for (var i = 0; i < this.scenes.length; i++) {
                if (this.scenes[i] === scene) {
                    return i;
                }
            }
            return -1;
        },
        /**
         * Get a concrete director's scene.
         * @param index {number} an integer indicating the scene index.
         * @return {CAAT.Scene} a CAAT.Scene object instance or null if the index is oob.
         */
        getScene : function(index) {
            return this.scenes[index];
        },
        /**
         * Return the index of the current scene in the Director's scene list.
         * @return {number} the current scene's index.
         */
        getCurrentSceneIndex : function() {
            return this.getSceneIndex(this.currentScene);
        },
        /**
         * Return the running browser name.
         * @return {string} the browser name.
         */
        getBrowserName : function() {
            return this.browserInfo.browser;
        },
        /**
         * Return the running browser version.
         * @return {string} the browser version.
         */
        getBrowserVersion : function() {
            return this.browserInfo.version;
        },
        /**
         * Return the operating system name.
         * @return {string} the os name.
         */
        getOSName : function() {
            return this.browserInfo.OS;
        },
        /**
         * Gets the resource with the specified resource name.
         * The Director holds a collection called <code>imagesCache</code>
         * where you can store a JSON of the form
         *  <code>[ { id: imageId, image: imageObject } ]</code>.
         * This structure will be used as a resources cache.
         * There's a CAAT.ImagePreloader class to preload resources and
         * generate this structure on loading finalization.
         *
         * @param sId {object} an String identifying a resource.
         */
        getImage : function(sId) {
            var ret = this.imagesCache[sId];
            if (ret) {
                return ret;
            }

            for (var i = 0; i < this.imagesCache.length; i++) {
                if (this.imagesCache[i].id === sId) {
                    return this.imagesCache[i].image;
                }
            }

            return null;
        },
        /**
         * Adds an audio to the cache.
         *
         * @see CAAT.AudioManager.addAudio
         * @return this
         */
        addAudio : function(id, url) {
            this.audioManager.addAudio(id, url);
            return this;
        },
        /**
         * Plays the audio instance identified by the id.
         * @param id {object} the object used to store a sound in the audioCache.
         */
        audioPlay : function(id) {
            this.audioManager.play(id);
        },
        /**
         * Loops an audio instance identified by the id.
         * @param id {object} the object used to store a sound in the audioCache.
         *
         * @return {HTMLElement|null} the value from audioManager.loop
         */
        audioLoop : function(id) {
            return this.audioManager.loop(id);
        },
        /**
         * Removes Director's scenes.
         */
        emptyScenes : function() {
            this.scenes = [];
            this.domElement.innerHTML='';
            this.createEventHandler();

        },
        /**
         * Adds an scene to this Director.
         * @param scene {CAAT.Scene} a scene object.
         */
        addChild : function(scene) {
            scene.parent = this;
            this.childrenList.push(scene);
        },
        /**
         * @Deprecated use CAAT.loop instead.
         * @param fps
         * @param callback
         * @param callback2
         */
        loop : function(fps,callback,callback2) {
            if ( callback2 ) {
                this.onRenderStart= callback;
                this.onRenderEnd= callback2;
            } else if (callback) {
                this.onRenderEnd= callback;
            }
            CAAT.loop();
        },
        /**
         * Starts the director animation.If no scene is explicitly selected, the current Scene will
         * be the first scene added to the Director.
         * <p>
         * The fps parameter will set the animation quality. Higher values,
         * means CAAT will try to render more frames in the same second (at the
         * expense of cpu power at least until hardware accelerated canvas rendering
         * context are available). A value of 60 is a high frame rate and should not be exceeded.
         *
         * @param fps {number} integer value indicating the target frames per second to run
         * the animation at.
         */
        renderFrame : function(fps, callback) {
            var t = new Date().getTime(),
                    delta = t - this.timeline;

            if ( this.onRenderStart ) {
                this.onRenderStart(delta);
            }

            this.render(delta);

            if ( this.debugInfo ) {
                this.debugInfo(this.size_total, this.size_active);
            }

            this.timeline = t;

            if (this.onRenderEnd) {
                this.onRenderEnd(delta);
            }
        },
        endLoop : function () {
        },
        /**
         * This method states whether the director must clear background before rendering
         * each frame.
         * @param clear {boolean} a boolean indicating whether to clear the screen before scene draw.
         * @return this.
         */
        setClear : function(clear) {
            return this;
        },
        /**
         * Get this Director's AudioManager instance.
         * @return {CAAT.AudioManager} the AudioManager instance.
         */
        getAudioManager : function() {
            return this.audioManager;
        },
        /**
         * Enable canvas input events.
         */
        enableEvents : function() {
            CAAT.RegisterDirector(this);
            this.createEventHandler();
        },
        createEventHandler : function() {
            this.eventHandler= document.createElement('div');
            this.domElement.appendChild(this.eventHandler);

            this.eventHandler.style.position=   'absolute';
            this.eventHandler.style.left=       '0';
            this.eventHandler.style.top=        '0';
            this.eventHandler.style.zIndex=     999999;
            this.eventHandler.style.width=      ''+this.width+'px';
            this.eventHandler.style.height=     ''+this.height+'px';
            
            var canvas= this.eventHandler;
            var me= this;

            canvas.addEventListener('mouseup',
                    function(e) {
                        e.preventDefault();

                        me.isMouseDown = false;
                        me.getCanvasCoord(me.mousePoint, e);

                        var pos= null;

                        if (null !== me.lastSelectedActor) {
                            pos = me.lastSelectedActor.viewToModel(
                                    new CAAT.Point(me.mousePoint.x, me.mousePoint.y, 0));

                            if ( me.lastSelectedActor.actionPerformed && me.lastSelectedActor.contains(pos.x, pos.y) ) {
                                me.lastSelectedActor.actionPerformed(e)
                            }

                            me.lastSelectedActor.mouseUp(
                                    new CAAT.MouseEvent().init(
                                            pos.x,
                                            pos.y,
                                            e,
                                            me.lastSelectedActor,
                                            me.screenMousePoint));
                        }

                        if (!me.dragging && null !== me.lastSelectedActor) {
                            if (me.lastSelectedActor.contains(pos.x, pos.y)) {
                                me.lastSelectedActor.mouseClick(
                                    new CAAT.MouseEvent().init(
                                        pos.x,
                                        pos.y,
                                        e,
                                        me.lastSelectedActor,
                                        me.screenMousePoint));
                            }
                        }
                        me.dragging = false;

                        in_= false;
                    },
                    false);

            canvas.addEventListener('mousedown',
                    function(e) {

                        e.preventDefault();

                        me.getCanvasCoord(me.mousePoint, e);

                        me.isMouseDown = true;
                        me.lastSelectedActor = me.findActorAtPosition(
                                me.mousePoint,
                                new CAAT.Point(me.mousePoint.x, me.mousePoint.y, 0));
                        var px = me.mousePoint.x;
                        var py = me.mousePoint.y;

                        if (null !== me.lastSelectedActor) {

                            me.lastSelectedActor.viewToModel(me.mousePoint);

                            // to calculate mouse drag threshold
                            me.prevMousePoint.x = px;
                            me.prevMousePoint.y = py;
                            me.lastSelectedActor.mouseDown(
                                    new CAAT.MouseEvent().init(
                                            me.mousePoint.x,
                                            me.mousePoint.y,
                                            e,
                                            me.lastSelectedActor,
                                            me.screenMousePoint));
                        }
                    },
                    false);

            canvas.addEventListener('mouseover',
                    function(e) {

                        e.preventDefault();

                        me.getCanvasCoord(me.mousePoint, e);

                        me.lastSelectedActor = me.findActorAtPosition(
                                me.mousePoint,
                                new CAAT.Point(me.mousePoint.x, me.mousePoint.y, 0));
                        if (null !== me.lastSelectedActor) {

                            var pos = new CAAT.Point(me.mousePoint.x, me.mousePoint.y, 0);
                            me.lastSelectedActor.viewToModel(pos);

                            me.lastSelectedActor.mouseEnter(
                                    new CAAT.MouseEvent().init(
                                            pos.x,
                                            pos.y,
                                            e,
                                            me.lastSelectedActor,
                                            me.screenMousePoint));
                        }
                    },
                    false);

            canvas.addEventListener('mouseout',
                    function(e) {

                        e.preventDefault();

                        if (null !== me.lastSelectedActor) {

                            me.getCanvasCoord(me.mousePoint, e);
                            var pos = new CAAT.Point(me.mousePoint.x, me.mousePoint.y, 0);
                            me.lastSelectedActor.viewToModel(pos);

                            me.lastSelectedActor.mouseExit(
                                    new CAAT.MouseEvent().init(
                                            pos.x,
                                            pos.y,
                                            e,
                                            me.lastSelectedActor,
                                            me.screenMousePoint));
                            me.lastSelectedActor = null;
                        }
                        me.isMouseDown = false;
                        in_ = false;
                    },
                    false);

            canvas.addEventListener('mousemove',
                    function(e) {

                        e.preventDefault();

                        me.getCanvasCoord(me.mousePoint, e);
                        // drag
                        if (me.isMouseDown && null !== me.lastSelectedActor) {

                            // check for mouse move threshold.
                            if (!me.dragging) {
                                if (Math.abs(me.prevMousePoint.x - me.mousePoint.x) < CAAT.DRAG_THRESHOLD_X &&
                                        Math.abs(me.prevMousePoint.y - me.mousePoint.y) < CAAT.DRAG_THRESHOLD_Y) {
                                    return;
                                }
                            }

                            me.dragging = true;

                            var p= new CAAT.Point(me.mousePoint.x, me.mousePoint.y, 0);

                            if (null !== me.lastSelectedActor.parent) {
                                me.lastSelectedActor.parent.viewToModel(me.mousePoint);
                            }

                            var px= me.lastSelectedActor.x;
                            var py= me.lastSelectedActor.y;
                            me.lastSelectedActor.mouseDrag(
                                    new CAAT.MouseEvent().init(
                                            me.mousePoint.x,
                                            me.mousePoint.y,
                                            e,
                                            me.lastSelectedActor,
                                            me.screenMousePoint));

                            /**
                             * Element has not moved after drag, so treat it as a button.
                             *
                             */
                            if ( px===me.lastSelectedActor.x && py===me.lastSelectedActor.y )   {
                                me.lastSelectedActor.viewToModel( p );

                                if (in_ && !me.lastSelectedActor.contains(p.x, p.y)) {
                                    me.lastSelectedActor.mouseExit(
                                        new CAAT.MouseEvent().init(
                                            p.x,
                                            p.y,
                                            e,
                                            me.lastSelectedActor,
                                            me.screenMousePoint));
                                    in_ = false;
                                }

                                if (!in_ && me.lastSelectedActor.contains(p.x, p.y)) {
                                    me.lastSelectedActor.mouseEnter(
                                        new CAAT.MouseEvent().init(
                                            p.x,
                                            p.y,
                                            e,
                                            me.lastSelectedActor,
                                            me.screenMousePoint));
                                    in_ = true;
                                }
                            }

                            return;
                        }

                        in_= true;

                        var lactor = me.findActorAtPosition(
                                me.mousePoint,
                                new CAAT.Point(me.mousePoint.x, me.mousePoint.y, 0));

                        // cambiamos de actor.
                        if (lactor !== me.lastSelectedActor) {
                            if (null !== me.lastSelectedActor) {
                                me.lastSelectedActor.mouseExit(
                                    new CAAT.MouseEvent().init(
                                        me.mousePoint.x,
                                        me.mousePoint.y,
                                        e,
                                        me.lastSelectedActor,
                                        me.screenMousePoint));
                            }
                            if (null !== lactor) {
                                lactor.mouseEnter(
                                    new CAAT.MouseEvent().init(
                                        me.mousePoint.x,
                                        me.mousePoint.y,
                                        e,
                                        lactor,
                                        me.screenMousePoint));
                            }
                        }
                        me.lastSelectedActor = lactor;
                        if (null !== lactor) {
                            me.lastSelectedActor.mouseMove(
                                new CAAT.MouseEvent().init(
                                    me.mousePoint.x,
                                    me.mousePoint.y,
                                    e,
                                    me.lastSelectedActor,
                                    me.screenMousePoint));
                        }
                    },
                    false);

            canvas.addEventListener("dblclick",
                    function(e) {

                        e.preventDefault();

                        me.getCanvasCoord(me.mousePoint, e);
                        if (null !== me.lastSelectedActor) {

                            me.lastSelectedActor.viewToModel(me.mousePoint.x, me.mousePoint.y);

                            me.lastSelectedActor.mouseDblClick(
                                    new CAAT.MouseEvent().init(
                                            me.mousePoint.x,
                                            me.mousePoint.y,
                                            e,
                                            me.lastSelectedActor,
                                            me.screenMousePoint));
                        }
                    },
                    false);



            function touchHandler(event) {
                var touches = event.changedTouches,
                        first = touches[0],
                        type = "";

                switch (event.type) {
                    case "touchstart": type = "mousedown"; break;
                    case "touchmove":  type = "mousemove"; break;
                    case "touchend":   type = "mouseup"; break;
                    default: return;
                }

                //initMouseEvent(type, canBubble, cancelable, view, clickCount,
                //           screenX, screenY, clientX, clientY, ctrlKey,
                //           altKey, shiftKey, metaKey, button, relatedTarget);

                var simulatedEvent = document.createEvent("MouseEvent");
                simulatedEvent.initMouseEvent(
                        type,
                        true,
                        true,
                        me.canvas,
                        1,
                        first.screenX,
                        first.screenY,
                        first.clientX,
                        first.clientY,
                        false,
                        false,
                        false,
                        false,
                        0/*left*/,
                        null);

                me.canvas.dispatchEvent(simulatedEvent);
                //event.preventDefault();
            }

            canvas.addEventListener("touchstart", touchHandler, true);
            canvas.addEventListener("touchmove", touchHandler, true);
            canvas.addEventListener("touchend", touchHandler, true);
            canvas.addEventListener("touchcancel", touchHandler, true);


        },
        /**
         * Acculumate dom elements position to properly offset on-screen mouse/touch events.
         * @param node
         */
        cumulateOffset : function(node, parent, prop) {
            var left= prop+'Left';
            var top= prop+'Top';
            var x=0, y=0, style;

            while( node && node.style ) {
                if ( node.currentStyle ) {
                    style= node.currentStyle['position'];
                } else {
                    style= (node.ownerDocument.defaultView || node.ownerDocument.parentWindow).getComputedStyle(node, null);
                    style= style ? style.getPropertyValue('position') : null;
                }

//                if (!/^(relative|absolute|fixed)$/.test(style)) {
                if (!/^(fixed)$/.test(style)) {
                    x += node[left];
                    y+= node[top];
                    node = node[parent];
                } else {
                    break;
                }
            }

            return {
                x:      x,
                y:      y,
                style:  style
            };
        },
        getOffset : function( node ) {
            var res= this.cumulateOffset(node, 'offsetParent', 'offset');
            if ( res.style==='fixed' ) {
                var res2= this.cumulateOffset(node, node.parentNode ? 'parentNode' : 'parentElement', 'scroll');
                return {
                    x: res.x + res2.x,
                    y: res.y + res2.y
                };
            }

            return {
                x: res.x,
                y: res.y
            };
        },
        /**
         * Normalize input event coordinates to be related to (0,0) canvas position.
         * @param point {CAAT.Point} a CAAT.Point instance to hold the canvas coordinate.
         * @param e {MouseEvent} a mouse event from an input event.
         */
        getCanvasCoord : function(point, e) {

            var posx = 0;
            var posy = 0;
            if (!e) e = window.event;

            if (e.pageX || e.pageY) {
                posx = e.pageX;
                posy = e.pageY;
            }
            else if (e.clientX || e.clientY) {
                posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
                posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
            }

            var offset= this.getOffset(e.target);

            posx-= offset.x;
            posy-= offset.y;
            point.set(posx, posy);
        }

    };

    extend(CAAT.Director, CAAT.ActorContainer, null);

})();

