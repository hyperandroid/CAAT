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

/**
 * This is the abstract class that every path segment must conform to.
 * A CAAT.Path is a set of connected CAAT.PathSegments and conforms as well to this interface, so when talking about
 * a Path, we'll be referring either to a PathSegmen, LinearPath, CurvePath or Path indistinctly.
 */
(function() {
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
         */
		endCurvePosition : function() { },

        /**
         * Get path's starting coordinate.
         */
		startCurvePosition : function() { },

        /**
         * Get a coordinate on path.
         * The parameter time is normalized, that is, its values range from zero to one.
         * zero will mean <code>startCurvePosition</code> and one will be <code>endCurvePosition</code>. Other values
         * will be a position on the path relative to the path length. if the value is greater that 1, if will be set
         * to modulus 1.
         * @param time a float with a value between zero and 1 inclusive both.
         */
        getPosition : function(time) { },

        /**
         * Gets Path length.
         */
        getLength : function() { },

        /**
         * Gets the path bounding box (or the rectangle that contains the whole path).
         * @param rectangle a CAAT.Rectangle instance with the bounding box.
         */
		getBoundingBox : function(rectangle) { },

        /**
         * Gets the number of control points needed to create the path.
         * Each PathSegment type can have different control points.
         * @return an integer with the number of control points.
         */
		numControlPoints : function() { },

        /**
         * Gets CAAT.Point instance with the 2d position of a control point.
         * @param index an integer indicating the desired control point coordinate.
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
         */
        getContour : function(iSize) {},

        /**
         * 
         */
        updatePath : function() {}

    }

})();

/**
 * This class defines a two poing path.
 */
(function() {
	
	CAAT.LinearPath = function() {
		this.initialPosition= 	new CAAT.Point();
		this.finalPosition=   	new CAAT.Point();
		this.newPosition=   	new CAAT.Point();
		return this;
	};
	
	extend( CAAT.LinearPath, CAAT.PathSegment, {
		initialPosition:	null,
		finalPosition:		null,
		newPosition:		null,   // spare holder for getPosition coordinate return.

		setInitialPosition : function( x, y )	{
			this.initialPosition.x= 	x;
			this.initialPosition.y= 	y;
			this.newPosition.set(x,y);
            return this;
		},
		setFinalPosition : function( finalX, finalY )	{
			this.finalPosition.x= 	finalX;
			this.finalPosition.y=	finalY;
            return this;
		},
        endCurvePosition : function() {
			return this.finalPosition;
		},
		startCurvePosition : function() {
			return this.initialPosition;
		},
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
		getLength : function() {
			var x= this.finalPosition.x - this.initialPosition.x;
			var y= this.finalPosition.y - this.initialPosition.y;
			return Math.sqrt( x*x+y*y );
		},
		initialPositionX : function() {
			return this.initialPosition.x;
		},
		finalPositionX : function() {
			return this.finalPosition.x;
		},
		paint : function(director, bDrawHandles) {
			
			var canvas= director.crc;

            canvas.save();

            canvas.strokeStyle= this.color;
			canvas.beginPath();
			canvas.moveTo( this.initialPosition.x, this.initialPosition.y );
			canvas.lineTo( this.finalPosition.x, this.finalPosition.y );
			canvas.stroke();

            if ( bDrawHandles ) {
                canvas.globalAlpha=.5;
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
		getBoundingBox : function(rectangle) {
			rectangle.union( this.initialPosition.x, this.initialPosition.y );
			rectangle.union( this.finalPosition.x, this.finalPosition.y );
			
			return rectangle;
		},
		numControlPoints : function() {
			return 2;
		},
		getControlPoint: function(index) {
			if ( 0==index ) {
				return this.initialPosition;
			} else if (1==index) {
				return this.finalPosition;
			}
		},
        /**
         * The contour is restricted to only two points.
         * @param iSize this parameter is useless.
         */
        getContour : function(iSize) {
            var contour= [];

            contour.push( this.getPosition(0).clone() );
            contour.push( this.getPosition(1).clone() );

            return contour;
        }
	});
})();

/**
 * This class defines a Bezier cubic or quadric segment.
 * PENDING; add catmull-rom support.
 */
(function() {
	
	CAAT.CurvePath = function() {
		this.newPosition= new CAAT.Point();
		return this;
	};
	
	extend( CAAT.CurvePath, CAAT.PathSegment, {
		curve:	            null,   // a CAAT.Bezier instance.
		newPosition:		null,   // spare holder for getPosition coordinate return.

        /**
         * Set the pathSegment as a CAAT.Bezier quadric instance.
         * Parameters are quadric coordinates control points.
         * @param p0x
         * @param p0y
         * @param p1x
         * @param p1y
         * @param p2x
         * @param p2y
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
         * @param p0x
         * @param p0y
         * @param p1x
         * @param p1y
         * @param p2x
         * @param p2y
         * @param p3x
         * @param p3y
         */
        setCubic : function(p0x,p0y, p1x,p1y, p2x,p2y, p3x,p3y) {
	        var curve = new CAAT.Bezier();
	        curve.setCubic(p0x,p0y, p1x,p1y, p2x,p2y, p3x,p3y);
	        this.curve = curve;

            return this;
        },
        /**
         * Instruments the CAAT.Bezier instance about changes in control points.
         */
		updatePath : function() {
			this.curve.update();
            return this;
		},
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
         * @param iLength the length at which the coordinate will be taken from.
         * @return a CAAT.Point instance with the coordinate of the path.
         */
		getPositionFromLength : function(iLength) {
			this.curve.solve( this.newPosition, iLength/this.getLength() );
			return this.newPosition;
		},
		initialPositionX : function() {
			return this.curve.coordlist[0].x;
		},
		finalPositionX : function() {
			return this.curve.coordlist[this.curve.coordlist.length-1].x;
		},
		getLength : function() {
			return this.curve.getLength();
		},
		paint : function( director,bDrawHandles ) {
            this.curve.drawHandles= bDrawHandles;
            director.ctx.strokeStyle= this.color;
			this.curve.paint(director);
		},
		getBoundingBox : function(rectangle) {
			this.curve.getBoundingBox(rectangle);
			
			return rectangle;
		},
		numControlPoints : function() {
			return this.curve.coordlist.length;
		},
		getControlPoint : function(index) {
			return this.curve.coordlist[index];
		},
		endCurvePosition : function() {
			return this.curve.endCurvePosition();
		},
		startCurvePosition : function() {
			return this.curve.startCurvePosition();
		},
        getContour : function(iSize) {
            var contour=[];
            for( var i=0; i<=iSize; i++ ) {
                contour.push( {x: i/iSize, y: this.getPosition(i/iSize).y} );
            }

            return contour;
        }
	});
	
})();

/**
 * This class a general path.
 * A path will be defined by joining different path segments:
 *
 * <code>
 * path.beginPath(x,y);
 *      path.addLineTo(x1,y1);
 *      path.addLineTo(x2,y2);
 *      path.addQuadricTo(...)
 *      path.addCubicTo(...)
 * path.endPath();
 * </code>
 *
 * so this code creates a path of four chained segments, starting at (x,y) and having each segment starting where the
 * previous one ended.
 *
 */
(function() {
	
	CAAT.Path= function()	{
		this.newPosition= new CAAT.Point();
		this.pathSegments= [];
//		this.pathListener= [];
		return this;
	};
	
	extend( CAAT.Path, CAAT.PathSegment, {
			
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

        setInteractive : function(interactive) {
            this.interactive= interactive;
            return this;
        },
        endCurvePosition : function() {
            return this.pathSegments[ this.pathSegments.length-1 ].endCurvePosition();
        },
        startCurvePosition : function() {
            return this.pathSegments[ 0 ].startCurvePosition();
        },
        /**
         * Sets the path as a line.
         * @param x0
         * @param y0
         * @param x1
         * @param y1
         */
        setLinear : function(x0,y0,x1,y1) {
            this.beginPath(x0,y0);
            this.addLineTo(x1,y1);
            this.endPath();

            return this;
        },
        /**
         * Sets this path as a Quadric Bezier path.
         * @param x0
         * @param y0
         * @param x1
         * @param y1
         * @param x2
         * @param y2
         */
        setQuadric : function(x0,y0,x1,y1,x2,y2) {
            this.beginPath(x0,y0);
            this.addQuadricTo(x1,y1,x2,y2);
            this.endPath();

            return this;
        },
        /**
         * Sets this path as a Cubic Bezier path.
         * @param x0
         * @param y0
         * @param x1
         * @param y1
         * @param x2
         * @param y2
         * @param x3
         * @param y3
         */
        setCubic : function(x0,y0,x1,y1,x2,y2,x3,y3) {
            this.beginPath(x0,y0);
            this.addCubicTo(x1,y1,x2,y2,x3,y3);
            this.endPath();

            return this;
        },
        /**
         * Adds a CAAT.PathSegment instance to this path,
         * @param pathSegment
         */
		addSegment : function(pathSegment) {
			this.pathSegments.push(pathSegment);
            return this;
		},
        /**
         * Adds a Quadric Bezier segment to the path.
         * The segment starts in the current last path coordinate.
         * @param px1
         * @param py1
         * @param px2
         * @param py2
         * @param color. optional parameter. determines the color to draw the segment with (if
         *         being drawn by a CAAT.PathActor).
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
         * Adds a Cubic Bezier segment to the path.
         * The segment starts in the current last path coordinate.
         * @param px1
         * @param py1
         * @param px2
         * @param py2
         * @param px3
         * @param py3
         * @param color. optional parameter. determines the color to draw the segment with (if
         *         being drawn by a CAAT.PathActor).
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
         * Adds a Catmull-Rom segment to the path.
         * The segment starts in the current last path coordinate.
         * @param px1
         * @param py1
         * @param px2
         * @param py2
         * @param px3
         * @param py3
         * @param color. optional parameter. determines the color to draw the segment with (if
         *         being drawn by a CAAT.PathActor).
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
         * Adds a line segment to the path.
         * The segment starts in the current last path coordinate.
         * @param px1
         * @param py1
         * @param color. optional parameter. determines the color to draw the segment with (if
         *         being drawn by a CAAT.PathActor).
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
         * Sets the path's starting point.
         * The method startCurvePosition will return this coordinate.
         * @param px0
         * @param py0
         */
		beginPath : function( px0, py0 ) {
			this.trackPathX= px0;
			this.trackPathY= py0;
			this.beginPathX= px0;
			this.beginPathY= py0;
            return this;
		},
        /**
         * Closes the path by adding a line path segment to the path from the current last path
         * coordinate to startCurvePosition coordinate.
         */
		closePath : function()	{
			this.addLineTo( this.beginPathX, this.beginPathY );
			this.trackPathX= this.beginPathX;
			this.trackPathY= this.beginPathY;
			
			this.endPath();
            return this;
		},
        /**
         * Finishes the process of building the path.
         * This process involves calculating each path segments length and proportional duration
         * related to a normalized path length of 1.
         * It also sets current paths length.
         * These calculi are needed to traverse the path appropriately.
         * This method must be called explicitly, except when closing a path (that is, calling the
         * method closePath) which calls this method as well.
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
				this.pathSegmentDurationTime[i]= this.pathSegments[i].getLength()/this.pathLength /* * duration*/;
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
         * Returns a number indicating the path length.
         */
	    getLength : function() {
	    	return this.pathLength;
	    },
        /**
         * The parameter time must be a value ranging 0..1.
         * If not constrained to these values, the parameter will be modulus 1, and then, if less
         * than 0, be normalized to 1+time, so that the value always ranges from 0 to 1.
         *
         * This method, returns a CAAT.Point instance indicating a coordinate in the path.
         * The returned coordinate is the corresponding to normalizing the path's length to 1,
         * and then finding what path segment and what coordinate in that path segment corresponds
         * to the input parameter.
         *
         * This method is needed when traversing the path throughout a CAAT.Interpolator instance.
         * @param time a value between 0 and 1 both inclusive. 0 will return path's starting coordinate.
         * 1 will return path's end coordinate.
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
                    time= (time-this.pathSegmentStartTime[i])/this.pathSegmentDurationTime[i];
                    var pointInPath= this.pathSegments[i].getPosition(time);
                    this.newPosition.x= pointInPath.x;
                    this.newPosition.y= pointInPath.y;
                    break;
                }
            }

			return this.newPosition;
		},
        /**
         * Analogously to the method getPosition, this method return a CAAT.Point instance with
         * the coordinate on the path that corresponds to the given length. The input length is
         * related to path's length.
         *
         * @param iLength a float with the target length.
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
         * @param director a CAAT.Director instance.
         */
		paint : function( director ) {
			for( var i=0; i<this.pathSegments.length; i++ ) {
				this.pathSegments[i].paint(director,this.interactive);
			}
		},
/*
		addPathListener : function( callback )	{
			this.pathListener.push(callback);
            return this;
		},
		firePathFinishedEvent : function(time)	{
			for( var i=0; i<this.pathListener.length; i++ )	{
				this.pathListener[i](this, time);
			}
		},
*/
        /**
         * Returns a path's calculated bounding box.
         * @param rectangle a CAAT.Rectangle object instance.
         */
		getBoundingBox : function(rectangle) {
			if ( null==rectangle ) {
				rectangle=new CAAT.Rectangle();
			}
			
			for( var i=0; i<this.pathSegments.length; i++ ) {
				this.pathSegments[i].getBoundingBox(rectangle);
			}
			
			return rectangle;
		},
        /**
         * Method invoked when a PathActor stops dragging a control point.
         */
		release : function() {
			this.ax= -1;
			this.ay= -1;
		},
        /**
         * Returns an integer with the number of path segments that conform this path.
         */
        getNumSegments : function() {
            return this.pathSegments.length;
        },
        /**
         * Gets a CAAT.PathSegment instance.
         * @param index the index of the desired CAAT.PathSegment.
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
         * @param x
         * @param y
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
                        if ( j==0 ) {
                            var xx= i-1;
                            if ( xx<0 ) {
                                xx= this.pathSegments.length-1;
                            }
                            this.point.push( this.pathSegments[xx].endCurvePosition() );
                        } else if ( j==this.pathSegments[i].numControlPoints()-1 ) {
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
         * @param x
         * @param y
         */
		drag : function(x,y) {
            if (!this.interactive) {
                return;
            }

			if ( null==this.point ) {
				return;
			}
			
			if ( -1==this.ax || -1==this.ay ) {
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
         * @param iSize
         */
        getContour : function(iSize) {
            var contour=[];
            for( var i=0; i<=iSize; i++ ) {
                contour.push( new CAAT.Point().set( i/iSize, this.getPosition(i/iSize).y ) );
            }

            return contour;
        }
    });
	
})();