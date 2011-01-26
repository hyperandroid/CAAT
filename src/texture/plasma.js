/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * This file contains some image processing effects.
 * Currently contains the following out-of-the-box effects:
 *
 *  + IMPlasma:     creates a plasma texture. The plasma is generated out of a color ramp (see color.js file)
 *  + IMBump:       creates a realtime bump-mapping from a given image. It supports multiple light sources
 *                  as well as different light colors.
 *  + IMRotoZoom:   produces a roto zoom effect out of a given square sized image. Image must be 2^n in size.
 *
 * This class must be used as fillStyle for an actor or any element that will be painted in a canvas context.
 *
 */

(function() {
    CAAT.ImageProcessor= function() {
        return this;
    };

    CAAT.ImageProcessor.prototype= {
        canvas:     null,
        ctx:        null,
        width:      0,
        height:     0,
        imageData:  null,
        bufferImage:null,

        /**
         * Grabs an image pixels.
         *
         * @param image
         */
        grabPixels : function(image) {
            var canvas= document.createElement('canvas');
            if ( canvas!=null ) {
                canvas.width= image.width;
                canvas.height= image.height;
                var ctx= canvas.getContext('2d');
                ctx.drawImage(image,0,0);
                try {
                    var imageData= ctx.getImageData(0,0,canvas.width,canvas.height);
                }
                catch(e) {
                    CAAT.log('error pixelgrabbing.');
                    return null;
                }
                return imageData;
            }
            return null;
        },
        /**
         * Helper method to create an array.
         *
         * @param size number of elements in the array.
         * @param initValue initial array values.
         */
        makeArray : function(size, initValue) {
            var a= [];

            for(var i=0; i<size; i++ )  {
                a.push( initValue );
            }

            return a;
        },
        /**
         * Helper method to create a bidimensional array.
         *
         * @param size number of array rows.
         * @param size2 number of array columns.
         * @param initvalue array initial values.
         */
        makeArray2D : function (size, size2, initvalue)  {
            var a= [];

            for( var i=0; i<size; i++ ) {
                a.push( this.makeArray(size2,initvalue) );
            }

            return a;
        },
        /**
         * Initializes and creates an offscreen Canvas object.
         * @param width canvas width.
         * @param height canvas height.
         */
        initialize : function(width,height) {

            this.width=  width;
            this.height= height;

            this.canvas= document.createElement('canvas');
            if ( this.canvas!=null ) {
                this.canvas.width= width;
                this.canvas.height= height;
                this.ctx= this.canvas.getContext('2d');
                this.imageData= this.ctx.getImageData(0,0,width,height);
                this.bufferImage= this.imageData.data;
            }

            return this;
        },
        clear : function( r,g,b,a ) {
            var data= this.imageData.data;
            for( var i=0; i<this.width*this.height; i++ ) {
                data[i*4+0]= r;
                data[i*4+1]= g;
                data[i*4+2]= b;
                data[i*4+3]= a;
            }
        },
        getImageData : function() {
            return this.ctx.getImageData(0,0,this.width,this.height);
        },
        /**
         * Sets canvas pixels to be the applied effect.
         * @param director
         * @param time
         */
        apply : function(director, time) {
            this.ctx.putImageData(this.imageData, 0, 0);
            return this;
        },
        /**
         * Returns the offscreen canvas.
         */
        getCanvas : function() {
            return this.canvas;
        },
        /**
         * Creates a pattern that will make this ImageProcessor object suitable as a fillStyle value.
         * This effect can be drawn too as an image by calling: canvas_context.drawImage methods.
         * @param type the pattern type. if no value is supplied 'repeat' will be used.
         */
        createPattern : function( type ) {
            return this.ctx.createPattern(this.canvas,type ? type : 'repeat');
        }
    };

})();

(function() {

    CAAT.IMPlasma= function() {
        CAAT.IMPlasma.superclass.constructor.call(this);
        return this;
    };

    extend( CAAT.IMPlasma, CAAT.ImageProcessor, {
        wavetable: null,
        m_colorMap: null,
        spd1: 1,
        spd2: 2,
        spd3: 3,
        spd4: 4,
        pos1: 0,
        pos2: 0,
        pos3: 0,
        pos4: 0,
        tpos1: 0,
        tpos2: 0,
        tpos3: 0,
        tpos4: 0,
        m_colorMapSize: 256,
        i1: 0,
        i2: 0,
        i3: 0,
        i4: 0,
        b1: false,
        b2: false,
        b3: false,
        b4: false,

        color: [0xffffffff, 0xffff00ff, 0xffffff00, 0xff00ff00, 0xffff0000, 0xff0000ff, 0xff000000],

        initialize : function(width,height,colors) {
            CAAT.IMPlasma.superclass.initialize.call(this,width,height);

            this.wavetable= [];
            for (var x=0; x<256; x++)   {
                this.wavetable.push( Math.floor(32 * (1 + Math.cos(x*2 * Math.PI / 256))) );
            }

            this.pos1=Math.floor(255*Math.random());
            this.pos2=Math.floor(255*Math.random());
            this.pos3=Math.floor(255*Math.random());
            this.pos4=Math.floor(255*Math.random());

            this.m_colorMap= CAAT.ColorUtils.prototype.makeRGBColorRamp(
                    colors!=null ? colors : this.color,
                    256,
                    CAAT.ColorUtils.prototype.RAMP_CHANNEL_RGBA_ARRAY );

            this.setB();

            return this;
        },
        setB : function() {

            this.b1= Math.random()>.5;
            this.b2= Math.random()>.5;
            this.b3= Math.random()>.5;
            this.b4= Math.random()>.5;

            this.spd1= Math.floor((Math.random()*3+1)*(Math.random()<.5?1:-1));
            this.spd2= Math.floor((Math.random()*3+1)*(Math.random()<.5?1:-1));
            this.spd3= Math.floor((Math.random()*3+1)*(Math.random()<.5?1:-1));
            this.spd4= Math.floor((Math.random()*3+1)*(Math.random()<.5?1:-1));

            this.i1= Math.floor((Math.random()*2.4+1)*(Math.random()<.5?1:-1));
            this.i2= Math.floor((Math.random()*2.4+1)*(Math.random()<.5?1:-1));
            this.i3= Math.floor((Math.random()*2.4+1)*(Math.random()<.5?1:-1));
            this.i4= Math.floor((Math.random()*2.4+1)*(Math.random()<.5?1:-1));
        },
        apply : function(director,time) {

            var v = 0;
	        this.tpos1 = this.pos1;
	        this.tpos2 = this.pos2;

	        for (var x=0; x<this.height; x++) {
                this.tpos3 = this.pos3;
                this.tpos4 = this.pos4;

                for(var y=0; y<this.width; y++) {
                    // mix at will, or at your own risk.
                    var o1= this.tpos1+this.tpos2+this.tpos3;
                    var o2= this.tpos2+this.tpos3-this.tpos1;
                    var o3= this.tpos3+this.tpos4-this.tpos2;
                    var o4= this.tpos4+this.tpos1-this.tpos2;

                    // set different directions. again, change at will.
                    if ( this.b1 ) o1= -o1;
                    if ( this.b2 ) o2= -o2;
                    if ( this.b3 ) o3= -o3;
                    if ( this.b4 ) o4= -o4;

                    var z = Math.floor(
                        this.wavetable[o1&255] +
                        this.wavetable[o2&255] +
                        this.wavetable[o3&255] +
                        this.wavetable[o4&255] );

                    this.bufferImage[ v++ ]= this.m_colorMap[z][0];
                    this.bufferImage[ v++ ]= this.m_colorMap[z][1];
                    this.bufferImage[ v++ ]= this.m_colorMap[z][2];
                    this.bufferImage[ v++ ]= this.m_colorMap[z][3];

                    this.tpos3 += this.i1;
                    this.tpos3&=255;
                    this.tpos4 += this.i2;
                    this.tpos4&=255;
                }

                this.tpos1 += this.i3;
                this.tpos1&=255;
                this.tpos2 += this.i4;
                this.tpos2&=255;
            }

            this.pos1 += this.spd1;
            this.pos2 -= this.spd2;
            this.pos3 += this.spd3;
            this.pos4 -= this.spd4;
            this.pos1&=255;
            this.pos3&=255;
            this.pos2&=255;
            this.pos4&=255;

            return CAAT.IMPlasma.superclass.apply.call(this,director,time);
        }
    });

})();

(function() {
    CAAT.IMBump=function() {
        CAAT.IMBump.superclass.constructor.call(this);
        return this;
    };

    extend( CAAT.IMBump, CAAT.ImageProcessor, {

        // bump
        m_avgX:         null,
        m_avgY:         null,
        m_tt:           null,
        phong:          null,

        m_radius:       75,

        m_lightcolor:   null,
        bcolor:         false,
        lightPosition:  [],


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

            if ( null==imageData ) {
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
        calculatePhong : function( ) {
            this.phong= this.makeArray2D(this.m_radius,this.m_radius,0);

            var i,j,z;
            for( i=0; i<this.m_radius; i++ ) {
                for( j=0; j<this.m_radius; j++ ) {
                    var x= j/this.m_radius;
                    var y= i/this.m_radius;
                    z= (1-Math.sqrt(x*x+y*y))*.8;
                    if ( z<0 ) {
                        z=0;
                    }
                    this.phong[ i ][ j ]= Math.floor(z*255);
                }
            }
        },
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
         */
        setLightColors : function( colors_rgb_array ) {
            this.m_lightcolor= colors_rgb_array;
            this.lightPosition= [];
            for( var i=0; i<this.m_lightcolor.length; i++ ) {
                var x= this.width*Math.random();
                var y= this.height*Math.random();
                this.lightPosition.push( new CAAT.Point().set(x,y) );
            }
            return this;
        },
        initialize : function(image,radius) {
            CAAT.IMBump.superclass.initialize.call(this,image.width,image.height);

            this.setLightColors(
                    [
                        [255,128,0],
                        [0,0,255]
                    ]);

            this.prepareBump(image,radius);
            this.calculatePhong();

            return this;
        },
        setLightPosition : function( lightIndex, x, y ) {
            this.lightPosition[lightIndex].set(x,y);
            return this;
        },
        apply : function(director,time) {
            this.drawColored(this.bufferImage);
            return CAAT.IMBump.superclass.apply.call(this,director,time);
        }
    });
})();

(function() {
    CAAT.IMRotoZoom= function() {
        CAAT.IMRotoZoom.superclass.constructor.call(this);
        return this;
    };

    extend( CAAT.IMRotoZoom, CAAT.ImageProcessor, {
        m_alignv:       1,
        m_alignh:       1,
        distortion:     2,
        mask:           0,
        shift:          0,
        sourceImageData:null,   // pattern to fill area with.

        initialize : function( width, height, patternImage ) {
            CAAT.IMRotoZoom.superclass.initialize(width,height);

            this.clear( 255,128,0, 255 );

            this.sourceImageData= this.grabPixels(patternImage);

            if ( null!=this.sourceImageData ) {
                // patternImage must be 2^n sized.
                switch( this.sourceImageData.width ) {
                    case 1024:
                        this.mask=1023;
                        this.shift=10;
                        break;
                    case 512:
                        this.mask=511;
                        this.shift=9;
                        break;
                    case 256:
                        this.mask=255;
                        this.shift=8;
                        break;
                    case 128:
                        this.mask=127;
                        this.shift=7;
                        break;
                    case 64:
                        this.mask=63;
                        this.shift=6;
                        break;
                    case 32:
                        this.mask=31;
                        this.shift=5;
                        break;
                    case 16:
                        this.mask=15;
                        this.shift=4;
                        break;
                    case 8:
                        this.mask=7;
                        this.shift=3;
                        break;
                }
            }

            this.setCenter();

            return this;
        },

        rotoZoom: function(director,time)  {

            var timer = new Date().getTime();

            var angle=Math.PI*2 * Math.cos(timer * 0.0001);
            var distance= 600+ 550*Math.sin(timer*0.0002);

            var dist= this.distortion;

            var off=0;
            var ddx=Math.floor(Math.cos(angle)*distance);
            var ddy=Math.floor(Math.sin(angle)*distance);

            var hh=0, ww=0;

            switch( this.m_alignh )	{
                case 0:
                    hh = 0;
                    break;
                case 1:
                    hh = (this.height >> 1);
                    break;
                case 2:
                    hh = this.height - 1;
                    break;
            }

            switch (this.m_alignv) {
                case 0:
                    ww = 0;
                    break;
                case 1:
                    ww = (this.width >> 1);
                    break;
                case 2:
                    ww = this.width - 1;
                    break;
            }

            var i = (((this.width >> 1) << 8)  - ddx * ww + ddy * hh)&0xffff;
            var j = (((this.height >> 1) << 8) - ddy * ww - ddx * hh) & 0xffff;

            var srcwidth= this.sourceImageData.width;
            var srcheight= this.sourceImageData.height;
            var srcdata= this.sourceImageData.data;

            while (off < this.width * this.height * 4) {
                var addx = i;
                var addy = j;

                for (var m = 0; m < this.width; m++) {
                    var dstoff = ((addy >> this.shift) & this.mask) * srcwidth + ((addx >> this.shift) & this.mask);
                    dstoff <<= 2;

                    this.bufferImage[ off++ ] = srcdata[ dstoff++ ];
                    this.bufferImage[ off++ ] = srcdata[ dstoff++ ];
                    this.bufferImage[ off++ ] = srcdata[ dstoff++ ];
                    this.bufferImage[ off++ ] = srcdata[ dstoff++ ];

                    addx += ddx;
                    addy += ddy;

                }

                dist += this.distortion;
                i -= ddy;
                j += ddx - dist;
            }
        },
        apply : function(director,time) {
            if ( null!=this.sourceImageData ) {
                this.rotoZoom(director,time);
            }
            return CAAT.IMRotoZoom.superclass.apply.call(this,director,time);
        },
        setCenter: function() {
            var d = Math.random();
            if (d < .33) {
                this.m_alignv = 0;
            } else if (d < .66) {
                this.m_alignv = 1;
            } else {
                this.m_alignv = 2;
            }

            d = Math.random();
            if (d < .33) {
                this.m_alignh = 0;
            } else if (d < .66) {
                this.m_alignh = 1;
            } else {
                this.m_alignh = 2;
            }
        }

    });

})();