/**
 * See LICENSE file.
 *
 */
CAAT.Module( {

    /**
     * @name GLU
     * @memberOf CAAT.WebGL
     * @namespace
     */

    defines : "CAAT.WebGL.GLU",
    depends : [
        "CAAT.Math.Matrix3"
    ],
    constants : {

        /**
         * @lends CAAT.WebGL.GLU
         */

        /**
         * Create a perspective matrix.
         *
         * @param fovy
         * @param aspect
         * @param znear
         * @param zfar
         * @param viewportHeight
         */
        makePerspective : function (fovy, aspect, znear, zfar, viewportHeight) {
            var ymax = znear * Math.tan(fovy * Math.PI / 360.0);
            var ymin = -ymax;
            var xmin = ymin * aspect;
            var xmax = ymax * aspect;

            return makeFrustum(xmin, xmax, ymin, ymax, znear, zfar, viewportHeight);
        },

        /**
         * Create a matrix for a frustum.
         *
         * @param left
         * @param right
         * @param bottom
         * @param top
         * @param znear
         * @param zfar
         * @param viewportHeight
         */
        makeFrustum : function (left, right, bottom, top, znear, zfar, viewportHeight) {
            var X = 2*znear/(right-left);
            var Y = 2*znear/(top-bottom);
            var A = (right+left)/(right-left);
            var B = (top+bottom)/(top-bottom);
            var C = -(zfar+znear)/(zfar-znear);
            var D = -2*zfar*znear/(zfar-znear);

            return new CAAT.Math.Matrix3().initWithMatrix(
                    [
                        [X,  0,  A, -viewportHeight/2 ],
                        [0, -Y,  B,  viewportHeight/2 ],
                        [0,  0,  C,                 D ],
                        [0,  0, -1,                 0 ]
                    ]);
        },

        /**
         * Create an orthogonal projection matrix.
         * @param left
         * @param right
         * @param bottom
         * @param top
         * @param znear
         * @param zfar
         */
        makeOrtho : function (left, right, bottom, top, znear, zfar) {
            var tx = - (right + left) / (right - left) ;
            var ty = - (top + bottom) / (top - bottom) ;
            var tz = - (zfar + znear) / (zfar - znear);

            return new CAAT.Math.Matrix3().initWithMatrix(
                    [
                        [2 / (right - left), 0, 0, tx ],
                        [0, 2 / (top - bottom), 0, ty ],
                        [0, 0, -2 / (zfar- znear), tz ],
                        [0, 0, 0,                  1  ]
                    ]);
        }

    }
});
