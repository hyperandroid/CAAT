/**
 * See LICENSE file.
 *
 * TODO: allow set of margins, spacing, etc. to define subimages.
 *
 **/

(function() {

    CAAT.SpriteImageHelper= function(x,y,w,h, iw, ih) {
        this.x=         x;
        this.y=         y;
        this.width=     w;
        this.height=    h;

        this.setGL( x/iw, y/ih, (x+w-1)/iw, (y+h-1)/ih );
        return this;
    };

    CAAT.SpriteImageHelper.prototype= {

        x       :   0,
        y       :   0,
        width   :   0,
        height  :   0,
        u       :   0,
        v       :   0,
        u1      :   0,
        v1      :   0,

        setGL : function( u,v,u1,v1 ) {
            this.u= u;
            this.v= v;
            this.u1= u1;
            this.v1= v1;
            return this;
        }
    };
})();

(function() {

    /**
     *
     * This class is used by CAAT.Actor to draw images. It differs from CAAT.CompoundImage in that it
     * manages the subimage change based on time and a list of animation sub-image indexes.
     * A common use of this class will be:
     * 
     * <code>
     *     var si= new CAAT.SpriteImage().
     *          initialize( an_image_instance, rows, columns ).
     *          setAnimationImageIndex( [2,1,0,1] ).                // cycle throwout image with these indexes
     *          setChangeFPS( 200 ).                                // change sprite every 200 ms.
     *          setSpriteTransformation( CAAT.SpriteImage.TR_xx);   // optionally draw images inverted, ...
     * </code>
     *
     * A SpriteImage is an sprite sheet. It encapsulates an Image and treates and references it as a two
     * dimensional array of row by columns sub-images. The access form will be sequential so if defined a
     * CompoundImage of more than one row, the subimages will be referenced by an index ranging from 0 to
     * rows*columns-1. Each sumimage will be of size (image.width/columns) by (image.height/rows).
     *
     * <p>
     * It is able to draw its sub-images in the following ways:
     * <ul>
     * <li>no transformed (default)
     * <li>flipped horizontally
     * <li>flipped vertically
     * <li>flipped both vertical and horizontally
     * </ul>
     *
     * <p>
     * It is supposed to be used in conjunction with <code>CAAT.SpriteActor</code> instances.
     *
     * @constructor
     *
     */
    CAAT.SpriteImage = function() {
        this.paint= this.paintN;
        this.setAnimationImageIndex([0]);
        this.mapInfo=   {};
        return this;
    };

    CAAT.SpriteImage.prototype = {

        animationImageIndex:    null,   // an Array defining the sprite frame sequence
        prevAnimationTime:		-1,
        changeFPS:				1000,   // how much Scene time to take before changing an Sprite frame.
        transformation:			0,      // any of the TR_* constants.
        spriteIndex:			0,      // the current sprite frame

        TR_NONE:				0,      // constants used to determine how to draw the sprite image,
        TR_FLIP_HORIZONTAL:		1,
        TR_FLIP_VERTICAL:		2,
        TR_FLIP_ALL:			3,
        TR_FIXED_TO_SIZE:       4,
        TR_TILE:                5,

        image:                  null,
        rows:                   1,
        columns:                1,
        width:                  0,
        height:                 0,
        singleWidth:            0,
        singleHeight:           0,

        scaleX:                 1,
        scaleY:                 1,

        offsetX:                0,
        offsetY:                0,

        ownerActor:             null,

        mapInfo             :   null,
        map                 :   null,

        setOwner : function(actor) {
            this.ownerActor= actor;
            return this;
        },
        getRows: function() {
            return this.rows;
        },
        getColumns : function() {
            return this.columns;
        },

        getWidth : function() {
            var el= this.mapInfo[this.spriteIndex];
            return el.width;
        },

        getHeight : function() {
            var el= this.mapInfo[this.spriteIndex];
            return el.height;
        },

        /**
         * Get a reference to the same image information (rows, columns, image and uv cache) of this
         * SpriteImage. This means that re-initializing this objects image info (that is, calling initialize
         * method) will change all reference's image information at the same time.
         */
        getRef : function() {
            var ret=            new CAAT.SpriteImage();
            ret.image=          this.image;
            ret.rows=           this.rows;
            ret.columns=        this.columns;
            ret.width=          this.width;
            ret.height=         this.height;
            ret.singleWidth=    this.singleWidth;
            ret.singleHeight=   this.singleHeight;
            ret.mapInfo=        this.mapInfo;
            ret.offsetX=        this.offsetX;
            ret.offsetY=        this.offsetY;
            ret.scaleX=         this.scaleX;
            ret.scaleY=         this.scaleY;
            return ret;
        },
        /**
         * Set horizontal displacement to draw image. Positive values means drawing the image more to the
         * right.
         * @param x {number}
         * @return this
         */
        setOffsetX : function(x) {
            this.offsetX= x;
            return this;
        },
        /**
         * Set vertical displacement to draw image. Positive values means drawing the image more to the
         * bottom.
         * @param y {number}
         * @return this
         */
        setOffsetY : function(y) {
            this.offsetY= y;
            return this;
        },
        setOffset : function( x,y ) {
            this.offsetX= x;
            this.offsetY= y;
            return this;
        },
        /**
         * Initialize a grid of subimages out of a given image.
         * @param image {HTMLImageElement|Image} an image object.
         * @param rows {number} number of rows.
         * @param columns {number} number of columns
         *
         * @return this
         */
        initialize : function(image, rows, columns) {
            this.image = image;
            this.rows = rows;
            this.columns = columns;
            this.width = image.width;
            this.height = image.height;
            this.singleWidth = Math.floor(this.width / columns);
            this.singleHeight = Math.floor(this.height / rows);
            this.mapInfo= {};

            var i,sx0,sy0;
            var helper;

            if (image.__texturePage) {
                image.__du = this.singleWidth / image.__texturePage.width;
                image.__dv = this.singleHeight / image.__texturePage.height;


                var w = this.singleWidth;
                var h = this.singleHeight;
                var mod = this.columns;
                if (image.inverted) {
                    var t = w;
                    w = h;
                    h = t;
                    mod = this.rows;
                }

                var xt = this.image.__tx;
                var yt = this.image.__ty;

                var tp = this.image.__texturePage;

                for (i = 0; i < rows * columns; i++) {


                    var c = ((i % mod) >> 0);
                    var r = ((i / mod) >> 0);

                    var u = xt + c * w;  // esquina izq x
                    var v = yt + r * h;

                    var u1 = u + w;
                    var v1 = v + h;

                    helper= new CAAT.SpriteImageHelper(u,v,(u1-u),(v1-v),tp.width,tp.height).setGL(
                        u / tp.width,
                        v / tp.height,
                        u1 / tp.width,
                        v1 / tp.height );

                    this.mapInfo[i]= helper;
                }

            } else {
                for (i = 0; i < rows * columns; i++) {
                    sx0 = ((i % this.columns) | 0) * this.singleWidth;
                    sy0 = ((i / this.columns) | 0) * this.singleHeight;

                    helper= new CAAT.SpriteImageHelper( sx0, sy0, this.singleWidth, this.singleHeight, image.width, image.height  );
                    this.mapInfo[i]= helper;
                }
            }

            return this;
        },

        /**
         * Must be used to draw actor background and the actor should have setClip(true) so that the image tiles
         * properly.
         * @param director
         * @param time
         * @param x
         * @param y
         */
        paintTiled : function( director, time, x, y ) {
            this.setSpriteIndexAtTime(time);
            var el= this.mapInfo[this.spriteIndex];

            var r= new CAAT.Rectangle();
            this.ownerActor.AABB.intersect( director.AABB, r );

            var w= this.getWidth();
            var h= this.getHeight();
            var xoff= (this.offsetX-this.ownerActor.x) % w;
            if ( xoff> 0 ) {
                xoff= xoff-w;
            }
            var yoff= (this.offsetY-this.ownerActor.y) % h;
            if ( yoff> 0 ) {
                yoff= yoff-h;
            }

            var nw= (((r.width-xoff)/w)>>0)+1;
            var nh= (((r.height-yoff)/h)>>0)+1;
            var i,j;
            var ctx= director.ctx;

            for( i=0; i<nh; i++ ) {
                for( j=0; j<nw; j++ ) {
                    ctx.drawImage(
                        this.image,
                        el.x, el.y,
                        el.width, el.height,
                        (r.x-this.ownerActor.x+xoff+j*el.width)>>0, (r.y-this.ownerActor.y+yoff+i*el.height)>>0,
                        el.width, el.height);
                }
            }
        },

        /**
         * Draws the subimage pointed by imageIndex horizontally inverted.
         * @param canvas a canvas context.
         * @param imageIndex {number} a subimage index.
         * @param x {number} x position in canvas to draw the image.
         * @param y {number} y position in canvas to draw the image.
         *
         * @return this
         */
        paintInvertedH : function(director, time, x, y) {

            this.setSpriteIndexAtTime(time);

            var el= this.mapInfo[this.spriteIndex];

            var ctx= director.ctx;
            ctx.save();
            //ctx.translate(((0.5 + x) | 0) + el.width, (0.5 + y) | 0);
            ctx.translate( (x|0) + el.width, y|0 );
            ctx.scale(-1, 1);


            ctx.drawImage(
                this.image,
                el.x, el.y,
                el.width, el.height,
                this.offsetX>>0, this.offsetY>>0,
                el.width, el.height );

            ctx.restore();

            return this;
        },
        /**
         * Draws the subimage pointed by imageIndex vertically inverted.
         * @param canvas a canvas context.
         * @param imageIndex {number} a subimage index.
         * @param x {number} x position in canvas to draw the image.
         * @param y {number} y position in canvas to draw the image.
         *
         * @return this
         */
        paintInvertedV : function(director, time, x, y) {

            this.setSpriteIndexAtTime(time);
            var el= this.mapInfo[this.spriteIndex];

            var ctx= director.ctx;
            ctx.save();
            //ctx.translate((x + 0.5) | 0, (0.5 + y + el.height) | 0);
            ctx.translate( x|0, (y + el.height) | 0);
            ctx.scale(1, -1);

            ctx.drawImage(
                this.image,
                el.x, el.y,
                el.width, el.height,
                this.offsetX>>0,this.offsetY>>0,
                el.width, el.height);

            ctx.restore();

            return this;
        },
        /**
         * Draws the subimage pointed by imageIndex both horizontal and vertically inverted.
         * @param canvas a canvas context.
         * @param imageIndex {number} a subimage index.
         * @param x {number} x position in canvas to draw the image.
         * @param y {number} y position in canvas to draw the image.
         *
         * @return this
         */
        paintInvertedHV : function(director, time, x, y) {

            this.setSpriteIndexAtTime(time);
            var el= this.mapInfo[this.spriteIndex];

            var ctx= director.ctx;
            ctx.save();
            //ctx.translate((x + 0.5) | 0, (0.5 + y + el.height) | 0);
            ctx.translate( x | 0, (y + el.height) | 0);
            ctx.scale(1, -1);
            ctx.translate(el.width, 0);
            ctx.scale(-1, 1);

            ctx.drawImage(
                this.image,
                el.x, el.y,
                el.width, el.height,
                this.offsetX>>0, this.offsetY>>0,
                el.width, el.height);

            ctx.restore();

            return this;
        },
        /**
         * Draws the subimage pointed by imageIndex.
         * @param canvas a canvas context.
         * @param imageIndex {number} a subimage index.
         * @param x {number} x position in canvas to draw the image.
         * @param y {number} y position in canvas to draw the image.
         *
         * @return this
         */
        paintN : function(director, time, x, y) {
            this.setSpriteIndexAtTime(time);
            var el= this.mapInfo[this.spriteIndex];

            director.ctx.drawImage(
                this.image,
                el.x, el.y,
                el.width, el.height,
                (this.offsetX+x)>>0, (this.offsetY+y)>>0,
                el.width, el.height);

            return this;
        },
        paintChunk : function( ctx, dx,dy, x, y, w, h ) {
            ctx.drawImage( this.image, x,y,w,h, dx,dy,w,h );
        },
        paintTile : function(ctx, index, x, y) {
            var el= this.mapInfo[index];
            ctx.drawImage(
                this.image,
                el.x, el.y,
                el.width, el.height,
                (this.offsetX+x)>>0, (this.offsetY+y)>>0,
                el.width, el.height);

            return this;
        },
        /**
         * Draws the subimage pointed by imageIndex scaled to the size of w and h.
         * @param canvas a canvas context.
         * @param imageIndex {number} a subimage index.
         * @param x {number} x position in canvas to draw the image.
         * @param y {number} y position in canvas to draw the image.
         * @param w {number} new width of the subimage.
         * @param h {number} new height of the subimage.
         *
         * @return this
         */
        paintScaled : function(director, time, x, y) {
            this.setSpriteIndexAtTime(time);
            var el= this.mapInfo[this.spriteIndex];

            director.ctx.drawImage(
                this.image,
                el.x, el.y,
                el.width, el.height,
                (this.offsetX+x)>>0, (this.offsetY+y)>>0,
                this.ownerActor.width, this.ownerActor.height );

            return this;
        },
        getCurrentSpriteImageCSSPosition : function() {
            var el= this.mapInfo[this.spriteIndex];

            var x= -(el.x-this.offsetX);
            var y= -(el.y-this.offsetY);

            return ''+x+'px '+
                   y+'px '+
                    (this.ownerActor.transformation===this.TR_TILE ? 'repeat' : 'no-repeat');
        },
        /**
         * Get the number of subimages in this compoundImage
         * @return {number}
         */
        getNumImages : function() {
            return this.rows * this.columns;
        },
        /**
         * TODO: set mapping coordinates for different transformations.
         * @param imageIndex
         * @param uvBuffer
         * @param uvIndex
         */
        setUV : function(uvBuffer, uvIndex) {
            var im = this.image;

            if (!im.__texturePage) {
                return;
            }

            var index = uvIndex;
            var sIndex= this.spriteIndex;
            var el= this.mapInfo[this.spriteIndex];

            var u=  el.u;
            var v=  el.v;
            var u1= el.u1;
            var v1= el.v1;
            if ( this.offsetX || this.offsetY ) {
                var w=  this.ownerActor.width;
                var h=  this.ownerActor.height;

                var tp= im.__texturePage;

                var _u= -this.offsetX / tp.width;
                var _v= -this.offsetY / tp.height;
                var _u1=(w-this.offsetX) / tp.width;
                var _v1=(h-this.offsetY) / tp.height;

                u=      _u  + im.__u;
                v=      _v  + im.__v;
                u1=     _u1 + im.__u;
                v1=     _v1 + im.__v;
            }

            if (im.inverted) {
                uvBuffer[index++] = u1;
                uvBuffer[index++] = v;

                uvBuffer[index++] = u1;
                uvBuffer[index++] = v1;

                uvBuffer[index++] = u;
                uvBuffer[index++] = v1;

                uvBuffer[index++] = u;
                uvBuffer[index++] = v;
            } else {
                uvBuffer[index++] = u;
                uvBuffer[index++] = v;

                uvBuffer[index++] = u1;
                uvBuffer[index++] = v;

                uvBuffer[index++] = u1;
                uvBuffer[index++] = v1;

                uvBuffer[index++] = u;
                uvBuffer[index++] = v1;
            }
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
            switch(transformation)	{
				case this.TR_FLIP_HORIZONTAL:
					this.paint= this.paintInvertedH;
					break;
				case this.TR_FLIP_VERTICAL:
					this.paint= this.paintInvertedV;
					break;
				case this.TR_FLIP_ALL:
					this.paint= this.paintInvertedHV;
					break;
                case this.TR_FIXED_TO_SIZE:
                    this.paint= this.paintScaled;
                    break;
                case this.TR_TILE:
                    this.paint= this.paintTiled;
                    break;
				default:
					this.paint= this.paintN;
			}
            return this;
        },

        resetAnimationTime : function() {
            this.prevAnimationTime=  -1;
            return this;
        },

        /**
         * Set the sprite animation images index. This method accepts an array of objects which define indexes to
         * subimages inside this sprite image.
         * If the SpriteImage is instantiated by calling the method initialize( image, rows, cols ), the value of
         * aAnimationImageIndex should be an array of numbers, which define the indexes into an array of subimages
         * with size rows*columns.
         * If the method InitializeFromMap( image, map ) is called, the value for aAnimationImageIndex is expected
         * to be an array of strings which are the names of the subobjects contained in the map object.
         *
         * @param aAnimationImageIndex an array indicating the Sprite's frames.
         */
		setAnimationImageIndex : function( aAnimationImageIndex ) {
			this.animationImageIndex= aAnimationImageIndex;
			this.spriteIndex= aAnimationImageIndex[0];
            this.prevAnimationTime= -1;

            return this;
		},
        setSpriteIndex : function(index) {
            this.spriteIndex= index;
            return this;
        },

        /**
         * Draws the sprite image calculated and stored in spriteIndex.
         *
         * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
         * @param time an integer indicating the Scene time when the bounding box is to be drawn.
         */
		setSpriteIndexAtTime : function(time) {

            if ( this.animationImageIndex.length>1 ) {
                if ( this.prevAnimationTime===-1 )	{
                    this.prevAnimationTime= time;
                    this.spriteIndex=0;
                }
                else	{
                    var ttime= time;
                    ttime-= this.prevAnimationTime;
                    ttime/= this.changeFPS;
                    ttime%= this.animationImageIndex.length;
                    this.spriteIndex= this.animationImageIndex[Math.floor(ttime)];
                }
            }
        },

        getMapInfo : function( index ) {
            return this.mapInfo[ index ];
        },

        /**
         * This method takes the output generated from the tool at http://labs.hyperandroid.com/static/texture/spriter.html
         * and creates a map into that image.
         * @param image {Image|HTMLImageElement|Canvas} an image
         * @param map {object} the map into the image to define subimages.
         */
        initializeFromMap : function( image, map ) {
            this.initialize( image, 1, 1 );

            var key;
            var helper;
            var count=0;

            for( key in map ) {
                var value= map[key];

                helper= new CAAT.SpriteImageHelper(
                    value.x,
                    value.y,
                    value.width,
                    value.height,
                    image.width,
                    image.height
                );

                this.mapInfo[key]= helper;

                // set a default spriteIndex
                if ( !count ) {
                    this.setAnimationImageIndex( [key] );
                }

                count++;
            }

            return this;
        },

        /**
         *
         * @param image {Image|HTMLImageElement|Canvas}
         * @param map object with pairs "<a char>" : {
         *              id      : {number},
         *              height  : {number},
         *              xoffset : {number},
         *              letter  : {string},
         *              yoffset : {number},
         *              width   : {number},
         *              xadvance: {number},
         *              y       : {number},
         *              x       : {number}
         *          }
         */
        initializeAsGlyphDesigner : function( image, map ) {
            this.initialize( image, 1, 1 );

            var key;
            var helper;
            var count=0;

            for( key in map ) {
                var value= map[key];

                helper= new CAAT.SpriteImageHelper(
                    value.x,
                    value.y,
                    value.width,
                    value.height,
                    image.width,
                    image.height
                );

                helper.xoffset= typeof value.xoffset==='undefined' ? 0 : value.xoffset;
                helper.yoffset= typeof value.yoffset==='undefined' ? 0 : value.yoffset;
                helper.xadvance= typeof value.xadvance==='undefined' ? value.width : value.xadvance;

                this.mapInfo[key]= helper;

                // set a default spriteIndex
                if ( !count ) {
                    this.setAnimationImageIndex( [key] );
                }

                count++;
            }

            return this;

        },

        /**
         *
         * @param image
         * @param map: Array<{c: "a", width: 40}>
         */
        initializeAsFontMap : function( image, chars ) {
            this.initialize( image, 1, 1 );

            var helper;
            var x=0;

            for( var i=0;i<chars.length;i++ ) {
                var value= chars[i];

                helper= new CAAT.SpriteImageHelper(
                    x,
                    0,
                    value.width,
                    image.height,
                    image.width,
                    image.height
                );

                helper.xoffset= 0;
                helper.yoffset= 0;
                helper.xadvance= value.width;


                x += value.width;

                this.mapInfo[chars[i].c]= helper;

                // set a default spriteIndex
                if ( !i ) {
                    this.setAnimationImageIndex( [chars[i].c] );
                }
            }

            return this;
        },

        /**
         * This method creates a font sprite image based on a proportional font
         * It assumes the font is evenly spaced in the image
         * Example:
         * var font =   new CAAT.SpriteImage().initializeAsMonoTypeFontMap(
         *  director.getImage('numbers'),
         *  "0123456789"
         * );
         */

        initializeAsMonoTypeFontMap : function( image, chars ) {
            var map = [];
            var charArr = chars.split("");
            
            var w = image.width / charArr.length >> 0;

            for( var i=0;i<charArr.length;i++ ) {
                map.push({c: charArr[i], width: w });
            }

            return this.initializeAsFontMap(image,map);
        },

        stringWidth : function( str ) {
            var i,l,w=0,charInfo;

            for( i=0, l=str.length; i<l; i++ ) {
                  charInfo= this.mapInfo[ str.charAt(i) ];
                  if ( charInfo ) {
                      w+= charInfo.xadvance;
                  }
            }

            return w;
        },

        stringHeight : function() {
            if ( this.fontHeight ) {
                return this.fontHeight;
            }

            var y= 0;
            for( var i in this.mapInfo ) {
                var mi= this.mapInfo[i];

                var h= mi.height+mi.yoffset;
                if ( h>y ) {
                    y=h;
                }
            }

            this.fontHeight= y;
            return this.fontHeight;
        },

        drawString : function( ctx, str, x, y ) {
            var i, l, charInfo, w;
            var charArr = str.split("");
            
            for( i=0; i<charArr.length; i++ ) {
                charInfo= this.mapInfo[ charArr[i] ];
                  if ( charInfo ) {
                      w= charInfo.width;
                      ctx.drawImage(
                          this.image,
                          charInfo.x, charInfo.y,
                          w, charInfo.height,

                          x + charInfo.xoffset, y + charInfo.yoffset,
                          w, charInfo.height );

                      x+= charInfo.xadvance;
                  }
              }
        }

        
    };
})();
