/**
 * See LICENSE file.
 *
 **/
CAAT.Module({

    /**
     * @name Point
     * @memberOf CAAT.Math
     * @constructor
     */

    defines:"CAAT.Math.Point",
    aliases:["CAAT.Point"],
    extendsWith:function () {
        return {

            /**
             * @lends CAAT.Math.Point.prototype
             */


            /**
             * point x coordinate.
             */
            x:0,

            /**
             * point y coordinate.
             */
            y:0,

            /**
             * point z coordinate.
             */
            z:0,

            __init:function (xpos, ypos, zpos) {
                this.x = xpos;
                this.y = ypos;
                this.z = zpos || 0;
                return this;
            },

            /**
             * Sets this point coordinates.
             * @param x {number}
             * @param y {number}
             * @param z {number=}
             *
             * @return this
             */
            set:function (x, y, z) {
                this.x = x;
                this.y = y;
                this.z = z || 0;
                return this;
            },
            /**
             * Create a new CAAT.Point equal to this one.
             * @return {CAAT.Point}
             */
            clone:function () {
                var p = new CAAT.Math.Point(this.x, this.y, this.z);
                return p;
            },
            /**
             * Translate this point to another position. The final point will be (point.x+x, point.y+y)
             * @param x {number}
             * @param y {number}
             *
             * @return this
             */
            translate:function (x, y, z) {
                this.x += x;
                this.y += y;
                this.z += z;

                return this;
            },
            /**
             * Translate this point to another point.
             * @param aPoint {CAAT.Point}
             * @return this
             */
            translatePoint:function (aPoint) {
                this.x += aPoint.x;
                this.y += aPoint.y;
                this.z += aPoint.z;
                return this;
            },
            /**
             * Substract a point from this one.
             * @param aPoint {CAAT.Point}
             * @return this
             */
            subtract:function (aPoint) {
                this.x -= aPoint.x;
                this.y -= aPoint.y;
                this.z -= aPoint.z;
                return this;
            },
            /**
             * Multiply this point by a scalar.
             * @param factor {number}
             * @return this
             */
            multiply:function (factor) {
                this.x *= factor;
                this.y *= factor;
                this.z *= factor;
                return this;
            },
            /**
             * Rotate this point by an angle. The rotation is held by (0,0) coordinate as center.
             * @param angle {number}
             * @return this
             */
            rotate:function (angle) {
                var x = this.x, y = this.y;
                this.x = x * Math.cos(angle) - Math.sin(angle) * y;
                this.y = x * Math.sin(angle) + Math.cos(angle) * y;
                this.z = 0;
                return this;
            },
            /**
             *
             * @param angle {number}
             * @return this
             */
            setAngle:function (angle) {
                var len = this.getLength();
                this.x = Math.cos(angle) * len;
                this.y = Math.sin(angle) * len;
                this.z = 0;
                return this;
            },
            /**
             *
             * @param length {number}
             * @return this
             */
            setLength:function (length) {
                var len = this.getLength();
                if (len)this.multiply(length / len);
                else this.x = this.y = this.z = length;
                return this;
            },
            /**
             * Normalize this point, that is, both set coordinates proportionally to values raning 0..1
             * @return this
             */
            normalize:function () {
                var len = this.getLength();
                this.x /= len;
                this.y /= len;
                this.z /= len;
                return this;
            },
            /**
             * Return the angle from -Pi to Pi of this point.
             * @return {number}
             */
            getAngle:function () {
                return Math.atan2(this.y, this.x);
            },
            /**
             * Set this point coordinates proportinally to a maximum value.
             * @param max {number}
             * @return this
             */
            limit:function (max) {
                var aLenthSquared = this.getLengthSquared();
                if (aLenthSquared + 0.01 > max * max) {
                    var aLength = Math.sqrt(aLenthSquared);
                    this.x = (this.x / aLength) * max;
                    this.y = (this.y / aLength) * max;
                    this.z = (this.z / aLength) * max;
                }
                return this;
            },
            /**
             * Get this point's lenght.
             * @return {number}
             */
            getLength:function () {
                var length = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
                if (length < 0.005 && length > -0.005) return 0.000001;
                return length;

            },
            /**
             * Get this point's squared length.
             * @return {number}
             */
            getLengthSquared:function () {
                var lengthSquared = this.x * this.x + this.y * this.y + this.z * this.z;
                if (lengthSquared < 0.005 && lengthSquared > -0.005) return 0;
                return lengthSquared;
            },
            /**
             * Get the distance between two points.
             * @param point {CAAT.Point}
             * @return {number}
             */
            getDistance:function (point) {
                var deltaX = this.x - point.x;
                var deltaY = this.y - point.y;
                var deltaZ = this.z - point.z;
                return Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
            },
            /**
             * Get the squared distance between two points.
             * @param point {CAAT.Point}
             * @return {number}
             */
            getDistanceSquared:function (point) {
                var deltaX = this.x - point.x;
                var deltaY = this.y - point.y;
                var deltaZ = this.z - point.z;
                return deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ;
            },
            /**
             * Get a string representation.
             * @return {string}
             */
            toString:function () {
                return "(CAAT.Math.Point)" +
                    " x:" + String(Math.round(Math.floor(this.x * 10)) / 10) +
                    " y:" + String(Math.round(Math.floor(this.y * 10)) / 10) +
                    " z:" + String(Math.round(Math.floor(this.z * 10)) / 10);
            }
        }
    }
});
