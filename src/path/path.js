/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * These classes encapsulate different kinds of paths.
 * LinearPath, defines an straight line path, just 2 points.
 * CurvePath, defines a path based on a Curve. Curves can be bezier quadric/cubic and catmull-rom.
 * Path, is a general purpose class, which composes a path of different path segments (Linear or Curve paths).
 *
 * A path, has an interpolator which stablishes the way the path is traversed (accelerating, by
 * easing functions, etc.). Normally, interpolators will be defined by Interpolator class, but
 * general Paths could be used as well.
 *
 **/

(function() {
    CAAT.PathSegment = function() {
        return this;
    };

    CAAT.PathSegment.prototype =  {
		endCurvePosition : function() { },
		startCurvePosition : function() { },
        getPosition : function(time) { },
        getLength : function() { },
		getBoundingBox : function(rectangle) { },
		numControlPoints : function() { },
		getControlPoint: function(index) { },
        endPath : function() {},
        getContour : function(iSize) {}
    }

})();

(function() {
	
	CAAT.LinearPath = function() {
		this.initialPosition= 	new CAAT.Point();
		this.finalPosition=   	new CAAT.Point();
		this.newPosition=   	new CAAT.Point();
		this.pathListener=		[];
		return this;
	};
	
	extend( CAAT.LinearPath, CAAT.PathSegment, {
		initialPosition:	null,
		finalPosition:		null,
		newPosition:		null,

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
        getContour : function(iSize) {
            var contour= [];

            contour.push( this.getPosition(0).clone() );
            contour.push( this.getPosition(1).clone() );

            return contour;
        }
	});
})();

(function() {
	
	CAAT.CurvePath = function() {
		this.pathListener=		[];
		this.newPosition= new CAAT.Point();
		return this;
	};
	
	extend( CAAT.CurvePath, CAAT.PathSegment, {
		curve:	            null,
		newPosition:		null,
		expired:			false,

        setQuadric : function(p0x,p0y, p1x,p1y, p2x,p2y) {
	        var curve = new CAAT.Bezier();
	        curve.setQuadric(p0x,p0y, p1x,p1y, p2x,p2y);
	        this.curve = curve;

            return this;
        },
        setCubic : function(p0x,p0y, p1x,p1y, p2x,p2y, p3x,p3y) {
	        var curve = new CAAT.Bezier();
	        curve.setCubic(p0x,p0y, p1x,p1y, p2x,p2y, p3x,p3y);
	        this.curve = curve;

            return this;
        },
		updatePath : function() {
			this.curve.update();
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


(function() {
	
	CAAT.Path= function()	{
		this.newPosition= new CAAT.Point();
		this.pathSegments= [];
		this.pathListener= [];
		return this;
	};
	
	extend( CAAT.Path, CAAT.PathSegment, {
			
		pathSegments:	null,
		pathSegmentDurationTime:	null,
		pathSegmentStartTime:		null,

		newPosition:	null,
		
		pathLength:		-1,

		beginPathX:		-1,
		beginPathY:		-1,
		
		// ultima coordenada introducida en el path.
		trackPathX:		-1,
		trackPathY:		-1,

        endCurvePosition : function() {
            return this.pathSegments[ this.pathSegments.length-1 ].endCurvePosition();
        },
        startCurvePosition : function() {
            return this.pathSegments[ 0 ].startCurvePosition();
        },
        setLinear : function(x0,y0,x1,y1) {
            this.beginPath(x0,y0);
            this.addLineTo(x1,y1);
            this.endPath();

            return this;
        },
        setQuadric : function(x0,y0,x1,y1,x2,y2) {
            this.beginPath(x0,y0);
            this.addQuadricTo(x1,y1,x2,y2);
            this.endPath();

            return this;
        },
        setCubic : function(x0,y0,x1,y1,x2,y2,x3,y3) {
            this.beginPath(x0,y0);
            this.addCubicTo(x1,y1,x2,y2,x3,y3);
            this.endPath();

            return this;
        },
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
						// no es punto de control, existe este mismo punto en la curva, o siguiente o anterior.
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
		ax: -1,
		ay: -1,
		point: [],
        getContour : function(iSize) {
            var contour=[];
            for( var i=0; i<=iSize; i++ ) {
                contour.push( {x: i/iSize, y: this.getPosition(i/iSize).y} );
            }

            return contour;
        }
    });
	
})();