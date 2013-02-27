CAAT.Module({

    /**
     * @name IMActor
     * @memberOf CAAT.Foundation.UI
     * @extends CAAT.Foundation.Actor
     * @constructor
     */

    defines : "CAAT.Foundation.UI.IMActor",
    depends : [
        "CAAT.Foundation.Actor",
        "CAAT.Module.ImageProcessor.ImageProcessor"
    ],
    extendsClass : "CAAT.Foundation.Actor",
    extendsWith : {

        /**
         * @lends CAAT.Foundation.UI.IMActor.prototype
         */

        /**
         * Image processing interface.
         * @type { }
         */
        imageProcessor:         null,

        /**
         * Calculate another image processing frame every this milliseconds.
         */
        changeTime:             100,

        /**
         * Last scene time this actor calculated a frame.
         */
        lastApplicationTime:    -1,

        /**
         * Set the image processor.
         *
         * @param im {CAAT.ImageProcessor} a CAAT.ImageProcessor instance.
         */
        setImageProcessor : function(im) {
            this.imageProcessor= im;
            return this;
        },
        /**
         * Call image processor to update image every time milliseconds.
         * @param time an integer indicating milliseconds to elapse before updating the frame.
         */
        setImageProcessingTime : function( time ) {
            this.changeTime= time;
            return this;
        },
        paint : function( director, time ) {
            if ( time-this.lastApplicationTime>this.changeTime ) {
                this.imageProcessor.apply( director, time );
                this.lastApplicationTime= time;
            }

            var ctx= director.ctx;
            this.imageProcessor.paint( director, time );
        }
    }

});
