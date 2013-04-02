/**
 * See LICENSE file.
 *
 **/

CAAT.Module( {

    /**
     * @name InterpolatorActor
     * @memberOf CAAT.Foundation.UI
     * @extends CAAT.Foundation.Actor
     * @constructor
     */

    defines : "CAAT.Foundation.UI.InterpolatorActor",
    aliases : ["CAAT.InterpolatorActor"],
    depends : [
        "CAAT.Foundation.Actor"
    ],
    extendsClass : "CAAT.Foundation.Actor",
    extendsWith : {

        /**
         * @lends CAAT.Foundation.UI.InterpolatorActor.prototype
         */

        /**
         * The interpolator instance to draw.
         * @type {CAAT.Behavior.Interpolator}
         */
        interpolator:   null,

        /**
         * This interpolator´s contour.
         * @type {Array.<CAAT.Math.Point>}
         */
        contour:        null,   // interpolator contour cache

        /**
         * Number of samples to calculate a contour.
         */
        S:              50,     // contour samples.

        /**
         * padding when drawing the interpolator.
         */
        gap:            5,      // border size in pixels.

        /**
         * Sets a padding border size. By default is 5 pixels.
         * @param gap {number} border size in pixels.
         * @return this
         */
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
        /**
         * Paint this actor.
         * @param director {CAAT.Director}
         * @param time {number} scene time.
         */
        paint : function( director, time ) {

            CAAT.InterpolatorActor.superclass.paint.call(this,director,time);

            if ( this.backgroundImage ) {
                return this;
            }

            if ( this.interpolator ) {

                var canvas= director.ctx;

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
        /**
         * Return the represented interpolator.
         * @return {CAAT.Interpolator}
         */
        getInterpolator : function() {
            return this.interpolator;
        }
    }


});
