/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * TODO: allow set of margins, spacing, etc. to define subimages.
 *
 **/


(function() {

    /**
     * This class is exclusively used by SpriteActor. This class is deprecated since the base CAAT.Actor
     * now is able to draw images.
     *
     * A CompoundImage is an sprite sheet. It encapsulates an Image and treates and references it as a two
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
    CAAT.CompoundImage = function() {
        this.paint= this.paintN;
        return this;
    };

    CAAT.CompoundImage.prototype = {

        TR_NONE:				0,      // constants used to determine how to draw the sprite image,
        TR_FLIP_HORIZONTAL:		1,
        TR_FLIP_VERTICAL:		2,
        TR_FLIP_ALL:			3,

        image:                  null,
        rows:                   0,
        cols:                   0,
        width:                  0,
        height:                 0,
        singleWidth:            0,
        singleHeight:           0,

        xyCache:                null,

        /**
         * Initialize a grid of subimages out of a given image.
         * @param image {HTMLImageElement|Image} an image object.
         * @param rows {number} number of rows.
         * @param cols {number} number of columns
         *
         * @return this
         */
        initialize : function(image, rows, cols) {
            this.image = image;
            this.rows = rows;
            this.cols = cols;
            this.width = image.width;
            this.height = image.height;
            this.singleWidth = Math.floor(this.width / cols);
            this.singleHeight = Math.floor(this.height / rows);
            this.xyCache = [];

            var i,sx0,sy0;
            if (image.__texturePage) {
                image.__du = this.singleWidth / image.__texturePage.width;
                image.__dv = this.singleHeight / image.__texturePage.height;


                var w = this.singleWidth;
                var h = this.singleHeight;
                var mod = this.cols;
                if (image.inverted) {
                    var t = w;
                    w = h;
                    h = t;
                    mod = this.rows;
                }

                var xt = this.image.__tx;
                var yt = this.image.__ty;

                var tp = this.image.__texturePage;

                for (i = 0; i < rows * cols; i++) {


                    var c = ((i % mod) >> 0);
                    var r = ((i / mod) >> 0);

                    var u = xt + c * w;  // esquina izq x
                    var v = yt + r * h;

                    var u1 = u + w;
                    var v1 = v + h;

                    /*
                     var du= image.__du;
                     var dv= image.__dv;
                     var mod= this.cols;
                     if ( image.inverted) {
                     var t= du;
                     du= dv;
                     dv= t;
                     mod= this.rows;
                     }

                     sx0= ((i%mod)>>0)*du;
                     sy0= ((i/mod)>>0)*dv;

                     var u= image.__u+sx0;
                     var v= image.__v+sy0;

                     var u1= u+du;
                     var v1= v+dv;
                     */

                    this.xyCache.push([u / tp.width,v / tp.height,u1 / tp.width,v1 / tp.height,u,v,u1,v1]);
                }

            } else {
                for (i = 0; i < rows * cols; i++) {
                    sx0 = ((i % this.cols) | 0) * this.singleWidth;
                    sy0 = ((i / this.cols) | 0) * this.singleHeight;

                    this.xyCache.push([sx0,sy0]);
                }
            }

            return this;
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
        paintInvertedH : function(canvas, imageIndex, x, y) {

            canvas.save();
            canvas.translate(((0.5 + x) | 0) + this.singleWidth, (0.5 + y) | 0);
            canvas.scale(-1, 1);

            canvas.drawImage(this.image,
                    this.xyCache[imageIndex][0], this.xyCache[imageIndex][1],
                    this.singleWidth, this.singleHeight,
                    0, 0, this.singleWidth, this.singleHeight);

            canvas.restore();

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
        paintInvertedV : function(canvas, imageIndex, x, y) {

            canvas.save();
            canvas.translate((x + 0.5) | 0, (0.5 + y + this.singleHeight) | 0);
            canvas.scale(1, -1);

            canvas.drawImage(
                    this.image,
                    this.xyCache[imageIndex][0], this.xyCache[imageIndex][1],
                    this.singleWidth, this.singleHeight,
                    0, 0, this.singleWidth, this.singleHeight);

            canvas.restore();

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
        paintInvertedHV : function(canvas, imageIndex, x, y) {

            canvas.save();
            canvas.translate((x + 0.5) | 0, (0.5 + y + this.singleHeight) | 0);
            canvas.scale(1, -1);
            canvas.translate(this.singleWidth, 0);
            canvas.scale(-1, 1);

            canvas.drawImage(
                    this.image,
                    this.xyCache[imageIndex][0], this.xyCache[imageIndex][1],
                    this.singleWidth, this.singleHeight,
                    0, 0, this.singleWidth, this.singleHeight);

            canvas.restore();

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
        paintN : function(canvas, imageIndex, x, y) {
            canvas.drawImage(
                    this.image,
                    this.xyCache[imageIndex][0]>>0, this.xyCache[imageIndex][1]>>0,
                    this.singleWidth, this.singleHeight,
                    x>>0, y>>0, this.singleWidth, this.singleHeight);

            return this;
        },
        paint : function(canvas, imageIndex, x, y) {
            return this.paintN(canvas,imageIndex,x,y);
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
        paintScaled : function(canvas, imageIndex, x, y, w, h) {
            canvas.drawImage(
                    this.image,
                    this.xyCache[imageIndex][0], this.xyCache[imageIndex][1],
                    this.singleWidth, this.singleHeight,
                    (x + 0.5) | 0, (y + 0.5) | 0, w, h);

            return this;
        },
        /**
         * Get the number of subimages in this compoundImage
         * @return {number}
         */
        getNumImages : function() {
            return this.rows * this.cols;
        },
        setUV : function(imageIndex, uvBuffer, uvIndex) {
            var im = this.image;

            if (!im.__texturePage) {
                return;
            }

            var index = uvIndex;

            if (im.inverted) {
                uvBuffer[index++] = this.xyCache[imageIndex][2];
                uvBuffer[index++] = this.xyCache[imageIndex][1];

                uvBuffer[index++] = this.xyCache[imageIndex][2];
                uvBuffer[index++] = this.xyCache[imageIndex][3];

                uvBuffer[index++] = this.xyCache[imageIndex][0];
                uvBuffer[index++] = this.xyCache[imageIndex][3];

                uvBuffer[index++] = this.xyCache[imageIndex][0];
                uvBuffer[index++] = this.xyCache[imageIndex][1];
            } else {
                uvBuffer[index++] = this.xyCache[imageIndex][0];
                uvBuffer[index++] = this.xyCache[imageIndex][1];

                uvBuffer[index++] = this.xyCache[imageIndex][2];
                uvBuffer[index++] = this.xyCache[imageIndex][1];

                uvBuffer[index++] = this.xyCache[imageIndex][2];
                uvBuffer[index++] = this.xyCache[imageIndex][3];

                uvBuffer[index++] = this.xyCache[imageIndex][0];
                uvBuffer[index++] = this.xyCache[imageIndex][3];
            }

            //director.uvIndex= index;
        }
    };
})();


(function() {

    /**
     *
     * This class is used by CAAT.Actor to draw images. It differs from CAAT.CompoundImage in that it
     * manages the subimage change based on time and a list of animation sub-image indexes.
     * A common use of this class will be:
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

        xyCache:                null,

        ownerActor:             null,

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
            ret.xyCache=        this.xyCache;
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
            this.offsetX= x|0;
            return this;
        },
        /**
         * Set vertical displacement to draw image. Positive values means drawing the image more to the
         * bottom.
         * @param y {number}
         * @return this
         */
        setOffsetY : function(y) {
            this.offsetY= y|0;
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
            this.xyCache = [];

            var i,sx0,sy0;
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

                    this.xyCache.push([u / tp.width,v / tp.height,u1 / tp.width,v1 / tp.height,u,v,u1,v1]);
                }

            } else {
                for (i = 0; i < rows * columns; i++) {
                    sx0 = ((i % this.columns) | 0) * this.singleWidth;
                    sy0 = ((i / this.columns) | 0) * this.singleHeight;

                    this.xyCache.push([sx0,sy0]);
                }
            }

            return this;
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

            var ctx= director.ctx;
            ctx.save();
            ctx.translate(((0.5 + x) | 0) + this.singleWidth, (0.5 + y) | 0);
            ctx.scale(-1, 1);

            ctx.drawImage(this.image,
                    this.xyCache[this.spriteIndex][0], this.xyCache[this.spriteIndex][1],
                    this.singleWidth, this.singleHeight,
                    this.offsetX, this.offsetY, this.singleWidth, this.singleHeight);

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

            var ctx= director.ctx;
            ctx.save();
            ctx.translate((x + 0.5) | 0, (0.5 + y + this.singleHeight) | 0);
            ctx.scale(1, -1);

            ctx.drawImage(
                    this.image,
                    this.xyCache[this.spriteIndex][0], this.xyCache[this.spriteIndex][1],
                    this.singleWidth, this.singleHeight,
                    this.offsetX,this.offsetY, this.singleWidth, this.singleHeight);

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

            var ctx= director.ctx;
            ctx.save();
            ctx.translate((x + 0.5) | 0, (0.5 + y + this.singleHeight) | 0);
            ctx.scale(1, -1);
            ctx.translate(this.singleWidth, 0);
            ctx.scale(-1, 1);

            ctx.drawImage(
                    this.image,
                    this.xyCache[this.spriteIndex][0], this.xyCache[this.spriteIndex][1],
                    this.singleWidth, this.singleHeight,
                    this.offsetX, this.offsetY, this.singleWidth, this.singleHeight);

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

            director.ctx.drawImage(
                    this.image,
                    this.xyCache[this.spriteIndex][0]>>0, this.xyCache[this.spriteIndex][1]>>0,
                    this.singleWidth, this.singleHeight,
                    this.offsetX+x,this.offsetY+y, this.singleWidth, this.singleHeight);

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
            director.ctx.drawImage(
                    this.image,
                    this.xyCache[this.spriteIndex][0], this.xyCache[this.spriteIndex][1],
                    this.singleWidth, this.singleHeight,
                    (x + 0.5) | 0, (y + 0.5) | 0, this.ownerActor.width, this.ownerActor.height );

            return this;
        },
        getCurrentSpriteImageCSSPosition : function() {
            return '-'+(this.xyCache[this.spriteIndex][0]-this.offsetX)+'px '+
                   '-'+(this.xyCache[this.spriteIndex][1]-this.offsetY)+'px';
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
            var u=  this.xyCache[sIndex][0];
            var v=  this.xyCache[sIndex][1];
            var u1= this.xyCache[sIndex][2];
            var v1= this.xyCache[sIndex][3];
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
				default:
					this.paint= this.paintN;
			}
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
        }

    };
})();