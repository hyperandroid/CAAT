/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * Generate interpolator.
 *
 * Partially based on Robert Penner easing equations.
 * http://www.robertpenner.com/easing/
 *
 *
 **/

/**
 * a CAAT.Interpolator is a function which transforms a value into another.
 * It has some constraints:
 *
 * <ul>
 * <li>The input values must be between 0 and 1.
 * <li>Output values will be between 0 and 1.
 * <li>Every Interpolator has at least an entering boolean parameter called pingpong. if set to true, the Interpolator
 * will set values from 0..1 and back from 1..0. So half the time for each range.
 * </ul>
 *
 * CAAt.Interpolator is defined by a createXXXX method which sets up an internal getPosition(time) function.
 * You could set as an Interpolator up any object which exposes a method getPosition(time) and returns a CAAT.Point or
 * an object of the form {x:float, y:float}. x value will be the same value as that of the time parameter, and y will hold
 * a value between 0 and 1 indicating the resulting value for the parameter time.
 *
 */
(function() {
    CAAT.Interpolator = function() {
        this.interpolated= new CAAT.Point();
        return this;
    };

    CAAT.Interpolator.prototype= {

        interpolated:   null,   // a coordinate holder for not building a new CAAT.Point for each interpolation call.
        paintScale:     90,     // the size of the interpolation draw on screen in pixels.

        /**
         * @param bPingPong
         * @param bInverse values will be from 1 to 0.
         */
        createLinearInterpolator : function(bPingPong, bInverse) {
            this.getPosition= function getPosition(time) {

                var orgTime= time;

                if ( bPingPong ) {
                    if ( time<.5 ) {
                        time*=2;
                    } else {
                        time= 1-(time-.5)*2;
                    }
                }

                if ( bInverse!=null && bInverse ) {
                    time= 1-time;
                }

                return this.interpolated.set(orgTime,time);
            };

            return this;
        },
        createBackOutInterpolator : function(bPingPong) {
            this.getPosition= function getPosition(time) {
                var orgTime= time;

                if ( bPingPong ) {
                    if ( time<.5 ) {
                        time*=2;
                    } else {
                        time= 1-(time-.5)*2;
                    }
                }

                time = time - 1;
                var overshoot= 1.70158;

                return this.interpolated.set(
                        orgTime,
                        time * time * ((overshoot + 1) * time + overshoot) + 1);
            };

            return this;
        },
        createExponentialInInterpolator : function(exponent, bPingPong) {
            this.getPosition= function getPosition(time) {
                var orgTime= time;

                if ( bPingPong ) {
                    if ( time<.5 ) {
                        time*=2;
                    } else {
                        time= 1-(time-.5)*2;
                    }
                }
                return this.interpolated.set(orgTime,Math.pow(time,exponent));
            };

            return this;
        },
        createExponentialOutInterpolator : function(exponent, bPingPong) {
            this.getPosition= function getPosition(time) {
                var orgTime= time;

                if ( bPingPong ) {
                    if ( time<.5 ) {
                        time*=2;
                    } else {
                        time= 1-(time-.5)*2;
                    }
                }
                return this.interpolated.set(orgTime,1-Math.pow(1-time,exponent));
            };

            return this;
        },
        createExponentialInOutInterpolator : function(exponent, bPingPong) {
            this.getPosition= function getPosition(time) {
                var orgTime= time;

                if ( bPingPong ) {
                    if ( time<.5 ) {
                        time*=2;
                    } else {
                        time= 1-(time-.5)*2;
                    }
                }
                if ( time*2<1 ) {
                    return this.interpolated.set(orgTime,Math.pow(time*2,exponent)/2);
                }
                
                return this.interpolated.set(orgTime,1-Math.abs(Math.pow(time*2-2,exponent))/2);
            };

            return this;
        },

        createQuadricBezierInterpolator : function(p0,p1,p2,bPingPong) {
            this.getPosition= function getPosition(time) {
                var orgTime= time;

                if ( bPingPong ) {
                    if ( time<.5 ) {
                        time*=2;
                    } else {
                        time= 1-(time-.5)*2;
                    }
                }

                time= (1-time)*(1-time)*p0.y + 2*(1-time)*time*p1.y + time*time*p2.y;

                return this.interpolated.set( orgTime, time );
            };

            return this;
        },
        createQubicBezierInterpolator : function(p0,p1,p2,p3,bPingPong) {
            this.getPosition= function getPosition(time) {
                var orgTime= time;

                if ( bPingPong ) {
                    if ( time<.5 ) {
                        time*=2;
                    } else {
                        time= 1-(time-.5)*2;
                    }
                }

                var t2= time*time;
                var t3= time*t2;

                time = (p0.y + time * (-p0.y * 3 + time * (3 * p0.y -
                        p0.y * time))) + time * (3 * p1.y + time * (-6 * p1.y +
                        p1.y * 3 * time)) + t2 * (p2.y * 3 - p2.y * 3 * time) +
                        p3.y * t3;

                return this.interpolated.set( orgTime, time );
            };

            return this;
        },
        createElasticOutInterpolator : function(amplitude,p,bPingPong) {
            this.getPosition= function getPosition(time) {

            if ( bPingPong ) {
                if ( time<.5 ) {
                    time*=2;
                } else {
                    time= 1-(time-.5)*2;
                }
            }

            if (time == 0) {
                return {x:0,y:0};
            }
            if (time == 1) {
                return {x:1,y:1};
            }

            var s = p/(2*Math.PI) * Math.asin (1/amplitude);
            return this.interpolated.set(
                    time,
                    (amplitude*Math.pow(2,-10*time) * Math.sin( (time-s)*(2*Math.PI)/p ) + 1 ) );
            };
            return this;
        },
        createElasticInInterpolator : function(amplitude,p,bPingPong) {
            this.getPosition= function getPosition(time) {

            if ( bPingPong ) {
                if ( time<.5 ) {
                    time*=2;
                } else {
                    time= 1-(time-.5)*2;
                }
            }

            if (time == 0) {
                return {x:0,y:0};
            }
            if (time == 1) {
                return {x:1,y:1};
            }

            var s = p/(2*Math.PI) * Math.asin (1/amplitude);
            return this.interpolated.set(
                    time,
                    -(amplitude*Math.pow(2,10*(time-=1)) * Math.sin( (time-s)*(2*Math.PI)/p ) ) );
            };

            return this;
        },
        createElasticInOutInterpolator : function(amplitude,p,bPingPong) {
            this.getPosition= function getPosition(time) {

            if ( bPingPong ) {
                if ( time<.5 ) {
                    time*=2;
                } else {
                    time= 1-(time-.5)*2;
                }
            }

            var s = p/(2*Math.PI) * Math.asin (1/amplitude);
            time*=2;
            if ( time<=1 ) {
                return this.interpolated.set(
                        time,
                        -.5*(amplitude*Math.pow(2,10*(time-=1)) * Math.sin( (time-s)*(2*Math.PI)/p )));
            }

            return this.interpolated.set(
                    time,
                    1+.5*(amplitude*Math.pow(2,-10*(time-=1)) * Math.sin( (time-s)*(2*Math.PI)/p )));
            };

            return this;
        },
        /**
         * Private method.
         * @param time
         */
        bounce : function(time) {
            if ((time /= 1) < (1 / 2.75)) {
                return {x:time, y:7.5625 * time * time};
            } else if (time < (2 / 2.75)) {
                return {x:time, y:7.5625 * (time -= (1.5 / 2.75)) * time + 0.75};
            } else if (time < (2.5 / 2.75)) {
                return {x:time, y:7.5625 * (time -= (2.25 / 2.75)) * time + 0.9375};
            } else {
                return {x:time, y:7.5625*(time-=(2.625/2.75))*time+0.984375};
            }
        },
        createBounceOutInterpolator : function(bPingPong) {
            this.getPosition= function getPosition(time) {
                if ( bPingPong ) {
                    if ( time<.5 ) {
                        time*=2;
                    } else {
                        time= 1-(time-.5)*2;
                    }
                }
                return this.bounce(time);
            };

            return this;
        },
        createBounceInInterpolator : function(bPingPong) {

            this.getPosition= function getPosition(time) {
                if ( bPingPong ) {
                    if ( time<.5 ) {
                        time*=2;
                    } else {
                        time= 1-(time-.5)*2;
                    }
                }
                var r= this.bounce(1-time);
                r.y= 1-r.y;
                return r;
            };

            return this;
        },
        createBounceInOutInterpolator : function(bPingPong) {

            this.getPosition= function getPosition(time) {
                if ( bPingPong ) {
                    if ( time<.5 ) {
                        time*=2;
                    } else {
                        time= 1-(time-.5)*2;
                    }
                }

                var r;
                if (time < 0.5) {
                    r= this.bounce(1 - time * 2);
                    r.y= (1 - r.y)* 0.5;
                    return r;
                }
                r= this.bounce(time * 2 - 1,bPingPong);
                r.y= r.y* 0.5 + 0.5;
                return r;
            };

            return this;
        },
        /**
         * Paints an interpolator on screen.
         * @param director a CAAT.Director instance.
         * @param time an integer indicating the scene time the Interpolator will be drawn at. This value is useless.
         */
        paint : function(director,time) {

            var canvas= director.crc;
            canvas.save();
            canvas.beginPath();

            canvas.moveTo( 0, this.getPosition(0).y * this.paintScale );

            for( var i=0; i<=this.paintScale; i++ ) {
                canvas.lineTo( i, this.getPosition(i/this.paintScale).y * this.paintScale );
            }

            canvas.strokeStyle='black';
            canvas.stroke();
            canvas.restore();
        },
        /**
         * Gets an array of coordinates which define the polyline of intepolator's curve contour.
         * Values for both coordinates range from 0 to 1. 
         * @param iSize an integer indicating the number of contour segments.
         * @return array of object of the form {x:float, y:float}.
         */
        getContour : function(iSize) {
            var contour=[];
            for( var i=0; i<=iSize; i++ ) {
                contour.push( {x: i/iSize, y: this.getPosition(i/iSize).y} );
            }

            return contour;
        }
    };
})();

