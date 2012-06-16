/**
 * See LICENSE file.
 *
 * These classes encapsulate different kinds of paths.
 * LinearPath, defines an straight line path, just 2 points.
 * CurvePath, defines a path based on a Curve. Curves can be bezier quadric/cubic and catmull-rom.
 * Path, is a general purpose class, which composes a path of different path segments (Linear or Curve paths).
 *
 * A path, has an interpolator which stablishes the way the path is traversed (accelerating, by
 * easing functions, etc.). Normally, interpolators will be defined by CAAT,Interpolator instances, but
 * general Paths could be used as well.
 *
 **/

(function() {
    /**
     * This is the abstract class that every path segment must conform to.
     * <p>
     * It is implemented by all path segment types, ie:
     * <ul>
     *  <li>LinearPath
     *  <li>CurvePath, base for all curves: quadric and cubic bezier.
     *  <li>Path. A path built of different PathSegment implementations.
     * </ul>
     *
     * @constructor
     */
    CAAT.PathSegment = function() {
        this.bbox= new CAAT.Rectangle();
        return this;
    };

    CAAT.PathSegment.prototype =  {
        color:  '#000',
        length: 0,
        bbox:   null,
        parent: null,

        /**
         * Set a PathSegment's parent
         * @param parent
         */
        setParent : function(parent) {
            this.parent= parent;
            return this;
        },
        setColor : function(color) {
            if ( color ) {
                this.color= color;
            }
            return this;
        },
        /**
         * Get path's last coordinate.
         * @return {CAAT.Point}
         */
		endCurvePosition : function() { },

        /**
         * Get path's starting coordinate.
         * @return {CAAT.Point}
         */
		startCurvePosition : function() { },

        /**
         * Set this path segment's points information.
         * @param points {Array<CAAT.Point>}
         */
        setPoints : function( points ) { },

        /**
         * Set a point from this path segment.
         * @param point {CAAT.Point}
         * @param index {integer} a point index.
         */
        setPoint : function( point, index ) { },

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
        getPosition : function(time) { },

        /**
         * Gets Path length.
         * @return {number}
         */
        getLength : function() {
            return this.length;
        },

        /**
         * Gets the path bounding box (or the rectangle that contains the whole path).
         * @param rectangle a CAAT.Rectangle instance with the bounding box.
         * @return {CAAT.Rectangle}
         */
		getBoundingBox : function() {
            return this.bbox;
        },

        /**
         * Gets the number of control points needed to create the path.
         * Each PathSegment type can have different control points.
         * @return {number} an integer with the number of control points.
         */
		numControlPoints : function() { },

        /**
         * Gets CAAT.Point instance with the 2d position of a control point.
         * @param index an integer indicating the desired control point coordinate.
         * @return {CAAT.Point}
         */
		getControlPoint: function(index) { },

        /**
         * Instruments the path has finished building, and that no more segments will be added to it.
         * You could later add more PathSegments and <code>endPath</code> must be called again.
         */
        endPath : function() {},

        /**
         * Gets a polyline describing the path contour. The contour will be defined by as mush as iSize segments.
         * @param iSize an integer indicating the number of segments of the contour polyline.
         *
         * @return {[CAAT.Point]}
         */
        getContour : function(iSize) {},

        /**
         * Recalculate internal path structures.
         */
        updatePath : function(point) {},

        /**
         * Draw this path using RenderingContext2D drawing primitives.
         * The intention is to set a path or pathsegment as a clipping region.
         *
         * @param ctx {RenderingContext2D}
         */
        applyAsPath : function(director) {},

        /**
         * Transform this path with the given affinetransform matrix.
         * @param matrix
         */
        transform : function(matrix) {},

        drawHandle : function( ctx, x, y ) {
            var w= CAAT.Curve.prototype.HANDLE_SIZE/2;
            ctx.fillRect( x-w, y-w, w*2, w*2 );
            /*
            ctx.arc(
                this.points[0].x,
                this.points[0].y,
                CAAT.Curve.prototype.HANDLE_SIZE/2,
                0,
                2*Math.PI,
                false) ;
                            */
        }
    };

})();

(function() {

    /**
     * Straight line segment path between two given points.
     *
     * @constructor
     * @extends CAAT.PathSegment
     */
	CAAT.LinearPath = function() {
        CAAT.LinearPath.superclass.constructor.call(this);

        this.points= [];
        this.points.push( new CAAT.Point() );
        this.points.push( new CAAT.Point() );

		this.newPosition=       new CAAT.Point(0,0,0);
		return this;
	};
	
	CAAT.LinearPath.prototype= {
        points:             null,
		newPosition:		null,   // spare holder for getPosition coordinate return.

        applyAsPath : function(director) {
            director.ctx.lineTo( this.points[0].x, this.points[1].y );
        },
        setPoint : function( point, index ) {
            if ( index===0 ) {
                this.points[0]= point;
            } else if ( index===1 ) {
                this.points[1]= point;
            }
        },
        /**
         * Update this segments length and bounding box info.
         */
        updatePath : function(point) {
            var x= this.points[1].x - this.points[0].x;
			var y= this.points[1].y - this.points[0].y;
			this.length= Math.sqrt( x*x+y*y );

            this.bbox.setEmpty();
			this.bbox.union( this.points[0].x, this.points[0].y );
			this.bbox.union( this.points[1].x, this.points[1].y );

            return this;
        },
        setPoints : function( points ) {
            this.points[0]= points[0];
            this.points[1]= points[1];
            this.updatePath();
            return this;
        },
        /**
         * Set this path segment's starting position.
         * @param x {number}
         * @param y {number}
         */
		setInitialPosition : function( x, y )	{
			this.points[0].x= x;
			this.points[0].y= y;
			this.newPosition.set(x,y);
            return this;
		},
        /**
         * Set this path segment's ending position.
         * @param finalX {number}
         * @param finalY {number}
         */
		setFinalPosition : function( finalX, finalY )	{
			this.points[1].x= finalX;
			this.points[1].y= finalY;
            return this;
		},
        /**
         * @inheritDoc
         */
        endCurvePosition : function() {
			return this.points[1];
		},
        /**
         * @inheritsDoc
         */
		startCurvePosition : function() {
			return this.points[0];
		},
        /**
         * @inheritsDoc
         */
		getPosition : function(time) {

            if ( time>1 || time<0 ) {
                time%=1;
            }
            if ( time<0 ) {
                time= 1+time;
            }

            this.newPosition.set(
						(this.points[0].x+(this.points[1].x-this.points[0].x)*time),
						(this.points[0].y+(this.points[1].y-this.points[0].y)*time) );

			return this.newPosition;
		},
        getPositionFromLength : function( len ) {
            return this.getPosition( len/this.length );
        },
        /**
         * Returns initial path segment point's x coordinate.
         * @return {number}
         */
		initialPositionX : function() {
			return this.points[0].x;
		},
        /**
         * Returns final path segment point's x coordinate.
         * @return {number}
         */
		finalPositionX : function() {
			return this.points[1].x;
		},
        /**
         * Draws this path segment on screen. Optionally it can draw handles for every control point, in
         * this case, start and ending path segment points.
         * @param director {CAAT.Director}
         * @param bDrawHandles {boolean}
         */
		paint : function(director, bDrawHandles) {
			
			var ctx= director.ctx;

            ctx.save();

            ctx.strokeStyle= this.color;
			ctx.beginPath();
			ctx.moveTo( this.points[0].x, this.points[0].y );
			ctx.lineTo( this.points[1].x, this.points[1].y );
			ctx.stroke();

            if ( bDrawHandles ) {
                ctx.globalAlpha=0.5;
                ctx.fillStyle='#7f7f00';
                ctx.beginPath();
                this.drawHandle( ctx, this.points[0].x, this.points[0].y );
                this.drawHandle( ctx, this.points[1].x, this.points[1].y );
                /*
                canvas.arc(
                        this.points[0].x,
                        this.points[0].y,
                        CAAT.Curve.prototype.HANDLE_SIZE/2,
                        0,
                        2*Math.PI,
                        false) ;
                canvas.arc(
                        this.points[1].x,
                        this.points[1].y,
                        CAAT.Curve.prototype.HANDLE_SIZE/2,
                        0,
                        2*Math.PI,
                        false) ;
                canvas.fill();
                */
            }

            ctx.restore();
		},
        /**
         * Get the number of control points. For this type of path segment, start and
         * ending path segment points. Defaults to 2.
         * @return {number}
         */
		numControlPoints : function() {
			return 2;
		},
        /**
         * @inheritsDoc
         */
		getControlPoint: function(index) {
			if ( 0===index ) {
				return this.points[0];
			} else if (1===index) {
				return this.points[1];
			}
		},
        /**
         * @inheritsDoc
         */
        getContour : function(iSize) {
            var contour= [];

            contour.push( this.getPosition(0).clone() );
            contour.push( this.getPosition(1).clone() );

            return contour;
        }
	};

    extend( CAAT.LinearPath, CAAT.PathSegment );
})();

(function() {
    /**
     * This class defines a Bezier cubic or quadric path segment.
     *
     * @constructor
     * @extends CAAT.PathSegment
     */
	CAAT.CurvePath = function() {
        CAAT.CurvePath.superclass.constructor.call(this);
		this.newPosition= new CAAT.Point(0,0,0);
		return this;
	};
	
	CAAT.CurvePath.prototype= {
		curve:	            null,   // a CAAT.Bezier instance.
		newPosition:		null,   // spare holder for getPosition coordinate return.

        applyAsPath : function(director) {
            this.curve.applyAsPath(director);
            return this;
        },
        setPoint : function( point, index ) {
            if ( this.curve ) {
                this.curve.setPoint(point,index);
            }
        },
        /**
         * Set this curve segment's points.
         * @param points {Array<CAAT.Point>}
         */
        setPoints : function( points ) {
            var curve = new CAAT.Bezier();
            curve.setPoints(points);
            this.curve = curve;
            return this;
        },
        /**
         * Set the pathSegment as a CAAT.Bezier quadric instance.
         * Parameters are quadric coordinates control points.
         *
         * @param p0x {number}
         * @param p0y {number}
         * @param p1x {number}
         * @param p1y {number}
         * @param p2x {number}
         * @param p2y {number}
         * @return this
         */
        setQuadric : function(p0x,p0y, p1x,p1y, p2x,p2y) {
	        var curve = new CAAT.Bezier();
	        curve.setQuadric(p0x,p0y, p1x,p1y, p2x,p2y);
	        this.curve = curve;
            this.updatePath();

            return this;
        },
        /**
         * Set the pathSegment as a CAAT.Bezier cubic instance.
         * Parameters are cubic coordinates control points.
         * @param p0x {number}
         * @param p0y {number}
         * @param p1x {number}
         * @param p1y {number}
         * @param p2x {number}
         * @param p2y {number}
         * @param p3x {number}
         * @param p3y {number}
         * @return this
         */
        setCubic : function(p0x,p0y, p1x,p1y, p2x,p2y, p3x,p3y) {
	        var curve = new CAAT.Bezier();
	        curve.setCubic(p0x,p0y, p1x,p1y, p2x,p2y, p3x,p3y);
	        this.curve = curve;
            this.updatePath();

            return this;
        },
        /**
         * @inheritDoc
         */
		updatePath : function(point) {
			this.curve.update();
            this.length= this.curve.getLength();
            this.curve.getBoundingBox(this.bbox);
            return this;
		},
        /**
         * @inheritDoc
         */
		getPosition : function(time) {

            if ( time>1 || time<0 ) {
                time%=1;
            }
            if ( time<0 ) {
                time= 1+time;
            }

            this.curve.solve(this.newPosition, time);

			return this.newPosition;
		},
        /**
         * Gets the coordinate on the path relative to the path length.
         * @param iLength {number} the length at which the coordinate will be taken from.
         * @return {CAAT.Point} a CAAT.Point instance with the coordinate on the path corresponding to the
         * iLenght parameter relative to segment's length.
         */
		getPositionFromLength : function(iLength) {
			this.curve.solve( this.newPosition, iLength/this.length );
			return this.newPosition;
		},
        /**
         * Get path segment's first point's x coordinate.
         * @return {number}
         */
		initialPositionX : function() {
			return this.curve.coordlist[0].x;
		},
        /**
         * Get path segment's last point's y coordinate.
         * @return {number}
         */
		finalPositionX : function() {
			return this.curve.coordlist[this.curve.coordlist.length-1].x;
		},
        /**
         * @inheritDoc
         * @param director {CAAT.Director}
         * @param bDrawHandles {boolean}
         */
		paint : function( director,bDrawHandles ) {
            this.curve.drawHandles= bDrawHandles;
            director.ctx.strokeStyle= this.color;
			this.curve.paint(director,bDrawHandles);
		},
        /**
         * @inheritDoc
         */
		numControlPoints : function() {
			return this.curve.coordlist.length;
		},
        /**
         * @inheritDoc
         * @param index
         */
		getControlPoint : function(index) {
			return this.curve.coordlist[index];
		},
        /**
         * @inheritDoc
         */
		endCurvePosition : function() {
			return this.curve.endCurvePosition();
		},
        /**
         * @inheritDoc
         */
		startCurvePosition : function() {
			return this.curve.startCurvePosition();
		},
        /**
         * @inheritDoc
         * @param iSize
         */
        getContour : function(iSize) {
            var contour=[];
            for( var i=0; i<=iSize; i++ ) {
                contour.push( {x: i/iSize, y: this.getPosition(i/iSize).y} );
            }

            return contour;
        }
	};

    extend( CAAT.CurvePath, CAAT.PathSegment, null);
	
})();

(function() {

    CAAT.ShapePath= function() {
        CAAT.ShapePath.superclass.constructor.call(this);

        this.points= [];
        this.points.push( new CAAT.Point() );
        this.points.push( new CAAT.Point() );
        this.points.push( new CAAT.Point() );
        this.points.push( new CAAT.Point() );
        this.points.push( new CAAT.Point() );

        this.newPosition= new CAAT.Point();

		return this;
    };

    CAAT.ShapePath.prototype= {
        points:             null,
        length:             -1,
        cw:                 true,   // should be clock wise traversed ?
        bbox:               null,
        newPosition:        null,   // spare point for calculations

        applyAsPath : function(director) {
            var ctx= director.ctx;
            //ctx.rect( this.bbox.x, this.bbox.y, this.bbox.width, this.bbox.height );
            if ( this.cw ) {
                ctx.lineTo( this.points[0].x, this.points[0].y );
                ctx.lineTo( this.points[1].x, this.points[1].y );
                ctx.lineTo( this.points[2].x, this.points[2].y );
                ctx.lineTo( this.points[3].x, this.points[3].y );
                ctx.lineTo( this.points[4].x, this.points[4].y );
            } else {
                ctx.lineTo( this.points[4].x, this.points[4].y );
                ctx.lineTo( this.points[3].x, this.points[3].y );
                ctx.lineTo( this.points[2].x, this.points[2].y );
                ctx.lineTo( this.points[1].x, this.points[1].y );
                ctx.lineTo( this.points[0].x, this.points[0].y );
            }
            return this;
        },
        setPoint : function( point, index ) {
            if ( index>=0 && index<this.points.length ) {
                this.points[index]= point;
            }
        },
        /**
         * An array of {CAAT.Point} composed of two points.
         * @param points {Array<CAAT.Point>}
         */
        setPoints : function( points ) {
            this.points= [];
            this.points.push( points[0] );
            this.points.push( new CAAT.Point().set(points[1].x, points[0].y) );
            this.points.push( points[1] );
            this.points.push( new CAAT.Point().set(points[0].x, points[1].y) );
            this.points.push( points[0].clone() );
            this.updatePath();

            return this;
        },
        setClockWise : function(cw) {
            this.cw= cw!==undefined ? cw : true;
            return this;
        },
        isClockWise : function() {
            return this.cw;
        },
        /**
         * Set this path segment's starting position.
         * This method should not be called again after setFinalPosition has been called.
         * @param x {number}
         * @param y {number}
         */
		setInitialPosition : function( x, y )	{
            for( var i=0, l= this.points.length; i<l; i++ ) {
			    this.points[i].x= x;
			    this.points[i].y= y;
            }
            return this;
		},
        /**
         * Set a rectangle from points[0] to (finalX, finalY)
         * @param finalX {number}
         * @param finalY {number}
         */
		setFinalPosition : function( finalX, finalY )	{
			this.points[2].x= finalX;
            this.points[2].y= finalY;

            this.points[1].x= finalX;
            this.points[1].y= this.points[0].y;

            this.points[3].x= this.points[0].x;
            this.points[3].y= finalY;

            this.points[4].x= this.points[0].x;
            this.points[4].y= this.points[0].y;

            this.updatePath();
            return this;
		},
        /**
         * @inheritDoc
         */
        endCurvePosition : function() {
			return this.points[4];
		},
        /**
         * @inheritsDoc
         */
		startCurvePosition : function() {
			return this.points[0];
		},
        /**
         * @inheritsDoc
         */
		getPosition : function(time) {

            if ( time>1 || time<0 ) {
                time%=1;
            }
            if ( time<0 ) {
                time= 1+time;
            }

            if ( -1===this.length ) {
                this.newPosition.set(0,0);
            } else {
                var w= this.bbox.width / this.length;
                var h= this.bbox.height / this.length;
                var accTime= 0;
                var times;
                var segments;
                var index= 0;

                if ( this.cw ) {
                    segments= [0,1,2,3,4];
                    times= [w,h,w,h];
                } else {
                    segments= [4,3,2,1,0];
                    times= [h,w,h,w];
                }

                while( index<times.length ) {
                    if ( accTime+times[index]<time ) {
                        accTime+= times[index];
                        index++;
                    } else {
                        break;
                    }
                }
                time-=accTime;

                var p0= segments[index];
                var p1= segments[index+1];

                // index tiene el indice del segmento en tiempo.
                this.newPosition.set(
                        (this.points[p0].x + (this.points[p1].x - this.points[p0].x)*time/times[index]),
                        (this.points[p0].y + (this.points[p1].y - this.points[p0].y)*time/times[index]) );
            }

			return this.newPosition;
		},
        /**
         * Returns initial path segment point's x coordinate.
         * @return {number}
         */
		initialPositionX : function() {
			return this.points[0].x;
		},
        /**
         * Returns final path segment point's x coordinate.
         * @return {number}
         */
		finalPositionX : function() {
			return this.points[2].x;
		},
        /**
         * Draws this path segment on screen. Optionally it can draw handles for every control point, in
         * this case, start and ending path segment points.
         * @param director {CAAT.Director}
         * @param bDrawHandles {boolean}
         */
		paint : function(director, bDrawHandles) {

			var ctx= director.ctx;

            ctx.save();

            ctx.strokeStyle= this.color;
			ctx.beginPath();
			ctx.strokeRect(
                this.bbox.x, this.bbox.y,
                this.bbox.width, this.bbox.height );

            if ( bDrawHandles ) {
                ctx.globalAlpha=0.5;
                ctx.fillStyle='#7f7f00';

                for( var i=0; i<this.points.length; i++ ) {
                    this.drawHandle( ctx, this.points[i].x, this.points[i].y );
                    /*
                    canvas.beginPath();
                    canvas.arc(
                            this.points[i].x,
                            this.points[i].y,
                            CAAT.Curve.prototype.HANDLE_SIZE/2,
                            0,
                            2*Math.PI,
                            false) ;
                    canvas.fill();
                    */
                }

            }

            ctx.restore();
		},
        /**
         * Get the number of control points. For this type of path segment, start and
         * ending path segment points. Defaults to 2.
         * @return {number}
         */
		numControlPoints : function() {
			return this.points.length;
		},
        /**
         * @inheritsDoc
         */
		getControlPoint: function(index) {
            return this.points[index];
		},
        /**
         * @inheritsDoc
         */
        getContour : function(iSize) {
            var contour= [];

            for( var i=0; i<this.points.length; i++ ) {
                contour.push( this.points[i] );
            }

            return contour;
        },
        updatePath : function(point) {

            if ( point ) {
                if ( point===this.points[0] ) {
                    this.points[1].y= point.y;
                    this.points[3].x= point.x;
                } else if ( point===this.points[1] ) {
                    this.points[0].y= point.y;
                    this.points[2].x= point.x;
                } else if ( point===this.points[2] ) {
                    this.points[3].y= point.y;
                    this.points[1].x= point.x;
                } else if ( point===this.points[3] ) {
                    this.points[0].x= point.x;
                    this.points[2].y= point.y;
                }
                this.points[4].x= this.points[0].x;
                this.points[4].y= this.points[0].y;
            }

            this.bbox.setEmpty();
            var minx= Number.MAX_VALUE, miny= Number.MAX_VALUE, maxx= -Number.MAX_VALUE, maxy= -Number.MAX_VALUE;
            for( var i=0; i<4; i++ ) {
                this.bbox.union( this.points[i].x, this.points[i].y );
            }

            this.length= 2*this.bbox.width + 2*this.bbox.height;

            this.points[0].x= this.bbox.x;
            this.points[0].y= this.bbox.y;

            this.points[1].x= this.bbox.x+this.bbox.width;
            this.points[1].y= this.bbox.y;

            this.points[2].x= this.bbox.x + this.bbox.width;
            this.points[2].y= this.bbox.y + this.bbox.height;

            this.points[3].x= this.bbox.x;
            this.points[3].y= this.bbox.y + this.bbox.height;

            this.points[4].x= this.bbox.x;
            this.points[4].y= this.bbox.y;

            return this;
        }
    }

    extend( CAAT.ShapePath, CAAT.PathSegment );

})();

(function() {

    /**
     * This class the top most abstraction of path related classes in CAAT. It defines a path composes un
     * an unlimited number of path segments including CAAT.Path instances.
     * <p>
     * Every operation of the CAAT.PathSegment interface is performed for every path segment. In example,
     * the method <code>getLength</code> will contain the sum of every path segment's length.
     * <p>
     * An example of CAAT.Path will be as follows:

     * <code>
     * path.beginPath(x,y).<br>
     * &nbsp;&nbsp;addLineTo(x1,y1).<br>
     * &nbsp;&nbsp;addLineTo(x2,y2).<br>
     * &nbsp;&nbsp;addQuadricTo(...).<br>
     * &nbsp;&nbsp;addCubicTo(...).<br>
     * &nbsp;&nbsp;endPath();<br>
     * </code>
     * <p>
     * This code creates a path composed of four chained segments, starting at (x,y) and having each
     * segment starting where the previous one ended.
     * <p>
     * This class is intended to wrap the other kind of path segment classes when just a one segmented
     * path is to be defined. The methods <code>setLinear, setCubic and setQuadrid</code> will make
     * a CAAT.Path instance to be defined by just one segment.
     *
     * @constructor
     * @extends CAAT.PathSegment
     */
	CAAT.Path= function()	{
        CAAT.Path.superclass.constructor.call(this);

		this.newPosition=   new CAAT.Point(0,0,0);
		this.pathSegments=  [];

        this.behaviorList=  [];
        this.matrix=        new CAAT.Matrix();
        this.tmpMatrix=     new CAAT.Matrix();
        
		return this;
	};
	
	CAAT.Path.prototype= {
			
		pathSegments:	            null,   // a collection of CAAT.PathSegment instances.
		pathSegmentDurationTime:	null,   // precomputed segment duration relative to segment legnth/path length
		pathSegmentStartTime:		null,   // precomputed segment start time relative to segment legnth/path length and duration.

		newPosition:	            null,   // spare CAAT.Point.
		
		pathLength:		            -1,     // path length (sum of every segment length)

        /*
            starting path position
         */
		beginPathX:		            -1,
		beginPathY:                 -1,

        /*
            last path coordinates position (using when building the path).
         */
		trackPathX:		            -1,
		trackPathY:		            -1,

        /*
            needed to drag control points.
          */
		ax:                         -1,
		ay:                         -1,
		point:                      [],

        interactive:                true,

        behaviorList:               null,

        /** rotation behavior info **/
        rb_angle:                   0,
        rb_rotateAnchorX:           .5,
        rb_rotateAnchorY:           .5,

        /** scale behavior info **/
        sb_scaleX:                  1,
        sb_scaleY:                  1,
        sb_scaleAnchorX:            .5,
        sb_scaleAnchorY:            .5,

        tAnchorX:                   0,
        tAnchorY:                   0,

        /** translate behavior info **/
        tb_x:                       0,
        tb_y:                       0,

        /** behavior affine transformation matrix **/
        matrix:                     null,
        tmpMatrix:                  null,

        /** if behaviors are to be applied, save original path points **/
        pathPoints:                 null,

        /** path width and height **/
        width:                      0,
        height:                     0,

        clipOffsetX             :   0,
        clipOffsetY             :   0,

        applyAsPath : function(director) {
            var ctx= director.ctx;

            director.modelViewMatrix.transformRenderingContext( ctx );
            ctx.beginPath();
            ctx.globalCompositeOperation= 'source-out';
            ctx.moveTo(
                this.getFirstPathSegment().startCurvePosition().x,
                this.getFirstPathSegment().startCurvePosition().y
            );
            for( var i=0; i<this.pathSegments.length; i++ ) {
                this.pathSegments[i].applyAsPath(director);
            }
            ctx.globalCompositeOperation= 'source-over';
            return this;
        },
        /**
         * Set whether this path should paint handles for every control point.
         * @param interactive {boolean}.
         */
        setInteractive : function(interactive) {
            this.interactive= interactive;
            return this;
        },
        getFirstPathSegment : function() {
            return this.pathSegments.length ?
                this.pathSegments[0] :
                null;
        },
        getLastPathSegment : function() {
            return this.pathSegments.length ?
                this.pathSegments[ this.pathSegments.length-1 ] :
                null;
        },
        /**
         * Return the last point of the last path segment of this compound path.
         * @return {CAAT.Point}
         */
        endCurvePosition : function() {
            if ( this.pathSegments.length ) {
                return this.pathSegments[ this.pathSegments.length-1 ].endCurvePosition();
            } else {
                return new CAAT.Point().set( this.beginPathX, this.beginPathY );
            }
        },
        /**
         * Return the first point of the first path segment of this compound path.
         * @return {CAAT.Point}
         */
        startCurvePosition : function() {
            return this.pathSegments[ 0 ].startCurvePosition();
        },
        /**
         * Return the last path segment added to this path.
         * @return {CAAT.PathSegment}
         */
        getCurrentPathSegment : function() {
            return this.pathSegments[ this.pathSegments.length-1 ];
        },
        /**
         * Set the path to be composed by a single LinearPath segment.
         * @param x0 {number}
         * @param y0 {number}
         * @param x1 {number}
         * @param y1 {number}
         * @return this
         */
        setLinear : function(x0,y0,x1,y1) {
            this.beginPath(x0,y0);
            this.addLineTo(x1,y1);
            this.endPath();

            return this;
        },
        /**
         * Set this path to be composed by a single Quadric Bezier path segment.
         * @param x0 {number}
         * @param y0 {number}
         * @param x1 {number}
         * @param y1 {number}
         * @param x2 {number}
         * @param y2 {number}
         * @return this
         */
        setQuadric : function(x0,y0,x1,y1,x2,y2) {
            this.beginPath(x0,y0);
            this.addQuadricTo(x1,y1,x2,y2);
            this.endPath();

            return this;
        },
        /**
         * Sets this path to be composed by a single Cubic Bezier path segment.
         * @param x0 {number}
         * @param y0 {number}
         * @param x1 {number}
         * @param y1 {number}
         * @param x2 {number}
         * @param y2 {number}
         * @param x3 {number}
         * @param y3 {number}
         *
         * @return this
         */
        setCubic : function(x0,y0,x1,y1,x2,y2,x3,y3) {
            this.beginPath(x0,y0);
            this.addCubicTo(x1,y1,x2,y2,x3,y3);
            this.endPath();

            return this;
        },
        setRectangle : function(x0,y0, x1,y1) {
            this.beginPath(x0,y0);
            this.addRectangleTo(x1,y1);
            this.endPath();

            return this;
        },
        setCatmullRom : function( points, closed ) {
            if ( closed ) {
                points = points.slice(0)
                points.unshift(points[points.length-1])
                points.push(points[1])
                points.push(points[2])
            }

            for( var i=1; i<points.length-2; i++ ) {

                var segment= new CAAT.CurvePath().setColor("#000").setParent(this);
                var cm= new CAAT.CatmullRom().setCurve(
                    points[ i-1 ],
                    points[ i ],
                    points[ i+1 ],
                    points[ i+2 ]
                );
                segment.curve= cm;
                this.pathSegments.push(segment);
            }
            return this;
        },
        /**
         * Add a CAAT.PathSegment instance to this path.
         * @param pathSegment {CAAT.PathSegment}
         * @return this
         *
         * @deprecated
         */
		addSegment : function(pathSegment) {
            pathSegment.setParent(this);
			this.pathSegments.push(pathSegment);
            return this;
		},
        addRectangleTo : function( x1,y1, cw, color ) {
            var r= new CAAT.ShapePath();
            r.setPoints([
                    this.endCurvePosition(),
                    new CAAT.Point().set(x1,y1)
                ]);

            r.setClockWise(cw);
            r.setColor(color);
            r.setParent(this);

            this.pathSegments.push(r);

            return this;
        },
        /**
         * Add a Quadric Bezier path segment to this path.
         * The segment starts in the current last path coordinate.
         * @param px1 {number}
         * @param py1 {number}
         * @param px2 {number}
         * @param py2 {number}
         * @param color {color=}. optional parameter. determines the color to draw the segment with (if
         *         being drawn by a CAAT.PathActor).
         *
         * @return this
         */
		addQuadricTo : function( px1,py1, px2,py2, color ) {
			var bezier= new CAAT.Bezier();

            bezier.setPoints(
                [
                    this.endCurvePosition(),
                    new CAAT.Point().set(px1,py1),
                    new CAAT.Point().set(px2,py2)
                ]);

			this.trackPathX= px2;
			this.trackPathY= py2;
			
			var segment= new CAAT.CurvePath().setColor(color).setParent(this);
			segment.curve= bezier;

			this.pathSegments.push(segment);

            return this;
		},
        /**
         * Add a Cubic Bezier segment to this path.
         * The segment starts in the current last path coordinate.
         * @param px1 {number}
         * @param py1 {number}
         * @param px2 {number}
         * @param py2 {number}
         * @param px3 {number}
         * @param py3 {number}
         * @param color {color=}. optional parameter. determines the color to draw the segment with (if
         *         being drawn by a CAAT.PathActor).
         *
         * @return this
         */
		addCubicTo : function( px1,py1, px2,py2, px3,py3, color ) {
			var bezier= new CAAT.Bezier();

            bezier.setPoints(
                [
                    this.endCurvePosition(),
                    new CAAT.Point().set(px1,py1),
                    new CAAT.Point().set(px2,py2),
                    new CAAT.Point().set(px3,py3)
                ]);

			this.trackPathX= px3;
			this.trackPathY= py3;
			
			var segment= new CAAT.CurvePath().setColor(color).setParent(this);
			segment.curve= bezier;

			this.pathSegments.push(segment);
            return this;
		},
        /**
         * Add a Catmull-Rom segment to this path.
         * The segment starts in the current last path coordinate.
         * @param px1 {number}
         * @param py1 {number}
         * @param px2 {number}
         * @param py2 {number}
         * @param px3 {number}
         * @param py3 {number}
         * @param color {color=}. optional parameter. determines the color to draw the segment with (if
         *         being drawn by a CAAT.PathActor).
         *
         * @return this
         */
		addCatmullTo : function( px1,py1, px2,py2, px3,py3, color ) {
			var curve= new CAAT.CatmullRom().setColor(color);
			curve.setCurve(this.trackPathX,this.trackPathY, px1,py1, px2,py2, px3,py3);
			this.trackPathX= px3;
			this.trackPathY= py3;
			
			var segment= new CAAT.CurvePath().setParent(this);
			segment.curve= curve;

			this.pathSegments.push(segment);
            return this;
		},
        /**
         * Adds a line segment to this path.
         * The segment starts in the current last path coordinate.
         * @param px1 {number}
         * @param py1 {number}
         * @param color {color=}. optional parameter. determines the color to draw the segment with (if
         *         being drawn by a CAAT.PathActor).
         *
         * @return this
         */
		addLineTo : function( px1,py1, color ) {
			var segment= new CAAT.LinearPath().setColor(color);
            segment.setPoints( [
                    this.endCurvePosition(),
                    new CAAT.Point().set(px1,py1)
                ]);

            segment.setParent(this);

			this.trackPathX= px1;
			this.trackPathY= py1;
			
			this.pathSegments.push(segment);
            return this;
		},
        /**
         * Set the path's starting point. The method startCurvePosition will return this coordinate.
         * <p>
         * If a call to any method of the form <code>add<Segment>To</code> is called before this calling
         * this method, they will assume to start at -1,-1 and probably you'll get the wrong path.
         * @param px0 {number}
         * @param py0 {number}
         *
         * @return this
         */
		beginPath : function( px0, py0 ) {
			this.trackPathX= px0;
			this.trackPathY= py0;
			this.beginPathX= px0;
			this.beginPathY= py0;
            return this;
		},
        /**
         * <del>Close the path by adding a line path segment from the current last path
         * coordinate to startCurvePosition coordinate</del>.
         * <p>
         * This method closes a path by setting its last path segment's last control point
         * to be the first path segment's first control point.
         * <p>
         *     This method also sets the path as finished, and calculates all path's information
         *     such as length and bounding box.
         *
         * @return this
         */
		closePath : function()	{

            this.getLastPathSegment().setPoint(
                this.getFirstPathSegment().startCurvePosition(),
                this.getLastPathSegment().numControlPoints()-1 );


			this.trackPathX= this.beginPathX;
			this.trackPathY= this.beginPathY;
			
			this.endPath();
            return this;
		},
        /**
         * Finishes the process of building the path. It involves calculating each path segments length
         * and proportional length related to a normalized path length of 1.
         * It also sets current paths length.
         * These calculi are needed to traverse the path appropriately.
         * <p>
         * This method must be called explicitly, except when closing a path (that is, calling the
         * method closePath) which calls this method as well.
         *
         * @return this
         */
		endPath : function() {

			this.pathSegmentStartTime=[];
			this.pathSegmentDurationTime= [];

            this.updatePath();

            return this;
		},
        /**
         * This method, returns a CAAT.Point instance indicating a coordinate in the path.
         * The returned coordinate is the corresponding to normalizing the path's length to 1,
         * and then finding what path segment and what coordinate in that path segment corresponds
         * for the input time parameter.
         * <p>
         * The parameter time must be a value ranging 0..1.
         * If not constrained to these values, the parameter will be modulus 1, and then, if less
         * than 0, be normalized to 1+time, so that the value always ranges from 0 to 1.
         * <p>
         * This method is needed when traversing the path throughout a CAAT.Interpolator instance.
         *
         * @param time a value between 0 and 1 both inclusive. 0 will return path's starting coordinate.
         * 1 will return path's end coordinate.
         *
         * @return {CAAT.Point}
         */
		getPosition : function(time) {

            if ( time>1 || time<0 ) {
                time%=1;
            }
            if ( time<0 ) {
                time= 1+time;
            }

            /*
            var found= false;
            for( var i=0; i<this.pathSegments.length; i++ ) {
                if (this.pathSegmentStartTime[i]<=time && time<=this.pathSegmentStartTime[i]+this.pathSegmentDurationTime[i]) {
                    time= this.pathSegmentDurationTime[i] ?
                            (time-this.pathSegmentStartTime[i])/this.pathSegmentDurationTime[i] :
                            0;
                    var pointInPath= this.pathSegments[i].getPosition(time);
                    this.newPosition.x= pointInPath.x;
                    this.newPosition.y= pointInPath.y;
                    found= true;
                    break;
                }
            }

			return found ? this.newPosition : this.endCurvePosition();
			*/


            var ps= this.pathSegments;
            var psst= this.pathSegmentStartTime;
            var psdt= this.pathSegmentDurationTime;
            var l=  0;
            var r=  ps.length;
            var m;
            var np= this.newPosition;
            var psstv;
            while( l!==r ) {

                m= ((r+l)/2)|0;
                psstv= psst[m];
                if ( psstv<=time && time<=psstv+psdt[m]) {
                    time= psdt[m] ?
                            (time-psstv)/psdt[m] :
                            0;

                    var pointInPath= ps[m].getPosition(time);
                    np.x= pointInPath.x;
                    np.y= pointInPath.y;
                    return np;
                } else if ( time<psstv ) {
                    r= m;
                } else /*if ( time>=psstv )*/ {
                    l= m+1;
                }
            }
            return this.endCurvePosition();


		},
        /**
         * Analogously to the method getPosition, this method returns a CAAT.Point instance with
         * the coordinate on the path that corresponds to the given length. The input length is
         * related to path's length.
         *
         * @param iLength {number} a float with the target length.
         * @return {CAAT.Point}
         */
		getPositionFromLength : function(iLength) {
			
			iLength%=this.getLength();
			if (iLength<0 ) {
				iLength+= this.getLength();
			}
			
			var accLength=0;
			
			for( var i=0; i<this.pathSegments.length; i++ ) {
				if (accLength<=iLength && iLength<=this.pathSegments[i].getLength()+accLength) {
					iLength-= accLength;
					var pointInPath= this.pathSegments[i].getPositionFromLength(iLength);
					this.newPosition.x= pointInPath.x;
					this.newPosition.y= pointInPath.y;
					break;
				}
				accLength+= this.pathSegments[i].getLength();
			}
			
			return this.newPosition;
		},
        /**
         * Paints the path.
         * This method is called by CAAT.PathActor instances.
         * If the path is set as interactive (by default) path segment will draw curve modification
         * handles as well.
         *
         * @param director {CAAT.Director} a CAAT.Director instance.
         */
		paint : function( director ) {
			for( var i=0; i<this.pathSegments.length; i++ ) {
				this.pathSegments[i].paint(director,this.interactive);
			}
		},
        /**
         * Method invoked when a CAAT.PathActor stops dragging a control point.
         */
		release : function() {
			this.ax= -1;
			this.ay= -1;
		},
        /**
         * Returns an integer with the number of path segments that conform this path.
         * @return {number}
         */
        getNumSegments : function() {
            return this.pathSegments.length;
        },
        /**
         * Gets a CAAT.PathSegment instance.
         * @param index {number} the index of the desired CAAT.PathSegment.
         * @return CAAT.PathSegment
         */
		getSegment : function(index) {
			return this.pathSegments[index];
		},

        numControlPoints : function() {
            return this.points.length;
        },

        getControlPoint : function(index) {
            return this.points[index];
        },

        /**
         * Indicates that some path control point has changed, and that the path must recalculate
         * its internal data, ie: length and bbox.
         */
		updatePath : function(point, callback) {
            var i,j;

            this.length=0;
            this.bbox.setEmpty();
            this.points= [];

            var xmin= Number.MAX_VALUE, ymin= Number.MAX_VALUE;
			for( i=0; i<this.pathSegments.length; i++ ) {
				this.pathSegments[i].updatePath(point);
                this.length+= this.pathSegments[i].getLength();
                this.bbox.unionRectangle( this.pathSegments[i].bbox );

                for( j=0; j<this.pathSegments[i].numControlPoints(); j++ ) {
                    var pt= this.pathSegments[i].getControlPoint( j );
                    this.points.push( pt );
                    if ( pt.x < xmin ) {
                        xmin= pt.x;
                    }
                    if ( pt.y < ymin ) {
                        ymin= pt.y;
                    }
                }
			}

            this.clipOffsetX= -xmin;
            this.clipOffsetY= -ymin;

            this.width= this.bbox.width;
            this.height= this.bbox.height;
            this.setLocation( this.bbox.x, this.bbox.y );
            this.bbox.x= 0;
            this.bbox.y= 0;
            this.bbox.x1= this.width;
            this.bbox.y1= this.height;

            this.pathSegmentStartTime=      [];
            this.pathSegmentDurationTime=   [];
            
            var i;
            for( i=0; i<this.pathSegments.length; i++) {
                this.pathSegmentStartTime.push(0);
                this.pathSegmentDurationTime.push(0);
            }

            for( i=0; i<this.pathSegments.length; i++) {
                this.pathSegmentDurationTime[i]= this.getLength() ? this.pathSegments[i].getLength()/this.getLength() : 0;
                if ( i>0 ) {
                    this.pathSegmentStartTime[i]= this.pathSegmentStartTime[i-1]+this.pathSegmentDurationTime[i-1];
                } else {
                    this.pathSegmentStartTime[0]= 0;
                }

                this.pathSegments[i].endPath();
            }

            this.extractPathPoints();

            if ( callback ) {
                callback(this);
            }

            return this;

		},
        /**
         * Sent by a CAAT.PathActor instance object to try to drag a path's control point.
         * @param x {number}
         * @param y {number}
         */
		press: function(x,y) {
            if (!this.interactive) {
                return;
            }

            var HS= CAAT.Curve.prototype.HANDLE_SIZE/2;
			for( var i=0; i<this.pathSegments.length; i++ ) {
				for( var j=0; j<this.pathSegments[i].numControlPoints(); j++ ) {
					var point= this.pathSegments[i].getControlPoint(j);
					if ( x>=point.x-HS &&
						 y>=point.y-HS &&
						 x<point.x+HS &&
						 y<point.y+HS ) {
						
						this.point= point;
						return;
					}
				}
			}
			this.point= null;
		},
        /**
         * Drags a path's control point.
         * If the method press has not set needed internal data to drag a control point, this
         * method will do nothing, regardless the user is dragging on the CAAT.PathActor delegate.
         * @param x {number}
         * @param y {number}
         */
		drag : function(x,y,callback) {
            if (!this.interactive) {
                return;
            }

			if ( null===this.point ) {
				return;
			}
			
			if ( -1===this.ax || -1===this.ay ) {
				this.ax= x;
				this.ay= y;
			}
			
            this.point.x+= x-this.ax;
            this.point.y+= y-this.ay;

			this.ax= x;
			this.ay= y;

			this.updatePath(this.point,callback);
		},
        /**
         * Returns a collection of CAAT.Point objects which conform a path's contour.
         * @param iSize {number}. Number of samples for each path segment.
         * @return {[CAAT.Point]}
         */
        getContour : function(iSize) {
            var contour=[];
            for( var i=0; i<=iSize; i++ ) {
                contour.push( new CAAT.Point().set( i/iSize, this.getPosition(i/iSize).y, 0 ) );
            }

            return contour;
        },

        /**
         * Reposition this path points.
         * This operation will only take place if the supplied points array equals in size to
         * this path's already set points.
         * @param points {Array<CAAT.Point>}
         */
        setPoints : function( points ) {
            if ( this.points.length===points.length ) {
                for( var i=0; i<points.length; i++ ) {
                    this.points[i].x= points[i].x;
                    this.points[i].y= points[i].y;
                }
            }
            return this;
        },

        /**
         * Set a point from this path.
         * @param point {CAAT.Point}
         * @param index {integer} a point index.
         */
        setPoint : function( point, index ) {
            if ( index>=0 && index<this.points.length ) {
                this.points[index].x= point.x;
                this.points[index].y= point.y;
            }
            return this;
        },


        /**
         * Removes all behaviors from an Actor.
         * @return this
         */
		emptyBehaviorList : function() {
			this.behaviorList=[];
            return this;
		},

        extractPathPoints : function() {
            if ( !this.pathPoints ) {
                var i;
                this.pathPoints= [];
                for ( i=0; i<this.numControlPoints(); i++ ) {
                    this.pathPoints.push( this.getControlPoint(i).clone() );
                }
            }

            return this;
        },

        /**
         * Add a Behavior to the Actor.
         * An Actor accepts an undefined number of Behaviors.
         *
         * @param behavior {CAAT.Behavior} a CAAT.Behavior instance
         * @return this
         */
		addBehavior : function( behavior )	{
			this.behaviorList.push(behavior);
//            this.extractPathPoints();
            return this;
		},
        /**
         * Remove a Behavior from the Actor.
         * If the Behavior is not present at the actor behavior collection nothing happends.
         *
         * @param behavior {CAAT.Behavior} a CAAT.Behavior instance.
         */
        removeBehaviour : function( behavior ) {
            var n= this.behaviorList.length-1;
            while(n) {
                if ( this.behaviorList[n]===behavior ) {
                    this.behaviorList.splice(n,1);
                    return this;
                }
            }

            return this;
        },
        /**
         * Remove a Behavior with id param as behavior identifier from this actor.
         * This function will remove ALL behavior instances with the given id.
         *
         * @param id {number} an integer.
         * return this;
         */
        removeBehaviorById : function( id ) {
            for( var n=0; n<this.behaviorList.length; n++ ) {
                if ( this.behaviorList[n].id===id) {
                    this.behaviorList.splice(n,1);
                }
            }

            return this;

        },

        applyBehaviors : function(time) {
//            if (this.behaviorList.length) {
                for( var i=0; i<this.behaviorList.length; i++ )	{
                    this.behaviorList[i].apply(time,this);
                }

                /** calculate behavior affine transform matrix **/
                this.setATMatrix();

                for (i = 0; i < this.numControlPoints(); i++) {
                    this.setPoint(
                        this.matrix.transformCoord(
                            this.pathPoints[i].clone().translate( this.clipOffsetX, this.clipOffsetY )), i);
                }
//            }

            return this;
        },

        setATMatrix : function() {
            this.matrix.identity();

            var m= this.tmpMatrix.identity();
            var mm= this.matrix.matrix;
            var c,s,_m00,_m01,_m10,_m11;
            var mm0, mm1, mm2, mm3, mm4, mm5;

            var bbox= this.bbox;
            var bbw= bbox.width  ;
            var bbh= bbox.height ;
            var bbx= bbox.x;
            var bby= bbox.y

            mm0= 1;
            mm1= 0;
            mm3= 0;
            mm4= 1;

            mm2= this.tb_x - bbx - this.tAnchorX * bbw;
            mm5= this.tb_y - bby - this.tAnchorY * bbh;

            if ( this.rb_angle ) {

                var rbx= (this.rb_rotateAnchorX*bbw + bbx);
                var rby= (this.rb_rotateAnchorY*bbh + bby);

                mm2+= mm0*rbx + mm1*rby;
                mm5+= mm3*rbx + mm4*rby;

                c= Math.cos( this.rb_angle );
                s= Math.sin( this.rb_angle);
                _m00= mm0;
                _m01= mm1;
                _m10= mm3;
                _m11= mm4;
                mm0=  _m00*c + _m01*s;
                mm1= -_m00*s + _m01*c;
                mm3=  _m10*c + _m11*s;
                mm4= -_m10*s + _m11*c;

                mm2+= -mm0*rbx - mm1*rby;
                mm5+= -mm3*rbx - mm4*rby;
            }

            if ( this.sb_scaleX!=1 || this.sb_scaleY!=1 ) {

                var sbx= (this.sb_scaleAnchorX*bbw + bbx);
                var sby= (this.sb_scaleAnchorY*bbh + bby);

                mm2+= mm0*sbx + mm1*sby;
                mm5+= mm3*sbx + mm4*sby;

                mm0= mm0*this.sb_scaleX;
                mm1= mm1*this.sb_scaleY;
                mm3= mm3*this.sb_scaleX;
                mm4= mm4*this.sb_scaleY;

                mm2+= -mm0*sbx - mm1*sby;
                mm5+= -mm3*sbx - mm4*sby;
            }

            mm[0]= mm0;
            mm[1]= mm1;
            mm[2]= mm2;
            mm[3]= mm3;
            mm[4]= mm4;
            mm[5]= mm5;

            return this;

        },

        setRotationAnchored : function( angle, rx, ry ) {
            this.rb_angle=          angle;
            this.rb_rotateAnchorX=  rx;
            this.rb_rotateAnchorY=  ry;
            return this;
        },

        setRotationAnchor : function( ax, ay ) {
            this.rb_rotateAnchorX= ax;
            this.rb_rotateAnchorY= ay;
        },

        setRotation : function( angle ) {
            this.rb_angle= angle;
        },

        setScaleAnchored : function( scaleX, scaleY, sx, sy ) {
            this.sb_scaleX= scaleX;
            this.sb_scaleAnchorX= sx;
            this.sb_scaleY= scaleY;
            this.sb_scaleAnchorY= sy;
            return this;
        },

        setScale : function( sx, sy ) {
            this.sb_scaleX= sx;
            this.sb_scaleY= sy;
            return this;
        },

        setScaleAnchor : function( ax, ay ) {
            this.sb_scaleAnchorX= ax;
            this.sb_scaleAnchorY= ay;
            return this;
        },

        setPositionAnchor : function( ax, ay ) {
            this.tAnchorX= ax;
            this.tAnchorY= ay;
            return this;
        },

        setPositionAnchored : function( x,y,ax,ay ) {
            this.tb_x= x;
            this.tb_y= y;
            this.tAnchorX= ax;
            this.tAnchorY= ay;
            return this;
        },

        setPosition : function( x,y ) {
            this.tb_x= x;
            this.tb_y= y;
            return this;
        },

        setLocation : function( x, y ) {
            this.tb_x= x;
            this.tb_y= y;
            return this;
        },

        flatten : function( npatches, closed ) {
            var point= this.getPositionFromLength(0);
            var path= new CAAT.Path().beginPath( point.x, point.y );
            for( var i=0; i<npatches; i++ ) {
                point= this.getPositionFromLength(i/npatches*this.length);
                path.addLineTo( point.x, point.y  );
            }
            if ( closed) {
                path.closePath();
            } else {
                path.endPath();
            }

            return path;
        }

    };

    extend( CAAT.Path, CAAT.PathSegment, null);
	
})();