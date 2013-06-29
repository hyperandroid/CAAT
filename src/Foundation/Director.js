/**
 * See LICENSE file.
 *
 **/

CAAT.Module({

    /**
     * @name Director
     * @memberOf CAAT.Foundation
     * @extends CAAT.Foundation.ActorContainer
     *
     * @constructor
     */

    defines:"CAAT.Foundation.Director",
    aliases:["CAAT.Director"],
    extendsClass:"CAAT.Foundation.ActorContainer",
    depends:[
        "CAAT.Core.Class",
        "CAAT.Core.Constants",

        "CAAT.Foundation.ActorContainer",
        "CAAT.Module.Audio.AudioManager",
        "CAAT.Module.Runtime.BrowserInfo",
        "CAAT.Module.Debug.Debug",
        "CAAT.Math.Point",
        "CAAT.Math.Rectangle",
        "CAAT.Math.Matrix",
        "CAAT.Foundation.Timer.TimerManager",
        "CAAT.Foundation.Actor",
        "CAAT.Foundation.Scene",
        "CAAT.Event.AnimationLoop",
        "CAAT.Event.Input",
        "CAAT.Event.KeyEvent",
        "CAAT.Event.MouseEvent",
        "CAAT.Event.TouchEvent",

        "CAAT.WebGL.Program",
        "CAAT.WebGL.ColorProgram",
        "CAAT.WebGL.TextureProgram",
        "CAAT.WebGL.GLU",

        "CAAT.Module.TexturePacker.TexturePageManager"
    ],
    constants:{
        /**
         * @lends  CAAT.Foundation.Director
         */

        /** @const @type {number} */ RENDER_MODE_CONTINUOUS:1, // redraw every frame
        /** @const @type {number} */ RENDER_MODE_DIRTY:2, // suitable for evented CAAT.

        /** @const @type {number} */ CLEAR_DIRTY_RECTS:1,
        /** @const @type {number} */ CLEAR_ALL:true,
        /** @const @type {number} */ CLEAR_NONE:false,

        /** @const @type {number} */ RESIZE_NONE:1,
        /** @const @type {number} */ RESIZE_WIDTH:2,
        /** @const @type {number} */ RESIZE_HEIGHT:4,
        /** @const @type {number} */ RESIZE_BOTH:8,
        /** @const @type {number} */ RESIZE_PROPORTIONAL:16
    },
    extendsWith:function () {
        return {

            /**
             * @lends  CAAT.Foundation.Director.prototype
             */

            __init:function () {
                this.__super();

                this.browserInfo = CAAT.Module.Runtime.BrowserInfo;
                this.audioManager = new CAAT.Module.Audio.AudioManager().initialize(8);
                this.scenes = [];
                this.imagesCache= [];

                // input related variables initialization
                this.mousePoint = new CAAT.Math.Point(0, 0, 0);
                this.prevMousePoint = new CAAT.Math.Point(0, 0, 0);
                this.screenMousePoint = new CAAT.Math.Point(0, 0, 0);
                this.isMouseDown = false;
                this.lastSelectedActor = null;
                this.dragging = false;

                this.cDirtyRects = [];
                this.sDirtyRects = [];
                this.dirtyRects = [];
                for (var i = 0; i < 64; i++) {
                    this.dirtyRects.push(new CAAT.Math.Rectangle());
                }
                this.dirtyRectsIndex = 0;
                this.touches = {};

                this.timerManager = new CAAT.Foundation.Timer.TimerManager();
                this.__map= {};

                return this;
            },

            /**
             * flag indicating debug mode. It will draw affedted screen areas.
             * @type {boolean}
             */
            debug:false,

            /**
             * Set CAAT render mode. Right now, this takes no effect.
             */
            renderMode:CAAT.Foundation.Director.RENDER_MODE_CONTINUOUS,

            /**
             * This method will be called before rendering any director scene.
             * Use this method to calculate your physics for example.
             * @private
             */
            onRenderStart:null,

            /**
             * This method will be called after rendering any director scene.
             * Use this method to clean your physics forces for example.
             * @private
             */
            onRenderEnd:null,

            // input related attributes
            /**
             * mouse coordinate related to canvas 0,0 coord.
             * @private
             */
            mousePoint:null,

            /**
             * previous mouse position cache. Needed for drag events.
             * @private
             */
            prevMousePoint:null,

            /**
             * screen mouse coordinates.
             * @private
             */
            screenMousePoint:null,

            /**
             * is the left mouse button pressed ?.
             * Needed to handle dragging.
             */
            isMouseDown:false,

            /**
             * director's last actor receiving input.
             * Needed to set capture for dragging events.
             */
            lastSelectedActor:null,

            /**
             * is input in drag mode ?
             */
            dragging:false,

            // other attributes

            /**
             * This director scene collection.
             * @type {Array.<CAAT.Foundation.Scene>}
             */
            scenes:null,

            /**
             * The current Scene. This and only this will receive events.
             */
            currentScene:null,

            /**
             * The canvas the Director draws on.
             * @private
             */
            canvas:null,

            /**
             * This director´s canvas rendering context.
             */
            ctx:null,

            /**
             * director time.
             * @private
             */
            time:0,

            /**
             * global director timeline.
             * @private
             */
            timeline:0,

            /**
             * An array of JSON elements of the form { id:string, image:Image }
             */
            imagesCache:null,

            /**
             * this director´s audio manager.
             * @private
             */
            audioManager:null,

            /**
             * Clear screen strategy:
             * CAAT.Foundation.Director.CLEAR_NONE : director won´t clear the background.
             * CAAT.Foundation.Director.CLEAR_DIRTY_RECTS : clear only affected actors screen area.
             * CAAT.Foundation.Director.CLEAR_ALL : clear the whole canvas object.
             */
            clear: CAAT.Foundation.Director.CLEAR_ALL,

            /**
             * if CAAT.CACHE_SCENE_ON_CHANGE is set, this scene will hold a cached copy of the exiting scene.
             * @private
             */
            transitionScene:null,

            /**
             * Some browser related information.
             */
            browserInfo:null,

            /**
             * 3d context
             * @private
             */
            gl:null,

            /**
             * is WebGL enabled as renderer ?
             * @private
             */
            glEnabled:false,

            /**
             * if webGL is on, CAAT will texture pack all images transparently.
             * @private
             */
            glTextureManager:null,

            /**
             * The only GLSL program for webGL
             * @private
             */
            glTtextureProgram:null,
            glColorProgram:null,

            /**
             * webGL projection matrix
             * @private
             */
            pMatrix:null, // projection matrix

            /**
             * webGL vertex array
             * @private
             */
            coords:null, // Float32Array

            /**
             * webGL vertex indices.
             * @private
             */
            coordsIndex:0,

            /**
             * webGL uv texture indices
             * @private
             */
            uv:null,
            uvIndex:0,

            /**
             * draw tris front_to_back or back_to_front ?
             * @private
             */
            front_to_back:false,

            /**
             * statistics object
             */
            statistics:{
                size_total:0,
                size_active:0,
                size_dirtyRects:0,
                draws:0,
                size_discarded_by_dirty_rects:0
            },

            /**
             * webGL current texture page. This minimizes webGL context changes.
             * @private
             */
            currentTexturePage:0,

            /**
             * webGL current shader opacity.
             * BUGBUG: change this by vertex colors.
             * @private
             */
            currentOpacity:1,

            /**
             * if CAAT.NO_RAF is set (no request animation frame), this value is the setInterval returned
             * id.
             * @private
             */
            intervalId:null,

            /**
             * Rendered frames counter.
             */
            frameCounter:0,

            /**
             * Window resize strategy.
             * see CAAT.Foundation.Director.RESIZE_* constants.
             * @private
             */
            resize:1,

            /**
             * Callback when the window is resized.
             */
            onResizeCallback:null,

            /**
             * Calculated gesture event scale.
             * @private
             */
            __gestureScale:0,

            /**
             * Calculated gesture event rotation.
             * @private
             */
            __gestureRotation:0,

            /**
             * Dirty rects cache.
             * An array of CAAT.Math.Rectangle object.
             * @private
             */
            dirtyRects:null, // dirty rects cache.

            /**
             * current dirty rects.
             * @private
             */
            cDirtyRects:null, // dirty rects cache.

            /**
             * Currently used dirty rects.
             * @private
             */
            sDirtyRects:null, // scheduled dirty rects.

            /**
             * Number of currently allocated dirty rects.
             * @private
             */
            dirtyRectsIndex:0,

            /**
             * Dirty rects enabled ??
             * @private
             */
            dirtyRectsEnabled:false,

            /**
             * Number of dirty rects.
             * @private
             */
            nDirtyRects:0,

            /**
             * Dirty rects count debug info.
             * @private
             */
            drDiscarded:0, // discarded by dirty rects.

            /**
             * Is this director stopped ?
             */
            stopped:false, // is stopped, this director will do nothing.

            /**
             * currently unused.
             * Intended to run caat in evented mode.
             * @private
             */
            needsRepaint:false,

            /**
             * Touches information. Associate touch.id with an actor and original touch info.
             * @private
             */
            touches:null,

            /**
             * Director´s timer manager.
             * Each scene has a timerManager as well.
             * The difference is the scope. Director´s timers will always be checked whereas scene´ timers
             * will only be scheduled/checked when the scene is director´ current scene.
             * @private
             */
            timerManager:null,

            /**
             * Retina display deicePixels/backingStorePixels ratio
             * @private
             */
            SCREEN_RATIO : 1,

            __map : null,

            clean:function () {
                this.scenes = null;
                this.currentScene = null;
                this.imagesCache = null;
                this.audioManager = null;
                this.isMouseDown = false;
                this.lastSelectedActor = null;
                this.dragging = false;
                this.__gestureScale = 0;
                this.__gestureRotation = 0;
                this.dirty = true;
                this.dirtyRects = null;
                this.cDirtyRects = null;
                this.dirtyRectsIndex = 0;
                this.dirtyRectsEnabled = false;
                this.nDirtyRects = 0;
                this.onResizeCallback = null;
                this.__map= {};
                return this;
            },

            cancelPlay : function(id) {
                return this.audioManager.cancelPlay(id);
            },

            cancelPlayByChannel : function(audioObject) {
                return this.audioManager.cancelPlayByChannel(audioObject);
            },

            setAudioFormatExtensions : function( extensions ) {
                this.audioManager.setAudioFormatExtensions(extensions);
                return this;
            },

            setValueForKey : function( key, value ) {
                this.__map[key]= value;
                return this;
            },

            getValueForKey : function( key ) {
                return this.__map[key];
            },

            createTimer:function (startTime, duration, callback_timeout, callback_tick, callback_cancel) {
                return this.timerManager.createTimer(startTime, duration, callback_timeout, callback_tick, callback_cancel, this);
            },

            requestRepaint:function () {
                this.needsRepaint = true;
            },

            getCurrentScene:function () {
                return this.currentScene;
            },

            checkDebug:function () {
                if (!navigator.isCocoonJS && CAAT.DEBUG) {
                    var dd = new CAAT.Module.Debug.Debug().initialize(this.width, 60);
                    this.debugInfo = dd.debugInfo.bind(dd);
                }
            },
            getRenderType:function () {
                return this.glEnabled ? 'WEBGL' : 'CANVAS';
            },
            windowResized:function (w, h) {
                var c = CAAT.Foundation.Director;
                switch (this.resize) {
                    case c.RESIZE_WIDTH:
                        this.setBounds(0, 0, w, this.height);
                        break;
                    case c.RESIZE_HEIGHT:
                        this.setBounds(0, 0, this.width, h);
                        break;
                    case c.RESIZE_BOTH:
                        this.setBounds(0, 0, w, h);
                        break;
                    case c.RESIZE_PROPORTIONAL:
                        this.setScaleProportional(w, h);
                        break;
                }

                if (this.glEnabled) {
                    this.glReset();
                }

                if (this.onResizeCallback) {
                    this.onResizeCallback(this, w, h);
                }

            },
            setScaleProportional:function (w, h) {

                var factor = Math.min(w / this.referenceWidth, h / this.referenceHeight);

                this.canvas.width = this.referenceWidth * factor;
                this.canvas.height = this.referenceHeight * factor;
                this.ctx = this.canvas.getContext(this.glEnabled ? 'experimental-webgl' : '2d');

                this.__setupRetina();

                this.setScaleAnchored(factor * this.scaleX, factor * this.scaleY, 0, 0);
//                this.setScaleAnchored(factor, factor, 0, 0);

                if (this.glEnabled) {
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
            enableResizeEvents:function (mode, onResizeCallback) {
                var dd= CAAT.Foundation.Director;
                if (mode === dd.RESIZE_BOTH || mode === dd.RESIZE_WIDTH || mode === dd.RESIZE_HEIGHT || mode === dd.RESIZE_PROPORTIONAL) {
                    this.referenceWidth = this.width;
                    this.referenceHeight = this.height;
                    this.resize = mode;
                    CAAT.registerResizeListener(this);
                    this.onResizeCallback = onResizeCallback;
                    this.windowResized(window.innerWidth, window.innerHeight);
                } else {
                    CAAT.unregisterResizeListener(this);
                    this.onResizeCallback = null;
                }

                return this;
            },

            __setupRetina : function() {

                if ( CAAT.RETINA_DISPLAY_ENABLED ) {

                    // The world is full of opensource awesomeness.
                    //
                    // Source: http://www.html5rocks.com/en/tutorials/canvas/hidpi/
                    //
                    var devicePixelRatio= CAAT.Module.Runtime.BrowserInfo.DevicePixelRatio;
                    var backingStoreRatio = this.ctx.webkitBackingStorePixelRatio ||
                                            this.ctx.mozBackingStorePixelRatio ||
                                            this.ctx.msBackingStorePixelRatio ||
                                            this.ctx.oBackingStorePixelRatio ||
                                            this.ctx.backingStorePixelRatio ||
                                            1;

                    var ratio = devicePixelRatio / backingStoreRatio;

                    if (devicePixelRatio !== backingStoreRatio) {

                        var oldWidth = this.canvas.width;
                        var oldHeight = this.canvas.height;

                        this.canvas.width = oldWidth * ratio;
                        this.canvas.height = oldHeight * ratio;

                        this.canvas.style.width = oldWidth + 'px';
                        this.canvas.style.height = oldHeight + 'px';

                        this.setScaleAnchored( ratio, ratio, 0, 0 );
                    } else {
                        this.setScaleAnchored( 1, 1, 0, 0 );
                    }

                    this.SCREEN_RATIO= ratio;
                } else {
                    this.setScaleAnchored( 1, 1, 0, 0 );
                }

                for (var i = 0; i < this.scenes.length; i++) {
                    this.scenes[i].setBounds(0, 0, this.width, this.height);
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
            setBounds:function (x, y, w, h) {

                CAAT.Foundation.Director.superclass.setBounds.call(this, x, y, w, h);

                if ( this.canvas.width!==w ) {
                    this.canvas.width = w;
                }

                if ( this.canvas.height!==h ) {
                    this.canvas.height = h;
                }

                this.ctx = this.canvas.getContext(this.glEnabled ? 'experimental-webgl' : '2d');

                this.__setupRetina();

                if (this.glEnabled) {
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
            initialize:function (width, height, canvas, proxy) {
                if ( typeof canvas!=="undefined" ) {
                    if ( isString(canvas) ) {
                        canvas= document.getElementById(canvas);
                    } else if ( !(canvas instanceof HTMLCanvasElement ) ) {
                        console.log("Canvas is a: "+canvas+" ???");
                    }
                }

                if (!canvas) {
                    canvas = document.createElement('canvas');
                    document.body.appendChild(canvas);
                }

                this.canvas = canvas;

                if (typeof proxy === 'undefined') {
                    proxy = canvas;
                }

                this.setBounds(0, 0, width, height);
                this.enableEvents(proxy);

                this.timeline = new Date().getTime();

                // transition scene
                if (CAAT.CACHE_SCENE_ON_CHANGE) {
                    this.transitionScene = new CAAT.Foundation.Scene().setBounds(0, 0, width, height);
                    var transitionCanvas = document.createElement('canvas');
                    transitionCanvas.width = width;
                    transitionCanvas.height = height;
                    var transitionImageActor = new CAAT.Foundation.Actor().setBackgroundImage(transitionCanvas);
                    this.transitionScene.ctx = transitionCanvas.getContext('2d');
                    this.transitionScene.addChildImmediately(transitionImageActor);
                    this.transitionScene.setEaseListener(this);
                }

                this.checkDebug();

                return this;
            },
            glReset:function () {
                this.pMatrix = CAAT.WebGL.GLU.makeOrtho(0, this.referenceWidth, this.referenceHeight, 0, -1, 1);
                this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
                this.glColorProgram.setMatrixUniform(this.pMatrix);
                this.glTextureProgram.setMatrixUniform(this.pMatrix);
                this.gl.viewportWidth = this.canvas.width;
                this.gl.viewportHeight = this.canvas.height;
            },
            /**
             * Experimental.
             * Initialize a gl enabled director.
             */
            initializeGL:function (width, height, canvas, proxy) {

                if (!canvas) {
                    canvas = document.createElement('canvas');
                    document.body.appendChild(canvas);
                }

                canvas.width = width;
                canvas.height = height;

                if (typeof proxy === 'undefined') {
                    proxy = canvas;
                }

                this.referenceWidth = width;
                this.referenceHeight = height;

                var i;

                try {
                    this.gl = canvas.getContext("experimental-webgl"/*, {antialias: false}*/);
                    this.gl.viewportWidth = width;
                    this.gl.viewportHeight = height;
                    CAAT.GLRENDER = true;
                } catch (e) {
                }

                if (this.gl) {
                    this.canvas = canvas;
                    this.setBounds(0, 0, width, height);

                    this.enableEvents(canvas);
                    this.timeline = new Date().getTime();

                    this.glColorProgram = new CAAT.WebGL.ColorProgram(this.gl).create().initialize();
                    this.glTextureProgram = new CAAT.WebGL.TextureProgram(this.gl).create().initialize();
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
            createScene:function () {
                var scene = new CAAT.Scene();
                this.addScene(scene);
                return scene;
            },
            setImagesCache:function (imagesCache, tpW, tpH) {

                if (!imagesCache || !imagesCache.length ) {
                    return this;
                }

                var i;

                if (null !== this.glTextureManager) {
                    this.glTextureManager.deletePages();
                    this.glTextureManager = null;
                }

                // delete previous image identifiers
                if (this.imagesCache) {
                    var ids = [];
                    for (i = 0; i < this.imagesCache.length; i++) {
                        ids.push(this.imagesCache[i].id);
                    }

                    for (i = 0; i < ids.length; i++) {
                        delete this.imagesCache[ ids[i] ];
                    }
                }

                this.imagesCache = imagesCache;

                if (imagesCache) {
                    for (i = 0; i < imagesCache.length; i++) {
                        this.imagesCache[ imagesCache[i].id ] = imagesCache[i].image;
                    }
                }

                this.tpW = tpW || 2048;
                this.tpH = tpH || 2048;

                this.updateGLPages();

                return this;
            },
            updateGLPages:function () {
                if (this.glEnabled) {

                    this.glTextureManager = new CAAT.Module.TexturePacker.TexturePageManager();
                    this.glTextureManager.createPages(this.gl, this.tpW, this.tpH, this.imagesCache);

                    this.currentTexturePage = this.glTextureManager.pages[0];
                    this.glTextureProgram.setTexture(this.currentTexturePage.texture);
                }
            },
            setGLTexturePage:function (tp) {
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
             * @param image {Image|HTMLCanvasElement} image to add to cache
             * @param noUpdateGL {!boolean} unless otherwise stated, the director will
             *  try to recreate the texture pages.
             */
            addImage:function (id, image, noUpdateGL) {
                if (this.getImage(id)) {
//                    for (var i = 0; i < this.imagesCache.length; i++) {
                    for( var i in this.imagesCache ) {
                        if (this.imagesCache[i].id === id) {
                            this.imagesCache[i].image = image;
                            break;
                        }
                    }
                    this.imagesCache[ id ] = image;
                } else {
                    this.imagesCache.push({ id:id, image:image });
                    this.imagesCache[id] = image;
                }

                if (!!!noUpdateGL) {
                    this.updateGLPages();
                }
            },
            deleteImage:function (id, noUpdateGL) {
                for (var i = 0; i < this.imagesCache.length; i++) {
                    if (this.imagesCache[i].id === id) {
                        delete this.imagesCache[id];
                        this.imagesCache.splice(i, 1);
                        break;
                    }
                }
                if (!!!noUpdateGL) {
                    this.updateGLPages();
                }
            },
            setGLCurrentOpacity:function (opacity) {
                this.currentOpacity = opacity;
                this.glTextureProgram.setAlpha(opacity);
            },
            /**
             * Render buffered elements.
             * @param vertex
             * @param coordsIndex
             * @param uv
             */
            glRender:function (vertex, coordsIndex, uv) {

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
            glFlush:function () {
                if (this.coordsIndex !== 0) {
                    this.glRender(this.coords, this.coordsIndex, this.uv);
                }
                this.coordsIndex = 0;
                this.uvIndex = 0;

                this.statistics.draws++;
            },

            findActorAtPosition:function (point) {

                // z-order
                var cl = this.childrenList;
                for (var i = cl.length - 1; i >= 0; i--) {
                    var child = this.childrenList[i];

                    var np = new CAAT.Math.Point(point.x, point.y, 0);
                    var contained = child.findActorAtPosition(np);
                    if (null !== contained) {
                        return contained;
                    }
                }

                return this;
            },

            /**
             *
             * Reset statistics information.
             *
             * @private
             */
            resetStats:function () {
                this.statistics.size_total = 0;
                this.statistics.size_active = 0;
                this.statistics.draws = 0;
                this.statistics.size_discarded_by_dirty_rects = 0;
            },

            /**
             * This is the entry point for the animation system of the Director.
             * The director is fed with the elapsed time value to maintain a virtual timeline.
             * This virtual timeline will provide each Scene with its own virtual timeline, and will only
             * feed time when the Scene is the current Scene, or is being switched.
             *
             * If dirty rectangles are enabled and canvas is used for rendering, the dirty rectangles will be
             * set up as a single clip area.
             *
             * @param time {number} integer indicating the elapsed time between two consecutive frames of the
             * Director.
             */
            render:function (time) {

                if (this.currentScene && this.currentScene.isPaused()) {
                    return;
                }

                this.time += time;

                for (i = 0, l = this.childrenList.length; i < l; i++) {
                    var c = this.childrenList[i];
                    if (c.isInAnimationFrame(this.time) && !c.isPaused()) {
                        var tt = c.time - c.start_time;
                        c.timerManager.checkTimers(tt);
                        c.timerManager.removeExpiredTimers();
                    }
                }


                this.animate(this, this.time);

                if (!navigator.isCocoonJS && CAAT.DEBUG) {
                    this.resetStats();
                }

                /**
                 * draw director active scenes.
                 */
                var ne = this.childrenList.length;
                var i, tt, c;
                var ctx = this.ctx;

                if (this.glEnabled) {

                    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
                    this.coordsIndex = 0;
                    this.uvIndex = 0;

                    for (i = 0; i < ne; i++) {
                        c = this.childrenList[i];
                        if (c.isInAnimationFrame(this.time)) {
                            tt = c.time - c.start_time;
                            if (c.onRenderStart) {
                                c.onRenderStart(tt);
                            }
                            c.paintActorGL(this, tt);
                            if (c.onRenderEnd) {
                                c.onRenderEnd(tt);
                            }

                            if (!c.isPaused()) {
                                c.time += time;
                            }

                            if (!navigator.isCocoonJS && CAAT.DEBUG) {
                                this.statistics.size_total += c.size_total;
                                this.statistics.size_active += c.size_active;
                            }

                        }
                    }

                    this.glFlush();

                } else {
                    ctx.globalAlpha = 1;
                    ctx.globalCompositeOperation = 'source-over';

                    ctx.save();
                    if (this.dirtyRectsEnabled) {
                        this.modelViewMatrix.transformRenderingContext(ctx);

                        if (!CAAT.DEBUG_DIRTYRECTS) {
                            ctx.beginPath();
                            this.nDirtyRects = 0;
                            var dr = this.cDirtyRects;
                            for (i = 0; i < dr.length; i++) {
                                var drr = dr[i];
                                if (!drr.isEmpty()) {
                                    ctx.rect(drr.x | 0, drr.y | 0, 1 + (drr.width | 0), 1 + (drr.height | 0));
                                    this.nDirtyRects++;
                                }
                            }
                            ctx.clip();
                        } else {
                            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                        }

                    } else if (this.clear === CAAT.Foundation.Director.CLEAR_ALL) {
                        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    }

                    for (i = 0; i < ne; i++) {
                        c = this.childrenList[i];

                        if (c.isInAnimationFrame(this.time)) {
                            tt = c.time - c.start_time;
                            ctx.save();

                            if (c.onRenderStart) {
                                c.onRenderStart(tt);
                            }

                            if (!CAAT.DEBUG_DIRTYRECTS && this.dirtyRectsEnabled) {
                                if (this.nDirtyRects) {
                                    c.paintActor(this, tt);
                                }
                            } else {
                                c.paintActor(this, tt);
                            }

                            if (c.onRenderEnd) {
                                c.onRenderEnd(tt);
                            }
                            ctx.restore();

                            if (CAAT.DEBUGAABB) {
                                ctx.globalAlpha = 1;
                                ctx.globalCompositeOperation = 'source-over';
                                this.modelViewMatrix.transformRenderingContextSet(ctx);
                                c.drawScreenBoundingBox(this, tt);
                            }

                            if (!c.isPaused()) {
                                c.time += time;
                            }

                            if (!navigator.isCocoonJS && CAAT.DEBUG) {
                                this.statistics.size_total += c.size_total;
                                this.statistics.size_active += c.size_active;
                                this.statistics.size_dirtyRects = this.nDirtyRects;
                            }

                        }
                    }

                    if (this.nDirtyRects > 0 && (!navigator.isCocoonJS && CAAT.DEBUG) && CAAT.DEBUG_DIRTYRECTS) {
                        ctx.beginPath();
                        this.nDirtyRects = 0;
                        var dr = this.cDirtyRects;
                        for (i = 0; i < dr.length; i++) {
                            var drr = dr[i];
                            if (!drr.isEmpty()) {
                                ctx.rect(drr.x | 0, drr.y | 0, 1 + (drr.width | 0), 1 + (drr.height | 0));
                                this.nDirtyRects++;
                            }
                        }

                        ctx.clip();
                        ctx.fillStyle = 'rgba(160,255,150,.4)';
                        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                    }

                    ctx.restore();
                }

                this.frameCounter++;
            },

            inDirtyRect:function (actor) {

                if (!this.dirtyRectsEnabled || CAAT.DEBUG_DIRTYRECTS) {
                    return true;
                }

                var dr = this.cDirtyRects;
                var i;
                var aabb = actor.AABB;

                for (i = 0; i < dr.length; i++) {
                    if (dr[i].intersects(aabb)) {
                        return true;
                    }
                }

                this.statistics.size_discarded_by_dirty_rects += actor.size_total;
                return false;
            },

            /**
             * A director is a very special kind of actor.
             * Its animation routine simple sets its modelViewMatrix in case some transformation's been
             * applied.
             * No behaviors are allowed for Director instances.
             * @param director {CAAT.Director} redundant reference to CAAT.Director itself
             * @param time {number} director time.
             */
            animate:function (director, time) {

                this.timerManager.checkTimers(time);

                this.setModelViewMatrix(this);
                this.modelViewMatrix.getInverse(this.modelViewMatrixI);
                this.setScreenBounds();

                this.dirty = false;
                this.invalid = false;
                this.dirtyRectsIndex = -1;
                this.cDirtyRects= [];

                var cl = this.childrenList;
                var cli;
                var i, l;


                if (this.dirtyRectsEnabled) {
                    var sdr = this.sDirtyRects;
                    if (sdr.length) {
                        for (i = 0, l = sdr.length; i < l; i++) {
                            this.addDirtyRect(sdr[i]);
                        }
                        this.sDirtyRects = [];
                    }
                }

                for (i = 0; i < cl.length; i++) {
                    cli = cl[i];
                    var tt = cli.time - cli.start_time;
                    cli.animate(this, tt);
                }

                this.timerManager.removeExpiredTimers();

                return this;
            },

            /**
             * This method is used when asynchronous operations must produce some dirty rectangle painting.
             * This means that every operation out of the regular CAAT loop must add dirty rect operations
             * by calling this method.
             * For example setVisible() and remove.
             * @param rectangle
             */
            scheduleDirtyRect:function (rectangle) {
                this.sDirtyRects.push(rectangle);
            },
            /**
             * Add a rectangle to the list of dirty screen areas which should be redrawn.
             * This is the opposite method to clear the whole screen and repaint everything again.
             * Despite i'm not very fond of dirty rectangles because it needs some extra calculations, this
             * procedure has shown to be speeding things up under certain situations. Nevertheless it doesn't or
             * even lowers performance under others, so it is a developer choice to activate them via a call to
             * setClear( CAAT.Director.CLEAR_DIRTY_RECTS ).
             *
             * This function, not only tracks a list of dirty rectangles, but tries to optimize the list. Overlapping
             * rectangles will be removed and intersecting ones will be unioned.
             *
             * Before calling this method, check if this.dirtyRectsEnabled is true.
             *
             * @param rectangle {CAAT.Rectangle}
             */
            addDirtyRect:function (rectangle) {

                if (rectangle.isEmpty()) {
                    return;
                }

                var i, dr, j, drj;
                var cdr = this.cDirtyRects;

                for (i = 0; i < cdr.length; i++) {
                    dr = cdr[i];
                    if (!dr.isEmpty() && dr.intersects(rectangle)) {
                        var intersected = true;
                        while (intersected) {
                            dr.unionRectangle(rectangle);

                            for (j = 0; j < cdr.length; j++) {
                                if (j !== i) {
                                    drj = cdr[j];
                                    if (!drj.isEmpty() && drj.intersects(dr)) {
                                        dr.unionRectangle(drj);
                                        drj.setEmpty();
                                        break;
                                    }
                                }
                            }

                            if (j == cdr.length) {
                                intersected = false;
                            }
                        }

                        for (j = 0; j < cdr.length; j++) {
                            if (cdr[j].isEmpty()) {
                                cdr.splice(j, 1);
                            }
                        }

                        return;
                    }
                }

                this.dirtyRectsIndex++;

                if (this.dirtyRectsIndex >= this.dirtyRects.length) {
                    for (i = 0; i < 32; i++) {
                        this.dirtyRects.push(new CAAT.Math.Rectangle());
                    }
                }

                var r = this.dirtyRects[ this.dirtyRectsIndex ];

                r.x = rectangle.x;
                r.y = rectangle.y;
                r.x1 = rectangle.x1;
                r.y1 = rectangle.y1;
                r.width = rectangle.width;
                r.height = rectangle.height;

                this.cDirtyRects.push(r);

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
             * @param scene {CAAT.Foundation.Scene} the scene to draw offscreen.
             */
            renderToContext:function (ctx, scene) {
                /**
                 * draw actors on scene.
                 */
                if (scene.isInAnimationFrame(this.time)) {
                    ctx.setTransform(1, 0, 0, 1, 0, 0);

                    ctx.globalAlpha = 1;
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.clearRect(0, 0, this.width, this.height);

                    var octx = this.ctx;

                    this.ctx = ctx;
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
                    var matmv = this.modelViewMatrix;
                    var matwmv = this.worldModelViewMatrix;
                    this.worldModelViewMatrix = new CAAT.Math.Matrix();
                    this.modelViewMatrix = this.worldModelViewMatrix;
                    this.wdirty = true;
                    scene.animate(this, scene.time);
                    if (scene.onRenderStart) {
                        scene.onRenderStart(scene.time);
                    }
                    scene.paintActor(this, scene.time);
                    if (scene.onRenderEnd) {
                        scene.onRenderEnd(scene.time);
                    }
                    this.worldModelViewMatrix = matwmv;
                    this.modelViewMatrix = matmv;

                    ctx.restore();

                    this.ctx = octx;
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
             * @param scene {CAAT.Foundation.Scene}
             */
            addScene:function (scene) {
                scene.setBounds(0, 0, this.width, this.height);
                this.scenes.push(scene);
                scene.setEaseListener(this);
                if (null === this.currentScene) {
                    this.setScene(0);
                }
            },

            /**
             * Private
             * Gets a contained Scene index on this Director.
             *
             * @param scene a CAAT.Foundation.Scene object instance.
             *
             * @return {number}
             */
            findScene:function (scene) {
                var sl = this.scenes;
                var i;
                var len = sl.length;

                for (i = 0; i < len; i++) {
                    if (sl[i] === scene) {
                        return i;
                    }
                }
                return -1;
            },

            /**
             * Private
             * Removes a scene from this director.
             *
             * @param scene a CAAT.Foundation.Scene object instance or scene index.
             *
             * @return {number}
             */
            removeScene: function(scene) {
                if (typeof scene == 'number') {
                    this.scenes.splice(scene, 1);
                } else {
                    var idx = this.findScene(scene);
                    if (idx > 0) {
                        this.scenes.splice(idx, 1);
                    }
                }
            },
            /**
             * Get the number of scenes contained in the Director.
             * @return {number} the number of scenes contained in the Director.
             */
            getNumScenes:function () {
                return this.scenes.length;
            },
            /**
             * This method offers full control over the process of switching between any given two Scenes.
             * To apply this method, you must specify the type of transition to apply for each Scene and
             * the anchor to keep the Scene pinned at.
             * <p>
             * The type of transition will be one of the following values defined in CAAT.Foundation.Scene.prototype:
             * <ul>
             *  <li>EASE_ROTATION
             *  <li>EASE_SCALE
             *  <li>EASE_TRANSLATION
             * </ul>
             *
             * <p>
             * The anchor will be any of these values defined in CAAT.Foundation.Actor:
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
             * @param interpolatorIn CAAT.Behavior.Interpolator object to apply to entering scene.
             * @param interpolatorOut CAAT.Behavior.Interpolator object to apply to exiting scene.
             */
            easeInOut:function (inSceneIndex, typein, anchorin, outSceneIndex, typeout, anchorout, time, alpha, interpolatorIn, interpolatorOut) {

                if (inSceneIndex === this.getCurrentSceneIndex()) {
                    return;
                }

                var ssin = this.scenes[ inSceneIndex ];
                var sout = this.scenes[ outSceneIndex ];

                if (!CAAT.__CSS__ && CAAT.CACHE_SCENE_ON_CHANGE) {
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

                if (typein === CAAT.Foundation.Scene.EASE_ROTATION) {
                    ssin.easeRotationIn(time, alpha, anchorin, interpolatorIn);
                } else if (typein === CAAT.Foundation.Scene.EASE_SCALE) {
                    ssin.easeScaleIn(0, time, alpha, anchorin, interpolatorIn);
                } else {
                    ssin.easeTranslationIn(time, alpha, anchorin, interpolatorIn);
                }

                if (typeout === CAAT.Foundation.Scene.EASE_ROTATION) {
                    sout.easeRotationOut(time, alpha, anchorout, interpolatorOut);
                } else if (typeout === CAAT.Foundation.Scene.EASE_SCALE) {
                    sout.easeScaleOut(0, time, alpha, anchorout, interpolatorOut);
                } else {
                    sout.easeTranslationOut(time, alpha, anchorout, interpolatorOut);
                }

                this.childrenList = [];

                sout.goOut(ssin);
                ssin.getIn(sout);

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
            easeInOutRandom:function (inIndex, outIndex, time, alpha) {

                var pin = Math.random();
                var pout = Math.random();

                var typeIn;
                var interpolatorIn;

                if (pin < 0.33) {
                    typeIn = CAAT.Foundation.Scene.EASE_ROTATION;
                    interpolatorIn = new CAAT.Behavior.Interpolator().createExponentialInOutInterpolator(4);
                } else if (pin < 0.66) {
                    typeIn = CAAT.Foundation.Scene.EASE_SCALE;
                    interpolatorIn = new CAAT.Behavior.Interpolator().createElasticOutInterpolator(1.1, 0.4);
                } else {
                    typeIn = CAAT.Foundation.Scene.EASE_TRANSLATE;
                    interpolatorIn = new CAAT.Behavior.Interpolator().createBounceOutInterpolator();
                }

                var typeOut;
                var interpolatorOut;

                if (pout < 0.33) {
                    typeOut = CAAT.Foundation.Scene.EASE_ROTATION;
                    interpolatorOut = new CAAT.Behavior.Interpolator().createExponentialInOutInterpolator(4);
                } else if (pout < 0.66) {
                    typeOut = CAAT.Foundation.Scene.EASE_SCALE;
                    interpolatorOut = new CAAT.Behavior.Interpolator().createExponentialOutInterpolator(4);
                } else {
                    typeOut = CAAT.Foundation.Scene.EASE_TRANSLATE;
                    interpolatorOut = new CAAT.Behavior.Interpolator().createBounceOutInterpolator();
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
            easeIn:function (inSceneIndex, type, time, alpha, anchor, interpolator) {
                var sin = this.scenes[ inSceneIndex ];
                if (type === CAAT.Foundation.Scene.EASE_ROTATION) {
                    sin.easeRotationIn(time, alpha, anchor, interpolator);
                } else if (type === CAAT.Foundation.Scene.EASE_SCALE) {
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
             * @param scene {number or scene object} an integer indicating the index of the target Scene or the target Scene itself
             * to be shown.
             */
            setScene:function (scene) {
                var sceneIndex = (typeof scene == 'number') ? scene : this.findScene(scene);
                var sin = this.scenes[ sceneIndex ];
                this.childrenList = [];
                this.addChild(sin);
                this.currentScene = sin;

                sin.setExpired(false);
                sin.mouseEnabled = true;
                sin.resetTransform();
                sin.setLocation(0, 0);
                sin.alpha = 1;

                sin.getIn();
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
            switchToScene:function (iNewSceneIndex, time, alpha, transition) {
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
            switchToPrevScene:function (time, alpha, transition) {

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
            switchToNextScene:function (time, alpha, transition) {

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
            mouseEnter:function (mouseEvent) {
            },
            mouseExit:function (mouseEvent) {
            },
            mouseMove:function (mouseEvent) {
            },
            mouseDown:function (mouseEvent) {
            },
            mouseUp:function (mouseEvent) {
            },
            mouseDrag:function (mouseEvent) {
            },
            /**
             * Scene easing listener. Notifies scenes when they're about to be activated (set as current
             * director's scene).
             *
             * @param scene {CAAT.Foundation.Scene} the scene that has just been brought in or taken out of the director.
             * @param b_easeIn {boolean} scene enters or exits ?
             */
            easeEnd:function (scene, b_easeIn) {
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
             * @param scene {CAAT.Foundation.Scene}
             */
            getSceneIndex:function (scene) {
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
             * @return {CAAT.Foundation.Scene} a CAAT.Scene object instance or null if the index is oob.
             */
            getScene:function (index) {
                return this.scenes[index];
            },
            getSceneById : function(id) {
                for( var i=0; i<this.scenes.length; i++ ) {
                    if (this.scenes[i].id===id) {
                        return this.scenes[i];
                    }
                }
                return null;
            },
            /**
             * Return the index of the current scene in the Director's scene list.
             * @return {number} the current scene's index.
             */
            getCurrentSceneIndex:function () {
                return this.getSceneIndex(this.currentScene);
            },
            /**
             * Return the running browser name.
             * @return {string} the browser name.
             */
            getBrowserName:function () {
                return this.browserInfo.browser;
            },
            /**
             * Return the running browser version.
             * @return {string} the browser version.
             */
            getBrowserVersion:function () {
                return this.browserInfo.version;
            },
            /**
             * Return the operating system name.
             * @return {string} the os name.
             */
            getOSName:function () {
                return this.browserInfo.OS;
            },
            /**
             * Gets the resource with the specified resource name.
             * The Director holds a collection called <code>imagesCache</code>
             * where you can store a JSON of the form
             *  <code>[ { id: imageId, image: imageObject } ]</code>.
             * This structure will be used as a resources cache.
             * There's a CAAT.Module.ImagePreloader class to preload resources and
             * generate this structure on loading finalization.
             *
             * @param sId {object} an String identifying a resource.
             */
            getImage:function (sId) {
                var ret = this.imagesCache[sId];
                if (ret) {
                    return ret;
                }

                //for (var i = 0; i < this.imagesCache.length; i++) {
                for( var i in this.imagesCache ) {
                    if (this.imagesCache[i].id === sId) {
                        return this.imagesCache[i].image;
                    }
                }

                return null;
            },
            musicPlay: function(id) {
                return this.audioManager.playMusic(id);
            },
            musicStop : function() {
                this.audioManager.stopMusic();
            },
            /**
             * Adds an audio to the cache.
             *
             * @see CAAT.Module.Audio.AudioManager.addAudio
             * @return this
             */
            addAudio:function (id, url) {
                this.audioManager.addAudio(id, url);
                return this;
            },
            /**
             * Plays the audio instance identified by the id.
             * @param id {object} the object used to store a sound in the audioCache.
             */
            audioPlay:function (id) {
                return this.audioManager.play(id);
            },
            /**
             * Loops an audio instance identified by the id.
             * @param id {object} the object used to store a sound in the audioCache.
             *
             * @return {HTMLElement|null} the value from audioManager.loop
             */
            audioLoop:function (id) {
                return this.audioManager.loop(id);
            },
            endSound:function () {
                return this.audioManager.endSound();
            },
            setSoundEffectsEnabled:function (enabled) {
                return this.audioManager.setSoundEffectsEnabled(enabled);
            },
            setMusicEnabled:function (enabled) {
                return this.audioManager.setMusicEnabled(enabled);
            },
            isMusicEnabled:function () {
                return this.audioManager.isMusicEnabled();
            },
            isSoundEffectsEnabled:function () {
                return this.audioManager.isSoundEffectsEnabled();
            },
            setVolume:function (id, volume) {
                return this.audioManager.setVolume(id, volume);
            },
            /**
             * Removes Director's scenes.
             */
            emptyScenes:function () {
                this.scenes = [];
            },
            /**
             * Adds an scene to this Director.
             * @param scene {CAAT.Foundation.Scene} a scene object.
             */
            addChild:function (scene) {
                scene.parent = this;
                this.childrenList.push(scene);
            },
            /**
             * @Deprecated use CAAT.loop instead.
             * @param fps
             * @param callback
             * @param callback2
             */
            loop:function (fps, callback, callback2) {
                if (callback2) {
                    this.onRenderStart = callback;
                    this.onRenderEnd = callback2;
                } else if (callback) {
                    this.onRenderEnd = callback;
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
             */
            renderFrame:function () {

                CAAT.currentDirector = this;

                if (this.stopped) {
                    return;
                }

                var t = new Date().getTime(),
                    delta = t - this.timeline;

                /*
                 check for massive frame time. if for example the current browser tab is minified or taken out of
                 foreground, the system will account for a bit time interval. minify that impact by lowering down
                 the elapsed time (virtual timelines FTW)
                 */
                if (delta > 500) {
                    delta = 500;
                }

                if (this.onRenderStart) {
                    this.onRenderStart(delta);
                }

                this.render(delta);

                if (this.debugInfo) {
                    this.debugInfo(this.statistics);
                }

                this.timeline = t;

                if (this.onRenderEnd) {
                    this.onRenderEnd(delta);
                }

                this.needsRepaint = false;
            },

            /**
             * If the director has renderingMode: DIRTY, the timeline must be reset to register accurate frame measurement.
             */
            resetTimeline:function () {
                this.timeline = new Date().getTime();
            },

            endLoop:function () {
            },
            /**
             * This method states whether the director must clear background before rendering
             * each frame.
             *
             * The clearing method could be:
             *  + CAAT.Director.CLEAR_ALL. previous to draw anything on screen the canvas will have clearRect called on it.
             *  + CAAT.Director.CLEAR_DIRTY_RECTS. Actors marked as invalid, or which have been moved, rotated or scaled
             *    will have their areas redrawn.
             *  + CAAT.Director.CLEAR_NONE. clears nothing.
             *
             * @param clear {CAAT.Director.CLEAR_ALL | CAAT.Director.CLEAR_NONE | CAAT.Director.CLEAR_DIRTY_RECTS}
             * @return this.
             */
            setClear:function (clear) {
                this.clear = clear;
                if (this.clear === CAAT.Foundation.Director.CLEAR_DIRTY_RECTS) {
                    this.dirtyRectsEnabled = true;
                } else {
                    this.dirtyRectsEnabled= false;
                }
                return this;
            },
            /**
             * Get this Director's AudioManager instance.
             * @return {CAAT.AudioManager} the AudioManager instance.
             */
            getAudioManager:function () {
                return this.audioManager;
            },
            /**
             * Acculumate dom elements position to properly offset on-screen mouse/touch events.
             * @param node
             */
            cumulateOffset:function (node, parent, prop) {
                var left = prop + 'Left';
                var top = prop + 'Top';
                var x = 0, y = 0, style;

                while (navigator.browser !== 'iOS' && node && node.style) {
                    if (node.currentStyle) {
                        style = node.currentStyle['position'];
                    } else {
                        style = (node.ownerDocument.defaultView || node.ownerDocument.parentWindow).getComputedStyle(node, null);
                        style = style ? style.getPropertyValue('position') : null;
                    }

                    // Accumulate offsets...
                    x += node[left];
                    y += node[top];

                    if (!/^(fixed)$/.test(style)) {
                        node = node[parent];
                    } else {
                        break;
                    }
                }

                return {
                    x:x,
                    y:y,
                    style:style
                };
            },
            getOffset:function (node) {
                var res = this.cumulateOffset(node, 'offsetParent', 'offset');
                if (res.style === 'fixed') {
                    var res2 = this.cumulateOffset(node, node.parentNode ? 'parentNode' : 'parentElement', 'scroll');
                    return {
                        x:res.x + res2.x,
                        y:res.y + res2.y
                    };
                }

                return {
                    x:res.x,
                    y:res.y
                };
            },
            /**
             * Normalize input event coordinates to be related to (0,0) canvas position.
             * @param point {CAAT.Math.Point} canvas coordinate.
             * @param e {MouseEvent} a mouse event from an input event.
             */
            getCanvasCoord:function (point, e) {

                var pt = new CAAT.Math.Point();
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

                var offset = this.getOffset(this.canvas);

                posx -= offset.x;
                posy -= offset.y;

                posx*= this.SCREEN_RATIO;
                posy*= this.SCREEN_RATIO;

                //////////////
                // transformar coordenada inversamente con affine transform de director.

                pt.x = posx;
                pt.y = posy;
                if (!this.modelViewMatrixI) {
                    this.modelViewMatrix.getInverse(this.modelViewMatrixI);
                }
                this.modelViewMatrixI.transformCoord(pt);
                posx = pt.x;
                posy = pt.y

                point.set(posx, posy);
                this.screenMousePoint.set(posx, posy);

            },

            __mouseDownHandler:function (e) {

                /*
                 was dragging and mousedown detected, can only mean a mouseOut's been performed and on mouseOver, no
                 button was presses. Then, send a mouseUp for the previos actor, and return;
                 */
                if (this.dragging && this.lastSelectedActor) {
                    this.__mouseUpHandler(e);
                    return;
                }

                this.getCanvasCoord(this.mousePoint, e);
                this.isMouseDown = true;
                var lactor = this.findActorAtPosition(this.mousePoint);

                if (null !== lactor) {

                    var pos = lactor.viewToModel(
                        new CAAT.Math.Point(this.screenMousePoint.x, this.screenMousePoint.y, 0));

                    lactor.mouseDown(
                        new CAAT.Event.MouseEvent().init(
                            pos.x,
                            pos.y,
                            e,
                            lactor,
                            new CAAT.Math.Point(
                                this.screenMousePoint.x,
                                this.screenMousePoint.y)));
                }

                this.lastSelectedActor = lactor;
            },

            __mouseUpHandler:function (e) {

                this.isMouseDown = false;
                this.getCanvasCoord(this.mousePoint, e);

                var pos = null;
                var lactor = this.lastSelectedActor;

                if (null !== lactor) {
                    pos = lactor.viewToModel(
                        new CAAT.Math.Point(this.screenMousePoint.x, this.screenMousePoint.y, 0));
                    if (lactor.actionPerformed && lactor.contains(pos.x, pos.y)) {
                        lactor.actionPerformed(e)
                    }

                    lactor.mouseUp(
                        new CAAT.Event.MouseEvent().init(
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
                            new CAAT.Event.MouseEvent().init(
                                pos.x,
                                pos.y,
                                e,
                                lactor,
                                this.screenMousePoint,
                                this.currentScene.time));
                    }
                }

                this.dragging = false;
                this.in_ = false;
//            CAAT.setCursor('default');
            },

            __mouseMoveHandler:function (e) {
                //this.getCanvasCoord(this.mousePoint, e);

                var lactor;
                var pos;

                var ct = this.currentScene ? this.currentScene.time : 0;

                // drag

                if (this.isMouseDown && null!==this.lastSelectedActor) {

                    lactor = this.lastSelectedActor;
                    pos = lactor.viewToModel(
                        new CAAT.Math.Point(this.screenMousePoint.x, this.screenMousePoint.y, 0));

                    // check for mouse move threshold.
                    if (!this.dragging) {
                        if (Math.abs(this.prevMousePoint.x - pos.x) < CAAT.DRAG_THRESHOLD_X &&
                            Math.abs(this.prevMousePoint.y - pos.y) < CAAT.DRAG_THRESHOLD_Y) {
                            return;
                        }
                    }

                    this.dragging = true;

                    var px = lactor.x;
                    var py = lactor.y;
                    lactor.mouseDrag(
                        new CAAT.Event.MouseEvent().init(
                            pos.x,
                            pos.y,
                            e,
                            lactor,
                            new CAAT.Math.Point(
                                this.screenMousePoint.x,
                                this.screenMousePoint.y),
                            ct));

                    this.prevMousePoint.x = pos.x;
                    this.prevMousePoint.y = pos.y;

                    /**
                     * Element has not moved after drag, so treat it as a button.
                     */
                    if (px === lactor.x && py === lactor.y) {

                        var contains = lactor.contains(pos.x, pos.y);

                        if (this.in_ && !contains) {
                            lactor.mouseExit(
                                new CAAT.Event.MouseEvent().init(
                                    pos.x,
                                    pos.y,
                                    e,
                                    lactor,
                                    this.screenMousePoint,
                                    ct));
                            this.in_ = false;
                        }

                        if (!this.in_ && contains) {
                            lactor.mouseEnter(
                                new CAAT.Event.MouseEvent().init(
                                    pos.x,
                                    pos.y,
                                    e,
                                    lactor,
                                    this.screenMousePoint,
                                    ct));
                            this.in_ = true;
                        }
                    }

                    return;
                }

                // mouse move.
                this.in_ = true;

                lactor = this.findActorAtPosition(this.mousePoint);

                // cambiamos de actor.
                if (lactor !== this.lastSelectedActor) {
                    if (null !== this.lastSelectedActor) {

                        pos = this.lastSelectedActor.viewToModel(
                            new CAAT.Math.Point(this.screenMousePoint.x, this.screenMousePoint.y, 0));

                        this.lastSelectedActor.mouseExit(
                            new CAAT.Event.MouseEvent().init(
                                pos.x,
                                pos.y,
                                e,
                                this.lastSelectedActor,
                                this.screenMousePoint,
                                ct));
                    }

                    if (null !== lactor) {
                        pos = lactor.viewToModel(
                            new CAAT.Math.Point(this.screenMousePoint.x, this.screenMousePoint.y, 0));

                        lactor.mouseEnter(
                            new CAAT.Event.MouseEvent().init(
                                pos.x,
                                pos.y,
                                e,
                                lactor,
                                this.screenMousePoint,
                                ct));
                    }
                }

                pos = lactor.viewToModel(
                    new CAAT.Math.Point(this.screenMousePoint.x, this.screenMousePoint.y, 0));

                if (null !== lactor) {

                    lactor.mouseMove(
                        new CAAT.Event.MouseEvent().init(
                            pos.x,
                            pos.y,
                            e,
                            lactor,
                            this.screenMousePoint,
                            ct));
                }

                this.prevMousePoint.x = pos.x;
                this.prevMousePoint.y = pos.y;

                this.lastSelectedActor = lactor;
            },

            __mouseOutHandler:function (e) {

                if (this.dragging) {
                    return;
                }

                if (null !== this.lastSelectedActor) {

                    this.getCanvasCoord(this.mousePoint, e);
                    var pos = new CAAT.Math.Point(this.mousePoint.x, this.mousePoint.y, 0);
                    this.lastSelectedActor.viewToModel(pos);

                    var ev = new CAAT.Event.MouseEvent().init(
                        pos.x,
                        pos.y,
                        e,
                        this.lastSelectedActor,
                        this.screenMousePoint,
                        this.currentScene.time);

                    this.lastSelectedActor.mouseExit(ev);
                    this.lastSelectedActor.mouseOut(ev);
                    if (!this.dragging) {
                        this.lastSelectedActor = null;
                    }
                } else {
                    this.isMouseDown = false;
                    this.in_ = false;

                }

            },

            __mouseOverHandler:function (e) {

                if (this.dragging) {
                    return;
                }

                var lactor;
                var pos, ev;

                if (null == this.lastSelectedActor) {
                    lactor = this.findActorAtPosition(this.mousePoint);

                    if (null !== lactor) {

                        pos = lactor.viewToModel(
                            new CAAT.Math.Point(this.screenMousePoint.x, this.screenMousePoint.y, 0));

                        ev = new CAAT.Event.MouseEvent().init(
                            pos.x,
                            pos.y,
                            e,
                            lactor,
                            this.screenMousePoint,
                            this.currentScene ? this.currentScene.time : 0);

                        lactor.mouseOver(ev);
                        lactor.mouseEnter(ev);
                    }

                    this.lastSelectedActor = lactor;
                } else {
                    lactor = this.lastSelectedActor;
                    pos = lactor.viewToModel(
                        new CAAT.Math.Point(this.screenMousePoint.x, this.screenMousePoint.y, 0));

                    ev = new CAAT.Event.MouseEvent().init(
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

            __mouseDBLClickHandler:function (e) {

                this.getCanvasCoord(this.mousePoint, e);
                if (null !== this.lastSelectedActor) {
                    /*
                     var pos = this.lastSelectedActor.viewToModel(
                     new CAAT.Point(this.screenMousePoint.x, this.screenMousePoint.y, 0));
                     */
                    this.lastSelectedActor.mouseDblClick(
                        new CAAT.Event.MouseEvent().init(
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
            __touchStartHandler:function (e) {

                if (e.target === this.canvas) {
                    e.preventDefault();
                    e.returnValue = false;

                    e = e.targetTouches[0];

                    var mp = this.mousePoint;
                    this.getCanvasCoord(mp, e);
                    if (mp.x < 0 || mp.y < 0 || mp.x >= this.width || mp.y >= this.height) {
                        return;
                    }

                    this.touching = true;

                    this.__mouseDownHandler(e);
                }
            },

            __touchEndHandler:function (e) {

                if (this.touching) {
                    e.preventDefault();
                    e.returnValue = false;

                    e = e.changedTouches[0];
                    var mp = this.mousePoint;
                    this.getCanvasCoord(mp, e);

                    this.touching = false;

                    this.__mouseUpHandler(e);
                }
            },

            __touchMoveHandler:function (e) {

                if (this.touching) {
                    e.preventDefault();
                    e.returnValue = false;

                    if (this.gesturing) {
                        return;
                    }

                    for (var i = 0; i < e.targetTouches.length; i++) {
                        var ee = e.targetTouches[i];
                        var mp = this.mousePoint;
                        this.getCanvasCoord(mp, ee);
                        this.__mouseMoveHandler(ee);
                    }
                }
            },

            __gestureStart:function (scale, rotation) {
                this.gesturing = true;
                this.__gestureRotation = this.lastSelectedActor.rotationAngle;
                this.__gestureSX = this.lastSelectedActor.scaleX - 1;
                this.__gestureSY = this.lastSelectedActor.scaleY - 1;
            },

            __gestureChange:function (scale, rotation) {
                if (typeof scale === 'undefined' || typeof rotation === 'undefined') {
                    return;
                }

                if (this.lastSelectedActor !== null && this.lastSelectedActor.isGestureEnabled()) {
                    this.lastSelectedActor.setRotation(rotation * Math.PI / 180 + this.__gestureRotation);

                    this.lastSelectedActor.setScale(
                        this.__gestureSX + scale,
                        this.__gestureSY + scale);
                }

            },

            __gestureEnd:function (scale, rotation) {
                this.gesturing = false;
                this.__gestureRotation = 0;
                this.__gestureScale = 0;
            },

            __touchEndHandlerMT:function (e) {

                e.preventDefault();
                e.returnValue = false;

                var i, j;
                var recent = [];

                /**
                 * extrae actores afectados, y coordenadas relativas para ellos.
                 * crear una coleccion touch-id : { actor, touch-event }
                 */
                for (i = 0; i < e.changedTouches.length; i++) {
                    var _touch = e.changedTouches[i];
                    var id = _touch.identifier;
                    recent.push(id);
                }


                /**
                 * para los touch identificados, extraer que actores se han afectado.
                 * crear eventos con la info de touch para cada uno.
                 */

                var actors = {};
                for (i = 0; i < recent.length; i++) {
                    var touchId = recent[ i ];
                    if (this.touches[ touchId ]) {
                        var actor = this.touches[ touchId ].actor;

                        if (!actors[actor.id]) {
                            actors[actor.id] = {
                                actor:actor,
                                touch:new CAAT.Event.TouchEvent().init(e, actor, this.currentScene.time)
                            };
                        }

                        var ev = actors[ actor.id ].touch;
                        ev.addChangedTouch(this.touches[ touchId ].touch);
                    }
                }

                /**
                 * remove ended touch info.
                 */
                for (i = 0; i < e.changedTouches.length; i++) {
                    var touch = e.changedTouches[i];
                    var id = touch.identifier;
                    delete this.touches[id];
                }

                /**
                 * notificar a todos los actores.
                 */
                for (var pr in actors) {
                    var data = actors[pr];
                    var actor = data.actor;
                    var touch = data.touch;

                    for (var actorId in this.touches) {
                        var tt = this.touches[actorId]
                        if (tt.actor.id === actor.id) {
                            touch.addTouch(tt.touch);
                        }
                    }

                    actor.touchEnd(touch);
                }
            },

            __touchMoveHandlerMT:function (e) {

                e.preventDefault();
                e.returnValue = false;

                var i;
                var recent = [];

                /**
                 * extrae actores afectados, y coordenadas relativas para ellos.
                 * crear una coleccion touch-id : { actor, touch-event }
                 */
                for (i = 0; i < e.changedTouches.length; i++) {
                    var touch = e.changedTouches[i];
                    var id = touch.identifier;

                    if (this.touches[ id ]) {
                        var mp = this.mousePoint;
                        this.getCanvasCoord(mp, touch);

                        var actor = this.touches[ id ].actor;
                        mp = actor.viewToModel(mp);

                        this.touches[ id ] = {
                            actor:actor,
                            touch:new CAAT.Event.TouchInfo(id, mp.x, mp.y, actor)
                        };

                        recent.push(id);
                    }
                }

                /**
                 * para los touch identificados, extraer que actores se han afectado.
                 * crear eventos con la info de touch para cada uno.
                 */

                var actors = {};
                for (i = 0; i < recent.length; i++) {
                    var touchId = recent[ i ];
                    var actor = this.touches[ touchId ].actor;

                    if (!actors[actor.id]) {
                        actors[actor.id] = {
                            actor:actor,
                            touch:new CAAT.Event.TouchEvent().init(e, actor, this.currentScene.time)
                        };
                    }

                    var ev = actors[ actor.id ].touch;
                    ev.addTouch(this.touches[ touchId ].touch);
                    ev.addChangedTouch(this.touches[ touchId ].touch);
                }

                /**
                 * notificar a todos los actores.
                 */
                for (var pr in actors) {
                    var data = actors[pr];
                    var actor = data.actor;
                    var touch = data.touch;

                    for (var actorId in this.touches) {
                        var tt = this.touches[actorId]
                        if (tt.actor.id === actor.id) {
                            touch.addTouch(tt.touch);
                        }
                    }

                    actor.touchMove(touch);
                }
            },

            __touchCancelHandleMT:function (e) {
                this.__touchEndHandlerMT(e);
            },

            __touchStartHandlerMT:function (e) {
                e.preventDefault();
                e.returnValue = false;

                var i;
                var recent = [];
                var allInCanvas = true;

                /**
                 * extrae actores afectados, y coordenadas relativas para ellos.
                 * crear una coleccion touch-id : { actor, touch-event }
                 */
                for (i = 0; i < e.changedTouches.length; i++) {
                    var touch = e.changedTouches[i];
                    var id = touch.identifier;
                    var mp = this.mousePoint;
                    this.getCanvasCoord(mp, touch);
                    if (mp.x < 0 || mp.y < 0 || mp.x >= this.width || mp.y >= this.height) {
                        allInCanvas = false;
                        continue;
                    }

                    var actor = this.findActorAtPosition(mp);
                    if (actor !== null) {
                        mp = actor.viewToModel(mp);

                        if (!this.touches[ id ]) {

                            this.touches[ id ] = {
                                actor:actor,
                                touch:new CAAT.Event.TouchInfo(id, mp.x, mp.y, actor)
                            };

                            recent.push(id);
                        }

                    }
                }

                /**
                 * para los touch identificados, extraer que actores se han afectado.
                 * crear eventos con la info de touch para cada uno.
                 */

                var actors = {};
                for (i = 0; i < recent.length; i++) {
                    var touchId = recent[ i ];
                    var actor = this.touches[ touchId ].actor;

                    if (!actors[actor.id]) {
                        actors[actor.id] = {
                            actor:actor,
                            touch:new CAAT.Event.TouchEvent().init(e, actor, this.currentScene.time)
                        };
                    }

                    var ev = actors[ actor.id ].touch;
                    ev.addTouch(this.touches[ touchId ].touch);
                    ev.addChangedTouch(this.touches[ touchId ].touch);
                }

                /**
                 * notificar a todos los actores.
                 */
                for (var pr in actors) {
                    var data = actors[pr];
                    var actor = data.actor;
                    var touch = data.touch;

                    for (var actorId in this.touches) {
                        var tt = this.touches[actorId]
                        if (tt.actor.id === actor.id) {
                            touch.addTouch(tt.touch);
                        }
                    }

                    actor.touchStart(touch);
                }

            },

            __findTouchFirstActor:function () {

                var t = Number.MAX_VALUE;
                var actor = null;
                for (var pr in this.touches) {

                    var touch = this.touches[pr];

                    if (touch.touch.time && touch.touch.time < t && touch.actor.isGestureEnabled()) {
                        actor = touch.actor;
                        t = touch.touch.time;
                    }
                }
                return actor;
            },

            __gesturedActor:null,
            __touchGestureStartHandleMT:function (e) {
                var actor = this.__findTouchFirstActor();

                if (actor !== null && actor.isGestureEnabled()) {
                    this.__gesturedActor = actor;
                    this.__gestureRotation = actor.rotationAngle;
                    this.__gestureSX = actor.scaleX - 1;
                    this.__gestureSY = actor.scaleY - 1;


                    actor.gestureStart(
                        e.rotation * Math.PI / 180,
                        e.scale + this.__gestureSX,
                        e.scale + this.__gestureSY);
                }
            },

            __touchGestureEndHandleMT:function (e) {

                if (null !== this.__gesturedActor && this.__gesturedActor.isGestureEnabled()) {
                    this.__gesturedActor.gestureEnd(
                        e.rotation * Math.PI / 180,
                        e.scale + this.__gestureSX,
                        e.scale + this.__gestureSY);
                }

                this.__gestureRotation = 0;
                this.__gestureScale = 0;


            },

            __touchGestureChangeHandleMT:function (e) {

                if (this.__gesturedActor !== null && this.__gesturedActor.isGestureEnabled()) {
                    this.__gesturedActor.gestureChange(
                        e.rotation * Math.PI / 180,
                        this.__gestureSX + e.scale,
                        this.__gestureSY + e.scale);
                }
            },


            addHandlers:function (canvas) {

                var me = this;

                window.addEventListener('mouseup', function (e) {
                    if (me.touching) {
                        e.preventDefault();
                        e.cancelBubble = true;
                        if (e.stopPropagation) e.stopPropagation();

                        var mp = me.mousePoint;
                        me.getCanvasCoord(mp, e);
                        me.__mouseUpHandler(e);

                        me.touching = false;
                    }
                }, false);

                window.addEventListener('mousedown', function (e) {
                    if (e.target === canvas) {
                        e.preventDefault();
                        e.cancelBubble = true;
                        if (e.stopPropagation) e.stopPropagation();

                        var mp = me.mousePoint;
                        me.getCanvasCoord(mp, e);
                        if (mp.x < 0 || mp.y < 0 || mp.x >= me.width || mp.y >= me.height) {
                            return;
                        }
                        me.touching = true;

                        me.__mouseDownHandler(e);
                    }
                }, false);

                window.addEventListener('mouseover', function (e) {
                    if (e.target === canvas && !me.dragging) {
                        e.preventDefault();
                        e.cancelBubble = true;
                        if (e.stopPropagation) e.stopPropagation();

                        var mp = me.mousePoint;
                        me.getCanvasCoord(mp, e);
                        if (mp.x < 0 || mp.y < 0 || mp.x >= me.width || mp.y >= me.height) {
                            return;
                        }

                        me.__mouseOverHandler(e);
                    }
                }, false);

                window.addEventListener('mouseout', function (e) {
                    if (e.target === canvas && !me.dragging) {
                        e.preventDefault();
                        e.cancelBubble = true;
                        if (e.stopPropagation) e.stopPropagation();

                        var mp = me.mousePoint;
                        me.getCanvasCoord(mp, e);
                        me.__mouseOutHandler(e);
                    }
                }, false);

                window.addEventListener('mousemove', function (e) {
                    e.preventDefault();
                    e.cancelBubble = true;
                    if (e.stopPropagation) e.stopPropagation();

                    var mp = me.mousePoint;
                    me.getCanvasCoord(mp, e);
                    if (!me.dragging && ( mp.x < 0 || mp.y < 0 || mp.x >= me.width || mp.y >= me.height )) {
                        return;
                    }
                    me.__mouseMoveHandler(e);
                }, false);

                window.addEventListener("dblclick", function (e) {
                    if (e.target === canvas) {
                        e.preventDefault();
                        e.cancelBubble = true;
                        if (e.stopPropagation) e.stopPropagation();
                        var mp = me.mousePoint;
                        me.getCanvasCoord(mp, e);
                        if (mp.x < 0 || mp.y < 0 || mp.x >= me.width || mp.y >= me.height) {
                            return;
                        }

                        me.__mouseDBLClickHandler(e);
                    }
                }, false);

                if (CAAT.TOUCH_BEHAVIOR === CAAT.TOUCH_AS_MOUSE) {
                    canvas.addEventListener("touchstart", this.__touchStartHandler.bind(this), false);
                    canvas.addEventListener("touchmove", this.__touchMoveHandler.bind(this), false);
                    canvas.addEventListener("touchend", this.__touchEndHandler.bind(this), false);
                    canvas.addEventListener("gesturestart", function (e) {
                        if (e.target === canvas) {
                            e.preventDefault();
                            e.returnValue = false;
                            me.__gestureStart(e.scale, e.rotation);
                        }
                    }, false);
                    canvas.addEventListener("gestureend", function (e) {
                        if (e.target === canvas) {
                            e.preventDefault();
                            e.returnValue = false;
                            me.__gestureEnd(e.scale, e.rotation);
                        }
                    }, false);
                    canvas.addEventListener("gesturechange", function (e) {
                        if (e.target === canvas) {
                            e.preventDefault();
                            e.returnValue = false;
                            me.__gestureChange(e.scale, e.rotation);
                        }
                    }, false);
                } else if (CAAT.TOUCH_BEHAVIOR === CAAT.TOUCH_AS_MULTITOUCH) {
                    canvas.addEventListener("touchstart", this.__touchStartHandlerMT.bind(this), false);
                    canvas.addEventListener("touchmove", this.__touchMoveHandlerMT.bind(this), false);
                    canvas.addEventListener("touchend", this.__touchEndHandlerMT.bind(this), false);
                    canvas.addEventListener("touchcancel", this.__touchCancelHandleMT.bind(this), false);

                    canvas.addEventListener("gesturestart", this.__touchGestureStartHandleMT.bind(this), false);
                    canvas.addEventListener("gestureend", this.__touchGestureEndHandleMT.bind(this), false);
                    canvas.addEventListener("gesturechange", this.__touchGestureChangeHandleMT.bind(this), false);
                }

            },

            enableEvents:function (onElement) {
                CAAT.RegisterDirector(this);
                this.in_ = false;
                this.createEventHandler(onElement);
            },

            createEventHandler:function (onElement) {
                //var canvas= this.canvas;
                this.in_ = false;
                //this.addHandlers(canvas);
                this.addHandlers(onElement);
            }
        }
    },

    onCreate:function () {

        if (typeof CAAT.__CSS__!=="undefined") {

            CAAT.Foundation.Director.prototype.clip = true;
            CAAT.Foundation.Director.prototype.glEnabled = false;

            CAAT.Foundation.Director.prototype.getRenderType = function () {
                return 'CSS';
            };

            CAAT.Foundation.Director.prototype.setScaleProportional = function (w, h) {

                var factor = Math.min(w / this.referenceWidth, h / this.referenceHeight);
                this.setScaleAnchored(factor, factor, 0, 0);

                this.eventHandler.style.width = '' + this.referenceWidth + 'px';
                this.eventHandler.style.height = '' + this.referenceHeight + 'px';
            };

            CAAT.Foundation.Director.prototype.setBounds = function (x, y, w, h) {
                CAAT.Foundation.Director.superclass.setBounds.call(this, x, y, w, h);
                for (var i = 0; i < this.scenes.length; i++) {
                    this.scenes[i].setBounds(0, 0, w, h);
                }
                this.eventHandler.style.width = w + 'px';
                this.eventHandler.style.height = h + 'px';

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
            CAAT.Foundation.Director.prototype.initialize = function (width, height, domElement, proxy) {

                this.timeline = new Date().getTime();
                this.domElement = domElement;
                this.style('position', 'absolute');
                this.style('width', '' + width + 'px');
                this.style('height', '' + height + 'px');
                this.style('overflow', 'hidden');

                this.enableEvents(domElement);

                this.setBounds(0, 0, width, height);

                this.checkDebug();
                return this;
            };

            CAAT.Foundation.Director.prototype.render = function (time) {

                this.time += time;
                this.animate(this, time);

                /**
                 * draw director active scenes.
                 */
                var i, l, tt;

                if (!navigator.isCocoonJS && CAAT.DEBUG) {
                    this.resetStats();
                }

                for (i = 0, l = this.childrenList.length; i < l; i++) {
                    var c = this.childrenList[i];
                    if (c.isInAnimationFrame(this.time) && !c.isPaused()) {
                        tt = c.time - c.start_time;
                        c.timerManager.checkTimers(tt);
                        c.timerManager.removeExpiredTimers();
                    }
                }

                for (i = 0, l = this.childrenList.length; i < l; i++) {
                    var c = this.childrenList[i];
                    if (c.isInAnimationFrame(this.time)) {
                        tt = c.time - c.start_time;
                        if (c.onRenderStart) {
                            c.onRenderStart(tt);
                        }

                        c.paintActor(this, tt);

                        if (c.onRenderEnd) {
                            c.onRenderEnd(tt);
                        }

                        if (!c.isPaused()) {
                            c.time += time;
                        }

                        if (!navigator.isCocoonJS && CAAT.DEBUG) {
                            this.statistics.size_discarded_by_dirtyRects += this.drDiscarded;
                            this.statistics.size_total += c.size_total;
                            this.statistics.size_active += c.size_active;
                            this.statistics.size_dirtyRects = this.nDirtyRects;

                        }

                    }
                }

                this.frameCounter++;
            };

            CAAT.Foundation.Director.prototype.addScene = function (scene) {
                scene.setVisible(true);
                scene.setBounds(0, 0, this.width, this.height);
                this.scenes.push(scene);
                scene.setEaseListener(this);
                if (null === this.currentScene) {
                    this.setScene(0);
                }

                this.domElement.appendChild(scene.domElement);
            };

            CAAT.Foundation.Director.prototype.emptyScenes = function () {
                this.scenes = [];
                this.domElement.innerHTML = '';
                this.createEventHandler();
            };

            CAAT.Foundation.Director.prototype.setClear = function (clear) {
                return this;
            };

            CAAT.Foundation.Director.prototype.createEventHandler = function () {
                this.eventHandler = document.createElement('div');
                this.domElement.appendChild(this.eventHandler);

                this.eventHandler.style.position = 'absolute';
                this.eventHandler.style.left = '0';
                this.eventHandler.style.top = '0';
                this.eventHandler.style.zIndex = 999999;
                this.eventHandler.style.width = '' + this.width + 'px';
                this.eventHandler.style.height = '' + this.height + 'px';

                this.canvas = this.eventHandler;
                this.in_ = false;

                this.addHandlers(this.canvas);
            };

            CAAT.Foundation.Director.prototype.inDirtyRect = function () {
                return true;
            }
        }
    }
});
