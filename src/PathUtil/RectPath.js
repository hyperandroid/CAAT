CAAT.Module({

    /**
     * @name RectPath
     * @memberOf CAAT.PathUtil
     * @extends CAAT.PathUtil.PathSegment
     * @constructor
     */

    defines:"CAAT.PathUtil.RectPath",
    depends:[
        "CAAT.PathUtil.PathSegment",
        "CAAT.Math.Point",
        "CAAT.Math.Rectangle"
    ],
    aliases:["CAAT.RectPath", "CAAT.ShapePath"],
    extendsClass:"CAAT.PathUtil.PathSegment",
    extendsWith:function () {

        return {

            /**
             * @lends CAAT.PathUtil.RectPath.prototype
             */

            __init:function () {
                this.__super();

                this.points = [];
                this.points.push(new CAAT.Math.Point());
                this.points.push(new CAAT.Math.Point());
                this.points.push(new CAAT.Math.Point());
                this.points.push(new CAAT.Math.Point());
                this.points.push(new CAAT.Math.Point());

                this.newPosition = new CAAT.Math.Point();

                return this;
            },

            /**
             * A collection of Points.
             * @type {Array.<CAAT.Math.Point>}
             */
            points:null,

            /**
             * Traverse this path clockwise or counterclockwise (false).
             */
            cw:true,

            /**
             * spare point for calculations
             */
            newPosition:null,

            applyAsPath:function (director) {
                var ctx = director.ctx;

                if (this.cw) {
                    ctx.lineTo(this.points[0].x, this.points[0].y);
                    ctx.lineTo(this.points[1].x, this.points[1].y);
                    ctx.lineTo(this.points[2].x, this.points[2].y);
                    ctx.lineTo(this.points[3].x, this.points[3].y);
                    ctx.lineTo(this.points[4].x, this.points[4].y);
                } else {
                    ctx.lineTo(this.points[4].x, this.points[4].y);
                    ctx.lineTo(this.points[3].x, this.points[3].y);
                    ctx.lineTo(this.points[2].x, this.points[2].y);
                    ctx.lineTo(this.points[1].x, this.points[1].y);
                    ctx.lineTo(this.points[0].x, this.points[0].y);
                }
                return this;
            },
            setPoint:function (point, index) {
                if (index >= 0 && index < this.points.length) {
                    this.points[index] = point;
                }
            },
            /**
             * An array of {CAAT.Point} composed of two points.
             * @param points {Array<CAAT.Point>}
             */
            setPoints:function (points) {
                this.points = [];
                this.points.push(points[0]);
                this.points.push(new CAAT.Math.Point().set(points[1].x, points[0].y));
                this.points.push(points[1]);
                this.points.push(new CAAT.Math.Point().set(points[0].x, points[1].y));
                this.points.push(points[0].clone());
                this.updatePath();

                return this;
            },
            setClockWise:function (cw) {
                this.cw = cw !== undefined ? cw : true;
                return this;
            },
            isClockWise:function () {
                return this.cw;
            },
            /**
             * Set this path segment's starting position.
             * This method should not be called again after setFinalPosition has been called.
             * @param x {number}
             * @param y {number}
             */
            setInitialPosition:function (x, y) {
                for (var i = 0, l = this.points.length; i < l; i++) {
                    this.points[i].x = x;
                    this.points[i].y = y;
                }
                return this;
            },
            /**
             * Set a rectangle from points[0] to (finalX, finalY)
             * @param finalX {number}
             * @param finalY {number}
             */
            setFinalPosition:function (finalX, finalY) {
                this.points[2].x = finalX;
                this.points[2].y = finalY;

                this.points[1].x = finalX;
                this.points[1].y = this.points[0].y;

                this.points[3].x = this.points[0].x;
                this.points[3].y = finalY;

                this.points[4].x = this.points[0].x;
                this.points[4].y = this.points[0].y;

                this.updatePath();
                return this;
            },
            /**
             * @inheritDoc
             */
            endCurvePosition:function () {
                return this.points[4];
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

                if (-1 === this.length) {
                    this.newPosition.set(0, 0);
                } else {
                    var w = this.bbox.width / this.length;
                    var h = this.bbox.height / this.length;
                    var accTime = 0;
                    var times;
                    var segments;
                    var index = 0;

                    if (this.cw) {
                        segments = [0, 1, 2, 3, 4];
                        times = [w, h, w, h];
                    } else {
                        segments = [4, 3, 2, 1, 0];
                        times = [h, w, h, w];
                    }

                    while (index < times.length) {
                        if (accTime + times[index] < time) {
                            accTime += times[index];
                            index++;
                        } else {
                            break;
                        }
                    }
                    time -= accTime;

                    var p0 = segments[index];
                    var p1 = segments[index + 1];

                    // index tiene el indice del segmento en tiempo.
                    this.newPosition.set(
                        (this.points[p0].x + (this.points[p1].x - this.points[p0].x) * time / times[index]),
                        (this.points[p0].y + (this.points[p1].y - this.points[p0].y) * time / times[index]));
                }

                return this.newPosition;
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
                return this.points[2].x;
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
                ctx.strokeRect(
                    this.bbox.x, this.bbox.y,
                    this.bbox.width, this.bbox.height);

                if (bDrawHandles) {
                    ctx.globalAlpha = 0.5;
                    ctx.fillStyle = '#7f7f00';

                    for (var i = 0; i < this.points.length; i++) {
                        this.drawHandle(ctx, this.points[i].x, this.points[i].y);
                    }

                }

                ctx.restore();
            },
            /**
             * Get the number of control points. For this type of path segment, start and
             * ending path segment points. Defaults to 2.
             * @return {number}
             */
            numControlPoints:function () {
                return this.points.length;
            },
            /**
             * @inheritsDoc
             */
            getControlPoint:function (index) {
                return this.points[index];
            },
            /**
             * @inheritsDoc
             */
            getContour:function (/*iSize*/) {
                var contour = [];

                for (var i = 0; i < this.points.length; i++) {
                    contour.push(this.points[i]);
                }

                return contour;
            },
            updatePath:function (point) {

                if (point) {
                    if (point === this.points[0]) {
                        this.points[1].y = point.y;
                        this.points[3].x = point.x;
                    } else if (point === this.points[1]) {
                        this.points[0].y = point.y;
                        this.points[2].x = point.x;
                    } else if (point === this.points[2]) {
                        this.points[3].y = point.y;
                        this.points[1].x = point.x;
                    } else if (point === this.points[3]) {
                        this.points[0].x = point.x;
                        this.points[2].y = point.y;
                    }
                    this.points[4].x = this.points[0].x;
                    this.points[4].y = this.points[0].y;
                }

                this.bbox.setEmpty();

                for (var i = 0; i < 4; i++) {
                    this.bbox.union(this.points[i].x, this.points[i].y);
                }

                this.length = 2 * this.bbox.width + 2 * this.bbox.height;

                this.points[0].x = this.bbox.x;
                this.points[0].y = this.bbox.y;

                this.points[1].x = this.bbox.x + this.bbox.width;
                this.points[1].y = this.bbox.y;

                this.points[2].x = this.bbox.x + this.bbox.width;
                this.points[2].y = this.bbox.y + this.bbox.height;

                this.points[3].x = this.bbox.x;
                this.points[3].y = this.bbox.y + this.bbox.height;

                this.points[4].x = this.bbox.x;
                this.points[4].y = this.bbox.y;

                return this;
            },

            getPositionFromLength:function (iLength) {
                return this.getPosition(iLength / (this.bbox.width * 2 + this.bbox.height * 2));
            }
        }
    }
});
