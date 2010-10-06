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

        setInterpolator : function( interpolator ) {
            this.interpolator= interpolator;
            this.contour= interpolator.getContour(this.S);
        },
        paint : function( director, time ) {

            CAAT.InterpolatorActor.superclass.paint.call(this,director,time);

            if ( this.interpolator ) {

                var canvas= director.crc;
                canvas.save();
                canvas.beginPath();
                canvas.moveTo( this.contour[0].x/this.S*this.width, this.height - this.contour[0].y/this.S*this.height );

                for( var i=1; i<this.contour.length; i++ ) {
                    canvas.lineTo( this.contour[i].x * this.width, this.height - this.contour[i].y * this.height );
                }

                canvas.strokeStyle='black';
                canvas.stroke();
                canvas.restore();
            }
        }
    });
})();