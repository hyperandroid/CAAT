(function() {

    var JUSTIFY_RATIO= .8;

    var renderContextStyle= function(ctx) {
        this.ctx= ctx;
        return this;
    };

    renderContextStyle.prototype= {

        ctx         : null,

        defaultFS   : null,
        font        : null,
        fontSize    : null,
        fill        : null,
        stroke      : null,
        filled      : null,
        stroked     : null,
        strokeSize  : null,
        italic      : null,
        bold        : null,
        alignment   : null,
        tabSize     : null,

        sfont       : null,

        chain       : null,

        setDefault : function( defaultStyles ) {
            this.defaultFS  =   24;
            this.font       =   "Arial";
            this.fontSize   =   this.defaultFS;
            this.fill       =   '#000';
            this.stroke     =   '#f00';
            this.filled     =   true;
            this.stroked    =   false;
            this.strokeSize =   1;
            this.italic     =   false;
            this.bold       =   false;
            this.alignment  =   "left";
            this.tabSize    =   75;

            for( var style in defaultStyles ) {
                this[style]= defaultStyles[style];
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

            var me= this;
            while( me.chain ) {
                me= me.chain;
                for( var pr in me ) {
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

        text : function( ctx, text, x, y ) {
            ctx.font= this.__getProperty("sfont");

            if ( this.filled ) {
                this.fillText( ctx,text,x,y );
            }
            if ( this.stroked ) {
                this.strokeText( ctx,text,x,y );
            }
        },

        fillText : function( ctx, text, x, y ) {
            ctx.fillStyle= this.__getProperty("fill");
            ctx.fillText( text, x, y );
        },

        strokeText : function( ctx, text, x, y ) {
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

        __nextLine : function() {
            this.x= 0;
            this.currentLine= new DocumentLine();
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

            if ( r && c ) {
                image_width= image.singleWidth;
            } else {
                image_width= image.image.width;
            }

            // la imagen cabe en este sitio.
            if ( this.width ) {
                if ( image_width + this.x > this.width && this.x>0 ) {
                    this.__nextLine();
                }
            }

            this.currentLine.addElementImage( new DocumentElementImage( this.x, this.images[image], r, c ) );

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
            this.currentLine.addElement( new DocumentElement(
                this.text,
                this.x,
                0,
                text_width,
                this.crcs.__getProperty("fontSize"),
                this.crcs.clone() ) ) ;

            this.x+= text_width;

            this.text="";
        },

        char : function( char ) {

            if ( char===' ' ) {

                this.__text();

                this.x+= this.ctx.measureText(char).width;
                if ( this.width ) {
                    if ( this.x > this.width ) {
                        this.__nextLine();
                    }
                }
            } else {
                this.text+= char;
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

        start : function( ctx, styles, images, width ) {
            this.x=0;
            this.y=0;
            this.width= typeof width!=="undefined" ? width : 0;
            this.ctx= ctx;
            this.lines= [ ];
            this.styles= styles;
            this.images= images;

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
                        this.__image( image, r, c );
                    }
                }
            }
        }
    };

    var DocumentElementImage= function( x, image, r, c ) {
        this.x= x;
        this.image= image;
        this.row= r;
        this.column= c;

        if ( this.image instanceof CAAT.SpriteImage ) {
            this.paint= this.paintSI;
            this.image.setAnimationImageIndex([r*image.columns+c]);
        }

        return this;
    };

    DocumentElementImage.prototype= {
        x       : null,
        image   : null,
        row     : null,
        column  : null,

        paint : function( ctx ) {
            ctx.drawImage( this.image, this.x, this.y );
        },

        paintSI : function( ctx ) {
            this.image.paint( { ctx: ctx }, 0, this.x, this. y );
        },

        getHeight : function() {
            return this.image instanceof CAAT.SpriteImage ? this.image.singleHeight : this.image.height;
        }
    };

    var DocumentElement= function( text,x,y,width,height,style) {

        this.x=         x;
        this.y=         y;
        this.width=     width;
        this.height=    height;
        this.text=      text;
        this.style=     style;

        return this;
    };

    DocumentElement.prototype= {

        x       : null,
        y       : null,
        text    : null,
        style   : null,
        width   : 0,
        height  : 0,

        paint : function( ctx ) {
            this.style.text( ctx, this.text, this.x, this.y );
        },

        getHeight : function() {
            return this.style.fontSize;
        }
    };

    var DocumentLine= function() {
        this.elements= [];
        return this;
    }

    DocumentLine.prototype= {
        elements    : null,
        width       : 0,
        height      : 0,
        y           : 0,
        x           : 0,
        alignment   : null,

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
            var inc= 0;

            for( var i=0; i<this.elements.length; i++ ) {
                inc= Math.max( this.elements[i].getHeight(), inc );
            }
            return inc;
        },

        setY : function( y ) {
            this.y= y;
        },

        getY : function() {
            return this.y;
        },

        paint : function( ctx ) {
            ctx.save();
            ctx.translate(this.x,this.y);

            for( var i=0; i<this.elements.length; i++ ) {
                this.elements[i].paint(ctx);
            }

            ctx.restore();

        },

        setAlignment : function( width ) {
            if ( this.alignment==="center" ) {
                this.x= (width - this.width)/2;
            } else if ( this.alignment==="right" ) {
                this.x= width - this.width;
            } else if ( this.alignment==="justify" ) {

                // justify: only when text overflows further than document's 80% width
                if ( this.width / width > JUSTIFY_RATIO ) {
                    var remaining= width - this.width;
                    for( var i=0; i<remaining; i++ ) {
                        for( var j=1; j<this.elements.length; j++ ) {
                            this.elements[j].x+= 1;
                        }
                    }
                }
            }
        }
    }

    CAAT.UI.Label= function() {
        CAAT.UI.Label.superclass.constructor.call(this);

        this.rc= new renderContext();
        this.lines= [];
        this.styles= {};
        this.images= {};

        return this;
    };

    CAAT.UI.Label.prototype= {

        halignment  :   CAAT.UI.ALIGNMENT.LEFT,
        valignment  :   CAAT.UI.ALIGNMENT.TOP,
        text        :   null,
        rc          :   null,

        styles      :   null,

        documentWidth   : 0,
        documentHeight  : 0,

        reflow      :   true,

        lines       :   null,   // calculated elements lines...

        images      :   null,

        setStyle : function( name, styleData ) {
            this.styles[ name ]= styleData;
            return this;
        },

        addImage : function( name, spriteImage ) {
            this.images[ name ]= spriteImage;
            return this;
        },

        setSize : function(w,h) {
            CAAT.UI.Label.superclass.setSize.call( this, w, h );
            this.setText( this.text, this.width );
            return this;
        },

        setBounds : function( x,y,w,h ) {
            CAAT.UI.Label.superclass.setBounds.call( this,x,y,w,h );
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
            var char;
            var ctx= CAAT.currentDirector.ctx;
            ctx.save();

            text= this.text;

            i=0;
            l=text.length;

            this.rc.start( ctx, this.styles, this.images, width );

            while( i<l ) {
                char= text.charAt(i);

                if ( char==='\\' ) {
                    i+=1;
                    this.rc.char( text.charAt(i) );
                    i+=1;

                } else if ( char==='<' ) {   // try an enhancement.

                    // try finding another '>' and see whether it matches a tag
                    tag_closes_at_pos= text.indexOf('>', i+1);
                    if ( -1!==tag_closes_at_pos ) {
                        tag= text.substr( i+1, tag_closes_at_pos-i-1 );
                        if ( tag.indexOf("<")!==-1 ) {
                            this.rc.char( char );
                            i+=1;
                        } else {
                            this.rc.setTag( tag );
                            i= tag_closes_at_pos+1;
                        }
                    }
                } else {
                    this.rc.char( char );
                    i+= 1;
                }
            }

            this.rc.end();
            this.lines= this.rc.lines;

            //this.setVerticalAlignment( this.valignment );
            this.__calculateDocumentDimension( typeof width==="undefined" ? 0 : width );

            this.setLinesAlignment();

            ctx.restore();

            this.setPreferredSize( this.documentWidth, this.documentHeight );
            this.invalidateLayout();

            if ( cached ) {
                this.cacheAsBitmap(0,cached);
            }

            return this;
        },

        setVerticalAlignment : function( align ) {
            this.valignment= align;
            return this;
        },

        setHorizontalAlignment : function( align ) {
            this.halignment= align;
            return this;
        },

        __calculateDocumentDimension : function( suggestedWidth ) {
            var i;
            var height= this.rc.getDocumentHeight();
            var offset= 0;

            this.documentWidth= 0;
            for( i=0; i<this.lines.length; i++ ) {
                this.documentWidth= Math.max( this.documentWidth, this.lines[i].width );
            }

            this.documentHeight= this.rc.documentHeight;
            this.documentWidth= Math.max( this.documentWidth, suggestedWidth );

            return this;
        },

        setLinesAlignment : function() {
            for( var i=0; i<this.lines.length; i++ ) {
                this.lines[i].setAlignment( this.documentWidth )
            }
        },

        paint : function( director, time ) {

            var ctx= director.ctx;

            if ( !this.cached ) {

                ctx.save();

                var xo= 0, yo=0;

                if ( this.valignment===CAAT.UI.ALIGNMENT.CENTER ) {
                    yo= (this.height - this.documentHeight )/2;
                } else if ( this.valignment===CAAT.UI.ALIGNMENT.BOTTOM ) {
                    yo= this.height - this.documentHeight;
                }

                if ( this.halignment===CAAT.UI.ALIGNMENT.CENTER ) {
                    xo= (this.width - this.documentWidth )/2;
                } else if ( this.halignment===CAAT.UI.ALIGNMENT.RIGHT ) {
                    xo= this.width - this.documentWidth;
                }

                ctx.translate( xo, yo );

                for( var i=0; i<this.lines.length; i++ ) {
                    this.lines[i].paint( director.ctx );
                }

                ctx.restore();
            } else {
                if ( this.backgroundImage ) {
                    this.backgroundImage.paint(director,time,0,0);
                }
            }
        }
    };

    extend( CAAT.UI.Label, CAAT.Actor );

}());