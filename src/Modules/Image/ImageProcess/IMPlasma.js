CAAT.Module({

    /**
     * @name IMPlasma
     * @memberOf CAAT.Module.Image.ImageProcessor
     * @extends CAAT.Module.Image.ImageProcessor.ImageProcessor
     * @constructor
     */


    defines : "CAAT.Module.Image.ImageProcess.IMPlasma",
    depends : [
        "CAAT.Module.Image.ImageProcess.ImageProcessor",
        "CAAT.Module.ColorUtil.Color"
    ],
    extendsClass : "CAAT.Module.Image.ImageProcess.ImageProcessor",
    extendsWith : {

        /**
         * @lends CAAT.Module.Image.ImageProcessor.IMPlasma.prototype
         */

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

        /**
         * Initialize the plasma image processor.
         * <p>
         * This image processor creates a color ramp of 256 elements from the colors of the parameter 'colors'.
         * Be aware of color definition since the alpha values count to create the ramp.
         *
         * @param width {number}
         * @param height {number}
         * @param colors {Array.<number>} an array of color values.
         *
         * @return this
         */
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

            this.m_colorMap= CAAT.Module.ColorUtil.Color.makeRGBColorRamp(
                    colors!==null ? colors : this.color,
                    256,
                    CAAT.Module.ColorUtil.Color.RampEnumeration.RAMP_CHANNEL_RGBA_ARRAY );

            this.setB();

            return this;
        },
        /**
         * Initialize internal plasma structures. Calling repeatedly this method will make the plasma
         * look different.
         */
        setB : function() {

            this.b1= Math.random()>0.5;
            this.b2= Math.random()>0.5;
            this.b3= Math.random()>0.5;
            this.b4= Math.random()>0.5;

            this.spd1= Math.floor((Math.random()*3+1)*(Math.random()<0.5?1:-1));
            this.spd2= Math.floor((Math.random()*3+1)*(Math.random()<0.5?1:-1));
            this.spd3= Math.floor((Math.random()*3+1)*(Math.random()<0.5?1:-1));
            this.spd4= Math.floor((Math.random()*3+1)*(Math.random()<0.5?1:-1));

            this.i1= Math.floor((Math.random()*2.4+1)*(Math.random()<0.5?1:-1));
            this.i2= Math.floor((Math.random()*2.4+1)*(Math.random()<0.5?1:-1));
            this.i3= Math.floor((Math.random()*2.4+1)*(Math.random()<0.5?1:-1));
            this.i4= Math.floor((Math.random()*2.4+1)*(Math.random()<0.5?1:-1));
        },
        /**
         * Apply image processing to create the plasma and call superclass's apply to make the result
         * visible.
         * @param director {CAAT.Director}
         * @param time {number}
         *
         * @return this
         */
        apply : function(director,time) {

            var v = 0;
	        this.tpos1 = this.pos1;
	        this.tpos2 = this.pos2;

            var bi= this.bufferImage;
            var cm= this.m_colorMap;
            var wt= this.wavetable;
            var z;
            var cmz;

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

                    z = Math.floor( wt[o1&255] + wt[o2&255] + wt[o3&255] + wt[o4&255] );
                    cmz= cm[z];

                    bi[ v++ ]= cmz[0];
                    bi[ v++ ]= cmz[1];
                    bi[ v++ ]= cmz[2];
                    bi[ v++ ]= cmz[3];

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

            return CAAT.Module.Image.ImageProcess.IMPlasma.superclass.applyIM.call(this,director,time);
        }
    }
});
