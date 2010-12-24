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
         * Gets the path bounding box (or the rectangle that containes the whole path).
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
        getContour : function(iSize) {}
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
		paint : function(director) {
			
			var canvas= director.crc;
			
			canvas.beginPath();
			canvas.moveTo( this.initialPosition.x, this.initialPosition.y );
			canvas.lineTo( this.finalPosition.x, this.finalPosition.y );
			canvas.stroke();
			
			canvas.fillStyle='black';
			canvas.fillRect( this.initialPosition.x-3, this.initialPosition.y-3, 6, 6 );
			canvas.fillRect( this.finalPosition.x-3, this.finalPosition.y-3, 6, 6 );
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
		paint : function( director ) {
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
		this.pathListener= [];
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
		addQuadricTo : function( px1,py1, px2,py2 ) {
			var bezier= new CAAT.Bezier();
			bezier.setQuadric(this.trackPathX,this.trackPathY, px1,py1, px2,py2);
			this.trackPathX= px2;
			this.trackPathY= py2;
			
			var segment= new CAAT.CurvePath();
			segment.curve= bezier;

			this.pathSegments.push(segment);

            return this;
		},
		addCubicTo : function( px1,py1, px2,py2, px3,py3 ) {
			var bezier= new CAAT.Bezier();
			bezier.setCubic(this.trackPathX,this.trackPathY, px1,py1, px2,py2, px3,py3);
			this.trackPathX= px3;
			this.trackPathY= py3;
			
			var segment= new CAAT.CurvePath();
			segment.curve= bezier;

			this.pathSegments.push(segment);
            return this;
		},
		addCatmullTo : function( px1,py1, px2,py2, px3,py3 ) {
			var curve= new CAAT.CatmullRom();
			curve.setCurve(this.trackPathX,this.trackPathY, px1,py1, px2,py2, px3,py3);
			this.trackPathX= px3;
			this.trackPathY= py3;
			
			var segment= new CAAT.CurvePath();
			segment.curve= curve;

			this.pathSegments.push(segment);
            return this;
		},		
		addLineTo : function( px1, py1 ) {
			var segment= new CAAT.LinearPath();
			segment.setInitialPosition(this.trackPathX, this.trackPathY);
			segment.setFinalPosition(px1, py1);

			this.trackPathX= px1;
			this.trackPathY= py1;
			
			this.pathSegments.push(segment);
            return this;
		},
		beginPath : function( px0, py0 ) {
			this.trackPathX= px0;
			this.trackPathY= py0;
			this.beginPathX= px0;
			this.beginPathY= py0;
            return this;
		},
		closePath : function()	{
			this.addLineTo( this.beginPathX, this.beginPathY );
			this.trackPathX= this.beginPathX;
			this.trackPathY= this.beginPathY;
			
			this.endPath();
            return this;
		},
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
	    getLength : function() {
	    	return this.pathLength;
	    },
        /**
         * time 0..1
         * @param time
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
		paint : function( director ) {
			for( var i=0; i<this.pathSegments.length; i++ ) {
				this.pathSegments[i].paint(director);
			}
		},
		addPathListener : function( callback )	{
			this.pathListener.push(callback);
            return this;
		},
		firePathFinishedEvent : function(time)	{
			for( var i=0; i<this.pathListener.length; i++ )	{
				this.pathListener[i](this, time);
			}
		},
		getBoundingBox : function(rectangle) {
			if ( null==rectangle ) {
				rectangle=new CAAT.Rectangle();
			}
			
			for( var i=0; i<this.pathSegments.length; i++ ) {
				this.pathSegments[i].getBoundingBox(rectangle);
			}
			
			return rectangle;
		},
		release : function() {
			this.ax= -1;
			this.ay= -1;
		},
        getNumSegments : function() {
            return this.pathSegments.length;
        },
		getSegment : function(index) {
			return this.pathSegments[index];
		},
		updatePath : function() {
			for( var i=0; i<this.pathSegments.length; i++ ) {
				this.pathSegments[i].updatePath();
			}
			this.endPath();
		},
		press: function(x,y) {
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
		drag : function(x,y) {
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
        getContour : function(iSize) {
            var contour=[];
            for( var i=0; i<=iSize; i++ ) {
                contour.push( {x: i/iSize, y: this.getPosition(i/iSize).y} );
            }

            return contour;
        }
    });
	
})();