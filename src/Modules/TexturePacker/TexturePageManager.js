/**
 * See LICENSE file.
 */

CAAT.Module({

    /**
     * @name TexturePageManager
     * @memberOf CAAT.Module.TexturePacker
     * @constructor
     */

    defines : "CAAT.Module.TexturePacker.TexturePageManager",
    depends : [
        "CAAT.Module.TexturePacker.TexturePage"
    ],
    extendsWith : {

        /**
         * @lends CAAT.Module.TexturePacker.TexturePageManager.prototype
         */

        __init : function() {
            this.pages= [];
            return this;
        },

        /**
         *
         */
        pages:  null,

        createPages:    function(gl,width,height,imagesCache) {

            var end= false;
            while( !end ) {
                var page= new CAAT.Module.TexturePacker.TexturePage(width,height);
                page.create(imagesCache);
                page.initialize(gl);
                page.endCreation();
                this.pages.push(page);

                end= true;
                for( var i=0; i<imagesCache.length; i++ ) {
                    // imagen sin asociacion de textura
                    if ( !imagesCache[i].image.__texturePage ) {
                        // cabe en la pagina ?? continua con otras paginas.
                        if ( imagesCache[i].image.width<=width && imagesCache[i].image.height<=height ) {
                            end= false;
                        }
                        break;
                    }
                }
            }
        },
        deletePages : function() {
            for( var i=0; i<this.pages.length; i++ ) {
                this.pages[i].deletePage();
            }
            this.pages= null;
        }
    }

});
