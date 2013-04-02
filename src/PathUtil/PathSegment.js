/**
 * See LICENSE file.
 *
 * These classes encapsulate different kinds of paths.
 * LinearPath, defines an straight line path, just 2 points.
 * CurvePath, defines a path based on a Curve. Curves can be bezier quadric/cubic and catmull-rom.
 * Path, is a general purpose class, which composes a path of different path segments (Linear or Curve paths).
 *
 * A path, has an interpolator which stablish the way the path is traversed (accelerating, by
 * easing functions, etc.). Normally, interpolators will be defined by CAAT.Behavior.Interpolator instances, but
 * general Paths could be used as well.
 *
 **/


CAAT.Module({

    /**
     * @name PathUtil
     * @memberOf CAAT
     * @namespace
     */

    /**
     * @name PathSegment
     * @memberOf CAAT.PathUtil
     * @constructor
     */

    defines:"CAAT.PathUtil.PathSegment",
    depends:[
        "CAAT.Math.Rectangle",
        "CAAT.Math.Point",
        "CAAT.Math.Matrix",
        "CAAT.Math.Curve"
    ],
    extendsWith:function () {
        return {

            /**
             * @lends CAAT.PathUtil.PathSegment.prototype
             */


            __init:function () {
                this.bbox = new CAAT.Math.Rectangle();
                return this;
            },

            /**
             * Color to draw the segment.
             */
            color:'#000',

            /**
             * Segment length.
             */
            length:0,

            /**
             * Segment bounding box.
             */
            bbox:null,

            /**
             * Path this segment belongs to.
             */
            parent:null,

            /**
             * Set a PathSegment's parent
             * @param parent
             */
            setParent:function (parent) {
                this.parent = parent;
                return this;
            },
            setColor:function (color) {
                if (color) {
                    this.color = color;
                }
                return this;
            },
            /**
             * Get path's last coordinate.
             * @return {CAAT.Point}
             */
            endCurvePosition:function () {
            },

            /**
             * Get path's starting coordinate.
             * @return {CAAT.Point}
             */
            startCurvePosition:function () {
            },

            /**
             * Set this path segment's points information.
             * @param points {Array<CAAT.Point>}
             */
            setPoints:function (points) {
            },

            /**
             * Set a point from this path segment.
             * @param point {CAAT.Point}
             * @param index {integer} a point index.
             */
            setPoint:function (point, index) {
            },

            /**
             * Get a coordinate on path.
             * The parameter time is normalized, that is, its values range from zero to one.
             * zero will mean <code>startCurvePosition</code> and one will be <code>endCurvePosition</code>. Other values
             * will be a position on the path relative to the path length. if the value is greater that 1, if will be set
             * to modulus 1.
             * @param time a float with a value between zero and 1 inclusive both.
             *
             * @return {CAAT.Point}
             */
            getPosition:function (time) {
            },

            /**
             * Gets Path length.
             * @return {number}
             */
            getLength:function () {
                return this.length;
            },

            /**
             * Gets the path bounding box (or the rectangle that contains the whole path).
             * @param rectangle a CAAT.Rectangle instance with the bounding box.
             * @return {CAAT.Rectangle}
             */
            getBoundingBox:function () {
                return this.bbox;
            },

            /**
             * Gets the number of control points needed to create the path.
             * Each PathSegment type can have different control points.
             * @return {number} an integer with the number of control points.
             */
            numControlPoints:function () {
            },

            /**
             * Gets CAAT.Point instance with the 2d position of a control point.
             * @param index an integer indicating the desired control point coordinate.
             * @return {CAAT.Point}
             */
            getControlPoint:function (index) {
            },

            /**
             * Instruments the path has finished building, and that no more segments will be added to it.
             * You could later add more PathSegments and <code>endPath</code> must be called again.
             */
            endPath:function () {
            },

            /**
             * Gets a polyline describing the path contour. The contour will be defined by as mush as iSize segments.
             * @param iSize an integer indicating the number of segments of the contour polyline.
             *
             * @return {[CAAT.Point]}
             */
            getContour:function (iSize) {
            },

            /**
             * Recalculate internal path structures.
             */
            updatePath:function (point) {
            },

            /**
             * Draw this path using RenderingContext2D drawing primitives.
             * The intention is to set a path or pathsegment as a clipping region.
             *
             * @param ctx {RenderingContext2D}
             */
            applyAsPath:function (director) {
            },

            /**
             * Transform this path with the given affinetransform matrix.
             * @param matrix
             */
            transform:function (matrix) {
            },

            drawHandle:function (ctx, x, y) {

                ctx.beginPath();
                ctx.arc(
                    x,
                    y,
                    CAAT.Math.Curve.prototype.HANDLE_SIZE / 2,
                    0,
                    2 * Math.PI,
                    false);
                ctx.fill();
            }
        }
    }

});
