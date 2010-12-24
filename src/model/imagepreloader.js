/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * Image/Resource preloader.
 *
 *
 **/


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
 *   id1: image1,
 *   id2: image2,
 *   id3: image3,
 *   ...
 * }
 *
 *
 */
(function() {

    CAAT.ImagePreloader = function()   {
        this.images = new Array();
        return this;
    };

    CAAT.ImagePreloader.prototype =   {

        images:                 null,   // a list of elements to load
        notificationCallback:   null,   // notification callback invoked for each image loaded.
        imageCounter:           0,      // elements counter.

        loadImages: function( aImages, callback ) {
            var me= this;
            this.notificationCallback = callback;
            this.images= [];
            for( var i=0; i<aImages.length; i++ ) {
                this.images.push( {id:aImages[i].id, image: new Image() } );
                this.images[i].image.onload = function imageLoaded() {
                    me.imageCounter++;
                    me.notificationCallback.call(this, me.imageCounter, me.images);
                };
                this.images[i].image.src= aImages[i].url;
            }
        }

    };
})();