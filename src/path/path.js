/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
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
        return this;
    };

    CAAT.PathSegment.prototype =  {
        color:  'black',

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
        getLength : function() { },

        /**
         * Gets the path bounding box (or the rectangle that contains the whole path).
         * @param rectangle a CAAT.Rectangle instance with the bounding box.
         * @return {CAAT.Rectangle}
         */
		getBoundingBox : function(rectangle) { },

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
        updatePath : function() {}

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
		this.initialPosition=   new CAAT.Point(0,0,0);
		this.finalPosition=     new CAAT.Point(0,0,0);
		this.newPosition=       new CAAT.Point(0,0,0);
		return this;
	};
	
	CAAT.LinearPath.prototype= {
		initialPosition:	null,
		finalPosition:		null,
		newPosition:		null,   // spare holder for getPosition coordinate return.

        /**
         * Set this path segment's starting position.
         * @param x {number}
         * @param y {number}
         */
		setInitialPosition : function( x, y )	{
			this.initialPosition.x= x;
			this.initialPosition.y= y;
			this.newPosition.set(x,y);
            return this;
		},
        /**
         * Set this path segment's ending position.
         * @param finalX {number}
         * @param finalY {number}
         */
		setFinalPosition : function( finalX, finalY )	{
			this.finalPosition.x= finalX;
			this.finalPosition.y= finalY;
            return this;
		},
        /**
         * @inheritDoc
         */
        endCurvePosition : function() {
			return this.finalPosition;
		},
        /**
         * @inheritsDoc
         */
		startCurvePosition : function() {
			return this.initialPosition;
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
						(this.initialPosition.x+(this.finalPosition.x-this.initialPosition.x)*time),
						(this.initialPosition.y+(this.finalPosition.y-this.initialPosition.y)*time) );

			return this.newPosition;
		},
        /**
         * @inheritsDoc
         */
		getLength : function() {
			var x= this.finalPosition.x - this.initialPosition.x;
			var y= this.finalPosition.y - this.initialPosition.y;
			return Math.sqrt( x*x+y*y );
		},
        /**
         * Returns initial path segment point's x coordinate.
         * @return {number}
         */
		initialPositionX : function() {
			return this.initialPosition.x;
		},
        /**
         * Returns final path segment point's x coordinate.
         * @return {number}
         */
		finalPositionX : function() {
			return this.finalPosition.x;
		},
        /**
         * Draws this path segment on screen. Optionally it can draw handles for every control point, in
         * this case, start and ending path segment points.
         * @param director {CAAT.Director}
         * @param bDrawHandles {boolean}
         */
		paint : function(director, bDrawHandles) {
			
			var canvas= director.crc;

            canvas.save();

            canvas.strokeStyle= this.color;
			canvas.beginPath();
			canvas.moveTo( this.initialPosition.x, this.initialPosition.y );
			canvas.lineTo( this.finalPosition.x, this.finalPosition.y );
			canvas.stroke();

            if ( bDrawHandles ) {
                canvas.globalAlpha=0.5;
                canvas.fillStyle='#7f7f00';
                canvas.beginPath();
                canvas.arc(
                        this.initialPosition.x,
                        this.initialPosition.y,
                        CAAT.Curve.prototype.HANDLE_SIZE/2,
                        0,
                        2*Math.PI,
                        false) ;
                canvas.arc(
                        this.finalPosition.x,
                        this.finalPosition.y,
                        CAAT.Curve.prototype.HANDLE_SIZE/2,
                        0,
                        2*Math.PI,
                        false) ;
                canvas.fill();
            }

            canvas.restore();
		},
        /**
         * Fill this rectangle with the calculated path segment bounding box.
         * @inheritsDoc
         * @param rectangle {CAAT.Rectangle}
         */
		getBoundingBox : function(rectangle) {
			rectangle.union( this.initialPosition.x, this.initialPosition.y );
			rectangle.union( this.finalPosition.x, this.finalPosition.y );
			
			return rectangle;
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
				return this.initialPosition;
			} else if (1===index) {
				return this.finalPosition;
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

    extend( CAAT.LinearPath, CAAT.PathSegment, null);
})();

(function() {
    /**
     * This class defines a Bezier cubic or quadric path segment.
     *
     * @constructor
     * @extends CAAT.PathSegment
     */
	CAAT.CurvePath = function() {
		this.newPosition= new CAAT.Point(0,0,0);
		return this;
	};
	
	CAAT.CurvePath.prototype= {
		curve:	            null,   // a CAAT.Bezier instance.
		newPosition:		null,   // spare holder for getPosition coordinate return.

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

            return this;
        },
        /**
         * @inheritDoc
         */
		updatePath : function() {
			this.curve.update();
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
			this.curve.solve( this.newPosition, iLength/this.getLength() );
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
         */
		getLength : function() {
			return this.curve.getLength();
		},
        /**
         * @inheritDoc
         * @param director {CAAT.Director}
         * @param bDrawHandles {boolean}
         */
		paint : function( director,bDrawHandles ) {
            this.curve.drawHandles= bDrawHandles;
            director.ctx.strokeStyle= this.color;
			this.curve.paint(director);
		},
        /**
         * @inheritDoc
         */
		getBoundingBox : function(rectangle) {
			this.curve.getBoundingBox(rectangle);
			
			return rectangle;
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
		this.newPosition= new CAAT.Point(0,0,0);
		this.pathSegments= [];
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

        /**
         * Set whether this path should paint handles for every control point.
         * @param interactive {boolean}.
         */
        setInteractive : function(interactive) {
            this.interactive= interactive;
            return this;
        },
        /**
         * Return the last point of the last path segment of this compound path.
         * @return {CAAT.Point}
         */
        endCurvePosition : function() {
            return this.pathSegments[ this.pathSegments.length-1 ].endCurvePosition();
        },
        /**
         * Return the first point of the first path segment of this compound path.
         * @return {CAAT.Point}
         */
        startCurvePosition : function() {
            return this.pathSegments[ 0 ].startCurvePosition();
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
        /**
         * Add a CAAT.PathSegment instance to this path.
         * @param pathSegment {CAAT.PathSegment}
         * @return this
         */
		addSegment : function(pathSegment) {
			this.pathSegments.push(pathSegment);
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
			bezier.setQuadric(this.trackPathX,this.trackPathY, px1,py1, px2,py2);
			this.trackPathX= px2;
			this.trackPathY= py2;
			
			var segment= new CAAT.CurvePath().setColor(color);
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
			bezier.setCubic(this.trackPathX,this.trackPathY, px1,py1, px2,py2, px3,py3);
			this.trackPathX= px3;
			this.trackPathY= py3;
			
			var segment= new CAAT.CurvePath().setColor(color);
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
			
			var segment= new CAAT.CurvePath();
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
			segment.setInitialPosition(this.trackPathX, this.trackPathY);
			segment.setFinalPosition(px1, py1);

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
         * Close the path by adding a line path segment from the current last path
         * coordinate to startCurvePosition coordinate.
         * @return this
         */
		closePath : function()	{
			this.addLineTo( this.beginPathX, this.beginPathY );
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

			this.pathLength=0;
            var i;
			for( i=0; i<this.pathSegments.length; i++) {
				this.pathLength+= this.pathSegments[i].getLength();
				this.pathSegmentStartTime.push(0);
				this.pathSegmentDurationTime.push(0);
			}

			for( i=0; i<this.pathSegments.length; i++) {
				this.pathSegmentDurationTime[i]= this.pathLength ? this.pathSegments[i].getLength()/this.pathLength : 0;
				if ( i>0 ) {
					this.pathSegmentStartTime[i]= this.pathSegmentStartTime[i-1]+this.pathSegmentDurationTime[i-1];
				} else {
					this.pathSegmentStartTime[0]= 0;
				}

                this.pathSegments[i].endPath();
			}

            return this;
		},
        /**
         * Returns the path length. This path length will be the sum of all its segment's length.
         * @return {number}
         */
	    getLength : function() {
	        return this.pathLength;
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

            for( var i=0; i<this.pathSegments.length; i++ ) {
                if (this.pathSegmentStartTime[i]<=time && time<=this.pathSegmentStartTime[i]+this.pathSegmentDurationTime[i]) {
                    time= this.pathSegmentDurationTime[i] ?
                            (time-this.pathSegmentStartTime[i])/this.pathSegmentDurationTime[i] :
                            0;
                    var pointInPath= this.pathSegments[i].getPosition(time);
                    this.newPosition.x= pointInPath.x;
                    this.newPosition.y= pointInPath.y;
                    break;
                }
            }

			return this.newPosition;
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
         * Returns a path's calculated bounding box.
         * @param rectangle {CAAT.Rectangle} a CAAT.Rectangle object instance.
         * @return {CAAT.Rectangle}
         */
		getBoundingBox : function(rectangle) {
			if ( !rectangle ) {
				rectangle=new CAAT.Rectangle();
			}
			
			for( var i=0; i<this.pathSegments.length; i++ ) {
				this.pathSegments[i].getBoundingBox(rectangle);
			}
			
			return rectangle;
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
        /**
         * Indicates that some path control point has changed, and that the path must recalculate
         * its internal data.
         */
		updatePath : function() {
			for( var i=0; i<this.pathSegments.length; i++ ) {
				this.pathSegments[i].updatePath();
			}
			this.endPath();
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
						
						this.point= [];
						this.point.push(point);
						// no es punto de control, existe este mismo punto en la curva, o bien siguiente o anterior.
                        if ( j===0 ) {
                            var xx= i-1;
                            if ( xx<0 ) {
                                xx= this.pathSegments.length-1;
                            }
                            this.point.push( this.pathSegments[xx].endCurvePosition() );
                        } else if ( j===this.pathSegments[i].numControlPoints()-1 ) {
                            this.point.push( this.pathSegments[(i+1)%this.pathSegments.length].startCurvePosition() );
                        }

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
		drag : function(x,y) {
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
			
			for( var i=0; i<this.point.length; i++ ) {
				this.point[i].x+= x-this.ax;
				this.point[i].y+= y-this.ay;
			}

			this.ax= x;
			this.ay= y;

			this.updatePath();
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
        }
    };

    extend( CAAT.Path, CAAT.PathSegment, null);
	
})();