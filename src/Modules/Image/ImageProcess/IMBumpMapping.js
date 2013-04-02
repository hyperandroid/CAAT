CAAT.Module({


    /**
     * @name IMBumpMapping
     * @memberOf CAAT.Module.Image.ImageProcessor
     * @extends CAAT.Module.Image.ImageProcessor.ImageProcessor
     * @constructor
     */


    defines : "CAAT.Module.Image.ImageProcess.IMBumpMapping",
    depends : [
        "CAAT.Module.Image.ImageProcess.ImageProcessor"
    ],
    extendsClass : "CAAT.Module.Image.ImageProcess.ImageProcessor",
    extendsWith : {

        /**
         * @lends CAAT.Module.Image.ImageProcessor.IMBumpMapping.prototype
         */

        // bump
        m_avgX:         null,
        m_avgY:         null,
        m_tt:           null,
        phong:          null,

        m_radius:       75,

        m_lightcolor:   null,
        bcolor:         false,
        lightPosition:  [],

        /**
         * Initializes internal bump effect data.
         *
         * @param image {HTMLImageElement}
         * @param radius {number} lights radius.
         *
         * @private
         */
        prepareBump : function(image, radius) {
            var i,j;

            this.m_radius= (radius ? radius : 75);

            var imageData= this.grabPixels(image);

            this.m_tt= this.makeArray(this.height,0);
            for( i=0; i<this.height; i++ ){
                this.m_tt[ i ]=this.width*i;
            }

            this.m_avgX= this.makeArray2D(this.height,this.width,0);
            this.m_avgY= this.makeArray2D(this.height,this.width,0);

            var bump=this.makeArray2D(this.height,this.width,0);

            if ( null===imageData ) {
                return;
            }
            
            var sourceImagePixels= imageData.data;

            for (i=0;i<this.height;i++) {
                for (j=0;j<this.width;j++) {
                    var pos= (i*this.width+j)*4;
                    bump[i][j]=
                        sourceImagePixels[pos  ]+
                        sourceImagePixels[pos+1]+
                        sourceImagePixels[pos+2];
                }
            }

            bump= this.soften( bump );

            for (var x=1;x<this.width-1;x++)    {
                for (var y=1;y<this.height-1;y++)   {
                    this.m_avgX[y][x]=Math.floor(bump[y][x+1]-bump[y][x-1]);
                    this.m_avgY[y][x]=Math.floor(bump[y+1][x]-bump[y-1][x]);
                }
            }

            bump=null;
        },
        /**
         * Soften source images extracted data on prepareBump method.
         * @param bump bidimensional array of black and white source image version.
         * @return bidimensional array with softened version of source image's b&w representation.
         */
        soften : function( bump ) {
            var temp;
            var sbump=this.makeArray2D( this.height,this.width, 0);

            for (var j=0;j<this.width;j++) {
                for (var i=0;i<this.height;i++) {
                    temp=(bump[i][j]);
                    temp+=(bump[(i+1)%this.height][j]);
                    temp+=(bump[(i+this.height-1)%this.height][j]);
                    temp+=(bump[i][(j+1)%this.width]);
                    temp+=(bump[i][(j+this.width-1)%this.width]);
                    temp+=(bump[(i+1)%this.height][(j+1)%this.width]);
                    temp+=(bump[(i+this.height-1)%this.height][(j+this.width-1)%this.width]);
                    temp+=(bump[(i+this.height-1)%this.height][(j+1)%this.width]);
                    temp+=(bump[(i+1)%this.height][(j+this.width-1)%this.width]);
                    temp/=9;
                    sbump[i][j]=temp/3;
                }
            }

            return sbump;
        },
        /**
         * Create a phong image to apply bump effect.
         * @private
         */
        calculatePhong : function( ) {
            this.phong= this.makeArray2D(this.m_radius,this.m_radius,0);

            var i,j,z;
            for( i=0; i<this.m_radius; i++ ) {
                for( j=0; j<this.m_radius; j++ ) {
                    var x= j/this.m_radius;
                    var y= i/this.m_radius;
                    z= (1-Math.sqrt(x*x+y*y))*0.8;
                    if ( z<0 ) {
                        z=0;
                    }
                    this.phong[ i ][ j ]= Math.floor(z*255);
                }
            }
        },
        /**
         * Generates a bump image.
         * @param dstPixels {ImageData.data} destinarion pixel array to store the calculated image.
         */
        drawColored : function(dstPixels)	{
            var i,j,k;
            for( i=0; i<this.height; i++ ) {
                for( j=0; j<this.width; j++ ){

                    var rrr=0;
                    var ggg=0;
                    var bbb=0;

                    for( k=0; k<this.m_lightcolor.length; k++ ) {

                        var lx= this.lightPosition[k].x;
                        var ly= this.lightPosition[k].y;

                        var dx=Math.floor(Math.abs(this.m_avgX[i][j]-j+lx));
                        var dy=Math.floor(Math.abs(this.m_avgY[i][j]-i+ly));

                        if (dx>=this.m_radius) {
                            dx=this.m_radius-1;
                        }
                        if (dy>=this.m_radius) {
                            dy=this.m_radius-1;
                        }

                        var c= this.phong[ dx ] [ dy ];
                        var r=0;
                        var g=0;
                        var b=0;

                        if ( c>=0 ) {// oscurecer
                            r= (this.m_lightcolor[k][0]*c/128);
                            g= (this.m_lightcolor[k][1]*c/128);
                            b= (this.m_lightcolor[k][2]*c/128);
                        }
                        else {			// blanquear.
                            c=128+c;
                            var rr= (this.m_lightcolor[k][0]);
                            var gg= (this.m_lightcolor[k][1]);
                            var bb= (this.m_lightcolor[k][2]);

                            r= Math.floor(rr+ (255-rr)*c/128);
                            g= Math.floor(gg+ (255-gg)*c/128);
                            b= Math.floor(bb+ (255-bb)*c/128);
                        }

                        rrr+=r;
                        ggg+=g;
                        bbb+=b;
                    }

                    if ( rrr>255 ) {
                        rrr=255;
                    }
                    if ( ggg>255 ) {
                        ggg=255;
                    }
                    if ( bbb>255 ) {
                        bbb=255;
                    }

                    var pos= (j+this.m_tt[i])*4;
                    dstPixels[pos  ]= rrr;
                    dstPixels[pos+1]= ggg;
                    dstPixels[pos+2]= bbb;
                    dstPixels[pos+3]= 255;
                }
            }
        },
        /**
         * Sets lights color.
         * @param colors_rgb_array an array of arrays. Each internal array has three integers defining an RGB color.
         * ie:
         *  [
         *     [ 255,0,0 ],
         *     [ 0,255,0 ]
         *  ]
         * @return this
         */
        setLightColors : function( colors_rgb_array ) {
            this.m_lightcolor= colors_rgb_array;
            this.lightPosition= [];
            for( var i=0; i<this.m_lightcolor.length; i++ ) {
                var x= this.width*Math.random();
                var y= this.height*Math.random();
                this.lightPosition.push( new CAAT.Math.Point().set(x,y) );
            }
            return this;
        },
        /**
         * Initialize the bump image processor.
         * @param image {HTMLImageElement} source image to bump.
         * @param radius {number} light radius.
         */
        initialize : function(image,radius) {
            CAAT.Module.Image.ImageProcess.IMBumpMapping.superclass.initialize.call(this,image.width,image.height);

            this.setLightColors(
                    [
                        [255,128,0],
                        [0,0,255]
                    ]);

            this.prepareBump(image,radius);
            this.calculatePhong();

            return this;
        },
        /**
         * Set a light position.
         * @param lightIndex {number} light index to position.
         * @param x {number} light x coordinate.
         * @param y {number} light y coordinate.
         * @return this
         */
        setLightPosition : function( lightIndex, x, y ) {
            this.lightPosition[lightIndex].set(x,y);
            return this;
        },
        /**
         * Applies the bump effect and makes it visible on the canvas surface.
         * @param director {CAAT.Director}
         * @param time {number}
         */
        applyIM : function(director,time) {
            this.drawColored(this.bufferImage);
            return CAAT.Module.Image.ImageProcess.IMBumpMapping.superclass.applyIM.call(this,director,time);
        }
    }

});
