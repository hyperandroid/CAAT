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

        onRenderStart:      null,
        onRenderEnd:        null,

        // input related attributes
        mousePoint:         null,   // mouse coordinate related to canvas 0,0 coord.
        prevMousePoint:     null,   // previous mouse position cache. Needed for drag events.
        screenMousePoint:   null,   // screen mouse coordinates.
        isMouseDown:        false,  // is the left mouse button pressed ?
        lastSelectedActor:  null,   // director's last actor receiving input.
        dragging:           false,  // is in drag mode ?

        // other attributes

        scenes:             null,   // Scenes collection. An array.
        currentScene:       null,   // The current Scene. This and only this will receive events.
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

        statistics: {
            size_total:         0,
            size_active:        0,
            draws:              0
        },
        currentTexturePage: 0,
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
                var dd= new CAAT.Debug().initialize( this.width, 100 );
                this.debugInfo= dd.debugInfo.bind(dd);
            }
        },
        getRenderType : function() {
            return this.glEnabled ? 'WEBGL' : 'CANVAS';
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
                    this.setScaleProportional(w,h);
                    break;
            }

            if ( this.glEnabled ) {
                this.glReset();
            }

            if ( this.onResizeCallback )    {
                this.onResizeCallback( this, w, h );
            }

        },
        setScaleProportional : function(w,h) {

            var factor= Math.min(w/this.referenceWidth, h/this.referenceHeight);

            this.setScaleAnchored( factor, factor, 0, 0 );

            this.canvas.width = this.referenceWidth*factor;
            this.canvas.height = this.referenceHeight*factor;
            this.ctx = this.canvas.getContext(this.glEnabled ? 'experimental-webgl' : '2d' );
            this.crc = this.ctx;

            if ( this.glEnabled ) {
                this.glReset();
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

            this.canvas.width = w;
            this.canvas.height = h;
            this.ctx = this.canvas.getContext(this.glEnabled ? 'experimental-webgl' : '2d');
            this.crc = this.ctx;

            for (var i = 0; i < this.scenes.length; i++) {
                this.scenes[i].setBounds(0, 0, w, h);
            }

            if ( this.glEnabled ) {
                this.glReset();
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
         * @param proxy {HTMLElement} this object can be an event proxy in case you'd like to layer different elements
         *              and want events delivered to the correct element.
         *
         * @return this
         */
        initialize : function(width, height, canvas, proxy) {
            canvas = canvas || document.createElement('canvas');
            this.canvas = canvas;

            if ( typeof proxy==='undefined' ) {
                proxy= canvas;
            }

            this.setBounds(0, 0, width, height);
            this.create();
            this.enableEvents(proxy);

            this.timeline = new Date().getTime();

            // transition scene
            this.transitionScene = new CAAT.Scene().create().setBounds(0, 0, width, height);
            var transitionCanvas = document.createElement('canvas');
            transitionCanvas.width = width;
            transitionCanvas.height = height;
            var transitionImageActor = new CAAT.Actor().create().setBackgroundImage(transitionCanvas);
            this.transitionScene.ctx = transitionCanvas.getContext('2d');
            this.transitionScene.addChildImmediately(transitionImageActor);
            this.transitionScene.setEaseListener(this);

            this.checkDebug();

            return this;
        },
        glReset : function() {
            this.pMatrix= makeOrtho( 0, this.referenceWidth, this.referenceHeight, 0, -1, 1 );
            this.gl.viewport(0,0,this.canvas.width,this.canvas.height);
            this.glColorProgram.setMatrixUniform(this.pMatrix);
            this.glTextureProgram.setMatrixUniform(this.pMatrix);
            this.gl.viewportWidth = this.canvas.width;
            this.gl.viewportHeight = this.canvas.height;
        },
        /**
         * Experimental.
         * Initialize a gl enabled director.
         * @param width
         * @param height
         * @param canvas
         */
        initializeGL : function(width, height, canvas, proxy) {

            canvas = canvas || document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            if ( typeof proxy==='undefined' ) {
                proxy= canvas;
            }

            this.referenceWidth= width;
            this.referenceHeight=height;

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
                this.enableEvents(canvas);
                this.timeline = new Date().getTime();

                this.glColorProgram = new CAAT.ColorProgram(this.gl).create().initialize();
                this.glTextureProgram = new CAAT.TextureProgram(this.gl).create().initialize();
                this.glTextureProgram.useProgram();
                this.glReset();


                var maxTris = 512;
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
// Fix FF                this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
                this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
                this.glEnabled = true;

                this.checkDebug();
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

            this.tpW = tpW || 2048;
            this.tpH = tpH || 2048;

            this.updateGLPages();
        },
        updateGLPages : function() {
            if (this.glEnabled) {

                this.glTextureManager = new CAAT.GLTexturePageManager();
                this.glTextureManager.createPages(this.gl, this.tpW, this.tpH, this.imagesCache);

                this.currentTexturePage = this.glTextureManager.pages[0];
                this.glTextureProgram.setTexture(this.currentTexturePage.texture);
            }
        },
        setGLTexturePage : function( tp ) {
            this.currentTexturePage = tp;
            this.glTextureProgram.setTexture(tp.texture);
            return this;
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

            this.statistics.draws++;
        },

        findActorAtPosition : function(point) {

            // z-order
            var cl= this.childrenList;
            for( var i=cl.length-1; i>=0; i-- ) {
                var child= this.childrenList[i];

                var np= new CAAT.Point( point.x, point.y, 0 );
                var contained= child.findActorAtPosition( np );
                if ( null!==contained ) {
                    return contained;
                }
            }

            return this;
        },


        resetStats : function() {
            this.statistics.size_total= 0;
            this.statistics.size_active=0;
            this.statistics.draws=      0;
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

            if ( CAAT.DEBUG ) {
                this.resetStats();
            }

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
                        tt = c.time - c.start_time;
                        if ( c.onRenderStart ) {
                            c.onRenderStart(tt);
                        }
                        c.paintActorGL(this, tt);
                        if ( c.onRenderEnd ) {
                            c.onRenderEnd(tt);
                        }

                        if ( !c.isPaused() ) {
                            c.time += time;
                        }

                        if ( CAAT.DEBUG ) {
                            this.statistics.size_total+= c.size_total;
                            this.statistics.size_active+= c.size_active;
                        }

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
                    var c= this.childrenList[i];

                    if (c.isInAnimationFrame(this.time)) {
                        tt = c.time - c.start_time;
                        this.ctx.save();

                        if ( c.onRenderStart ) {
                            c.onRenderStart(tt);
                        }
                        c.paintActor(this, tt);
                        if ( c.onRenderEnd ) {
                            c.onRenderEnd(tt);
                        }
                        this.ctx.restore();
                        if (CAAT.DEBUGBB) {
                            this.ctx.strokeStyle = CAAT.DEBUGBBCOLOR;
                            c.drawScreenBoundingBox(this, tt);
                        }

                        if ( !c.isPaused() ) {
                            c.time += time;
                        }

                        if ( CAAT.DEBUG ) {
                            this.statistics.size_total+= c.size_total;
                            this.statistics.size_active+= c.size_active;
                        }

                    }
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
            this.setModelViewMatrix(this.glEnabled);

            var cl= this.childrenList;
            var cli;
            for (var i = 0; i < cl.length; i++) {
                cli= cl[i];
                var tt = cli.time - cli.start_time;
                cli.animate(this, tt);
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
            /**
             * draw actors on scene.
             */
            if (scene.isInAnimationFrame(this.time)) {
                ctx.globalAlpha = 1;
                ctx.globalCompositeOperation = 'source-over';
                ctx.clearRect(0, 0, this.width, this.height);
                ctx.setTransform(1,0,0, 0,1,0);

                var octx = this.ctx;
                var ocrc = this.crc;

                this.ctx = this.crc = ctx;
                ctx.save();

                /**
                 * to draw an scene to an offscreen canvas, we have to:
                 *   1.- save diector's world model view matrix
                 *   2.- set no transformation on director since we want the offscreen to
                 *       be drawn 1:1.
                 *   3.- set world dirty flag, so that the scene will recalculate its matrices
                 *   4.- animate the scene
                 *   5.- paint the scene
                 *   6.- restore world model view matrix.
                 */
                var matwmv=  this.worldModelViewMatrix;
                this.worldModelViewMatrix= new CAAT.Matrix();
                this.wdirty= true;
                    scene.animate(this, scene.time);
                    if ( scene.onRenderStart ) {
                        scene.onRenderStart(scene.time);
                    }
                    scene.paintActor(this, scene.time);
                    if ( scene.onRenderEnd ) {
                        scene.onRenderEnd(scene.time);
                    }
                this.worldModelViewMatrix = matwmv;

                ctx.restore();

                this.ctx = octx;
                this.crc = ocrc;
            }
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

            if (!this.glEnabled && !navigator.browser==='iOS') {
                this.worldModelViewMatrix.transformRenderingContext(this.transitionScene.ctx);
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
        endSound : function() {
            return this.audioManager.endSound();
        },
        setSoundEffectsEnabled : function(enabled) {
            return this.audioManager.setSoundEffectsEnabled(enabled);
        },
        setMusicEnabled : function(enabled) {
            return this.audioManager.setMusicEnabled(enabled);
        },
        isMusicEnabled : function() {
            return this.audioManager.isMusicEnabled();
        },
        isSoundEffectsEnabled : function() {
            return this.audioManager.isSoundEffectsEnabled();
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

            /*
            check for massive frame time. if for example the current browser tab is minified or taken out of
            foreground, the system will account for a bit time interval. minify that impact by lowering down
            the elapsed time (virtual timelines FTW)
             */
            if ( delta > 500 ) {
                delta= 500;
            }

            if ( this.onRenderStart ) {
                this.onRenderStart(delta);
            }

            this.render(delta);

            if ( this.debugInfo ) {
                this.debugInfo(this.statistics);
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
         * Acculumate dom elements position to properly offset on-screen mouse/touch events.
         * @param node
         */
        cumulateOffset : function(node, parent, prop) {
            var left= prop+'Left';
            var top= prop+'Top';
            var x=0, y=0, style;

            while( navigator.browser!=='iOS' && node && node.style ) {
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

            //////////////
            // transformar coordenada inversamente con affine transform de director.

            var pt= new CAAT.Point( posx, posy );
            this.modelViewMatrixI= this.modelViewMatrix.getInverse();
            this.modelViewMatrixI.transformCoord(pt);
            posx= pt.x;
            posy= pt.y

            point.set(posx, posy);
            this.screenMousePoint.set(posx, posy);

        },

        __mouseDownHandler : function(e) {

            /*
            was dragging and mousedown detected, can only mean a mouseOut's been performed and on mouseOver, no
            button was presses. Then, send a mouseUp for the previos actor, and return;
             */
            if ( this.dragging && this.lastSelectedActor ) {
                this.__mouseUpHandler(e);
                return;
            }

            this.getCanvasCoord(this.mousePoint, e);
            this.isMouseDown = true;
            var lactor = this.findActorAtPosition(this.mousePoint);

            if (null !== lactor) {

                var pos = lactor.viewToModel(
                    new CAAT.Point(this.screenMousePoint.x, this.screenMousePoint.y, 0));

                lactor.mouseDown(
                    new CAAT.MouseEvent().init(
                        pos.x,
                        pos.y,
                        e,
                        lactor,
                        new CAAT.Point(
                            this.screenMousePoint.x,
                            this.screenMousePoint.y )));
            }

            this.lastSelectedActor= lactor;
        },

        __mouseUpHandler : function(e) {

            this.isMouseDown = false;
            this.getCanvasCoord(this.mousePoint, e);

            var pos= null;
            var lactor= this.lastSelectedActor;

            if (null !== lactor) {
                pos = lactor.viewToModel(
                    new CAAT.Point(this.screenMousePoint.x, this.screenMousePoint.y, 0));
                if ( lactor.actionPerformed && lactor.contains(pos.x, pos.y) ) {
                    lactor.actionPerformed(e)
                }

                lactor.mouseUp(
                    new CAAT.MouseEvent().init(
                        pos.x,
                        pos.y,
                        e,
                        lactor,
                        this.screenMousePoint,
                        this.currentScene.time));
            }

            if (!this.dragging && null !== lactor) {
                if (lactor.contains(pos.x, pos.y)) {
                    lactor.mouseClick(
                        new CAAT.MouseEvent().init(
                            pos.x,
                            pos.y,
                            e,
                            lactor,
                            this.screenMousePoint,
                            this.currentScene.time));
                }
            }

            this.dragging = false;
            this.in_=       false;
//            CAAT.setCursor('default');
        },

        __mouseMoveHandler : function(e) {
            this.getCanvasCoord(this.mousePoint, e);

            var lactor;
            var pos;

            // drag

            if (this.isMouseDown && null !== this.lastSelectedActor) {
/*
                // check for mouse move threshold.
                if (!this.dragging) {
                    if (Math.abs(this.prevMousePoint.x - this.mousePoint.x) < CAAT.DRAG_THRESHOLD_X &&
                        Math.abs(this.prevMousePoint.y - this.mousePoint.y) < CAAT.DRAG_THRESHOLD_Y) {
                        return;
                    }
                }
*/


                lactor = this.lastSelectedActor;
                pos = lactor.viewToModel(
                    new CAAT.Point(this.screenMousePoint.x, this.screenMousePoint.y, 0));

                this.dragging = true;

                var px= lactor.x;
                var py= lactor.y;
                lactor.mouseDrag(
                        new CAAT.MouseEvent().init(
                            pos.x,
                            pos.y,
                            e,
                            lactor,
                            new CAAT.Point(
                                this.screenMousePoint.x,
                                this.screenMousePoint.y),
                            this.currentScene.time));

                this.prevMousePoint.x= pos.x;
                this.prevMousePoint.y= pos.y;

                /**
                 * Element has not moved after drag, so treat it as a button.
                 */
                if ( px===lactor.x && py===lactor.y )   {

                    var contains= lactor.contains(pos.x, pos.y);

                    if (this.in_ && !contains) {
                        lactor.mouseExit(
                            new CAAT.MouseEvent().init(
                                pos.x,
                                pos.y,
                                e,
                                lactor,
                                this.screenMousePoint,
                                this.currentScene.time));
                        this.in_ = false;
                    }

                    if (!this.in_ && contains ) {
                        lactor.mouseEnter(
                            new CAAT.MouseEvent().init(
                                pos.x,
                                pos.y,
                                e,
                                lactor,
                                this.screenMousePoint,
                                this.currentScene.time));
                        this.in_ = true;
                    }
                }

                return;
            }

            // mouse move.
            this.in_= true;

            lactor = this.findActorAtPosition(this.mousePoint);

            // cambiamos de actor.
            if (lactor !== this.lastSelectedActor) {
                if (null !== this.lastSelectedActor) {

                    pos = this.lastSelectedActor.viewToModel(
                        new CAAT.Point(this.screenMousePoint.x, this.screenMousePoint.y, 0));

                    this.lastSelectedActor.mouseExit(
                        new CAAT.MouseEvent().init(
                            pos.x,
                            pos.y,
                            e,
                            this.lastSelectedActor,
                            this.screenMousePoint,
                            this.currentScene.time));
                }

                if (null !== lactor) {
                    pos = lactor.viewToModel(
                        new CAAT.Point( this.screenMousePoint.x, this.screenMousePoint.y, 0));

                    lactor.mouseEnter(
                        new CAAT.MouseEvent().init(
                            pos.x,
                            pos.y,
                            e,
                            lactor,
                            this.screenMousePoint,
                            this.currentScene.time));
                }
            }

            pos = lactor.viewToModel(
                new CAAT.Point(this.screenMousePoint.x, this.screenMousePoint.y, 0));

            if (null !== lactor) {

                lactor.mouseMove(
                    new CAAT.MouseEvent().init(
                        pos.x,
                        pos.y,
                        e,
                        lactor,
                        this.screenMousePoint,
                        this.currentScene.time));
            }

            this.lastSelectedActor = lactor;
        },

        __mouseOutHandler : function(e) {

            if (null !== this.lastSelectedActor ) {

                this.getCanvasCoord(this.mousePoint, e);
                var pos = new CAAT.Point(this.mousePoint.x, this.mousePoint.y, 0);
                this.lastSelectedActor.viewToModel(pos);

                var ev= new CAAT.MouseEvent().init(
                                pos.x,
                                pos.y,
                                e,
                                this.lastSelectedActor,
                                this.screenMousePoint,
                                this.currentScene.time);

                this.lastSelectedActor.mouseExit(ev);
                this.lastSelectedActor.mouseOut(ev);

                if ( !this.dragging ) {
                    this.lastSelectedActor = null;
                }
            } else {
                this.isMouseDown = false;
                this.in_ = false;
            }

        },

        __mouseOverHandler : function(e) {

            var lactor;
            var pos;
            this.getCanvasCoord(this.mousePoint, e);

            if ( null==this.lastSelectedActor ) {
                lactor= this.findActorAtPosition( this.mousePoint );

                if (null !== lactor) {

                    pos = lactor.viewToModel(
                        new CAAT.Point(this.screenMousePoint.x, this.screenMousePoint.y, 0));

                    var ev= new CAAT.MouseEvent().init(
                            pos.x,
                            pos.y,
                            e,
                            lactor,
                            this.screenMousePoint,
                            this.currentScene.time);

                    lactor.mouseOver(ev);
                    lactor.mouseEnter(ev);
                }

                this.lastSelectedActor= lactor;
            } else {
                var lactor= this.lastSelectedActor;
                pos = lactor.viewToModel(
                    new CAAT.Point(this.screenMousePoint.x, this.screenMousePoint.y, 0));

                var ev= new CAAT.MouseEvent().init(
                        pos.x,
                        pos.y,
                        e,
                        lactor,
                        this.screenMousePoint,
                        this.currentScene.time);

                lactor.mouseOver(ev);
                lactor.mouseEnter(ev);
                
            }
        },

        __mouseDBLClickHandler : function(e) {

            this.getCanvasCoord(this.mousePoint, e);
            if (null !== this.lastSelectedActor) {

                var pos = this.lastSelectedActor.viewToModel(
                    new CAAT.Point(this.screenMousePoint.x, this.screenMousePoint.y, 0));

                this.lastSelectedActor.mouseDblClick(
                    new CAAT.MouseEvent().init(
                            this.mousePoint.x,
                            this.mousePoint.y,
                            e,
                            this.lastSelectedActor,
                            this.screenMousePoint,
                            this.currentScene.time));
            }
        },

        /**
         * Same as mouseDown but not preventing event.
         * Will only take care of first touch.
         * @param e
         */
        __touchStartHandler : function(e) {

            e.preventDefault();
            e= e.targetTouches[0]
            this.__mouseDownHandler(e);
        },

        __touchEndHandler : function(e) {

            e.preventDefault();
            e= e.changedTouches[0];
            this.__mouseUpHandler(e);
        },

        __touchMoveHandler : function(e) {

            e.preventDefault();

            for( var i=0; i<e.targetTouches.length; i++ ) {
                if ( !i ) {
                    this.__mouseMoveHandler(e.targetTouches[i]);
                }
            }
        },

        addHandlers: function(canvas) {

            var me= this;

            canvas.addEventListener('mouseup', function(e) {
                e.preventDefault();
                me.__mouseUpHandler(e);
            }, false );

            canvas.addEventListener('mousedown', function(e) {
                e.preventDefault();
                me.__mouseDownHandler(e);
            }, false );

            canvas.addEventListener('mouseover',function(e) {
                e.preventDefault();
                me.__mouseOverHandler(e);
            }, false);

            canvas.addEventListener('mouseout',function(e) {
                e.preventDefault();
                me.__mouseOutHandler(e);
            }, false);

            canvas.addEventListener('mousemove',
            function(e) {
                e.preventDefault();
                me.__mouseMoveHandler(e);
            },
            false);

            canvas.addEventListener("dblclick", function(e) {
                e.preventDefault();
                me.__mouseDBLClickHandler(e);
            }, false);

            canvas.addEventListener("touchstart",   this.__touchStartHandler.bind(this), false);
            canvas.addEventListener("touchmove",    this.__touchMoveHandler.bind(this), false);
            canvas.addEventListener("touchend",     this.__touchEndHandler.bind(this), false);
            canvas.addEventListener("gesturestart", function(e) {
                e.preventDefault();
            }, false );
            canvas.addEventListener("gesturechange", function(e) {
                e.preventDefault();
            }, false );
        },

        enableEvents : function( onElement ) {
            CAAT.RegisterDirector(this);
            this.in_ = false;
            this.createEventHandler( onElement );
        },

        createEventHandler : function( onElement ) {
            //var canvas= this.canvas;
            this.in_ = false;
            //this.addHandlers(canvas);
            this.addHandlers( onElement );
        }
    };


    if (CAAT.__CSS__) {

        CAAT.Director.prototype.clip= true;
        CAAT.Director.prototype.glEnabled= false;

        CAAT.Director.prototype.getRenderType= function() {
            return 'CSS';
        };

        CAAT.Director.prototype.setScaleProportional= function(w,h) {

            var factor= Math.min(w/this.referenceWidth, h/this.referenceHeight);
            this.setScaleAnchored( factor, factor, 0, 0 );

            this.eventHandler.style.width=  ''+this.referenceWidth +'px';
            this.eventHandler.style.height= ''+this.referenceHeight+'px';
        };

        CAAT.Director.prototype.setBounds= function(x, y, w, h) {
            CAAT.Director.superclass.setBounds.call(this, x, y, w, h);
            for (var i = 0; i < this.scenes.length; i++) {
                this.scenes[i].setBounds(0, 0, w, h);
            }
            this.eventHandler.style.width= w+'px';
            this.eventHandler.style.height= h+'px';

            return this;
        };

        /**
         * In this DOM/CSS implementation, proxy is not taken into account since the event router is a top most
         * div in the document hierarchy (z-index 999999).
         * @param width
         * @param height
         * @param domElement
         * @param proxy
         */
        CAAT.Director.prototype.initialize= function(width, height, domElement, proxy) {

            this.timeline = new Date().getTime();
            this.domElement= domElement;
            this.style('position','absolute');
            this.style('width',''+width+'px');
            this.style('height',''+height+'px');
            this.style('overflow', 'hidden' );

            this.enableEvents(domElement);

            this.setBounds(0, 0, width, height);

            this.checkDebug();
            return this;
        };

        CAAT.Director.prototype.render= function(time) {

            this.time += time;
            this.animate(this,time);

            /**
             * draw director active scenes.
             */
            var i, l, tt;

            if ( CAAT.DEBUG ) {
                this.resetStats();
            }

            for (i = 0, l=this.childrenList.length; i < l; i++) {
                var c= this.childrenList[i];
                if (c.isInAnimationFrame(this.time)) {
                    tt = c.time - c.start_time;
                    if ( c.onRenderStart ) {
                        c.onRenderStart(tt);
                    }

                    if ( c.onRenderEnd ) {
                        c.onRenderEnd(tt);
                    }

                    if (!c.isPaused()) {
                        c.time += time;
                    }

                    if ( CAAT.DEBUG ) {
                        this.statistics.size_total+= c.size_total;
                        this.statistics.size_active+= c.size_active;
                    }

                }
            }

            this.frameCounter++;
        };

        CAAT.Director.prototype.addScene= function(scene) {
            scene.setVisible(true);
            scene.setBounds(0, 0, this.width, this.height);
            this.scenes.push(scene);
            scene.setEaseListener(this);
            if (null === this.currentScene) {
                this.setScene(0);
            }

            this.domElement.appendChild( scene.domElement );
        };

        CAAT.Director.prototype.emptyScenes= function() {
            this.scenes = [];
            this.domElement.innerHTML='';
            this.createEventHandler();
        };

        CAAT.Director.prototype.setClear= function(clear) {
            return this;
        };

        CAAT.Director.prototype.createEventHandler= function() {
            this.eventHandler= document.createElement('div');
            this.domElement.appendChild(this.eventHandler);

            this.eventHandler.style.position=   'absolute';
            this.eventHandler.style.left=       '0';
            this.eventHandler.style.top=        '0';
            this.eventHandler.style.zIndex=     999999;
            this.eventHandler.style.width=      ''+this.width+'px';
            this.eventHandler.style.height=     ''+this.height+'px';

            var canvas= this.eventHandler;
            this.in_ = false;

            this.addHandlers(canvas);
        };
    }

    extend(CAAT.Director, CAAT.ActorContainer, null);
})();