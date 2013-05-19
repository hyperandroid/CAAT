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
     * @memberOf CAAT.Module.Preloader
     * @constructor
     */

    defines : "CAAT.Module.Preloader.Preloader",
    extendsWith : function() {

        var descriptor= function(id, path, loader) {

            var me= this;

            this.id=    id;
            this.path=  path;
            this.image= new Image();
            this.loader= loader;

            this.image.onload= this.onload.bind(this);
            this.image.onerror= this.onerror.bind(this);

            return this;
        };

        descriptor.prototype= {
            id : null,
            path : null,
            image : null,
            loader : null,

            onload : function(e) {
                this.loader.__onload(this);
                this.image.onload= null;
                this.image.onerror= null;
            },

            onerror : function(e) {
                this.loader.__onerror(this);
            },

            load : function() {
                this.image.src= this.path;
            },

            clear : function() {
                this.loader= null;

            }
        };

        return {

            /**
             * @lends CAAT.Module.Preloader.Preloader.prototype
             */

            __init : function()   {
                this.elements= [];
                this.baseURL= "";
                return this;
            },

            currentGroup : null,

            /**
             * a list of elements to load.
             * @type {Array.<{ id, image }>}
             */
            elements:       null,

            /**
             * elements counter.
             */
            imageCounter:   0,

            /**
             * Callback finished loading.
             */
            cfinished:      null,

            /**
             * Callback element loaded.
             */
            cloaded:        null,

            /**
             * Callback error loading.
             */
            cerrored:       null,

            /**
             * loaded elements count.
             */
            loadedCount:    0,

            baseURL : null,

            addElement : function( id, path ) {
                this.elements.push( new descriptor(id,this.baseURL+path,this) );
                return this;
            },

            clear : function() {
                for( var i=0; i<this.elements.length; i++ ) {
                    this.elements[i].clear();
                }
                this.elements= null;
            },

            __onload : function( d ) {
                if ( this.cloaded ) {
                    this.cloaded(d.id);
                }

                this.loadedCount++;
                if ( this.loadedCount===this.elements.length ) {
                    if ( this.cfinished ) {
                        this.cfinished( this.elements );
                    }
                }
            },

            __onerror : function( d ) {
                if ( this.cerrored ) {
                    this.cerrored(d.id);
                }
            },

            setBaseURL : function( base ) {
                this.baseURL= base;
                return this;
            },

            load: function( onfinished, onload_one, onerror ) {

                this.cfinished= onfinished;
                this.cloaded= onload_one;
                this.cerrored= onerror;

                var i;

                for( i=0; i<this.elements.length; i++ ) {
                    this.elements[i].load();
                }

                return this;
            }
        }
    }
});
