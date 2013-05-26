CAAT.Module( {

    /**
     * @name Path
     * @memberOf CAAT.PathUtil
     * @extends CAAT.PathUtil.PathSegment
     * @constructor
     */

    defines : "CAAT.PathUtil.Path",
    aliases : ["CAAT.Path"],
    depends : [
        "CAAT.PathUtil.PathSegment",
        "CAAT.PathUtil.ArcPath",
        "CAAT.PathUtil.CurvePath",
        "CAAT.PathUtil.LinearPath",
        "CAAT.PathUtil.RectPath",
        "CAAT.Math.Bezier",
        "CAAT.Math.CatmullRom",
        "CAAT.Math.Point",
        "CAAT.Math.Matrix"
    ],
    extendsClass : "CAAT.PathUtil.PathSegment",
    extendsWith : {

        /**
         * @lends CAAT.PathUtil.Path.prototype
         */


        __init : function()	{
                this.__super();

                this.newPosition=   new CAAT.Math.Point(0,0,0);
                this.pathSegments=  [];

                this.behaviorList=  [];
                this.matrix=        new CAAT.Math.Matrix();
                this.tmpMatrix=     new CAAT.Math.Matrix();

                return this;
        },

        /**
         * A collection of PathSegments.
         * @type {Array.<CAAT.PathUtil.PathSegment>}
         */
		pathSegments:	            null,   // a collection of CAAT.PathSegment instances.

        /**
         * For each path segment in this path, the normalized calculated duration.
         * precomputed segment duration relative to segment legnth/path length
         */
		pathSegmentDurationTime:	null,

        /**
         * For each path segment in this path, the normalized calculated start time.
         * precomputed segment start time relative to segment legnth/path length and duration.
         */
		pathSegmentStartTime:		null,

        /**
         * spare CAAT.Math.Point to return calculated values in the path.
         */
		newPosition:	            null,

        /**
         * path length (sum of every segment length)
         */
		pathLength:		            -1,

        /**
         * starting path x position
         */
		beginPathX:		            -1,

        /**
         * starting path y position
         */
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

        /**
         * Is this path interactive ?. If so, controls points can be moved with a CAAT.Foundation.UI.PathActor.
         */
        interactive:                true,

        /**
         * A list of behaviors to apply to this path.
         * A path can be affine transformed to create a different path.
         */
        behaviorList:               null,

        /* rotation behavior info **/

        /**
         * Path rotation angle.
         */
        rb_angle:                   0,

        /**
         * Path rotation x anchor.
         */
        rb_rotateAnchorX:           .5,

        /**
         * Path rotation x anchor.
         */
        rb_rotateAnchorY:           .5,

        /* scale behavior info **/

        /**
         * Path X scale.
         */
        sb_scaleX:                  1,

        /**
         * Path Y scale.
         */
        sb_scaleY:                  1,

        /**
         * Path scale X anchor.
         */
        sb_scaleAnchorX:            .5,

        /**
         * Path scale Y anchor.
         */
        sb_scaleAnchorY:            .5,

        /**
         * Path translation anchor X.
         */
        tAnchorX:                   0,

        /**
         * Path translation anchor Y.
         */
        tAnchorY:                   0,

        /* translate behavior info **/

        /**
         * Path translation X.
         */
        tb_x:                       0,

        /**
         * Path translation Y.
         */
        tb_y:                       0,

        /* behavior affine transformation matrix **/

        /**
         * Path behaviors matrix.
         */
        matrix:                     null,

        /**
         * Spare calculation matrix.
         */
        tmpMatrix:                  null,

        /**
         * Original Path´s path segments points.
         */
        pathPoints:                 null,

        /**
         * Path bounding box width.
         */
        width:                      0,

        /**
         * Path bounding box height.
         */
        height:                     0,

        /**
         * Path bounding box X position.
         */
        clipOffsetX             :   0,

        /**
         * Path bounding box Y position.
         */
        clipOffsetY             :   0,

        /**
         * Is this path closed ?
         */
        closed                  :   false,

        /**
         * Apply this path as a Canvas context path.
         * You must explicitly call context.beginPath
         * @param director
         * @return {*}
         */
        applyAsPath : function(director) {
            var ctx= director.ctx;

            director.modelViewMatrix.transformRenderingContext( ctx );
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
                return new CAAT.Math.Point().set( this.beginPathX, this.beginPathY );
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
            this.pathSegments= [];
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
            points = points.slice(0);
            if ( closed ) {
                points.unshift(points[points.length-1]);
                points.push(points[1]);
                points.push(points[2]);
            } else {
                points.unshift(points[0]);
                points.push(points[points.length-1]);
            }

            for( var i=1; i<points.length-2; i++ ) {

                var segment= new CAAT.PathUtil.CurvePath().setColor("#000").setParent(this);
                var cm= new CAAT.Math.CatmullRom().setCurve(
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
         */
		addSegment : function(pathSegment) {
            pathSegment.setParent(this);
			this.pathSegments.push(pathSegment);
            return this;
		},
        addArcTo : function( x1,y1, x2,y2, radius, cw, color ) {
            var r= new CAAT.PathUtil.ArcPath();
            r.setArcTo(true);
            r.setRadius( radius );
            r.setInitialPosition( x1,y1).
                setFinalPosition( x2,y2 );


            r.setParent( this );
            r.setColor( color );

            this.pathSegments.push(r);

            return this;
        },
        addRectangleTo : function( x1,y1, cw, color ) {
            var r= new CAAT.PathUtil.RectPath();
            r.setPoints([
                    this.endCurvePosition(),
                    new CAAT.Math.Point().set(x1,y1)
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
			var bezier= new CAAT.Math.Bezier();

            bezier.setPoints(
                [
                    this.endCurvePosition(),
                    new CAAT.Math.Point().set(px1,py1),
                    new CAAT.Math.Point().set(px2,py2)
                ]);

			this.trackPathX= px2;
			this.trackPathY= py2;
			
			var segment= new CAAT.PathUtil.CurvePath().setColor(color).setParent(this);
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
			var bezier= new CAAT.Math.Bezier();

            bezier.setPoints(
                [
                    this.endCurvePosition(),
                    new CAAT.Math.Point().set(px1,py1),
                    new CAAT.Math.Point().set(px2,py2),
                    new CAAT.Math.Point().set(px3,py3)
                ]);

			this.trackPathX= px3;
			this.trackPathY= py3;
			
			var segment= new CAAT.PathUtil.CurvePath().setColor(color).setParent(this);
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
			var curve= new CAAT.Math.CatmullRom().setColor(color);
			curve.setCurve(this.trackPathX,this.trackPathY, px1,py1, px2,py2, px3,py3);
			this.trackPathX= px3;
			this.trackPathY= py3;
			
			var segment= new CAAT.PathUtil.CurvePath().setParent(this);
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
			var segment= new CAAT.PathUtil.LinearPath().setColor(color);
            segment.setPoints( [
                    this.endCurvePosition(),
                    new CAAT.Math.Point().set(px1,py1)
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

            this.closed= true;

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
         * This method, returns a CAAT.Foundation.Point instance indicating a coordinate in the path.
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
         *
         * @param time {number} a value between 0 and 1 both inclusive. 0 will return path's starting coordinate.
         * 1 will return path's end coordinate.
         * @param open_contour {boolean=} treat this path as an open contour. It is intended for
         * open paths, and interpolators which give values above 1. see tutorial 7.1.
         * @link{../../documentation/tutorials/t7-1.html}
         *
         * @return {CAAT.Foundation.Point}
         */
		getPosition : function(time, open_contour) {

            if (open_contour && (time>=1 || time<=0) ) {

                var p0,p1,ratio, angle;

                if ( time>=1 ) {
                    // these values could be cached.
                    p0= this.__getPositionImpl( .999 );
                    p1= this.endCurvePosition();

                    angle= Math.atan2( p1.y - p0.y, p1.x - p0.x );
                    ratio= time%1;


                } else {
                    // these values could be cached.
                    p0= this.__getPositionImpl( .001 );
                    p1= this.startCurvePosition();

                    angle= Math.atan2( p1.y - p0.y, p1.x - p0.x );
                    ratio= -time;
                }

                var np= this.newPosition;
                var length= this.getLength();

                np.x = p1.x + (ratio * length)*Math.cos(angle);
                np.y = p1.y + (ratio * length)*Math.sin(angle);


                return np;
            }

            return this.__getPositionImpl(time);
        },

        __getPositionImpl : function(time) {

            if ( time>1 || time<0 ) {
                time%=1;
            }
            if ( time<0 ) {
                time= 1+time;
            }

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

                    // Clamp this segment's time to a maximum since it is relative to the path.
                    // thanks https://github.com/donaldducky for spotting.
                    if (time>1) {
                        time=1;
                    } else if (time<0 ) {
                        time= 0;
                    }

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
        isEmpty : function() {
            return !this.pathSegments.length;
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

            var HS= CAAT.Math.Curve.prototype.HANDLE_SIZE/2;
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
                contour.push( new CAAT.Math.Point().set( i/iSize, this.getPosition(i/iSize).y, 0 ) );
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
            var path= new CAAT.PathUtil.Path().beginPath( point.x, point.y );
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

    }
	
});
