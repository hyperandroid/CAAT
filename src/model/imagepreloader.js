/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * Image/Resource preloader.
 *
 * 20101010 Hyperandroid
 *  + Added images loading callback
 *  + Removed unnecessary methods 
 *
 *
 **/
(function() {

    CAAT.ImagePreloader = function()   {
        this.images = new Array();
        return this;
    };

    CAAT.ImagePreloader.prototype =   {

        images: null,
        notificationCallback: null,
        imageCounter: 0,

        loadImages: function( aImages, callback ) {
            var me= this;
            this.notificationCallback = callback;
            this.images= [];
            for( var i=0; i<aImages.length; i++ ) {
                this.images.push( {id:aImages[i].id, image: new Image() } );
                this.images[i].image.onload = function imageLoaded() {
                    me.imageCounter++;
                    me.notificationCallback.call(this, me.imageCounter, me.images);
                }
                this.images[i].image.src= aImages[i].url;
            }
        }

    };
})();