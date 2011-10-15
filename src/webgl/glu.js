/**
 * See LICENSE file.
 *
 */

//
// gluPerspective
//
function makePerspective(fovy, aspect, znear, zfar, viewportHeight) {
    var ymax = znear * Math.tan(fovy * Math.PI / 360.0);
    var ymin = -ymax;
    var xmin = ymin * aspect;
    var xmax = ymax * aspect;

    return makeFrustum(xmin, xmax, ymin, ymax, znear, zfar, viewportHeight);
}

//
// glFrustum
//
function makeFrustum(left, right, bottom, top, znear, zfar, viewportHeight) {
    var X = 2*znear/(right-left);
    var Y = 2*znear/(top-bottom);
    var A = (right+left)/(right-left);
    var B = (top+bottom)/(top-bottom);
    var C = -(zfar+znear)/(zfar-znear);
    var D = -2*zfar*znear/(zfar-znear);

    return new CAAT.Matrix3().initWithMatrix(
            [
                [X,  0,  A, -viewportHeight/2 ],
                [0, -Y,  B,  viewportHeight/2 ],
                [0,  0,  C,                 D ],
                [0,  0, -1,                 0 ]
            ]);
}

function makeOrtho(left, right, bottom, top, znear, zfar) {
    var tx = - (right + left) / (right - left) ;
    var ty = - (top + bottom) / (top - bottom) ;
    var tz = - (zfar + znear) / (zfar - znear);

    return new CAAT.Matrix3().initWithMatrix(
            [
                [2 / (right - left), 0, 0, tx ],
                [0, 2 / (top - bottom), 0, ty ],
                [0, 0, -2 / (zfar- znear), tz ],
                [0, 0, 0,                  1  ]
            ]);
}

