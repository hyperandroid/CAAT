CAAT.Module({
    defines:"CAAT.Foundation.Actor",
    aliases:[ "CAAT.Actor" ],
    depends:[
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
    constants:{
        ANCHOR_CENTER:0, // constant values to determine different affine transform
        ANCHOR_TOP:1, // anchors.
        ANCHOR_BOTTOM:2,
        ANCHOR_LEFT:3,
        ANCHOR_RIGHT:4,
        ANCHOR_TOP_LEFT:5,
        ANCHOR_TOP_RIGHT:6,
        ANCHOR_BOTTOM_LEFT:7,
        ANCHOR_BOTTOM_RIGHT:8,
        ANCHOR_CUSTOM:9,

        NO_CACHE:0,
        CACHE_SIMPLE:1,
        CACHE_DEEP:2
    },
    extendsWith:function () {

        var __index = 0;

        return  {

            __init:function () {
                this.behaviorList = [];

                this.styleCache = {};
                this.lifecycleListenerList = [];
                this.scaleAnchor = this.ANCHOR_CENTER;
                this.behaviorList = [];

                this.domElement = document.createElement('div');
                this.domElement.style['position'] = 'absolute';
                this.domElement.style['-webkit-transform'] = 'translate3d(0,0,0)';
                this.domElement.style['-webkit-transition'] = 'all 0s linear';
                this.style('display', 'none');

                this.AABB = new CAAT.Rectangle();
                this.viewVertices = [
                    new CAAT.Point(0, 0, 0),
                    new CAAT.Point(0, 0, 0),
                    new CAAT.Point(0, 0, 0),
                    new CAAT.Point(0, 0, 0)
                ];

                this.setVisible(true);
                this.resetTransform();
                this.setScale(1, 1);
                this.setRotation(0);

                this.modelViewMatrix = new CAAT.Math.Matrix();
                this.modelViewMatrixI = new CAAT.Math.Matrix();
                this.worldModelViewMatrix = new CAAT.Math.Matrix();
                this.worldModelViewMatrixI = new CAAT.Math.Matrix();

                return this;
            },
            lifecycleListenerList:null, // Array of life cycle listener
            behaviorList:null, // Array of behaviors to apply to the Actor
            x:0, // x position on parent. In parent's local coord. system.
            y:0, // y position on parent. In parent's local coord. system.
            width:0, // Actor's width. In parent's local coord. system.
            height:0, // Actor's height. In parent's local coord. system.
            preferredSize:null, // actor's preferred size for layout. {CAAT.Dimension}
            minimumSize:null, // actor's minimum size for layout. {CAAT.Dimension},
            start_time:0, // Start time in Scene time.
            duration:Number.MAX_VALUE, // Actor duration in Scene time
            clip:false, // should clip the Actor's content against its contour.

            tAnchorX:0,
            tAnchorY:0,
            scaleX:0, // transformation. width scale parameter
            scaleY:0, // transformation. height scale parameter
            scaleTX:.50, // transformation. scale anchor x position
            scaleTY:.50, // transformation. scale anchor y position
            scaleAnchor:0, // transformation. scale anchor
            rotationAngle:0, // transformation. rotation angle in radians
            rotationY:.50, // transformation. rotation center y
            alpha:1, // alpha transparency value
            rotationX:.50, // transformation. rotation center x
            isGlobalAlpha:false, // is this a global alpha
            frameAlpha:1, // hierarchically calculated alpha for this Actor.
            expired:false, // set when the actor has been expired
            discardable:false, // set when you want this actor to be removed if expired

            domParent:null,
            domElement:null,

            visible:true,

            mouseEnabled:true,

            time:0, // Cache Scene time.
            inFrame:false, // boolean indicating whether this Actor was present on last frame.
            backgroundImage:null,

            size_active:1, // number of animated children
            size_total:1,

            id:null,

            __d_ax:-1, // for drag-enabled actors.
            __d_ay:-1,
            gestureEnabled:false,

            AABB:null,
            viewVertices:null, // model to view transformed vertices.
            isAA:true,

            preventLayout : false,

            setPreventLayout : function(b) {
                this.preventLayout= b;
                return this;
            },

            invalidate:function () {
                this.invalid = true;
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
                    this.preferredSize = new CAAT.Dimension();
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
                    this.minimumSize = new CAAT.Dimension();
                }

                this.minimumSize.width = pw;
                this.minimumSize.height = ph;
                return this;
            },

            getMinimumSize:function () {
                return this.minimumSize ? this.minimumSize :
                    new CAAT.Dimension(this.width, this.height);
            },

            isVisible:function () {
                return this.visible;
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
             * @param interpolator {=CAAT.Interpolator} a CAAT.Interpolator instance
             */
            moveTo:function (x, y, duration, delay, interpolator) {

                if (x === this.x && y === this.y) {
                    return;
                }

                var id = '__moveTo';
                var b = this.getBehavior(id);
                if (!b) {
                    b = new CAAT.PathBehavior().
                        setId(id).
                        setValues(new CAAT.LinearPath());
                    this.addBehavior(b);
                }

                b.path.setInitialPosition(this.x, this.y).setFinalPosition(x, y);
                b.setDelayTime(delay ? delay : 0, duration);
                if (interpolator) {
                    b.setInterpolator(interpolator);
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
             * @param interpolator {CAAT.Interpolator=}
             * @return {*}
             */
            rotateTo:function (angle, duration, delay, anchorX, anchorY, interpolator) {

                if (angle === this.rotationAngle) {
                    return;
                }

                var id = '__rotateTo';
                var b = this.getBehavior(id);
                if (!b) {
                    b = new CAAT.RotateBehavior().
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
             * @param interpolator {=CAAT.Interpolator}
             * @return {*}
             */
            scaleTo:function (scaleX, scaleY, duration, delay, anchorX, anchorY, interpolator) {

                if (this.scaleX === scaleX && this.scaleY === scaleY) {
                    return;
                }

                var id = '__scaleTo';
                var b = this.getBehavior(id);
                if (!b) {
                    b = new CAAT.ScaleBehavior().
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
             * @param interpolator {=CAAT.Interpolator}
             * @return {*}
             */
            scaleXTo:function (scaleX, duration, delay, anchorX, anchorY, interpolator) {
                return this.__scale1To(
                    CAAT.Scale1Behavior.AXIS_X,
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
             * @param interpolator {=CAAT.Interpolator}
             * @return {*}
             */
            scaleYTo:function (scaleY, duration, delay, anchorX, anchorY, interpolator) {
                return this.__scale1To(
                    CAAT.Scale1Behavior.AXIS_Y,
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
             * @param interpolator {=CAAT.Interpolator}
             * @return {*}
             */
            __scale1To:function (axis, scale, duration, delay, anchorX, anchorY, interpolator) {

                if (( axis === CAAT.Scale1Behavior.AXIS_X && scale === this.scaleX) ||
                    ( axis === CAAT.Scale1Behavior.AXIS_Y && scale === this.scaleY)) {

                    return;
                }

                var id = '__scaleXTo';
                var b = this.getBehavior(id);
                if (!b) {
                    b = new CAAT.Scale1Behavior().
                        setId(id).
                        setValues(1, 1, axis === CAAT.Scale1Behavior.AXIS_X, .5, .5);
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

                if (this.isAA) {
                    var m = this.worldModelViewMatrix.matrix;
                    AABB.x = m[2];
                    AABB.y = m[5];
                    AABB.x1 = m[2] + this.width;
                    AABB.y1 = m[5] + this.height;
                    AABB.width = AABB.x1 - AABB.x;
                    AABB.height = AABB.y1 - AABB.y;
                    return this;
                }


                var vvv;

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
             * Set this Actor's parent and connect in CSS a div with its parent.
             * In case there's a parent set, previously the div will be removed from
             * its old parent and reattached to the new one.
             * @param parent {CAAT.ActorContainerCSS|CAAT.Actor}
             * @return this
             */
            setParent:function (parent) {
                if (this.parent) {
                    try {
                        this.domParent.removeChild(this.domElement);
                    } catch (e) {
                        // when changing a parent, make sure the operation does not fail.
                        // it may happen a root node has had removed its children and all the dom hierarchy
                        // may have been lost.
                    }
                }

                this.parent = parent;
                if (null != parent) {
                    this.parent.domElement.appendChild(this.domElement);
                    this.domParent = this.parent.domElement;
                } else {
                    this.domParent = null;
                }

                this.dirty = true;

                return this;
            },

            /**
             * Set this actor's background image.
             * The need of a background image is to kept compatibility with the new CSSDirector class.
             * The image parameter can be either an Image/Canvas or a CAAT.SpriteImage instance. If an image
             * is supplied, it will be wrapped into a CAAT.SriteImage instance of 1 row by 1 column.
             * If the actor has set an image in the background, the paint method will draw the image, otherwise
             * and if set, will fill its background with a solid color.
             * If adjust_size_to_image is true, the host actor will be redimensioned to the size of one
             * single image from the SpriteImage (either supplied or generated because of passing an Image or
             * Canvas to the function). That means the size will be set to [width:SpriteImage.singleWidth,
             * height:singleHeight].
             *
             * It is absolutely recommended not using a Canvas as argument. The performance
             * of canvas.toDataURL (despite its result being cached) is very poor.
             *
             * @see CAAT.SpriteImage
             *
             * @param image {Image|Canvas|CAAT.SpriteImage}
             * @param adjust_size_to_image {boolean} whether to set this actor's size based on image parameter.
             * @throws 'Invalid image object to set actor's background' in case the image parameter is not of the
             *  valid type.
             * @return this
             */
            setBackgroundImage:function (image, adjust_size_to_image) {
                if (image) {
                    // Opera will complaint about instanceof Image, so better HTMLImageElement.
                    if (image instanceof HTMLImageElement) {
                        image = new CAAT.Foundation.SpriteImage().initialize(image, 1, 1);
                    } else if (image instanceof HTMLCanvasElement) {
                        image.src = image.toDataURL();
                        image = new CAAT.Foundation.SpriteImage().initialize(image, 1, 1);
                    } else if (image instanceof CAAT.SpriteImage) {
                        if (image.image instanceof HTMLCanvasElement) {
                            if (!image.image.src) {
                                image.image.src = image.image.toDataURL();
                            }
                        }
                    } else if (isString(image)) {
                        image= new CAAT.Foundation.SpriteImage().initialize( CAAT.currentDirector.getImage(image), 1, 1 );
                    } else {
                        throw "Invalid image object to set actor's background";
                    }

                    image.setOwner(this);
                    this.backgroundImage = image;
                    if (typeof adjust_size_to_image === 'undefined' || adjust_size_to_image) {
                        this.setSize(image.getWidth(), image.getHeight());
                    }

                    this.style(
                        'background',
                        'url(' + this.backgroundImage.image.src + ') ' +
                            this.backgroundImage.getCurrentSpriteImageCSSPosition());
                } else {
                    this.backgroundImage = null;
                    this.style('background', 'none');
                }

                return this;
            },
            /**
             * Set the actor's SpriteImage index from animation sheet.
             * @see CAAT.SpriteImage
             * @param index {integer}
             *
             * @return this
             */
            setSpriteIndex:function (index) {
                if (this.backgroundImage) {
                    this.backgroundImage.setSpriteIndex(index);

                    this.style(
                        'background',
                        'url(' + this.backgroundImage.image.src + ') ' +
                            this.backgroundImage.getCurrentSpriteImageCSSPosition());

                }

                return this;

            },
            /**
             * Set this actor's background SpriteImage offset displacement.
             * The values can be either positive or negative meaning the texture space of this background
             * image does not start at (0,0) but at the desired position.
             * @see CAAT.SpriteImage
             * @param ox {integer} horizontal offset
             * @param oy {integer} vertical offset
             *
             * @return this
             */
            setBackgroundImageOffset:function (ox, oy) {
                if (this.backgroundImage) {
                    this.backgroundImage.setOffset(ox, oy);
                    this.style(
                        'background',
                        'url(' + this.backgroundImage.image.src + ') ' +
                            this.backgroundImage.getCurrentSpriteImageCSSPosition());
                }

                return this;
            },
            /**
             * Set this actor's background SpriteImage its animation sequence.
             * In its simplet's form a SpriteImage treats a given image as an array of rows by columns
             * subimages. If you define d Sprite Image of 2x2, you'll be able to draw any of the 4 subimages.
             * This method defines the animation sequence so that it could be set [0,2,1,3,2,1] as the
             * animation sequence
             * @param ii {array<integer>} an array of integers.
             */
            setAnimationImageIndex:function (ii) {
                if (this.backgroundImage) {
                    this.backgroundImage.setAnimationImageIndex(ii);
                    this.style(
                        'background',
                        'url(' + this.backgroundImage.image.src + ') ' +
                            this.backgroundImage.getCurrentSpriteImageCSSPosition());
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
            },


            setChangeFPS:function (time) {
                if (this.backgroundImage) {
                    this.backgroundImage.setChangeFPS(time);
                }
                return this;
            },
            /**
             * This method has no effect on ActorCSS
             * @param it any value from CAAT.Actor.TR_*
             * @return this
             */
            setImageTransformation:function (it) {
                this.transformation = it;
                if (it === CAAT.Foundation.SpriteImage.TR_FIXED_TO_SIZE) {
                    this.style('background-size', '100%');
                } else if (it === CAAT.Foundation.SpriteImage.TR_NONE) {
                    this.style('background-size', 'auto');
                }
                return this;
            },
            /**
             * Center this actor at position (x,y).
             * @param x {float} x position
             * @param y {float} y position
             *
             * @return this
             */
            centerOn:function (x, y) {
                this.setLocation(x - this.width / 2, y - this.height / 2);
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
                return this.centerOn(x, y);
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
                this.visible = visible;
                return this;
            },
            style:function (attr, value) {
                if (value !== this.styleCache[attr]) {
                    this.styleCache[attr] = value;
                    this.domElement.style[attr] = value;
                }
            },
            style3:function () {

                var imageop = '';
                if (this.transformation === CAAT.Foundation.SpriteImage.TR_FLIP_HORIZONTAL) {
                    imageop = ' scale(-1,1) ';
                }

                this.rotationAngle = Math.round(this.rotationAngle * 100) / 100;

                var value =
                    "translate(" + this.x + "px," + this.y + "px) " +
                        "rotate(" + this.rotationAngle + "rad) scale(" + this.scaleX + "," + this.scaleY + ")" +
                        imageop;

                if (value !== this.styleCache['transform']) {
                    this.domElement.style['-ms-transform'] = value;
                    this.domElement.style['-webkit-transform'] = "translate3d(0,0,0) " + value;
                    this.domElement.style.OTransform = value;
                    this.domElement.style.MozTransform = value;
                    this.domElement.style['transform'] = value;
                    this.styleCache['transform'] = value;
                }

                var anchor = '' + (this.rotationX * 100) + '% ' +
                    (this.rotationY * 100) + '% ';

                if (anchor !== this.styleCache['transform-origin']) {
                    this.domElement.style['transform-origin'] = anchor;
                    this.domElement.style['-webkit-transform-origin'] = anchor;
                    this.domElement.style['-ms-transform-origin'] = anchor;
                    this.domElement.style.OTransformOrigin = anchor;
                    this.domElement.style.MozTransformOrigin = anchor;
                    this.styleCache['transform-origin'] = anchor;
                }

                return this;
            },
            styleAlpha:function (alpha) {
                if (this.alpha !== this.styleCache['opacity']) {
                    this.domElement.style['filter'] = 'alpha(opacity=' + ((this.alpha * 100) >> 0) + ')';
                    this.domElement.style.Oopacity = this.alpha;
                    this.domElement.style.MozOpacity = this.alpha;
                    this.domElement.style['-khtml-opacity'] = this.alpha;
                    this.domElement.style.opacity = this.alpha;
                    this.styleCache['opacity'] = this.alpha;
                }

                return this;
            },
            /**
             * Puts an Actor out of time line, that is, won't be transformed nor rendered.
             * @return this
             */
            setOutOfFrameTime:function () {
                this.setFrameTime(-1, 0);
                this.style('display', 'none');
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
                this.style('display', 'none');
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
            /*
             emptyKeyframesList : function() {
             this.keyframesList= [];
             },
             */
            /**
             * Caches a fillStyle in the Actor.
             * @param style a valid Canvas rendering context fillStyle.
             * @return this
             */
            setFillStyle:function (style) {
                this.style('background', style);
                return this;
            },
            /**
             * Caches a stroke style in the Actor.
             * @param style a valid canvas rendering context stroke style.
             * @return this
             */
            setStrokeStyle:function (style) {
                return this;
            },
            /**
             * @deprecated
             * @param paint
             */
            setPaint:function (paint) {
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

                this.style3();

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
             * @param director the CAAT.Director instance that contains the Scene the Actor is in.
             * @param time an integer indicating the Scene time in which the drawing is performed.
             */
            paint:function (director, time) {
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
                this.setScaleAnchored(sx, sy, .5, .5);
                return this;
            },
            /**
             * Private.
             * Gets a given anchor position referred to the Actor.
             * @param anchor
             * @return an object of the form { x: float, y: float }
             */
            getAnchor:function (anchor) {
                var tx = 0, ty = 0;

                switch (anchor) {
                    case this.ANCHOR_CENTER:
                        tx = .5;
                        ty = .5;
                        break;
                    case this.ANCHOR_TOP:
                        tx = .5;
                        ty = 0;
                        break;
                    case this.ANCHOR_BOTTOM:
                        tx = .5;
                        ty = 1;
                        break;
                    case this.ANCHOR_LEFT:
                        tx = 0;
                        ty = .5;
                        break;
                    case this.ANCHOR_RIGHT:
                        tx = 1;
                        ty = .5;
                        break;
                    case this.ANCHOR_TOP_RIGHT:
                        tx = 1;
                        ty = 0;
                        break;
                    case this.ANCHOR_BOTTOM_LEFT:
                        tx = 0;
                        ty = 1;
                        break;
                    case this.ANCHOR_BOTTOM_RIGHT:
                        tx = 1;
                        ty = 1;
                        break;
                    case this.ANCHOR_TOP_LEFT:
                        tx = 0;
                        ty = 0;
                        break;
                }

                return {x:tx, y:ty};
            },
            getAnchorPercent:function (anchor) {

                var anchors = [
                    .50, .50, .50, 0, .50, 1.00,
                    0, .50, 1.00, .50, 0, 0,
                    1.00, 0, 0, 1.00, 1.00, 1.00
                ];

                return { x:anchors[anchor * 2], y:anchors[anchor * 2 + 1] };
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
                this.rotationX = sax;
                this.rotationY = say;
                this.scaleTX = sax;
                this.scaleTY = say;

                this.style3();

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
                this.rotationX = anchorx;
                this.rotationY = anchory;
                this.scaleTX = anchorx;
                this.scaleTY = anchory;

                this.scaleX = sx;
                this.scaleY = sy;

                this.style3();

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
                this.style3();
                this.dirty = true;
                return this;
            },

            setRotationAnchor:function (rax, ray) {
                this.rotationX = ray;
                this.rotationY = rax;
                this.style3();
                this.dirty = true;
                return this;
            },

            setRotationAnchored:function (angle, rx, ry) {
                this.rotationAngle = angle;
                this.rotationX = rx;
                this.rotationY = ry;
                this.style3();

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

                this.style('width', '' + w + 'px');
                this.style('height', '' + h + 'px');

                this.dirty = true;

                return this;
            },
            /**
             * Set location and dimension of an Actor at once.
             *
             * as http://jsperf.com/drawimage-whole-pixels states, drawing at whole pixels rocks while at subpixels sucks.
             * thanks @pbakaus
             *
             * @param x a float indicating Actor's x position.
             * @param y a float indicating Actor's y position
             * @param w a float indicating Actor's width
             * @param h a float indicating Actor's height
             * @return this
             */
            setBounds:function (x, y, w, h) {
                //this.x= x;
                //this.y= y;
                this.x = x;
                this.y = y;
                this.width = w;
                this.height = h;

                this.setLocation(x, y);
                this.setSize(w, h);

                return this;
            },


            setPosition:function (x, y) {
                return this.setLocation(x, y);
            },

            setPositionAnchor:function (pax, pay) {
                this.tAnchorX = pax;
                this.tAnchorY = pay;
                this.style3();
                this.dirty = true;
                return this;
            },

            setPositionAnchored:function (x, y, pax, pay) {
                this.setLocation(x, y);
                this.tAnchorX = pax;
                this.tAnchorY = pay;
                return this;
            },


            /**
             * This method sets the position of an Actor inside its parent.
             *
             * as http://jsperf.com/drawimage-whole-pixels states, drawing at whole pixels rocks while at subpixels sucks.
             * thanks @pbakaus
             *
             * @param x a float indicating Actor's x position
             * @param y a float indicating Actor's y position
             * @return this
             */
            setLocation:function (x, y) {

                this.x = x;
                this.y = y;

                this.style3();
                /*
                 this.style('left', x+'px');
                 this.style('top',  y+'px');
                 */
                this.dirty = true;

                return this;
            },
            /**
             * This method is called by the Director to know whether the actor is on Scene time.
             * In case it was necessary, this method will notify any life cycle behaviors about
             * an Actor expiration.
             * @param time an integer indicating the Scene time.
             *
             * @private
             *
             */
            isInAnimationFrame:function (time) {
                if (this.expired) {
                    return false;
                }

                if (this.duration === Number.MAX_VALUE) {
                    if (this.start_time <= time) {
                        return true;
                    } else {
                        return false;
                    }
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
             addKeyframes : function( keyframe, start, duration, cycle ) {
            this.keyframesList.push( new CAAT.KeyframesDescriptor( keyframe, start, duration, cycle ) );
        },

             scheduleKeyframes : function( id, startTime, duration ) {
            var kf= this.getKeyframesDescriptor(id);
            if ( kf ) {
                kf.schedule( startTime, duration );
            }
            return this;
        },

             removeKeyframes : function( keyframe ) {
            var kfs= this.keyframesList;
            for( var i=0; i<kfs.length; i++ ) {
                if ( kfs[i].keyframe===keyframe ) {
                    kfs.splice(i,1);
                    return this;
                }
            }

            return this;
        },

             removeKeyframesById : function( keyframe ) {
            var kfs= this.keyframesList;
            for( var i=0; i<kfs.length; i++ ) {
                if ( kfs[i].id===id ) {
                    kfs.splice(i,1);
                    return this;
                }
            }

            return this;
        },

             getKeyframesDescriptor : function( id ) {
            var kfs= this.keyframesList;
            var kf;
            for( var i=0; i<kfs.length; i++ ) {
                kf= kfs[i];
                if ( kf.id===id ) {
                    return kf;
                }
            }

            return null;

        },
             */
            /**
             * Add a Behavior to the Actor.
             * An Actor accepts an undefined number of Behaviors.
             *
             * @param behavior {CAAT.Behavior} a CAAT.Behavior instance
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
             * @param behavior {CAAT.Behavior} a CAAT.Behavior instance.
             */
            removeBehaviour:function (behavior) {
                var c = this.behaviorList
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
                this.parent = null;
                this.domParent = null;
                this.fireEvent('destroyed', time);
            },
            /**
             * Transform a point or array of points in model space to view space.
             *
             * @param point {CAAT.Point|Array} an object of the form {x : float, y: float}
             *
             * @return the source transformed elements.
             *
             * @private
             *
             */
            modelToView:function (point) {
                if (point instanceof Array) {
                    for (var i = 0; i < point.length; i++) {
                        this.worldModelViewMatrix.transformCoord(point[i]);
                    }
                }
                else {
                    this.worldModelViewMatrix.transformCoord(point);
                }

                return point;
            }, /**
             * Transform a point from model to view space.
             * <p>
             * WARNING: every call to this method calculates
             * actor's world model view matrix.
             *
             * @param point {CAAT.Point} a point in screen space to be transformed to model space.
             *
             * @return the source point object
             *
             *
             */
            viewToModel:function (point) {
                this.worldModelViewMatrix.getInverse(this.worldModelViewMatrixI);
                this.worldModelViewMatrixI.transformCoord(point);
                return point;
            },
            /**
             * Transform a local coordinate point on this Actor's coordinate system into
             * another point in otherActor's coordinate system.
             * @param point {CAAT.Point}
             * @param otherActor {CAAT.Actor}
             */
            modelToModel:function (point, otherActor) {
                return otherActor.viewToModel(this.modelToView(point));
            },

            /**
             * Private
             * This method does the needed point transformations across an Actor hierarchy to devise
             * whether the parameter point coordinate lies inside the Actor.
             * @param point an object of the form { x: float, y: float }
             *
             * @return null if the point is not inside the Actor. The Actor otherwise.
             */
            findActorAtPosition:function (point) {
                if (this.scaleX===0 || this.scaleY===0) {
                    return null;
                }

                if (!this.mouseEnabled || !this.isInAnimationFrame(this.time)) {
                    return null;
                }

                this.setModelViewMatrix();
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
                this.mx = 0;
                this.my = 0;
                this.asx = 1;
                this.asy = 1;
                this.ara = 0;
                this.screenx = 0;
                this.screeny = 0;

                /**
                 * Mouse enter handler for default drag behavior.
                 * @param mouseEvent {CAAT.MouseEvent}
                 *
                 * @inner
                 */
                this.mouseEnter = function (mouseEvent) {
                    this.ax = -1;
                    this.ay = -1;
                    this.pointed = true;
                    CAAT.setCursor('move');
                };

                /**
                 * Mouse exit handler for default drag behavior.
                 * @param mouseEvent {CAAT.MouseEvent}
                 *
                 * @inner
                 */
                this.mouseExit = function (mouseEvent) {
                    this.ax = -1;
                    this.ay = -1;
                    this.pointed = false;
                    CAAT.setCursor('default');
                };

                /**
                 * Mouse move handler for default drag behavior.
                 * @param mouseEvent {CAAT.MouseEvent}
                 *
                 * @inner
                 */
                this.mouseMove = function (mouseEvent) {
                    this.mx = mouseEvent.point.x;
                    this.my = mouseEvent.point.y;
                };

                /**
                 * Mouse up handler for default drag behavior.
                 * @param mouseEvent {CAAT.MouseEvent}
                 *
                 * @inner
                 */
                this.mouseUp = function (mouseEvent) {
                    this.ax = -1;
                    this.ay = -1;
                };

                /**
                 * Mouse drag handler for default drag behavior.
                 * @param mouseEvent {CAAT.MouseEvent}
                 *
                 * @inner
                 */
                this.mouseDrag = function (mouseEvent) {

                    if (this.ax === -1 || this.ay === -1) {
                        this.ax = mouseEvent.point.x;
                        this.ay = mouseEvent.point.y;
                        this.asx = this.scaleX;
                        this.asy = this.scaleY;
                        this.ara = this.rotationAngle;
                        this.screenx = mouseEvent.screenPoint.x;
                        this.screeny = mouseEvent.screenPoint.y;
                    }

                    if (mouseEvent.isShiftDown()) {
                        var scx = (mouseEvent.screenPoint.x - this.screenx) / 100;
                        var scy = (mouseEvent.screenPoint.y - this.screeny) / 100;
                        if (!mouseEvent.isAltDown()) {
                            var sc = Math.max(scx, scy);
                            scx = sc;
                            scy = sc;
                        }
                        this.setScale(scx + this.asx, scy + this.asy);

                    } else if (mouseEvent.isControlDown()) {
                        var vx = mouseEvent.screenPoint.x - this.screenx;
                        var vy = mouseEvent.screenPoint.y - this.screeny;
                        this.setRotation(-Math.atan2(vx, vy) + this.ara);
                    } else {
                        this.setLocation(
                            this.x + mouseEvent.point.x - this.ax,
                            this.y + mouseEvent.point.y - this.ay);
                        this.ax = mouseEvent.point.x;
                        this.ay = mouseEvent.point.y;
                    }


                };

                return this;
            },
            /**
             * Default mouseClick handler.
             * Mouse click events are received after a call to mouseUp method if no dragging was in progress.
             *
             * @param mouseEvent a CAAT.MouseEvent object instance.
             */
            mouseClick:function (mouseEvent) {
            },
            /**
             * Default double click handler
             *
             * @param mouseEvent a CAAT.MouseEvent object instance.
             */
            mouseDblClick:function (mouseEvent) {
            },
            /**
             * Default mouse enter on Actor handler.
             * @param mouseEvent a CAAT.MouseEvent object instance.
             */
            mouseEnter:function (mouseEvent) {
                this.pointed = true;
            },
            /**
             * Default mouse exit on Actor handler.
             *
             * @param mouseEvent a CAAT.MouseEvent object instance.
             */
            mouseExit:function (mouseEvent) {
                this.pointed = false;
            },
            /**
             * Default mouse move inside Actor handler.
             *
             * @param mouseEvent a CAAT.MouseEvent object instance.
             */
            mouseMove:function (mouseEvent) {
            },
            /**
             * default mouse press in Actor handler.
             *
             * @param mouseEvent a CAAT.MouseEvent object instance.
             */
            mouseDown:function (mouseEvent) {
            },
            /**
             * default mouse release in Actor handler.
             *
             * @param mouseEvent a CAAT.MouseEvent object instance.
             */
            mouseUp:function (mouseEvent) {
            },
            /**
             * default Actor mouse drag handler.
             *
             * @param mouseEvent a CAAT.MouseEvent object instance.
             */
            mouseDrag:function (mouseEvent) {
            },
            mouseOut:function (mouseEvent) {
            },
            mouseOver:function (mouseEvent) {
            },
            /**
             * Draw a bounding box with on-screen coordinates regardless of the transformations
             * applied to the Actor.
             *
             * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
             * @param time an integer indicating the Scene time when the bounding box is to be drawn.
             */
            drawScreenBoundingBox:function (director, time) {
            },
            /**
             * Private
             * This method is called by the Director instance.
             * It applies the list of behaviors the Actor has registered.
             *
             * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
             * @param time an integer indicating the Scene time when the bounding box is to be drawn.
             */
            animate:function (director, time) {
                if (!this.isInAnimationFrame(time)) {
                    this.inFrame = false;
                    this.dirty = true;
                    this.style('display', 'none');
                    return false;
                } else {
                    this.style('display', this.visible ? 'block' : 'none');
                }

                for (var i = 0; i < this.behaviorList.length; i++) {
                    this.behaviorList[i].apply(time, this);
                }

                this.frameAlpha = this.parent ? this.parent.frameAlpha * this.alpha : 1;
                //this.setAlpha(this.frameAlpha);
                this.styleAlpha(this.frameAlpha);
                this.inFrame = true;

                this.setModelViewMatrix(false);

                if (this.dirty || this.wdirty || this.invalid) {
                    this.setScreenBounds();
                }

                this.dirty = false;

                if ( this.backgroundImage ) {
                    var bi = this.backgroundImage;
                    if (bi) {
                        var pi = bi.spriteIndex;
                        bi.setSpriteIndexAtTime(time);
                        if (pi != bi.spriteIndex) {
                            this.setSpriteIndex(bi.spriteIndex);
                        }
                    }
                }

                //return true;
                return this.AABB.intersects(director.AABB);
            },
            /**
             * Set this model view matrix if the actor is Dirty.
             *
             * @return this
             */
            /*
             setModelViewMatrix : function(glEnabled) {
             var c,s,_m00,_m01,_m10,_m11;
             var mm0, mm1, mm2, mm3, mm4, mm5;
             var mm;

             this.wdirty= false;

             if ( this.dirty ) {

             mm= this.modelViewMatrix.identity().matrix;

             mm0= mm[0];
             mm1= mm[1];
             mm2= mm[2];
             mm3= mm[3];
             mm4= mm[4];
             mm5= mm[5];

             mm2+= this.x;
             mm5+= this.y;

             if ( this.rotationAngle ) {
             mm2+= mm0*this.rotationX*this.width + mm1*this.rotationY*this.height;
             mm5+= mm3*this.rotationX*this.width + mm4*this.rotationY*this.height;

             c= Math.cos( this.rotationAngle );
             s= Math.sin( this.rotationAngle );
             _m00= mm0;
             _m01= mm1;
             _m10= mm3;
             _m11= mm4;
             mm0=  _m00*c + _m01*s;
             mm1= -_m00*s + _m01*c;
             mm3=  _m10*c + _m11*s;
             mm4= -_m10*s + _m11*c;

             mm2+= -mm0*this.rotationX*this.width - mm1*this.rotationY*this.height;
             mm5+= -mm3*this.rotationX*this.width - mm4*this.rotationY*this.height;
             }
             if ( this.scaleX!=1 || this.scaleY!=1 ) {

             mm2+= mm0*this.scaleTX*this.width + mm1*this.scaleTY*this.height;
             mm5+= mm3*this.scaleTX*this.width + mm4*this.scaleTY*this.height;

             mm0= mm0*this.scaleX;
             mm1= mm1*this.scaleY;
             mm3= mm3*this.scaleX;
             mm4= mm4*this.scaleY;

             mm2+= -mm0*this.scaleTX*this.width - mm1*this.scaleTY*this.height;
             mm5+= -mm3*this.scaleTX*this.width - mm4*this.scaleTY*this.height;
             }

             mm[0]= mm0;
             mm[1]= mm1;
             mm[2]= mm2;
             mm[3]= mm3;
             mm[4]= mm4;
             mm[5]= mm5;
             }

             if ( this.parent ) {
             if ( this.dirty || this.parent.wdirty ) {
             this.worldModelViewMatrix.copy( this.parent.worldModelViewMatrix );
             this.worldModelViewMatrix.multiply( this.modelViewMatrix );
             this.wdirty= true;
             }
             } else {
             if ( this.dirty ) {
             this.wdirty= true;
             }
             //this.worldModelViewMatrix.copy( this.modelViewMatrix );
             this.worldModelViewMatrix.identity();
             }

             //            this.dirty= false;


             return this;
             },*/

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

            },

            /**
             * @private.
             * This method will be called by the Director to set the whole Actor pre-render process.
             *
             * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
             * @param time an integer indicating the Scene time when the bounding box is to be drawn.
             *
             * @return boolean indicating whether the Actor isInFrameTime
             */
            paintActor:function (director, time) {

                return true;
            },
            /**
             * @private.
             * This method is called after the Director has transformed and drawn a whole frame.
             *
             * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
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
             * Enable or disable the clipping process for this Actor.
             *
             * @param clip a boolean indicating whether clip is enabled.
             * @return this
             */
            setClip:function (clip) {
                this.clip = clip;
                this.style('overflow', this.clip ? 'hidden' : 'visible');
                return this;
            },
            stopCacheAsBitmap : function() {
                return this;
            },

            /**
             *
             * @param time {Number=}
             * @return canvas
             */
            cacheAsBitmap:function (time) {
                return this;
            },
            /**
             * Set this actor behavior as if it were a Button. The actor size will be set as SpriteImage's
             * single size.
             *
             * @param buttonImage
             * @param iNormal
             * @param iOver
             * @param iPress
             * @param iDisabled
             * @param fn
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
                 * @param event {CAAT.MouseEvent}
                 * @ignore
                 */
                this.actionPerformed = function (event) {
                    if (this.enabled && null !== this.fnOnClick) {
                        this.fnOnClick(this);
                    }
                };

                /**
                 * Button's mouse enter handler. It makes the button provide visual feedback
                 * @param mouseEvent {CAAT.MouseEvent}
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
                    this.iNormal = _normal;
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
