CAAT.Module({

    /**
     * @name CatmullRom
     * @memberOf CAAT.Math
     * @extends CAAT.Math.Curve
     * @constructor
     */

    defines:"CAAT.Math.CatmullRom",
    depends:["CAAT.Math.Curve"],
    extendsClass:"CAAT.Math.Curve",
    aliases:["CAAT.CatmullRom"],
    extendsWith:function () {
        return {

            /**
             * @lends CAAT.Math.CatmullRom.prototype
             */

            /**
             * Set curve control points.
             * @param p0 <CAAT.Point>
             * @param p1 <CAAT.Point>
             * @param p2 <CAAT.Point>
             * @param p3 <CAAT.Point>
             */
            setCurve:function (p0, p1, p2, p3) {

                this.coordlist = [];
                this.coordlist.push(p0);
                this.coordlist.push(p1);
                this.coordlist.push(p2);
                this.coordlist.push(p3);

                this.update();

                return this;
            },
            /**
             * Paint the contour by solving again the entire curve.
             * @param director {CAAT.Director}
             */
            paint:function (director) {

                var x1, y1;

                // Catmull rom solves from point 1 !!!

                x1 = this.coordlist[1].x;
                y1 = this.coordlist[1].y;

                var ctx = director.ctx;

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x1, y1);

                var point = new CAAT.Point();

                for (var t = this.k; t <= 1 + this.k; t += this.k) {
                    this.solve(point, t);
                    ctx.lineTo(point.x, point.y);
                }

                ctx.stroke();
                ctx.restore();

                CAAT.Math.CatmullRom.superclass.paint.call(this, director);
            },
            /**
             * Solves the curve for any given parameter t.
             * @param point {CAAT.Point} the point to store the solved value on the curve.
             * @param t {number} a number in the range 0..1
             */
            solve:function (point, t) {
                var c = this.coordlist;

                // Handy from CAKE. Thanks.
                var af = ((-t + 2) * t - 1) * t * 0.5
                var bf = (((3 * t - 5) * t) * t + 2) * 0.5
                var cf = ((-3 * t + 4) * t + 1) * t * 0.5
                var df = ((t - 1) * t * t) * 0.5

                point.x = c[0].x * af + c[1].x * bf + c[2].x * cf + c[3].x * df;
                point.y = c[0].y * af + c[1].y * bf + c[2].y * cf + c[3].y * df;

                return point;

            },

            applyAsPath:function (director) {

                var ctx = director.ctx;

                var point = new CAAT.Math.Point();

                for (var t = this.k; t <= 1 + this.k; t += this.k) {
                    this.solve(point, t);
                    ctx.lineTo(point.x, point.y);
                }

                return this;
            },

            /**
             * Return the first curve control point.
             * @return {CAAT.Point}
             */
            endCurvePosition:function () {
                return this.coordlist[ this.coordlist.length - 2 ];
            },
            /**
             * Return the last curve control point.
             * @return {CAAT.Point}
             */
            startCurvePosition:function () {
                return this.coordlist[ 1 ];
            }
        }
    }
});
