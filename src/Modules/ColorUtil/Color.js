/**
 * See LICENSE file.
 *
 * @author: Mario Gonzalez (@onedayitwilltake) and Ibon Tolosana (@hyperandroid)
 *
 * Helper classes for color manipulation.
 *
 **/

CAAT.Module({

    /**
     * @name ColorUtil
     * @memberOf CAAT.Module
     * @namespace
     */

    /**
     * @name Color
     * @memberOf CAAT.Module.ColorUtil
     * @namespace
     */


    defines:"CAAT.Module.ColorUtil.Color",
    depends:[
    ],
    constants:{

        /**
         * @lends CAAT.Module.ColorUtil.Color
         */

        /**
         * Enumeration to define types of color ramps.
         * @enum {number}
         */
        RampEnumeration:{
            RAMP_RGBA:0,
            RAMP_RGB:1,
            RAMP_CHANNEL_RGB:2,
            RAMP_CHANNEL_RGBA:3,
            RAMP_CHANNEL_RGB_ARRAY:4,
            RAMP_CHANNEL_RGBA_ARRAY:5
        },

        /**
         * HSV to RGB color conversion
         * <p>
         * H runs from 0 to 360 degrees<br>
         * S and V run from 0 to 100
         * <p>
         * Ported from the excellent java algorithm by Eugene Vishnevsky at:
         * http://www.cs.rit.edu/~ncs/color/t_convert.html
         *
         * @static
         */
        hsvToRgb:function (h, s, v) {
            var r, g, b, i, f, p, q, t;

            // Make sure our arguments stay in-range
            h = Math.max(0, Math.min(360, h));
            s = Math.max(0, Math.min(100, s));
            v = Math.max(0, Math.min(100, v));

            // We accept saturation and value arguments from 0 to 100 because that's
            // how Photoshop represents those values. Internally, however, the
            // saturation and value are calculated from a range of 0 to 1. We make
            // That conversion here.
            s /= 100;
            v /= 100;

            if (s === 0) {
                // Achromatic (grey)
                r = g = b = v;
                return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
            }

            h /= 60; // sector 0 to 5
            i = Math.floor(h);
            f = h - i; // factorial part of h
            p = v * (1 - s);
            q = v * (1 - s * f);
            t = v * (1 - s * (1 - f));

            switch (i) {
                case 0:
                    r = v;
                    g = t;
                    b = p;
                    break;

                case 1:
                    r = q;
                    g = v;
                    b = p;
                    break;

                case 2:
                    r = p;
                    g = v;
                    b = t;
                    break;

                case 3:
                    r = p;
                    g = q;
                    b = v;
                    break;

                case 4:
                    r = t;
                    g = p;
                    b = v;
                    break;

                default: // case 5:
                    r = v;
                    g = p;
                    b = q;
            }

            return new CAAT.Module.ColorUtil.Color(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
        },

        /**
         * Interpolate the color between two given colors. The return value will be a calculated color
         * among the two given initial colors which corresponds to the 'step'th color of the 'nsteps'
         * calculated colors.
         * @param r0 {number} initial color red component.
         * @param g0 {number} initial color green component.
         * @param b0 {number} initial color blue component.
         * @param r1 {number} final color red component.
         * @param g1 {number} final color green component.
         * @param b1 {number} final color blue component.
         * @param nsteps {number} number of colors to calculate including the two given colors. If 16 is passed as value,
         * 14 colors plus the two initial ones will be calculated.
         * @param step {number} return this color index of all the calculated colors.
         *
         * @return { {r{number}, g{number}, b{number}} } return an object with the new calculated color components.
         * @static
         */
        interpolate:function (r0, g0, b0, r1, g1, b1, nsteps, step) {

            var r, g, b;

            if (step <= 0) {
                return {
                    r:r0,
                    g:g0,
                    b:b0
                };
            } else if (step >= nsteps) {
                return {
                    r:r1,
                    g:g1,
                    b:b1
                };
            }

            r = (r0 + (r1 - r0) / nsteps * step) >> 0;
            g = (g0 + (g1 - g0) / nsteps * step) >> 0;
            b = (b0 + (b1 - b0) / nsteps * step) >> 0;

            if (r > 255) {
                r = 255;
            } else if (r < 0) {
                r = 0;
            }
            if (g > 255) {
                g = 255;
            } else if (g < 0) {
                g = 0;
            }
            if (b > 255) {
                b = 255;
            } else if (b < 0) {
                b = 0;
            }

            return {
                r:r,
                g:g,
                b:b
            };
        },

        /**
         * Generate a ramp of colors from an array of given colors.
         * @param fromColorsArray {[number]} an array of colors. each color is defined by an integer number from which
         * color components will be extracted. Be aware of the alpha component since it will also be interpolated for
         * new colors.
         * @param rampSize {number} number of colors to produce.
         * @param returnType {CAAT.ColorUtils.RampEnumeration} a value of CAAT.ColorUtils.RampEnumeration enumeration.
         *
         * @return { [{number},{number},{number},{number}] } an array of integers each of which represents a color of
         * the calculated color ramp.
         *
         * @static
         */
        makeRGBColorRamp:function (fromColorsArray, rampSize, returnType) {

            var ramp = [], nc = fromColorsArray.length - 1, chunk = rampSize / nc, i, j,
                na, nr, ng, nb,
                c, a0, r0, g0, b0,
                c1, a1, r1, g1, b1,
                da, dr, dg, db;

            for (i = 0; i < nc; i += 1) {
                c = fromColorsArray[i];
                a0 = (c >> 24) & 0xff;
                r0 = (c & 0xff0000) >> 16;
                g0 = (c & 0xff00) >> 8;
                b0 = c & 0xff;

                c1 = fromColorsArray[i + 1];
                a1 = (c1 >> 24) & 0xff;
                r1 = (c1 & 0xff0000) >> 16;
                g1 = (c1 & 0xff00) >> 8;
                b1 = c1 & 0xff;

                da = (a1 - a0) / chunk;
                dr = (r1 - r0) / chunk;
                dg = (g1 - g0) / chunk;
                db = (b1 - b0) / chunk;

                for (j = 0; j < chunk; j += 1) {
                    na = (a0 + da * j) >> 0;
                    nr = (r0 + dr * j) >> 0;
                    ng = (g0 + dg * j) >> 0;
                    nb = (b0 + db * j) >> 0;

                    var re = CAAT.Module.ColorUtil.Color.RampEnumeration;

                    switch (returnType) {
                        case re.RAMP_RGBA:
                            ramp.push('argb(' + na + ',' + nr + ',' + ng + ',' + nb + ')');
                            break;
                        case re.RAMP_RGB:
                            ramp.push('rgb(' + nr + ',' + ng + ',' + nb + ')');
                            break;
                        case re.RAMP_CHANNEL_RGB:
                            ramp.push(0xff000000 | nr << 16 | ng << 8 | nb);
                            break;
                        case re.RAMP_CHANNEL_RGBA:
                            ramp.push(na << 24 | nr << 16 | ng << 8 | nb);
                            break;
                        case re.RAMP_CHANNEL_RGBA_ARRAY:
                            ramp.push([ nr, ng, nb, na ]);
                            break;
                        case re.RAMP_CHANNEL_RGB_ARRAY:
                            ramp.push([ nr, ng, nb ]);
                            break;
                    }
                }
            }

            return ramp;

        },

        random:function () {
            var a = '0123456789abcdef';
            var c = '#';
            for (var i = 0; i < 3; i++) {
                c += a[ (Math.random() * a.length) >> 0 ];
            }
            return c;
        }
    },

    extendsWith:{
        __init:function (r, g, b) {
            this.r = r || 255;
            this.g = g || 255;
            this.b = b || 255;
            return this;
        },

        r:255,
        g:255,
        b:255,

        /**
         * Get color hexadecimal representation.
         * @return {string} a string with color hexadecimal representation.
         */
        toHex:function () {
            // See: http://jsperf.com/rgb-decimal-to-hex/5
            return ('000000' + ((this.r << 16) + (this.g << 8) + this.b).toString(16)).slice(-6);
        }
    }
});
