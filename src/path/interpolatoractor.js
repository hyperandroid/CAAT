/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * Interpolator actor will draw interpolators on screen.
 *
 **/
(function() {
    CAAT.InterpolatorActor = function() {
        CAAT.InterpolatorActor.superclass.constructor.call(this);
        return this;
    };

    extend( CAAT.InterpolatorActor, CAAT.Actor, {
        interpolator:   null,   // CAAT.Interpolator instance.
        contour:        null,   // interpolator contour cache
        S:              50,     // contour samples.
        gap:            5,      // border size in pixels.

        setGap : function( gap ) {
            this.gap= gap;
            return this;
        },
        /**
         * Sets the CAAT.Interpolator instance to draw.
         *
         * @param interpolator a CAAT.Interpolator instance.
         * @param size an integer indicating the number of polyline segments so draw to show the CAAT.Interpolator
         * instance.
         *
         * @return this
         */
        setInterpolator : function( interpolator, size ) {
            this.interpolator= interpolator;
            this.contour= interpolator.getContour(size || this.S);

            return this;
        },
        paint : function( director, time ) {

            CAAT.InterpolatorActor.superclass.paint.call(this,director,time);            

            if ( this.interpolator ) {

                var canvas= director.crc;

                var xs= (this.width-2*this.gap);
                var ys= (this.height-2*this.gap);

                canvas.beginPath();
                canvas.moveTo(
                        this.gap +  xs*this.contour[0].x,
                        -this.gap + this.height - ys*this.contour[0].y);

                for( var i=1; i<this.contour.length; i++ ) {
                    canvas.lineTo(
                             this.gap + xs*this.contour[i].x,
                            -this.gap + this.height - ys*this.contour[i].y);
                }

                canvas.strokeStyle= this.strokeStyle;
                canvas.stroke();
            }
        },
        getInterpolator : function() {
            return this.interpolator;
        }
    });
})();