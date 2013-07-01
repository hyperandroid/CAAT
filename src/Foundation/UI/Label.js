CAAT.Module( {

    /**
     * @name Label
     * @memberOf CAAT.Foundation.UI
     * @extends CAAT.Foundation.Actor
     * @constructor
     */

    defines : "CAAT.Foundation.UI.Label",
    depends : [
        "CAAT.Foundation.Actor",
        "CAAT.Foundation.SpriteImage",
        "CAAT.Module.Font.Font",
        "CAAT.Foundation.UI.Layout.LayoutManager"
    ],
    aliases : ["CAAT.UI.Label"],
    extendsClass : "CAAT.Foundation.Actor",
    extendsWith : function() {

        var DEBUG=0;
        var JUSTIFY_RATIO= .6;

        /**
         *
         * Current applied rendering context information.
         */
        var renderContextStyle= function(ctx) {
            this.ctx= ctx;
            return this;
        };

        renderContextStyle.prototype= {

            ctx          : null,

            defaultFS    : null,
            font         : null,
            fontSize     : null,
            fill         : null,
            stroke       : null,
            filled       : null,
            stroked      : null,
            strokeSize   : null,
            italic       : null,
            bold         : null,
            alignment    : null,
            tabSize      : null,
            shadow       : null,
            shadowBlur   : null,
            shadowColor  : null,
            shadowOffsetX: null,
            shadowOffsetY: null,


            sfont        : null,

            chain        : null,

            setDefault : function( defaultStyles ) {
                this.defaultFS    =   24;
                this.font         =   "Arial";
                this.fontSize     =   this.defaultFS;
                this.fill         =   '#000';
                this.stroke       =   '#f00';
                this.filled       =   true;
                this.stroked      =   false;
                this.strokeSize   =   1;
                this.italic       =   false;
                this.bold         =   false;
                this.alignment    =   "left";
                this.tabSize      =   75;
                this.shadow       =   false;
                this.shadowBlur   =   0;
                this.shadowColor  =   "#000";
                this.shadowOffsetX=   0;
                this.shadowOffsetY=   0;


                for( var style in defaultStyles ) {
                    if ( defaultStyles.hasOwnProperty(style) ) {
                        this[style]= defaultStyles[style];
                    }
                }

                this.__setFont();

                return this;
            },

            setStyle : function( styles ) {
                if ( typeof styles!=="undefined" ) {
                    for( var style in styles ) {
                        this[style]= styles[style];
                    }
                }
                return this;
            },

            applyStyle : function() {
                this.__setFont();

                return this;
            },

            clone : function( ) {
                var c= new renderContextStyle( this.ctx );
                var pr;
                for( pr in this ) {
                    if ( this.hasOwnProperty(pr) ) {
                        c[pr]= this[pr];
                    }
                }
                /*
                c.defaultFS  =   this.defaultFS;
                c.font       =   this.font;
                c.fontSize   =   this.fontSize;
                c.fill       =   this.fill;
                c.stroke     =   this.stroke;
                c.filled     =   this.filled;
                c.stroked    =   this.stroked;
                c.strokeSize =   this.strokeSize;
                c.italic     =   this.italic;
                c.bold       =   this.bold;
                c.alignment  =   this.alignment;
                c.tabSize    =   this.tabSize;
                */

                var me= this;
                while( me.chain ) {
                    me= me.chain;
                    for( pr in me ) {
                        if ( c[pr]===null  && me.hasOwnProperty(pr) ) {
                            c[pr]= me[pr];
                        }
                    }
                }

                c.__setFont();

                return c;
            },

            __getProperty : function( prop ) {
                var me= this;
                var res;
                do {
                    res= me[prop];
                    if ( res!==null ) {
                        return res;
                    }
                    me= me.chain;
                } while( me );

                return null;
            },

            image : function( ctx ) {
                this.__setShadow( ctx );
            },

            text : function( ctx, text, x, y ) {

                this.__setShadow( ctx );

                ctx.font= this.__getProperty("sfont");

                if ( this.filled ) {
                    this.__fillText( ctx,text,x,y );
                }
                if ( this.stroked ) {
                    this.__strokeText( ctx,text,x,y );
                }
            },

            __setShadow : function( ctx ) {
                if ( this.__getProperty("shadow" ) ) {
                    ctx.shadowBlur   = this.__getProperty("shadowBlur");
                    ctx.shadowColor  = this.__getProperty("shadowColor");
                    ctx.shadowOffsetX= this.__getProperty("shadowOffsetX");
                    ctx.shadowOffsetY= this.__getProperty("shadowOffsetY");
                }
            },

            __fillText : function( ctx, text, x, y ) {
                ctx.fillStyle= this.__getProperty("fill");
                ctx.fillText( text, x, y );
            },

            __strokeText : function( ctx, text, x, y ) {
                ctx.strokeStyle= this.__getProperty("stroke");
                ctx.lineWidth= this.__getProperty("strokeSize");
                ctx.beginPath();
                ctx.strokeText( text, x, y );
            },

            __setFont : function() {
                var italic= this.__getProperty("italic");
                var bold= this.__getProperty("bold");
                var fontSize= this.__getProperty("fontSize");
                var font= this.__getProperty("font");

                this.sfont= (italic ? "italic " : "") +
                    (bold ? "bold " : "") +
                    fontSize + "px " +
                    font;

                this.ctx.font= this.__getProperty("sfont");
            },

            setBold : function( bool ) {
                if ( bool!=this.bold ) {
                    this.bold= bool;
                    this.__setFont();
                }
            },

            setItalic : function( bool ) {
                if ( bool!=this.italic ) {
                    this.italic= bool;
                    this.__setFont();
                }
            },

            setStroked : function( bool ) {
                this.stroked= bool;
            },

            setFilled : function( bool ) {
                this.filled= bool;
            },

            getTabPos : function( x ) {
                var ts= this.__getProperty("tabSize");
                return (((x/ts)>>0)+1)*ts;
            },

            setFillStyle : function( style ) {
                this.fill= style;
            },

            setStrokeStyle : function( style ) {
                this.stroke= style;
            },

            setStrokeSize : function( size ) {
                this.strokeSize= size;
            },

            setAlignment : function( alignment ) {
                this.alignment= alignment;
            },

            setFontSize : function( size ) {
                if ( size!==this.fontSize ) {
                    this.fontSize= size;
                    this.__setFont();
                }
            }
        };

        /**
         * This class keeps track of styles, images, and the current applied style.
         */
        var renderContext= function() {
            this.text= "";
            return this;
        };

        renderContext.prototype= {

            x           :   0,
            y           :   0,
            width       :   0,
            text        :   null,

            crcs        :   null,   // current rendering context style
            rcs         :   null,   // rendering content styles stack

            styles      :   null,
            images      :   null,

            lines       :   null,

            documentHeight  : 0,

            anchorStack     : null,

            __nextLine : function() {
                this.x= 0;
                this.currentLine= new DocumentLine(
                    CAAT.Module.Font.Font.getFontMetrics( this.crcs.sfont)  );
                this.lines.push( this.currentLine );
            },

            /**
             *
             * @param image {CAAT.SpriteImage}
             * @param r {number=}
             * @param c {number=}
             * @private
             */
            __image : function( image, r, c ) {


                var image_width;

                if ( typeof r!=="undefined" && typeof c!=="undefined" ) {
                    image_width= image.getWidth();
                } else {
                    image_width= ( image instanceof CAAT.Foundation.SpriteImage ) ? image.getWidth() : image.getWrappedImageWidth();
                }

                // la imagen cabe en este sitio.
                if ( this.width ) {
                    if ( image_width + this.x > this.width && this.x>0 ) {
                        this.__nextLine();
                    }
                }

                this.currentLine.addElementImage( new DocumentElementImage(
                    this.x,
                    image,
                    r,
                    c,
                    this.crcs.clone(),
                    this.__getCurrentAnchor() ) );

                this.x+= image_width;
            },

            __text : function() {

                if ( this.text.length===0 ) {
                    return;
                }

                var text_width= this.ctx.measureText(this.text).width;

                // la palabra cabe en este sitio.
                if ( this.width ) {
                    if ( text_width + this.x > this.width && this.x>0 ) {
                        this.__nextLine();
                    }
                }

                //this.crcs.text( this.text, this.x, this.y );
                this.currentLine.addElement( new DocumentElementText(
                    this.text,
                    this.x,
                    text_width,
                    0, //this.crcs.__getProperty("fontSize"), calculated later
                    this.crcs.clone(),
                    this.__getCurrentAnchor() ) ) ;

                this.x+= text_width;

                this.text="";
            },

            fchar : function( _char ) {

                if ( _char===' ' ) {

                    this.__text();

                    this.x+= this.ctx.measureText(_char).width;
                    if ( this.width ) {
                        if ( this.x > this.width ) {
                            this.__nextLine();
                        }
                    }
                } else {
                    this.text+= _char;
                }
            },

            end : function() {
                if ( this.text.length>0 ) {
                    this.__text();
                }

                var y=0;
                var lastLineEstimatedDescent= 0;
                for( var i=0; i<this.lines.length; i++ ) {
                    var inc= this.lines[i].getHeight();

                    if ( inc===0 ) {
                        // lineas vacias al menos tienen tamaño del estilo por defecto
                        inc= this.styles["default"].fontSize;
                    }
                    y+= inc;

                    /**
                     * add the estimated descent of the last text line to document height's.
                     * the descent is estimated to be a 20% of font's height.
                     */
                    if ( i===this.lines.length-1 ) {
                        lastLineEstimatedDescent= (inc*.25)>>0;
                    }

                    this.lines[i].setY(y);
                }

                this.documentHeight= y + lastLineEstimatedDescent;
            },

            getDocumentHeight : function() {
                return this.documentHeight;
            },

            __getCurrentAnchor : function() {
                if ( this.anchorStack.length ) {
                    return this.anchorStack[ this.anchorStack.length-1 ];
                }

                return null;
            },

            __resetAppliedStyles : function() {
                this.rcs= [];
                this.__pushDefaultStyles();
            },

            __pushDefaultStyles : function() {
                this.crcs= new renderContextStyle(this.ctx).setDefault( this.styles["default"] );
                this.rcs.push( this.crcs );
            },

            __pushStyle : function( style ) {
                var pcrcs= this.crcs;
                this.crcs= new renderContextStyle(this.ctx);
                this.crcs.chain= pcrcs;
                this.crcs.setStyle( style );
                this.crcs.applyStyle( );

                this.rcs.push( this.crcs );
            },

            __popStyle : function() {
                // make sure you don't remove default style.
                if ( this.rcs.length>1 ) {
                    this.rcs.pop();
                    this.crcs= this.rcs[ this.rcs.length-1 ];
                    this.crcs.applyStyle();
                }
            },

            __popAnchor : function() {
                if ( this.anchorStack.length> 0 ) {
                    this.anchorStack.pop();
                }
            },

            __pushAnchor : function( anchor ) {
                this.anchorStack.push( anchor );
            },

            start : function( ctx, styles, images, width ) {
                this.x=0;
                this.y=0;
                this.width= typeof width!=="undefined" ? width : 0;
                this.ctx= ctx;
                this.lines= [];
                this.styles= styles;
                this.images= images;
                this.anchorStack= [];

                this.__resetAppliedStyles();
                this.__nextLine();

            },

            setTag  : function( tag ) {

                var pairs, style;

                this.__text();

                tag= tag.toLowerCase();
                if ( tag==='b' ) {
                    this.crcs.setBold( true );
                } else if ( tag==='/b' ) {
                    this.crcs.setBold( false );
                } else if ( tag==='i' ) {
                    this.crcs.setItalic( true );
                } else if ( tag==='/i' ) {
                    this.crcs.setItalic( false );
                } else if ( tag==='stroked' ) {
                    this.crcs.setStroked( true );
                } else if ( tag==='/stroked' ) {
                    this.crcs.setStroked( false );
                } else if ( tag==='filled' ) {
                    this.crcs.setFilled( true );
                } else if ( tag==='/filled' ) {
                    this.crcs.setFilled( false );
                } else if ( tag==='tab' ) {
                    this.x= this.crcs.getTabPos( this.x );
                } else if ( tag==='br' ) {
                    this.__nextLine();
                } else if ( tag==='/a' ) {
                    this.__popAnchor();
                } else if ( tag==='/style' ) {
                    if ( this.rcs.length>1 ) {
                        this.__popStyle();
                    } else {
                        /**
                         * underflow pop de estilos. eres un cachondo.
                         */
                    }
                } else {
                    if ( tag.indexOf("fillcolor")===0 ) {
                        pairs= tag.split("=");
                        this.crcs.setFillStyle( pairs[1] );
                    } else if ( tag.indexOf("strokecolor")===0 ) {
                        pairs= tag.split("=");
                        this.crcs.setStrokeStyle( pairs[1] );
                    } else if ( tag.indexOf("strokesize")===0 ) {
                        pairs= tag.split("=");
                        this.crcs.setStrokeSize( pairs[1]|0 );
                    } else if ( tag.indexOf("fontsize")===0 ) {
                        pairs= tag.split("=");
                        this.crcs.setFontSize( pairs[1]|0 );
                    } else if ( tag.indexOf("style")===0 ) {
                        pairs= tag.split("=");
                        style= this.styles[ pairs[1] ];
                        if ( style ) {
                            this.__pushStyle( style );
                        }
                    } else if ( tag.indexOf("image")===0) {
                        pairs= tag.split("=")[1].split(",");
                        var image= pairs[0];
                        if ( this.images[image] ) {
                            var r= 0, c=0;
                            if ( pairs.length>=3 ) {
                                r= pairs[1]|0;
                                c= pairs[2]|0;
                            }
                            this.__image( this.images[image], r, c );
                        } else if (CAAT.currentDirector.getImage(image) ) {
                            this.__image( CAAT.currentDirector.getImage(image) );
                        }
                    } else if ( tag.indexOf("a=")===0 ) {
                        pairs= tag.split("=");
                        this.__pushAnchor( pairs[1] );
                    }
                }
            }
        };

        /**
         * Abstract document element.
         * The document contains a collection of DocumentElementText and DocumentElementImage.
         * @param anchor
         * @param style
         */
        var DocumentElement= function( anchor, style ) {
            this.link= anchor;
            this.style= style;
            return this;
        };

        DocumentElement.prototype= {
            x       : null,
            y       : null,
            width   : null,
            height  : null,

            style   : null,

            link    : null,

            isLink : function() {
                return this.link;
            },

            setLink : function( link ) {
                this.link= link;
                return this;
            },

            getLink : function() {
                return this.link;
            },

            contains : function(x,y) {
                return false;
            }

        };

        /**
         * This class represents an image in the document.
         * @param x
         * @param image
         * @param r
         * @param c
         * @param style
         * @param anchor
         */
        var DocumentElementImage= function( x, image, r, c, style, anchor ) {

            DocumentElementImage.superclass.constructor.call(this, anchor, style);

            this.x= x;
            this.image= image;
            this.row= r;
            this.column= c;
            this.width= image.getWidth();
            this.height= image.getHeight();

            if ( this.image instanceof CAAT.SpriteImage || this.image instanceof CAAT.Foundation.SpriteImage ) {

                if ( typeof r==="undefined" || typeof c==="undefined" ) {
                    this.spriteIndex= 0;
                } else {
                    this.spriteIndex= r*image.columns+c;
                }
                this.paint= this.paintSI;
            }

            return this;
        };

        DocumentElementImage.prototype= {
            image   : null,
            row     : null,
            column  : null,
            spriteIndex : null,

            paint : function( ctx ) {
                this.style.image( ctx );
                ctx.drawImage( this.image, this.x, -this.height+1);
                if ( DEBUG ) {
                    ctx.strokeRect( this.x, -this.height+1, this.width, this.height );
                }
            },

            paintSI : function( ctx ) {
                this.style.image( ctx );
                this.image.setSpriteIndex( this.spriteIndex );
                this.image.paint( { ctx: ctx }, 0, this.x,  -this.height+1 );
                if ( DEBUG ) {
                    ctx.strokeRect( this.x, -this.height+1, this.width, this.height );
                }
            },

            getHeight : function() {
                return this.image instanceof CAAT.Foundation.SpriteImage ? this.image.getHeight() : this.image.height;
            },

            getFontMetrics : function() {
                return null;
            },

            contains : function(x,y) {
                return x>=this.x && x<=this.x+this.width && y>=this.y && y<this.y + this.height;
            },

            setYPosition : function( baseline ) {
                this.y= baseline - this.height + 1;
            }

        };

        /**
         * This class represents a text in the document. The text will have applied the styles selected
         * when it was defined.
         * @param text
         * @param x
         * @param width
         * @param height
         * @param style
         * @param anchor
         */
        var DocumentElementText= function( text,x,width,height,style, anchor) {

            DocumentElementText.superclass.constructor.call(this, anchor, style);

            this.x=         x;
            this.y=         0;
            this.width=     width;
            this.text=      text;
            this.style=     style;
            this.fm=        CAAT.Module.Font.Font.getFontMetrics( style.sfont );
            this.height=    this.fm.height;

            return this;
        };

        DocumentElementText.prototype= {

            text    : null,
            style   : null,
            fm      : null,

            bl      : null,     // where baseline was set. current 0 in ctx.

            paint : function( ctx ) {
                this.style.text( ctx, this.text, this.x, 0 );
                if ( DEBUG ) {
                    ctx.strokeRect( this.x, -this.fm.ascent, this.width, this.height);
                }
            },

            getHeight : function() {
                return this.fm.height;
            },

            getFontMetrics : function() {
                return this.fm; //CAAT.Font.getFontMetrics( this.style.sfont);
            },

            contains : function( x, y ) {
                return x>= this.x && x<=this.x+this.width &&
                    y>= this.y && y<= this.y+this.height;
            },

            setYPosition : function( baseline ) {
                this.bl= baseline;
                this.y= baseline - this.fm.ascent;
            }
        };

        extend( DocumentElementImage, DocumentElement );
        extend( DocumentElementText, DocumentElement );

        /**
         * This class represents a document line.
         * It contains a collection of DocumentElement objects.
         */
        var DocumentLine= function( defaultFontMetrics ) {
            this.elements= [];
            this.defaultFontMetrics= defaultFontMetrics;
            return this;
        };

        DocumentLine.prototype= {
            elements    : null,
            width       : 0,
            height      : 0,
            defaultHeight : 0,  // default line height in case it is empty.
            y           : 0,
            x           : 0,
            alignment   : null,

            baselinePos : 0,

            addElement : function( element ) {
                this.width= Math.max( this.width, element.x + element.width );
                this.height= Math.max( this.height, element.height );
                this.elements.push( element );
                this.alignment= element.style.__getProperty("alignment");
            },

            addElementImage : function( element ) {
                this.width= Math.max( this.width, element.x + element.width );
                this.height= Math.max( this.height, element.height );
                this.elements.push( element );
            },

            getHeight : function() {
                return this.height;
            },

            setY : function( y ) {
                this.y= y;
            },

            getY : function() {
                return this.y;
            },

            paint : function( ctx ) {
                ctx.save();
                ctx.translate(this.x,this.y + this.baselinePos );

                for( var i=0; i<this.elements.length; i++ ) {
                    this.elements[i].paint(ctx);
                }

                ctx.restore();

            },

            setAlignment : function( width ) {
                var j;

                if ( this.alignment==="center" ) {
                    this.x= (width - this.width)/2;
                } else if ( this.alignment==="right" ) {
                    this.x= width - this.width;
                } else if ( this.alignment==="justify" ) {

                    // justify: only when text overflows further than document's 80% width
                    if ( this.width / width >= JUSTIFY_RATIO && this.elements.length>1 ) {
                        var remaining= width - this.width;

                        var forEachElement= (remaining/(this.elements.length-1))|0;
                        for( j=1; j<this.elements.length ; j++ ) {
                            this.elements[j].x+= j*forEachElement;
                        }

                        remaining= width - this.width - forEachElement*(this.elements.length-1);
                        for( j=0; j<remaining; j++ ) {
                            this.elements[this.elements.length-1-j].x+= remaining-j;
                        }
                    }
                }
            },

            adjustHeight : function() {
                var biggestFont=null;
                var biggestImage=null;
                var i;

                for( i=0; i<this.elements.length; i+=1 ) {
                    var elem= this.elements[i];

                    var fm= elem.getFontMetrics();
                    if ( null!=fm ) {           // gest a fontMetrics, is a DocumentElementText (text)
                        if ( !biggestFont ) {
                            biggestFont= fm;
                        } else {
                            if ( fm.ascent > biggestFont.ascent ) {
                                biggestFont= fm;
                            }
                        }
                    } else {                    // no FontMetrics, it is an image.
                        if (!biggestImage) {
                            biggestImage= elem;
                        } else {
                            if ( elem.getHeight() > elem.getHeight() ) {
                                biggestImage= elem;
                            }
                        }
                    }
                }

                this.baselinePos= Math.max(
                    biggestFont ? biggestFont.ascent : this.defaultFontMetrics.ascent,
                    biggestImage ? biggestImage.getHeight() : this.defaultFontMetrics.ascent );
                this.height= this.baselinePos + (biggestFont!=null ? biggestFont.descent : this.defaultFontMetrics.descent );

                for( i=0; i<this.elements.length; i++ ) {
                    this.elements[i].setYPosition( this.baselinePos );
                }

                return this.height;
            },

            /**
             * Every element is positioned at line's baseline.
             * @param x
             * @param y
             * @private
             */
            __getElementAt : function( x, y ) {
                for( var i=0; i<this.elements.length; i++ ) {
                    var elem= this.elements[i];
                    if ( elem.contains(x,y) ) {
                        return elem;
                    }
                }

                return null;
            }
        };

        return {

            /**
             * @lends CAAT.Foundation.UI.Label.prototype
             */


            __init : function() {
                this.__super();

                this.rc= new renderContext();
                this.lines= [];
                this.styles= {};
                this.images= {};

                return this;
            },

            /**
             * This Label document´s horizontal alignment.
             * @type {CAAT.Foundation.UI.Layout.LayoutManager}
             * @private
             */
            halignment  :   CAAT.Foundation.UI.Layout.LayoutManager.ALIGNMENT.LEFT,

            /**
             * This Label document´s vertical alignment.
             * @type {CAAT.Foundation.UI.Layout.LayoutManager}
             * @private
             */
            valignment  :   CAAT.Foundation.UI.Layout.LayoutManager.ALIGNMENT.TOP,

            /**
             * This label text.
             * @type {string}
             * @private
             */
            text        :   null,

            /**
             * This label document´s render context
             * @type {RenderContext}
             * @private
             */
            rc          :   null,

            /**
             * Styles object.
             * @private
             */
            styles      :   null,

            /**
             * Calculated document width.
             * @private
             */
            documentWidth   : 0,

            /**
             * Calculated document Height.
             * @private
             */
            documentHeight  : 0,

            /**
             * Document x position.
             * @private
             */
            documentX       : 0,

            /**
             * Document y position.
             * @private
             */
            documentY       : 0,

            /**
             * Does this label document flow ?
             * @private
             */
            reflow      :   true,

            /**
             * Collection of text lines calculated for the label.
             * @private
             */
            lines       :   null,   // calculated elements lines...

            /**
             * Collection of image objects in this label´s document.
             * @private
             */
            images      :   null,

            /**
             * Registered callback to notify on anchor click event.
             * @private
             */
            clickCallback   : null,

            matchTextSize : true,

            /**
             * Make the label actor the size the label document has been calculated for.
             * @param match {boolean}
             */
            setMatchTextSize : function( match ) {
                this.matchTextSize= match;
                if ( match ) {
                    this.width= this.preferredSize.width;
                    this.height= this.preferredSize.height;
                }
            },

            setStyle : function( name, styleData ) {
                this.styles[ name ]= styleData;
                return this;
            },

            addImage : function( name, spriteImage ) {
                this.images[ name ]= spriteImage;
                return this;
            },

            setSize : function(w,h) {
                CAAT.Foundation.UI.Label.superclass.setSize.call( this, w, h );
                this.setText( this.text, this.width );
                return this;
            },

            setBounds : function( x,y,w,h ) {
                CAAT.Foundation.UI.Label.superclass.setBounds.call( this,x,y,w,h );
                this.setText( this.text, this.width );
                return this;
            },

            setText : function( _text, width ) {

                if ( null===_text ) {
                   return;
                }

                var cached= this.cached;
                if ( cached ) {
                    this.stopCacheAsBitmap();
                }

                this.documentWidth= 0;
                this.documentHeight= 0;

                this.text= _text;

                var i, l, text;
                var tag_closes_at_pos, tag;
                var _char;
                var ctx= CAAT.currentDirector.ctx;
                ctx.save();

                text= this.text;

                i=0;
                l=text.length;

                this.rc.start( ctx, this.styles, this.images, width );

                while( i<l ) {
                    _char= text.charAt(i);

                    if ( _char==='\\' ) {
                        i+=1;
                        this.rc.fchar( text.charAt(i) );
                        i+=1;

                    } else if ( _char==='<' ) {   // try an enhancement.

                        // try finding another '>' and see whether it matches a tag
                        tag_closes_at_pos= text.indexOf('>', i+1);
                        if ( -1!==tag_closes_at_pos ) {
                            tag= text.substr( i+1, tag_closes_at_pos-i-1 );
                            if ( tag.indexOf("<")!==-1 ) {
                                this.rc.fchar( _char );
                                i+=1;
                            } else {
                                this.rc.setTag( tag );
                                i= tag_closes_at_pos+1;
                            }
                        }
                    } else {
                        this.rc.fchar( _char );
                        i+= 1;
                    }
                }

                this.rc.end();
                this.lines= this.rc.lines;

                this.__calculateDocumentDimension( typeof width==="undefined" ? 0 : width );
                this.setLinesAlignment();

                ctx.restore();

                this.setPreferredSize( this.documentWidth, this.documentHeight );
                this.invalidateLayout();

                this.setDocumentPosition();

                if ( cached ) {
                    this.cacheAsBitmap(0,cached);
                }

                if ( this.matchTextSize ) {
                    this.width= this.preferredSize.width;
                    this.height= this.preferredSize.height;
                }

                return this;
            },

            setVerticalAlignment : function( align ) {
                this.valignment= align;
                this.setDocumentPosition();
                return this;
            },

            setHorizontalAlignment : function( align ) {
                this.halignment= align;
                this.setDocumentPosition();
                return this;
            },

            setDocumentPosition : function( halign, valign ) {

                if ( typeof halign!=="undefined" ) {
                    this.setHorizontalAlignment(halign);
                }
                if ( typeof valign!=="undefined" ) {
                    this.setVerticalAlignment(valign);
                }

                var xo=0, yo=0;

                if ( this.valignment===CAAT.Foundation.UI.Layout.LayoutManager.ALIGNMENT.CENTER ) {
                    yo= (this.height - this.documentHeight )/2;
                } else if ( this.valignment===CAAT.Foundation.UI.Layout.LayoutManager.ALIGNMENT.BOTTOM ) {
                    yo= this.height - this.documentHeight;
                }

                if ( this.halignment===CAAT.Foundation.UI.Layout.LayoutManager.ALIGNMENT.CENTER ) {
                    xo= (this.width - this.documentWidth )/2;
                } else if ( this.halignment===CAAT.Foundation.UI.Layout.LayoutManager.ALIGNMENT.RIGHT ) {
                    xo= this.width - this.documentWidth;
                }

                this.documentX= xo;
                this.documentY= yo;
            },

            __calculateDocumentDimension : function( suggestedWidth ) {
                var i;
                var y= 0;

                this.documentWidth= 0;
                this.documentHeight= 0;
                for( i=0; i<this.lines.length; i++ ) {
                    this.lines[i].y =y;
                    this.documentWidth= Math.max( this.documentWidth, this.lines[i].width );
                    this.documentHeight+= this.lines[i].adjustHeight();
                    y+= this.lines[i].getHeight();
                }

                this.documentWidth= Math.max( this.documentWidth, suggestedWidth );

                return this;
            },

            setLinesAlignment : function() {

                for( var i=0; i<this.lines.length; i++ ) {
                    this.lines[i].setAlignment( this.documentWidth )
                }
            },

            paint : function( director, time ) {

                if ( this.cached===CAAT.Foundation.Actor.CACHE_NONE ) {
                    var ctx= director.ctx;

                    ctx.save();

                    ctx.textBaseline="alphabetic";
                    ctx.translate( this.documentX, this.documentY );

                    for( var i=0; i<this.lines.length; i++ ) {
                        var line= this.lines[i];
                        line.paint( director.ctx );

                        if ( DEBUG ) {
                            ctx.strokeRect( line.x, line.y, line.width, line.height );
                        }
                    }

                    ctx.restore();
                } else {
                    if ( this.backgroundImage ) {
                        this.backgroundImage.paint(director,time,0,0);
                    }
                }
            },

            __getDocumentElementAt : function( x, y ) {

                x-= this.documentX;
                y-= this.documentY;

                for( var i=0; i<this.lines.length; i++ ) {
                    var line= this.lines[i];

                    if ( line.x<=x && line.y<=y && line.x+line.width>=x && line.y+line.height>=y ) {
                        return line.__getElementAt( x - line.x, y - line.y );
                    }
                }

                return null;
            },

            mouseExit : function(e) {
                CAAT.setCursor( "default");
            },

            mouseMove : function(e) {
                var elem= this.__getDocumentElementAt(e.x, e.y);
                if ( elem && elem.getLink() ) {
                    CAAT.setCursor( "pointer");
                } else {
                    CAAT.setCursor( "default");
                }
            },

            mouseClick : function(e) {
                if ( this.clickCallback ) {
                    var elem= this.__getDocumentElementAt(e.x, e.y);
                    if ( elem.getLink() ) {
                        this.clickCallback( elem.getLink() );
                    }
                }
            },

            setClickCallback : function( callback ) {
                this.clickCallback= callback;
                return this;
            }
        }

    }

});
