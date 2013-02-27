/**
 * CAAT.LinearPath
 */
CAAT.Module({


    /**
     * @name LinearPath
     * @memberOf CAAT.PathUtil
     * @extends CAAT.PathUtil.PathSegment
     * @constructor
     */

    defines:"CAAT.PathUtil.LinearPath",
    depends:[
        "CAAT.PathUtil.PathSegment",
        "CAAT.Math.Point"
    ],
    aliases:["CAAT.LinearPath"],
    extendsClass:"CAAT.PathUtil.PathSegment",
    extendsWith:function () {

        return  {

            /**
             * @lends CAAT.PathUtil.LinearPath.prototype
             */

            __init:function () {
                this.__super();

                this.points = [];
                this.points.push(new CAAT.Math.Point());
                this.points.push(new CAAT.Math.Point());

                this.newPosition = new CAAT.Math.Point(0, 0, 0);
                return this;
            },

            /**
             * A collection of points.
             * @type {Array.<CAAT.Math.Point>}
             */
            points:null,

            /**
             * spare holder for getPosition coordinate return.
             */
            newPosition:null,

            applyAsPath:function (director) {
                // Fixed: Thanks https://github.com/roed
                director.ctx.lineTo(this.points[1].x, this.points[1].y);
            },
            setPoint:function (point, index) {
                if (index === 0) {
                    this.points[0] = point;
                } else if (index === 1) {
                    this.points[1] = point;
                }
            },
            /**
             * Update this segments length and bounding box info.
             */
            updatePath:function (point) {
                var x = this.points[1].x - this.points[0].x;
                var y = this.points[1].y - this.points[0].y;
                this.length = Math.sqrt(x * x + y * y);

                this.bbox.setEmpty();
                this.bbox.union(this.points[0].x, this.points[0].y);
                this.bbox.union(this.points[1].x, this.points[1].y);

                return this;
            },
            setPoints:function (points) {
                this.points[0] = points[0];
                this.points[1] = points[1];
                this.updatePath();
                return this;
            },
            /**
             * Set this path segment's starting position.
             * @param x {number}
             * @param y {number}
             */
            setInitialPosition:function (x, y) {
                this.points[0].x = x;
                this.points[0].y = y;
                this.newPosition.set(x, y);
                return this;
            },
            /**
             * Set this path segment's ending position.
             * @param finalX {number}
             * @param finalY {number}
             */
            setFinalPosition:function (finalX, finalY) {
                this.points[1].x = finalX;
                this.points[1].y = finalY;
                return this;
            },
            /**
             * @inheritDoc
             */
            endCurvePosition:function () {
                return this.points[1];
            },
            /**
             * @inheritsDoc
             */
            startCurvePosition:function () {
                return this.points[0];
            },
            /**
             * @inheritsDoc
             */
            getPosition:function (time) {

                if (time > 1 || time < 0) {
                    time %= 1;
                }
                if (time < 0) {
                    time = 1 + time;
                }

                this.newPosition.set(
                    (this.points[0].x + (this.points[1].x - this.points[0].x) * time),
                    (this.points[0].y + (this.points[1].y - this.points[0].y) * time));

                return this.newPosition;
            },
            getPositionFromLength:function (len) {
                return this.getPosition(len / this.length);
            },
            /**
             * Returns initial path segment point's x coordinate.
             * @return {number}
             */
            initialPositionX:function () {
                return this.points[0].x;
            },
            /**
             * Returns final path segment point's x coordinate.
             * @return {number}
             */
            finalPositionX:function () {
                return this.points[1].x;
            },
            /**
             * Draws this path segment on screen. Optionally it can draw handles for every control point, in
             * this case, start and ending path segment points.
             * @param director {CAAT.Director}
             * @param bDrawHandles {boolean}
             */
            paint:function (director, bDrawHandles) {

                var ctx = director.ctx;

                ctx.save();

                ctx.strokeStyle = this.color;
                ctx.beginPath();
                ctx.moveTo(this.points[0].x, this.points[0].y);
                ctx.lineTo(this.points[1].x, this.points[1].y);
                ctx.stroke();

                if (bDrawHandles) {
                    ctx.globalAlpha = 0.5;
                    ctx.fillStyle = '#7f7f00';
                    ctx.beginPath();
                    this.drawHandle(ctx, this.points[0].x, this.points[0].y);
                    this.drawHandle(ctx, this.points[1].x, this.points[1].y);

                }

                ctx.restore();
            },
            /**
             * Get the number of control points. For this type of path segment, start and
             * ending path segment points. Defaults to 2.
             * @return {number}
             */
            numControlPoints:function () {
                return 2;
            },
            /**
             * @inheritsDoc
             */
            getControlPoint:function (index) {
                if (0 === index) {
                    return this.points[0];
                } else if (1 === index) {
                    return this.points[1];
                }
            },
            /**
             * @inheritsDoc
             */
            getContour:function (iSize) {
                var contour = [];

                contour.push(this.getPosition(0).clone());
                contour.push(this.getPosition(1).clone());

                return contour;
            }
        }
    }
});
