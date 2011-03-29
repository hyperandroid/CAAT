
(function() {

    CAAT.GLTextureElement = function() {
        return this;
    };

    CAAT.GLTextureElement.prototype= {
        inverted:   false,
        image:      null,
        u:          0,
        v:          0,
        glTexture:  null
    };

})();

(function() {
    CAAT.GLTextureScan= function(w) {
        this.freeChunks=[ {position:0, size:w||1024} ];
        return this;
    };

    CAAT.GLTextureScan.prototype= {
        freeChunks: null,

        /**
         * return an array of values where a chunk of width size fits in this scan.
         * @param width
         */
        findWhereFits : function( width ) {
            if ( this.freeChunks.length==0 ) {
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
            if ( 0==this.freeChunks.length ) {
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
    };
})();

(function() {
    CAAT.GLTextureScanMap= function(w,h) {
        this.scanMapHeight= h;
        this.scanMapWidth= w;

        this.scanMap= [];
        for( var i=0; i<this.scanMapHeight; i++ ) {
            this.scanMap.push( new CAAT.GLTextureScan(this.scanMapWidth) );
        }

        return this;
    };
    
    CAAT.GLTextureScanMap.prototype= {
        scanMap:        null,
        scanMapWidth:   0,
        scanMapHeight:  0,

        /**
         * Always try to fit a chunk of size width*height pixels from left-top.
         * @param width
         * @param height
         */
        whereFitsChunk : function( width, height ) {

            // trivial rejection:
            if ( width>this.width||height>this.height) {
                return null;
            }

            // find first fitting point
            var i,j,initialPosition= 0;

            while( initialPosition<=this.scanMapHeight-height) {

                // para buscar sitio se buscar‡ un sitio hasta el tama–o de alto del trozo.
                // mas abajo no va a caber.

                // fitHorizontalPosition es un array con todas las posiciones de este scan donde
                // cabe un chunk de tama–o width.
                var fitHorizontalPositions= null;
                var foundPositionOnScan=    false;

                for( ; initialPosition<=this.scanMapHeight-height; initialPosition++ ) {
                    fitHorizontalPositions= this.scanMap[ initialPosition ].findWhereFits( width );

                    // si no es nulo el array de resultados, quiere decir que en alguno de los puntos
                    // nos cabe un trozo de tama–o width.
                    if ( null!=fitHorizontalPositions && fitHorizontalPositions.length>0 ) {
                        foundPositionOnScan= true;
                        break;
                    }
                }

                if ( foundPositionOnScan ) {
                    // j es el scan donde cabe un trozo de tama–o width.
                    // comprobamos desde este scan que en todos los scan verticales cabe el trozo.
                    // se comprueba que cabe en alguno de los tama–os que la rutina de busqueda horizontal
                    // nos ha devuelto antes.

                    var minInitialPosition=Number.MAX_VALUE;
                    for( j=0; j<fitHorizontalPositions.length; j++ ) {
                        var fits= true;
                        for( i=initialPosition; i<initialPosition+height; i++ ) {
                            // hay un trozo que no cabe
                            if ( !this.scanMap[i].fits( fitHorizontalPositions[j], width ) ) {
                                fits= false;
                                break;
                            }
                        }

                        // se ha encontrado un trozo donde la imagen entra.
                        // d.p.m. incluirla en posicion, y seguir con otra.
                        if ( fits ) {
                            return { x: fitHorizontalPositions[j], y: initialPosition };
                        } else {
/*
                            if ( i<minInitialPosition ) {
                                minInitialPosition= i;
                            }
*/
                        }
                    }

                    // cabe en ninguno de los trozos horizontales sugeridos.
                    // avanzar el scan hasta el minimo scan donde no ha cabido el bloque para
                    // las posiciones horizontales sugeridas.
                    // si por alguna extra–a razon (nunca debiera ser), se da como posicion la misma
                    // en que se inicio la busqueda, incrementar para no caer en bucle infinito de
                    // repeticiones.
/*
                    if ( minInitialPosition==initialPosition ) {
                        minInitialPosition++;
                    }
                    initialPosition= minInitialPosition;
*/
                    initialPosition++;
                } else {
                    // no hay sitio en ningun scan.
                    return null;
                }
            }

            // no se ha podido encontrar un area en la textura para un trozo de tama–o width*height
            return null;
        },
        substract : function( x,y, width, height ) {
            for( var i=0; i<height; i++ ) {
                if ( !this.scanMap[i+y].substract(x,width) ) {
                    CAAT.log('Error: removing chunk ',width,height,' at ',x,y);
                }
            }
        },
        log : function() {
            for( var i=0; i<this.scanMapHeight; i++ ) {
                this.scanMap[i].log(i);
            }
        }
    };
})();

(function() {
    CAAT.GLTexturePage= function(w,h) {
        this.width=         w || 1024;
        this.height=        h || 1024;
        this.scan=          new CAAT.GLTextureScanMap( this.width, this.height );
        this.images=        [];

        return this;
    };

    CAAT.GLTexturePage.prototype= {

        width:          1024,
        height:         1024,
        gl:             null,
        texture:        null,

        scan:           null,
        images:         null,

        create: function(gl, imagesCache) {
            this.gl= gl;
            this.texture = gl.createTexture();

            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.enable( gl.BLEND );
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

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

            var i;

            // poner las imagenes normalizadas en alto o ancho.
            // por defecto en alto.
            // ordenar imagenes: 1¼ mas altas, y a igual altura, 1¼ mas anchas.
            imagesCache.sort( function(a,b) {
                var ah= a.image.height;
                var bh= b.image.height;
                if (!(bh-ah)) {
                    return b.image.width-a.image.width;
                } else {
                    return bh-ah;
                }
            });

            for( i=0; i<imagesCache.length; i++ ) {

                var img=  imagesCache[i].image;
                if ( !img.__texturePage ) {
                    var cimg= this.normalizeSize(img);

                    var w= cimg.width;
                    var h= cimg.height;
                    var mod;

                    // dejamos un poco de espacio para que las texturas no se pisen.
                    // coordenadas normalizadas 0..1 dan problemas cuando las texturas no est‡n
                    // alineadas a posici—n mod 4,8...
                    mod= w%4;
                    if ( !mod ) {mod=4;}
                    if ( w+mod<=this.width ) { 
                        w+=mod;
                    }
                    mod= h%4;
                    if ( !mod ) {mod=4;}
                    if ( h+mod<=this.height ) {
                        h+=mod;
                    }

                    var where=  this.scan.whereFitsChunk( w, h );

                    if ( null!=where ) {
                        this.images.push( img );

                        gl.texSubImage2D(gl.TEXTURE_2D, 0, where.x, where.y, gl.RGBA, gl.UNSIGNED_BYTE, cimg );

                        img.__tx= where.x;
                        img.__ty= where.y;
                        img.__u=  where.x / this.width;
                        img.__v=  where.y / this.height;
                        img.__u1= (where.x+cimg.width) / this.width;
                        img.__v1= (where.y+cimg.height) / this.height;
                        img.__texturePage= this;
                        img.__w= cimg.width;
                        img.__h= cimg.height;
                        img.inverted= cimg.inverted;

                        //this.scan.substract(where.x,where.y,cimg.width,cimg.height);
                        this.scan.substract(where.x,where.y,w,h);
                    } else {
                        CAAT.log('Imagen ',img.src,' de tama–o ',img.width,img.height,' no cabe.');
                    }
                }
            }

            gl.enable( gl.BLEND );
        },
        normalizeSize : function(image) {
            //if ( image.height>=image.width) {
                image.inverted= false;
                return image;
            //}
/* Take into account when rotating images for TexturePacking algorithm
            var canvas= document.createElement("canvas");
            canvas.width= image.height;
            canvas.height= image.width;

            var ctx= canvas.getContext('2d');
            ctx.globalAlpha= .0;
            ctx.fillStyle='rgba(0,0,0,0)';
            ctx.clearRect(0,0,canvas.width,canvas.height);

            var m= new CAAT.Matrix();
            m.multiply( new CAAT.Matrix().setTranslate( canvas.width/2, canvas.width/2 ) );
            m.multiply( new CAAT.Matrix().setRotation(Math.PI/2) );
            m.multiply( new CAAT.Matrix().setTranslate( -canvas.width/2, -canvas.width/2 ) );
            m.transformRenderingContext(ctx);
            ctx.drawImage(image,0,0);

            canvas.inverted= true;

            return canvas;
*/
        },
        endCreation : function() {
            var gl= this.gl;

//            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
//            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
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
        }
    };
})();

(function() {
    CAAT.GLTexturePageManager= function() {
        this.pages= [];
        return this;
    };

    CAAT.GLTexturePageManager.prototype= {

        pages:  null,
        createPages:    function(gl,width,height,imagesCache) {

            var end= false;
            while( !end ) {
                var page= new CAAT.GLTexturePage(width,height);
                page.create(gl,imagesCache);
                page.endCreation();
                this.pages.push(page);

                end= true;
                for( var i=0; i<imagesCache.length; i++ ) {
                    // imagen sin asociacion de textura
                    if ( !imagesCache[i].image.__texturePage ) {
                        // cabe en la pagina ?? continua con otras paginas.
                        if ( imagesCache[i].image.width<=width && imagesCache[i].height<=height ) {
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

})();