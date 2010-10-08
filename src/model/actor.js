/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * Classes to define animable elements.
 * Actor is the superclass of every animable element in the scene graph. It handles the whole
 * affine transformation MatrixStack, rotation, translation, globalAlpha and Behaviours. It also
 * defines input methods.
 * TODO: method to handle keyboard.
 *
 * ActorContainer is the superclass of every Actor which can contain other Actors. It handles
 * clipping, and children rendering.
 *
 * SpriteActor is the superclass for sprites. It handles image sequences and sprite image switching
 *
 * TextActor is an actor to show text in the scene graph.
 * TODO: add text presentation/animation effects.
 *
 * 20101008 Hyperandroid.
 *  + TextActor computes right its dimension.
 *  + Clipping will be disabled by default until IE9 fixes.
 *  + The TextActor.setPath has been upgraded to accept interpolator and path duration.
 *
 *
 **/


(function() {
	CAAT.Actor = function() {
		this.transformationMatrix= new CAAT.MatrixStack();
		this.rpoint= new CAAT.Point();
		this.behaviourList= [];
		return this;
	};
	
	CAAT.Actor.prototype= {
		behaviourList: 			null,
		parent:					null,
		x:						0,
		y:						0,
		width:					0,
		height:					0,
		start_time:				0,
		duration:				Number.MAX_VALUE,
		
		transformationMatrix:	null,
		
		rpoint:					null,
		
		// clip el area del componente.
		clip:					false,
    
		scaleX:					0, 
		scaleY:					0,
		scaleTX:				0, 
		scaleTY:				0,
		scaleAnchor:			0,
		rotationAngle:			0, 
		rotationX:				0, 
		rotationY:				0,
		alpha:					1,
		
		expired:				false,
		discardable:			false,
		selected:				false,
		pointed:				false,
		mouseEnabled:			true,

		ANCHOR_CENTER:			0,
		ANCHOR_TOP:				1,
		ANCHOR_BOTTOM:			2,
		ANCHOR_LEFT:			3,
		ANCHOR_RIGHT:			4,
		ANCHOR_TOP_LEFT:		5,
		ANCHOR_TOP_RIGHT:		6,
		ANCHOR_BOTTOM_LEFT:		7,
		ANCHOR_BOTTOM_RIGHT:	8,		
		
		fillStyle:				null,

        time:                   0,

		animate : function(director, time) {

            this.time= time;

			for( var i=0; i<this.behaviourList.length; i++ )	{
				this.behaviourList[i].apply(time,this);
			}
		
			var canvas= director.crc;
			
			canvas.save();
				canvas.globalAlpha*= this.alpha;
				this.prepareGraphics(canvas);

                if ( this.clip ) {
                    canvas.beginPath();
                    canvas.rect(0,0,this.width,this.height);
                    canvas.clip();
                }

				this.paint(director, time);
			canvas.restore();
		},
        setExpired : function(expired) {
            if ( expired ) {
                this.expired= true;
                this.duration= 0;
                this.start_time=-1;
            }
        },
		emptyBehaviourList : function() {
			this.behaviourList=[];
		},
		prepareGraphics : function(canvas) {
			this.transformationMatrix.prepareGraphics(canvas,this);
		},
		setPaint : function( paint )	{
			this.fillStyle= paint;
		},
		setAlpha : function( alpha )	{
			this.alpha= alpha;
		},
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
		},
		setFrameTime : function( startTime, duration ) {
			this.start_time= startTime;
			this.duration= duration;
			this.expired= false;
		},
		paint : function(director, time) {
			
			var canvas= director.crc;
			
			if ( null!=this.parent && null!=this.fillStyle ) {
				canvas.fillStyle= this.pointed ? 'orange' : (this.fillStyle!=null ? this.fillStyle : 'white'); //'white';
				canvas.fillRect(0,0,this.width,this.height );
			}
			
//			canvas.strokeStyle= this.pointed ? 'red' : 'black';
//			canvas.strokeRect(0,0,this.width,this.height );

		},
		setScale : function( sx, sy )    {
			this.setScaleAnchored( sx, sy, this.ANCHOR_CENTER );
		},
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
		setScaleAnchored : function( sx, sy, anchor )    {
			this.scaleAnchor= anchor;
        
			var obj= this.getAnchor( this.scaleAnchor );
			
			this.scaleTX= obj.x;
			this.scaleTY= obj.y;
	        
			this.scaleX=sx;
			this.scaleY=sy;
		},
	    setRotation : function( angle )	{
			this.setRotationAnchored( angle, this.width/2, this.height/2 );
	    },
	    setRotationAnchored : function( angle, rx, ry ) {
	    	this.rotationAngle= angle;
	    	this.rotationX= rx?rx:0;
	    	this.rotationY= ry?ry:0;
	    },
	    setSize : function( w, h )   {
	    	this.width= w;
	    	this.height= h;
	    },
	    setBounds : function(x, y, w, h)  {
	    	this.x= x;
	    	this.y= y;
	    	this.width= w;
	    	this.height= h;
	    },
	    setLocation : function( x, y ) {
	        this.x= x;
	        this.y= y;
	    },
	    isInAnimationFrame : function(time)    {
	    	if ( this.duration==Number.MAX_VALUE ) {
	    		return this.start_time<=time;
	    	}
	    	return this.start_time<=time && time<this.start_time+this.duration;
	    },
	    hasListener : function()	{
	    	return true;
	    },
	    contains : function(x, y) {
//	    	if (!this.isInAnimationFrame(0))    {    	
//	            return false;
//	        }
	
	        return x>=0 && y>=0 && x<this.width && y<this.height;
	    },    
		create : function()	{
	    	this.scaleAnchor= this.ANCHOR_CENTER;
	    	this.rotateAnchor= this.ANCHOR_CENTER;
	    	this.setScale(1,1);
	    	this.setRotation(0);
	        this.behaviourList= [];
		},
		addBehaviour : function( behaviour )	{
			this.behaviourList.push(behaviour);
		},
		initialize : function()	{
		},
		destroy : function()	{
		},
		inverseTransformCoord : function(point) {
			var tthis= this;
			while( tthis) {
				tthis.transformationMatrix.inverseTransformCoord(point);
				tthis= tthis.parent;
			}
			
			return point;
		},
	    findActorAtPosition : function(point) {
			if ( !this.mouseEnabled ) {
				return null;
			}
			
			this.rpoint.set( point.x, point.y );
	    	this.transformationMatrix.inverseTransformCoord(this.rpoint);
	    	return this.contains(this.rpoint.x, this.rpoint.y) ? this :null;
	    },
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
	    },
	    mouseClick : function(mouseEvent) {
	    },
	    mouseDblClick : function(mouseEvent) {
	    },
		mouseEnter : function(mouseEvent) {
	    	this.pointed= true;
		},
		mouseExit : function(mouseEvent) {
			this.pointed= false;
		},
		mouseMove : function(mouseEvent) {
		},
		mouseDown : function(mouseEvent) {
		},
		mouseUp : function(mouseEvent) {
		},
		mouseDrag : function(mouseEvent) {
		}
	};
	
})();


(function() {
	CAAT.ActorContainer= function() {
		CAAT.ActorContainer.superclass.constructor.call(this);
		this.childList= [];
		return this;
	};
	
	
	extend( CAAT.ActorContainer, CAAT.Actor, {
		
		animate : function(director,time) {

            var i;
			for( i=0; i<this.behaviourList.length; i++ )	{
				this.behaviourList[i].apply(time,this);
			}
		
			var canvas= director.crc;
			
			canvas.globalAlpha*= this.alpha;			
			this.prepareGraphics(canvas);
			this.paint(director, time);
			
			if ( this.clip ) {
				canvas.beginPath();
				canvas.rect(0,0,this.width,this.height);
				canvas.clip();
			}
	
            for( i=0; i<this.childList.length; i++ ) {
                if (this.childList[i].isInAnimationFrame(time)) {
                    canvas.save();
                    this.childList[i].animate(director, time);
                    canvas.restore();
                }
            }

            // remove expired and discardable elements.
            for( i=this.childList.length-1; i>=0; i-- ) {
                if ( this.childList[i].expired && this.childList[i].discardable ) {
                    this.childList.splice(i,1);
                }
            }
		},
		addChild : function(child) {
			child.parent= this;
			this.childList.push(child);
		},
		findChild : function(child) {
			for( var i in this.childList ) {
				if ( this.childList[i]==child ) {
					return i;
				}
			}
			return -1;
		},
		removeChild : function(child) {
			var pos= this.findChild(child);
			if ( -1!=pos ) {
				this.childList.splice(pos,1);
			}
		},
		findActorAtPosition : function(point) {

			if( null==CAAT.ActorContainer.superclass.findActorAtPosition.call(this,point) ) {
				return null;
			}
			
			// z-order
			for( var i=this.childList.length-1; i>=0; i-- ) {
				var contained= this.childList[i].findActorAtPosition( this.rpoint );
				if ( null!=contained ) {
					return contained;
				}
			}
			
			return this;
		}
	});
	
})();

(function() {
	CAAT.SpriteActor = function() {
		CAAT.SpriteActor.superclass.constructor.call(this);
		return this;
	};
	
	extend( CAAT.SpriteActor, CAAT.Actor, {
		conpoundbitmap:			null,
		animationImageIndex:	null,
		prevAnimationTime:		-1,
		changeFPS:				1000,
		transformation:			0,
		spriteIndex:			0,
		
		TR_NONE:				0,
		TR_FLIP_HORIZONTAL:		1,
		TR_FLIP_VERTICAL:		2,
		TR_FLIP_ALL:			3,		
		
		prevX:					-1,
		prevY:					-1,
		
		setSpriteImage : function(conpoundimage) {
			this.conpoundbitmap= conpoundimage;
			this.width= conpoundimage.singleWidth;
			this.height= conpoundimage.singleHeight;
			if ( null==this.animationImageIndex ) {
				this.setAnimationImageIndex([0]);
			}
		},
		setAnimationImageIndex : function( aAnimationImageIndex ) {
			this.animationImageIndex= aAnimationImageIndex;
			this.spriteIndex= aAnimationImageIndex[0];
		},
		animate : function( director, time )	{
			
			if ( this.conpoundbitmap && this.animationImageIndex )	{
				
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
		paint : function(director, time) {
			
			var canvas= director.crc;

            // drawn at 0,0 because they're already affine-transformed.
			switch(this.transformation)	{
				case this.TR_FLIP_HORIZONTAL:
					this.conpoundbitmap.paintInvertedH( canvas, this.spriteIndex, 0, 0);
					break;
				case this.TR_FLIP_VERTICAL:
					this.conpoundbitmap.paintInvertedV( canvas, this.spriteIndex, 0, 0);
					break;
				case this.TR_FLIP_ALL:
					this.conpoundbitmap.paintInvertedHV( canvas, this.spriteIndex, 0, 0);
					break;
				default:
					this.conpoundbitmap.paint( canvas, this.spriteIndex, 0, 0);
			}

		}
	});
})();

/**
 * TextActor draws text on screen.
 * TODO: on setText, calculate proper actor size.
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
		font:			null,
		textAlign:		null,	// start, end, left, right, center
		textBaseline:	null,	// top, hanging, middle, alphabetic, ideographic, bottom
		fill:			true,
		text:			null,
		maxWidth:		null,
		outline:		false,
		outlineColor:	null,
		
		path:			null,
        pathInterpolator:	null,
        pathDuration:       10000,
		sign:			1,
		
		setText : function( sText ) {
			this.text= sText;
            this.setFont( this.font );
        },
        setFont : function(font) {

            if ( !font ) {
                return;
            }

            this.font= font;

            if ( this.text=="" ) {
                this.width= this.height= 0;
                return;
            }

            CAAT.director.crc.save();
            CAAT.director.crc.font= this.font;

            this.width= CAAT.director.crc.measureText( this.text ).width;

            try {
                var pos= this.font.indexOf("px");
                var s =  this.font.substring(0, pos );
                this.height= parseInt(s);
            } catch(e) {
                this.height=20; // default height;
            }

            CAAT.director.crc.restore();
		},
		paint : function(director, time) {
		
			if ( null==this.text) {
				return;
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
				if ( this.fill ) {
					canvas.fillText( this.text, 0, 0 );
					if ( this.outline ) {
						
						// firefox necesita beginPath, si no, dibujara ademas el cuadrado del
						// contenedor de los textos.
						if ( null!=this.outlineColor ) {
							canvas.strokeStyle= this.outlineColor;
						}
						canvas.beginPath();
						canvas.strokeText( this.text, 0, 0 );
					}
				} else {
					if ( null!=this.outlineColor ) {
						canvas.strokeStyle= this.outlineColor;
					}
					canvas.strokeText( this.text, 0, 0 );
				}
			}
			else {
				this.drawOnPath(director,time);
			}
		},
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
					canvas.fillText(caracter,0,0);

				canvas.restore();
				
				textWidth+= charWidth;
			}
		},
		setPath : function( path, interpolator, duration ) {
			this.path= path;
            this.pathInterpolator= interpolator || new CAAT.Interpolator.createLinearInterpolator();
            this.pathDuration= duration || 10000;
			this.setBounds(0,0,parent.width,parent.height);
			this.mouseEnabled= false;
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

        shape:          0,
        fillStyle:      null,
        strokeStyle:    null,
        compositeOp:    null,

        paint : function(director,time) {
            var canvas= director.crc;

            if ( null!=this.fillStyle ) {
                canvas.fillStyle= this.fillStyle;
            }
            canvas.globalCompositeOperation= this.compositeOp;
            canvas.beginPath();
            canvas.arc( 0,0, Math.min(this.width,this.height)/2, 0, 2*Math.PI, false );
            canvas.fill();

            if ( null!=this.strokeStyle ) {
                canvas.strokeStyle= this.strokeStyle;
                canvas.beginPath();
                canvas.arc( this.width/2, this.height/2, Math.min(this.width,this.height)/2, 0, 2*Math.PI, false );
                canvas.stroke();
            }
        }

    });
})();