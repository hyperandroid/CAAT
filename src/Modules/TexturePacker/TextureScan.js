CAAT.Module({

    /**
     * @name TextureScan
     * @memberOf CAAT.Module.TexturePacker
     * @constructor
     */

    defines : "CAAT.Module.TexturePacker.TextureScan",
    depends : [
        "CAAT.Module.TexturePacker.TextureElement"
    ],
    extendsWith : {

        /**
         * @lends CAAT.Module.TexturePacker.TextureScan.prototype
         */

        __init : function(w) {
            this.freeChunks=[ {position:0, size:w||1024} ];
            return this;
        },

        /**
         *
         */
        freeChunks: null,

        /**
         * return an array of values where a chunk of width size fits in this scan.
         * @param width
         */
        findWhereFits : function( width ) {
            if ( this.freeChunks.length===0 ) {
                return [];
            }

            var fitsOnPosition= [];
            var i;

            for( i=0; i<this.freeChunks.length; i++ ) {
                var pos= 0;
                while( pos+width<= this.freeChunks[i].size ) {
                    fitsOnPosition.push( pos+this.freeChunks[i].position );
                    pos+= width;
                }
            }

            return fitsOnPosition;
        },
        fits : function( position, size ) {
            var i=0;

            for( i=0; i<this.freeChunks.length; i++ ) {
                var fc= this.freeChunks[i];
                if ( fc.position<=position && position+size<=fc.position+fc.size ) {
                    return true;
                }
            }

            return false;
        },
        substract : function( position, size ) {
            var i=0;

            for( i=0; i<this.freeChunks.length; i++ ) {
                var fc= this.freeChunks[i];
                if ( fc.position<=position && position+size<=fc.position+fc.size ) {
                    var lp=0;
                    var ls=0;
                    var rp=0;
                    var rs=0;

                    lp= fc.position;
                    ls= position-fc.position;

                    rp= position+size;
                    rs= fc.position+fc.size - rp;

                    this.freeChunks.splice(i,1);

                    if ( ls>0 ) {
                        this.freeChunks.splice( i++,0,{position: lp, size:ls} );
                    }
                    if ( rs>0 ) {
                        this.freeChunks.splice( i,0,{position: rp, size:rs} );
                    }

                    return true;
                }
            }

            return false;
        },
        log : function(index) {
            if ( 0===this.freeChunks.length ) {
                CAAT.log('index '+index+' empty');
            } else {
                var str='index '+index;
                for( var i=0; i<this.freeChunks.length; i++ ) {
                    var fc= this.freeChunks[i];
                    str+='['+fc.position+","+fc.size+"]";
                }
                CAAT.log(str);
            }
        }
    }
});
