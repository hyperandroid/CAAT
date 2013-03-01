/**
 * CAAT.CurvePath
 */
CAAT.Module({

    /**
     * @name CurvePath
     * @memberOf CAAT.PathUtil
     * @extends CAAT.PathUtil.PathSegment
     * @constructor
     */

    defines:"CAAT.PathUtil.CurvePath",
    depends:[
        "CAAT.PathUtil.PathSegment",
        "CAAT.Math.Point",
        "CAAT.Math.Bezier"
    ],
    aliases:["CAAT.CurvePath"],
    extendsClass:"CAAT.PathUtil.PathSegment",
    extendsWith:function () {
        return {

            /**
             * @lends CAAT.PathUtil.CurvePath.prototype
             */


            __init:function () {
                this.__super();
                this.newPosition = new CAAT.Math.Point(0, 0, 0);
                return this;
            },

            /**
             * A CAAT.Math.Curve instance.
             */
            curve:null,

            /**
             * spare holder for getPosition coordinate return.
             * @type {CAAT.Math.Point}
             */
            newPosition:null,

            applyAsPath:function (director) {
                this.curve.applyAsPath(director);
                return this;
            },
            setPoint:function (point, index) {
                if (this.curve) {
                    this.curve.setPoint(point, index);
                }
            },
            /**
             * Set this curve segment's points.
             * @param points {Array<CAAT.Point>}
             */
            setPoints:function (points) {
                var curve = new CAAT.Math.Bezier();
                curve.setPoints(points);
                this.curve = curve;
                return this;
            },
            /**
             * Set the pathSegment as a CAAT.Bezier quadric instance.
             * Parameters are quadric coordinates control points.
             *
             * @param p0x {number}
             * @param p0y {number}
             * @param p1x {number}
             * @param p1y {number}
             * @param p2x {number}
             * @param p2y {number}
             * @return this
             */
            setQuadric:function (p0x, p0y, p1x, p1y, p2x, p2y) {
                var curve = new CAAT.Math.Bezier();
                curve.setQuadric(p0x, p0y, p1x, p1y, p2x, p2y);
                this.curve = curve;
                this.updatePath();

                return this;
            },
            /**
             * Set the pathSegment as a CAAT.Bezier cubic instance.
             * Parameters are cubic coordinates control points.
             * @param p0x {number}
             * @param p0y {number}
             * @param p1x {number}
             * @param p1y {number}
             * @param p2x {number}
             * @param p2y {number}
             * @param p3x {number}
             * @param p3y {number}
             * @return this
             */
            setCubic:function (p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y) {
                var curve = new CAAT.Math.Bezier();
                curve.setCubic(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y);
                this.curve = curve;
                this.updatePath();

                return this;
            },
            /**
             * @inheritDoc
             */
            updatePath:function (point) {
                this.curve.update();
                this.length = this.curve.getLength();
                this.curve.getBoundingBox(this.bbox);
                return this;
            },
            /**
             * @inheritDoc
             */
            getPosition:function (time) {

                if (time > 1 || time < 0) {
                    time %= 1;
                }
                if (time < 0) {
                    time = 1 + time;
                }

                this.curve.solve(this.newPosition, time);

                return this.newPosition;
            },
            /**
             * Gets the coordinate on the path relative to the path length.
             * @param iLength {number} the length at which the coordinate will be taken from.
             * @return {CAAT.Point} a CAAT.Point instance with the coordinate on the path corresponding to the
             * iLenght parameter relative to segment's length.
             */
            getPositionFromLength:function (iLength) {
                this.curve.solve(this.newPosition, iLength / this.length);
                return this.newPosition;
            },
            /**
             * Get path segment's first point's x coordinate.
             * @return {number}
             */
            initialPositionX:function () {
                return this.curve.coordlist[0].x;
            },
            /**
             * Get path segment's last point's y coordinate.
             * @return {number}
             */
            finalPositionX:function () {
                return this.curve.coordlist[this.curve.coordlist.length - 1].x;
            },
            /**
             * @inheritDoc
             * @param director {CAAT.Director}
             * @param bDrawHandles {boolean}
             */
            paint:function (director, bDrawHandles) {
                this.curve.drawHandles = bDrawHandles;
                director.ctx.strokeStyle = this.color;
                this.curve.paint(director, bDrawHandles);
            },
            /**
             * @inheritDoc
             */
            numControlPoints:function () {
                return this.curve.coordlist.length;
            },
            /**
             * @inheritDoc
             * @param index
             */
            getControlPoint:function (index) {
                return this.curve.coordlist[index];
            },
            /**
             * @inheritDoc
             */
            endCurvePosition:function () {
                return this.curve.endCurvePosition();
            },
            /**
             * @inheritDoc
             */
            startCurvePosition:function () {
                return this.curve.startCurvePosition();
            },
            /**
             * @inheritDoc
             * @param iSize
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
