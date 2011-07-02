/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
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
        this.mousePoint = new CAAT.Point(0, 0, 0);
        this.prevMousePoint = new CAAT.Point(0, 0, 0);
        this.screenMousePoint = new CAAT.Point(0, 0, 0);
        this.isMouseDown = false;
        this.lastSelectedActor = null;
        this.dragging = false;

        return this;
    };

    CAAT.Director.prototype = {

        debug:              false,  // flag indicating debug mode. It will draw affedted screen areas.

        // input related attributes
        mousePoint:         null,   // mouse coordinate related to canvas 0,0 coord.
        prevMousePoint:     null,   // previous mouse position cache. Needed for drag events.
        screenMousePoint:   null,   // screen mouse coordinates.
        isMouseDown:        false,  // is the left mouse button pressed ?
        lastSelectedActor:  null,   // director's last actor receiving input.
        dragging:           false,  // is in drag mode ?

        // other attributes

        scenes:                null,   // Scenes collection. An array.
        currentScene:        null,   // The current Scene. This and only this will receive events.
        canvas:             null,   // The canvas the Director draws on.
        crc:                null,    // @deprecated. canvas rendering context
        ctx:                null,   // refactoring crc for a more convenient name
        time:               0,      // virtual actor time.
        timeline:           0,      // global director timeline.
        imagesCache:        null,   // An array of JSON elements of the form { id:string, image:Image }
        audioManager:       null,
        clear:              true,   // clear background before drawing scenes ??

        transitionScene:    null,

        browserInfo:        null,

        gl:                 null,
        glEnabled:          false,
        glTextureManager:   null,
        glTtextureProgram:  null,
        glColorProgram:     null,

        pMatrix:            null,       // projection matrix
        coords:             null,       // Float32Array
        coordsIndex:        0,
        uv:                 null,
        uvIndex:            0,

        front_to_back:      false,
        currentTexturePage: 0,
        currentOpacity:     1,

        intervalId:         null,

        frameCounter:       0,

        RESIZE_NONE:        1,
        RESIZE_WIDTH:       2,
        RESIZE_HEIGHT:      4,
        RESIZE_BOTH:        8,
        resize:             1,

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
            }
        },
        /**
         * Enable window resize events and set redimension policy.
         * @param mode {number}  RESIZE_BOTH, RESIZE_WIDTH, RESIZE_HEIGHT, RESIZE_NONE.
         */
        enableResizeEvents : function(mode) {
            if (mode === this.RESIZE_BOTH || mode === this.RESIZE_WIDTH || mode === this.RESIZE_HEIGHT) {
                this.resize = mode;
                CAAT.registerResizeListener(this);
            } else {
                CAAT.unregisterResizeListener(this);
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
            this.canvas.width = w;
            this.canvas.height = h;
            this.ctx = this.canvas.getContext('2d');
            this.crc = this.ctx;

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
        initialize : function(width, height, canvas) {
            canvas = canvas || document.createElement('canvas');
            this.canvas = canvas;

            this.setBounds(0, 0, width, height);
            this.create();
            this.enableEvents();

            this.timeline = new Date().getTime();

            // transition scene
            this.transitionScene = new CAAT.Scene().create().setBounds(0, 0, width, height);
            var transitionCanvas = document.createElement('canvas');
            transitionCanvas.width = width;
            transitionCanvas.height = height;
            var transitionImageActor = new CAAT.ImageActor().create().setImage(transitionCanvas);
            this.transitionScene.ctx = transitionCanvas.getContext('2d');
            this.transitionScene.addChildImmediately(transitionImageActor);
            this.transitionScene.setEaseListener(this);

            return this;
        },
        /**
         * Experimental.
         * Initialize a gl enabled director.
         * @param width
         * @param height
         * @param canvas
         */
        initializeGL : function(width, height, canvas) {

            canvas = canvas || document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            var i;

            try {
                this.gl = canvas.getContext("experimental-webgl"/*, {antialias: false}*/);
                this.gl.viewportWidth = width;
                this.gl.viewportHeight = height;
            } catch(e) {
            }

            if (this.gl) {
                this.canvas = canvas;
                this.create();
                this.setBounds(0, 0, width, height);

                this.crc = this.ctx;
                this.enableEvents();
                this.timeline = new Date().getTime();

                this.pMatrix = makePerspective(90, width / height, 0.1, 3000.0, height);

                this.glColorProgram = new CAAT.ColorProgram(this.gl).create().initialize();
                this.glColorProgram.setMatrixUniform(this.pMatrix);

                this.glTextureProgram = new CAAT.TextureProgram(this.gl).create().initialize();
                this.glTextureProgram.setMatrixUniform(this.pMatrix);

                this.glTextureProgram.useProgram();

                var maxTris = 2048;
                this.coords = new Float32Array(maxTris * 12);
                this.uv = new Float32Array(maxTris * 8);


                this.gl.clearColor(0.0, 0.0, 0.0, 255);

                if (this.front_to_back) {
                    this.gl.clearDepth(1.0);
                    this.gl.enable(this.gl.DEPTH_TEST);
                    this.gl.depthFunc(this.gl.LESS);
                } else {
                    this.gl.disable(this.gl.DEPTH_TEST);
                }

                this.gl.enable(this.gl.BLEND);
                this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
                this.glEnabled = true;
            } else {
                // fallback to non gl enabled canvas.
                return this.initialize(width, height, canvas);
            }

            return this;
        },
        /**
         * Creates an initializes a Scene object.
         * @return {CAAT.Scene}
         */
        createScene : function() {
            var scene = new CAAT.Scene().create();
            this.addScene(scene);
            return scene;
        },
        setImagesCache : function(imagesCache, tpW, tpH) {

            var i;

            if (null !== this.glTextureManager) {
                this.glTextureManager.deletePages();
                this.glTextureManager = null;
            }

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
            
            if (this.glEnabled) {

                tpW = tpW || 2048;
                tpH = tpH || 2048;

                this.glTextureManager = new CAAT.GLTexturePageManager();
                this.glTextureManager.createPages(this.gl, tpW, tpH, this.imagesCache);

                this.currentTexturePage = this.glTextureManager.pages[0];
                this.glTextureProgram.setTexture(this.currentTexturePage.texture);
            }

        },
        setGLCurrentOpacity : function(opacity) {
            this.currentOpacity = opacity;
            this.glTextureProgram.setAlpha(opacity);
        },
        /**
         * Render buffered elements.
         * @param vertex
         * @param coordsIndex
         * @param uv
         */
        glRender : function(vertex, coordsIndex, uv) {

            vertex = vertex || this.coords;
            uv = uv || this.uv;
            coordsIndex = coordsIndex || this.coordsIndex;

            var gl = this.gl;

            var numTris = coordsIndex / 12 * 2;
            var numVertices = coordsIndex / 3;

            this.glTextureProgram.updateVertexBuffer(vertex);
            this.glTextureProgram.updateUVBuffer(uv);

            gl.drawElements(gl.TRIANGLES, 3 * numTris, gl.UNSIGNED_SHORT, 0);

        },
        glFlush : function() {
            if (this.coordsIndex !== 0) {
                this.glRender(this.coords, this.coordsIndex, this.uv);
            }
            this.coordsIndex = 0;
            this.uvIndex = 0;
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

            this.setupRender(time);

            /**
             * draw director active scenes.
             */
            var ne = this.childrenList.length;
            var i, tt;
            if (this.glEnabled) {

                this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
                this.coordsIndex = 0;
                this.uvIndex = 0;

                for (i = 0; i < ne; i++) {
                    var c = this.childrenList[i];
                    if (c.isInAnimationFrame(this.time)) {
                        c.wdirty = false;
                        tt = c.time - c.start_time;
                        c.paintActorGL(this, tt);
                        c.time += time;
                    }
                }

                this.glFlush();

            } else {
                this.ctx.globalAlpha = 1;
                this.ctx.globalCompositeOperation = 'source-over';

                if (this.clear) {
                    this.ctx.clearRect(0, 0, this.width, this.height);
                }


                for (i = 0; i < ne; i++) {
                    if (this.childrenList[i].isInAnimationFrame(this.time)) {

                        tt = this.childrenList[i].time - this.childrenList[i].start_time;

                        this.ctx.save();
                        this.childrenList[i].paintActor(this, tt);
                        this.ctx.restore();
                        if (this.debug) {
                            this.ctx.strokeStyle = 'red';
                            this.childrenList[i].drawScreenBoundingBox(this, tt);
                        }

                        this.childrenList[i].time += time;
                    }
                }
            }

            this.endAnimate(this, time);
            this.frameCounter++;

        },
        /**
         * calculate and keep track of animable elements.
         * model view matrices and world model view matrices are already set up.
         * AABB are set up.
         *
         * @param time {number} director time
         * @return this
         */
        setupRender : function(time) {

            for (var i = 0; i < this.childrenList.length; i++) {
                var tt = this.childrenList[i].time - this.childrenList[i].start_time;
                this.childrenList[i].animate(this, tt);
            }

            return this;
        },
        /**
         * This method draws an Scene to an offscreen canvas. This offscreen canvas is also a child of
         * another Scene (transitionScene). So instead of drawing two scenes while transitioning from
         * one to another, first of all an scene is drawn to offscreen, and that image is translated.
         * <p>
         * Until the creation of this method, both scenes where drawn while transitioning with
         * its performance penalty since drawing two scenes could be twice as expensive than drawing
         * only one.
         * <p>
         * Though a high performance increase, we should keep an eye on memory consumption.
         *
         * @param ctx a <code>canvas.getContext('2d')</code> instnce.
         * @param scene {CAAT.Scene} the scene to draw offscreen.
         */
        renderToContext : function(ctx, scene) {
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';

            ctx.clearRect(0, 0, this.width, this.height);

            ctx.setTransform(1, 0, 0, 1, 0, 0);

            var octx = this.ctx;
            var ocrc = this.crc;

            this.ctx = this.crc = ctx;

            /**
             * draw actors on scene.
             */
            if (scene.isInAnimationFrame(this.time)) {
                ctx.save();
                scene.paintActor(this, scene.time - scene.start_time);
                ctx.restore();
            }

            this.ctx = octx;
            this.crc = ocrc;
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
            scene.setBounds(0, 0, this.width, this.height);
            this.scenes.push(scene);
            scene.setEaseListener(this);
            if (null === this.currentScene) {
                this.setScene(0);
            }
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

            if (!this.glEnabled) {
                this.renderToContext(this.transitionScene.ctx, sout);
                sout = this.transitionScene;
            }

            ssin.setExpired(false);
            sout.setExpired(false);

            ssin.mouseEnabled = false;
            sout.mouseEnabled = false;

            ssin.resetTransform();
            sout.resetTransform();

            ssin.setLocation(0, 0);
            sout.setLocation(0, 0);

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
         */
        loop : function(fps,callback) {
            this.onRenderEnd= callback;
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

            this.render(delta);
            this.timeline = t;

            if (this.onRenderEnd) {
                this.onRenderEnd(this, delta);
            }

/*
            fps = fps || 30;
            fps = 1000 / fps;

            var me= this;

            var floop = function _loop() {
                var t = new Date().getTime(),
                        delta = t - me.timeline;

                me.render(delta);
                me.timeline = t;

                if (callback) {
                    callback(me, delta);
                }
            };

            this.interval = setInterval(floop, fps);
*/
        },
        endLoop : function () {
            clearInterval(this.interval);
        },
        /**
         * This method states whether the director must clear background before rendering
         * each frame.
         * @param clear {boolean} a boolean indicating whether to clear the screen before scene draw.
         * @return this.
         */
        setClear : function(clear) {
            this.clear = clear;
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

            var pposx = posx;
            var pposy = posy;
            var node = e.target;
            while (HTMLBodyElement && false === node instanceof HTMLBodyElement) {

                if (node.offsetLeft !== 0 && node.offsetTop !== 0) {
                    pposx -= node.offsetLeft;
                    pposy -= node.offsetTop;
                    break;
                }
                node = node.parentNode ? node.parentNode : node.parentElement;
            }

            point.set(pposx, pposy);
            this.screenMousePoint.set(pposx, pposy);

        },

        /**
         * Enable canvas input events.
         */
        enableEvents : function() {
            CAAT.RegisterDirector(this);

            var canvas = this.canvas;
            var me = this;

            canvas.addEventListener('mouseup',
                    function(e) {
                        me.isMouseDown = false;
                        me.getCanvasCoord(me.mousePoint, e);

                        var pos;

                        if (null !== me.lastSelectedActor) {
                            pos = me.lastSelectedActor.viewToModel(
                                    new CAAT.Point(me.mousePoint.x, me.mousePoint.y, 0));

                            me.lastSelectedActor.mouseUp(
                                    new CAAT.MouseEvent().init(
                                            pos.x,
                                            pos.y,
                                            e,
                                            me.lastSelectedActor,
                                            me.screenMousePoint));
                        }

                        if (!me.dragging) {
                            if (null !== me.lastSelectedActor) {
                                me.lastSelectedActor.mouseClick(
                                        new CAAT.MouseEvent().init(
                                                pos.x,
                                                pos.y,
                                                e,
                                                me.lastSelectedActor,
                                                me.screenMousePoint));
                            }
                        } else {
                            me.dragging = false;
                        }
                    },
                    false);

            canvas.addEventListener('mousedown',
                    function(e) {

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
                    },
                    false);

            canvas.addEventListener('mousemove',
                    function(e) {

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
                            if (null !== me.lastSelectedActor.parent) {
                                me.lastSelectedActor.parent.viewToModel(me.mousePoint);
                            }
                            me.lastSelectedActor.mouseDrag(
                                    new CAAT.MouseEvent().init(
                                            me.mousePoint.x,
                                            me.mousePoint.y,
                                            e,
                                            me.lastSelectedActor,
                                            me.screenMousePoint));
                            return;
                        }

                        var lactor = me.findActorAtPosition(
                                me.mousePoint,
                                new CAAT.Point(me.mousePoint.x, me.mousePoint.y, 0));
                        var pos = lactor.viewToModel(new CAAT.Point(me.mousePoint.x, me.mousePoint.y, 0));

                        // cambiamos de actor.
                        if (lactor !== me.lastSelectedActor) {
                            if (null !== me.lastSelectedActor) {
                                var posExit = me.lastSelectedActor.viewToModel(
                                        new CAAT.Point(me.mousePoint.x, me.mousePoint.y, 0));
                                me.lastSelectedActor.mouseExit(
                                        new CAAT.MouseEvent().init(
                                                posExit.x,
                                                posExit.y,
                                                e,
                                                me.lastSelectedActor,
                                                me.screenMousePoint));
                            }
                            if (null !== lactor) {
                                lactor.mouseEnter(
                                        new CAAT.MouseEvent().init(
                                                pos.x,
                                                pos.y,
                                                e,
                                                lactor,
                                                me.screenMousePoint));
                            }
                        }
                        me.lastSelectedActor = lactor;
                        if (null !== lactor) {
                            me.lastSelectedActor.mouseMove(
                                    new CAAT.MouseEvent().init(
                                            pos.x,
                                            pos.y,
                                            e,
                                            me.lastSelectedActor,
                                            me.screenMousePoint));
                        }
                    },
                    false);

            canvas.addEventListener("dblclick",
                    function(e) {
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
                event.preventDefault();
            }

            canvas.addEventListener("touchstart", touchHandler, true);
            canvas.addEventListener("touchmove", touchHandler, true);
            canvas.addEventListener("touchend", touchHandler, true);
            canvas.addEventListener("touchcancel", touchHandler, true);

        }

    };

    extend(CAAT.Director, CAAT.ActorContainer, null);
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