/**
 * See LICENSE file.
 *
 * Image/Resource preloader.
 *
 *
 **/


(function() {
    /**
     * This class is a image resource loader. It accepts an object of the form:
     *
     * {
     *   id1: string_url1,
     *   id2: string_url2,
     *   id3: string_url3,
     *   ...
     * }
     *
     * and on resources loaded correctly, will return an object of the form:
     *
     * {
     *   id1: HTMLImageElement,
     *   id2: HTMLImageElement,
     *   id3: HTMLImageElement,
     *   ...
     * }
     *
     * @constructor
     */
    CAAT.ImagePreloader = function()   {
        this.images = [];
        return this;
    };

    CAAT.ImagePreloader.prototype =   {

        images:                 null,   // a list of elements to load
        notificationCallback:   null,   // notification callback invoked for each image loaded.
        imageCounter:           0,      // elements counter.

        /**
         * Start images loading asynchronous process. This method will notify every image loaded event
         * and is responsibility of the caller to count the number of loaded images to see if it fits his
         * needs.
         * 
         * @param aImages {{ id:{url}, id2:{url}, ...} an object with id/url pairs.
         * @param callback_loaded_one_image {function( imageloader {CAAT.ImagePreloader}, counter {number}, images {{ id:{string}, image: {Image}}} )}
         * function to call on every image load.
         */
        loadImages: function( aImages, callback_loaded_one_image, callback_error ) {

            if (!aImages) {
                if (callback_loaded_one_image ) {
                    callback_loaded_one_image(0,[]);
                }
            }

            var me= this, i;
            this.notificationCallback = callback_loaded_one_image;
            this.images= [];
            for( i=0; i<aImages.length; i++ ) {
                this.images.push( {id:aImages[i].id, image: new Image() } );
            }

            for( i=0; i<aImages.length; i++ ) {
                this.images[i].image.onload = function imageLoaded() {
                    me.imageCounter++;
                    me.notificationCallback(me.imageCounter, me.images);
                };

                this.images[i].image.onerror= (function(index) {
                        return function(e) {
                            if ( callback_error ) {
                                callback_error( e, index );
                            }
                        }
                    })(i);

                this.images[i].image.src= aImages[i].url;
            }

            if ( aImages.length===0 ) {
                callback_loaded_one_image(0,[]);
            }
        }

    };
})();