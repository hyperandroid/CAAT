/**
 * See LICENSE file.
 *
 * Image/Resource preloader.
 *
 *
 **/

CAAT.Module( {


    /**
     * @name Preloader
     * @memberOf CAAT.Module
     * @namespace
     */

    /**
     * @name ImagePreloader
     * @memberOf CAAT.Module.Preloader
     * @constructor
     */

    defines : "CAAT.Module.Preloader.ImagePreloader",
    aliases : ["CAAT.ImagePreloader"],
    extendsWith : {

        /**
         * @lends CAAT.Module.Preloader.ImagePreloader.prototype
         */

        __init : function()   {
            this.images = [];
            return this;
        },

        /**
         * a list of elements to load.
         * @type {Array.<{ id, image }>}
         */
        images:                 null,

        /**
         * notification callback invoked for each image loaded.
         */
        notificationCallback:   null,

        /**
         * elements counter.
         */
        imageCounter:           0,

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

    }
});
