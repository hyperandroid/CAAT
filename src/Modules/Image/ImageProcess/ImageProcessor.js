CAAT.Module({

    /**
     * @name Image
     * @memberOf CAAT.Module
     * @namespace
     */

    /**
     * @name ImageProcessor
     * @memberOf CAAT.Module.Image
     * @namespace
     */

    /**
     * @name ImageProcessor
     * @memberOf CAAT.Module.Image.ImageProcessor
     * @constructor
     */


    defines : "CAAT.Module.Image.ImageProcessor.ImageProcessor",
    extendsWith : {

        /**
         * @lends CAAT.Module.Image.ImageProcessor.ImageProcessor.prototype
         */

        canvas:     null,
        ctx:        null,
        width:      0,
        height:     0,
        imageData:  null,
        bufferImage:null,

        /**
         * Grabs an image pixels.
         *
         * @param image {HTMLImageElement}
         * @return {ImageData} returns an ImageData object with the image representation or null in
         * case the pixels can not be grabbed.
         *
         * @static
         */
        grabPixels : function(image) {
            var canvas= document.createElement('canvas');
            if ( canvas!==null ) {
                canvas.width= image.width;
                canvas.height= image.height;
                var ctx= canvas.getContext('2d');
                ctx.drawImage(image,0,0);
                try {
                    var imageData= ctx.getImageData(0,0,canvas.width,canvas.height);
                    return imageData;
                }
                catch(e) {
                    CAAT.log('error pixelgrabbing.', image);
                    return null;
                }
            }
            return null;
        },
        /**
         * Helper method to create an array.
         *
         * @param size {number} integer number of elements in the array.
         * @param initValue {number} initial array values.
         *
         * @return {[]} an array of 'initialValue' elements.
         *
         * @static
         */
        makeArray : function(size, initValue) {
            var a= [];

            for(var i=0; i<size; i++ )  {
                a.push( initValue );
            }

            return a;
        },
        /**
         * Helper method to create a bidimensional array.
         *
         * @param size {number} number of array rows.
         * @param size2 {number} number of array columns.
         * @param initvalue array initial values.
         *
         * @return {[]} a bidimensional array of 'initvalue' elements.
         *
         * @static
         *
         */
        makeArray2D : function (size, size2, initvalue)  {
            var a= [];

            for( var i=0; i<size; i++ ) {
                a.push( this.makeArray(size2,initvalue) );
            }

            return a;
        },
        /**
         * Initializes and creates an offscreen Canvas object. It also creates an ImageData object and
         * initializes the internal bufferImage attribute to imageData's data.
         * @param width {number} canvas width.
         * @param height {number} canvas height.
         * @return this
         */
        initialize : function(width,height) {

            this.width=  width;
            this.height= height;

            this.canvas= document.createElement('canvas');
            if ( this.canvas!==null ) {
                this.canvas.width= width;
                this.canvas.height= height;
                this.ctx= this.canvas.getContext('2d');
                this.imageData= this.ctx.getImageData(0,0,width,height);
                this.bufferImage= this.imageData.data;
            }

            return this;
        },
        /**
         * Clear this ImageData object to the given color components.
         * @param r {number} red color component 0..255.
         * @param g {number} green color component 0..255.
         * @param b {number} blue color component 0..255.
         * @param a {number} alpha color component 0..255.
         * @return this
         */
        clear : function( r,g,b,a ) {
            if ( null===this.imageData ) {
                return this;
            }
            var data= this.imageData.data;
            for( var i=0; i<this.width*this.height; i++ ) {
                data[i*4+0]= r;
                data[i*4+1]= g;
                data[i*4+2]= b;
                data[i*4+3]= a;
            }
            this.imageData.data= data;

            return this;
        },
        /**
         * Get this ImageData.
         * @return {ImageData}
         */
        getImageData : function() {
            return this.ctx.getImageData(0,0,this.width,this.height);
        },
        /**
         * Sets canvas pixels to be the applied effect. After process pixels, this method must be called
         * to show the result of such processing.
         * @param director {CAAT.Director}
         * @param time {number}
         * @return this
         */
        applyIM : function(director, time) {
            if ( null!==this.imageData ) {
                this.imageData.data= this.bufferImage;
                this.ctx.putImageData(this.imageData, 0, 0);
            }
            return this;
        },
        /**
         * Returns the offscreen canvas.
         * @return {HTMLCanvasElement}
         */
        getCanvas : function() {
            return this.canvas;
        },
        /**
         * Creates a pattern that will make this ImageProcessor object suitable as a fillStyle value.
         * This effect can be drawn too as an image by calling: canvas_context.drawImage methods.
         * @param type {string} the pattern type. if no value is supplied 'repeat' will be used.
         * @return CanvasPattern.
         */
        createPattern : function( type ) {
            return this.ctx.createPattern(this.canvas,type ? type : 'repeat');
        },
        /**
         * Paint this ImageProcessor object result.
         * @param director {CAAT.Director}.
         * @param time {number} scene time.
         */
        paint : function( director, time ) {
            if ( null!==this.canvas ) {
                var ctx= director.ctx;
                ctx.drawImage( this.getCanvas(), 0, 0 );
            }
        }
    }

});
