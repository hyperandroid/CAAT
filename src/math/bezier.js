/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * Classes to solve and draw curves.
 * Curve is the superclass of
 *  + Bezier (quadric and cubic)
 *  + TODO: Catmull Rom
 *
 *
 **/

(function() {
	CAAT.Curve= function() {
		return this;
	};
	
	CAAT.Curve.prototype= {
		coordlist:		null,
		k:				0.05,
		length:			-1,
		interpolator:	false,
		HANDLE_SIZE:	20,
		drawHandles:	true,

		paint: function(director) {
		
			var canvas= director.crc;
		
			// control points
			canvas.save();
			canvas.beginPath();
			
			canvas.strokeStyle='#a0a0a0';
			canvas.moveTo( this.coordlist[0].x, this.coordlist[0].y );
			canvas.lineTo( this.coordlist[1].x, this.coordlist[1].y );
			canvas.stroke();
			if ( this.cubic ) {
				canvas.moveTo( this.coordlist[2].x, this.coordlist[2].y );
				canvas.lineTo( this.coordlist[3].x, this.coordlist[3].y );
				canvas.stroke();
			} 
			
			if ( this.drawHandles ) {
				canvas.globalAlpha=.5;
				for( var i=0; i<this.coordlist.length; i++ ) {
					canvas.fillStyle='#7f7f00';
					canvas.beginPath();
					canvas.arc( 
							this.coordlist[i].x, 
							this.coordlist[i].y, 
							this.HANDLE_SIZE/2, 
							0,
							2*Math.PI,
							false) ;
					canvas.fill();
				}
			}
	
			canvas.restore();
		},
		update : function() {
			this.calcLength();
		},
		solve: function(point,t) {
		},
		getBoundingBox : function(rectangle) {
			if ( !rectangle ) {
				rectangle= new CAAT.Rectangle();
			}
			
			var pt= new CAAT.Point();
			for(var t=this.k;t<=1+this.k;t+=this.k){
				this.solve(pt);
				rectangle.union( pt.x, pt.y );
			}			
			
			return rectangle;
		},
		calcLength : function() {
			var x1,x2,y1,y2;
			x1 = this.coordlist[0].x;
			y1 = this.coordlist[0].y;
			var llength=0;
			var pt= new CAAT.Point();
			for(var t=this.k;t<=1+this.k;t+=this.k){
				this.solve(pt,t);
				llength+= Math.sqrt( (pt.x-x1)*(pt.x-x1) + (pt.y-y1)*(pt.y-y1) );
				x1=pt.x;
				y1=pt.y;
			}
			
			this.length= llength;
			return llength;
		},
		getLength : function() {
			return this.length;
		},
		endCurvePosition : function(point) {
			return this.coordlist[ this.coordlist.length-1 ];
		},
		startCurvePosition : function(point) {
			return this.coordlist[ 0 ];
		}
	};
})();


(function() {
	
	CAAT.Bezier= function() {
		CAAT.Bezier.superclass.constructor.call(this);
		return this;
	};
	
	extend(CAAT.Bezier, CAAT.Curve, {
		
		cubic:		false,
		
		setCubic : function( cp0x,cp0y, cp1x,cp1y, cp2x,cp2y, cp3x,cp3y ) {
		
			this.coordlist= [];
		
			this.coordlist.push( new CAAT.Point().set(cp0x, cp0y ) );
			this.coordlist.push( new CAAT.Point().set(cp1x, cp1y ) );
			this.coordlist.push( new CAAT.Point().set(cp2x, cp2y ) );
			this.coordlist.push( new CAAT.Point().set(cp3x, cp3y ) );
			
			this.cubic= true;
			this.update();
		},
		setQuadric : function(cp0x,cp0y, cp1x,cp1y, cp2x,cp2y ) {
		
			this.coordlist= [];
		
			this.coordlist.push( new CAAT.Point().set(cp0x, cp0y ) );
			this.coordlist.push( new CAAT.Point().set(cp1x, cp1y ) );
			this.coordlist.push( new CAAT.Point().set(cp2x, cp2y ) );
			
			this.cubic= false;
			this.update();
		},
		paint : function( director ) {
			if ( this.cubic ) {
				this.paintCubic(director);
			} else {
				this.paintCuadric( director );
			}
			
			CAAT.Bezier.superclass.paint.call(this,director);

		},
		paintCuadric : function( director ) {
			var x1,x2,y1,y2;
			x1 = this.coordlist[0].x;
			y1 = this.coordlist[0].y;
			
			var canvas= director.crc;
			
			canvas.save();
			canvas.beginPath();
			canvas.moveTo(x1,y1);
			
			var point= new CAAT.Point();
			for(var t=this.k;t<=1+this.k;t+=this.k){
				this.solve(point,t);
				canvas.lineTo(point.x, point.y );
			}
			
			canvas.stroke();
			canvas.restore();
		
		},
		paintCubic : function( director ) {

			var x1,x2,y1,y2;
			x1 = this.coordlist[0].x;
			y1 = this.coordlist[0].y;
			
			var canvas= director.crc;
			
			canvas.save();
			canvas.beginPath();
			canvas.moveTo(x1,y1);
			
			var point= new CAAT.Point();
			for(var t=this.k;t<=1+this.k;t+=this.k){
				this.solve(point,t);
				canvas.lineTo(point.x, point.y );
			}
			
			canvas.stroke();
			canvas.restore();
		},
		solve : function(point,t) {
			if ( this.cubic ) {
				return this.solveCubic(point,t);
			} else {
				return this.solveQuadric(point,t);
			}
		},
		solveCubic : function(point,t) {
			
			var t2= t*t;
			var t3= t*t2;
			
			point.x=(this.coordlist[0].x + t * (-this.coordlist[0].x * 3 + t * (3 * this.coordlist[0].x-
					this.coordlist[0].x*t)))+t*(3*this.coordlist[1].x+t*(-6*this.coordlist[1].x+
					this.coordlist[1].x*3*t))+t2*(this.coordlist[2].x*3-this.coordlist[2].x*3*t)+
					this.coordlist[3].x * t3;
				
			point.y=(this.coordlist[0].y+t*(-this.coordlist[0].y*3+t*(3*this.coordlist[0].y-
					this.coordlist[0].y*t)))+t*(3*this.coordlist[1].y+t*(-6*this.coordlist[1].y+
					this.coordlist[1].y*3*t))+t2*(this.coordlist[2].y*3-this.coordlist[2].y*3*t)+
					this.coordlist[3].y * t3;
			
			return point;
		},
		solveQuadric : function(point,t) {
			point.x= (1-t)*(1-t)*this.coordlist[0].x + 2*(1-t)*t*this.coordlist[1].x + t*t*this.coordlist[2].x;
			point.y= (1-t)*(1-t)*this.coordlist[0].y + 2*(1-t)*t*this.coordlist[1].y + t*t*this.coordlist[2].y;
			
			return point;
		}
	});
	
})();

(function() {
	CAAT.CatmullRom = function() {
		CAAT.CatmullRom.superclass.constructor.call(this);
		return this;
	};
	
	extend(CAAT.CatmullRom, CAAT.Curve, {
	
		setCurve : function( cp0x,cp0y, cp1x,cp1y, cp2x,cp2y, cp3x,cp3y ) {
		
			this.coordlist= [];
		
			this.coordlist.push( new CAAT.Point().set(cp0x, cp0y ) );
			this.coordlist.push( new CAAT.Point().set(cp1x, cp1y ) );
			this.coordlist.push( new CAAT.Point().set(cp2x, cp2y ) );
			this.coordlist.push( new CAAT.Point().set(cp3x, cp3y ) );
			
			this.cubic= true;
			this.update();
		},		
		paint: function(director) {
			
			var x1,x2,y1,y2;
			x1 = this.coordlist[0].x;
			y1 = this.coordlist[0].y;
			
			var canvas= director.crc;
			
			canvas.save();
			canvas.beginPath();
			canvas.moveTo(x1,y1);
			
			var point= new CAAT.Point();
			
			for(var t=this.k;t<=1+this.k;t+=this.k){
				this.solve(point,t);
				canvas.lineTo(point.x,point.y);
			}
			
			canvas.stroke();
			canvas.restore();	
			
			CatmullRom.superclass.paint.call(this,director);
		},
		solve: function(point,t) {
			var t2= t*t;
			var t3= t*t2;
		
			var c= this.coordlist;

//			q(t) = 0.5 *(  	(2 * P1) +
//				 	(-P0 + P2) * t +
//				(2*P0 - 5*P1 + 4*P2 - P3) * t2 +
//				(-P0 + 3*P1- 3*P2 + P3) * t3)

			point.x= .5*( (2*c[1].x) + (-c[0].x+c[2].x)*t + (2*c[0].x - 5*c[1].x + 4*c[2].x - c[3].x)*t2 + (-c[0].x + 3*c[1].x - 3*c[2].x + c[3].x)*t3 );
			point.y= .5*( (2*c[1].y) + (-c[0].y+c[2].y)*t + (2*c[0].y - 5*c[1].y + 4*c[2].y - c[3].y)*t2 + (-c[0].y + 3*c[1].y - 3*c[2].y + c[3].y)*t3 );
			
			return point;

		}
	});
})();