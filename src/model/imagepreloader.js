/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * Image/Resource preloader.
 *
 * TODO: add imageLoaded callback.
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
                this.images.push( new Image() );
                this.images[i].onload = function imageLoaded() {
                    me.imageCounter++;
                    if (me.imageCounter === me.images.length) {
                        me.notificationCallback.call(me, me.images);
                    }
                }
                this.images[i].src= aImages[i];
            }
        },

        addImage: function addImage(url)  {
            var me= this;
            var img= new Image();
            this.images.push(img);
            img.url= url;
            img.onload= function() {
                me.imageCounter++;
                if (me.imageCounter === me.images.length) {
                    me.notificationCallback.call(me, me.images);
                }
            };
        },

        getLoadedImages: function getLoadedImages() {
            return this.images;
        },

        setCallback: function setCallback(fn) {
            this.imageCounter = 0;
            this.notificationCallback = fn;
            for (var i=0; i<this.images.length; i++) {
                this.images[i].src = this.images[i].url;
            }
        }
    };
})();