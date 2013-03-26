/**
 * See LICENSE file.
 *
 * Partially based on Robert Penner easing equations.
 * http://www.robertpenner.com/easing/
 *
 *
 **/

CAAT.Module({

    /**
     * @name Interpolator
     * @memberOf CAAT.Behavior
     * @constructor
     */

    defines:"CAAT.Behavior.Interpolator",
    depends:["CAAT.Math.Point"],
    aliases:["CAAT.Interpolator"],
    constants : {
        /**
         * @lends CAAT.Behavior.Interpolator
         */

        enumerateInterpolators: function () {
            return [
                new CAAT.Behavior.Interpolator().createLinearInterpolator(false, false), 'Linear pingpong=false, inverse=false',
                new CAAT.Behavior.Interpolator().createLinearInterpolator(true, false), 'Linear pingpong=true, inverse=false',

                new CAAT.Behavior.Interpolator().createBackOutInterpolator(false), 'BackOut pingpong=true, inverse=false',
                new CAAT.Behavior.Interpolator().createBackOutInterpolator(true), 'BackOut pingpong=true, inverse=true',

                new CAAT.Behavior.Interpolator().createLinearInterpolator(false, true), 'Linear pingpong=false, inverse=true',
                new CAAT.Behavior.Interpolator().createLinearInterpolator(true, true), 'Linear pingpong=true, inverse=true',

                new CAAT.Behavior.Interpolator().createExponentialInInterpolator(2, false), 'ExponentialIn pingpong=false, exponent=2',
                new CAAT.Behavior.Interpolator().createExponentialOutInterpolator(2, false), 'ExponentialOut pingpong=false, exponent=2',
                new CAAT.Behavior.Interpolator().createExponentialInOutInterpolator(2, false), 'ExponentialInOut pingpong=false, exponent=2',
                new CAAT.Behavior.Interpolator().createExponentialInInterpolator(2, true), 'ExponentialIn pingpong=true, exponent=2',
                new CAAT.Behavior.Interpolator().createExponentialOutInterpolator(2, true), 'ExponentialOut pingpong=true, exponent=2',
                new CAAT.Behavior.Interpolator().createExponentialInOutInterpolator(2, true), 'ExponentialInOut pingpong=true, exponent=2',

                new CAAT.Behavior.Interpolator().createExponentialInInterpolator(4, false), 'ExponentialIn pingpong=false, exponent=4',
                new CAAT.Behavior.Interpolator().createExponentialOutInterpolator(4, false), 'ExponentialOut pingpong=false, exponent=4',
                new CAAT.Behavior.Interpolator().createExponentialInOutInterpolator(4, false), 'ExponentialInOut pingpong=false, exponent=4',
                new CAAT.Behavior.Interpolator().createExponentialInInterpolator(4, true), 'ExponentialIn pingpong=true, exponent=4',
                new CAAT.Behavior.Interpolator().createExponentialOutInterpolator(4, true), 'ExponentialOut pingpong=true, exponent=4',
                new CAAT.Behavior.Interpolator().createExponentialInOutInterpolator(4, true), 'ExponentialInOut pingpong=true, exponent=4',

                new CAAT.Behavior.Interpolator().createExponentialInInterpolator(6, false), 'ExponentialIn pingpong=false, exponent=6',
                new CAAT.Behavior.Interpolator().createExponentialOutInterpolator(6, false), 'ExponentialOut pingpong=false, exponent=6',
                new CAAT.Behavior.Interpolator().createExponentialInOutInterpolator(6, false), 'ExponentialInOut pingpong=false, exponent=6',
                new CAAT.Behavior.Interpolator().createExponentialInInterpolator(6, true), 'ExponentialIn pingpong=true, exponent=6',
                new CAAT.Behavior.Interpolator().createExponentialOutInterpolator(6, true), 'ExponentialOut pingpong=true, exponent=6',
                new CAAT.Behavior.Interpolator().createExponentialInOutInterpolator(6, true), 'ExponentialInOut pingpong=true, exponent=6',

                new CAAT.Behavior.Interpolator().createBounceInInterpolator(false), 'BounceIn pingpong=false',
                new CAAT.Behavior.Interpolator().createBounceOutInterpolator(false), 'BounceOut pingpong=false',
                new CAAT.Behavior.Interpolator().createBounceInOutInterpolator(false), 'BounceInOut pingpong=false',
                new CAAT.Behavior.Interpolator().createBounceInInterpolator(true), 'BounceIn pingpong=true',
                new CAAT.Behavior.Interpolator().createBounceOutInterpolator(true), 'BounceOut pingpong=true',
                new CAAT.Behavior.Interpolator().createBounceInOutInterpolator(true), 'BounceInOut pingpong=true',

                new CAAT.Behavior.Interpolator().createElasticInInterpolator(1.1, 0.4, false), 'ElasticIn pingpong=false, amp=1.1, d=.4',
                new CAAT.Behavior.Interpolator().createElasticOutInterpolator(1.1, 0.4, false), 'ElasticOut pingpong=false, amp=1.1, d=.4',
                new CAAT.Behavior.Interpolator().createElasticInOutInterpolator(1.1, 0.4, false), 'ElasticInOut pingpong=false, amp=1.1, d=.4',
                new CAAT.Behavior.Interpolator().createElasticInInterpolator(1.1, 0.4, true), 'ElasticIn pingpong=true, amp=1.1, d=.4',
                new CAAT.Behavior.Interpolator().createElasticOutInterpolator(1.1, 0.4, true), 'ElasticOut pingpong=true, amp=1.1, d=.4',
                new CAAT.Behavior.Interpolator().createElasticInOutInterpolator(1.1, 0.4, true), 'ElasticInOut pingpong=true, amp=1.1, d=.4',

                new CAAT.Behavior.Interpolator().createElasticInInterpolator(1.0, 0.2, false), 'ElasticIn pingpong=false, amp=1.0, d=.2',
                new CAAT.Behavior.Interpolator().createElasticOutInterpolator(1.0, 0.2, false), 'ElasticOut pingpong=false, amp=1.0, d=.2',
                new CAAT.Behavior.Interpolator().createElasticInOutInterpolator(1.0, 0.2, false), 'ElasticInOut pingpong=false, amp=1.0, d=.2',
                new CAAT.Behavior.Interpolator().createElasticInInterpolator(1.0, 0.2, true), 'ElasticIn pingpong=true, amp=1.0, d=.2',
                new CAAT.Behavior.Interpolator().createElasticOutInterpolator(1.0, 0.2, true), 'ElasticOut pingpong=true, amp=1.0, d=.2',
                new CAAT.Behavior.Interpolator().createElasticInOutInterpolator(1.0, 0.2, true), 'ElasticInOut pingpong=true, amp=1.0, d=.2'
            ];
        },

        parse : function( obj ) {
            var name= "create"+obj.type+"Interpolator";
            var interpolator= new CAAT.Behavior.Interpolator();
            try {
                interpolator[name].apply( interpolator, obj.params||[] );
            } catch(e) {
                interpolator.createLinearInterpolator(false, false);
            }

            return interpolator;
        }

    },
    extendsWith:function () {

        return {

            /**
             * @lends CAAT.Behavior.Interpolator.prototype
             */

            interpolated:null, // a coordinate holder for not building a new CAAT.Point for each interpolation call.
            paintScale:90, // the size of the interpolation draw on screen in pixels.

            __init:function () {
                this.interpolated = new CAAT.Math.Point(0, 0, 0);
                return this;
            },

            /**
             * Set a linear interpolation function.
             *
             * @param bPingPong {boolean}
             * @param bInverse {boolean} will values will be from 1 to 0 instead of 0 to 1 ?.
             */
            createLinearInterpolator:function (bPingPong, bInverse) {
                /**
                 * Linear and inverse linear interpolation function.
                 * @param time {number}
                 */
                this.getPosition = function getPosition(time) {

                    var orgTime = time;

                    if (bPingPong) {
                        if (time < 0.5) {
                            time *= 2;
                        } else {
                            time = 1 - (time - 0.5) * 2;
                        }
                    }

                    if (bInverse !== null && bInverse) {
                        time = 1 - time;
                    }

                    return this.interpolated.set(orgTime, time);
                };

                return this;
            },

            createBackOutInterpolator:function (bPingPong) {
                this.getPosition = function getPosition(time) {
                    var orgTime = time;

                    if (bPingPong) {
                        if (time < 0.5) {
                            time *= 2;
                        } else {
                            time = 1 - (time - 0.5) * 2;
                        }
                    }

                    time = time - 1;
                    var overshoot = 1.70158;

                    return this.interpolated.set(
                        orgTime,
                        time * time * ((overshoot + 1) * time + overshoot) + 1);
                };

                return this;
            },
            /**
             * Set an exponential interpolator function. The function to apply will be Math.pow(time,exponent).
             * This function starts with 0 and ends in values of 1.
             *
             * @param exponent {number} exponent of the function.
             * @param bPingPong {boolean}
             */
            createExponentialInInterpolator:function (exponent, bPingPong) {
                this.getPosition = function getPosition(time) {
                    var orgTime = time;

                    if (bPingPong) {
                        if (time < 0.5) {
                            time *= 2;
                        } else {
                            time = 1 - (time - 0.5) * 2;
                        }
                    }
                    return this.interpolated.set(orgTime, Math.pow(time, exponent));
                };

                return this;
            },
            /**
             * Set an exponential interpolator function. The function to apply will be 1-Math.pow(time,exponent).
             * This function starts with 1 and ends in values of 0.
             *
             * @param exponent {number} exponent of the function.
             * @param bPingPong {boolean}
             */
            createExponentialOutInterpolator:function (exponent, bPingPong) {
                this.getPosition = function getPosition(time) {
                    var orgTime = time;

                    if (bPingPong) {
                        if (time < 0.5) {
                            time *= 2;
                        } else {
                            time = 1 - (time - 0.5) * 2;
                        }
                    }
                    return this.interpolated.set(orgTime, 1 - Math.pow(1 - time, exponent));
                };

                return this;
            },
            /**
             * Set an exponential interpolator function. Two functions will apply:
             * Math.pow(time*2,exponent)/2 for the first half of the function (t<0.5) and
             * 1-Math.abs(Math.pow(time*2-2,exponent))/2 for the second half (t>=.5)
             * This function starts with 0 and goes to values of 1 and ends with values of 0.
             *
             * @param exponent {number} exponent of the function.
             * @param bPingPong {boolean}
             */
            createExponentialInOutInterpolator:function (exponent, bPingPong) {
                this.getPosition = function getPosition(time) {
                    var orgTime = time;

                    if (bPingPong) {
                        if (time < 0.5) {
                            time *= 2;
                        } else {
                            time = 1 - (time - 0.5) * 2;
                        }
                    }
                    if (time * 2 < 1) {
                        return this.interpolated.set(orgTime, Math.pow(time * 2, exponent) / 2);
                    }

                    return this.interpolated.set(orgTime, 1 - Math.abs(Math.pow(time * 2 - 2, exponent)) / 2);
                };

                return this;
            },
            /**
             * Creates a Quadric bezier curbe as interpolator.
             *
             * @param p0 {CAAT.Math.Point}
             * @param p1 {CAAT.Math.Point}
             * @param p2 {CAAT.Math.Point}
             * @param bPingPong {boolean} a boolean indicating if the interpolator must ping-pong.
             */
            createQuadricBezierInterpolator:function (p0, p1, p2, bPingPong) {
                this.getPosition = function getPosition(time) {
                    var orgTime = time;

                    if (bPingPong) {
                        if (time < 0.5) {
                            time *= 2;
                        } else {
                            time = 1 - (time - 0.5) * 2;
                        }
                    }

                    time = (1 - time) * (1 - time) * p0.y + 2 * (1 - time) * time * p1.y + time * time * p2.y;

                    return this.interpolated.set(orgTime, time);
                };

                return this;
            },
            /**
             * Creates a Cubic bezier curbe as interpolator.
             *
             * @param p0 {CAAT.Math.Point}
             * @param p1 {CAAT.Math.Point}
             * @param p2 {CAAT.Math.Point}
             * @param p3 {CAAT.Math.Point}
             * @param bPingPong {boolean} a boolean indicating if the interpolator must ping-pong.
             */
            createCubicBezierInterpolator:function (p0, p1, p2, p3, bPingPong) {
                this.getPosition = function getPosition(time) {
                    var orgTime = time;

                    if (bPingPong) {
                        if (time < 0.5) {
                            time *= 2;
                        } else {
                            time = 1 - (time - 0.5) * 2;
                        }
                    }

                    var t2 = time * time;
                    var t3 = time * t2;

                    time = (p0.y + time * (-p0.y * 3 + time * (3 * p0.y -
                        p0.y * time))) + time * (3 * p1.y + time * (-6 * p1.y +
                        p1.y * 3 * time)) + t2 * (p2.y * 3 - p2.y * 3 * time) +
                        p3.y * t3;

                    return this.interpolated.set(orgTime, time);
                };

                return this;
            },
            createElasticOutInterpolator:function (amplitude, p, bPingPong) {
                this.getPosition = function getPosition(time) {

                    if (bPingPong) {
                        if (time < 0.5) {
                            time *= 2;
                        } else {
                            time = 1 - (time - 0.5) * 2;
                        }
                    }

                    if (time === 0) {
                        return {x:0, y:0};
                    }
                    if (time === 1) {
                        return {x:1, y:1};
                    }

                    var s = p / (2 * Math.PI) * Math.asin(1 / amplitude);
                    return this.interpolated.set(
                        time,
                        (amplitude * Math.pow(2, -10 * time) * Math.sin((time - s) * (2 * Math.PI) / p) + 1 ));
                };
                return this;
            },
            createElasticInInterpolator:function (amplitude, p, bPingPong) {
                this.getPosition = function getPosition(time) {

                    if (bPingPong) {
                        if (time < 0.5) {
                            time *= 2;
                        } else {
                            time = 1 - (time - 0.5) * 2;
                        }
                    }

                    if (time === 0) {
                        return {x:0, y:0};
                    }
                    if (time === 1) {
                        return {x:1, y:1};
                    }

                    var s = p / (2 * Math.PI) * Math.asin(1 / amplitude);
                    return this.interpolated.set(
                        time,
                        -(amplitude * Math.pow(2, 10 * (time -= 1)) * Math.sin((time - s) * (2 * Math.PI) / p) ));
                };

                return this;
            },
            createElasticInOutInterpolator:function (amplitude, p, bPingPong) {
                this.getPosition = function getPosition(time) {

                    if (bPingPong) {
                        if (time < 0.5) {
                            time *= 2;
                        } else {
                            time = 1 - (time - 0.5) * 2;
                        }
                    }

                    var s = p / (2 * Math.PI) * Math.asin(1 / amplitude);
                    time *= 2;
                    if (time <= 1) {
                        return this.interpolated.set(
                            time,
                            -0.5 * (amplitude * Math.pow(2, 10 * (time -= 1)) * Math.sin((time - s) * (2 * Math.PI) / p)));
                    }

                    return this.interpolated.set(
                        time,
                        1 + 0.5 * (amplitude * Math.pow(2, -10 * (time -= 1)) * Math.sin((time - s) * (2 * Math.PI) / p)));
                };

                return this;
            },
            /**
             * @param time {number}
             * @private
             */
            bounce:function (time) {
                if ((time /= 1) < (1 / 2.75)) {
                    return {x:time, y:7.5625 * time * time};
                } else if (time < (2 / 2.75)) {
                    return {x:time, y:7.5625 * (time -= (1.5 / 2.75)) * time + 0.75};
                } else if (time < (2.5 / 2.75)) {
                    return {x:time, y:7.5625 * (time -= (2.25 / 2.75)) * time + 0.9375};
                } else {
                    return {x:time, y:7.5625 * (time -= (2.625 / 2.75)) * time + 0.984375};
                }
            },
            createBounceOutInterpolator:function (bPingPong) {
                this.getPosition = function getPosition(time) {
                    if (bPingPong) {
                        if (time < 0.5) {
                            time *= 2;
                        } else {
                            time = 1 - (time - 0.5) * 2;
                        }
                    }
                    return this.bounce(time);
                };

                return this;
            },
            createBounceInInterpolator:function (bPingPong) {

                this.getPosition = function getPosition(time) {
                    if (bPingPong) {
                        if (time < 0.5) {
                            time *= 2;
                        } else {
                            time = 1 - (time - 0.5) * 2;
                        }
                    }
                    var r = this.bounce(1 - time);
                    r.y = 1 - r.y;
                    return r;
                };

                return this;
            },
            createBounceInOutInterpolator:function (bPingPong) {

                this.getPosition = function getPosition(time) {
                    if (bPingPong) {
                        if (time < 0.5) {
                            time *= 2;
                        } else {
                            time = 1 - (time - 0.5) * 2;
                        }
                    }

                    var r;
                    if (time < 0.5) {
                        r = this.bounce(1 - time * 2);
                        r.y = (1 - r.y) * 0.5;
                        return r;
                    }
                    r = this.bounce(time * 2 - 1, bPingPong);
                    r.y = r.y * 0.5 + 0.5;
                    return r;
                };

                return this;
            },

            /**
             * Paints an interpolator on screen.
             * @param ctx {CanvasRenderingContext}
             */
            paint:function (ctx) {

                ctx.save();
                ctx.beginPath();

                ctx.moveTo(0, this.getPosition(0).y * this.paintScale);

                for (var i = 0; i <= this.paintScale; i++) {
                    ctx.lineTo(i, this.getPosition(i / this.paintScale).y * this.paintScale);
                }

                ctx.strokeStyle = 'black';
                ctx.stroke();
                ctx.restore();
            },

            /**
             * Gets an array of coordinates which define the polyline of the intepolator's curve contour.
             * Values for both coordinates range from 0 to 1.
             * @param iSize {number} an integer indicating the number of contour segments.
             * @return Array.<CAAT.Math.Point> of object of the form {x:float, y:float}.
             */
            getContour:function (iSize) {
                var contour = [];
                for (var i = 0; i <= iSize; i++) {
                    contour.push({x:i / iSize, y:this.getPosition(i / iSize).y});
                }

                return contour;
            }
        }
    }
});
