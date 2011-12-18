/**
 * See LICENSE file.
 */

(function() {

    CAAT.modules.ImageUtil= {};

    CAAT.modules.ImageUtil.createAlphaSpriteSheet= function(maxAlpha, minAlpha, sheetSize, image, bg_fill_style ) {

        if ( maxAlpha<minAlpha ) {
            var t= maxAlpha;
            maxAlpha= minAlpha;
            minAlpha= t;
        }

        var canvas= document.createElement('canvas');
        canvas.width= image.width;
        canvas.height= image.height*sheetSize;
        var ctx= canvas.getContext('2d');
        ctx.fillStyle = bg_fill_style ? bg_fill_style : 'rgba(255,255,255,0)';
        ctx.fillRect(0,0,image.width,image.height*sheetSize);

        var i;
        for( i=0; i<sheetSize; i++ ) {
            ctx.globalAlpha= 1-(maxAlpha-minAlpha)/sheetSize*(i+1);
            ctx.drawImage(image, 0, i*image.height);
        }

        return canvas;
    };

        /**
         * Creates a rotated canvas image element.
         * @param img
         */
    CAAT.modules.ImageUtil.rotate= function( image, angle ) {

        angle= angle||0;
        if ( !angle ) {
            return image;
        }

        var canvas= document.createElement("canvas");
        canvas.width= image.height;
        canvas.height= image.width;
        var ctx= canvas.getContext('2d');
        ctx.globalAlpha= 1;
        ctx.fillStyle='rgba(0,0,0,0)';
        ctx.clearRect(0,0,canvas.width,canvas.height);

        var m= new CAAT.Matrix();
        m.multiply( new CAAT.Matrix().setTranslate( canvas.width/2, canvas.width/2 ) );
        m.multiply( new CAAT.Matrix().setRotation( angle*Math.PI/180 ) );
        m.multiply( new CAAT.Matrix().setTranslate( -canvas.width/2, -canvas.width/2 ) );
        m.transformRenderingContext(ctx);
        ctx.drawImage(image,0,0);

        return canvas;
    };

        /**
         * Remove an image's padding transparent border.
         * Transparent means that every scan pixel is alpha=0.
         * @param image
         * @param threshold {integer} any value below or equal to this will be optimized.
         * @param !areas { object{ top<boolean>, bottom<boolean>, left<boolean, right<boolean> }Ê}
         */
    CAAT.modules.ImageUtil.optimize= function(image, threshold, areas ) {
        threshold>>=0;

        var atop=       true;
        var abottom=    true;
        var aleft=      true;
        var aright=     true;
        if ( typeof areas!=='undefined' ) {
            if ( typeof areas.top!=='undefined' ) {
                atop= areas.top;
            }
            if ( typeof areas.bottom!=='undefined' ) {
                abottom= areas.bottom;
            }
            if ( typeof areas.left!=='undefined' ) {
                aleft= areas.left;
            }
            if ( typeof areas.right!=='undefined' ) {
                aright= areas.right;
            }
        }


        var canvas= document.createElement('canvas');
        canvas.width= image.width;
        canvas.height=image.height;
        var ctx= canvas.getContext('2d');

        ctx.fillStyle='rgba(0,0,0,0)';
        ctx.fillRect(0,0,image.width,image.height);
        ctx.drawImage( image, 0, 0 );

        var imageData= ctx.getImageData(0,0,image.width,image.height);
        var data= imageData.data;

        var i,j;
        var miny= 0, maxy=canvas.height-1;
        var minx= 0, maxx=canvas.width-1;

        var alpha= false;

        if ( atop ) {
            for( i=0; i<canvas.height; i++ ) {
                for( j=0; j<canvas.width; j++ ) {
                    if ( data[i*canvas.width*4 + 3+j*4]>threshold ) {
                        alpha= true;
                        break;
                    }
                }

                if ( alpha ) {
                    break;
                }
            }
            // i contiene el indice del ultimo scan que no es transparente total.
            miny= i;
        }

        if ( abottom ) {
            alpha= false;
            for( i=canvas.height-1; i>=miny; i-- ) {
                for( j=0; j<canvas.width; j++ ) {
                    if ( data[i*canvas.width*4 + 3+j*4]>threshold ) {
                        alpha= true;
                        break;
                    }
                }

                if ( alpha ) {
                    break;
                }
            }
            maxy= i;
        }

        if ( aleft ) {
            alpha= false;
            for( j=0; j<canvas.width; j++ ) {
                for( i=miny; i<=maxy; i++ ) {
                    if ( data[i*canvas.width*4 + 3+j*4 ]>threshold ) {
                        alpha= true;
                        break;
                    }
                }
                if ( alpha ) {
                    break;
                }
            }
            minx= j;
        }

        if ( aright ) {
            alpha= false;
            for( j=canvas.width-1; j>=minx; j-- ) {
                for( i=miny; i<=maxy; i++ ) {
                    if ( data[i*canvas.width*4 + 3+j*4 ]>threshold ) {
                        alpha= true;
                        break;
                    }
                }
                if ( alpha ) {
                    break;
                }
            }
            maxx= j;
        }

        if ( 0===minx && 0===miny && canvas.width-1===maxx && canvas.height-1===maxy ) {
            return canvas;
        }

        var width= maxx-minx+1;
        var height=maxy-miny+1;
        var id2= ctx.getImageData( minx, miny, width, height );

        canvas.width= width;
        canvas.height= height;
        ctx= canvas.getContext('2d');
        ctx.putImageData( id2, 0, 0 );

        return canvas;
    };

    CAAT.modules.ImageUtil.createThumb= function(image, w, h, best_fit) {
        w= w||24;
        h= h||24;
        var canvas= document.createElement('canvas');
        canvas.width= w;
        canvas.height= h;
        var ctx= canvas.getContext('2d');

        if ( best_fit ) {
            var max= Math.max( image.width, image.height );
            var ww= image.width/max*w;
            var hh= image.height/max*h;
            ctx.drawImage( image, (w-ww)/2,(h-hh)/2,ww,hh );
        } else {
            ctx.drawImage( image, 0, 0, w, h );
        }

        return canvas;
    }

})();