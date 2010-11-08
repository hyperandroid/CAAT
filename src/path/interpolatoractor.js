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
        interpolator:   null,
        contour:        null,
        S:              50,
        gap:            0,

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
                canvas.beginPath();
                canvas.moveTo( this.gap + this.contour[0].x * (this.width-2*this.gap), -this.gap + this.height - this.contour[0].y * (this.height-2*this.gap) );

                for( var i=1; i<this.contour.length; i++ ) {
                    canvas.lineTo( this.gap + this.contour[i].x * (this.width-2*this.gap), -this.gap + this.height - this.contour[i].y * (this.height-2*this.gap) );
                }

                canvas.strokeStyle='black';
                canvas.stroke();
            }
        },
        getInterpolator : function() {
            return this.interpolator;
        }
    });
})();