/**
 * See LICENSE file.
 *
 **/

CAAT.Module( {

    /**
     * @name Math
     * @memberOf CAAT
     * @namespace
     */

    /**
     * @name Bezier
     * @memberOf CAAT.Math
     * @extends CAAT.Math.Curve
     * @constructor
     */

    defines:    "CAAT.Math.Bezier",
    depends:    ["CAAT.Math.Curve"],
    extendsClass:    "CAAT.Math.Curve",
    aliases:    ["CAAT.Bezier"],
    extendsWith:    function() {
        return {

            /**
             * @lends CAAT.Math.Bezier.prototype
             */

            /**
             * This curbe is cubic or quadratic bezier ?
             */
            cubic:		false,

            applyAsPath : function( director ) {

                var cc= this.coordlist;

                if ( this.cubic ) {
                    director.ctx.bezierCurveTo(
                        cc[1].x,
                        cc[1].y,
                        cc[2].x,
                        cc[2].y,
                        cc[3].x,
                        cc[3].y
                    );
                } else {
                    director.ctx.quadraticCurveTo(
                        cc[1].x,
                        cc[1].y,
                        cc[2].x,
                        cc[2].y
                    );
                }
                return this;
            },
            isQuadric : function() {
                return !this.cubic;
            },
            isCubic : function() {
                return this.cubic;
            },
            /**
             * Set this curve as a cubic bezier defined by the given four control points.
             * @param cp0x {number}
             * @param cp0y {number}
             * @param cp1x {number}
             * @param cp1y {number}
             * @param cp2x {number}
             * @param cp2y {number}
             * @param cp3x {number}
             * @param cp3y {number}
             */
            setCubic : function( cp0x,cp0y, cp1x,cp1y, cp2x,cp2y, cp3x,cp3y ) {

                this.coordlist= [];

                this.coordlist.push( new CAAT.Math.Point().set(cp0x, cp0y ) );
                this.coordlist.push( new CAAT.Math.Point().set(cp1x, cp1y ) );
                this.coordlist.push( new CAAT.Math.Point().set(cp2x, cp2y ) );
                this.coordlist.push( new CAAT.Math.Point().set(cp3x, cp3y ) );

                this.cubic= true;
                this.update();

                return this;
            },
            /**
             * Set this curve as a quadric bezier defined by the three control points.
             * @param cp0x {number}
             * @param cp0y {number}
             * @param cp1x {number}
             * @param cp1y {number}
             * @param cp2x {number}
             * @param cp2y {number}
             */
            setQuadric : function(cp0x,cp0y, cp1x,cp1y, cp2x,cp2y ) {

                this.coordlist= [];

                this.coordlist.push( new CAAT.Math.Point().set(cp0x, cp0y ) );
                this.coordlist.push( new CAAT.Math.Point().set(cp1x, cp1y ) );
                this.coordlist.push( new CAAT.Math.Point().set(cp2x, cp2y ) );

                this.cubic= false;
                this.update();

                return this;
            },
            setPoints : function( points ) {
                if ( points.length===3 ) {
                    this.coordlist= points;
                    this.cubic= false;
                    this.update();
                } else if (points.length===4 ) {
                    this.coordlist= points;
                    this.cubic= true;
                    this.update();
                } else {
                    throw 'points must be an array of 3 or 4 CAAT.Point instances.'
                }

                return this;
            },
            /**
             * Paint this curve.
             * @param director {CAAT.Director}
             */
            paint : function( director ) {
                if ( this.cubic ) {
                    this.paintCubic(director);
                } else {
                    this.paintCuadric( director );
                }

                CAAT.Math.Bezier.superclass.paint.call(this,director);

            },
            /**
             * Paint this quadric Bezier curve. Each time the curve is drawn it will be solved again from 0 to 1 with
             * CAAT.Bezier.k increments.
             *
             * @param director {CAAT.Director}
             * @private
             */
            paintCuadric : function( director ) {
                var x1,y1;
                x1 = this.coordlist[0].x;
                y1 = this.coordlist[0].y;

                var ctx= director.ctx;

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x1,y1);

                var point= new CAAT.Math.Point();
                for(var t=this.k;t<=1+this.k;t+=this.k){
                    this.solve(point,t);
                    ctx.lineTo(point.x, point.y );
                }

                ctx.stroke();
                ctx.restore();

            },
            /**
             * Paint this cubic Bezier curve. Each time the curve is drawn it will be solved again from 0 to 1 with
             * CAAT.Bezier.k increments.
             *
             * @param director {CAAT.Director}
             * @private
             */
            paintCubic : function( director ) {

                var x1,y1;
                x1 = this.coordlist[0].x;
                y1 = this.coordlist[0].y;

                var ctx= director.ctx;

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x1,y1);

                var point= new CAAT.Math.Point();
                for(var t=this.k;t<=1+this.k;t+=this.k){
                    this.solve(point,t);
                    ctx.lineTo(point.x, point.y );
                }

                ctx.stroke();
                ctx.restore();
            },
            /**
             * Solves the curve for any given parameter t.
             * @param point {CAAT.Point} the point to store the solved value on the curve.
             * @param t {number} a number in the range 0..1
             */
            solve : function(point,t) {
                if ( this.cubic ) {
                    return this.solveCubic(point,t);
                } else {
                    return this.solveQuadric(point,t);
                }
            },
            /**
             * Solves a cubic Bezier.
             * @param point {CAAT.Point} the point to store the solved value on the curve.
             * @param t {number} the value to solve the curve for.
             */
            solveCubic : function(point,t) {

                var t2= t*t;
                var t3= t*t2;

                var cl= this.coordlist;
                var cl0= cl[0];
                var cl1= cl[1];
                var cl2= cl[2];
                var cl3= cl[3];

                point.x=(
                    cl0.x + t * (-cl0.x * 3 + t * (3 * cl0.x-
                    cl0.x*t)))+t*(3*cl1.x+t*(-6*cl1.x+
                    cl1.x*3*t))+t2*(cl2.x*3-cl2.x*3*t)+
                    cl3.x * t3;

                point.y=(
                        cl0.y+t*(-cl0.y*3+t*(3*cl0.y-
                        cl0.y*t)))+t*(3*cl1.y+t*(-6*cl1.y+
                        cl1.y*3*t))+t2*(cl2.y*3-cl2.y*3*t)+
                        cl3.y * t3;

                return point;
            },
            /**
             * Solves a quadric Bezier.
             * @param point {CAAT.Point} the point to store the solved value on the curve.
             * @param t {number} the value to solve the curve for.
             */
            solveQuadric : function(point,t) {
                var cl= this.coordlist;
                var cl0= cl[0];
                var cl1= cl[1];
                var cl2= cl[2];
                var t1= 1-t;

                point.x= t1*t1*cl0.x + 2*t1*t*cl1.x + t*t*cl2.x;
                point.y= t1*t1*cl0.y + 2*t1*t*cl1.y + t*t*cl2.y;

                return point;
            }
        }
    }
});
