/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * Classes to define animable elements.
 * Actor is the superclass of every animable element in the scene graph. It handles the whole
 * affine transformation MatrixStack, rotation, translation, globalAlpha and Behaviours. It also
 * defines input methods.
 * TODO: method to handle keyboard.
 * TODO: add text presentation/animation effects.
 * TODO: add more shapes to ShapeActor
 **/


(function() {
	CAAT.Actor = function() {
		this.transformationMatrix= new CAAT.MatrixStack();
		this.rpoint= new CAAT.Point();
		this.behaviorList= [];
        this.lifecycleListenerList= [];
        this.screenBounds= new CAAT.Rectangle();

		return this;
	};

	CAAT.Actor.prototype= {
        lifecycleListenerList:	null,   // Array of life cycle listener
		behaviorList: 			null,   // Array of behaviors to apply to the Actor
		parent:					null,   // Parent of this Actor. May be Scene.
		x:						0,      // x position on parent. In parent's local coord. system.
		y:						0,      // y position on parent. In parent's local coord. system.
		width:					0,      // Actor's width. In parent's local coord. system.
		height:					0,      // Actor's height. In parent's local coord. system.
		start_time:				0,      // Start time in Scene time.
		duration:				Number.MAX_VALUE,   // Actor duration in Scene time
		transformationMatrix:	null,   // Compound transformation matrix stack.
		rpoint:					null,   // Cache for rotation when calculating coordinates transformations.
		clip:					false,  // should clip the Actor's content against its contour.

        scaleX:					0,      // transformation. width scale parameter
		scaleY:					0,      // transformation. height scale parameter
		scaleTX:				0,      // transformation. scale anchor x position
		scaleTY:				0,      // transformation. scale anchor y position
		scaleAnchor:			0,      // transformation. scale anchor
		rotationAngle:			0,      // transformation. rotation angle in radians
		rotationX:				0,      // transformation. rotation center x
		rotationY:				0,      // transformation. rotation center y
		alpha:					1,      // alpha transparency value
        isGlobalAlpha:          false,  // is this a global alpha
        frameAlpha:             1,      // hierarchically calculated alpha for this Actor.
		expired:				false,  // set when the actor has been expired
		discardable:			false,  // set when you want this actor to be removed if expired
		pointed:				false,  // is the mouse pointer inside this actor
		mouseEnabled:			true,   // events enabled ?

		ANCHOR_CENTER:			0,      // constant values to determine different affine transform
		ANCHOR_TOP:				1,      // anchors.
		ANCHOR_BOTTOM:			2,
		ANCHOR_LEFT:			3,
		ANCHOR_RIGHT:			4,
		ANCHOR_TOP_LEFT:		5,
		ANCHOR_TOP_RIGHT:		6,
		ANCHOR_BOTTOM_LEFT:		7,
		ANCHOR_BOTTOM_RIGHT:	8,

		fillStyle:				null,   // any canvas rendering valid fill style.
        strokeStyle:            null,   // any canvas rendering valid stroke style.
        time:                   0,      // Cache Scene time.
        screenBounds:           null,   // CAAT.Rectangle
        inFrame:                false,  // boolean indicating whether this Actor was present on last frame.

        /**
         * Adds an Actor's life cycle listener.
         * The developer must ensure the actorListener is not already a listener, otherwise
         * it will notified more than once.
         * @param actorListener an object with at least a method of the form:
         * actorLyfeCycleEvent( actor, string_event_type, long_time )
         */
		addListener : function( actorListener ) {
			this.lifecycleListenerList.push(actorListener);
		},
        /**
         * Removes an Actor's life cycle listener.
         * It will only remove the first occurrence of the given actorListener.
         * @param actorListener an Actor's life cycle listener.
         */
        removeListener : function( actorListener ) {
            var n= this.lifecycleListenerList.length;
            while(n--) {
                if ( this.lifecycleListenerList[n]==actorListener ) {
                    // remove the nth element.
                    this.lifecycleListenerList.splice(n,1);
                    return;
                }
            }
        },
        setGlobalAlpha : function( global ) {
            this.isGlobalAlpha= global;
            return this;
        },
        /**
         * Notifies the registeres Acto'r life cycle listener about some event.
         * @param sEventType an string indicating the type of event being notified.
         * @param time an integer indicating the time related to Scene's timeline when the event
         * is being notified.
         */
        fireEvent : function(sEventType, time)	{
            for( var i=0; i<this.lifecycleListenerList.length; i++ )	{
                this.lifecycleListenerList[i].actorLyfeCycleEvent(this, sEventType, time);
            }
        },
        /**
         * Calculates the 2D bounding box in canvas coordinates of the Actor.
         * This bounding box takes into account the transformations applied hierarchically for
         * each Scene Actor.
         */
        setScreenBounds : function() {

            var p=[];
            p.push( new CAAT.Point().set(0,0) );
            p.push( new CAAT.Point().set(this.width, this.height) );
            p.push( new CAAT.Point().set(0,            this.height) );
            p.push( new CAAT.Point().set(this.width, 0) );

            for( var k=0; k<p.length; k++ ) {
                this.transformCoord( p[k] );
            }

            var xmin= Number.MAX_VALUE, xmax=Number.MIN_VALUE;
            var ymin= Number.MAX_VALUE, ymax=Number.MIN_VALUE;

            for( var i=0; i<p.length; i++ ) {
                if ( p[i].x < xmin ) {
                    xmin=p[i].x;
                }
                if ( p[i].x > xmax ) {
                    xmax=p[i].x;
                }

                if ( p[i].y < ymin ) {
                    ymin=p[i].y;
                }
                if ( p[i].y > ymax ) {
                    ymax=p[i].y;
                }
            }

            this.screenBounds.x= xmin;
            this.screenBounds.y= ymin;
            this.screenBounds.width=  xmax-xmin;
            this.screenBounds.height= ymax-ymin;

        },
        /**
         * Sets this Actor as Expired.
         * If this is a Container, all the contained Actors won't be nor drawn nor will receive
         * any event. That is, expiring an Actor means totally taking it out the Scene's timeline.
         * @param time an integer indicating the time the Actor was expired at.
         * @return this.
         */
        setExpired : function(time) {
            this.expired= true;
            this.fireEvent('expired',time);
            return this;
        },
        /**
         * Enable or disable the event bubbling for this Actor.
         * @param enable a boolean indicating whether the event bubbling is enabled.
         * @return this
         */
        enableEvents : function( enable ) {
            this.mouseEnabled= enable;
            return this;
        },
        /**
         * Removes all behaviors from an Actor.
         * @return this
         */
		emptyBehaviorList : function() {
			this.behaviorList=[];
            return this;
		},
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
			this.rotateAnchor=0;
			this.rotationX=0;
			this.rotationY=0;
			this.scaleX=1;
			this.scaleY=1;
			this.scaleTX=0;
			this.scaleTY=0;
			this.scaleAnchor=0;

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

            return this;
		},
        /**
         * This method should me overriden by every custom Actor.
         * It will be the drawing routine called by the Director to show every Actor.
         * @param director the CAAT.Director instance that contains the Scene the Actor is in.
         * @param time an integer indicating the Scene time in which the drawing is performed.
         */
		paint : function(director, time) {

			var ctx= director.crc;

			if ( null!=this.parent && null!=this.fillStyle ) {
				ctx.fillStyle= this.pointed ? 'orange' : (this.fillStyle!=null ? this.fillStyle : 'white'); //'white';
				ctx.fillRect(0,0,this.width,this.height );
			}

            if ( null!=this.strokeStyle ) {
                ctx.strokeStyle= this.strokeStyle;
                ctx.strokeRect(0,0,this.width,this.height);
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
			this.setScaleAnchored( sx, sy, this.ANCHOR_CENTER );
            return this;
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
            	tx= this.width/2;
            	ty= this.height/2;
                break;
            case this.ANCHOR_TOP:
            	tx= this.width/2;
            	ty= 0;
                break;
            case this.ANCHOR_BOTTOM:
            	tx= this.width/2;
            	ty= this.height;
                break;
            case this.ANCHOR_LEFT:
            	tx= 0;
            	ty= this.height/2;
                break;
            case this.ANCHOR_RIGHT:
            	tx= this.width;
            	ty= this.height/2;
                break;
            case this.ANCHOR_TOP_RIGHT:
            	tx= this.width;
            	ty= 0;
                break;
            case this.ANCHOR_BOTTOM_LEFT:
            	tx= 0;
            	ty= this.height;
                break;
            case this.ANCHOR_BOTTOM_RIGHT:
            	tx= this.width;
            	ty= this.height;
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
         * @param sx a float indicating a width size multiplier.
         * @param sy a float indicating a height size multiplier.
         * @param anchor an integer indicating the anchor to perform the Scale operation.
         *
         * @return this;
         */
		setScaleAnchored : function( sx, sy, anchor )    {
			this.scaleAnchor= anchor;

			var obj= this.getAnchor( this.scaleAnchor );

			this.scaleTX= obj.x;
			this.scaleTY= obj.y;

			this.scaleX=sx;
			this.scaleY=sy;

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
			this.setRotationAnchored( angle, this.width/2, this.height/2 );

            return this;
	    },
        /**
         * This method sets Actor rotation around a given position.
         * @param angle a float indicating the angle in radians to rotate the Actor.
         * @param rx
         * @param ry
         * @return this;
         */
	    setRotationAnchored : function( angle, rx, ry ) {
	    	this.rotationAngle= angle;
	    	this.rotationX= rx?rx:0;
	    	this.rotationY= ry?ry:0;

            return this;
	    },
        /**
         * Sets an Actor's dimension
         * @param w a float indicating Actor's width.
         * @param h a float indicating Actor's height.
         * @return this
         */
	    setSize : function( w, h )   {
	    	this.width= w;
	    	this.height= h;

            return this;
	    },
        /**
         * Set location and dimension of an Actor at once.
         * @param x a float indicating Actor's x position.
         * @param y a float indicating Actor's y position
         * @param w a float indicating Actor's width
         * @param h a float indicating Actor's height
         * @return this
         */
	    setBounds : function(x, y, w, h)  {
	    	this.x= x;
	    	this.y= y;
	    	this.width= w;
	    	this.height= h;

            return this;
	    },
        /**
         * This method sets the position of an Actor inside its parent.
         * @param x a float indicating Actor's x position
         * @param y a float indicating Actor's y position
         * @return this
         */
	    setLocation : function( x, y ) {
	        this.x= x;
	        this.y= y;

            return this;
	    },
        /**
         * Private.
         * This method is called by the Director to know whether the actor is on Scene time.
         * In case it was necessary, this method will notify any life cycle behaviors about
         * an Actor expiration.
         * @param time an integer indicating the Scene time.
         */
	    isInAnimationFrame : function(time)    {
            if ( this.expired )	{
                return false;
            }

	    	if ( this.duration==Number.MAX_VALUE ) {
	    		return this.start_time<=time;
	    	}

			if ( time>this.start_time+this.duration )	{
				if ( !this.expired )	{
					this.setExpired(time);
				}

				return false;
			}

	    	return this.start_time<=time && time<this.start_time+this.duration;
	    },
        /**
         * Checks whether a coordinate is inside the Actor's bounding box.
         * @param x a float
         * @param y a float
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
         */
		create : function()	{
	    	this.scaleAnchor= this.ANCHOR_CENTER;
	    	this.rotateAnchor= this.ANCHOR_CENTER;
	    	this.setScale(1,1);
	    	this.setRotation(0);
	        this.behaviorList= [];

            return this;
		},
        /**
         * Add a Behavior to the Actor.
         * An Actor accepts an undefined number of Behaviors.
         *
         * @param behavior a CAAT.Behavior instance
         * @return this
         */
		addBehavior : function( behavior )	{
			this.behaviorList.push(behavior);
            return this;
		},
        /**
         * Remove a Behavior from the Actor.
         * If the Behavior is not present at the actor behavior collection nothing happends.
         *
         * @param behavior a CAAT.Behavior instance.
         */
        removeBehaviour : function( behavior ) {
            var n= this.behaviorList.length;
            while(n--) {
                if ( this.behaviorList[n]==behavior ) {
                    this.behaviorList.splice(n,1);
                    return;
                }
            }
        },
        /**
         * Set discardable property.
         * @param discardable a boolean indicating whether the Actor is discardable.
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
         */
		destroy : function(time)	{
            this.fireEvent('destroyed',time);
		},
        /**
         * Private.
         * @param point an object of the form {x : float, y: float}
         *
         * @return the source point object
         */
        transformCoord : function(point) {
            var tthis= this;

            while( !(tthis instanceof CAAT.Director) ) {
                tthis.transformationMatrix.transformCoord(point);
                tthis= tthis.parent;
            }

            return point;
        },
        /**
         * Private.
         * @param point an object of the form {x : float, y: float}
         *
         * @return the source point object
         */
		inverseTransformCoord : function(point) {
			var tthis= this;
			while( tthis) {
				tthis.transformationMatrix.inverseTransformCoord(point);
				tthis= tthis.parent;
			}

			return point;
		},
        /**
         * Private
         * This method does the needed point transformations across an Actor hierarchy to devise
         * whether the parameter point coordinate lies inside the Actor.
         * @param point an object of the form { x: float, y: float }
         *
         * @return null if the point is not inside the Actor. The Actor otherwise.
         */
	    findActorAtPosition : function(point) {
			if ( !this.mouseEnabled ) {
				return null;
			}

			this.rpoint.set( point.x, point.y );
	    	this.transformationMatrix.inverseTransformCoord(this.rpoint);
	    	return this.contains(this.rpoint.x, this.rpoint.y) ? this :null;
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

			this.ax= 0;
			this.ay= 0;
			this.mx= 0;
			this.my= 0;
			this.asx=1;
			this.asy=1;
			this.ara=0;
			this.screenx=0;
			this.screeny=0;

	    	this.mouseEnter= function(mouseEvent) {
				this.ax= -1;
				this.ay= -1;
		    	this.pointed= true;
		    	document.body.style.cursor = 'move';
	    	};

	    	this.mouseExit= function(mouseEvent) {
				this.ax= -1;
				this.ay= -1;
				this.pointed= false;
				document.body.style.cursor = 'default';
	    	};

	    	this.mouseMove= function(mouseEvent) {
				this.mx= mouseEvent.point.x;
				this.my= mouseEvent.point.y;
	    	};

	    	this.mouseUp= function( mouseEvent) {
				this.ax= -1;
				this.ay= -1;
	    	};

	    	this.mouseDrag= function(mouseEvent) {

				if ( this.ax==-1 || this.ay==-1 ) {
					this.ax= mouseEvent.point.x;
					this.ay= mouseEvent.point.y;
					this.asx= this.scaleX;
					this.asy= this.scaleY;
					this.ara= this.rotationAngle;
					this.screenx= mouseEvent.screenPoint.x;
					this.screeny= mouseEvent.screenPoint.y;
				}

				if ( mouseEvent.isShiftDown() ) {
					var scx= (mouseEvent.screenPoint.x-this.screenx)/100;
					var scy= (mouseEvent.screenPoint.y-this.screeny)/100;
					if ( !mouseEvent.isAltDown() ) {
						var sc= Math.max( scx, scy );
						scx= sc;
						scy= sc;
					}
					this.setScale( scx+this.asx, scy+this.asy );

				} else if ( mouseEvent.isControlDown() ) {
					var vx=  mouseEvent.screenPoint.x - this.screenx;
					var vy=  mouseEvent.screenPoint.y - this.screeny;
					this.setRotation( -Math.atan2( vx, vy ) + this.ara );
				} else {
					this.x+= mouseEvent.point.x-this.ax;
					this.y+= mouseEvent.point.y-this.ay;
					this.ax= mouseEvent.point.x;
					this.ay= mouseEvent.point.y;
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
	    mouseClick : function(mouseEvent) {
	    },
        /**
         * Default double click handler
         *
         * @param mouseEvent a CAAT.MouseEvent object instance.
         */
	    mouseDblClick : function(mouseEvent) {
	    },
        /**
         * Default mouse enter on Actor handler.
         * @param mouseEvent a CAAT.MouseEvent object instance.
         */
		mouseEnter : function(mouseEvent) {
	    	this.pointed= true;
		},
        /**
         * Default mouse exit on Actor handler.
         *
         * @param mouseEvent a CAAT.MouseEvent object instance.
         */
		mouseExit : function(mouseEvent) {
			this.pointed= false;
		},
        /**
         * Default mouse move inside Actor handler.
         *
         * @param mouseEvent a CAAT.MouseEvent object instance.
         */
		mouseMove : function(mouseEvent) {
		},
        /**
         * default mouse press in Actor handler.
         *
         * @param mouseEvent a CAAT.MouseEvent object instance.
         */
		mouseDown : function(mouseEvent) {
		},
        /**
         * default mouse release in Actor handler.
         *
         * @param mouseEvent a CAAT.MouseEvent object instance.
         */
		mouseUp : function(mouseEvent) {
		},
        /**
         * default Actor mouse drag handler.
         *
         * @param mouseEvent a CAAT.MouseEvent object instance.
         */
		mouseDrag : function(mouseEvent) {
		},
        /**
         * Draw a bounding box with on-screen coordinates regardless of the transformations
         * applied to the Actor.
         *
         * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
         * @param time an integer indicating the Scene time when the bounding box is to be drawn.
         */
        drawScreenBoundingBox : function( director, time ) {
            if ( this.inFrame && null!=this.screenBounds ) {
                director.crc.strokeStyle='red';
                director.crc.strokeRect(
                    this.screenBounds.x, this.screenBounds.y,
                    this.screenBounds.width, this.screenBounds.height );
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
			for( var i=0; i<this.behaviorList.length; i++ )	{
				this.behaviorList[i].apply(time,this);
			}
		},
        /**
         * Private.
         * This method will be called by the Director to set the whole Actor pre-render process.
         *
         * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
         * @param time an integer indicating the Scene time when the bounding box is to be drawn.
         *
         * @return boolean indicating whether the Actor isInFrameTime
         */
        paintActor : function(director, time) {

            if ( !this.isInAnimationFrame(time) ) {
                this.inFrame= false;
                return false;
            }

            var canvas= director.crc;

            this.frameAlpha= this.parent.frameAlpha*this.alpha;
            canvas.globalAlpha= this.frameAlpha;

            this.transformationMatrix.prepareGraphics(canvas,this);
            this.setScreenBounds();

            if ( this.clip ) {
                canvas.beginPath();
                canvas.rect(0,0,this.width,this.height);
                canvas.clip();
            }

            this.paint(director, time);

            this.inFrame= true;

            return true;
        },
        /**
         * Private.
         * This method is called after the Director has transformed and drawn a whole frame.
         *
         * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
         * @param time an integer indicating the Scene time when the bounding box is to be drawn.
         * @return this
         */
        endAnimate : function(director,time) {
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
         * Enable or disable the clipping process for this Actor.
         *
         * @param clip a boolean indicating whether clip is enabled.
         * @return this
         */
        setClip : function( clip ) {
            this.clip= clip;
            return this;
        }
	};

})();


(function() {
	CAAT.ActorContainer= function() {
		CAAT.ActorContainer.superclass.constructor.call(this);
		this.childrenList= [];
		return this;
	};


	extend( CAAT.ActorContainer, CAAT.Actor, {

        childrenList : null,       // the list of children contained.

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

            for( var i=0; i<this.childrenList.length; i++ ) {
                this.childrenList[i].drawScreenBoundingBox(director,time);
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
            var canvas= director.crc;

            canvas.save();

            if (!CAAT.ActorContainer.superclass.paintActor.call(this,director,time)) {
                return false;
            }

            if ( !this.isGlobalAlpha ) {
                this.frameAlpha= this.parent.frameAlpha;
            }

            for( var i=0; i<this.childrenList.length; i++ ) {
                canvas.save();
                this.childrenList[i].paintActor(director,time);
                canvas.restore();
            }
            canvas.restore();

            return true;
        },
        /**
         * Private.
         * Performs the animate method for this ActorContainer and every contained Actor.
         *
         * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
         * @param time an integer indicating the Scene time when the bounding box is to be drawn.
         *
         * @return this
         */
		animate : function(director,time) {

            CAAT.ActorContainer.superclass.animate.call(this,director,time);

            var i;

            for( i=0; i<this.childrenList.length; i++ ) {
                if (this.childrenList[i].isInAnimationFrame(time)) {
                    this.childrenList[i].time= time;
                    this.childrenList[i].animate(director, time);
                }
            }

            return this;
		},
        /**
         * Removes Actors from this ActorContainer which are expired and flagged as Discardable.
         *
         * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
         * @param time an integer indicating the Scene time when the bounding box is to be drawn.
         */
        endAnimate : function(director,time) {

            CAAT.ActorContainer.superclass.endAnimate.call(this,director,time);

            var i;
            // remove expired and discardable elements.
            for( i=this.childrenList.length-1; i>=0; i-- ) {
                var actor= this.childrenList[i];
                if ( actor.expired && actor.discardable ) {
                    actor.destroy(time);
                    this.childrenList.splice(i,1);
                } else {
                    actor.endAnimate(director,time);
                }
            }

        },
        /**
         * Adds an Actor to this ActorContainer.
         *
         * @param child a CAAT.Actor object instance.
         *
         * @return this
         */
		addChild : function(child) {
			child.parent= this;
			this.childrenList.push(child);

            return this;
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
            var i=0;
			for( i=0; i<this.childrenList.length; i++ ) {
				if ( this.childrenList[i]==child ) {
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
			if ( -1!=pos ) {
				this.childrenList.splice(pos,1);
			}

            return this;
		},
        /**
         * Private
         *
         * Gets the Actor inside this ActorContainer at a given Screen coordinate.
         *
         * @param point an object of the form { x: float, y: float }
         *
         * @return the Actor contained inside this ActorContainer if found, or the ActorContainer itself.
         */
		findActorAtPosition : function(point) {

			if( null==CAAT.ActorContainer.superclass.findActorAtPosition.call(this,point) ) {
				return null;
			}

			// z-order
			for( var i=this.childrenList.length-1; i>=0; i-- ) {
				var contained= this.childrenList[i].findActorAtPosition( this.rpoint );
				if ( null!=contained ) {
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
            for( var i=this.childrenList.length-1; i>=0; i-- ) {
                this.childrenList[i].destroy();
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
        /**
         * Returns the Actor at the iPosition(th) position.
         * @param iPosition an integer indicating the position array.
         * @return the CAAT.Actor object at position.
         */
        getChildAt : function( iPosition ) {
            return this.childrenList[ iPosition ];
        }
	});

})();


(function() {
	CAAT.SpriteActor = function() {
		CAAT.SpriteActor.superclass.constructor.call(this);
		return this;
	};

	extend( CAAT.SpriteActor, CAAT.Actor, {
		compoundbitmap:			null,   // CAAT.CompoundBitmap instance
		animationImageIndex:	null,   // an Array defining the sprite frame sequence
		prevAnimationTime:		-1,
		changeFPS:				1000,   // how much Scene time to take before changing an Sprite frame.
		transformation:			0,      // any of the TR_* constants.
		spriteIndex:			0,      // the current sprite frame

		TR_NONE:				0,      // constants used to determine how to draw the sprite image,
		TR_FLIP_HORIZONTAL:		1,
		TR_FLIP_VERTICAL:		2,
		TR_FLIP_ALL:			3,

        /**
         * Sets the Sprite image. The image will be trrated as an array of rows by columns subimages.
         *
         * @see CAAT.ConpoundImage
         * @param conpoundimage a CAAT.ConpoundImage object instance.
         * @return this
         */
		setSpriteImage : function(conpoundimage) {
			this.compoundbitmap= conpoundimage;
			this.width= conpoundimage.singleWidth;
			this.height= conpoundimage.singleHeight;
			if ( null==this.animationImageIndex ) {
				this.setAnimationImageIndex([0]);
			}

            return this;
		},
        /**
         * Set the elapsed time needed to change the image index.
         * @param fps an integer indicating the time in milliseconds to change.
         * @return this
         */
        setChangeFPS : function(fps) {
            this.changeFPS= fps;
            return this;
        },
        /**
         * Set the transformation to apply to the Sprite image.
         * Any value of
         *  <li>TR_NONE
         *  <li>TR_FLIP_HORIZONTAL
         *  <li>TR_FLIP_VERTICAL
         *  <li>TR_FLIP_ALL
         *
         * @param transformation an integer indicating one of the previous values.
         * @return this
         */
        setSpriteTransformation : function( transformation ) {
            this.transformation= transformation;
            return this;
        },
        /**
         * Set the sprite animation images index.
         *
         * @param aAnimationImageIndex an array indicating the Sprite's frames.
         */
		setAnimationImageIndex : function( aAnimationImageIndex ) {
			this.animationImageIndex= aAnimationImageIndex;
			this.spriteIndex= aAnimationImageIndex[0];

            return this;
		},
        /**
         * Customization of the default CAAT.Actor.animate method.
         *
         * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
         * @param time an integer indicating the Scene time when the bounding box is to be drawn.
         */
		animate : function( director, time )	{

			if ( this.compoundbitmap && this.animationImageIndex )	{

				if ( this.animationImageIndex.length>1 ) {
					if ( this.prevAnimationTime==-1 )	{
						this.prevAnimationTime= time;
					}
					else	{
						var ttime= time;
						ttime-= this.prevAnimationTime;
						ttime/= this.changeFPS;
						ttime%= this.animationImageIndex.length;
						this.spriteIndex= this.animationImageIndex[Math.floor(ttime)];
					}
				}

				CAAT.SpriteActor.superclass.animate.call(this, director, time);
			}
		},
        /**
         * Draws the sprite image calculated and stored in spriteIndex.
         *
         * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
         * @param time an integer indicating the Scene time when the bounding box is to be drawn.
         */
		paint : function(director, time) {

			var canvas= director.crc;

            // drawn at 0,0 because they're already affine-transformed.
			switch(this.transformation)	{
				case this.TR_FLIP_HORIZONTAL:
					this.compoundbitmap.paintInvertedH( canvas, this.spriteIndex, 0, 0);
					break;
				case this.TR_FLIP_VERTICAL:
					this.compoundbitmap.paintInvertedV( canvas, this.spriteIndex, 0, 0);
					break;
				case this.TR_FLIP_ALL:
					this.compoundbitmap.paintInvertedHV( canvas, this.spriteIndex, 0, 0);
					break;
				default:
					this.compoundbitmap.paint( canvas, this.spriteIndex, 0, 0);
			}

		}
	});
})();

/**
 * TextActor draws text on screen.
 */
(function() {
	CAAT.TextActor = function() {

		CAAT.TextActor.superclass.constructor.call(this);

		this.font= "10px sans-serif";
		this.textAlign= "left";
		this.textBaseline= "top";
		this.outlineColor= "black";
        this.clip= false;

		return this;
	};

	extend( CAAT.TextActor, CAAT.Actor, {
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

        setFill : function( fill ) {
            this.fill= fill;
            return this;
        },
        setOutline : function( outline ) {
            this.outline= outline;
            return this;
        },
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
        /**
         * Sets text alignment
         * @param align
         */
        setAlign : function( align ) {
            this.textAlign= align;
            return this;
        },
        setBaseline : function( baseline ) {
            this.textBaseline= baseline;
            return this;
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

            if ( this.text=="" || null==this.text ) {
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
            director.crc.save();
            director.crc.font= this.font;

            this.textWidth= director.crc.measureText( this.text ).width;
            if (this.width==0) {
                this.width= this.textWidth;
            }

            try {
                var pos= this.font.indexOf("px");
                var s =  this.font.substring(0, pos );
                this.textHeight= parseInt(s);
            } catch(e) {
                this.textHeight=20; // default height;
            }

            if ( this.height==0 ) {
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

			if ( null==this.text) {
				return;
			}

            if ( this.textWidth==0 || this.textHeight==0 ) {
                this.calcTextSize(director);
            }

			var canvas= director.crc;

			if( null!=this.font ) {
				canvas.font= this.font;
			}
			if ( null!=this.textAlign ) {
				canvas.textAlign= this.textAlign;
			}
			if ( null!=this.textBaseline ) {
				canvas.textBaseline= this.textBaseline;
			}
			if ( null!=this.fillStyle ) {
				canvas.fillStyle= this.fillStyle;
			}

			if (null==this.path) {

                var tx=0;
                if ( this.textAlign=='center') {
                    tx= this.width/2;
                } else if ( this.textAlign=='right' ) {
                    tx= this.width;
                }

				if ( this.fill ) {
					canvas.fillText( this.text, tx, 0 );
					if ( this.outline ) {

						// firefox necesita beginPath, si no, dibujara ademas el cuadrado del
						// contenedor de los textos.
						if ( null!=this.outlineColor ) {
							canvas.strokeStyle= this.outlineColor;
						}
						canvas.beginPath();
						canvas.strokeText( this.text, tx, 0 );
					}
				} else {
					if ( null!=this.outlineColor ) {
						canvas.strokeStyle= this.outlineColor;
					}
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

			var textWidth=this.sign * this.pathInterpolator.getPosition( (time%this.pathDuration)/this.pathDuration ).y * this.path.getLength() ;
			var p0= new CAAT.Point();
			var p1= new CAAT.Point();

			for( var i=0; i<this.text.length; i++ ) {
				var caracter= this.text[i].toString();
				var charWidth= canvas.measureText( caracter ).width;

				var pathLength= this.path.getLength();

				var currentCurveLength= charWidth/2 + textWidth;

				p0= this.path.getPositionFromLength(currentCurveLength).clone();
				p1= this.path.getPositionFromLength(currentCurveLength-.1).clone();

				var angle= Math.atan2( p0.y-p1.y, p0.x-p1.x );

				canvas.save();

					canvas.translate( p0.x, p0.y );
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
			this.setBounds(0,0,parent.width,parent.height);
			this.mouseEnabled= false;

            return this;
		}
	});
})();

(function() {
    CAAT.ShapeActor = function() {
        CAAT.ShapeActor.superclass.constructor.call(this);
        this.compositeOp= 'source-over';
        return this;
    };

    extend( CAAT.ShapeActor, CAAT.Actor, {

        shape:          0,      // shape type. One of the constant SHAPE_* values
        compositeOp:    null,   // a valid canvas rendering context string describing compositeOps.

        SHAPE_CIRCLE:   0,      // Constants to describe different shapes.
        SHAPE_RECTANGLE:1,

        /**
         * Sets shape type.
         * No check for parameter validity is performed.
         * @param iShape an integer with any of the SHAPE_* constants.
         * @return this
         */
        setShape : function(iShape) {
            this.shape= iShape;
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
            switch(this.shape) {
                case 0:
                    this.paintCircle(director,time);
                    break;
                case 1:
                    this.paintRectangle(director,time);
                    break;
            }
        },
        /**
         * Private
         * Draws a circle.
         * @param director a valid CAAT.Director instance.
         * @param time an integer with the Scene time the Actor is being drawn.
         */
        paintCircle : function(director,time) {
            var ctx= director.crc;

            ctx.globalCompositeOperation= this.compositeOp;
            if ( null!=this.fillStyle ) {
                ctx.fillStyle= this.fillStyle;
                ctx.beginPath();
                ctx.arc( this.width/2, this.height/2, Math.min(this.width,this.height)/2, 0, 2*Math.PI, false );
                ctx.fill();
            }
            
            if ( null!=this.strokeStyle ) {
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

            ctx.globalCompositeOperation= this.compositeOp;
            if ( null!=this.fillStyle ) {
                ctx.fillStyle= this.fillStyle;
                ctx.fillRect(0,0,this.width,this.height);
                ctx.fill();
            }

            if ( null!=this.strokeStyle ) {
                ctx.strokeStyle= this.strokeStyle;
                ctx.strokeRect(0,0,this.width,this.height);
                ctx.stroke();
            }
        }
    });
})();