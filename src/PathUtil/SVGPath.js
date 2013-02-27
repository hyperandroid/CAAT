CAAT.Module({

    /**
     * <p>
     * This class is a SVG Path parser.
     * By calling the method parsePath( svgpath ) an instance of CAAT.PathUtil.Path will be built by parsing
     * its contents.
     *
     * <p>
     * See <a href="../../demos/demo32/svgpath.html">demo32</a>
     *
     * @name SVGPath
     * @memberOf CAAT.PathUtil
     * @constructor
     */

    defines:"CAAT.PathUtil.SVGPath",
    depends:[
        "CAAT.PathUtil.Path"
    ],
    extendsWith:function () {

        var OK = 0;
        var EOF = 1;
        var NAN = 2;

        function error(pathInfo, c) {
            var cpos = c;
            if (cpos < 0) {
                cpos = 0;
            }
            console.log("parse error near ..." + pathInfo.substr(cpos, 20));
        }

        return {

            /**
             * @lends CAAT.PathUtil.SVGPath.prototype
             */


            __init:function () {

            },

            /**
             * @private
             */
            c:0,

            /**
             * @private
             */
            bezierInfo:null,

            __skipBlank:function (pathInfo, c) {
                var p = pathInfo.charAt(c);
                while (c < pathInfo.length && (p == ' ' || p == '\n' || p == '\t' || p == ',')) {
                    ++c;
                    var p = pathInfo.charAt(c);
                }

                return c;
            },

            __maybeNumber:function (pathInfo, c) {

                if (c < pathInfo.length - 2) {

                    var p = pathInfo.charAt(c);
                    var p1 = pathInfo.charAt(c + 1);

                    return  p == '-' ||
                        this.__isDigit(p) ||
                        (p === "." && this.__isDigit(p1) );
                }

                return false;
            },

            __isDigit:function (c) {
                return c >= "0" && c <= "9";
            },


            __getNumber:function (pathInfo, c, v, error) {
                c = this.__skipBlank(pathInfo, c);
                if (c < pathInfo.length) {
                    var nc = this.__findNumber(pathInfo, c);
                    if (nc !== -1) {
                        v.push(parseFloat(pathInfo.substr(c, nc)));
                        c = this.__skipBlank(pathInfo, nc);
                        error.pos = c;
                        error.result = OK;
                        return;
                    } else {
                        error.result = NAN;
                        return;
                    }
                }

                error.result = EOF;
            },

            ____getNumbers:function (pathInfo, c, v, n, error) {

                for (var i = 0; i < n; i++) {
                    this.__getNumber(pathInfo, c, v, error);
                    if (error.result != OK) {
                        break;
                    } else {
                        c = error.pos;
                    }
                }

                return c;
            },


            __findNumber:function (pathInfo, c) {

                var p;

                if ((p = pathInfo.charAt(c)) == '-') {
                    ++c;
                }

                if (!this.__isDigit((p = pathInfo.charAt(c)))) {
                    if ((p = pathInfo.charAt(c)) != '.' || !this.__isDigit(pathInfo.charAt(c + 1))) {
                        return -1;
                    }
                }

                while (this.__isDigit((p = pathInfo.charAt(c)))) {
                    ++c;
                }

                if ((p = pathInfo.charAt(c)) == '.') {
                    ++c;
                    if (!this.__isDigit((p = pathInfo.charAt(c)))) {   // asumo un numero [d+]\. como valido.
                        return c;
                    }
                    while (this.__isDigit((p = pathInfo.charAt(c)))) {
                        ++c;
                    }
                }

                return c;
            },

            __parseMoveTo:function (pathInfo, c, absolute, path, error) {

                var numbers = [];

                c = this.____getNumbers(pathInfo, c, numbers, 2, error);

                if (error.result === OK) {
                    if (!absolute) {
                        numbers[0] += path.trackPathX;
                        numbers[1] += path.trackPathY;
                    }
                    path.beginPath(numbers[0], numbers[1]);
                } else {
                    return;
                }

                if (this.__maybeNumber(pathInfo, c)) {
                    c = this.parseLine(pathInfo, c, absolute, path, error);
                }

                error.pos = c;
            },

            __parseLine:function (pathInfo, c, absolute, path, error) {

                var numbers = [];

                do {
                    c = this.____getNumbers(pathInfo, c, numbers, 2, error);
                    if (!absolute) {
                        numbers[0] += path.trackPathX;
                        numbers[1] += path.trackPathY;
                    }
                    path.addLineTo(numbers[0], numbers[1]);

                } while (this.__maybeNumber(pathInfo, c));

                error.pos = c;
            },


            __parseLineH:function (pathInfo, c, absolute, path, error) {

                var numbers = [];

                do {
                    c = this.____getNumbers(pathInfo, c, numbers, 1, error);

                    if (!absolute) {
                        numbers[0] += path.trackPathX;
                    }
                    numbers[1].push(path.trackPathY);

                    path.addLineTo(numbers[0], numbers[1]);

                } while (this.__maybeNumber(pathInfo, c));

                error.pos = c;
            },

            __parseLineV:function (pathInfo, c, absolute, path, error) {

                var numbers = [ path.trackPathX ];

                do {
                    c = this.____getNumbers(pathInfo, c, numbers, 1, error);

                    if (!absolute) {
                        numbers[1] += path.trackPathY;
                    }

                    path.addLineTo(numbers[0], numbers[1]);

                } while (this.__maybeNumber(pathInfo, c));

                error.pos = c;
            },

            __parseCubic:function (pathInfo, c, absolute, path, error) {

                var v = [];

                do {
                    c = this.____getNumbers(pathInfo, c, v, 6, error);
                    if (error.result === OK) {
                        if (!absolute) {
                            v[0] += path.trackPathX;
                            v[1] += path.trackPathY;
                            v[2] += path.trackPathX;
                            v[3] += path.trackPathY;
                            v[4] += path.trackPathX;
                            v[5] += path.trackPathY;
                        }

                        path.addCubicTo(v[0], v[1], v[2], v[3], v[4], v[5]);


                        v.shift();
                        v.shift();
                        this.bezierInfo = v;

                    } else {
                        return;
                    }
                } while (this.__maybeNumber(pathInfo, c));

                error.pos = c;
            },

            __parseCubicS:function (pathInfo, c, absolute, path, error) {

                var v = [];

                do {
                    c = this.____getNumbers(pathInfo, c, v, 4, error);
                    if (error.result == OK) {
                        if (!absolute) {

                            v[0] += path.trackPathX;
                            v[1] += path.trackPathY;
                            v[2] += path.trackPathX;
                            v[3] += path.trackPathY;
                        }

                        var x, y;

                        x = this.bezierInfo[2] + (this.bezierInfo[2] - this.bezierInfo[0]);
                        y = this.bezierInfo[3] + (this.bezierInfo[3] - this.bezierInfo[1]);

                        path.addCubicTo(x, y, v[0], v[1], v[2], v[3]);

                        this.bezierInfo = v;

                    } else {
                        return;
                    }
                } while (this.__maybeNumber(c));

                error.pos = c;
            },

            __parseQuadricS:function (pathInfo, c, absolute, path, error) {

                var v = [];

                do {
                    c = this.____getNumbers(pathInfo, c, v, 4, error);
                    if (error.result === OK) {

                        if (!absolute) {

                            v[0] += path.trackPathX;
                            v[1] += path.trackPathY;
                        }

                        var x, y;

                        x = this.bezierInfo[2] + (this.bezierInfo[2] - this.bezierInfo[0]);
                        y = this.bezierInfo[3] + (this.bezierInfo[3] - this.bezierInfo[1]);

                        path.addQuadricTo(x, y, v[0], v[1]);

                        this.bezierInfo = [];
                        bezierInfo.push(x);
                        bezierInfo.push(y);
                        bezierInfo.push(v[0]);
                        bezierInfo.push(v[1]);


                    } else {
                        return;
                    }
                } while (this.__maybeNumber(c));

                error.pos = c;
            },


            __parseQuadric:function (pathInfo, c, absolute, path, error) {

                var v = [];

                do {
                    c = this.____getNumbers(pathInfo, c, v, 4, error);
                    if (error.result === OK) {
                        if (!absolute) {

                            v[0] += path.trackPathX;
                            v[1] += path.trackPathY;
                            v[2] += path.trackPathX;
                            v[3] += path.trackPathY;
                        }

                        path.addQuadricTo(v[0], v[1], v[2], v[3]);

                        this.bezierInfo = v;
                    } else {
                        return;
                    }
                } while (this.__maybeNumber(c));

                error.pos = c;
            },

            __parseClosePath:function (pathInfo, c, path, error) {

                path.closePath();
                error.pos= c;

            },

            /**
             * This method will create a CAAT.PathUtil.Path object with as many contours as needed.
             * @param pathInfo {string} a SVG path
             * @return Array.<CAAT.PathUtil.Path>
             */
            parsePath:function (pathInfo) {

                this.c = 0;
                this.contours= [];

                var path = new CAAT.PathUtil.Path();
                this.contours.push( path );

                this.c = this.__skipBlank(pathInfo, this.c);
                if (this.c === pathInfo.length) {
                    return path;
                }

                var ret = {
                    pos:0,
                    result:0
                }

                while (this.c != pathInfo.length) {
                    var segment = pathInfo.charAt(this.c);
                    switch (segment) {
                        case 'm':
                            this.__parseMoveTo(pathInfo, this.c + 1, false, path, ret);
                            break;
                        case 'M':
                            this.__parseMoveTo(pathInfo, this.c + 1, true, path, ret);
                            break;
                        case 'c':
                            this.__parseCubic(pathInfo, this.c + 1, false, path, ret);
                            break;
                        case 'C':
                            this.__parseCubic(pathInfo, this.c + 1, true, path, ret);
                            break;
                        case 's':
                            this.__parseCubicS(pathInfo, this.c + 1, false, path, ret);
                            break;
                        case 'S':
                            this.__parseCubicS(pathInfo, this.c + 1, true, path, ret);
                            break;
                        case 'q':
                            this.__parseQuadric(pathInfo, this.c + 1, false, path, ret);
                            break;
                        case 'Q':
                            this.__parseQuadricS(pathInfo, this.c + 1, true, path, ret);
                            break;
                        case 't':
                            this.__parseQuadricS(pathInfo, this.c + 1, false, path, ret);
                            break;
                        case 'T':
                            this.__parseQuadric(pathInfo, this.c + 1, true, path, ret);
                            break;
                        case 'l':
                            this.__parseLine(pathInfo, this.c + 1, false, path, ret);
                            break;
                        case 'L':
                            this.__parseLine(pathInfo, this.c + 1, true, path, ret);
                            break;
                        case 'h':
                            this.__parseLineH(pathInfo, this.c + 1, false, path, ret);
                            break;
                        case 'H':
                            this.__parseLineH(pathInfo, this.c + 1, true, path, ret);
                            break;
                        case 'v':
                            this.__parseLineV(pathInfo, this.c + 1, false, path, ret);
                            break;
                        case 'V':
                            this.__parseLineV(pathInfo, this.c + 1, true, path, ret);
                            break;
                        case 'z':
                        case 'Z':
                            this.__parseClosePath(pathInfo, this.c + 1, path, ret);
                            path= new CAAT.PathUtil.Path();
                            this.contours.push( path );
                            break;
                        case 0:
                            break;
                        default:
                            error(pathInfo, this.c);
                            break;
                    }

                    if (ret.result != OK) {
                        error(pathInfo, this.c);
                        break;
                    } else {
                        this.c = ret.pos;
                    }

                } // while

                var count= 0;
                var fpath= null;
                for( var i=0; i<this.contours.length; i++ ) {
                    if ( !this.contours[i].isEmpty() ) {
                        fpath= this.contours[i];
                        if ( !fpath.closed ) {
                            fpath.endPath();
                        }
                        count++;
                    }
                }

                if ( count===1 ) {
                    return fpath;
                }

                path= new CAAT.PathUtil.Path();
                for( var i=0; i<this.contours.length; i++ ) {
                    if ( !this.contours[i].isEmpty() ) {
                        path.addSegment( this.contours[i] );
                    }
                }
                return path.endPath();

            }

        }
    }
});