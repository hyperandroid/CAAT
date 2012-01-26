/**
 * See LICENSE file.
 *
 * Classes to define animable elements.
 * Actor is the superclass of every animable element in the scene graph. It handles the whole
 * affine transformation MatrixStack, rotation, translation, globalAlpha and Behaviours. It also
 * defines input methods.
 * TODO: add text presentation/animation effects.
 **/

(function() {

    /**
     * This class is the base for all animable entities in CAAT.
     * It defines an entity able to:
     *
     * <ul>
     * <li>Position itself on screen.
     * <li>Able to modify its presentation aspect via affine transforms.
     * <li>Take control of parent/child relationship.
     * <li>Take track of behaviors (@see CAAT.Behavior).
     * <li>Define a region on screen.
     * <li>Define alpha composition scope.
     * <li>Expose lifecycle.
     * <li>Manage itself in/out scene time.
     * <li>etc.
     * </ul>
     *
     * @constructor
     */
	CAAT.Actor = function() {
		this.behaviorList= [];
//        this.keyframesList= [];
        this.lifecycleListenerList= [];
        this.AABB= new CAAT.Rectangle();
        this.viewVertices= [
                new CAAT.Point(0,0,0),
                new CAAT.Point(0,0,0),
                new CAAT.Point(0,0,0),
                new CAAT.Point(0,0,0)
        ];

        this.scaleAnchor=           this.ANCHOR_CENTER;

        this.modelViewMatrix=       new CAAT.Matrix();
        this.worldModelViewMatrix=  new CAAT.Matrix();
        /*
        this.modelViewMatrixI=      new CAAT.Matrix();
        this.worldModelViewMatrixI= new CAAT.Matrix();
        this.tmpMatrix=             new CAAT.Matrix();
        */

        this.resetTransform();
        this.setScale(1,1);
        this.setRotation(0);

		return this;
	};

    CAAT.Actor.ANCHOR_CENTER=	    0;      // constant values to determine different affine transform
    CAAT.Actor.ANCHOR_TOP=			1;      // anchors.
    CAAT.Actor.ANCHOR_BOTTOM=		2;
    CAAT.Actor.ANCHOR_LEFT=			3;
    CAAT.Actor.ANCHOR_RIGHT=		4;
    CAAT.Actor.ANCHOR_TOP_LEFT=		5;
    CAAT.Actor.ANCHOR_TOP_RIGHT=	6;
    CAAT.Actor.ANCHOR_BOTTOM_LEFT=	7;
    CAAT.Actor.ANCHOR_BOTTOM_RIGHT=	8;
    CAAT.Actor.ANCHOR_CUSTOM=       9;

	CAAT.Actor.prototype= {

//        tmpMatrix :             null,

        lifecycleListenerList:	null,   // Array of life cycle listener

        behaviorList:           null,   // Array of behaviors to apply to the Actor
        parent:					null,   // Parent of this Actor. May be Scene.
		x:						0,      // x position on parent. In parent's local coord. system.
		y:						0,      // y position on parent. In parent's local coord. system.
		width:					0,      // Actor's width. In parent's local coord. system.
		height:					0,      // Actor's height. In parent's local coord. system.
		start_time:				0,      // Start time in Scene time.
		duration:				Number.MAX_VALUE,   // Actor duration in Scene time
		clip:					false,  // should clip the Actor's content against its contour.
        clipPath:               null,

        scaleX:					0,      // transformation. width scale parameter
		scaleY:					0,      // transformation. height scale parameter
		scaleTX:				.50,      // transformation. scale anchor x position
		scaleTY:				.50,      // transformation. scale anchor y position
		scaleAnchor:			0,      // transformation. scale anchor
		rotationAngle:			0,      // transformation. rotation angle in radians
		rotationY:				.50,      // transformation. rotation center y
        alpha:					1,      // alpha transparency value
        rotationX:				.50,      // transformation. rotation center x
        isGlobalAlpha:          false,  // is this a global alpha
        frameAlpha:             1,      // hierarchically calculated alpha for this Actor.
		expired:				false,  // set when the actor has been expired
		discardable:			false,  // set when you want this actor to be removed if expired
		pointed:				false,  // is the mouse pointer inside this actor
		mouseEnabled:			true,   // events enabled ?

        visible:                true,

		ANCHOR_CENTER:			0,      // constant values to determine different affine transform
		ANCHOR_TOP:				1,      // anchors.
		ANCHOR_BOTTOM:			2,
		ANCHOR_LEFT:			3,
		ANCHOR_RIGHT:			4,
		ANCHOR_TOP_LEFT:		5,
		ANCHOR_TOP_RIGHT:		6,
		ANCHOR_BOTTOM_LEFT:		7,
		ANCHOR_BOTTOM_RIGHT:	8,
        ANCHOR_CUSTOM:          9,

		fillStyle:				null,   // any canvas rendering valid fill style.
        strokeStyle:            null,   // any canvas rendering valid stroke style.
        time:                   0,      // Cache Scene time.
        AABB:                   null,   // CAAT.Rectangle
        viewVertices:           null,   // model to view transformed vertices.
        inFrame:                false,  // boolean indicating whether this Actor was present on last frame.

        dirty:                  true,   // model view is dirty ?
        wdirty:                 true,   // world model view is dirty ?
        oldX:                   -1,
        oldY:                   -1,
        
        modelViewMatrix:        null,   // model view matrix.
        worldModelViewMatrix:   null,   // world model view matrix.
        modelViewMatrixI:       null,   // model view matrix.
        worldModelViewMatrixI:  null,   // world model view matrix.

        glEnabled:              false,

        backgroundImage:        null,
        id:                     null,

        size_active:            1,      // number of animated children
        size_total:             1,

        __next:                 null,

        __d_ax:                 -1,     // for drag-enabled actors.
        __d_ay:                 -1,
        gestureEnabled:         false,

        invalid             :   true,

        invalidate : function() {
            this.invalid= true;
        },
        setGestureEnabled : function( enable ) {
            this.gestureEnabled= !!enable;
        },
        isGestureEnabled : function() {
            return this.gestureEnabled;
        },
        getId : function()  {
            return this.id;
        },
        setId : function(id) {
            this.id= id;
            return this;
        },
        /**
         * Set this actor's parent.
         * @param parent {CAAT.ActorContainer}
         * @return this
         */
        setParent : function(parent) {
            this.parent= parent;
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
         * WARN: if using a CSS renderer, the image supplied MUST be a HTMLImageElement instance.
         *
         * @see CAAT.SpriteImage
         *
         * @param image {Image|HTMLCanvasElement|CAAT.SpriteImage}
         * @param adjust_size_to_image {boolean} whether to set this actor's size based on image parameter.
         *
         * @return this
         */
        setBackgroundImage : function(image, adjust_size_to_image ) {
            if ( image ) {
                if ( !(image instanceof CAAT.SpriteImage) ) {
                    image= new CAAT.SpriteImage().initialize(image,1,1);
                }

                image.setOwner(this);
                this.backgroundImage= image;
                if ( typeof adjust_size_to_image==='undefined' || adjust_size_to_image ) {
                    this.width= image.getWidth();
                    this.height= image.getHeight();
                }

                this.glEnabled= true;
            } else {
                this.backgroundImage= null;
            }
            
            return this;
        },
        /**
         * Set the actor's SpriteImage index from animation sheet.
         * @see CAAT.SpriteImage
         * @param index {number}
         *
         * @return this
         */
        setSpriteIndex: function(index) {
            if ( this.backgroundImage ) {
                this.backgroundImage.setSpriteIndex(index);
            }

            return this;

        },
        /**
         * Set this actor's background SpriteImage offset displacement.
         * The values can be either positive or negative meaning the texture space of this background
         * image does not start at (0,0) but at the desired position.
         * @see CAAT.SpriteImage
         * @param ox {number} horizontal offset
         * @param oy {number} vertical offset
         *
         * @return this
         */
        setBackgroundImageOffset : function( ox, oy ) {
            if ( this.backgroundImage ) {
                this.backgroundImage.setOffset(ox,oy);
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
        setAnimationImageIndex : function( ii ) {
            if ( this.backgroundImage ) {
                this.backgroundImage.setAnimationImageIndex(ii);
            }
            return this;
        },
        setChangeFPS : function(time) {
            if ( this.backgroundImage ) {
                this.backgroundImage.setChangeFPS(time);
            }
            return this;

        },
        /**
         * Set this background image transformation.
         * If GL is enabled, this parameter has no effect.
         * @param it any value from CAAT.SpriteImage.TR_*
         * @return this
         */
        setImageTransformation : function( it ) {
            if ( this.backgroundImage ) {
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
        centerOn : function( x,y ) {
            this.setLocation( x-this.width/2, y-this.height/2 );
            return this;
        },
        /**
         * Center this actor at position (x,y).
         * @param x {number} x position
         * @param y {number} y position
         *
         * @return this
         */
        centerAt : function(x,y) {
            return this.centerOn(x,y);
        },
        /**
         * If GL is enables, get this background image's texture page, otherwise it will fail.
         * @return {CAAT.GLTexturePage}
         */
        getTextureGLPage : function() {
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
        setVisible : function(visible) {
            this.visible= visible;
            return this;
        },
        /**
         * Puts an Actor out of time line, that is, won't be transformed nor rendered.
         * @return this
         */
        setOutOfFrameTime : function() {
            this.setFrameTime(-1,0);
            return this;
        },
        /**
         * Adds an Actor's life cycle listener.
         * The developer must ensure the actorListener is not already a listener, otherwise
         * it will notified more than once.
         * @param actorListener {object} an object with at least a method of the form:
         * <code>actorLyfeCycleEvent( actor, string_event_type, long_time )</code>
         */
		addListener : function( actorListener ) {
			this.lifecycleListenerList.push(actorListener);
            return this;
		},
        /**
         * Removes an Actor's life cycle listener.
         * It will only remove the first occurrence of the given actorListener.
         * @param actorListener {object} an Actor's life cycle listener.
         */
        removeListener : function( actorListener ) {
            var n= this.lifecycleListenerList.length;
            while(n--) {
                if ( this.lifecycleListenerList[n]===actorListener ) {
                    // remove the nth element.
                    this.lifecycleListenerList.splice(n,1);
                    return;
                }
            }
        },
        /**
         * Set alpha composition scope. global will mean this alpha value will be its children maximum.
         * If set to false, only this actor will have this alpha value.
         * @param global {boolean} whether the alpha value should be propagated to children.
         */
        setGlobalAlpha : function( global ) {
            this.isGlobalAlpha= global;
            return this;
        },
        /**
         * Notifies the registered Actor's life cycle listener about some event.
         * @param sEventType an string indicating the type of event being notified.
         * @param time an integer indicating the time related to Scene's timeline when the event
         * is being notified.
         */
        fireEvent : function(sEventType, time)	{
            for( var i=0; i<this.lifecycleListenerList.length; i++ )	{
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
        setExpired : function(time) {
            this.expired= true;
            this.fireEvent('expired',time);
            return this;
        },
        /**
         * Enable or disable the event bubbling for this Actor.
         * @param enable {boolean} a boolean indicating whether the event bubbling is enabled.
         * @return this
         */
        enableEvents : function( enable ) {
            this.mouseEnabled= enable;
            return this;
        },
        /**
         * Removes all behaviors from an Actor.
         * @return this
         *
         * @deprecated
         */
		emptyBehaviorList : function() {
			this.behaviorList=[];
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
        setFillStyle : function( style ) {
			this.fillStyle= style;
            return this;
        },
        /**
         * Caches a stroke style in the Actor.
         * @param style a valid canvas rendering context stroke style.
         * @return this
         */
        setStrokeStyle : function( style ) {
            this.strokeStyle= style;
            return this;
        },
        /**
         * @deprecated
         * @param paint
         */
		setPaint : function( paint )	{
            return this.setFillStyle(paint);
		},
        /**
         * Stablishes the Alpha transparency for the Actor.
         * If it globalAlpha enabled, this alpha will the maximum alpha for every contained actors.
         * The alpha must be between 0 and 1.
         * @param alpha a float indicating the alpha value.
         * @return this
         */
		setAlpha : function( alpha )	{
			this.alpha= alpha;
            return this;
		},
        /**
         * Remove all transformation values for the Actor.
         * @return this
         */
		resetTransform : function () {
			this.rotationAngle=0;
			this.rotationX=.5;
			this.rotationY=.5;
			this.scaleX=1;
			this.scaleY=1;
			this.scaleTX=.5;
			this.scaleTY=.5;
			this.scaleAnchor=0;
            this.oldX=-1;
            this.oldY=-1;
            this.dirty= true;

            return this;
		},
        /**
         * Sets the time life cycle for an Actor.
         * These values are related to Scene time.
         * @param startTime an integer indicating the time until which the Actor won't be visible on the Scene.
         * @param duration an integer indicating how much the Actor will last once visible.
         * @return this
         */
		setFrameTime : function( startTime, duration ) {
			this.start_time= startTime;
			this.duration= duration;
			this.expired= false;
            this.dirty= true;

            return this;
		},
        /**
         * This method should me overriden by every custom Actor.
         * It will be the drawing routine called by the Director to show every Actor.
         * @param director the CAAT.Director instance that contains the Scene the Actor is in.
         * @param time an integer indicating the Scene time in which the drawing is performed.
         */
		paint : function(director, time) {
            if ( this.backgroundImage ) {
                this.backgroundImage.paint(director,time,0,0);
            } else if ( this.fillStyle ) {
                var ctx= director.crc;
				ctx.fillStyle= this.fillStyle;
				ctx.fillRect(0,0,this.width,this.height );
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
		setScale : function( sx, sy )    {
			//this.setScaleAnchored( sx, sy, this.width/2, this.height/2 );
            this.setScaleAnchored( sx, sy, .5, .5 );
            this.dirty= true;
            return this;
		},
        getAnchorPercent : function( anchor ) {

            var anchors=[
                .50,.50,   .50,0,  .50,1.00,
                0,.50,   1.00,.50, 0,0,
                1.00,0,  0,1.00,  1.00,1.00
            ];

            return { x: anchors[anchor*2], y: anchors[anchor*2+1] };
        },
        /**
         * Private.
         * Gets a given anchor position referred to the Actor.
         * @param anchor
         * @return an object of the form { x: float, y: float }
         */
		getAnchor : function( anchor ) {
			var tx=0, ty=0;

			switch( anchor ) {
            case this.ANCHOR_CENTER:
                tx= .5;
                ty= .5;
                break;
            case this.ANCHOR_TOP:
                tx= .5;
                ty= 0;
                break;
            case this.ANCHOR_BOTTOM:
                tx= .5;
                ty= 1;
                break;
            case this.ANCHOR_LEFT:
                tx= 0;
                ty= .5;
                break;
            case this.ANCHOR_RIGHT:
                tx= 1;
                ty= .5;
                break;
            case this.ANCHOR_TOP_RIGHT:
                tx= 1;
                ty= 0;
                break;
            case this.ANCHOR_BOTTOM_LEFT:
                tx= 0;
                ty= 1;
                break;
            case this.ANCHOR_BOTTOM_RIGHT:
                tx= 1;
                ty= 1;
                break;
            case this.ANCHOR_TOP_LEFT:
                tx= 0;
                ty= 0;
                break;
	        }

			return {x: tx, y: ty};
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
		setScaleAnchored : function( sx, sy, anchorx, anchory )    {
            this.scaleTX= anchorx;
            this.scaleTY= anchory;

			this.scaleX=sx;
			this.scaleY=sy;

            this.dirty= true;

            return this;
		},
        /**
         * A helper method for setRotationAnchored. This methods stablishes the center
         * of rotation to be the center of the Actor.
         *
         * @param angle a float indicating the angle in radians to rotate the Actor.
         * @return this
         */
	    setRotation : function( angle )	{
			this.setRotationAnchored( angle, .5, .5 ); //this.width/2, this.height/2 );
            return this;
	    },
        /**
         * This method sets Actor rotation around a given position.
         * @param angle {number} indicating the angle in radians to rotate the Actor.
         * @param rx {number} value in the range 0..1
         * @param ry {number} value in the range 0..1
         * @return this;
         */
	    setRotationAnchored : function( angle, rx, ry ) {
	        this.rotationAngle= angle;
	        this.rotationX= rx?rx:0;
	        this.rotationY= ry?ry:0;
            this.dirty= true;
            return this;
	    },
        /**
         * Sets an Actor's dimension
         * @param w a float indicating Actor's width.
         * @param h a float indicating Actor's height.
         * @return this
         */
	    setSize : function( w, h )   {
	        this.width= w|0;
	        this.height= h|0;
            this.dirty= true;

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
	    setBounds : function(x, y, w, h)  {
            /*
            this.x= x|0;
            this.y= y|0;
            this.width= w|0;
            this.height= h|0;
            */
            this.x= x;
            this.y= y;
            this.width= w;
            this.height= h;

            this.dirty= true;

            return this;
	    },
        /**
         * This method sets the position of an Actor inside its parent.
         *
         * @param x{number} a float indicating Actor's x position
         * @param y{number} a float indicating Actor's y position
         * @return this
         */
	    setLocation : function( x, y ) {
/*
            this.x= x|0;
            this.y= y|0;

            this.oldX= x|0;
            this.oldY= y|0;
*/
            this.x= x;
            this.y= y;
            this.oldX= x;
            this.oldY= y;

            this.dirty= true;

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
	    isInAnimationFrame : function(time)    {
            if ( this.expired )	{
                return false;
            }

	        if ( this.duration===Number.MAX_VALUE ) {
	            return this.start_time<=time;
	        }

			if ( time>=this.start_time+this.duration )	{
				if ( !this.expired )	{
					this.setExpired(time);
				}

				return false;
			}

	        return this.start_time<=time && time<this.start_time+this.duration;
	    },
        /**
         * Checks whether a coordinate is inside the Actor's bounding box.
         * @param x {number} a float
         * @param y {number} a float
         *
         * @return boolean indicating whether it is inside.
         */
	    contains : function(x, y) {
	        return x>=0 && y>=0 && x<this.width && y<this.height;
	    },
        /**
         * This method must be called explicitly by every CAAT Actor.
         * Making the life cycle explicitly initiated has always been a good idea.
         *
         * @return this
         * @deprecated no longer needed.
         */
		create : function()	{
            return this;
		},

        /**
         * Add a Behavior to the Actor.
         * An Actor accepts an undefined number of Behaviors.
         *
         * @param behavior {CAAT.Behavior} a CAAT.Behavior instance
         * @return this
         *
         * @deprecated
         */
		addBehavior : function( behavior )	{
			this.behaviorList.push(behavior);
            return this;
		},

        /**
         * Remove a Behavior from the Actor.
         * If the Behavior is not present at the actor behavior collection nothing happends.
         *
         * @param behavior {CAAT.Behavior} a CAAT.Behavior instance.
         */
        removeBehaviour : function( behavior ) {
            var c= this.behaviorList;
            var n= c.length-1;
            while(n) {
                if ( c[n]===behavior ) {
                    c.splice(n,1);
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
        removeBehaviorById : function( id ) {
            var c= this.behaviorList;
            for( var n=0; n<c.length; n++ ) {
                if ( c[n].id===id) {
                    c.splice(n,1);
                }
            }

            return this;

        },
        getBehavior : function(id)  {
            var c= this.behaviorList;
            for( var n=0; n<c.length; n++ ) {
                var cc= c[n];
                if ( cc.id===id) {
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
        setDiscardable : function( discardable ) {
            this.discardable= discardable;
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
		destroy : function(time)	{
            if ( this.parent ) {
                this.parent.removeChild(this);
            }

            this.fireEvent('destroyed',time);
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
        modelToView : function(point) {

            var tm= this.worldModelViewMatrix.matrix;

            if ( point instanceof Array ) {
                for( var i=0; i<point.length; i++ ) {
                    //this.worldModelViewMatrix.transformCoord(point[i]);
                    var pt= point[i];
                    var x= pt.x;
                    var y= pt.y;
                    pt.x= x*tm[0] + y*tm[1] + tm[2];
                    pt.y= x*tm[3] + y*tm[4] + tm[5];
                }
            }
            else {
//                this.worldModelViewMatrix.transformCoord(point);
                var x= point.x;
                var y= point.y;
                point.x= x*tm[0] + y*tm[1] + tm[2];
                point.y= x*tm[3] + y*tm[4] + tm[5];
            }

            return point;
        },
        /**
         * Transform a local coordinate point on this Actor's coordinate system into
         * another point in otherActor's coordinate system.
         * @param point {CAAT.Point}
         * @param otherActor {CAAT.Actor}
         */
        modelToModel : function( point, otherActor )   {
            return otherActor.viewToModel( this.modelToView( point ) );
        },
        /**
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
		viewToModel : function(point) {
            this.worldModelViewMatrixI= this.worldModelViewMatrix.getInverse();
            this.worldModelViewMatrixI.transformCoord(point);
			return point;
		},
        /**
         * Private
         * This method does the needed point transformations across an Actor hierarchy to devise
         * whether the parameter point coordinate lies inside the Actor.
         * @param point {CAAT.Point}
         *
         * @return null if the point is not inside the Actor. The Actor otherwise.
         */
	    findActorAtPosition : function(point) {
			if ( !this.mouseEnabled || !this.isInAnimationFrame(this.time) ) {
				return null;
			}

            this.modelViewMatrixI= this.modelViewMatrix.getInverse();
            this.modelViewMatrixI.transformCoord(point);
	        return this.contains(point.x, point.y) ? this :null;
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
	    enableDrag : function() {

            var me= this;

			this.ax= 0;
			this.ay= 0;
			this.mx= 0;
			this.my= 0;
			this.asx=1;
			this.asy=1;
			this.ara=0;
			this.screenx=0;
			this.screeny=0;

            /**
             * Mouse enter handler for default drag behavior.
             * @param mouseEvent {CAAT.MouseEvent}
             *
             * @ignore
             */
	        this.mouseEnter= function(mouseEvent) {
				this.__d_ax= -1;
				this.__d_ay= -1;
		        this.pointed= true;
		        CAAT.setCursor('move');
	        };

            /**
             * Mouse exit handler for default drag behavior.
             * @param mouseEvent {CAAT.MouseEvent}
             *
             * @ignore
             */
            this.mouseExit = function(mouseEvent) {
                this.__d_ax = -1;
                this.__d_ay = -1;
                this.pointed = false;
                CAAT.setCursor('default');
            };

            /**
             * Mouse move handler for default drag behavior.
             * @param mouseEvent {CAAT.MouseEvent}
             *
             * @ignore
             */
            this.mouseMove = function(mouseEvent) {
            };

            /**
             * Mouse up handler for default drag behavior.
             * @param mouseEvent {CAAT.MouseEvent}
             *
             * @ignore
             */
            this.mouseUp = function(mouseEvent) {
                this.__d_ax = -1;
                this.__d_ay = -1;
            };

            /**
             * Mouse drag handler for default drag behavior.
             * @param mouseEvent {CAAT.MouseEvent}
             *
             * @ignore
             */
            this.mouseDrag = function(mouseEvent) {

                var pt;

                pt= this.modelToView( new CAAT.Point(mouseEvent.x, mouseEvent.y ) );
                this.parent.viewToModel( pt );

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
                    this.x += pt.x-this.__d_ax;
                    this.y += pt.y-this.__d_ay;
                }

                this.__d_ax= pt.x;
                this.__d_ay= pt.y;
            };

            return this;
	    },
        /**
         * Default mouseClick handler.
         * Mouse click events are received after a call to mouseUp method if no dragging was in progress.
         *
         * @param mouseEvent {CAAT.MouseEvent}
         */
	    mouseClick : function(mouseEvent) {
	    },
        /**
         * Default double click handler
         *
         * @param mouseEvent {CAAT.MouseEvent}
         */
	    mouseDblClick : function(mouseEvent) {
	    },
        /**
         * Default mouse enter on Actor handler.
         * @param mouseEvent {CAAT.MouseEvent}
         */
		mouseEnter : function(mouseEvent) {
	        this.pointed= true;
		},
        /**
         * Default mouse exit on Actor handler.
         *
         * @param mouseEvent {CAAT.MouseEvent}
         */
		mouseExit : function(mouseEvent) {
			this.pointed= false;
		},
        /**
         * Default mouse move inside Actor handler.
         *
         * @param mouseEvent {CAAT.MouseEvent}
         */
		mouseMove : function(mouseEvent) {
		},
        /**
         * default mouse press in Actor handler.
         *
         * @param mouseEvent {CAAT.MouseEvent}
         */
		mouseDown : function(mouseEvent) {
		},
        /**
         * default mouse release in Actor handler.
         *
         * @param mouseEvent {CAAT.MouseEvent}
         */
		mouseUp : function(mouseEvent) {
		},
        mouseOut : function(mouseEvent) {
        },
        mouseOver : function(mouseEvent) {
        },
        /**
         * default Actor mouse drag handler.
         *
         * @param mouseEvent {CAAT.MouseEvent}
         */
		mouseDrag : function(mouseEvent) {
		},
        /**
         * Draw a bounding box with on-screen coordinates regardless of the transformations
         * applied to the Actor.
         *
         * @param director {CAAT.Director} object instance that contains the Scene the Actor is in.
         * @param time {number} integer indicating the Scene time when the bounding box is to be drawn.
         */
        drawScreenBoundingBox : function( director, time ) {
            if ( null!==this.AABB && this.inFrame ) {
                var s= this.AABB;
                var ctx= director.ctx;
                ctx.strokeStyle= CAAT.DEBUGAABBCOLOR;
                ctx.strokeRect( .5+(s.x|0), .5+(s.y|0), s.width|0, s.height|0 );
                if ( CAAT.DEBUGBB ) {
                    var vv= this.viewVertices;
                    ctx.beginPath(  );
                    ctx.lineTo( vv[0].x, vv[0].y );
                    ctx.lineTo( vv[1].x, vv[1].y );
                    ctx.lineTo( vv[2].x, vv[2].y );
                    ctx.lineTo( vv[3].x, vv[3].y );
                    ctx.closePath();
                    ctx.strokeStyle= CAAT.DEBUGBBCOLOR;
                    ctx.stroke();
                }
            }
        },
        /**
         * Private
         * This method is called by the Director instance.
         * It applies the list of behaviors the Actor has registered.
         *
         * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
         * @param time an integer indicating the Scene time when the bounding box is to be drawn.
         */
		animate : function(director, time) {

            var i;

            if ( !this.isInAnimationFrame(time) ) {
                this.inFrame= false;
                this.dirty= true;
                return false;
            }

            if ( this.x!==this.oldX || this.y!==this.oldY ) {
                this.dirty= true;
                this.oldX= this.x;
                this.oldY= this.y;
            }

			for( i=0; i<this.behaviorList.length; i++ )	{
				this.behaviorList[i].apply(time,this);
			}

            if ( this.clipPath ) {
                this.clipPath.applyBehaviors(time);
            }

            // transformation stuff.
            this.setModelViewMatrix(director);

            this.inFrame= true;



            return true;
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
        setModelViewMatrix : function(director) {
            var c,s,_m00,_m01,_m10,_m11;
            var mm0, mm1, mm2, mm3, mm4, mm5;
            var mm;

            this.wdirty= false;

            if ( this.dirty ) {

                mm= this.modelViewMatrix.matrix;

                mm0= 1;
                mm1= 0;
                mm2= mm[2];
                mm3= 0;
                mm4= 1;
                mm5= mm[5];

                mm2= this.x;
                mm5= this.y;

                if ( this.rotationAngle ) {

                    var rx= this.rotationX*this.width;
                    var ry= this.rotationY*this.height;

                    mm2+= mm0*rx + mm1*ry;
                    mm5+= mm3*rx + mm4*ry;

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

                    mm2+= -mm0*rx - mm1*ry;
                    mm5+= -mm3*rx - mm4*ry;
                }
                if ( this.scaleX!=1 || this.scaleY!=1 ) {

                    var sx= this.scaleTX*this.width;
                    var sy= this.scaleTY*this.height;

                    mm2+= mm0*sx + mm1*sy;
                    mm5+= mm3*sx + mm4*sy;

                    mm0= mm0*this.scaleX;
                    mm1= mm1*this.scaleY;
                    mm3= mm3*this.scaleX;
                    mm4= mm4*this.scaleY;

                    mm2+= -mm0*sx - mm1*sy;
                    mm5+= -mm3*sx - mm4*sy;
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

                this.worldModelViewMatrix.identity();
            }

//if ( (CAAT.DEBUGAABB || glEnabled) && (this.dirty || this.wdirty ) ) {
            // screen bounding boxes will always be calculated.
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
        },
        /**
         * Calculates the 2D bounding box in canvas coordinates of the Actor.
         * This bounding box takes into account the transformations applied hierarchically for
         * each Scene Actor.
         *
         * @private
         *
         */
        setScreenBounds : function() {

            var vv= this.viewVertices;

            vv[0].set(0,          0);
            vv[1].set(this.width, 0);
            vv[2].set(this.width, this.height);
            vv[3].set(0,          this.height);

            this.modelToView( this.viewVertices );

            var xmin= Number.MAX_VALUE, xmax=Number.MIN_VALUE;
            var ymin= Number.MAX_VALUE, ymax=Number.MIN_VALUE;

            for( var i=0; i<4; i++ ) {
                if ( vv[i].x < xmin ) {
                    xmin=vv[i].x;
                }
                if ( vv[i].x > xmax ) {
                    xmax=vv[i].x;
                }
                if ( vv[i].y < ymin ) {
                    ymin=vv[i].y;
                }
                if ( vv[i].y > ymax ) {
                    ymax=vv[i].y;
                }
            }

            var AABB= this.AABB;
            AABB.x= xmin;
            AABB.y= ymin;
            AABB.x1= xmax;
            AABB.y1= ymax;
            AABB.width=  (xmax-xmin);
            AABB.height= (ymax-ymin);

            return this;
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
        paintActor : function(director, time) {

            if (!this.visible) {
                return true;
            }

            var ctx= director.ctx;

            this.frameAlpha= this.parent ? this.parent.frameAlpha*this.alpha : 1;
            ctx.globalAlpha= this.frameAlpha;

            director.modelViewMatrix.transformRenderingContextSet( ctx );

            this.worldModelViewMatrix.transformRenderingContext(ctx);

            if ( this.clip ) {
                ctx.beginPath();
                if (!this.clipPath ) {
                    ctx.rect(0,0,this.width,this.height);
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
        __paintActor : function(director, time) {
            if (!this.visible) {
                return true;
            }
            var ctx= director.ctx;

            // global opt: set alpha as owns alpha, not take globalAlpha procedure.
            this.frameAlpha= this.alpha;

            var m= this.worldModelViewMatrix.matrix;
            ctx.setTransform( m[0], m[3], m[1], m[4], m[2], m[5], this.frameAlpha );
            this.paint(director, time);
            return true;
        },

        /**
         * Set coordinates and uv values for this actor.
         * This function uses Director's coords and indexCoords values.
         * @param director
         * @param time
         */
        paintActorGL : function(director,time) {

            this.frameAlpha= this.parent.frameAlpha*this.alpha;

            if ( !this.glEnabled || !this.visible) {
                return;
            }

            if ( this.glNeedsFlush(director) ) {
                director.glFlush();
                this.glSetShader(director);

                if ( !this.__uv ) {
                    this.__uv= new Float32Array(8);
                }
                if ( !this.__vv ) {
                    this.__vv= new Float32Array(12);
                }

                this.setGLCoords( this.__vv, 0 );
                this.setUV( this.__uv, 0 );
                director.glRender(this.__vv, 12, this.__uv);

                return;
            }

            var glCoords=       director.coords;
            var glCoordsIndex=  director.coordsIndex;

            ////////////////// XYZ
            this.setGLCoords(glCoords, glCoordsIndex);
            director.coordsIndex= glCoordsIndex+12;

            ////////////////// UV
            this.setUV( director.uv, director.uvIndex );
            director.uvIndex+= 8;
        },
        /**
         * TODO: set GLcoords for different image transformations.
         * @param glCoords
         * @param glCoordsIndex
         * @param z
         */
        setGLCoords : function( glCoords, glCoordsIndex ) {

            var vv=             this.viewVertices;
            glCoords[glCoordsIndex++]= vv[0].x;
            glCoords[glCoordsIndex++]= vv[0].y;
            glCoords[glCoordsIndex++]= 0;

            glCoords[glCoordsIndex++]= vv[1].x;
            glCoords[glCoordsIndex++]= vv[1].y;
            glCoords[glCoordsIndex++]= 0;

            glCoords[glCoordsIndex++]= vv[2].x;
            glCoords[glCoordsIndex++]= vv[2].y;
            glCoords[glCoordsIndex++]= 0;

            glCoords[glCoordsIndex++]= vv[3].x;
            glCoords[glCoordsIndex++]= vv[3].y;
            glCoords[glCoordsIndex++]= 0;

        },
        /**
         * Set UV for this actor's quad.
         *
         * @param uvBuffer {Float32Array}
         * @param uvIndex {number}
         */
        setUV : function( uvBuffer, uvIndex ) {
            this.backgroundImage.setUV(uvBuffer, uvIndex);
        },
        /**
         * Test for compulsory gl flushing:
         *  1.- opacity has changed.
         *  2.- texture page has changed.
         *
         */
        glNeedsFlush : function(director) {
            if ( this.getTextureGLPage()!==director.currentTexturePage ) {
                return true;
            }
            if ( this.frameAlpha!==director.currentOpacity ) {
                return true;
            }
            return false;
        },
        /**
         * Change texture shader program parameters.
         * @param director
         */
        glSetShader : function(director) {

            var tp= this.getTextureGLPage();
            if ( tp!==director.currentTexturePage ) {
                director.setGLTexturePage(tp);
            }

            if ( this.frameAlpha!==director.currentOpacity ) {
                director.setGLCurrentOpacity(this.frameAlpha);
            }
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
        endAnimate : function(director,time) {
            return this;
        },
        initialize : function(overrides) {
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
         * @param clipPath {CAAT.Path=} An optional path to apply clip with. If enabled and clipPath is not set,
         *  a rectangle will be used.
         */
        setClip : function( enable, clipPath ) {
            this.clip= enable;
            this.clipPath= clipPath;
            return this;
        },
        /**
         *
         * @param time {Number=}
         * @return this
         */
        cacheAsBitmap : function(time) {
            time= time||0;
            var canvas= document.createElement('canvas');
            canvas.width= this.width;
            canvas.height= this.height;
            var ctx= canvas.getContext('2d');
            var director= {
                ctx: ctx,
                crc: ctx,
                modelViewMatrix: new CAAT.Matrix()
            };

            this.paintActor(director,time);
            this.setBackgroundImage(canvas);
            return this;
        },
        /**
         * Set this actor behavior as if it were a Button. The actor size will be set as SpriteImage's
         * single size.
         * 
         * @param buttonImage {CAAT.SpriteImage} sprite image with button's state images.
         * @param _iNormal {number} button's normal state image index
         * @param _iOver {number} button's mouse over state image index
         * @param _iPress {number} button's pressed state image index
         * @param _iDisabled {number} button's disabled state image index
         * @param fn {function(button{CAAT.Actor})} callback function
         */
        setAsButton : function( buttonImage, iNormal, iOver, iPress, iDisabled, fn ) {

            var me= this;
            
            this.setBackgroundImage(buttonImage, true);

            this.iNormal=       iNormal || 0;
            this.iOver=         iOver || iNormal;
            this.iPress=        iPress || iNormal;
            this.iDisabled=     iDisabled || iNormal;
            this.fnOnClick=     fn;
            this.enabled=       true;

            this.setSpriteIndex( iNormal );

            /**
             * Enable or disable the button.
             * @param enabled {boolean}
             * @ignore
             */
            this.setEnabled= function( enabled ) {
                this.enabled= enabled;
                this.setSpriteIndex( this.enabled ? this.iNormal : this.iDisabled );
            };

            /**
             * This method will be called by CAAT *before* the mouseUp event is fired.
             * @param event {CAAT.MouseEvent}
             * @ignore
             */
            this.actionPerformed= function(event) {
                if ( this.enabled && null!==this.fnOnClick ) {
                    this.fnOnClick(this);
                }
            };

            /**
             * Button's mouse enter handler. It makes the button provide visual feedback
             * @param mouseEvent {CAAT.MouseEvent}
             * @ignore
             */
            this.mouseEnter= function(mouseEvent) {
                if ( !this.enabled ) {
                    return;
                }

                if ( this.dragging ) {
                    this.setSpriteIndex( this.iPress );
                } else {
                    this.setSpriteIndex( this.iOver );
                }
                CAAT.setCursor('pointer');
            };

            /**
             * Button's mouse exit handler. Release visual apperance.
             * @param mouseEvent {CAAT.MouseEvent}
             * @ignore
             */
            this.mouseExit= function(mouseEvent) {
                if ( !this.enabled ) {
                    return;
                }

                this.setSpriteIndex( this.iNormal );
                CAAT.setCursor('default');
            };

            /**
             * Button's mouse down handler.
             * @param mouseEvent {CAAT.MouseEvent}
             * @ignore
             */
            this.mouseDown= function(mouseEvent) {
                if ( !this.enabled ) {
                    return;
                }

                this.setSpriteIndex( this.iPress );
            };

            /**
             * Button's mouse up handler.
             * @param mouseEvent {CAAT.MouseEvent}
             * @ignore
             */
            this.mouseUp= function(mouseEvent) {
                if ( !this.enabled ) {
                    return;
                }

                this.setSpriteIndex( this.iNormal );
                this.dragging= false;
            };

            /**
             * Button's mouse click handler. Do nothing by default. This event handler will be
             * called ONLY if it has not been drag on the button.
             * @param mouseEvent {CAAT.MouseEvent}
             * @ignore
             */
            this.mouseClick= function(mouseEvent) {
            };

            /**
             * Button's mouse drag handler.
             * @param mouseEvent {CAAT.MouseEvent}
             * @ignore
             */
            this.mouseDrag= function(mouseEvent)  {
                if ( !this.enabled ) {
                    return;
                }

                this.dragging= true;
            };

            this.setButtonImageIndex= function(_normal, _over, _press, _disabled ) {
                this.iNormal=    _normal;
                this.iOver=      _over;
                this.iPress=     _press;
                this.iDisabled=  _disabled;
                this.setSpriteIndex( this.iNormal );
                return this;
            };

            return this;
        }
	};

    if ( CAAT.NO_PERF ) {
        CAAT.Actor.prototype.paintActor= CAAT.Actor.prototype.__paintActor;
    }

})();

(function() {

    /**
     * This class is a general container of CAAT.Actor instances. It extends the concept of an Actor
     * from a single entity on screen to a set of entities with a parent/children relationship among
     * them.
     * <p>
     * This mainly overrides default behavior of a single entity and exposes methods to manage its children
     * collection.
     *
     * @constructor
     * @extends CAAT.Actor
     */
	CAAT.ActorContainer= function(hint) {

		CAAT.ActorContainer.superclass.constructor.call(this);
		this.childrenList=          [];
        this.pendingChildrenList=   [];
        if ( typeof hint!=='undefined' ) {
            this.addHint=       hint;
            this.boundingBox=   new CAAT.Rectangle();
        }
		return this;
	};

    CAAT.ActorContainer.AddHint= {
        CONFORM     :    1
    };

	CAAT.ActorContainer.prototype= {

        childrenList        :   null,       // the list of children contained.
        activeChildren      :   null,
        pendingChildrenList :   null,

        addHint             :   0,
        boundingBox         :   null,
        runion              :   new CAAT.Rectangle(),   // Watch out. one for every container.

        /**
         * Draws this ActorContainer and all of its children screen bounding box.
         *
         * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
         * @param time an integer indicating the Scene time when the bounding box is to be drawn.
         */
        drawScreenBoundingBox : function( director, time ) {

            if (!this.inFrame) {
                return;
            }

            var cl= this.childrenList;
            for( var i=0; i<cl.length; i++ ) {
                cl[i].drawScreenBoundingBox(director,time);
            }
            CAAT.ActorContainer.superclass.drawScreenBoundingBox.call(this,director,time);

        },
        /**
         * Removes all children from this ActorContainer.
         *
         * @return this
         */
        emptyChildren : function() {
            this.childrenList= [];

            return this;
        },
        /**
         * Private
         * Paints this container and every contained children.
         *
         * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
         * @param time an integer indicating the Scene time when the bounding box is to be drawn.
         */
        paintActor : function(director, time ) {

            if (!this.visible) {
                return true;
            }

            var ctx= director.ctx;

            ctx.save();

            CAAT.ActorContainer.superclass.paintActor.call(this,director,time);
            if ( !this.isGlobalAlpha ) {
                this.frameAlpha= this.parent ? this.parent.frameAlpha : 1;
            }

            for( var actor= this.activeChildren; actor; actor=actor.__next ) {
                if ( actor.visible ) {
                    actor.paintActor(director,time);
                }
            }

            ctx.restore();

            return true;
        },
        __paintActor : function(director, time ) {
            if (!this.visible) {
                return true;
            }

            var ctx= director.ctx;

            this.frameAlpha= this.parent ? this.parent.frameAlpha*this.alpha : 1;
            var m= this.worldModelViewMatrix.matrix;
            ctx.setTransform( m[0], m[3], m[1], m[4], m[2], m[5], this.frameAlpha );
            this.paint(director, time);

            if ( !this.isGlobalAlpha ) {
                this.frameAlpha= this.parent ? this.parent.frameAlpha : 1;
            }

            for( var actor= this.activeChildren; actor; actor=actor.__next ) {
                actor.paintActor(director,time);
            }
            return true;
        },
        paintActorGL : function(director,time) {

            var i, c;
            if (!this.visible) {
                return true;
            }

            CAAT.ActorContainer.superclass.paintActorGL.call(this,director,time);

            if ( !this.isGlobalAlpha ) {
                this.frameAlpha= this.parent.frameAlpha;
            }

            for( c= this.activeChildren; c; c=c.__next ) {
                c.paintActorGL(director,time);
            }

        },
        /**
         * Private.
         * Performs the animate method for this ActorContainer and every contained Actor.
         *
         * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
         * @param time an integer indicating the Scene time when the bounding box is to be drawn.
         *
         * @return {boolean} is this actor in active children list ??
         */
		animate : function(director,time) {

            this.activeChildren= null;
            var last= null;

            if (false===CAAT.ActorContainer.superclass.animate.call(this,director,time)) {
                return false;
            }

            var i,l;

            /**
             * Incluir los actores pendientes.
             * El momento es ahora, antes de procesar ninguno del contenedor.
             */
            var pcl= this.pendingChildrenList;
            for( i=0; i<pcl.length; i++ ) {
                var child= pcl[i];
                this.addChild(child);
            }

            this.pendingChildrenList= [];
            var markDelete= [];

            var cl= this.childrenList;
            this.activeChildren= null;
            this.size_active= 1;
            this.size_total= 1;
            for( i=0; i<cl.length; i++ ) {
                var actor= cl[i];
                actor.time= time;
                this.size_total+= actor.size_total;
                if ( actor.animate(director, time) ) {
                    if ( !this.activeChildren ) {
                        this.activeChildren= actor;
                        actor.__next= null;
                        last= actor;
                    } else {
                        actor.__next= null;
                        last.__next= actor;
                        last= actor;
                    }

                    this.size_active+= actor.size_active;

                } else {
                    if ( actor.expired && actor.discardable ) {
                        markDelete.push(actor);
                    }
                }
            }

            for( i=0, l=markDelete.length; i<l; i++ ) {
                var md= markDelete[i];
                md.destroy(time);
                if ( director.dirtyRectsEnabled ) {
                    director.addDirtyRect( md.AABB );
                }
            }

            return true;
		},
        /**
         * Removes Actors from this ActorContainer which are expired and flagged as Discardable.
         *
         * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
         * @param time an integer indicating the Scene time when the bounding box is to be drawn.
         *
         * @deprecated
         */
        endAnimate : function(director,time) {
        },
        /**
         * Adds an Actor to this Container.
         * The Actor will be added ON METHOD CALL, despite the rendering pipeline stage being executed at
         * the time of method call.
         *
         * This method is only used by CAAT.Director's transitionScene.
         *
         * @param child a CAAT.Actor instance.
         * @return this.
         */
        addChildImmediately : function(child) {
            return this.addChild(child);
        },
        /**
         * Adds an Actor to this ActorContainer.
         * The Actor will be added to the container AFTER frame animation, and not on method call time.
         * Except the Director and in orther to avoid visual artifacts, the developer SHOULD NOT call this
         * method directly.
         *
         * If the container has addingHint as CAAT.ActorContainer.AddHint.CONFORM, new continer size will be
         * calculated by summing up the union of every client actor bounding box.
         * This method will not take into acount actor's affine transformations, so the bounding box will be
         * AABB.
         *
         * @param child a CAAT.Actor object instance.
         * @return this
         */
		addChild : function(child) {

            if ( child.parent!=null ) {
                throw('adding to a container an element with parent.');
            }

            child.parent= this;
            this.childrenList.push(child);
            child.dirty= true;

            /**
             * if Conforming size, recalc new bountainer size.
             */
            if ( this.addHint===CAAT.ActorContainer.AddHint.CONFORM ) {
                this.recalcSize();
            }

            return this;
		},

        /**
         * Recalc this container size by computin the union of every children bounding box.
         */
        recalcSize : function() {
            var bb= this.boundingBox;
            bb.setEmpty();
            var cl= this.childrenList;
            var ac;
            for( var i=0; i<cl.length; i++ ) {
                ac= cl[i];
                this.runion.setBounds(
                    ac.x<0 ? 0 : ac.x,
                    ac.y<0 ? 0 : ac.y,
                    ac.width,
                    ac.height );
                bb.unionRectangle( this.runion );
            }
            this.setSize( bb.x1, bb.y1 );

            return this;
        },

        /**
         * Add a child element and make it active in the next frame.
         * @param child {CAAT.Actor}
         */
        addChildDelayed : function(child) {
            this.pendingChildrenList.push(child);
            return this;
        },
        /**
         * Adds an Actor to this ActorContainer.
         *
         * @param child a CAAT.Actor object instance.
         *
         * @return this
         */
		addChildAt : function(child, index) {

			if( index <= 0 ) {
                child.parent= this;
                child.dirty= true;
                //this.childrenList.unshift(child);  // unshift unsupported on IE
                this.childrenList.splice( 0, 0, child );
				return this;
            } else {
                if ( index>=this.childrenList.length ) {
                    index= this.childrenList.length;
                }
            }

			child.parent= this;
            child.dirty= true;
			this.childrenList.splice(index, 0, child);

            return this;
		},
        /**
         * Find the first actor with the supplied ID.
         * This method is not recommended to be used since executes a linear search.
         * @param id
         */
        findActorById : function(id) {
            var cl= this.childrenList;
            for( var i=0, l=cl.length; i<l; i++ ) {
                if ( cl[i].id===id ) {
                    return cl[i];
                }
            }

            return null;
        },
        /**
         * Private
         * Gets a contained Actor z-index on this ActorContainer.
         *
         * @param child a CAAT.Actor object instance.
         *
         * @return an integer indicating the Actor's z-order.
         */
		findChild : function(child) {
            var cl= this.childrenList;
            var i=0;
            var len = cl.length;

			for( i=0; i<len; i++ ) {
				if ( cl[i]===child ) {
					return i;
				}
			}
			return -1;
		},
        /**
         * Removed an Actor form this ActorContainer.
         * If the Actor is not contained into this Container, nothing happends.
         *
         * @param child a CAAT.Actor object instance.
         *
         * @return this
         */
		removeChild : function(child) {
			var pos= this.findChild(child);
            var cl= this.childrenList;
			if ( -1!==pos ) {
                cl[pos].setParent(null);
				cl.splice(pos,1);
			}

            return this;
		},
        /**
         * @private
         *
         * Gets the Actor inside this ActorContainer at a given Screen coordinate.
         *
         * @param point an object of the form { x: float, y: float }
         *
         * @return the Actor contained inside this ActorContainer if found, or the ActorContainer itself.
         */
		findActorAtPosition : function(point) {

			if( null===CAAT.ActorContainer.superclass.findActorAtPosition.call(this,point) ) {
				return null;
			}

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
        /**
         * Destroys this ActorContainer.
         * The process falls down recursively for each contained Actor into this ActorContainer.
         *
         * @return this
         */
        destroy : function() {
            var cl= this.childrenList;
            for( var i=cl.length-1; i>=0; i-- ) {
                cl[i].destroy();
            }
            CAAT.ActorContainer.superclass.destroy.call(this);

            return this;
        },
        /**
         * Get number of Actors into this container.
         * @return integer indicating the number of children.
         */
        getNumChildren : function() {
            return this.childrenList.length;
        },
        getNumActiveChildren : function() {
            return this.activeChildren.length;
        },
        /**
         * Returns the Actor at the iPosition(th) position.
         * @param iPosition an integer indicating the position array.
         * @return the CAAT.Actor object at position.
         */
        getChildAt : function( iPosition ) {
            return this.childrenList[ iPosition ];
        },
        /**
         * Changes an actor's ZOrder.
         * @param actor the actor to change ZOrder for
         * @param index an integer indicating the new ZOrder. a value greater than children list size means to be the
         * last ZOrder Actor.
         */
        setZOrder : function( actor, index ) {
            var actorPos= this.findChild(actor);
            // the actor is present
            if ( -1!==actorPos ) {
                var cl= this.childrenList;
                // trivial reject.
                if ( index===actorPos ) {
                    return;
                }

                if ( index>=cl.length ) {
					cl.splice(actorPos,1);
					cl.push(actor);
                } else {
                    var nActor= cl.splice(actorPos,1);
                    if ( index<0 ) {
                        index=0;
                    } else if ( index>cl.length ) {
                        index= cl.length;
                    }

                    //cl.splice( index, 1, nActor );
                    cl.splice( index, 0, nActor[0] );
                }
            }
        }
	};

    if ( CAAT.NO_PERF ) {
        CAAT.ActorContainer.prototype.paintActor= CAAT.ActorContainer.prototype.__paintActor;
    }
    
    extend( CAAT.ActorContainer, CAAT.Actor, null);

})();


(function() {

    /**
     * TextActor draws text on screen. The text can be drawn directly on screen or make if follow a
     * path defined by an instance of <code>CAAT.Path</code>.
     *
     * @constructor
     * @extends CAAT.ActorContainer
     *
     */
	CAAT.TextActor = function() {
		CAAT.TextActor.superclass.constructor.call(this);
		this.font= "10px sans-serif";
		this.textAlign= "left";
		this.textBaseline= "top";
		this.outlineColor= "black";
        this.clip= false;

		return this;
	};

    CAAT.TextActor.TRAVERSE_PATH_FORWARD= 1;
    CAAT.TextActor.TRAVERSE_PATH_BACKWARD= -1;

	CAAT.TextActor.prototype= {
		font:			    null,   // a valid canvas rendering context font description. Default font
                                    // will be "10px sans-serif".
		textAlign:		    null,	// a valid canvas rendering context textAlign string. Any of:
                                    // start, end, left, right, center.
                                    // defaults to "left".
		textBaseline:	    null,	// a valid canvas rendering context textBaseLine string. Any of:
                                    // top, hanging, middle, alphabetic, ideographic, bottom.
                                    // defaults to "top".
		fill:			    true,   // a boolean indicating whether the text should be filled.
		text:			    null,   // a string with the text to draw.
		textWidth:		    0,      // an integer indicating text width in pixels.
        textHeight:         0,      // an integer indicating text height in pixels.
		outline:		    false,  // a boolean indicating whether the text should be outlined.
                                    // not all browsers support it.
		outlineColor:	    null,   // a valid color description string.

		path:			    null,   // a CAAT.Path which will be traversed by the text. [Optional]
        pathInterpolator:	null,   // a CAAT.Interpolator to apply to the path traversing.
        pathDuration:       10000,  // an integer indicating the time to be taken to traverse the path. ms.
		sign:			    1,      // traverse the path forward or backwards.

        /**
         * Set the text to be filled. The default Filling style will be set by calling setFillStyle method.
         * Default value is true.
         * @param fill {boolean} a boolean indicating whether the text will be filled.
         * @return this;
         */
        setFill : function( fill ) {
            this.fill= fill;
            return this;
        },
        /**
         * Sets whether the text will be outlined.
         * @param outline {boolean} a boolean indicating whether the text will be outlined.
         * @return this;
         */
        setOutline : function( outline ) {
            this.outline= outline;
            return this;
        },
        setPathTraverseDirection : function(direction) {
            this.sign= direction;
            return this;
        },
        /**
         * Defines text's outline color.
         *
         * @param color {string} sets a valid canvas context color.
         * @return this.
         */
        setOutlineColor : function( color ) {
            this.outlineColor= color;
            return this;
        },
        /**
         * Set the text to be shown by the actor.
         * @param sText a string with the text to be shwon.
         * @return this
         */
		setText : function( sText ) {
			this.text= sText;
            this.setFont( this.font );

            return this;
        },
        setTextAlign : function( align ) {
            this.textAlign= align;
            return this;
        },
        /**
         * Sets text alignment
         * @param align
         * @deprecated use setTextAlign
         */
        setAlign : function( align ) {
            return this.setTextAlign(align);
        },
        /**
         * Set text baseline.
         * @param baseline
         */
        setTextBaseline : function( baseline ) {
            this.textBaseline= baseline;
            return this;

        },
        setBaseline : function( baseline ) {
            return this.setTextBaseline(baseline);
        },
        /**
         * Sets the font to be applied for the text.
         * @param font a string with a valid canvas rendering context font description.
         * @return this
         */
        setFont : function(font) {

            if ( !font ) {
                return this;
            }

            this.font= font;

            if ( null===this.text || this.text==="" ) {
                this.width= this.height= 0;
            }

            return this;
		},

        /**
         * Calculates the text dimension in pixels and stores the values in textWidth and textHeight
         * attributes.
         * If Actor's width and height were not set, the Actor's dimension will be set to these values.
         * @param director a CAAT.Director instance.
         * @return this
         */
        calcTextSize : function(director) {

            if ( director.glEnabled ) {
                return this;
            }

            var ctx= director.ctx;

            director.ctx.save();
            director.ctx.font= this.font;

            this.textWidth= director.crc.measureText( this.text ).width;
            if (this.width===0) {
                this.width= this.textWidth;
            }

            try {
                var pos= this.font.indexOf("px");
                var s =  this.font.substring(0, pos );
                this.textHeight= parseInt(s,10);

                // needed to calculate the descent.
                // no context.getDescent(font) WTF !!!
                this.textHeight+= (this.textHeight/4)>>0;
            } catch(e) {
                this.textHeight=20; // default height;
            }

            if ( this.height===0 ) {
                this.height= this.textHeight;
            }

            director.crc.restore();

            return this;
        },
        /**
         * Custom paint method for TextActor instances.
         * If the path attribute is set, the text will be drawn traversing the path.
         *
         * @param director a valid CAAT.Director instance.
         * @param time an integer with the Scene time the Actor is being drawn.
         */
		paint : function(director, time) {

            if ( this.backgroundImage ) {   // cached
                CAAT.TextActor.superclass.paint.call(this, director, time );
            }

			if ( null===this.text) {
				return;
			}

            if ( this.textWidth===0 || this.textHeight===0 ) {
                this.calcTextSize(director);
            }

			var canvas= director.crc;

			if( null!==this.font ) {
				canvas.font= this.font;
			}
			if ( null!==this.textAlign ) {
				canvas.textAlign= this.textAlign;
			}
			if ( null!==this.textBaseline ) {
				canvas.textBaseline= this.textBaseline;
			}
			if ( null!==this.fillStyle ) {
				canvas.fillStyle= this.fillStyle;
			}

			if (null===this.path) {

                var tx=0;
                if ( this.textAlign==='center') {
                    tx= (this.width/2)|0;
                } else if ( this.textAlign==='right' ) {
                    tx= this.width;
                }

				if ( this.fill ) {
					canvas.fillText( this.text, tx, 0 );
					if ( this.outline ) {

						// firefox necesita beginPath, si no, dibujara ademas el cuadrado del
						// contenedor de los textos.
						if ( null!==this.outlineColor ) {
							canvas.strokeStyle= this.outlineColor;
						}
						canvas.beginPath();
						canvas.strokeText( this.text, tx, 0 );
					}
				} else {
					if ( null!==this.outlineColor ) {
						canvas.strokeStyle= this.outlineColor;
					}
                    canvas.beginPath();
					canvas.strokeText( this.text, tx, 0 );
				}
			}
			else {
				this.drawOnPath(director,time);
			}
		},
        /**
         * Private.
         * Draw the text traversing a path.
         * @param director a valid CAAT.Director instance.
         * @param time an integer with the Scene time the Actor is being drawn.
         */
		drawOnPath : function(director, time) {

			var canvas= director.crc;

			var textWidth=this.sign * this.pathInterpolator.getPosition(
                    (time%this.pathDuration)/this.pathDuration ).y * this.path.getLength() ;
			var p0= new CAAT.Point(0,0,0);
			var p1= new CAAT.Point(0,0,0);

			for( var i=0; i<this.text.length; i++ ) {
				var caracter= this.text[i].toString();
				var charWidth= canvas.measureText( caracter ).width;

				var pathLength= this.path.getLength();

				var currentCurveLength= charWidth/2 + textWidth;

				p0= this.path.getPositionFromLength(currentCurveLength).clone();
				p1= this.path.getPositionFromLength(currentCurveLength-0.1).clone();

				var angle= Math.atan2( p0.y-p1.y, p0.x-p1.x );

				canvas.save();

					canvas.translate( (0.5+p0.x)|0, (0.5+p0.y)|0 );
					canvas.rotate( angle );
                    if ( this.fill ) {
					    canvas.fillText(caracter,0,0);
                    }
                    if ( this.outline ) {
                        canvas.strokeStyle= this.outlineColor;
                        canvas.strokeText(caracter,0,0);
                    }

				canvas.restore();

				textWidth+= charWidth;
			}
		},
        /**
         * Set the path, interpolator and duration to draw the text on.
         * @param path a valid CAAT.Path instance.
         * @param interpolator a CAAT.Interpolator object. If not set, a Linear Interpolator will be used.
         * @param duration an integer indicating the time to take to traverse the path. Optional. 10000 ms
         * by default.
         */
		setPath : function( path, interpolator, duration ) {
			this.path= path;
            this.pathInterpolator= interpolator || new CAAT.Interpolator().createLinearInterpolator();
            this.pathDuration= duration || 10000;

            /*
                parent could not be set by the time this method is called.
                so the actors bounds set is removed.
                the developer must ensure to call setbounds properly on actor.
             */
			this.mouseEnabled= false;

            return this;
		}
	};

    extend( CAAT.TextActor, CAAT.ActorContainer, null);
})();

(function() {

    /**
     * This Actor draws common shapes, concretely Circles and rectangles.
     *
     * @constructor
     * @extends CAAT.ActorContainer
     */
    CAAT.ShapeActor = function() {
        CAAT.ShapeActor.superclass.constructor.call(this);
        this.compositeOp= 'source-over';

        /**
         * Thanks Svend Dutz and Thomas Karolski for noticing this call was not performed by default,
         * so if no explicit call to setShape was made, nothing would be drawn.
         */
        this.setShape( this.SHAPE_CIRCLE );
        return this;
    };

    CAAT.ShapeActor.prototype= {

        shape:          0,      // shape type. One of the constant SHAPE_* values
        compositeOp:    null,   // a valid canvas rendering context string describing compositeOps.
        lineWidth:      1,
        lineCap:        null,
        lineJoin:       null,
        miterLimit:     null,

        SHAPE_CIRCLE:   0,      // Constants to describe different shapes.
        SHAPE_RECTANGLE:1,

        /**
         * 
         * @param l {number>0}
         */
        setLineWidth : function(l)  {
            this.lineWidth= l;
            return this;
        },
        /**
         *
         * @param lc {string{butt|round|square}}
         */
        setLineCap : function(lc)   {
            this.lineCap= lc;
            return this;
        },
        /**
         *
         * @param lj {string{bevel|round|miter}}
         */
        setLineJoin : function(lj)  {
            this.lineJoin= lj;
            return this;
        },
        /**
         *
         * @param ml {integer>0}
         */
        setMiterLimit : function(ml)    {
            this.miterLimit= ml;
            return this;
        },
        getLineCap : function() {
            return this.lineCap;
        },
        getLineJoin : function()    {
            return this.lineJoin;
        },
        getMiterLimit : function()  {
            return this.miterLimit;
        },
        getLineWidth : function()   {
            return this.lineWidth;
        },
        /**
         * Sets shape type.
         * No check for parameter validity is performed.
         * Set paint method according to the shape.
         * @param iShape an integer with any of the SHAPE_* constants.
         * @return this
         */
        setShape : function(iShape) {
            this.shape= iShape;
            this.paint= this.shape===this.SHAPE_CIRCLE ?
                    this.paintCircle :
                    this.paintRectangle;
            return this;
        },
        /**
         * Sets the composite operation to apply on shape drawing.
         * @param compositeOp an string with a valid canvas rendering context string describing compositeOps.
         * @return this
         */
        setCompositeOp : function(compositeOp){
            this.compositeOp= compositeOp;
            return this;
        },
        /**
         * Draws the shape.
         * Applies the values of fillStype, strokeStyle, compositeOp, etc.
         *
         * @param director a valid CAAT.Director instance.
         * @param time an integer with the Scene time the Actor is being drawn.
         */
        paint : function(director,time) {
        },
        /**
         * @private
         * Draws a circle.
         * @param director a valid CAAT.Director instance.
         * @param time an integer with the Scene time the Actor is being drawn.
         */
        paintCircle : function(director,time) {
            var ctx= director.crc;

            ctx.lineWidth= this.lineWidth;

            ctx.globalCompositeOperation= this.compositeOp;
            if ( null!==this.fillStyle ) {
                ctx.fillStyle= this.fillStyle;
                ctx.beginPath();
                ctx.arc( this.width/2, this.height/2, Math.min(this.width,this.height)/2, 0, 2*Math.PI, false );
                ctx.fill();
            }

            if ( null!==this.strokeStyle ) {
                ctx.strokeStyle= this.strokeStyle;
                ctx.beginPath();
                ctx.arc( this.width/2, this.height/2, Math.min(this.width,this.height)/2, 0, 2*Math.PI, false );
                ctx.stroke();
            }
        },
        /**
         *
         * Private
         * Draws a Rectangle.
         *
         * @param director a valid CAAT.Director instance.
         * @param time an integer with the Scene time the Actor is being drawn.
         */
        paintRectangle : function(director,time) {
            var ctx= director.crc;

            ctx.lineWidth= this.lineWidth;

            if ( this.lineCap ) {
                ctx.lineCap= this.lineCap;
            }
            if ( this.lineJoin )    {
                ctx.lineJoin= this.lineJoin;
            }
            if ( this.miterLimit )  {
                ctx.miterLimit= this.miterLimit;
            }

            ctx.globalCompositeOperation= this.compositeOp;
            if ( null!==this.fillStyle ) {
                ctx.fillStyle= this.fillStyle;
                ctx.beginPath();
                ctx.fillRect(0,0,this.width,this.height);
                ctx.fill();
            }

            if ( null!==this.strokeStyle ) {
                ctx.strokeStyle= this.strokeStyle;
                ctx.beginPath();
                ctx.strokeRect(0,0,this.width,this.height);
                ctx.stroke();
            }
        }
    };

    extend( CAAT.ShapeActor, CAAT.ActorContainer, null);
})();

(function() {

    /**
     * This actor draws stars.
     *
     * @constructor
     * @extends CAAT.ActorContainer
     */
    CAAT.StarActor= function() {
        CAAT.StarActor.superclass.constructor.call(this);
        this.compositeOp= 'source-over';
        return this;
    };

    CAAT.StarActor.prototype= {
        nPeaks:         0,
        maxRadius:      0,
        minRadius:      0,
        initialAngle:   0,
        compositeOp:    null,
        lineWidth:      1,
        lineCap:        null,
        lineJoin:       null,
        miterLimit:     null,

        /**
         *
         * @param l {number>0}
         */
        setLineWidth : function(l)  {
            this.lineWidth= l;
            return this;
        },
        /**
         *
         * @param lc {string{butt|round|square}}
         */
        setLineCap : function(lc)   {
            this.lineCap= lc;
            return this;
        },
        /**
         *
         * @param lj {string{bevel|round|miter}}
         */
        setLineJoin : function(lj)  {
            this.lineJoin= lj;
            return this;
        },
        /**
         *
         * @param ml {integer>0}
         */
        setMiterLimit : function(ml)    {
            this.miterLimit= ml;
            return this;
        },
        getLineCap : function() {
            return this.lineCap;
        },
        getLineJoin : function()    {
            return this.lineJoin;
        },
        getMiterLimit : function()  {
            return this.miterLimit;
        },
        getLineWidth : function()   {
            return this.lineWidth;
        },
        /**
         * Sets whether the star will be color filled.
         * @param filled {boolean}
         * @deprecated
         */
        setFilled : function( filled ) {
            return this;
        },
        /**
         * Sets whether the star will be outlined.
         * @param outlined {boolean}
         * @deprecated
         */
        setOutlined : function( outlined ) {
            return this;
        },
        /**
         * Sets the composite operation to apply on shape drawing.
         * @param compositeOp an string with a valid canvas rendering context string describing compositeOps.
         * @return this
         */
        setCompositeOp : function(compositeOp){
            this.compositeOp= compositeOp;
            return this;
        },
        /**
         * 
         * @param angle {number} number in radians.
         */
        setInitialAngle : function(angle) {
            this.initialAngle= angle;
            return this;
        },
        /**
         * Initialize the star values.
         * <p>
         * The star actor will be of size 2*maxRadius.
         *
         * @param nPeaks {number} number of star points.
         * @param maxRadius {number} maximum star radius
         * @param minRadius {number} minimum star radius
         *
         * @return this
         */
        initialize : function(nPeaks, maxRadius, minRadius) {
            this.setSize( 2*maxRadius, 2*maxRadius );

            this.nPeaks= nPeaks;
            this.maxRadius= maxRadius;
            this.minRadius= minRadius;

            return this;
        },
        /**
         * Paint the star.
         *
         * @param director {CAAT.Director}
         * @param timer {number}
         */
        paint : function(director, timer) {

            var ctx=        director.ctx;
            var centerX=    this.width/2;
            var centerY=    this.height/2;
            var r1=         this.maxRadius;
            var r2=         this.minRadius;
            var ix=         centerX + r1*Math.cos(this.initialAngle);
            var iy=         centerY + r1*Math.sin(this.initialAngle);

            ctx.lineWidth= this.lineWidth;
            if ( this.lineCap ) {
                ctx.lineCap= this.lineCap;
            }
            if ( this.lineJoin )    {
                ctx.lineJoin= this.lineJoin;
            }
            if ( this.miterLimit )  {
                ctx.miterLimit= this.miterLimit;
            }

            ctx.globalCompositeOperation= this.compositeOp;

            ctx.beginPath();
            ctx.moveTo(ix,iy);

            for( var i=1; i<this.nPeaks*2; i++ )   {
                var angleStar= Math.PI/this.nPeaks * i + this.initialAngle;
               var rr= (i%2===0) ? r1 : r2;
                var x= centerX + rr*Math.cos(angleStar);
                var y= centerY + rr*Math.sin(angleStar);
                ctx.lineTo(x,y);
            }

            ctx.lineTo(
                centerX + r1*Math.cos(this.initialAngle),
                centerY + r1*Math.sin(this.initialAngle) );

            ctx.closePath();
            
            if ( this.fillStyle ) {
                ctx.fillStyle= this.fillStyle;
                ctx.fill();
            }

            if ( this.strokeStyle ) {
                ctx.strokeStyle= this.strokeStyle;
                ctx.stroke();
            }

        }
    };

    extend(CAAT.StarActor, CAAT.ActorContainer, null);

})();

/**
 * An actor suitable to draw an ImageProcessor instance.
 */
(function() {

    /**
     * This Actor will show the result of an image processing operation.
     *
     * @constructor
     * @extends CAAT.ActorContainer
     */
    CAAT.IMActor= function() {
        CAAT.IMActor.superclass.constructor.call(this);
        return this;
    };

    CAAT.IMActor.prototype= {

        imageProcessor:         null,
        changeTime:             100,
        lastApplicationTime:    -1,

        /**
         * Set the image processor.
         *
         * @param im {CAAT.ImageProcessor} a CAAT.ImageProcessor instance.
         */
        setImageProcessor : function(im) {
            this.imageProcessor= im;
            return this;
        },
        /**
         * Call image processor to update image every time milliseconds.
         * @param time an integer indicating milliseconds to elapse before updating the frame.
         */
        setImageProcessingTime : function( time ) {
            this.changeTime= time;
            return this;
        },
        paint : function( director, time ) {
            if ( time-this.lastApplicationTime>this.changeTime ) {
                this.imageProcessor.apply( director, time );
                this.lastApplicationTime= time;
            }

            var ctx= director.ctx;
            this.imageProcessor.paint( director, time );
        }
    };

    extend( CAAT.IMActor, CAAT.ActorContainer, null);
})();