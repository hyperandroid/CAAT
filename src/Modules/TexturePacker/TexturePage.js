CAAT.Module( {

    /**
     * @name TexturePage
     * @memberOf CAAT.Module.TexturePacker
     * @constructor
     */


    defines : "CAAT.Module.TexturePacker.TexturePage",
    depends : [
        "CAAT.Module.TexturePacker.TextureScanMap"
    ],
    extendsWith : {

        /**
         * @lends CAAT.Module.TexturePacker.TexturePage.prototype
         */

        __init : function(w,h) {
            this.width=         w || 1024;
            this.height=        h || 1024;
            this.images=        [];

            return this;
        },

        /**
         *
         */
        width:                  1024,

        /**
         *
         */
        height:                 1024,

        /**
         *
         */
        gl:                     null,

        /**
         *
         */
        texture:                null,

        /**
         *
         */
        allowImagesInvertion:   false,

        /**
         *
         */
        padding:                4,

        /**
         *
         */
        scan:                   null,

        /**
         *
         */
        images:                 null,

        /**
         *
         */
        criteria:               'area',

        initialize : function(gl) {
            this.gl= gl;

            // Fix firefox.
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

            this.texture = gl.createTexture();

            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.enable( gl.BLEND );
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

            var uarr= new Uint8Array(this.width*this.height*4);
            for (var jj = 0; jj < 4*this.width*this.height; ) {
                uarr[jj++]=0;
                uarr[jj++]=0;
                uarr[jj++]=0;
                uarr[jj++]=0;
            }
            gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    this.width,
                    this.height,
                    0,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    uarr);

            gl.enable( gl.BLEND );

            for( var i=0; i<this.images.length; i++ ) {

                var img= this.images[i];
                if ( img.inverted ) {
                    img= CAAT.Module.Image.ImageUtil.rotate( img, -90 );
                }

                gl.texSubImage2D(
                        gl.TEXTURE_2D,
                        0,
                        this.images[i].__tx, this.images[i].__ty,
                        gl.RGBA,
                        gl.UNSIGNED_BYTE,
                        img );
            }

        },
        create: function(imagesCache) {

            var images= [];
            for( var i=0; i<imagesCache.length; i++ ) {
                var img= imagesCache[i].image;
                if ( !img.__texturePage ) {
                    images.push( img );
                }
            }

            this.createFromImages(images);
        },
        clear : function() {
            this.createFromImages([]);
        },
        update : function(invert,padding,width,height) {
            this.allowImagesInvertion= invert;
            this.padding= padding;

            if ( width<100 ) {
                width= 100;
            }
            if ( height<100 ) {
                height= 100;
            }

            this.width=  width;
            this.height= height;
            
            this.createFromImages(this.images);
        },
        createFromImages : function( images ) {

            var i;

            this.scan=   new CAAT.Module.TexturePacker.TextureScanMap( this.width, this.height );
            this.images= [];

            if ( this.allowImagesInvertion ) {
                for( i=0; i<images.length; i++ ) {
                    images[i].inverted= this.allowImagesInvertion && images[i].height<images[i].width;
                }
            }

            var me= this;

            images.sort( function(a,b) {

                var aarea= a.width*a.height;
                var barea= b.width*b.height;

                if ( me.criteria==='width' ) {
                    return a.width<b.width ? 1 : a.width>b.width ? -1 : 0;
                } else if ( me.criteria==='height' ) {
                    return a.height<b.height ? 1 : a.height>b.height ? -1 : 0;
                }
                return aarea<barea ? 1 : aarea>barea ? -1 : 0;
            });

            for( i=0; i<images.length; i++ ) {
                var img=  images[i];
                this.packImage(img);
            }
        },
        addImage : function( image, invert, padding ) {
            this.allowImagesInvertion= invert;
            this.padding= padding;
            this.images.push(image);
            this.createFromImages(Array.prototype.slice.call(this.images));
        },
        endCreation : function() {
            var gl= this.gl;
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
            gl.generateMipmap(gl.TEXTURE_2D);
        },
        deletePage : function() {
            for( var i=0; i<this.images.length; i++ ) {
                delete this.images[i].__texturePage;
                delete this.images[i].__u;
                delete this.images[i].__v;
            }

            this.gl.deleteTexture( this.texture );
        },
        toCanvas : function(canvass, outline) {

            canvass= canvass || document.createElement('canvas');
            canvass.width= this.width;
            canvass.height= this.height;
            var ctxx= canvass.getContext('2d');
            ctxx.fillStyle= 'rgba(0,0,0,0)';
            ctxx.fillRect(0,0,this.width,this.height);

            for( var i=0; i<this.images.length; i++ ) {
                ctxx.drawImage(
                        !this.images[i].inverted ?
                                this.images[i] :
                                CAAT.Modules.Image.ImageUtil.rotate( this.images[i], 90 ),
                        this.images[i].__tx,
                        this.images[i].__ty );
                if ( outline ) {
                    ctxx.strokeStyle= 'red';
                    ctxx.strokeRect(
                            this.images[i].__tx,
                            this.images[i].__ty,
                            this.images[i].__w,
                            this.images[i].__h );
                }
            }


            if (outline) {
                ctxx.strokeStyle= 'red';
                ctxx.strokeRect(0,0,this.width,this.height);
            }

            return canvass;
        },
        packImage : function(img) {
            var newWidth, newHeight;
            if ( img.inverted ) {
                newWidth= img.height;
                newHeight= img.width;
            } else {
                newWidth= img.width;
                newHeight= img.height;
            }

            var w= newWidth;
            var h= newHeight;

            var mod;

            // dejamos un poco de espacio para que las texturas no se pisen.
            // coordenadas normalizadas 0..1 dan problemas cuando las texturas no estan
            // alineadas a posicion mod 4,8...
            if ( w && this.padding ) {
                mod= this.padding;
                if ( w+mod<=this.width ) {
                    w+=mod;
                }
            }
            if ( h && this.padding ) {
                mod= this.padding;
                if ( h+mod<=this.height ) {
                    h+=mod;
                }
            }
            
            var where=  this.scan.whereFitsChunk( w, h );
            if ( null!==where ) {
                this.images.push( img );

                img.__tx= where.x;
                img.__ty= where.y;
                img.__u=  where.x / this.width;
                img.__v=  where.y / this.height;
                img.__u1= (where.x+newWidth) / this.width;
                img.__v1= (where.y+newHeight) / this.height;
                img.__texturePage= this;
                img.__w= newWidth;
                img.__h= newHeight;

                this.scan.substract(where.x,where.y,w,h);
            } else {
                CAAT.log('Imagen ',img.src,' de tamano ',img.width,img.height,' no cabe.');
            }
        },
        changeHeuristic : function(criteria) {
            this.criteria= criteria;
        }
    }
});
