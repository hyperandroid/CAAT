CAAT.Module( {

    /**
     * @name StarActor
     * @memberOf CAAT.Foundation.UI
     * @extends CAAT.Foundation.ActorContainer
     * @constructor
     */

    defines : "CAAT.Foundation.UI.StarActor",
    aliases : ["CAAT.StarActor"],
    depends : [
        "CAAT.Foundation.ActorContainer"
    ],
    extendsClass : "CAAT.Foundation.ActorContainer",
    extendsWith : {

        /**
         * @lends CAAT.Foundation.UI.StarActor.prototype
         */

        __init : function() {
            this.__super();
            this.compositeOp= 'source-over';
            return this;
        },

        /**
         * Number of star peaks.
         */
        nPeaks:         0,

        /**
         * Maximum radius.
         */
        maxRadius:      0,

        /**
         * Minimum radius.
         */
        minRadius:      0,

        /**
         * Staring angle in radians.
         */
        initialAngle:   0,

        /**
         * Draw the star with this composite operation.
         */
        compositeOp:    null,

        /**
         *
         */
        lineWidth:      1,

        /**
         *
         */
        lineCap:        null,

        /**
         *
         */
        lineJoin:       null,

        /**
         *
         */
        miterLimit:     null,

        /**
         *
         * @param l {number>0}
         */
        setLineWidth : function(l)  {
            this.lineWidth= l;
            return this;
        },
        /**
         *
         * @param lc {string{butt|round|square}}
         */
        setLineCap : function(lc)   {
            this.lineCap= lc;
            return this;
        },
        /**
         *
         * @param lj {string{bevel|round|miter}}
         */
        setLineJoin : function(lj)  {
            this.lineJoin= lj;
            return this;
        },
        /**
         *
         * @param ml {integer>0}
         */
        setMiterLimit : function(ml)    {
            this.miterLimit= ml;
            return this;
        },
        getLineCap : function() {
            return this.lineCap;
        },
        getLineJoin : function()    {
            return this.lineJoin;
        },
        getMiterLimit : function()  {
            return this.miterLimit;
        },
        getLineWidth : function()   {
            return this.lineWidth;
        },
        /**
         * Sets whether the star will be color filled.
         * @param filled {boolean}
         * @deprecated
         */
        setFilled : function( filled ) {
            return this;
        },
        /**
         * Sets whether the star will be outlined.
         * @param outlined {boolean}
         * @deprecated
         */
        setOutlined : function( outlined ) {
            return this;
        },
        /**
         * Sets the composite operation to apply on shape drawing.
         * @param compositeOp an string with a valid canvas rendering context string describing compositeOps.
         * @return this
         */
        setCompositeOp : function(compositeOp){
            this.compositeOp= compositeOp;
            return this;
        },
        /**
         * 
         * @param angle {number} number in radians.
         */
        setInitialAngle : function(angle) {
            this.initialAngle= angle;
            return this;
        },
        /**
         * Initialize the star values.
         * <p>
         * The star actor will be of size 2*maxRadius.
         *
         * @param nPeaks {number} number of star points.
         * @param maxRadius {number} maximum star radius
         * @param minRadius {number} minimum star radius
         *
         * @return this
         */
        initialize : function(nPeaks, maxRadius, minRadius) {
            this.setSize( 2*maxRadius, 2*maxRadius );

            this.nPeaks= nPeaks;
            this.maxRadius= maxRadius;
            this.minRadius= minRadius;

            return this;
        },
        /**
         * Paint the star.
         *
         * @param director {CAAT.Director}
         * @param timer {number}
         */
        paint : function(director, timer) {

            var ctx=        director.ctx;
            var centerX=    this.width/2;
            var centerY=    this.height/2;
            var r1=         this.maxRadius;
            var r2=         this.minRadius;
            var ix=         centerX + r1*Math.cos(this.initialAngle);
            var iy=         centerY + r1*Math.sin(this.initialAngle);

            ctx.lineWidth= this.lineWidth;
            if ( this.lineCap ) {
                ctx.lineCap= this.lineCap;
            }
            if ( this.lineJoin )    {
                ctx.lineJoin= this.lineJoin;
            }
            if ( this.miterLimit )  {
                ctx.miterLimit= this.miterLimit;
            }

            ctx.globalCompositeOperation= this.compositeOp;

            ctx.beginPath();
            ctx.moveTo(ix,iy);

            for( var i=1; i<this.nPeaks*2; i++ )   {
                var angleStar= Math.PI/this.nPeaks * i + this.initialAngle;
               var rr= (i%2===0) ? r1 : r2;
                var x= centerX + rr*Math.cos(angleStar);
                var y= centerY + rr*Math.sin(angleStar);
                ctx.lineTo(x,y);
            }

            ctx.lineTo(
                centerX + r1*Math.cos(this.initialAngle),
                centerY + r1*Math.sin(this.initialAngle) );

            ctx.closePath();
            
            if ( this.fillStyle ) {
                ctx.fillStyle= this.fillStyle;
                ctx.fill();
            }

            if ( this.strokeStyle ) {
                ctx.strokeStyle= this.strokeStyle;
                ctx.stroke();
            }

        }
    }

});
