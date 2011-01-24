/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * Manages every Actor affine transformations.
 * Take into account that Canvas' renderingContext computes postive rotation clockwise, so hacks
 * to handle it properly are hardcoded.
 *
 * Contained classes are CAAT.Matrix and CAAT.MatrixStack.
 *
 **/

/**
 * This class represents a 2D affine transformation matrix.
 */
(function() {
	CAAT.Matrix = function() {
		this.matrix= [ [1,0,0],
		               [0,1,0],
		               [0,0,1] ];
		return this;
	};
	
	CAAT.Matrix.prototype= {
		matrix:	null,
		type : false,
		
		TYPE_ROTATE:	0,
		TYPE_SCALE:		1,
		TYPE_TRANSLATE:	2,
		
		
		transform : function(point) {
			var x= point.x;
			var y= point.y;
			
			if ( this.type==this.TYPE_ROTATE ) {
				point.x= x*this.matrix[0][0] + y*this.matrix[1][0] + this.matrix[0][2];
				point.y= x*this.matrix[0][1] + y*this.matrix[1][1] + this.matrix[1][2];
				
			} else if ( this.type==this.TYPE_SCALE ) {
				point.x*= this.matrix[0][0];
				point.y*= this.matrix[1][1];
			} else if ( this.type==this.TYPE_TRANSLATE ) {
				point.x+= this.matrix[0][2];
				point.y+= this.matrix[1][2];				
			}
			else {
				point.x= x*this.matrix[0][0] + y*this.matrix[0][1] + this.matrix[0][2];
				point.y= x*this.matrix[1][0] + y*this.matrix[1][1] + this.matrix[1][2];
			}
			return point;
		},
		rotate : function(angle) {
			var m= new CAAT.Matrix();
			
			m.matrix[0][0]= Math.cos(angle);
			m.matrix[1][0]= -Math.sin(angle);
			
			m.matrix[0][1]= Math.sin(angle);
			m.matrix[1][1]= Math.cos(angle);
			
			m.type= this.TYPE_ROTATE;
			
			return m;
		},
		_rotateAnchor : function(angle, tx, ty) {
			var m= new CAAT.Matrix();
			
			m.matrix[0][0]= Math.cos(angle);
			m.matrix[1][0]= -Math.sin(angle);
			
			m.matrix[0][1]= Math.sin(angle);
			m.matrix[1][1]= Math.cos(angle);
			
			m.matrix[0][2]= tx;
			m.matrix[1][2]= ty;
			
			m.type= this.TYPE_ROTATE;
			
			return m;
		},
		scale : function(scalex, scaley) {
			var m= new CAAT.Matrix();
			
			m.matrix[0][0]= scalex;
			m.matrix[1][1]= scaley;
			
			m.type= this.TYPE_SCALE;
			
			return m;
		},
		translate : function( x, y ) {
			var m= new CAAT.Matrix();
			
			m.matrix[0][2]= x;
			m.matrix[1][2]= y;
			
			m.type= this.TYPE_TRANSLATE;
			
			return m;
		},
		copy : function( matrix ) {
			this.matrix[0][0]= matrix[0][0];
			this.matrix[0][1]= matrix[0][1];
			this.matrix[0][2]= matrix[0][2];
			this.matrix[1][0]= matrix[1][0];
			this.matrix[1][1]= matrix[1][1];
			this.matrix[1][2]= matrix[1][2];
			this.matrix[2][0]= matrix[2][0];
			this.matrix[2][1]= matrix[2][1];
			this.matrix[2][2]= matrix[2][2];
		},
		identity : function() {
			this.matrix[0][0]= 1;
			this.matrix[0][1]= 0;
			this.matrix[0][2]= 0;
			
			this.matrix[1][0]= 0;
			this.matrix[1][1]= 1;
			this.matrix[1][2]= 0;
			
			this.matrix[2][0]= 0;
			this.matrix[2][1]= 0;
			this.matrix[2][2]= 1;
		},
		multiply : function( m ) {
			var m00= this.matrix[0][0]*m.matrix[0][0] + this.matrix[0][1]*m.matrix[1][0] + this.matrix[0][2]*m.matrix[2][0];
			var m01= this.matrix[0][0]*m.matrix[0][1] + this.matrix[0][1]*m.matrix[1][1] + this.matrix[0][2]*m.matrix[2][1];
			var m02= this.matrix[0][0]*m.matrix[0][2] + this.matrix[0][1]*m.matrix[1][2] + this.matrix[0][2]*m.matrix[2][2];

			var m10= this.matrix[1][0]*m.matrix[0][0] + this.matrix[1][1]*m.matrix[1][0] + this.matrix[1][2]*m.matrix[2][0];
			var m11= this.matrix[1][0]*m.matrix[0][1] + this.matrix[1][1]*m.matrix[1][1] + this.matrix[1][2]*m.matrix[2][1];
			var m12= this.matrix[1][0]*m.matrix[0][2] + this.matrix[1][1]*m.matrix[1][2] + this.matrix[1][2]*m.matrix[2][2];
			
			var m20= this.matrix[2][0]*m.matrix[0][0] + this.matrix[2][1]*m.matrix[1][0] + this.matrix[2][2]*m.matrix[2][0];
			var m21= this.matrix[2][0]*m.matrix[0][1] + this.matrix[2][1]*m.matrix[1][1] + this.matrix[2][2]*m.matrix[2][1];
			var m22= this.matrix[2][0]*m.matrix[0][2] + this.matrix[2][1]*m.matrix[1][2] + this.matrix[2][2]*m.matrix[2][2];

			this.matrix[0][0]= m00;
			this.matrix[0][1]= m01;
			this.matrix[0][2]= m02;

			this.matrix[1][0]= m10;
			this.matrix[1][1]= m11;
			this.matrix[1][2]= m12;

			this.matrix[2][0]= m20;
			this.matrix[2][1]= m21;
			this.matrix[2][2]= m22;
		},
		premultiply : function(m) {
			var m00= m.matrix[0][0]*this.matrix[0][0] + m.matrix[0][1]*this.matrix[1][0] + m.matrix[0][2]*this.matrix[2][0];
			var m01= m.matrix[0][0]*this.matrix[0][1] + m.matrix[0][1]*this.matrix[1][1] + m.matrix[0][2]*this.matrix[2][1];
			var m02= m.matrix[0][0]*this.matrix[0][2] + m.matrix[0][1]*this.matrix[1][2] + m.matrix[0][2]*this.matrix[2][2];

			var m10= m.matrix[1][0]*this.matrix[0][0] + m.matrix[1][1]*this.matrix[1][0] + m.matrix[1][2]*this.matrix[2][0];
			var m11= m.matrix[1][0]*this.matrix[0][1] + m.matrix[1][1]*this.matrix[1][1] + m.matrix[1][2]*this.matrix[2][1];
			var m12= m.matrix[1][0]*this.matrix[0][2] + m.matrix[1][1]*this.matrix[1][2] + m.matrix[1][2]*this.matrix[2][2];
			
			var m20= m.matrix[2][0]*this.matrix[0][0] + m.matrix[2][1]*this.matrix[1][0] + m.matrix[2][2]*this.matrix[2][0];
			var m21= m.matrix[2][0]*this.matrix[0][1] + m.matrix[2][1]*this.matrix[1][1] + m.matrix[2][2]*this.matrix[2][1];
			var m22= m.matrix[2][0]*this.matrix[0][2] + m.matrix[2][1]*this.matrix[1][2] + m.matrix[2][2]*this.matrix[2][2];

			this.matrix[0][0]= m00;
			this.matrix[0][1]= m01;
			this.matrix[0][2]= m02;

			this.matrix[1][0]= m10;
			this.matrix[1][1]= m11;
			this.matrix[1][2]= m12;

			this.matrix[2][0]= m20;
			this.matrix[2][1]= m21;
			this.matrix[2][2]= m22;
		},
	    getInverse : function() {
			
			var tx=  this.matrix[0][2];
			var ty=  this.matrix[1][2];
			
			var m00= this.matrix[0][0];
			var m01= this.matrix[0][1];
			var m10= this.matrix[1][0];
			var m11= this.matrix[1][1];

			var newMatrix= new CAAT.Matrix();
			if ( this.type==this.TYPE_ROTATE ) {
				newMatrix.matrix[0][0]= m00;
				newMatrix.matrix[0][1]= m10;
				newMatrix.matrix[1][0]= m01;
				newMatrix.matrix[1][1]= m11;
			} else if ( this.type==this.TYPE_SCALE ) {
				newMatrix.matrix[0][0]= 1/m00;
				newMatrix.matrix[1][1]= 1/m11;
			} else if ( this.type==this.TYPE_TRANSLATE ) {
				newMatrix.matrix[0][2]= -tx; //tx*newMatrix.matrix[0][0] + ty*newMatrix.matrix[0][1];
				newMatrix.matrix[1][2]= -ty; //tx*newMatrix.matrix[1][0] + ty*newMatrix.matrix[1][1];
			}
			
			newMatrix.type= this.type;

			return newMatrix;
	    }
	};
})();

(function() {
	CAAT.MatrixStack= function() {
		this.matrix= new CAAT.Matrix();
		this.stack= [];
		this.saved= [];
		return this;
	};
	
	CAAT.MatrixStack.prototype= {
		matrix:	null,
		stack: null,
		saved: null,
		
		pushMatrix : function(matrix) {
			this.stack.push(matrix);
		},
		popMatrix : function()	{
			return this.stack.pop();
		},
		save : function() {
			this.saved.push(this.stack.length);
		},
		restore : function() {
			var pos= this.saved.pop();
			while( this.stack.length!=pos ) {
				this.popMatrix();
			}
		},
		transform : function(ctx) {

			for( var i=0; i<this.stack.length; i++ ) {
				var m= this.stack[i].matrix;
				ctx.transform( m[0][0], m[0][1], m[1][0], m[1][1], m[0][2], m[1][2] );
			}
		},
		transformInverse : function(ctx) {
			
			for( var i=this.stack.length-1; i>=0; i-- ) {
				var im= this.stack[i].getInverse();
				ctx.transform( 	 
						im.matrix[0][0], im.matrix[0][1], 
						im.matrix[1][0], im.matrix[1][1],
						im.matrix[0][2], im.matrix[1][2] );
			}
		},		
		prepareGraphics : function(canvas, actor) {

            this.stack= [];

            if ( actor.dirty ) {
                this.pushMatrix( CAAT.Matrix.prototype.translate( actor.x, actor.y) );

                if ( actor.rotationAngle!=0 ) {
                    this.pushMatrix( CAAT.Matrix.prototype.translate( actor.rotationX, actor.rotationY) );
                    this.pushMatrix( CAAT.Matrix.prototype.rotate( actor.rotationAngle ) );
                    this.pushMatrix( CAAT.Matrix.prototype.translate( -actor.rotationX, -actor.rotationY) );
                }

                if ( actor.scaleX!=1 || actor.scaleY!=1 ) {
                    if ( actor.scaleX!=0 && actor.scaleY!=0 ) {
                        this.pushMatrix( CAAT.Matrix.prototype.translate( actor.scaleTX-actor.width , actor.scaleTY-actor.height ) );
                        this.pushMatrix( CAAT.Matrix.prototype.scale( actor.scaleX, actor.scaleY ) );
                        this.pushMatrix( CAAT.Matrix.prototype.translate(
                                -(actor.scaleTX - actor.width / actor.scaleX),
                                -(actor.scaleTY - actor.height / actor.scaleY) ) ) ;
                    } else {
                        this.pushMatrix( CAAT.Matrix.prototype.scale( 0.01,0.01 ) );
                    }
                }
            }

            if ( this.oldX!=actor.x || this.oldY!=actor.y ) {
                this.stack[0].matrix[0][2]= actor.x;
                this.stack[0].matrix[1][2]= actor.y;
            }

            this.oldX= actor.x;
            this.oldY= actor.y;

			this.transform(canvas);
		},
		transformCoord : function(point) {

			//for( var i=0; i<this.stack.length; i++ ) {
			for( var i=this.stack.length-1; i>=0; i-- ) {
				var matrix= this.stack[i];
				matrix.transform(point);
			}
			
			return point;
		},
		transformCoordNoTranslate : function(point) {

			//for( var i=0; i<this.stack.length; i++ ) {
			for( var i=this.stack.length-1; i>=1; i-- ) {
				var matrix= this.stack[i];
				matrix.transform(point);
			}

			return point;
		},
        inverseTransformCoord : function(point) {

			for( var i=0; i<this.stack.length; i++ ) {
				var matrix= this.stack[i].getInverse();
				matrix.transform(point);
			}
			
			return point;
		},
        getMatrix : function() {
            var matrix= new CAAT.Matrix();

			for( var i=0; i<this.stack.length; i++ ) {
				var matrixStack= this.stack[i];
                matrix.multiply( matrixStack );
            }

            return matrix;
        }
	};
})();