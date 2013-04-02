/**
 * See LICENSE file.
 *
 **/

CAAT.Module({

    /**
     * @name Curve
     * @memberOf CAAT.Math
     * @constructor
     */

    defines:"CAAT.Math.Curve",
    depends:["CAAT.Math.Point"],
    extendsWith:function () {

        return {

            /**
             * @lends CAAT.Math.Curve.prototype
             */

            /**
             * A collection of CAAT.Math.Point objects.
             */
            coordlist:null,

            /**
             * Minimun solver step.
             */
            k:0.05,

            /**
             * Curve length.
             */
            length:-1,

            /**
             * If this segments belongs to an interactive path, the handlers will be this size.
             */
            HANDLE_SIZE:20,

            /**
             * Draw interactive handlers ?
             */
            drawHandles:true,

            /**
             * Paint the curve control points.
             * @param director {CAAT.Director}
             */
            paint:function (director) {
                if (false === this.drawHandles) {
                    return;
                }

                var cl = this.coordlist;
                var ctx = director.ctx;

                // control points
                ctx.save();
                ctx.beginPath();

                ctx.strokeStyle = '#a0a0a0';
                ctx.moveTo(cl[0].x, cl[0].y);
                ctx.lineTo(cl[1].x, cl[1].y);
                ctx.stroke();
                if (this.cubic) {
                    ctx.moveTo(cl[2].x, cl[2].y);
                    ctx.lineTo(cl[3].x, cl[3].y);
                    ctx.stroke();
                }


                ctx.globalAlpha = 0.5;
                for (var i = 0; i < this.coordlist.length; i++) {
                    ctx.fillStyle = '#7f7f00';
                    var w = this.HANDLE_SIZE / 2;
                    ctx.beginPath();
                    ctx.arc(cl[i].x, cl[i].y, w, 0, 2 * Math.PI, false);
                    ctx.fill();
                }

                ctx.restore();
            },
            /**
             * Signal the curve has been modified and recalculate curve length.
             */
            update:function () {
                this.calcLength();
            },
            /**
             * This method must be overriden by subclasses. It is called whenever the curve must be solved for some time=t.
             * The t parameter must be in the range 0..1
             * @param point {CAAT.Point} to store curve solution for t.
             * @param t {number}
             * @return {CAAT.Point} the point parameter.
             */
            solve:function (point, t) {
            },
            /**
             * Get an array of points defining the curve contour.
             * @param numSamples {number} number of segments to get.
             */
            getContour:function (numSamples) {
                var contour = [], i;

                for (i = 0; i <= numSamples; i++) {
                    var point = new CAAT.Math.Point();
                    this.solve(point, i / numSamples);
                    contour.push(point);
                }

                return contour;
            },
            /**
             * Calculates a curve bounding box.
             *
             * @param rectangle {CAAT.Rectangle} a rectangle to hold the bounding box.
             * @return {CAAT.Rectangle} the rectangle parameter.
             */
            getBoundingBox:function (rectangle) {
                if (!rectangle) {
                    rectangle = new CAAT.Math.Rectangle();
                }

                // thanks yodesoft.com for spotting the first point is out of the BB
                rectangle.setEmpty();
                rectangle.union(this.coordlist[0].x, this.coordlist[0].y);

                var pt = new CAAT.Math.Point();
                for (var t = this.k; t <= 1 + this.k; t += this.k) {
                    this.solve(pt, t);
                    rectangle.union(pt.x, pt.y);
                }

                return rectangle;
            },
            /**
             * Calculate the curve length by incrementally solving the curve every substep=CAAT.Curve.k. This value defaults
             * to .05 so at least 20 iterations will be performed.
             *
             * @return {number} the approximate curve length.
             */
            calcLength:function () {
                var x1, y1;
                x1 = this.coordlist[0].x;
                y1 = this.coordlist[0].y;
                var llength = 0;
                var pt = new CAAT.Math.Point();
                for (var t = this.k; t <= 1 + this.k; t += this.k) {
                    this.solve(pt, t);
                    llength += Math.sqrt((pt.x - x1) * (pt.x - x1) + (pt.y - y1) * (pt.y - y1));
                    x1 = pt.x;
                    y1 = pt.y;
                }

                this.length = llength;
                return llength;
            },
            /**
             * Return the cached curve length.
             * @return {number} the cached curve length.
             */
            getLength:function () {
                return this.length;
            },
            /**
             * Return the first curve control point.
             * @return {CAAT.Point}
             */
            endCurvePosition:function () {
                return this.coordlist[ this.coordlist.length - 1 ];
            },
            /**
             * Return the last curve control point.
             * @return {CAAT.Point}
             */
            startCurvePosition:function () {
                return this.coordlist[ 0 ];
            },

            setPoints:function (points) {
            },

            setPoint:function (point, index) {
                if (index >= 0 && index < this.coordlist.length) {
                    this.coordlist[index] = point;
                }
            },
            /**
             *
             * @param director <=CAAT.Director>
             */
            applyAsPath:function (director) {
            }
        }
    }

});

