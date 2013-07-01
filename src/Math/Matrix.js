/**
 * See LICENSE file.
 *
 **/


CAAT.Module({

    /**
     * @name Matrix
     * @memberOf CAAT.Math
     * @constructor
     */


    defines:"CAAT.Math.Matrix",
    depends:["CAAT.Math.Point"],
    aliases:["CAAT.Matrix"],
    onCreate : function() {
        CAAT.Math.Matrix.prototype.transformRenderingContext= CAAT.Math.Matrix.prototype.transformRenderingContext_NoClamp;
        CAAT.Math.Matrix.prototype.transformRenderingContextSet= CAAT.Math.Matrix.prototype.transformRenderingContextSet_NoClamp;
    },
    constants : {

        /**
         * @lends CAAT.Math.Matrix.prototype
         */

        setCoordinateClamping : function( clamp ) {
            if ( clamp ) {
                CAAT.Matrix.prototype.transformRenderingContext= CAAT.Matrix.prototype.transformRenderingContext_Clamp;
                CAAT.Matrix.prototype.transformRenderingContextSet= CAAT.Matrix.prototype.transformRenderingContextSet_Clamp;
                CAAT.Math.Matrix.prototype.transformRenderingContext= CAAT.Matrix.prototype.transformRenderingContext_Clamp;
                CAAT.Math.Matrix.prototype.transformRenderingContextSet= CAAT.Matrix.prototype.transformRenderingContextSet_Clamp;
            } else {
                CAAT.Matrix.prototype.transformRenderingContext= CAAT.Matrix.prototype.transformRenderingContext_NoClamp;
                CAAT.Matrix.prototype.transformRenderingContextSet= CAAT.Matrix.prototype.transformRenderingContextSet_NoClamp;
                CAAT.Math.Matrix.prototype.transformRenderingContext= CAAT.Matrix.prototype.transformRenderingContext_NoClamp;
                CAAT.Math.Matrix.prototype.transformRenderingContextSet= CAAT.Matrix.prototype.transformRenderingContextSet_NoClamp;
            }
        },
        /**
         * Create a scale matrix.
         * @param scalex {number} x scale magnitude.
         * @param scaley {number} y scale magnitude.
         *
         * @return {CAAT.Matrix} a matrix object.
         *
         * @static
         */
        scale:function (scalex, scaley) {
            var m = new CAAT.Math.Matrix();

            m.matrix[0] = scalex;
            m.matrix[4] = scaley;

            return m;
        },
        /**
         * Create a new rotation matrix and set it up for the specified angle in radians.
         * @param angle {number}
         * @return {CAAT.Matrix} a matrix object.
         *
         * @static
         */
        rotate:function (angle) {
            var m = new CAAT.Math.Matrix();
            m.setRotation(angle);
            return m;
        },
        /**
         * Create a translation matrix.
         * @param x {number} x translation magnitude.
         * @param y {number} y translation magnitude.
         *
         * @return {CAAT.Matrix} a matrix object.
         * @static
         *
         */
        translate:function (x, y) {
            var m = new CAAT.Math.Matrix();

            m.matrix[2] = x;
            m.matrix[5] = y;

            return m;
        }
    },
    extendsWith:function () {
        return {

            /**
             * @lends CAAT.Math.Matrix.prototype
             */

            /**
             * An array of 9 numbers.
             */
            matrix:null,

            __init:function () {
                this.matrix = [
                    1.0, 0.0, 0.0,
                    0.0, 1.0, 0.0, 
                    0.0, 0.0, 1.0 ];

                if (typeof Float32Array !== "undefined") {
                    this.matrix = new Float32Array(this.matrix);
                }

                return this;
            },

            /**
             * Transform a point by this matrix. The parameter point will be modified with the transformation values.
             * @param point {CAAT.Point}.
             * @return {CAAT.Point} the parameter point.
             */
            transformCoord:function (point) {
                var x = point.x;
                var y = point.y;

                var tm = this.matrix;

                point.x = x * tm[0] + y * tm[1] + tm[2];
                point.y = x * tm[3] + y * tm[4] + tm[5];

                return point;
            },

            setRotation:function (angle) {

                this.identity();

                var tm = this.matrix;
                var c = Math.cos(angle);
                var s = Math.sin(angle);
                tm[0] = c;
                tm[1] = -s;
                tm[3] = s;
                tm[4] = c;

                return this;
            },

            setScale:function (scalex, scaley) {
                this.identity();

                this.matrix[0] = scalex;
                this.matrix[4] = scaley;

                return this;
            },

            /**
             * Sets this matrix as a translation matrix.
             * @param x
             * @param y
             */
            setTranslate:function (x, y) {
                this.identity();

                this.matrix[2] = x;
                this.matrix[5] = y;

                return this;
            },
            /**
             * Copy into this matrix the given matrix values.
             * @param matrix {CAAT.Matrix}
             * @return this
             */
            copy:function (matrix) {
                matrix = matrix.matrix;

                var tmatrix = this.matrix;
                tmatrix[0] = matrix[0];
                tmatrix[1] = matrix[1];
                tmatrix[2] = matrix[2];
                tmatrix[3] = matrix[3];
                tmatrix[4] = matrix[4];
                tmatrix[5] = matrix[5];
                tmatrix[6] = matrix[6];
                tmatrix[7] = matrix[7];
                tmatrix[8] = matrix[8];

                return this;
            },
            /**
             * Set this matrix to the identity matrix.
             * @return this
             */
            identity:function () {

                var m = this.matrix;
                m[0] = 1.0;
                m[1] = 0.0;
                m[2] = 0.0;

                m[3] = 0.0;
                m[4] = 1.0;
                m[5] = 0.0;

                m[6] = 0.0;
                m[7] = 0.0;
                m[8] = 1.0;

                return this;
            },
            /**
             * Multiply this matrix by a given matrix.
             * @param m {CAAT.Matrix}
             * @return this
             */
            multiply:function (m) {

                var tm = this.matrix;
                var mm = m.matrix;

                var tm0 = tm[0];
                var tm1 = tm[1];
                var tm2 = tm[2];
                var tm3 = tm[3];
                var tm4 = tm[4];
                var tm5 = tm[5];
                var tm6 = tm[6];
                var tm7 = tm[7];
                var tm8 = tm[8];

                var mm0 = mm[0];
                var mm1 = mm[1];
                var mm2 = mm[2];
                var mm3 = mm[3];
                var mm4 = mm[4];
                var mm5 = mm[5];
                var mm6 = mm[6];
                var mm7 = mm[7];
                var mm8 = mm[8];

                tm[0] = tm0 * mm0 + tm1 * mm3 + tm2 * mm6;
                tm[1] = tm0 * mm1 + tm1 * mm4 + tm2 * mm7;
                tm[2] = tm0 * mm2 + tm1 * mm5 + tm2 * mm8;
                tm[3] = tm3 * mm0 + tm4 * mm3 + tm5 * mm6;
                tm[4] = tm3 * mm1 + tm4 * mm4 + tm5 * mm7;
                tm[5] = tm3 * mm2 + tm4 * mm5 + tm5 * mm8;
                tm[6] = tm6 * mm0 + tm7 * mm3 + tm8 * mm6;
                tm[7] = tm6 * mm1 + tm7 * mm4 + tm8 * mm7;
                tm[8] = tm6 * mm2 + tm7 * mm5 + tm8 * mm8;

                return this;
            },
            /**
             * Premultiply this matrix by a given matrix.
             * @param m {CAAT.Matrix}
             * @return this
             */
            premultiply:function (m) {

                var m00 = m.matrix[0] * this.matrix[0] + m.matrix[1] * this.matrix[3] + m.matrix[2] * this.matrix[6];
                var m01 = m.matrix[0] * this.matrix[1] + m.matrix[1] * this.matrix[4] + m.matrix[2] * this.matrix[7];
                var m02 = m.matrix[0] * this.matrix[2] + m.matrix[1] * this.matrix[5] + m.matrix[2] * this.matrix[8];

                var m10 = m.matrix[3] * this.matrix[0] + m.matrix[4] * this.matrix[3] + m.matrix[5] * this.matrix[6];
                var m11 = m.matrix[3] * this.matrix[1] + m.matrix[4] * this.matrix[4] + m.matrix[5] * this.matrix[7];
                var m12 = m.matrix[3] * this.matrix[2] + m.matrix[4] * this.matrix[5] + m.matrix[5] * this.matrix[8];

                var m20 = m.matrix[6] * this.matrix[0] + m.matrix[7] * this.matrix[3] + m.matrix[8] * this.matrix[6];
                var m21 = m.matrix[6] * this.matrix[1] + m.matrix[7] * this.matrix[4] + m.matrix[8] * this.matrix[7];
                var m22 = m.matrix[6] * this.matrix[2] + m.matrix[7] * this.matrix[5] + m.matrix[8] * this.matrix[8];

                this.matrix[0] = m00;
                this.matrix[1] = m01;
                this.matrix[2] = m02;

                this.matrix[3] = m10;
                this.matrix[4] = m11;
                this.matrix[5] = m12;

                this.matrix[6] = m20;
                this.matrix[7] = m21;
                this.matrix[8] = m22;


                return this;
            },
            /**
             * Creates a new inverse matrix from this matrix.
             * @return {CAAT.Matrix} an inverse matrix.
             */
            getInverse:function (out) {
                var tm = this.matrix;

                var m00 = tm[0];
                var m01 = tm[1];
                var m02 = tm[2];
                var m10 = tm[3];
                var m11 = tm[4];
                var m12 = tm[5];
                var m20 = tm[6];
                var m21 = tm[7];
                var m22 = tm[8];

                var newMatrix = out || new CAAT.Math.Matrix();

                var determinant = m00 * (m11 * m22 - m21 * m12) - m10 * (m01 * m22 - m21 * m02) + m20 * (m01 * m12 - m11 * m02);
                if (determinant === 0) {
                    return null;
                }

                var m = newMatrix.matrix;

                m[0] = m11 * m22 - m12 * m21;
                m[1] = m02 * m21 - m01 * m22;
                m[2] = m01 * m12 - m02 * m11;

                m[3] = m12 * m20 - m10 * m22;
                m[4] = m00 * m22 - m02 * m20;
                m[5] = m02 * m10 - m00 * m12;

                m[6] = m10 * m21 - m11 * m20;
                m[7] = m01 * m20 - m00 * m21;
                m[8] = m00 * m11 - m01 * m10;

                newMatrix.multiplyScalar(1 / determinant);

                return newMatrix;
            },
            /**
             * Multiply this matrix by a scalar.
             * @param scalar {number} scalar value
             *
             * @return this
             */
            multiplyScalar:function (scalar) {
                var i;

                for (i = 0; i < 9; i++) {
                    this.matrix[i] *= scalar;
                }

                return this;
            },

            /**
             *
             * @param ctx
             */
            transformRenderingContextSet_NoClamp:function (ctx) {
                var m = this.matrix;
                ctx.setTransform(m[0], m[3], m[1], m[4], m[2], m[5]);
                return this;
            },

            /**
             *
             * @param ctx
             */
            transformRenderingContext_NoClamp:function (ctx) {
                var m = this.matrix;
                ctx.transform(m[0], m[3], m[1], m[4], m[2], m[5]);
                return this;
            },

            /**
             *
             * @param ctx
             */
            transformRenderingContextSet_Clamp:function (ctx) {
                var m = this.matrix;
                ctx.setTransform(m[0], m[3], m[1], m[4], m[2] >> 0, m[5] >> 0);
                return this;
            },

            /**
             *
             * @param ctx
             */
            transformRenderingContext_Clamp:function (ctx) {
                var m = this.matrix;
                ctx.transform(m[0], m[3], m[1], m[4], m[2] >> 0, m[5] >> 0);
                return this;
            },

            setModelViewMatrix:function ( x, y, sx, sy, r  ) {
                var c, s, _m00, _m01, _m10, _m11;
                var mm0, mm1, mm2, mm3, mm4, mm5;
                var mm;

                mm = this.matrix;

                mm0 = 1;
                mm1 = 0;
                mm3 = 0;
                mm4 = 1;

                mm2 = x;
                mm5 = y;

                c = Math.cos(r);
                s = Math.sin(r);
                _m00 = mm0;
                _m01 = mm1;
                _m10 = mm3;
                _m11 = mm4;
                mm0 = _m00 * c + _m01 * s;
                mm1 = -_m00 * s + _m01 * c;
                mm3 = _m10 * c + _m11 * s;
                mm4 = -_m10 * s + _m11 * c;

                mm0 = mm0 * this.scaleX;
                mm1 = mm1 * this.scaleY;
                mm3 = mm3 * this.scaleX;
                mm4 = mm4 * this.scaleY;

                mm[0] = mm0;
                mm[1] = mm1;
                mm[2] = mm2;
                mm[3] = mm3;
                mm[4] = mm4;
                mm[5] = mm5;
            }
        }
    }
});
