CAAT.Module({

    /**
     * @name ArcPath
     * @memberOf CAAT.PathUtil
     * @extends CAAT.PathUtil.PathSegment
     * @constructor
     */

    defines:"CAAT.PathUtil.ArcPath",
    depends:[
        "CAAT.PathUtil.PathSegment",
        "CAAT.Math.Point",
        "CAAT.Math.Rectangle"
    ],
    aliases:["CAAT.ArcPath"],
    extendsClass:"CAAT.PathUtil.PathSegment",
    extendsWith:function () {

        return {

            /**
             * @lends CAAT.PathUtil.ArcPath.prototype
             */

            __init:function () {
                this.__super();

                this.points = [];
                this.points.push(new CAAT.Math.Point());
                this.points.push(new CAAT.Math.Point());

                this.newPosition = new CAAT.Math.Point();

                return this;
            },

            /**
             * A collection of CAAT.Math.Point objects which defines the arc (center, start, end)
             */
            points:null,

            /**
             * Defined clockwise or counterclockwise ?
             */
            cw:true,

            /**
             * spare point for calculations
             */
            newPosition:null,

            /**
             * Arc radius.
             */
            radius:0,

            /**
             * Arc start angle.
             */
            startAngle:0,

            /**
             * Arc end angle.
             */
            angle:2 * Math.PI,

            /**
             * is a relative or absolute arc ?
             */
            arcTo:false,

            setRadius:function (r) {
                this.radius = r;
                return this;
            },

            isArcTo:function () {
                return this.arcTo;
            },

            setArcTo:function (b) {
                this.arcTo = b;
                return this;
            },

            initialize:function (x, y, r, angle) {
                this.setInitialPosition(x, y);
                this.setFinalPosition(x + r, y);
                this.angle = angle || 2 * Math.PI;
                return this;
            },

            applyAsPath:function (director) {
                var ctx = director.ctx;
                if (!this.arcTo) {
                    ctx.arc(this.points[0].x, this.points[0].y, this.radius, this.startAngle, this.angle + this.startAngle, this.cw);
                } else {
                    ctx.arcTo(this.points[0].x, this.points[0].y, this.points[1].x, this.points[1].y, this.radius);
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
                this.points[0] = points[0];
                this.points[1] = points[1];
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
                    this.points[0].x = x;
                    this.points[0].y = y;
                }

                return this;
            },
            /**
             * Set a rectangle from points[0] to (finalX, finalY)
             * @param finalX {number}
             * @param finalY {number}
             */
            setFinalPosition:function (finalX, finalY) {
                this.points[1].x = finalX;
                this.points[1].y = finalY;

                this.updatePath(this.points[1]);
                return this;
            },
            /**
             * An arc starts and ends in the same point.
             */
            endCurvePosition:function () {
                return this.points[0];
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
                    this.newPosition.set(this.points[0].x, this.points[0].y);
                } else {

                    var angle = this.angle * time * (this.cw ? 1 : -1) + this.startAngle;

                    this.newPosition.set(
                        this.points[0].x + this.radius * Math.cos(angle),
                        this.points[0].y + this.radius * Math.sin(angle)
                    );
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
                if (!this.arcTo) {
                    ctx.arc(this.points[0].x, this.points[0].y, this.radius, this.startAngle, this.startAngle + this.angle, this.cw);
                } else {
                    ctx.arcTo(this.points[0].x, this.points[0].y, this.points[1].x, this.points[1].y, this.radius);
                }
                ctx.stroke();

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
            getContour:function (iSize) {
                var contour = [];

                for (var i = 0; i < iSize; i++) {
                    contour.push(
                        {
                            x:this.points[0].x + this.radius * Math.cos(i * Math.PI / (iSize / 2)),
                            y:this.points[0].y + this.radius * Math.sin(i * Math.PI / (iSize / 2))
                        }
                    );
                }

                return contour;
            },

            getPositionFromLength:function (iLength) {
                var ratio = iLength / this.length * (this.cw ? 1 : -1);
                return this.getPosition(ratio);
                /*
                 this.newPosition.set(
                 this.points[0].x + this.radius * Math.cos( 2*Math.PI * ratio ),
                 this.points[0].y + this.radius * Math.sin( 2*Math.PI * ratio )
                 );
                 return this.newPosition;*/
            },

            updatePath:function (point) {

                // just move the circle, not modify radius.
                if (this.points[1] === point) {

                    if (!this.arcTo) {
                        this.radius = Math.sqrt(
                            ( this.points[0].x - this.points[1].x ) * ( this.points[0].x - this.points[1].x ) +
                                ( this.points[0].y - this.points[1].y ) * ( this.points[0].y - this.points[1].y )
                        );
                    }

                    this.length = this.angle * this.radius;
                    this.startAngle = Math.atan2((this.points[1].y - this.points[0].y), (this.points[1].x - this.points[0].x));

                } else if (this.points[0] === point) {
                    this.points[1].set(
                        this.points[0].x + this.radius * Math.cos(this.startAngle),
                        this.points[0].y + this.radius * Math.sin(this.startAngle)
                    );
                }

                this.bbox.setEmpty();
                this.bbox.x = this.points[0].x - this.radius;
                this.bbox.y = this.points[0].y - this.radius;
                this.bbox.x1 = this.points[0].x + this.radius;
                this.bbox.y1 = this.points[0].y + this.radius;
                this.bbox.width = 2 * this.radius;
                this.bbox.height = 2 * this.radius;

                return this;
            }
        }
    }

});
