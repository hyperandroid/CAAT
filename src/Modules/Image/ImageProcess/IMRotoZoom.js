CAAT.Module({

    /**
     * @name IMRotoZoom
     * @memberOf CAAT.Module.Image.ImageProcessor
     * @extends CAAT.Module.Image.ImageProcessor.ImageProcessor
     * @constructor
     */

    defines : "CAAT.Module.Image.ImageProcess.IMRotoZoom",
    depends : [
        "CAAT.Module.Image.ImageProcess.ImageProcessor"
    ],
    extendsClass : "CAAT.Module.Image.ImageProcess.ImageProcessor",
    extendsWith : {

        /**
         * @lends CAAT.Module.Image.ImageProcessor.IMRotoZoom.prototype
         */

        m_alignv:       1,
        m_alignh:       1,
        distortion:     2,
        mask:           0,
        shift:          0,
        sourceImageData:null,   // pattern to fill area with.

        /**
         * Initialize the rotozoom.
         * @param width {number}
         * @param height {number}
         * @param patternImage {HTMLImageElement} image to tile with.
         *
         * @return this
         */
        initialize : function( width, height, patternImage ) {
            CAAT.Module.Image.ImageProcess.IMRotoZoom.superclass.initialize.call(this,width,height);

            this.clear( 255,128,0, 255 );

            this.sourceImageData= this.grabPixels(patternImage);

            if ( null!==this.sourceImageData ) {
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
        /**
         * Performs the process of tiling rotozoom.
         * @param director {CAAT.Director}
         * @param time {number}
         *
         * @private
         */
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

            var srcwidth=   this.sourceImageData.width;
            var srcheight=  this.sourceImageData.height;
            var srcdata=    this.sourceImageData.data;
            var bi=         this.bufferImage;
            var dstoff;
            var addx;
            var addy;

            while (off < this.width * this.height * 4) {
                addx = i;
                addy = j;

                for (var m = 0; m < this.width; m++) {
                    dstoff = ((addy >> this.shift) & this.mask) * srcwidth + ((addx >> this.shift) & this.mask);
                    dstoff <<= 2;

                    bi[ off++ ] = srcdata[ dstoff++ ];
                    bi[ off++ ] = srcdata[ dstoff++ ];
                    bi[ off++ ] = srcdata[ dstoff++ ];
                    bi[ off++ ] = srcdata[ dstoff++ ];

                    addx += ddx;
                    addy += ddy;

                }

                dist += this.distortion;
                i -= ddy;
                j += ddx - dist;
            }
        },
        /**
         * Perform and apply the rotozoom effect.
         * @param director {CAAT.Director}
         * @param time {number}
         * @return this
         */
        applyIM : function(director,time) {
            if ( null!==this.sourceImageData ) {
                this.rotoZoom(director,time);
            }
            return CAAT.Module.Image.ImageProcess.IMRotoZoom.superclass.applyIM.call(this,director,time);
        },
        /**
         * Change the effect's rotation anchor. Call this method repeatedly to make the effect look
         * different.
         */
        setCenter: function() {
            var d = Math.random();
            if (d < 0.33) {
                this.m_alignv = 0;
            } else if (d < 0.66) {
                this.m_alignv = 1;
            } else {
                this.m_alignv = 2;
            }

            d = Math.random();
            if (d < 0.33) {
                this.m_alignh = 0;
            } else if (d < 0.66) {
                this.m_alignh = 1;
            } else {
                this.m_alignh = 2;
            }
        }

    }
});
