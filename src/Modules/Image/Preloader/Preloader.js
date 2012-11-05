/**
 * See LICENSE file.
 *
 * Image/Resource preloader.
 *
 *
 **/

CAAT.Module( {
    defines : "CAAT.Module.Preloader.Preloader",
    extendsWith : function() {

        var descriptor= function(id, path, loader) {

            var me= this;

            this.id=    id;
            this.path=  path;
            this.image= new Image();

            this.image.onload = function() {
                loader.__onload(me);
            };

            this.image.onerror= function(e) {
                loader.__onerror(me);
            } ;

            this.load= function() {
                me.image.src= me.path;
            };

            return this;
        };

        return {
            __init : function()   {
                this.elements= [];
                return this;
            },

            elements:       null,   // a list of elements to load
            imageCounter:   0,      // elements counter.
            cfinished:      null,
            cloaded:        null,
            cerrored:       null,
            loadedCount:    0,

            addElement : function( id, path ) {
                this.elements.push( new descriptor(id,path,this) );
                return this;
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

            load: function( onfinished, onload_one, onerror ) {

                this.cfinished= onfinished;
                this.cloaded= onload_one;
                this.cerroed= onerror;

                var i;

                for( i=0; i<this.elements.length; i++ ) {
                    this.elements[i].load();
                }

                return this;
            }
        }
    }
});
