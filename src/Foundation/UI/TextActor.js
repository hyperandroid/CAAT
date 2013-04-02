CAAT.Module( {

    /**
     * @name TextActor
     * @memberOf CAAT.Foundation.UI
     * @extends CAAT.Foundation.Actor
     * @constructor
     */

    defines : "CAAT.Foundation.UI.TextActor",
    aliases : ["CAAT.TextActor"],
    extendsClass : "CAAT.Foundation.Actor",
    constants : {
        TRAVERSE_PATH_FORWARD: 1,
        TRAVERSE_PATH_BACKWARD: -1
    },
    depends : [
        "CAAT.Foundation.Actor",
        "CAAT.Foundation.SpriteImage",
        "CAAT.Module.Font.Font",
        "CAAT.Math.Point",
        "CAAT.Behavior.Interpolator"
    ],
    extendsWith : {

        /**
         * @lends CAAT.Foundation.UI.TextActor.prototype
         */

        __init : function() {
            this.__super();
            this.font= "10px sans-serif";
            this.textAlign= "left";
            this.outlineColor= "black";
            this.clip= false;
            this.__calcFontData();

            return this;
        },

        /**
         * a valid canvas rendering context font description. Default font will be "10px sans-serif".
         */
		font:			    null,

        /**
         * Font info. Calculated in CAAT.
         */
        fontData:           null,

        /**
         * a valid canvas rendering context textAlign string. Any of:
         *   start, end, left, right, center.
         * defaults to "left".
         */
		textAlign:		    null,

        /**
         * a valid canvas rendering context textBaseLine string. Any of:
         *   top, hanging, middle, alphabetic, ideographic, bottom.
         * defaults to "top".
         */
		textBaseline:	    "top",

        /**
         * a boolean indicating whether the text should be filled.
         */
		fill:			    true,

        /**
         * text fill color
         */
        textFillStyle   :   '#eee',

        /**
         * a string with the text to draw.
         */
		text:			    null,

        /**
         * calculated text width in pixels.
         */
		textWidth:		    0,

        /**
         * calculated text height in pixels.
         */
        textHeight:         0,

        /**
         * a boolean indicating whether the text should be outlined. not all browsers support it.
         */
		outline:		    false,

        /**
         * a valid color description string.
         */
		outlineColor:	    null,

        /**
         * text's stroke line width.
         */
        lineWidth:          1,

        /**
         * a CAAT.PathUtil.Path which will be traversed by the text.
         */
		path:			    null,

        /**
         * A CAAT.Behavior.Interpolator to apply to the path traversal.
         */
        pathInterpolator:	null,

        /**
         * time to be taken to traverse the path. ms.
         */
        pathDuration:       10000,

        /**
         * traverse the path forward (1) or backwards (-1).
         */
		sign:			    1,      //

        lx:                 0,
        ly:                 0,

        /**
         * Set the text to be filled. The default Filling style will be set by calling setFillStyle method.
         * Default value is true.
         * @param fill {boolean} a boolean indicating whether the text will be filled.
         * @return this;
         */
        setFill : function( fill ) {
            this.stopCacheAsBitmap();
            this.fill= fill;
            return this;
        },
        setLineWidth : function( lw ) {
            this.stopCacheAsBitmap();
            this.lineWidth= lw;
            return this;
        },
        setTextFillStyle : function( style ) {
            this.stopCacheAsBitmap();
            this.textFillStyle= style;
            return this;
        },
        /**
         * Sets whether the text will be outlined.
         * @param outline {boolean} a boolean indicating whether the text will be outlined.
         * @return this;
         */
        setOutline : function( outline ) {
            this.stopCacheAsBitmap();
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
            this.stopCacheAsBitmap();
            this.outlineColor= color;
            return this;
        },
        /**
         * Set the text to be shown by the actor.
         * @param sText a string with the text to be shwon.
         * @return this
         */
		setText : function( sText ) {
            this.stopCacheAsBitmap();
			this.text= sText;
            if ( null===this.text || this.text==="" ) {
                this.width= this.height= 0;
            }
            this.calcTextSize( CAAT.currentDirector );

            this.invalidate();

            return this;
        },
        setTextAlign : function( align ) {
            this.textAlign= align;
            this.__setLocation();
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
            this.stopCacheAsBitmap();
            this.textBaseline= baseline;
            return this;

        },
        setBaseline : function( baseline ) {
            this.stopCacheAsBitmap();
            return this.setTextBaseline(baseline);
        },
        /**
         * Sets the font to be applied for the text.
         * @param font a string with a valid canvas rendering context font description.
         * @return this
         */
        setFont : function(font) {

            this.stopCacheAsBitmap();

            if ( !font ) {
                font= "10px sans-serif";
            }

            if ( font instanceof CAAT.Module.Font.Font ) {
                font.setAsSpriteImage();
            } else if (font instanceof CAAT.Foundation.SpriteImage ) {
                //CAAT.log("WARN: setFont will no more accept a CAAT.SpriteImage as argument.");
            }
            this.font= font;

            this.__calcFontData();
            this.calcTextSize( CAAT.director[0] );

            return this;
		},

        setLocation : function( x,y) {
            this.lx= x;
            this.ly= y;
            this.__setLocation();
            return this;
        },

        setPosition : function( x,y ) {
            this.lx= x;
            this.ly= y;
            this.__setLocation();
            return this;
        },

        setBounds : function( x,y,w,h ) {
            this.lx= x;
            this.ly= y;
            this.setSize(w,h);
            this.__setLocation();
            return this;
        },

        setSize : function( w, h ) {
            CAAT.Foundation.UI.TextActor.superclass.setSize.call(this,w,h);
            this.__setLocation();
            return this;
        },

        /**
         * @private
         */
        __setLocation : function() {

            var nx, ny;

            if ( this.textAlign==="center" ) {
                nx= this.lx - this.width/2;
            } else if ( this.textAlign==="right" || this.textAlign==="end" ) {
                nx= this.lx - this.width;
            } else {
                nx= this.lx;
            }

            if ( this.textBaseline==="bottom" ) {
                ny= this.ly - this.height;
            } else if ( this.textBaseline==="middle" ) {
                ny= this.ly - this.height/2;
            } else if ( this.textBaseline==="alphabetic" ) {
                ny= this.ly - this.fontData.ascent;
            } else {
                ny= this.ly;
            }

            CAAT.Foundation.UI.TextActor.superclass.setLocation.call( this, nx, ny );
        },

        centerAt : function(x,y) {
            this.textAlign="left";
            this.textBaseline="top";
            return CAAT.Foundation.UI.TextActor.superclass.centerAt.call( this, x, y );
        },

        /**
         * Calculates the text dimension in pixels and stores the values in textWidth and textHeight
         * attributes.
         * If Actor's width and height were not set, the Actor's dimension will be set to these values.
         * @param director a CAAT.Director instance.
         * @return this
         */
        calcTextSize : function(director) {

            if ( typeof this.text==='undefined' || null===this.text || ""===this.text ) {
                this.textWidth= 0;
                this.textHeight= 0;
                return this;
            }

            if ( director.glEnabled ) {
                return this;
            }

            if ( this.font instanceof CAAT.Foundation.SpriteImage ) {
                this.textWidth= this.font.stringWidth( this.text );
                this.textHeight=this.font.stringHeight();
                this.width= this.textWidth;
                this.height= this.textHeight;
                this.fontData= this.font.getFontData();
/*
                var as= (this.font.singleHeight *.8)>>0;
                this.fontData= {
                    height : this.font.singleHeight,
                    ascent : as,
                    descent: this.font.singleHeight - as
                };
*/
                return this;
            }

            if ( this.font instanceof CAAT.Module.Font.Font ) {
                this.textWidth= this.font.stringWidth( this.text );
                this.textHeight=this.font.stringHeight();
                this.width= this.textWidth;
                this.height= this.textHeight;
                this.fontData= this.font.getFontData();
                return this;
            }

            var ctx= director.ctx;

            ctx.save();
            ctx.font= this.font;

            this.textWidth= ctx.measureText( this.text ).width;
            if (this.width===0) {
                this.width= this.textWidth;
            }
/*
            var pos= this.font.indexOf("px");
            if (-1===pos) {
                pos= this.font.indexOf("pt");
            }
            if ( -1===pos ) {
                // no pt or px, so guess a size: 32. why not ?
                this.textHeight= 32;
            } else {
                var s =  this.font.substring(0, pos );
                this.textHeight= parseInt(s,10);
            }
*/

            this.textHeight= this.fontData.height;
            this.setSize( this.textWidth, this.textHeight );

            ctx.restore();

            return this;
        },

        __calcFontData : function() {
            this.fontData= CAAT.Module.Font.Font.getFontMetrics( this.font );
        },

        /**
         * Custom paint method for TextActor instances.
         * If the path attribute is set, the text will be drawn traversing the path.
         *
         * @param director a valid CAAT.Director instance.
         * @param time an integer with the Scene time the Actor is being drawn.
         */
		paint : function(director, time) {

            if (!this.text) {
                return;
            }

            CAAT.Foundation.UI.TextActor.superclass.paint.call(this, director, time );

            if ( this.cached ) {
                // cacheAsBitmap sets this actor's background image as a representation of itself.
                // So if after drawing the background it was cached, we're done.
                return;
            }

			if ( null===this.text) {
				return;
			}

            if ( this.textWidth===0 || this.textHeight===0 ) {
                this.calcTextSize(director);
            }

			var ctx= director.ctx;
			
			if ( this.font instanceof CAAT.Module.Font.Font || this.font instanceof CAAT.Foundation.SpriteImage ) {
				this.drawSpriteText(director,time);
                return;
			}

			if( null!==this.font ) {
				ctx.font= this.font;
			}

            /**
             * always draw text with middle or bottom, top is buggy in FF.
             * @type {String}
             */
            ctx.textBaseline="alphabetic";

			if (null===this.path) {

                if ( null!==this.textAlign ) {
                    ctx.textAlign= this.textAlign;
                }

                var tx=0;
                if ( this.textAlign==='center') {
                    tx= (this.width/2)|0;
                } else if ( this.textAlign==='right' ) {
                    tx= this.width;
                }

				if ( this.fill ) {
                    if ( null!==this.textFillStyle ) {
                        ctx.fillStyle= this.textFillStyle;
                    }
					ctx.fillText( this.text, tx, this.fontData.ascent  );
				}

                if ( this.outline ) {
                    if (null!==this.outlineColor ) {
                        ctx.strokeStyle= this.outlineColor;
                    }

                    ctx.lineWidth= this.lineWidth;
                    ctx.beginPath();
					ctx.strokeText( this.text, tx, this.fontData.ascent );
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

			var ctx= director.ctx;

            if ( this.fill && null!==this.textFillStyle ) {
                ctx.fillStyle= this.textFillStyle;
            }

            if ( this.outline && null!==this.outlineColor ) {
                ctx.strokeStyle= this.outlineColor;
            }

			var textWidth=this.sign * this.pathInterpolator.getPosition(
                    (time%this.pathDuration)/this.pathDuration ).y * this.path.getLength() ;
			var p0= new CAAT.Math.Point(0,0,0);
			var p1= new CAAT.Math.Point(0,0,0);

			for( var i=0; i<this.text.length; i++ ) {
				var caracter= this.text[i].toString();
				var charWidth= ctx.measureText( caracter ).width;

                // guonjien: remove "+charWidth/2" since it destroys the kerning. and he's right!!!. thanks.
				var currentCurveLength= textWidth;

				p0= this.path.getPositionFromLength(currentCurveLength).clone();
				p1= this.path.getPositionFromLength(currentCurveLength-0.1).clone();

				var angle= Math.atan2( p0.y-p1.y, p0.x-p1.x );

				ctx.save();

                    if ( CAAT.CLAMP ) {
					    ctx.translate( p0.x>>0, p0.y>>0 );
                    } else {
                        ctx.translate( p0.x, p0.y );
                    }
					ctx.rotate( angle );
                    if ( this.fill ) {
					    ctx.fillText(caracter,0,0);
                    }
                    if ( this.outline ) {
                        ctx.beginPath();
                        ctx.lineWidth= this.lineWidth;
                        ctx.strokeText(caracter,0,0);
                    }

				ctx.restore();

				textWidth+= charWidth;
			}
		},
		
		/**
         * Private.
         * Draw the text using a sprited font instead of a canvas font.
         * @param director a valid CAAT.Director instance.
         * @param time an integer with the Scene time the Actor is being drawn.
         */
		drawSpriteText: function(director, time) {
			if (null===this.path) {
				this.font.drawText( this.text, director.ctx, 0, 0);
			} else {
				this.drawSpriteTextOnPath(director, time);
			}
		},
		
		/**
         * Private.
         * Draw the text traversing a path using a sprited font.
         * @param director a valid CAAT.Director instance.
         * @param time an integer with the Scene time the Actor is being drawn.
         */
		drawSpriteTextOnPath: function(director, time) {
			var context= director.ctx;

			var textWidth=this.sign * this.pathInterpolator.getPosition(
                    (time%this.pathDuration)/this.pathDuration ).y * this.path.getLength() ;
			var p0= new CAAT.Math.Point(0,0,0);
			var p1= new CAAT.Math.Point(0,0,0);

			for( var i=0; i<this.text.length; i++ ) {
				var character= this.text[i].toString();
				var charWidth= this.font.stringWidth(character);

				//var pathLength= this.path.getLength();

				var currentCurveLength= charWidth/2 + textWidth;

				p0= this.path.getPositionFromLength(currentCurveLength).clone();
				p1= this.path.getPositionFromLength(currentCurveLength-0.1).clone();

				var angle= Math.atan2( p0.y-p1.y, p0.x-p1.x );

				context.save();

                if ( CAAT.CLAMP ) {
				    context.translate( p0.x|0, p0.y|0 );
                } else {
                    context.translate( p0.x, p0.y );
                }
				context.rotate( angle );
				
				var y = this.textBaseline === "bottom" ? 0 - this.font.getHeight() : 0;
				
				this.font.drawText(character, context, 0, y);

				context.restore();

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
            this.pathInterpolator= interpolator || new CAAT.Behavior.Interpolator().createLinearInterpolator();
            this.pathDuration= duration || 10000;

            /*
                parent could not be set by the time this method is called.
                so the actors bounds set is removed.
                the developer must ensure to call setbounds properly on actor.
             */
			this.mouseEnabled= false;

            return this;
		}
	}

});
