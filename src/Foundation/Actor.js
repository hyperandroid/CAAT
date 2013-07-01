/**
 * See LICENSE file.
 *
 **/

CAAT.Module({




    /**
     *
     * CAAT.Foundation is the base namespace for all the core animation elements.
     *
     * @name Foundation
     * @namespace
     * @memberOf CAAT
     *
     */

    /**
     *
     * CAAT.Foundation.Actor is the base animable element. It is the base object for Director, Scene and
     * Container.
     *    <p>CAAT.Actor is the simplest object instance CAAT manages. Every on-screen element is an Actor instance.
     *        An Actor has entity, it has a size, position and can have input sent to it. Everything that has a
     *        visual representation is an Actor, including Director and Scene objects.</p>
     *    <p>This object has functionality for:</p>
     *    <ol>
     *        <li>Set location and size on screen. Actors are always rectangular shapes, but not needed to be AABB.</li>
     *        <li>Set affine transforms (rotation, scale and translation).</li>
     *        <li>Define life cycle.</li>
     *        <li>Manage alpha transparency.</li>
     *        <li>Manage and keep track of applied Behaviors. Behaviors apply transformations via key-framing.</li>
     *        <li>Compose transformations. A container Actor will transform its children before they apply their own transformation.</li>
     *        <li>Clipping capabilities. Either rectangular or arbitrary shapes.</li>
     *        <li>The API is developed to allow method chaining when possible.</li>
     *        <li>Handle input (either mouse events, touch, multitouch, keys and accelerometer).</li>
     *        <li>Show an image.</li>
     *        <li>Show some image animations.</li>
     *        <li>etc.</li>
     *    </ol>
     *
     * @name Actor
     * @memberOf CAAT.Foundation
     * @constructor
     *
     */

    defines:"CAAT.Foundation.Actor",
    aliases: [ "CAAT.Actor" ],
    depends: [
        "CAAT.Math.Dimension",
        "CAAT.Event.AnimationLoop",
        "CAAT.Foundation.SpriteImage",
        "CAAT.Core.Constants",
        "CAAT.Behavior.PathBehavior",
        "CAAT.Behavior.RotateBehavior",
        "CAAT.Behavior.ScaleBehavior",
        "CAAT.Behavior.Scale1Behavior",
        "CAAT.PathUtil.LinearPath",
        "CAAT.Event.AnimationLoop"
    ],
    constants :  {
        /**
         * @lends  CAAT.Foundation.Actor
         */

        /** @const @type {number} */ ANCHOR_CENTER:0, // constant values to determine different affine transform
        /** @const @type {number} */ ANCHOR_TOP:1, // anchors.
        /** @const @type {number} */ ANCHOR_BOTTOM:2,
        /** @const @type {number} */ ANCHOR_LEFT:3,
        /** @const @type {number} */ ANCHOR_RIGHT:4,
        /** @const @type {number} */ ANCHOR_TOP_LEFT:5,
        /** @const @type {number} */ ANCHOR_TOP_RIGHT:6,
        /** @const @type {number} */ ANCHOR_BOTTOM_LEFT:7,
        /** @const @type {number} */ ANCHOR_BOTTOM_RIGHT:8,
        /** @const @type {number} */ ANCHOR_CUSTOM:9,

        /** @const @type {number} */ CACHE_NONE:0,
        /** @const @type {number} */ CACHE_SIMPLE:1,
        /** @const @type {number} */ CACHE_DEEP:2
    },

    extendsWith : function () {

        var __index = 0;

        return  {

            /**
             * @lends CAAT.Foundation.Actor.prototype
             */

            __init:function () {
                this.behaviorList = [];
                this.lifecycleListenerList = [];
                this.AABB = new CAAT.Math.Rectangle();
                this.viewVertices = [
                    new CAAT.Math.Point(0, 0, 0),
                    new CAAT.Math.Point(0, 0, 0),
                    new CAAT.Math.Point(0, 0, 0),
                    new CAAT.Math.Point(0, 0, 0)
                ];

                this.scaleAnchor = CAAT.Foundation.Actor.ANCHOR_CENTER;

                this.modelViewMatrix = new CAAT.Math.Matrix();
                this.modelViewMatrixI = new CAAT.Math.Matrix();
                this.worldModelViewMatrix = new CAAT.Math.Matrix();
                this.worldModelViewMatrixI = new CAAT.Math.Matrix();

                this.resetTransform();
                this.setScale(1, 1);
                this.setRotation(0);

                this.id = __index++;

                return this;
            },

            /**
             * @type {object}
             */
            __super : null,

            /**
             * A collection of this Actors lifecycle observers.
             * @type { Array.<{actorLifeCycleEvent : function( CAAT.Foundation.Actor, string, number ) }> }
             */
            lifecycleListenerList:null,

            /**
             * A collection of behaviors to modify this actor´s properties.
             * @type { Array.<CAAT.Behavior.Behavior> }
             */
            behaviorList:null,

            /**
             * This actor's parent container.
             * @type { CAAT.Foundation.ActorContainer }
             */
            parent:null, // Parent of this Actor. May be Scene.

            /**
             * x position on parent. In parent's local coord. system.
             * @type {number}
             */
            x:0,
            /**
             * y position on parent. In parent's local coord. system.
             * @type {number}
             */
            y:0,

            /**
             * Actor's width. In parent's local coord. system.
             * @type {number}
             */
            width:0,

            /**
             * Actor's height. In parent's local coord. system.
             * @type {number}
             */
            height:0,

            /**
             * actor´s layout preferred size.
             * @type {CAAT.Math.Dimension}
             */
            preferredSize:null,

            /**
             * actor's layout minimum size.
             * @type {CAAT.Math.Dimension}
             */
            minimumSize:null,

            /**
             * Marks since when this actor, relative to scene time, is going to be animated/drawn.
             * @type {number}
             */
            start_time:0,

            /**
             * Marks from the time this actor is going to be animated, during how much time.
             * Forever by default.
             * @type {number}
             */
            duration:Number.MAX_VALUE,

            /**
             * Will this actor be clipped before being drawn on screen ?
             * @type {boolean}
             */
            clip:false,

            /**
             * If this.clip and this.clipPath===null, a rectangle will be used as clip area. Otherwise,
             * clipPath contains a reference to a CAAT.PathUtil.Path object.
             * @type {CAAT.PathUtil.Path}
             */
            clipPath:null,

            /**
             * Translation x anchor. 0..1
             * @type {number}
             */
            tAnchorX:0,

            /**
             * Translation y anchor. 0..1
             * @type {number}
             */
            tAnchorY:0,

            /**
             * ScaleX value.
             * @type {number}
             */
            scaleX:1, // transformation. width scale parameter

            /**
             * ScaleY value.
             * @type {number}
             */
            scaleY:1, // transformation. height scale parameter

            /**
             * Scale Anchor X. Value 0-1
             * @type {number}
             */
            scaleTX:.50, // transformation. scale anchor x position

            /**
             * Scale Anchor Y. Value 0-1
             * @type {number}
             */
            scaleTY:.50, // transformation. scale anchor y position

            /**
             * A value that corresponds to any CAAT.Foundation.Actor.ANCHOR_* value.
             * @type {CAAT.Foundation.Actor.ANCHOR_*}
             */
            scaleAnchor:0, // transformation. scale anchor

            /**
             * This actor´s rotation angle in radians.
             * @type {number}
             */
            rotationAngle:0, // transformation. rotation angle in radians

            /**
             * Rotation Anchor X. CAAT uses different Anchors for position, rotation and scale. Value 0-1.
             * @type {number}
             */
            rotationY:.50, // transformation. rotation center y

            /**
             * Rotation Anchor Y. CAAT uses different Anchors for position, rotation and scale. Value 0-1.
             * @type {number}
             */
            rotationX:.50, // transformation. rotation center x

            /**
             * Transparency value. 0 is totally transparent, 1 is totally opaque.
             * @type {number}
             */
            alpha:1, // alpha transparency value

            /**
             * true to make all children transparent, false, only this actor/container will be transparent.
             * @type {boolean}
             */
            isGlobalAlpha:false, // is this a global alpha

            /**
             * @type {number}
             * @private
             */
            frameAlpha:1, // hierarchically calculated alpha for this Actor.

            /**
             * Mark this actor as expired, or out of the scene time.
             * @type {boolean}
             */
            expired:false,

            /**
             * Mark this actor as discardable. If an actor is expired and mark as discardable, if will be
             * removed from its parent.
             * @type {boolean}
             */
            discardable:false, // set when you want this actor to be removed if expired

            /**
             * @type {boolean}
             */
            pointed:false, // is the mouse pointer inside this actor

            /**
             * Enable or disable input on this actor. By default, all actors receive input.
             * See also priority lists.
             * see demo4 for an example of input and priority lists.
             * @type {boolean}
             */
            mouseEnabled:true, // events enabled ?

            /**
             * Make this actor visible or not.
             * An invisible actor avoids making any calculation, applying any behavior on it.
             * @type {boolean}
             */
            visible:true,

            /**
             * any canvas rendering valid fill style.
             * @type {string}
             */
            fillStyle:null,

            /**
             * any canvas rendering valid stroke style.
             * @type {string}
             */
            strokeStyle:null,

            /**
             * This actor´s scene time.
             * @type {number}
             */
            time:0, // Cache Scene time.

            /**
             * This rectangle keeps the axis aligned bounding box in screen coords of this actor.
             * In can be used, among other uses, to realize whether two given actors collide regardless
             * the affine transformation is being applied on them.
             * @type {CAAT.Math.Rectangle}
             */
            AABB:null,

            /**
             * These 4 CAAT.Math.Point objects are the vertices of this actor´s non axis aligned bounding
             * box. If the actor is not rotated, viewVertices and AABB define the same bounding box.
             * @type {Array.<CAAT.Math.Point>}
             */
            viewVertices:null, // model to view transformed vertices.

            /**
             * Is this actor processed in the last frame ?
             * @type {boolean}
             */
            inFrame:false, // boolean indicating whether this Actor was present on last frame.

            /**
             * Local matrix dirtyness flag.
             * @type {boolean}
             * @private
             */
            dirty:true, // model view is dirty ?

            /**
             * Global matrix dirtyness flag.
             * @type {boolean}
             * @private
             */
            wdirty:true, // world model view is dirty ?

            /**
             * @type {number}
             * @private
             */
            oldX:-1,

            /**
             * @type {number}
             * @private
             */
            oldY:-1,

            /**
             * This actor´s affine transformation matrix.
             * @type {CAAT.Math.Matrix}
             */
            modelViewMatrix:null, // model view matrix.

            /**
             * This actor´s world affine transformation matrix.
             * @type {CAAT.Math.Matrix}
             */
            worldModelViewMatrix:null, // world model view matrix.

            /**
             * @type {CAAT.Math.Matrix}
             */
            modelViewMatrixI:null, // model view matrix.

            /**
             * @type {CAAT.Math.Matrix}
             */
            worldModelViewMatrixI:null, // world model view matrix.

            /**
             * Is this actor enabled on WebGL ?
             * @type {boolean}
             */
            glEnabled:false,

            /**
             * Define this actor´s background image.
             * See SpriteImage object.
             * @type {CAAT.Foundation.SpriteImage}
             */
            backgroundImage:null,

            /**
             * Set this actor´ id so that it can be later identified easily.
             * @type {object}
             */
            id:null,

            /**
             * debug info.
             * @type {number}
             */
            size_active:1, // number of animated children

            /**
             * debug info.
             * @type {number}
             */
            size_total:1,

            __d_ax:-1, // for drag-enabled actors.
            __d_ay:-1,

            /**
             * Is gesture recognition enabled on this actor ??
             * @type {boolean}
             */
            gestureEnabled:false,

            /**
             * If dirty rects are enabled, this flag indicates the rendering engine to invalidate this
             * actor´s screen area.
             * @type {boolean}
             */
            invalid:true,

            /**
             * Caching as bitmap strategy. Suitable to cache very complex actors.
             *
             * 0 : no cache.
             * CACHE_SIMPLE : if a container, only cache the container.
             * CACHE_DEEP : if a container, cache the container and recursively all of its children.
             *
             * @type {number}
             */
            cached:0, // 0 no, CACHE_SIMPLE | CACHE_DEEP

            /**
             * Exclude this actor from automatic layout on its parent.
             * @type {boolean}
             */
            preventLayout : false,

            /**
             * is this actor/container Axis aligned ? if so, much faster inverse matrices can be calculated.
             * @type {boolean}
             * @private
             */
            isAA:true,

            /**
             * if this actor is cached, when destroy is called, it does not call 'clean' method, which clears some
             * internal properties.
             */
            isCachedActor : false,

            setCachedActor : function(cached) {
                this.isCachedActor= cached;
                return this;
            },

            /**
             * Make this actor not be laid out.
             */
            setPreventLayout : function(b) {
                this.preventLayout= b;
                return this;
            },

            invalidateLayout:function () {
                if (this.parent && !this.parent.layoutInvalidated) {
                    this.parent.invalidateLayout();
                }

                return this;
            },

            __validateLayout:function () {

            },

            /**
             * Set this actors preferred layout size.
             *
             * @param pw {number}
             * @param ph {number}
             * @return {*}
             */
            setPreferredSize:function (pw, ph) {
                if (!this.preferredSize) {
                    this.preferredSize = new CAAT.Math.Dimension();
                }
                this.preferredSize.width = pw;
                this.preferredSize.height = ph;
                return this;
            },

            getPreferredSize:function () {
                return this.preferredSize ? this.preferredSize :
                    this.getMinimumSize();
            },

            /**
             * Set this actors minimum layout size.
             *
             * @param pw {number}
             * @param ph {number}
             * @return {*}
             */
            setMinimumSize:function (pw, ph) {
                if (!this.minimumSize) {
                    this.minimumSize = new CAAT.Math.Dimension();
                }

                this.minimumSize.width = pw;
                this.minimumSize.height = ph;
                return this;
            },

            getMinimumSize:function () {
                return this.minimumSize ? this.minimumSize :
                    new CAAT.Math.Dimension(this.width, this.height);
            },

            /**
             * @deprecated
             * @return {*}
             */
            create:function () {
                return this;
            },
            /**
             * Move this actor to a position.
             * It creates and adds a new PathBehavior.
             * @param x {number} new x position
             * @param y {number} new y position
             * @param duration {number} time to take to get to new position
             * @param delay {=number} time to wait before start moving
             * @param interpolator {=CAAT.Behavior.Interpolator} a CAAT.Behavior.Interpolator instance
             */
            moveTo:function (x, y, duration, delay, interpolator, callback) {

                if (x === this.x && y === this.y) {
                    return;
                }

                var id = '__moveTo';
                var b = this.getBehavior(id);
                if (!b) {
                    b = new CAAT.Behavior.PathBehavior().
                        setId(id).
                        setValues(new CAAT.PathUtil.LinearPath());
                    this.addBehavior(b);
                }

                b.path.setInitialPosition(this.x, this.y).setFinalPosition(x, y);
                b.setDelayTime(delay ? delay : 0, duration);
                if (interpolator) {
                    b.setInterpolator(interpolator);
                }

                if (callback) {
                    b.lifecycleListenerList = [];
                    b.addListener({
                        behaviorExpired:function (behavior, time, actor) {
                            callback(behavior, time, actor);
                        }
                    });
                }

                return this;
            },

            /**
             *
             * @param angle {number} new rotation angle
             * @param duration {number} time to rotate
             * @param delay {number=} millis to start rotation
             * @param anchorX {number=} rotation anchor x
             * @param anchorY {number=} rotation anchor y
             * @param interpolator {CAAT.Behavior.Interpolator=}
             * @return {*}
             */
            rotateTo:function (angle, duration, delay, anchorX, anchorY, interpolator) {

                if (angle === this.rotationAngle) {
                    return;
                }

                var id = '__rotateTo';
                var b = this.getBehavior(id);
                if (!b) {
                    b = new CAAT.Behavior.RotateBehavior().
                        setId(id).
                        setValues(0, 0, .5, .5);
                    this.addBehavior(b);
                }

                b.setValues(this.rotationAngle, angle, anchorX, anchorY).
                    setDelayTime(delay ? delay : 0, duration);

                if (interpolator) {
                    b.setInterpolator(interpolator);
                }

                return this;
            },

            /**
             *
             * @param scaleX {number} new X scale
             * @param scaleY {number} new Y scale
             * @param duration {number} time to rotate
             * @param delay {=number} millis to start rotation
             * @param anchorX {=number} rotation anchor x
             * @param anchorY {=number} rotation anchor y
             * @param interpolator {=CAAT.Behavior.Interpolator}
             * @return {*}
             */
            scaleTo:function (scaleX, scaleY, duration, delay, anchorX, anchorY, interpolator) {

                if (this.scaleX === scaleX && this.scaleY === scaleY) {
                    return;
                }

                var id = '__scaleTo';
                var b = this.getBehavior(id);
                if (!b) {
                    b = new CAAT.Behavior.ScaleBehavior().
                        setId(id).
                        setValues(1, 1, 1, 1, .5, .5);
                    this.addBehavior(b);
                }

                b.setValues(this.scaleX, scaleX, this.scaleY, scaleY, anchorX, anchorY).
                    setDelayTime(delay ? delay : 0, duration);

                if (interpolator) {
                    b.setInterpolator(interpolator);
                }

                return this;
            },

            /**
             *
             * @param scaleX {number} new X scale
             * @param duration {number} time to rotate
             * @param delay {=number} millis to start rotation
             * @param anchorX {=number} rotation anchor x
             * @param anchorY {=number} rotation anchor y
             * @param interpolator {=CAAT.Behavior.Interpolator}
             * @return {*}
             */
            scaleXTo:function (scaleX, duration, delay, anchorX, anchorY, interpolator) {
                return this.__scale1To(
                    CAAT.Behavior.Scale1Behavior.AXIS_X,
                    scaleX,
                    duration,
                    delay,
                    anchorX,
                    anchorY,
                    interpolator
                );
            },

            /**
             *
             * @param scaleY {number} new Y scale
             * @param duration {number} time to rotate
             * @param delay {=number} millis to start rotation
             * @param anchorX {=number} rotation anchor x
             * @param anchorY {=number} rotation anchor y
             * @param interpolator {=CAAT.Behavior.Interpolator}
             * @return {*}
             */
            scaleYTo:function (scaleY, duration, delay, anchorX, anchorY, interpolator) {
                return this.__scale1To(
                    CAAT.Behavior.Scale1Behavior.AXIS_Y,
                    scaleY,
                    duration,
                    delay,
                    anchorX,
                    anchorY,
                    interpolator
                );
            },

            /**
             * @param axis {CAAT.Scale1Behavior.AXIS_X|CAAT.Scale1Behavior.AXIS_Y} scale application axis
             * @param scale {number} new Y scale
             * @param duration {number} time to rotate
             * @param delay {=number} millis to start rotation
             * @param anchorX {=number} rotation anchor x
             * @param anchorY {=number} rotation anchor y
             * @param interpolator {=CAAT.Bahavior.Interpolator}
             * @return {*}
             */
            __scale1To:function (axis, scale, duration, delay, anchorX, anchorY, interpolator) {

                if (( axis === CAAT.Behavior.Scale1Behavior.AXIS_X && scale === this.scaleX) ||
                    ( axis === CAAT.Behavior.Scale1Behavior.AXIS_Y && scale === this.scaleY)) {

                    return;
                }

                var id = '__scaleXTo';
                var b = this.getBehavior(id);
                if (!b) {
                    b = new CAAT.Behavior.Scale1Behavior().
                        setId(id).
                        setValues(1, 1, axis === CAAT.Behavior.Scale1Behavior.AXIS_X, .5, .5);
                    this.addBehavior(b);
                }

                b.setValues(
                    axis ? this.scaleX : this.scaleY,
                    scale,
                    anchorX,
                    anchorY).
                    setDelayTime(delay ? delay : 0, duration);

                if (interpolator) {
                    b.setInterpolator(interpolator);
                }

                return this;
            },

            /**
             * Touch Start only received when CAAT.TOUCH_BEHAVIOR= CAAT.TOUCH_AS_MULTITOUCH
             * @param e <CAAT.TouchEvent>
             */
            touchStart:function (e) {
            },
            touchMove:function (e) {
            },
            touchEnd:function (e) {
            },
            gestureStart:function (rotation, scaleX, scaleY) {
            },
            gestureChange:function (rotation, scaleX, scaleY) {
                if (this.gestureEnabled) {
                    this.setRotation(rotation);
                    this.setScale(scaleX, scaleY);
                }
                return this;
            },
            gestureEnd:function (rotation, scaleX, scaleY) {
            },

            isVisible:function () {
                return this.visible;
            },

            invalidate:function () {
                this.invalid = true;
                return this;
            },
            setGestureEnabled:function (enable) {
                this.gestureEnabled = !!enable;
                return this;
            },
            isGestureEnabled:function () {
                return this.gestureEnabled;
            },
            getId:function () {
                return this.id;
            },
            setId:function (id) {
                this.id = id;
                return this;
            },
            /**
             * Set this actor's parent.
             * @param parent {CAAT.Foundation.ActorContainer}
             * @return this
             */
            setParent:function (parent) {
                this.parent = parent;
                return this;
            },
            /**
             * Set this actor's background image.
             * The need of a background image is to kept compatibility with the new CSSDirector class.
             * The image parameter can be either an Image/Canvas or a CAAT.Foundation.SpriteImage instance. If an image
             * is supplied, it will be wrapped into a CAAT.Foundation.SriteImage instance of 1 row by 1 column.
             * If the actor has set an image in the background, the paint method will draw the image, otherwise
             * and if set, will fill its background with a solid color.
             * If adjust_size_to_image is true, the host actor will be redimensioned to the size of one
             * single image from the SpriteImage (either supplied or generated because of passing an Image or
             * Canvas to the function). That means the size will be set to [width:SpriteImage.singleWidth,
             * height:singleHeight].
             *
             * WARN: if using a CSS renderer, the image supplied MUST be a HTMLImageElement instance.
             *
             * @see CAAT.Foundation.SpriteImage
             *
             * @param image {Image|HTMLCanvasElement|CAAT.Foundation.SpriteImage}
             * @param adjust_size_to_image {boolean} whether to set this actor's size based on image parameter.
             *
             * @return this
             */
            setBackgroundImage:function (image, adjust_size_to_image) {
                if (image) {
                    if (!(image instanceof CAAT.Foundation.SpriteImage)) {
                        if ( isString(image) ) {
                            image = new CAAT.Foundation.SpriteImage().initialize(CAAT.currentDirector.getImage(image), 1, 1);
                        } else {
                            image = new CAAT.Foundation.SpriteImage().initialize(image, 1, 1);
                        }
                    } else {
                        image= image.getRef();
                    }

                    image.setOwner(this);
                    this.backgroundImage = image;
                    if (typeof adjust_size_to_image === 'undefined' || adjust_size_to_image) {
                        this.width = image.getWidth();
                        this.height = image.getHeight();
                    }

                    this.glEnabled = true;

                    this.invalidate();

                } else {
                    this.backgroundImage = null;
                }

                return this;
            },
            /**
             * Set the actor's SpriteImage index from animation sheet.
             * @see CAAT.Foundation.SpriteImage
             * @param index {number}
             *
             * @return this
             */
            setSpriteIndex:function (index) {
                if (this.backgroundImage) {
                    this.backgroundImage.setSpriteIndex(index);
                    this.invalidate();
                }

                return this;

            },
            /**
             * Set this actor's background SpriteImage offset displacement.
             * The values can be either positive or negative meaning the texture space of this background
             * image does not start at (0,0) but at the desired position.
             * @see CAAT.Foundation.SpriteImage
             * @param ox {number} horizontal offset
             * @param oy {number} vertical offset
             *
             * @return this
             */
            setBackgroundImageOffset:function (ox, oy) {
                if (this.backgroundImage) {
                    this.backgroundImage.setOffset(ox, oy);
                }

                return this;
            },
            /**
             * Set this actor's background SpriteImage its animation sequence.
             * In its simplet's form a SpriteImage treats a given image as an array of rows by columns
             * subimages. If you define d Sprite Image of 2x2, you'll be able to draw any of the 4 subimages.
             * This method defines the animation sequence so that it could be set [0,2,1,3,2,1] as the
             * animation sequence
             * @param ii {Array<number>} an array of integers.
             */
            setAnimationImageIndex:function (ii) {
                if (this.backgroundImage) {
                    this.backgroundImage.resetAnimationTime();
                    this.backgroundImage.setAnimationImageIndex(ii);
                    this.invalidate();
                }
                return this;
            },

            addAnimation : function( name, array, time, callback ) {
                if (this.backgroundImage) {
                    this.backgroundImage.addAnimation(name, array, time, callback);
                }
                return this;
            },

            playAnimation : function(name) {
                if (this.backgroundImage) {
                    this.backgroundImage.playAnimation(name);
                }
                return this;
            },

            setAnimationEndCallback : function(f) {
                if (this.backgroundImage) {
                    this.backgroundImage.setAnimationEndCallback(f);
                }
                return this;
            },

            resetAnimationTime:function () {
                if (this.backgroundImage) {
                    this.backgroundImage.resetAnimationTime();
                    this.invalidate();
                }
                return this;
            },

            setChangeFPS:function (time) {
                if (this.backgroundImage) {
                    this.backgroundImage.setChangeFPS(time);
                }
                return this;

            },
            /**
             * Set this background image transformation.
             * If GL is enabled, this parameter has no effect.
             * @param it any value from CAAT.Foundation.SpriteImage.TR_*
             * @return this
             */
            setImageTransformation:function (it) {
                if (this.backgroundImage) {
                    this.backgroundImage.setSpriteTransformation(it);
                }
                return this;
            },
            /**
             * Center this actor at position (x,y).
             * @param x {number} x position
             * @param y {number} y position
             *
             * @return this
             * @deprecated
             */
            centerOn:function (x, y) {
                this.setPosition(x - this.width / 2, y - this.height / 2);
                return this;
            },
            /**
             * Center this actor at position (x,y).
             * @param x {number} x position
             * @param y {number} y position
             *
             * @return this
             */
            centerAt:function (x, y) {
                this.setPosition(
                    x - this.width * (.5 - this.tAnchorX ),
                    y - this.height * (.5 - this.tAnchorY ) );
                return this;
            },
            /**
             * If GL is enables, get this background image's texture page, otherwise it will fail.
             * @return {CAAT.GLTexturePage}
             */
            getTextureGLPage:function () {
                return this.backgroundImage.image.__texturePage;
            },
            /**
             * Set this actor invisible.
             * The actor is animated but not visible.
             * A container won't show any of its children if set visible to false.
             *
             * @param visible {boolean} set this actor visible or not.
             * @return this
             */
            setVisible:function (visible) {
                this.invalidate();
                // si estoy visible y quiero hacerme no visible
                if (CAAT.currentDirector && CAAT.currentDirector.dirtyRectsEnabled && !visible && this.visible) {
                    // if dirty rects, add this actor
                    CAAT.currentDirector.scheduleDirtyRect(this.AABB);
                }

                if ( visible && !this.visible) {
                    this.dirty= true;
                }

                this.visible = visible;
                return this;
            },
            /**
             * Puts an Actor out of time line, that is, won't be transformed nor rendered.
             * @return this
             */
            setOutOfFrameTime:function () {
                this.setFrameTime(-1, 0);
                return this;
            },
            /**
             * Adds an Actor's life cycle listener.
             * The developer must ensure the actorListener is not already a listener, otherwise
             * it will notified more than once.
             * @param actorListener {object} an object with at least a method of the form:
             * <code>actorLyfeCycleEvent( actor, string_event_type, long_time )</code>
             */
            addListener:function (actorListener) {
                this.lifecycleListenerList.push(actorListener);
                return this;
            },
            /**
             * Removes an Actor's life cycle listener.
             * It will only remove the first occurrence of the given actorListener.
             * @param actorListener {object} an Actor's life cycle listener.
             */
            removeListener:function (actorListener) {
                var n = this.lifecycleListenerList.length;
                while (n--) {
                    if (this.lifecycleListenerList[n] === actorListener) {
                        // remove the nth element.
                        this.lifecycleListenerList.splice(n, 1);
                        return;
                    }
                }
            },
            /**
             * Set alpha composition scope. global will mean this alpha value will be its children maximum.
             * If set to false, only this actor will have this alpha value.
             * @param global {boolean} whether the alpha value should be propagated to children.
             */
            setGlobalAlpha:function (global) {
                this.isGlobalAlpha = global;
                return this;
            },
            /**
             * Notifies the registered Actor's life cycle listener about some event.
             * @param sEventType an string indicating the type of event being notified.
             * @param time an integer indicating the time related to Scene's timeline when the event
             * is being notified.
             */
            fireEvent:function (sEventType, time) {
                for (var i = 0; i < this.lifecycleListenerList.length; i++) {
                    this.lifecycleListenerList[i].actorLifeCycleEvent(this, sEventType, time);
                }
            },
            /**
             * Sets this Actor as Expired.
             * If this is a Container, all the contained Actors won't be nor drawn nor will receive
             * any event. That is, expiring an Actor means totally taking it out the Scene's timeline.
             * @param time {number} an integer indicating the time the Actor was expired at.
             * @return this.
             */
            setExpired:function (time) {
                this.expired = true;
                this.fireEvent('expired', time);
                return this;
            },
            /**
             * Enable or disable the event bubbling for this Actor.
             * @param enable {boolean} a boolean indicating whether the event bubbling is enabled.
             * @return this
             */
            enableEvents:function (enable) {
                this.mouseEnabled = enable;
                return this;
            },
            /**
             * Removes all behaviors from an Actor.
             * @return this
             */
            emptyBehaviorList:function () {
                this.behaviorList = [];
                return this;
            },
            /**
             * Caches a fillStyle in the Actor.
             * @param style a valid Canvas rendering context fillStyle.
             * @return this
             */
            setFillStyle:function (style) {
                this.fillStyle = style;
                this.invalidate();
                return this;
            },
            /**
             * Caches a stroke style in the Actor.
             * @param style a valid canvas rendering context stroke style.
             * @return this
             */
            setStrokeStyle:function (style) {
                this.strokeStyle = style;
                this.invalidate();
                return this;
            },
            /**
             * @deprecated
             * @param paint
             */
            setPaint:function (paint) {
                return this.setFillStyle(paint);
            },
            /**
             * Stablishes the Alpha transparency for the Actor.
             * If it globalAlpha enabled, this alpha will the maximum alpha for every contained actors.
             * The alpha must be between 0 and 1.
             * @param alpha a float indicating the alpha value.
             * @return this
             */
            setAlpha:function (alpha) {
                this.alpha = alpha;
                this.invalidate();
                return this;
            },
            /**
             * Remove all transformation values for the Actor.
             * @return this
             */
            resetTransform:function () {
                this.rotationAngle = 0;
                this.rotationX = .5;
                this.rotationY = .5;
                this.scaleX = 1;
                this.scaleY = 1;
                this.scaleTX = .5;
                this.scaleTY = .5;
                this.scaleAnchor = 0;
                this.oldX = -1;
                this.oldY = -1;
                this.dirty = true;

                return this;
            },
            /**
             * Sets the time life cycle for an Actor.
             * These values are related to Scene time.
             * @param startTime an integer indicating the time until which the Actor won't be visible on the Scene.
             * @param duration an integer indicating how much the Actor will last once visible.
             * @return this
             */
            setFrameTime:function (startTime, duration) {
                this.start_time = startTime;
                this.duration = duration;
                this.expired = false;
                this.dirty = true;

                return this;
            },
            /**
             * This method should me overriden by every custom Actor.
             * It will be the drawing routine called by the Director to show every Actor.
             * @param director {CAAT.Foundation.Director} instance that contains the Scene the Actor is in.
             * @param time {number} indicating the Scene time in which the drawing is performed.
             */
            paint:function (director, time) {
                if (this.backgroundImage) {
                    this.backgroundImage.paint(director, time, 0, 0);
                } else if (this.fillStyle) {
                    var ctx = director.ctx;
                    ctx.fillStyle = this.fillStyle;
                    ctx.fillRect(0, 0, this.width, this.height);
                }

            },
            /**
             * A helper method to setScaleAnchored with an anchor of ANCHOR_CENTER
             *
             * @see setScaleAnchored
             *
             * @param sx a float indicating a width size multiplier.
             * @param sy a float indicating a height size multiplier.
             * @return this
             */
            setScale:function (sx, sy) {
                this.scaleX = sx;
                this.scaleY = sy;
                this.dirty = true;
                return this;
            },
            getAnchorPercent:function (anchor) {

                var anchors = [
                    .50, .50, .50, 0, .50, 1.00,
                    0, .50, 1.00, .50, 0, 0,
                    1.00, 0, 0, 1.00, 1.00, 1.00
                ];

                return { x:anchors[anchor * 2], y:anchors[anchor * 2 + 1] };
            },
            /**
             * Private.
             * Gets a given anchor position referred to the Actor.
             * @param anchor
             * @return an object of the form { x: float, y: float }
             */
            getAnchor:function (anchor) {
                var tx = 0, ty = 0;

                var A= CAAT.Foundation.Actor;

                switch (anchor) {
                    case A.ANCHOR_CENTER:
                        tx = .5;
                        ty = .5;
                        break;
                    case A.ANCHOR_TOP:
                        tx = .5;
                        ty = 0;
                        break;
                    case A.ANCHOR_BOTTOM:
                        tx = .5;
                        ty = 1;
                        break;
                    case A.ANCHOR_LEFT:
                        tx = 0;
                        ty = .5;
                        break;
                    case A.ANCHOR_RIGHT:
                        tx = 1;
                        ty = .5;
                        break;
                    case A.ANCHOR_TOP_RIGHT:
                        tx = 1;
                        ty = 0;
                        break;
                    case A.ANCHOR_BOTTOM_LEFT:
                        tx = 0;
                        ty = 1;
                        break;
                    case A.ANCHOR_BOTTOM_RIGHT:
                        tx = 1;
                        ty = 1;
                        break;
                    case A.ANCHOR_TOP_LEFT:
                        tx = 0;
                        ty = 0;
                        break;
                }

                return {x:tx, y:ty};
            },

            setGlobalAnchor:function (ax, ay) {
                this.tAnchorX = ax;
                this.rotationX = ax;
                this.scaleTX = ax;

                this.tAnchorY = ay;
                this.rotationY = ay;
                this.scaleTY = ay;

                this.dirty = true;
                return this;
            },

            setScaleAnchor:function (sax, say) {
                this.scaleTX = sax;
                this.scaleTY = say;
                this.dirty = true;
                return this;
            },
            /**
             * Modify the dimensions on an Actor.
             * The dimension will not affect the local coordinates system in opposition
             * to setSize or setBounds.
             *
             * @param sx {number} width scale.
             * @param sy {number} height scale.
             * @param anchorx {number} x anchor to perform the Scale operation.
             * @param anchory {number} y anchor to perform the Scale operation.
             *
             * @return this;
             */
            setScaleAnchored:function (sx, sy, anchorx, anchory) {
                this.scaleTX = anchorx;
                this.scaleTY = anchory;

                this.scaleX = sx;
                this.scaleY = sy;

                this.dirty = true;

                return this;
            },

            setRotationAnchor:function (rax, ray) {
                this.rotationX = ray;
                this.rotationY = rax;
                this.dirty = true;
                return this;
            },
            /**
             * A helper method for setRotationAnchored. This methods stablishes the center
             * of rotation to be the center of the Actor.
             *
             * @param angle a float indicating the angle in radians to rotate the Actor.
             * @return this
             */
            setRotation:function (angle) {
                this.rotationAngle = angle;
                this.dirty = true;
                return this;
            },
            /**
             * This method sets Actor rotation around a given position.
             * @param angle {number} indicating the angle in radians to rotate the Actor.
             * @param rx {number} value in the range 0..1
             * @param ry {number} value in the range 0..1
             * @return this;
             */
            setRotationAnchored:function (angle, rx, ry) {
                this.rotationAngle = angle;
                this.rotationX = rx;
                this.rotationY = ry;
                this.dirty = true;
                return this;
            },
            /**
             * Sets an Actor's dimension
             * @param w a float indicating Actor's width.
             * @param h a float indicating Actor's height.
             * @return this
             */
            setSize:function (w, h) {

                this.width = w;
                this.height = h;

                this.dirty = true;

                return this;
            },
            /**
             * Set location and dimension of an Actor at once.
             *
             * @param x{number} a float indicating Actor's x position.
             * @param y{number} a float indicating Actor's y position
             * @param w{number} a float indicating Actor's width
             * @param h{number} a float indicating Actor's height
             * @return this
             */
            setBounds:function (x, y, w, h) {

                this.x = x;
                this.y = y;
                this.width = w;
                this.height = h;

                this.dirty = true;

                return this;
            },
            /**
             * This method sets the position of an Actor inside its parent.
             *
             * @param x{number} a float indicating Actor's x position
             * @param y{number} a float indicating Actor's y position
             * @return this
             *
             * @deprecated
             */
            setLocation:function (x, y) {
                this.x = x;
                this.y = y;
                this.oldX = x;
                this.oldY = y;

                this.dirty = true;

                return this;
            },

            setPosition:function (x, y) {
                return this.setLocation(x, y);
            },

            setPositionAnchor:function (pax, pay) {
                this.tAnchorX = pax;
                this.tAnchorY = pay;
                return this;
            },

            setPositionAnchored:function (x, y, pax, pay) {
                this.setLocation(x, y);
                this.tAnchorX = pax;
                this.tAnchorY = pay;
                return this;
            },


            /**
             * This method is called by the Director to know whether the actor is on Scene time.
             * In case it was necessary, this method will notify any life cycle behaviors about
             * an Actor expiration.
             * @param time {number} time indicating the Scene time.
             *
             * @private
             *
             */
            isInAnimationFrame:function (time) {
                if (this.expired) {
                    return false;
                }

                if (this.duration === Number.MAX_VALUE) {
                    return this.start_time <= time;
                }

                if (time >= this.start_time + this.duration) {
                    if (!this.expired) {
                        this.setExpired(time);
                    }

                    return false;
                }

                return this.start_time <= time && time < this.start_time + this.duration;
            },
            /**
             * Checks whether a coordinate is inside the Actor's bounding box.
             * @param x {number} a float
             * @param y {number} a float
             *
             * @return boolean indicating whether it is inside.
             */
            contains:function (x, y) {
                return x >= 0 && y >= 0 && x < this.width && y < this.height;
            },

            /**
             * Add a Behavior to the Actor.
             * An Actor accepts an undefined number of Behaviors.
             *
             * @param behavior {CAAT.Behavior.BaseBehavior}
             * @return this
             */
            addBehavior:function (behavior) {
                this.behaviorList.push(behavior);
                return this;
            },

            /**
             * Remove a Behavior from the Actor.
             * If the Behavior is not present at the actor behavior collection nothing happends.
             *
             * @param behavior {CAAT.Behavior.BaseBehavior}
             */
            removeBehaviour:function (behavior) {
                var c = this.behaviorList;
                var n = c.length - 1;
                while (n) {
                    if (c[n] === behavior) {
                        c.splice(n, 1);
                        return this;
                    }
                }
                return this;
            },
            /**
             * Remove a Behavior with id param as behavior identifier from this actor.
             * This function will remove ALL behavior instances with the given id.
             *
             * @param id {number} an integer.
             * return this;
             */
            removeBehaviorById:function (id) {
                var c = this.behaviorList;
                for (var n = 0; n < c.length; n++) {
                    if (c[n].id === id) {
                        c.splice(n, 1);
                    }
                }

                return this;

            },
            getBehavior:function (id) {
                var c = this.behaviorList;
                for (var n = 0; n < c.length; n++) {
                    var cc = c[n];
                    if (cc.id === id) {
                        return cc;
                    }
                }
                return null;
            },
            /**
             * Set discardable property. If an actor is discardable, upon expiration will be removed from
             * scene graph and hence deleted.
             * @param discardable {boolean} a boolean indicating whether the Actor is discardable.
             * @return this
             */
            setDiscardable:function (discardable) {
                this.discardable = discardable;
                return this;
            },
            /**
             * This method will be called internally by CAAT when an Actor is expired, and at the
             * same time, is flagged as discardable.
             * It notifies the Actor life cycle listeners about the destruction event.
             *
             * @param time an integer indicating the time at wich the Actor has been destroyed.
             *
             * @private
             *
             */
            destroy:function (time) {
                if (this.parent) {
                    this.parent.removeChild(this);
                }

                this.fireEvent('destroyed', time);
                if ( !this.isCachedActor ) {
                    this.clean();
                }

            },

            clean : function() {
                this.backgroundImage= null;
                this.emptyBehaviorList();
                this.lifecycleListenerList= [];
            },

            /**
             * Transform a point or array of points in model space to view space.
             *
             * @param point {CAAT.Math.Point|Array} an object of the form {x : float, y: float}
             *
             * @return the source transformed elements.
             *
             * @private
             *
             */
            modelToView:function (point) {
                var x, y, pt, tm;

                if (this.dirty) {
                    this.setModelViewMatrix();
                }

                tm = this.worldModelViewMatrix.matrix;

                if (point instanceof Array) {
                    for (var i = 0; i < point.length; i++) {
                        //this.worldModelViewMatrix.transformCoord(point[i]);
                        pt = point[i];
                        x = pt.x;
                        y = pt.y;
                        pt.x = x * tm[0] + y * tm[1] + tm[2];
                        pt.y = x * tm[3] + y * tm[4] + tm[5];
                    }
                }
                else {
//                this.worldModelViewMatrix.transformCoord(point);
                    x = point.x;
                    y = point.y;
                    point.x = x * tm[0] + y * tm[1] + tm[2];
                    point.y = x * tm[3] + y * tm[4] + tm[5];
                }

                return point;
            },
            /**
             * Transform a local coordinate point on this Actor's coordinate system into
             * another point in otherActor's coordinate system.
             * @param point {CAAT.Math.Point}
             * @param otherActor {CAAT.Math.Actor}
             */
            modelToModel:function (point, otherActor) {
                if (this.dirty) {
                    this.setModelViewMatrix();
                }

                return otherActor.viewToModel(this.modelToView(point));
            },
            /**
             * Transform a point from model to view space.
             * <p>
             * WARNING: every call to this method calculates
             * actor's world model view matrix.
             *
             * @param point {CAAT.Math.Point} a point in screen space to be transformed to model space.
             *
             * @return the source point object
             *
             *
             */
            viewToModel:function (point) {
                if (this.dirty) {
                    this.setModelViewMatrix();
                }
                this.worldModelViewMatrix.getInverse(this.worldModelViewMatrixI);
                this.worldModelViewMatrixI.transformCoord(point);
                return point;
            },
            /**
             * Private
             * This method does the needed point transformations across an Actor hierarchy to devise
             * whether the parameter point coordinate lies inside the Actor.
             * @param point {CAAT.Math.Point}
             *
             * @return null if the point is not inside the Actor. The Actor otherwise.
             */
            findActorAtPosition:function (point) {
                if (this.scaleX===0 || this.scaleY===0) {
                    return null;
                }
                if (!this.visible || !this.mouseEnabled || !this.isInAnimationFrame(this.time)) {
                    return null;
                }

                this.modelViewMatrix.getInverse(this.modelViewMatrixI);
                this.modelViewMatrixI.transformCoord(point);
                return this.contains(point.x, point.y) ? this : null;
            },
            /**
             * Enables a default dragging routine for the Actor.
             * This default dragging routine allows to:
             *  <li>scale the Actor by pressing shift+drag
             *  <li>rotate the Actor by pressing control+drag
             *  <li>scale non uniformly by pressing alt+shift+drag
             *
             * @return this
             */
            enableDrag:function () {

                this.ax = 0;
                this.ay = 0;
                this.asx = 1;
                this.asy = 1;
                this.ara = 0;
                this.screenx = 0;
                this.screeny = 0;

                /**
                 * Mouse enter handler for default drag behavior.
                 * @param mouseEvent {CAAT.Event.MouseEvent}
                 *
                 * @ignore
                 */
                this.mouseEnter = function (mouseEvent) {
                    this.__d_ax = -1;
                    this.__d_ay = -1;
                    this.pointed = true;
                    CAAT.setCursor('move');
                };

                /**
                 * Mouse exit handler for default drag behavior.
                 * @param mouseEvent {CAAT.Event.MouseEvent}
                 *
                 * @ignore
                 */
                this.mouseExit = function (mouseEvent) {
                    this.__d_ax = -1;
                    this.__d_ay = -1;
                    this.pointed = false;
                    CAAT.setCursor('default');
                };

                /**
                 * Mouse move handler for default drag behavior.
                 * @param mouseEvent {CAAT.Event.MouseEvent}
                 *
                 * @ignore
                 */
                this.mouseMove = function (mouseEvent) {
                };

                /**
                 * Mouse up handler for default drag behavior.
                 * @param mouseEvent {CAAT.Event.MouseEvent}
                 *
                 * @ignore
                 */
                this.mouseUp = function (mouseEvent) {
                    this.__d_ax = -1;
                    this.__d_ay = -1;
                };

                /**
                 * Mouse drag handler for default drag behavior.
                 * @param mouseEvent {CAAT.Event.MouseEvent}
                 *
                 * @ignore
                 */
                this.mouseDrag = function (mouseEvent) {

                    var pt;

                    pt = this.modelToView(new CAAT.Math.Point(mouseEvent.x, mouseEvent.y));
                    this.parent.viewToModel(pt);

                    if (this.__d_ax === -1 || this.__d_ay === -1) {
                        this.__d_ax = pt.x;
                        this.__d_ay = pt.y;
                        this.__d_asx = this.scaleX;
                        this.__d_asy = this.scaleY;
                        this.__d_ara = this.rotationAngle;
                        this.__d_screenx = mouseEvent.screenPoint.x;
                        this.__d_screeny = mouseEvent.screenPoint.y;
                    }

                    if (mouseEvent.isShiftDown()) {
                        var scx = (mouseEvent.screenPoint.x - this.__d_screenx) / 100;
                        var scy = (mouseEvent.screenPoint.y - this.__d_screeny) / 100;
                        if (!mouseEvent.isAltDown()) {
                            var sc = Math.max(scx, scy);
                            scx = sc;
                            scy = sc;
                        }
                        this.setScale(scx + this.__d_asx, scy + this.__d_asy);

                    } else if (mouseEvent.isControlDown()) {
                        var vx = mouseEvent.screenPoint.x - this.__d_screenx;
                        var vy = mouseEvent.screenPoint.y - this.__d_screeny;
                        this.setRotation(-Math.atan2(vx, vy) + this.__d_ara);
                    } else {
                        this.x += pt.x - this.__d_ax;
                        this.y += pt.y - this.__d_ay;
                    }

                    this.__d_ax = pt.x;
                    this.__d_ay = pt.y;
                };

                return this;
            },
            disableDrag:function () {

                this.mouseEnter = function (mouseEvent) {
                };
                this.mouseExit = function (mouseEvent) {
                };
                this.mouseMove = function (mouseEvent) {
                };
                this.mouseUp = function (mouseEvent) {
                };
                this.mouseDrag = function (mouseEvent) {
                };

                return this;
            },
            /**
             * Default mouseClick handler.
             * Mouse click events are received after a call to mouseUp method if no dragging was in progress.
             *
             * @param mouseEvent {CAAT.Event.MouseEvent}
             */
            mouseClick:function (mouseEvent) {
            },
            /**
             * Default double click handler
             *
             * @param mouseEvent {CAAT.Event.MouseEvent}
             */
            mouseDblClick:function (mouseEvent) {
            },
            /**
             * Default mouse enter on Actor handler.
             * @param mouseEvent {CAAT.Event.MouseEvent}
             */
            mouseEnter:function (mouseEvent) {
                this.pointed = true;
            },
            /**
             * Default mouse exit on Actor handler.
             *
             * @param mouseEvent {CAAT.Event.MouseEvent}
             */
            mouseExit:function (mouseEvent) {
                this.pointed = false;
            },
            /**
             * Default mouse move inside Actor handler.
             *
             * @param mouseEvent {CAAT.Event.MouseEvent}
             */
            mouseMove:function (mouseEvent) {
            },
            /**
             * default mouse press in Actor handler.
             *
             * @param mouseEvent {CAAT.Event.MouseEvent}
             */
            mouseDown:function (mouseEvent) {
            },
            /**
             * default mouse release in Actor handler.
             *
             * @param mouseEvent {CAAT.Event.MouseEvent}
             */
            mouseUp:function (mouseEvent) {
            },
            mouseOut:function (mouseEvent) {
            },
            mouseOver:function (mouseEvent) {
            },
            /**
             * default Actor mouse drag handler.
             *
             * @param mouseEvent {CAAT.Event.MouseEvent}
             */
            mouseDrag:function (mouseEvent) {
            },
            /**
             * Draw a bounding box with on-screen coordinates regardless of the transformations
             * applied to the Actor.
             *
             * @param director {CAAT.Foundations.Director} object instance that contains the Scene the Actor is in.
             * @param time {number} integer indicating the Scene time when the bounding box is to be drawn.
             */
            drawScreenBoundingBox:function (director, time) {
                if (null !== this.AABB && this.inFrame) {
                    var s = this.AABB;
                    var ctx = director.ctx;
                    ctx.strokeStyle = CAAT.DEBUGAABBCOLOR;
                    ctx.strokeRect(.5 + (s.x | 0), .5 + (s.y | 0), s.width | 0, s.height | 0);
                    if (CAAT.DEBUGBB) {
                        var vv = this.viewVertices;
                        ctx.beginPath();
                        ctx.lineTo(vv[0].x, vv[0].y);
                        ctx.lineTo(vv[1].x, vv[1].y);
                        ctx.lineTo(vv[2].x, vv[2].y);
                        ctx.lineTo(vv[3].x, vv[3].y);
                        ctx.closePath();
                        ctx.strokeStyle = CAAT.DEBUGBBCOLOR;
                        ctx.stroke();
                    }
                }
            },
            /**
             * Private
             * This method is called by the Director instance.
             * It applies the list of behaviors the Actor has registered.
             *
             * @param director the CAAT.Foundation.Director object instance that contains the Scene the Actor is in.
             * @param time an integer indicating the Scene time when the bounding box is to be drawn.
             */
            animate:function (director, time) {

                if (!this.visible) {
                    return false;
                }

                var i;

                if (!this.isInAnimationFrame(time)) {
                    this.inFrame = false;
                    this.dirty = true;
                    return false;
                }

                if (this.x !== this.oldX || this.y !== this.oldY) {
                    this.dirty = true;
                    this.oldX = this.x;
                    this.oldY = this.y;
                }

                for (i = 0; i < this.behaviorList.length; i++) {
                    this.behaviorList[i].apply(time, this);
                }

                if (this.clipPath) {
                    this.clipPath.applyBehaviors(time);
                }

                // transformation stuff.
                this.setModelViewMatrix();

                if (this.dirty || this.wdirty || this.invalid) {
                    if (director.dirtyRectsEnabled) {
                        director.addDirtyRect(this.AABB);
                    }
                    this.setScreenBounds();
                    if (director.dirtyRectsEnabled) {
                        director.addDirtyRect(this.AABB);
                    }
                }
                this.dirty = false;
                this.invalid = false;

                this.inFrame = true;

                if ( this.backgroundImage ) {
                    this.backgroundImage.setSpriteIndexAtTime(time);
                }

                return this.AABB.intersects(director.AABB);
                //return true;
            },
            /**
             * Set this model view matrix if the actor is Dirty.
             *
             mm[2]+= this.x;
             mm[5]+= this.y;
             if ( this.rotationAngle ) {
                 this.modelViewMatrix.multiply( m.setTranslate( this.rotationX, this.rotationY) );
                 this.modelViewMatrix.multiply( m.setRotation( this.rotationAngle ) );
                 this.modelViewMatrix.multiply( m.setTranslate( -this.rotationX, -this.rotationY) );                    c= Math.cos( this.rotationAngle );
             }
             if ( this.scaleX!=1 || this.scaleY!=1 && (this.scaleTX || this.scaleTY )) {
                 this.modelViewMatrix.multiply( m.setTranslate( this.scaleTX , this.scaleTY ) );
                 this.modelViewMatrix.multiply( m.setScale( this.scaleX, this.scaleY ) );
                 this.modelViewMatrix.multiply( m.setTranslate( -this.scaleTX , -this.scaleTY ) );
             }
             *
             * @return this
             */
            setModelViewMatrix:function () {
                var c, s, _m00, _m01, _m10, _m11;
                var mm0, mm1, mm2, mm3, mm4, mm5;
                var mm;

                this.wdirty = false;
                mm = this.modelViewMatrix.matrix;

                if (this.dirty) {

                    mm0 = 1;
                    mm1 = 0;
                    //mm2= mm[2];
                    mm3 = 0;
                    mm4 = 1;
                    //mm5= mm[5];

                    mm2 = this.x - this.tAnchorX * this.width;
                    mm5 = this.y - this.tAnchorY * this.height;

                    if (this.rotationAngle) {

                        var rx = this.rotationX * this.width;
                        var ry = this.rotationY * this.height;

                        mm2 += mm0 * rx + mm1 * ry;
                        mm5 += mm3 * rx + mm4 * ry;

                        c = Math.cos(this.rotationAngle);
                        s = Math.sin(this.rotationAngle);
                        _m00 = mm0;
                        _m01 = mm1;
                        _m10 = mm3;
                        _m11 = mm4;
                        mm0 = _m00 * c + _m01 * s;
                        mm1 = -_m00 * s + _m01 * c;
                        mm3 = _m10 * c + _m11 * s;
                        mm4 = -_m10 * s + _m11 * c;

                        mm2 += -mm0 * rx - mm1 * ry;
                        mm5 += -mm3 * rx - mm4 * ry;
                    }
                    if (this.scaleX != 1 || this.scaleY != 1) {

                        var sx = this.scaleTX * this.width;
                        var sy = this.scaleTY * this.height;

                        mm2 += mm0 * sx + mm1 * sy;
                        mm5 += mm3 * sx + mm4 * sy;

                        mm0 = mm0 * this.scaleX;
                        mm1 = mm1 * this.scaleY;
                        mm3 = mm3 * this.scaleX;
                        mm4 = mm4 * this.scaleY;

                        mm2 += -mm0 * sx - mm1 * sy;
                        mm5 += -mm3 * sx - mm4 * sy;
                    }

                    mm[0] = mm0;
                    mm[1] = mm1;
                    mm[2] = mm2;
                    mm[3] = mm3;
                    mm[4] = mm4;
                    mm[5] = mm5;
                }

                if (this.parent) {


                    this.isAA = this.rotationAngle === 0 && this.scaleX === 1 && this.scaleY === 1 && this.parent.isAA;

                    if (this.dirty || this.parent.wdirty) {
                        this.worldModelViewMatrix.copy(this.parent.worldModelViewMatrix);
                        if (this.isAA) {
                            var mmm = this.worldModelViewMatrix.matrix;
                            mmm[2] += mm[2];
                            mmm[5] += mm[5];
                        } else {
                            this.worldModelViewMatrix.multiply(this.modelViewMatrix);
                        }
                        this.wdirty = true;
                    }

                } else {
                    if (this.dirty) {
                        this.wdirty = true;
                    }

                    this.worldModelViewMatrix.identity();
                    this.isAA = this.rotationAngle === 0 && this.scaleX === 1 && this.scaleY === 1;
                }


//if ( (CAAT.DEBUGAABB || glEnabled) && (this.dirty || this.wdirty ) ) {
                // screen bounding boxes will always be calculated.
                /*
                 if ( this.dirty || this.wdirty || this.invalid ) {
                 if ( director.dirtyRectsEnabled ) {
                 director.addDirtyRect( this.AABB );
                 }
                 this.setScreenBounds();
                 if ( director.dirtyRectsEnabled ) {
                 director.addDirtyRect( this.AABB );
                 }
                 }
                 this.dirty= false;
                 this.invalid= false;
                 */
            },
            /**
             * Calculates the 2D bounding box in canvas coordinates of the Actor.
             * This bounding box takes into account the transformations applied hierarchically for
             * each Scene Actor.
             *
             * @private
             *
             */
            setScreenBounds:function () {

                var AABB = this.AABB;
                var vv = this.viewVertices;
                var vvv, m, x, y, w, h;

                if (this.isAA) {
                    m = this.worldModelViewMatrix.matrix;
                    x = m[2];
                    y = m[5];
                    w = this.width;
                    h = this.height;
                    AABB.x = x;
                    AABB.y = y;
                    AABB.x1 = x + w;
                    AABB.y1 = y + h;
                    AABB.width = w;
                    AABB.height = h;

                    if (CAAT.GLRENDER) {
                        vvv = vv[0];
                        vvv.x = x;
                        vvv.y = y;
                        vvv = vv[1];
                        vvv.x = x + w;
                        vvv.y = y;
                        vvv = vv[2];
                        vvv.x = x + w;
                        vvv.y = y + h;
                        vvv = vv[3];
                        vvv.x = x;
                        vvv.y = y + h;
                    }

                    return this;
                }

                vvv = vv[0];
                vvv.x = 0;
                vvv.y = 0;
                vvv = vv[1];
                vvv.x = this.width;
                vvv.y = 0;
                vvv = vv[2];
                vvv.x = this.width;
                vvv.y = this.height;
                vvv = vv[3];
                vvv.x = 0;
                vvv.y = this.height;

                this.modelToView(this.viewVertices);

                var xmin = Number.MAX_VALUE, xmax = -Number.MAX_VALUE;
                var ymin = Number.MAX_VALUE, ymax = -Number.MAX_VALUE;

                vvv = vv[0];
                if (vvv.x < xmin) {
                    xmin = vvv.x;
                }
                if (vvv.x > xmax) {
                    xmax = vvv.x;
                }
                if (vvv.y < ymin) {
                    ymin = vvv.y;
                }
                if (vvv.y > ymax) {
                    ymax = vvv.y;
                }
                vvv = vv[1];
                if (vvv.x < xmin) {
                    xmin = vvv.x;
                }
                if (vvv.x > xmax) {
                    xmax = vvv.x;
                }
                if (vvv.y < ymin) {
                    ymin = vvv.y;
                }
                if (vvv.y > ymax) {
                    ymax = vvv.y;
                }
                vvv = vv[2];
                if (vvv.x < xmin) {
                    xmin = vvv.x;
                }
                if (vvv.x > xmax) {
                    xmax = vvv.x;
                }
                if (vvv.y < ymin) {
                    ymin = vvv.y;
                }
                if (vvv.y > ymax) {
                    ymax = vvv.y;
                }
                vvv = vv[3];
                if (vvv.x < xmin) {
                    xmin = vvv.x;
                }
                if (vvv.x > xmax) {
                    xmax = vvv.x;
                }
                if (vvv.y < ymin) {
                    ymin = vvv.y;
                }
                if (vvv.y > ymax) {
                    ymax = vvv.y;
                }

                AABB.x = xmin;
                AABB.y = ymin;
                AABB.x1 = xmax;
                AABB.y1 = ymax;
                AABB.width = (xmax - xmin);
                AABB.height = (ymax - ymin);

                return this;
            },
            /**
             * @private.
             * This method will be called by the Director to set the whole Actor pre-render process.
             *
             * @param director the CAAT.Foundation.Director object instance that contains the Scene the Actor is in.
             * @param time an integer indicating the Scene time when the bounding box is to be drawn.
             *
             * @return boolean indicating whether the Actor isInFrameTime
             */
            paintActor:function (director, time) {

                if (!this.visible || !director.inDirtyRect(this)) {
                    return true;
                }

                var ctx = director.ctx;

                this.frameAlpha = this.parent ? this.parent.frameAlpha * this.alpha : 1;
                ctx.globalAlpha = this.frameAlpha;

                director.modelViewMatrix.transformRenderingContextSet(ctx);
                this.worldModelViewMatrix.transformRenderingContext(ctx);

                if (this.clip) {
                    ctx.beginPath();
                    if (!this.clipPath) {
                        ctx.rect(0, 0, this.width, this.height);
                    } else {
                        this.clipPath.applyAsPath(director);
                    }
                    ctx.clip();
                }

                this.paint(director, time);

                return true;
            },
            /**
             * for js2native
             * @param director
             * @param time
             */
            __paintActor:function (director, time) {
                if (!this.visible) {
                    return true;
                }
                var ctx = director.ctx;

                // global opt: set alpha as owns alpha, not take globalAlpha procedure.
                this.frameAlpha = this.alpha;

                var m = this.worldModelViewMatrix.matrix;
                ctx.setTransform(m[0], m[3], m[1], m[4], m[2], m[5], this.frameAlpha);
                this.paint(director, time);
                return true;
            },

            /**
             * Set coordinates and uv values for this actor.
             * This function uses Director's coords and indexCoords values.
             * @param director
             * @param time
             */
            paintActorGL:function (director, time) {

                this.frameAlpha = this.parent.frameAlpha * this.alpha;

                if (!this.glEnabled || !this.visible) {
                    return;
                }

                if (this.glNeedsFlush(director)) {
                    director.glFlush();
                    this.glSetShader(director);

                    if (!this.__uv) {
                        this.__uv = new Float32Array(8);
                    }
                    if (!this.__vv) {
                        this.__vv = new Float32Array(12);
                    }

                    this.setGLCoords(this.__vv, 0);
                    this.setUV(this.__uv, 0);
                    director.glRender(this.__vv, 12, this.__uv);

                    return;
                }

                var glCoords = director.coords;
                var glCoordsIndex = director.coordsIndex;

                ////////////////// XYZ
                this.setGLCoords(glCoords, glCoordsIndex);
                director.coordsIndex = glCoordsIndex + 12;

                ////////////////// UV
                this.setUV(director.uv, director.uvIndex);
                director.uvIndex += 8;
            },
            /**
             * TODO: set GLcoords for different image transformations.
             *
             * @param glCoords
             * @param glCoordsIndex
             */
            setGLCoords:function (glCoords, glCoordsIndex) {

                var vv = this.viewVertices;
                glCoords[glCoordsIndex++] = vv[0].x;
                glCoords[glCoordsIndex++] = vv[0].y;
                glCoords[glCoordsIndex++] = 0;

                glCoords[glCoordsIndex++] = vv[1].x;
                glCoords[glCoordsIndex++] = vv[1].y;
                glCoords[glCoordsIndex++] = 0;

                glCoords[glCoordsIndex++] = vv[2].x;
                glCoords[glCoordsIndex++] = vv[2].y;
                glCoords[glCoordsIndex++] = 0;

                glCoords[glCoordsIndex++] = vv[3].x;
                glCoords[glCoordsIndex++] = vv[3].y;
                glCoords[glCoordsIndex  ] = 0;

            },
            /**
             * Set UV for this actor's quad.
             *
             * @param uvBuffer {Float32Array}
             * @param uvIndex {number}
             */
            setUV:function (uvBuffer, uvIndex) {
                this.backgroundImage.setUV(uvBuffer, uvIndex);
            },
            /**
             * Test for compulsory gl flushing:
             *  1.- opacity has changed.
             *  2.- texture page has changed.
             *
             */
            glNeedsFlush:function (director) {
                if (this.getTextureGLPage() !== director.currentTexturePage) {
                    return true;
                }
                if (this.frameAlpha !== director.currentOpacity) {
                    return true;
                }
                return false;
            },
            /**
             * Change texture shader program parameters.
             * @param director
             */
            glSetShader:function (director) {

                var tp = this.getTextureGLPage();
                if (tp !== director.currentTexturePage) {
                    director.setGLTexturePage(tp);
                }

                if (this.frameAlpha !== director.currentOpacity) {
                    director.setGLCurrentOpacity(this.frameAlpha);
                }
            },
            /**
             * @private.
             * This method is called after the Director has transformed and drawn a whole frame.
             *
             * @param director the CAAT.Foundation.Director object instance that contains the Scene the Actor is in.
             * @param time an integer indicating the Scene time when the bounding box is to be drawn.
             * @return this
             *
             * @deprecated
             */
            endAnimate:function (director, time) {
                return this;
            },
            initialize:function (overrides) {
                if (overrides) {
                    for (var i in overrides) {
                        this[i] = overrides[i];
                    }
                }

                return this;
            },
            /**
             * Set this Actor's clipping area.
             * @param enable {boolean} enable clip area.
             * @param clipPath {CAAT.Path.Path=} An optional path to apply clip with. If enabled and clipPath is not set,
             *  a rectangle will be used.
             */
            setClip:function (enable, clipPath) {
                this.clip = enable;
                this.clipPath = clipPath;
                return this;
            },

            isCached : function() {
                return this.cached;
            },

            stopCacheAsBitmap:function () {
                if (this.cached) {
                    this.backgroundImage = null;
                    this.cached = CAAT.Foundation.Actor.CACHE_NONE;
                }
            },

            /**
             *
             * @param time {Number=}
             * @param stragegy {CAAT.Foundation.Actor.CACHE_SIMPLE | CAAT.Foundation.Actor.CACHE_DEEP}
             * @return this
             */
            cacheAsBitmap:function (time, strategy) {

                if (this.width<=0 || this.height<=0 ) {
                    return this;
                }

                time = time || 0;
                var canvas = document.createElement('canvas');
                canvas.width = this.width;
                canvas.height = this.height;
                var ctx = canvas.getContext('2d');

                CAAT.Foundation.Actor.prototype.animate.call(this,CAAT.currentDirector,time);

                var director = {
                    ctx:ctx,
                    modelViewMatrix: new CAAT.Math.Matrix(),
                    worldModelViewMatrix: new CAAT.Math.Matrix(),
                    dirtyRectsEnabled:false,
                    inDirtyRect:function () {
                        return true;
                    },
                    AABB : new CAAT.Math.Rectangle(0,0,this.width,this.height)
                };

                var pmv = this.modelViewMatrix;
                var pwmv = this.worldModelViewMatrix;

                this.modelViewMatrix = new CAAT.Math.Matrix();
                this.worldModelViewMatrix = new CAAT.Math.Matrix();

                this.cached = CAAT.Foundation.Actor.CACHE_NONE;

                if ( typeof strategy==="undefined" ) {
                    strategy= CAAT.Foundation.Actor.CACHE_SIMPLE;
                }
                if ( strategy===CAAT.Foundation.Actor.CACHE_DEEP ) {
                    this.animate(director, time );
                    this.paintActor(director, time);
                } else {
                    if ( this instanceof CAAT.Foundation.ActorContainer || this instanceof CAAT.ActorContainer ) {
                        CAAT.Foundation.ActorContainer.superclass.paintActor.call(this, director, time);
                    } else {
                        this.animate(director, time );
                        this.paintActor(director, time);
                    }
                }
                this.setBackgroundImage(canvas);

                this.cached = strategy;

                this.modelViewMatrix = pmv;
                this.worldModelViewMatrix = pwmv;

                return this;
            },
            resetAsButton : function() {
                this.actionPerformed= null;
                this.mouseEnter=    function() {};
                this.mouseExit=     function() {};
                this.mouseDown=     function() {};
                this.mouseUp=       function() {};
                this.mouseClick=    function() {};
                this.mouseDrag=     function() {};
                return this;
            },
            /**
             * Set this actor behavior as if it were a Button. The actor size will be set as SpriteImage's
             * single size.
             *
             * @param buttonImage {CAAT.Foundation.SpriteImage} sprite image with button's state images.
             * @param iNormal {number} button's normal state image index
             * @param iOver {number} button's mouse over state image index
             * @param iPress {number} button's pressed state image index
             * @param iDisabled {number} button's disabled state image index
             * @param fn {function(button{CAAT.Foundation.Actor})} callback function
             */
            setAsButton:function (buttonImage, iNormal, iOver, iPress, iDisabled, fn) {

                var me = this;

                this.setBackgroundImage(buttonImage, true);

                this.iNormal = iNormal || 0;
                this.iOver = iOver || this.iNormal;
                this.iPress = iPress || this.iNormal;
                this.iDisabled = iDisabled || this.iNormal;
                this.fnOnClick = fn;
                this.enabled = true;

                this.setSpriteIndex(iNormal);

                /**
                 * Enable or disable the button.
                 * @param enabled {boolean}
                 * @ignore
                 */
                this.setEnabled = function (enabled) {
                    this.enabled = enabled;
                    this.setSpriteIndex(this.enabled ? this.iNormal : this.iDisabled);
                    return this;
                };

                /**
                 * This method will be called by CAAT *before* the mouseUp event is fired.
                 * @param event {CAAT.Event.MouseEvent}
                 * @ignore
                 */
                this.actionPerformed = function (event) {
                    if (this.enabled && this.fnOnClick) {
                        this.fnOnClick(this);
                    }
                };

                /**
                 * Button's mouse enter handler. It makes the button provide visual feedback
                 * @param mouseEvent {CAAT.Event.MouseEvent}
                 * @ignore
                 */
                this.mouseEnter = function (mouseEvent) {
                    if (!this.enabled) {
                        return;
                    }

                    if (this.dragging) {
                        this.setSpriteIndex(this.iPress);
                    } else {
                        this.setSpriteIndex(this.iOver);
                    }
                    CAAT.setCursor('pointer');
                };

                /**
                 * Button's mouse exit handler. Release visual apperance.
                 * @param mouseEvent {CAAT.MouseEvent}
                 * @ignore
                 */
                this.mouseExit = function (mouseEvent) {
                    if (!this.enabled) {
                        return;
                    }

                    this.setSpriteIndex(this.iNormal);
                    CAAT.setCursor('default');
                };

                /**
                 * Button's mouse down handler.
                 * @param mouseEvent {CAAT.MouseEvent}
                 * @ignore
                 */
                this.mouseDown = function (mouseEvent) {
                    if (!this.enabled) {
                        return;
                    }

                    this.setSpriteIndex(this.iPress);
                };

                /**
                 * Button's mouse up handler.
                 * @param mouseEvent {CAAT.MouseEvent}
                 * @ignore
                 */
                this.mouseUp = function (mouseEvent) {
                    if (!this.enabled) {
                        return;
                    }

                    this.setSpriteIndex(this.iNormal);
                    this.dragging = false;
                };

                /**
                 * Button's mouse click handler. Do nothing by default. This event handler will be
                 * called ONLY if it has not been drag on the button.
                 * @param mouseEvent {CAAT.MouseEvent}
                 * @ignore
                 */
                this.mouseClick = function (mouseEvent) {
                };

                /**
                 * Button's mouse drag handler.
                 * @param mouseEvent {CAAT.MouseEvent}
                 * @ignore
                 */
                this.mouseDrag = function (mouseEvent) {
                    if (!this.enabled) {
                        return;
                    }

                    this.dragging = true;
                };

                this.setButtonImageIndex = function (_normal, _over, _press, _disabled) {
                    this.iNormal = _normal || 0;
                    this.iOver = _over || this.iNormal;
                    this.iPress = _press || this.iNormal;
                    this.iDisabled = _disabled || this.iNormal;
                    this.setSpriteIndex(this.iNormal);
                    return this;
                };

                return this;
            },

            findActorById : function(id) {
                return this.id===id ? this : null;
            }
        }
    }
});
