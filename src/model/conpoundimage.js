/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * ConpoundBitmap handles subimaging from an image.
 * It's useful for SpriteActor class.
 *
 * TODO: allow set of margins, spacing, etc. to define subimages.
 *
 **/


(function() {

    /**
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
        return this;
    };

    CAAT.CompoundImage.prototype = {

        NORMAL:                     1,
        INV_VERTICAL:                 2,
        INV_HORIZONTAL:             4,
        INV_VERTICAL_AND_HORIZONTAL:8,

        image:                        null,
        rows:                        0,
        cols:                        0,
        width:                        0,
        height:                        0,
        singleWidth:                0,
        singleHeight:                0,

        xyCache:                    null,

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
        paint : function(canvas, imageIndex, x, y) {

            canvas.drawImage(
                    this.image,
                    this.xyCache[imageIndex][0]>>0, this.xyCache[imageIndex][1]>>0,
                    this.singleWidth, this.singleHeight,
                    x>>0, y>>0, this.singleWidth, this.singleHeight);

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