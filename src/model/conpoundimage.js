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
    CAAT.CompoundImage= function() {
		return this;
	};
	
	CAAT.CompoundImage.prototype= {

		NORMAL: 					1,
    	INV_VERTICAL: 				2,
    	INV_HORIZONTAL: 			4,
    	INV_VERTICAL_AND_HORIZONTAL:8,
    
    	image:						null,
    	rows:						0,
    	cols:						0,
    	width:						0,
    	height:						0,
    	singleWidth:				0,
    	singleHeight:				0,

        /**
         * Initialize a grid of subimages out of a given image.
         * @param image {HTMLImageElement|Image} an image object.
         * @param rows {number} number of rows.
         * @param cols {number} number of columns
         *
         * @return this
         */
    	initialize : function( image, rows, cols ) {
        	this.image= image;
        	this.rows=  rows;
        	this.cols=  cols;
        	this.width= image.width;
        	this.height=image.height;
        	this.singleWidth=  	Math.floor(this.width/cols);
        	this.singleHeight= 	Math.floor(this.height/rows);
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
	    paintInvertedH : function( canvas, imageIndex, x, y ) {
	    	var sx0= ((imageIndex%this.cols)|0)*this.singleWidth;
	        var sy0= ((imageIndex/this.cols)|0)*this.singleHeight;
	       
	        canvas.save();
		        canvas.translate( ((.5+x)|0)+this.singleWidth, (.5+y)|0 );
		        canvas.scale(-1, 1);
		        
		        canvas.drawImage( this.image,
		        				  sx0, sy0, this.singleWidth, this.singleHeight,
		        				  0, 0, this.singleWidth, this.singleHeight );

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
	    paintInvertedV : function( canvas, imageIndex, x, y ) {
	    	var sx0= ((imageIndex%this.cols)|0)*this.singleWidth;
	        var sy0= ((imageIndex/this.cols)|0)*this.singleHeight;
	    	
	        canvas.save();
	        	canvas.translate( (x+.5)|0, (.5+y+this.singleHeight)|0 );
	        	canvas.scale(1, -1);
	        	
		        canvas.drawImage(
		        	this.image, 
	  				sx0, sy0, this.singleWidth, this.singleHeight,
	  				0, 0, this.singleWidth, this.singleHeight );

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
	    paintInvertedHV : function( canvas, imageIndex, x, y ) {
	    	var sx0= ((imageIndex%this.cols)|0)*this.singleWidth;
	        var sy0= ((imageIndex/this.cols)|0)*this.singleHeight;
	    	
	        canvas.save();
		    	canvas.translate( (x+.5)|0, (.5+y+this.singleHeight)|0 );
		    	canvas.scale(1, -1);
	        	canvas.translate( this.singleWidth, 0 );
	        	canvas.scale(-1, 1);
	        	
		        canvas.drawImage(
		        		this.image, 
		  				sx0, sy0, this.singleWidth, this.singleHeight,
		  				0, 0, this.singleWidth, this.singleHeight );

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
	    paint : function( canvas, imageIndex, x, y ) {
	
	        var sx0= ((imageIndex%this.cols)|0)*this.singleWidth;
	        var sy0= ((imageIndex/this.cols)|0)*this.singleHeight;

            if ( sx0<0 || sy0<0 ) {
                return this;
            }
	        canvas.drawImage(
	        		this.image, 
					sx0, sy0, this.singleWidth, this.singleHeight,
					(x+.5)|0, (y+.5)|0, this.singleWidth, this.singleHeight );

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
	    paintScaled : function( canvas, imageIndex, x, y, w, h ) {
	        var sx0= ((imageIndex%this.cols)|0)*this.singleWidth;
	        var sy0= ((imageIndex/this.cols)|0)*this.singleHeight;
	        canvas.drawImage( 
	        		this.image, 
					sx0, sy0, this.singleWidth, this.singleHeight,
					(x+.5)|0, (y+.5)|0, w, h );

            return this;
	    },
        /**
         * Get the number of subimages in this compoundImage
         * @return {number}
         */
	    getNumImages : function() {
	    	return this.rows*this.cols;
	    }
	};
})();