/**
 * See LICENSE file.
 *
 * Manages every Actor affine transformations.
 * Take into account that Canvas' renderingContext computes postive rotation clockwise, so hacks
 * to handle it properly are hardcoded.
 *
 * Contained classes are CAAT.Matrix and CAAT.MatrixStack.
 *
 **/

(function() {

    /**
     *
     * Define a matrix to hold three dimensional affine transforms.
     *
     * @constructor
     */
    CAAT.Matrix3= function() {
        this.matrix= [
            [1,0,0,0],
            [0,1,0,0],
            [0,0,1,0],
            [0,0,0,1]
        ];

        this.fmatrix= [1,0,0,0,  0,1,0,0,  0,0,1,0,  0,0,0,1];
        
        return this;
    };

    CAAT.Matrix3.prototype= {
        matrix: null,
        fmatrix:null,

        transformCoord : function(point) {
			var x= point.x;
			var y= point.y;
            var z= point.z;

            point.x= x*this.matrix[0][0] + y*this.matrix[0][1] + z*this.matrix[0][2] + this.matrix[0][3];
            point.y= x*this.matrix[1][0] + y*this.matrix[1][1] + z*this.matrix[1][2] + this.matrix[1][3];
            point.z= x*this.matrix[2][0] + y*this.matrix[2][1] + z*this.matrix[2][2] + this.matrix[2][3];

			return point;
		},
	    initialize : function( x0,y0,z0, x1,y1,z1, x2,y2,z2 ) {
		    this.identity( );
		    this.matrix[0][0]= x0;
            this.matrix[0][1]= y0;
            this.matrix[0][2]= z0;

		    this.matrix[1][0]= x1;
            this.matrix[1][1]= y1;
            this.matrix[1][2]= z1;

            this.matrix[2][0]= x2;
            this.matrix[2][1]= y2;
            this.matrix[2][2]= z2;

            return this;
	    },
        initWithMatrix : function(matrixData) {
            this.matrix= matrixData;
            return this;
        },
        flatten : function() {
            var d= this.fmatrix;
            var s= this.matrix;
            d[ 0]= s[0][0];
            d[ 1]= s[1][0];
            d[ 2]= s[2][0];
            d[ 3]= s[3][0];

            d[ 4]= s[0][1];
            d[ 5]= s[1][1];
            d[ 6]= s[2][1];
            d[ 7]= s[2][1];

            d[ 8]= s[0][2];
            d[ 9]= s[1][2];
            d[10]= s[2][2];
            d[11]= s[3][2];

            d[12]= s[0][3];
            d[13]= s[1][3];
            d[14]= s[2][3];
            d[15]= s[3][3];
            
            return this.fmatrix;
        },

        /**
         * Set this matrix to identity matrix.
         * @return this
         */
	    identity : function() {
		    for( var i=0; i<4; i++ ) {
			    for( var j=0; j<4; j++ ) {
				    this.matrix[i][j]= (i===j) ? 1.0 : 0.0;
                }
            }

            return this;
	    },
        /**
         * Get this matri'x internal representation data. The bakced structure is a 4x4 array of number.
         */
        getMatrix : function() {
            return this.matrix;
        },
        /**
         * Multiply this matrix by a created rotation matrix. The rotation matrix is set up to rotate around
         * xy axis.
         *
         * @param xy {Number} radians to rotate.
         *
         * @return this
         */
	    rotateXY : function( xy ) {
		    return this.rotate( xy, 0, 0 );
	    },
        /**
         * Multiply this matrix by a created rotation matrix. The rotation matrix is set up to rotate around
         * xz axis.
         *
         * @param xz {Number} radians to rotate.
         *
         * @return this
         */
	    rotateXZ : function( xz ) {
		    return this.rotate( 0, xz, 0 );
	    },
        /**
         * Multiply this matrix by a created rotation matrix. The rotation matrix is set up to rotate aroind
         * yz axis.
         *
         * @param yz {Number} radians to rotate.
         *
         * @return this
         */
	    rotateYZ : function( yz ) {
		    return this.rotate( 0, 0, yz );
	    },
        /**
         * 
         * @param xy
         * @param xz
         * @param yz
         */
        setRotate : function( xy, xz, yz ) {
            var m= this.rotate(xy,xz,yz);
            this.copy(m);
            return this;
        },
        /**
         * Creates a matrix to represent arbitrary rotations around the given planes.
         * @param xy {number} radians to rotate around xy plane.
         * @param xz {number} radians to rotate around xz plane.
         * @param yz {number} radians to rotate around yz plane.
         *
         * @return {CAAT.Matrix3} a newly allocated matrix.
         * @static
         */
	    rotate : function( xy, xz, yz ) {
		    var res=new CAAT.Matrix3();
		    var s,c,m;

		    if (xy!==0) {
			    m =new CAAT.Matrix3( );
			    s=Math.sin(xy);
			    c=Math.cos(xy);
			    m.matrix[1][1]=c;
			    m.matrix[1][2]=-s;
			    m.matrix[2][1]=s;
			    m.matrix[2][2]=c;
			    res.multiply(m);
		    }

		    if (xz!==0) {
			    m =new CAAT.Matrix3( );
			    s=Math.sin(xz);
			    c=Math.cos(xz);
			    m.matrix[0][0]=c;
			    m.matrix[0][2]=-s;
			    m.matrix[2][0]=s;
			    m.matrix[2][2]=c;
			    res.multiply(m);
		    }

		    if (yz!==0) {
			    m =new CAAT.Matrix3( );
			    s=Math.sin(yz);
			    c=Math.cos(yz);
			    m.matrix[0][0]=c;
			    m.matrix[0][1]=-s;
			    m.matrix[1][0]=s;
			    m.matrix[1][1]=c;
			    res.multiply(m);
		    }

		    return res;
	    },
        /**
         * Creates a new matrix being a copy of this matrix.
         * @return {CAAT.Matrix3} a newly allocated matrix object.
         */
        getClone : function() {
		    var m= new CAAT.Matrix3( );
            m.copy(this);
		    return m;
	    },
        /**
         * Multiplies this matrix by another matrix.
         *
         * @param n {CAAT.Matrix3} a CAAT.Matrix3 object.
         * @return this
         */
	    multiply : function( m ) {
		    var n= this.getClone( );

            var nm= n.matrix;
            var n00= nm[0][0];
            var n01= nm[0][1];
            var n02= nm[0][2];
            var n03= nm[0][3];

            var n10= nm[1][0];
            var n11= nm[1][1];
            var n12= nm[1][2];
            var n13= nm[1][3];

            var n20= nm[2][0];
            var n21= nm[2][1];
            var n22= nm[2][2];
            var n23= nm[2][3];

            var n30= nm[3][0];
            var n31= nm[3][1];
            var n32= nm[3][2];
            var n33= nm[3][3];

            var mm= m.matrix;
            var m00= mm[0][0];
            var m01= mm[0][1];
            var m02= mm[0][2];
            var m03= mm[0][3];

            var m10= mm[1][0];
            var m11= mm[1][1];
            var m12= mm[1][2];
            var m13= mm[1][3];

            var m20= mm[2][0];
            var m21= mm[2][1];
            var m22= mm[2][2];
            var m23= mm[2][3];

            var m30= mm[3][0];
            var m31= mm[3][1];
            var m32= mm[3][2];
            var m33= mm[3][3];

            this.matrix[0][0] = n00*m00 + n01*m10 + n02*m20 + n03*m30;
            this.matrix[0][1] = n00*m01 + n01*m11 + n02*m21 + n03*m31;
            this.matrix[0][2] = n00*m02 + n01*m12 + n02*m22 + n03*m32;
            this.matrix[0][3] = n00*m03 + n01*m13 + n02*m23 + n03*m33;

            this.matrix[1][0] = n10*m00 + n11*m10 + n12*m20 + n13*m30;
            this.matrix[1][1] = n10*m01 + n11*m11 + n12*m21 + n13*m31;
            this.matrix[1][2] = n10*m02 + n11*m12 + n12*m22 + n13*m32;
            this.matrix[1][3] = n10*m03 + n11*m13 + n12*m23 + n13*m33;

            this.matrix[2][0] = n20*m00 + n21*m10 + n22*m20 + n23*m30;
            this.matrix[2][1] = n20*m01 + n21*m11 + n22*m21 + n23*m31;
            this.matrix[2][2] = n20*m02 + n21*m12 + n22*m22 + n23*m32;
            this.matrix[2][3] = n20*m03 + n21*m13 + n22*m23 + n23*m33;

            return this;
        },
        /**
         * Pre multiplies this matrix by a given matrix.
         *
         * @param m {CAAT.Matrix3} a CAAT.Matrix3 object.
         *
         * @return this
         */
        premultiply : function(m) {
		    var n= this.getClone( );

            var nm= n.matrix;
            var n00= nm[0][0];
            var n01= nm[0][1];
            var n02= nm[0][2];
            var n03= nm[0][3];

            var n10= nm[1][0];
            var n11= nm[1][1];
            var n12= nm[1][2];
            var n13= nm[1][3];

            var n20= nm[2][0];
            var n21= nm[2][1];
            var n22= nm[2][2];
            var n23= nm[2][3];

            var n30= nm[3][0];
            var n31= nm[3][1];
            var n32= nm[3][2];
            var n33= nm[3][3];

            var mm= m.matrix;
            var m00= mm[0][0];
            var m01= mm[0][1];
            var m02= mm[0][2];
            var m03= mm[0][3];

            var m10= mm[1][0];
            var m11= mm[1][1];
            var m12= mm[1][2];
            var m13= mm[1][3];

            var m20= mm[2][0];
            var m21= mm[2][1];
            var m22= mm[2][2];
            var m23= mm[2][3];

            var m30= mm[3][0];
            var m31= mm[3][1];
            var m32= mm[3][2];
            var m33= mm[3][3];

		    this.matrix[0][0] = n00*m00 + n01*m10 + n02*m20;
		    this.matrix[0][1] = n00*m01 + n01*m11 + n02*m21;
		    this.matrix[0][2] = n00*m02 + n01*m12 + n02*m22;
		    this.matrix[0][3] = n00*m03 + n01*m13 + n02*m23 + n03;
		    this.matrix[1][0] = n10*m00 + n11*m10 + n12*m20;
		    this.matrix[1][1] = n10*m01 + n11*m11 + n12*m21;
		    this.matrix[1][2] = n10*m02 + n11*m12 + n12*m22;
		    this.matrix[1][3] = n10*m03 + n11*m13 + n12*m23 + n13;
		    this.matrix[2][0] = n20*m00 + n21*m10 + n22*m20;
		    this.matrix[2][1] = n20*m01 + n21*m11 + n22*m21;
		    this.matrix[2][2] = n20*m02 + n21*m12 + n22*m22;
		    this.matrix[2][3] = n20*m03 + n21*m13 + n22*m23 + n23;

            return this;
	    },
        /**
         * Set this matrix translation values to be the given parameters.
         *
         * @param x {number} x component of translation point.
         * @param y {number} y component of translation point.
         * @param z {number} z component of translation point.
         *
         * @return this
         */
        setTranslate : function(x,y,z) {
            this.identity();
		    this.matrix[0][3]=x;
		    this.matrix[1][3]=y;
		    this.matrix[2][3]=z;
            return this;
	    },
        /**
         * Create a translation matrix.
         * @param x {number}
         * @param y {number}
         * @param z {number}
         * @return {CAAT.Matrix3} a new matrix.
         */
        translate : function( x,y,z ) {
            var m= new CAAT.Matrix3();
            m.setTranslate( x,y,z );
            return m;
        },
        setScale : function( sx, sy, sz ) {
            this.identity();
            this.matrix[0][0]= sx;
            this.matrix[1][1]= sy;
            this.matrix[2][2]= sz;
            return this;
        },
        scale : function( sx, sy, sz ) {
            var m= new CAAT.Matrix3();
            m.setScale(sx,sy,sz);
            return m;
        },
        /**
         * Set this matrix as the rotation matrix around the given axes.
         * @param xy {number} radians of rotation around z axis.
         * @param xz {number} radians of rotation around y axis.
         * @param yz {number} radians of rotation around x axis.
         *
         * @return this
         */
	    rotateModelView : function( xy, xz, yz ) {
		    var sxy= Math.sin( xy );
            var sxz= Math.sin( xz );
            var syz= Math.sin( yz );
            var cxy= Math.cos( xy );
            var cxz= Math.cos( xz );
            var cyz= Math.cos( yz );

            this.matrix[0][0]= cxz*cxy;
            this.matrix[0][1]= -cxz*sxy;
            this.matrix[0][2]= sxz;
            this.matrix[0][3]= 0;
            this.matrix[1][0]= syz*sxz*cxy+sxy*cyz;
            this.matrix[1][1]= cyz*cxy-syz*sxz*sxy;
            this.matrix[1][2]= -syz*cxz;
            this.matrix[1][3]= 0;
            this.matrix[2][0]= syz*sxy-cyz*sxz*cxy;
            this.matrix[2][1]= cyz*sxz*sxy+syz*cxy;
            this.matrix[2][2]= cyz*cxz;
            this.matrix[2][3]= 0;
            this.matrix[3][0]= 0;
            this.matrix[3][1]= 0;
            this.matrix[3][2]= 0;
            this.matrix[3][3]= 1;

            return this;
	    },
        /**
         * Copy a given matrix values into this one's.
         * @param m {CAAT.Matrix} a matrix
         *
         * @return this
         */
	    copy : function( m ) {
		    for( var i=0; i<4; i++ ) {
                for( var j=0; j<4; j++ ) {
                    this.matrix[i][j]= m.matrix[i][j];
                }
            }

            return this;
        },
        /**
         * Calculate this matrix's determinant.
         * @return {number} matrix determinant.
         */
        calculateDeterminant: function () {

            var mm= this.matrix;
		    var m11= mm[0][0], m12= mm[0][1], m13= mm[0][2], m14= mm[0][3],
		        m21= mm[1][0], m22= mm[1][1], m23= mm[1][2], m24= mm[1][3],
		        m31= mm[2][0], m32= mm[2][1], m33= mm[2][2], m34= mm[2][3],
		        m41= mm[3][0], m42= mm[3][1], m43= mm[3][2], m44= mm[3][3];

            return  m14 * m22 * m33 * m41 +
                    m12 * m24 * m33 * m41 +
                    m14 * m23 * m31 * m42 +
                    m13 * m24 * m31 * m42 +

                    m13 * m21 * m34 * m42 +
                    m11 * m23 * m34 * m42 +
                    m14 * m21 * m32 * m43 +
                    m11 * m24 * m32 * m43 +

                    m13 * m22 * m31 * m44 +
                    m12 * m23 * m31 * m44 +
                    m12 * m21 * m33 * m44 +
                    m11 * m22 * m33 * m44 +

                    m14 * m23 * m32 * m41 -
                    m13 * m24 * m32 * m41 -
                    m13 * m22 * m34 * m41 -
                    m12 * m23 * m34 * m41 -

                    m14 * m21 * m33 * m42 -
                    m11 * m24 * m33 * m42 -
                    m14 * m22 * m31 * m43 -
                    m12 * m24 * m31 * m43 -

                    m12 * m21 * m34 * m43 -
                    m11 * m22 * m34 * m43 -
                    m13 * m21 * m32 * m44 -
                    m11 * m23 * m32 * m44;
	    },
        /**
         * Return a new matrix which is this matrix's inverse matrix.
         * @return {CAAT.Matrix3} a new matrix.
         */
        getInverse : function() {
            var mm= this.matrix;
		    var m11 = mm[0][0], m12 = mm[0][1], m13 = mm[0][2], m14 = mm[0][3],
		        m21 = mm[1][0], m22 = mm[1][1], m23 = mm[1][2], m24 = mm[1][3],
		        m31 = mm[2][0], m32 = mm[2][1], m33 = mm[2][2], m34 = mm[2][3],
		        m41 = mm[3][0], m42 = mm[3][1], m43 = mm[3][2], m44 = mm[3][3];
            
            var m2= new CAAT.Matrix3();
            m2.matrix[0][0]= m23*m34*m42 + m24*m32*m43 + m22*m33*m44 - m24*m33*m42 - m22*m34*m43 - m23*m32*m44;
            m2.matrix[0][1]= m14*m33*m42 + m12*m34*m43 + m13*m32*m44 - m12*m33*m44 - m13*m34*m42 - m14*m32*m43;
            m2.matrix[0][2]= m13*m24*m42 + m12*m23*m44 + m14*m22*m43 - m12*m24*m43 - m13*m22*m44 - m14*m23*m42;
            m2.matrix[0][3]= m14*m23*m32 + m12*m24*m33 + m13*m22*m34 - m13*m24*m32 - m14*m22*m33 - m12*m23*m34;

            m2.matrix[1][0]= m24*m33*m41 + m21*m34*m43 + m23*m31*m44 - m23*m34*m41 - m24*m31*m43 - m21*m33*m44;
            m2.matrix[1][1]= m13*m34*m41 + m14*m31*m43 + m11*m33*m44 - m14*m33*m41 - m11*m34*m43 - m13*m31*m44;
            m2.matrix[1][2]= m14*m23*m41 + m11*m24*m43 + m13*m21*m44 - m13*m24*m41 - m14*m21*m43 - m11*m23*m44;
            m2.matrix[1][3]= m13*m24*m31 + m14*m21*m33 + m11*m23*m34 - m14*m23*m31 - m11*m24*m33 - m13*m21*m34;

            m2.matrix[2][0]= m22*m34*m41 + m24*m31*m42 + m21*m32*m44 - m24*m32*m41 - m21*m34*m42 - m22*m31*m44;
            m2.matrix[2][1]= m14*m32*m41 + m11*m34*m42 + m12*m31*m44 - m11*m32*m44 - m12*m34*m41 - m14*m31*m42;
            m2.matrix[2][2]= m13*m24*m41 + m14*m21*m42 + m11*m22*m44 - m14*m22*m41 - m11*m24*m42 - m12*m21*m44;
            m2.matrix[2][3]= m14*m22*m31 + m11*m24*m32 + m12*m21*m34 - m11*m22*m34 - m12*m24*m31 - m14*m21*m32;

            m2.matrix[3][0]= m23*m32*m41 + m21*m33*m42 + m22*m31*m43 - m22*m33*m41 - m23*m31*m42 - m21*m32*m43;
            m2.matrix[3][1]= m12*m33*m41 + m13*m31*m42 + m11*m32*m43 - m13*m32*m41 - m11*m33*m42 - m12*m31*m43;
            m2.matrix[3][2]= m13*m22*m41 + m11*m23*m42 + m12*m21*m43 - m11*m22*m43 - m12*m23*m41 - m13*m21*m42;
            m2.matrix[3][3]= m12*m23*m31 + m13*m21*m32 + m11*m22*m33 - m13*m22*m31 - m11*m23*m32 - m12*m21*m33;
            
            return m2.multiplyScalar( 1/this.calculateDeterminant() );
        },
        /**
         * Multiply this matrix by a scalar.
         * @param scalar {number} scalar value
         *
         * @return this
         */
        multiplyScalar : function( scalar ) {
            var i,j;

            for( i=0; i<4; i++ ) {
                for( j=0; j<4; j++ ) {
                    this.matrix[i][j]*=scalar;
                }
            }

            return this;
        }

    };

})();

(function() {

    /**
     * 2D affinetransform matrix represeantation.
     * It includes matrices for
     * <ul>
     *  <li>Rotation by any anchor point
     *  <li>translation
     *  <li>scale by any anchor point
     * </ul>
     *
     */
	CAAT.Matrix = function() {
        this.matrix= [
            1.0,0.0,0.0,
            0.0,1.0,0.0, 0.0,0.0,1.0 ];

        if ( typeof Float32Array!=="undefined" ) {
            this.matrix= new Float32Array(this.matrix);
        }

		return this;
	};
	
	CAAT.Matrix.prototype= {
		matrix:	null,

        /**
         * Transform a point by this matrix. The parameter point will be modified with the transformation values.
         * @param point {CAAT.Point}.
         * @return {CAAT.Point} the parameter point.
         */
		transformCoord : function(point) {
			var x= point.x;
			var y= point.y;

            var tm= this.matrix;

            point.x= x*tm[0] + y*tm[1] + tm[2];
            point.y= x*tm[3] + y*tm[4] + tm[5];

			return point;
		},
        /**
         * Create a new rotation matrix and set it up for the specified angle in radians.
         * @param angle {number}
         * @return {CAAT.Matrix} a matrix object.
         *
         * @static
         */
		rotate : function(angle) {
			var m= new CAAT.Matrix();
			m.setRotation(angle);
			return m;
        },
        setRotation : function( angle ) {

            this.identity();

            var tm= this.matrix;
            var c= Math.cos( angle );
            var s= Math.sin( angle );
            tm[0]= c;
            tm[1]= -s;
            tm[3]= s;
            tm[4]= c;

			return this;
		},
        /**
         * Create a scale matrix.
         * @param scalex {number} x scale magnitude.
         * @param scaley {number} y scale magnitude.
         *
         * @return {CAAT.Matrix} a matrix object.
         *
         * @static
         */
		scale : function(scalex, scaley) {
			var m= new CAAT.Matrix();

            m.matrix[0]= scalex;
            m.matrix[4]= scaley;

			return m;
		},
        setScale : function(scalex, scaley) {
            this.identity();

            this.matrix[0]= scalex;
            this.matrix[4]= scaley;

			return this;
		},
        /**
         * Create a translation matrix.
         * @param x {number} x translation magnitude.
         * @param y {number} y translation magnitude.
         *
         * @return {CAAT.Matrix} a matrix object.
         * @static
         *
         */
		translate : function( x, y ) {
			var m= new CAAT.Matrix();

            m.matrix[2]= x;
            m.matrix[5]= y;

			return m;
		},
        /**
         * Sets this matrix as a translation matrix.
         * @param x
         * @param y
         */
        setTranslate : function( x, y ) {
            this.identity();

            this.matrix[2]= x;
            this.matrix[5]= y;

            return this;
        },
        /**
         * Copy into this matrix the given matrix values.
         * @param matrix {CAAT.Matrix}
         * @return this
         */
		copy : function( matrix ) {
            matrix= matrix.matrix;

            var tmatrix= this.matrix;
			tmatrix[0]= matrix[0];
			tmatrix[1]= matrix[1];
			tmatrix[2]= matrix[2];
			tmatrix[3]= matrix[3];
			tmatrix[4]= matrix[4];
			tmatrix[5]= matrix[5];
			tmatrix[6]= matrix[6];
			tmatrix[7]= matrix[7];
			tmatrix[8]= matrix[8];

            return this;
		},
        /**
         * Set this matrix to the identity matrix.
         * @return this
         */
		identity : function() {

            var m= this.matrix;
            m[0]= 1.0;
            m[1]= 0.0;
            m[2]= 0.0;

            m[3]= 0.0;
            m[4]= 1.0;
            m[5]= 0.0;

            m[6]= 0.0;
            m[7]= 0.0;
            m[8]= 1.0;

            return this;
		},
        /**
         * Multiply this matrix by a given matrix.
         * @param m {CAAT.Matrix}
         * @return this
         */
		multiply : function( m ) {

            var tm= this.matrix;
            var mm= m.matrix;

            var tm0= tm[0];
            var tm1= tm[1];
            var tm2= tm[2];
            var tm3= tm[3];
            var tm4= tm[4];
            var tm5= tm[5];
            var tm6= tm[6];
            var tm7= tm[7];
            var tm8= tm[8];

            var mm0= mm[0];
            var mm1= mm[1];
            var mm2= mm[2];
            var mm3= mm[3];
            var mm4= mm[4];
            var mm5= mm[5];
            var mm6= mm[6];
            var mm7= mm[7];
            var mm8= mm[8];

            tm[0]= tm0*mm0 + tm1*mm3 + tm2*mm6;
            tm[1]= tm0*mm1 + tm1*mm4 + tm2*mm7;
            tm[2]= tm0*mm2 + tm1*mm5 + tm2*mm8;
            tm[3]= tm3*mm0 + tm4*mm3 + tm5*mm6;
            tm[4]= tm3*mm1 + tm4*mm4 + tm5*mm7;
            tm[5]= tm3*mm2 + tm4*mm5 + tm5*mm8;
            tm[6]= tm6*mm0 + tm7*mm3 + tm8*mm6;
            tm[7]= tm6*mm1 + tm7*mm4 + tm8*mm7;
            tm[8]= tm6*mm2 + tm7*mm5 + tm8*mm8;

            return this;
		},
        /**
         * Premultiply this matrix by a given matrix.
         * @param m {CAAT.Matrix}
         * @return this
         */
		premultiply : function(m) {

            var m00= m.matrix[0]*this.matrix[0] + m.matrix[1]*this.matrix[3] + m.matrix[2]*this.matrix[6];
            var m01= m.matrix[0]*this.matrix[1] + m.matrix[1]*this.matrix[4] + m.matrix[2]*this.matrix[7];
            var m02= m.matrix[0]*this.matrix[2] + m.matrix[1]*this.matrix[5] + m.matrix[2]*this.matrix[8];

            var m10= m.matrix[3]*this.matrix[0] + m.matrix[4]*this.matrix[3] + m.matrix[5]*this.matrix[6];
            var m11= m.matrix[3]*this.matrix[1] + m.matrix[4]*this.matrix[4] + m.matrix[5]*this.matrix[7];
            var m12= m.matrix[3]*this.matrix[2] + m.matrix[4]*this.matrix[5] + m.matrix[5]*this.matrix[8];

            var m20= m.matrix[6]*this.matrix[0] + m.matrix[7]*this.matrix[3] + m.matrix[8]*this.matrix[6];
            var m21= m.matrix[6]*this.matrix[1] + m.matrix[7]*this.matrix[4] + m.matrix[8]*this.matrix[7];
            var m22= m.matrix[6]*this.matrix[2] + m.matrix[7]*this.matrix[5] + m.matrix[8]*this.matrix[8];

            this.matrix[0]= m00;
            this.matrix[1]= m01;
            this.matrix[2]= m02;

            this.matrix[3]= m10;
            this.matrix[4]= m11;
            this.matrix[5]= m12;

            this.matrix[6]= m20;
            this.matrix[7]= m21;
            this.matrix[8]= m22;


            return this;
		},
        /**
         * Creates a new inverse matrix from this matrix.
         * @return {CAAT.Matrix} an inverse matrix.
         */
	    getInverse : function() {
            var tm= this.matrix;

			var m00= tm[0];
			var m01= tm[1];
            var m02= tm[2];
			var m10= tm[3];
			var m11= tm[4];
            var m12= tm[5];
            var m20= tm[6];
            var m21= tm[7];
            var m22= tm[8];

            var newMatrix= new CAAT.Matrix();

            var determinant= m00* (m11*m22 - m21*m12) - m10*(m01*m22 - m21*m02) + m20 * (m01*m12 - m11*m02);
            if ( determinant===0 ) {
                return null;
            }

            var m= newMatrix.matrix;

            m[0]= m11*m22-m12*m21;
            m[1]= m02*m21-m01*m22;
            m[2]= m01*m12-m02*m11;

            m[3]= m12*m20-m10*m22;
            m[4]= m00*m22-m02*m20;
            m[5]= m02*m10-m00*m12;

            m[6]= m10*m21-m11*m20;
            m[7]= m01*m20-m00*m21;
            m[8]= m00*m11-m01*m10;

            newMatrix.multiplyScalar( 1/determinant );

			return newMatrix;
	    },
        /**
         * Multiply this matrix by a scalar.
         * @param scalar {number} scalar value
         *
         * @return this
         */
        multiplyScalar : function( scalar ) {
            var i;

            for( i=0; i<9; i++ ) {
                this.matrix[i]*=scalar;
            }

            return this;
        },

        transformRenderingContextSet : null,

        transformRenderingContext : null,

        /**
         *
         * @param ctx
         */
        transformRenderingContextSet_NoClamp : function(ctx) {
            var m= this.matrix;
            ctx.setTransform( m[0], m[3], m[1], m[4], m[2], m[5] );
            return this;
        },

        /**
         *
         * @param ctx
         */
        transformRenderingContext_NoClamp : function(ctx) {
            var m= this.matrix;
            ctx.transform( m[0], m[3], m[1], m[4], m[2], m[5] );
            return this;
        },

        /**
         *
         * @param ctx
         */
        transformRenderingContextSet_Clamp : function(ctx) {
            var m= this.matrix;
            ctx.setTransform( m[0], m[3], m[1], m[4], m[2]>>0, m[5]>>0 );
            return this;
        },

        /**
         *
         * @param ctx
         */
        transformRenderingContext_Clamp : function(ctx) {
            var m= this.matrix;
            ctx.transform( m[0], m[3], m[1], m[4], m[2]>>0, m[5]>>0 );
            return this;
        }

	};

    CAAT.Matrix.prototype.transformRenderingContext= CAAT.Matrix.prototype.transformRenderingContext_Clamp;
    CAAT.Matrix.prototype.transformRenderingContextSet= CAAT.Matrix.prototype.transformRenderingContextSet_Clamp;

})();

(function() {
    /**
     * Implementation of a matrix stack. Each CAAT.Actor instance contains a MatrixStack to hold of its affine
     * transformations. The Canvas rendering context will be fed with this matrix stack values to keep a homogeneous
     * transformation process.
     *
     * @constructor
     */
	CAAT.MatrixStack= function() {
		this.stack= [];
		this.saved= [];
		return this;
	};

	CAAT.MatrixStack.prototype= {
		stack: null,
		saved: null,

        /**
         * Add a matrix to the transformation stack.
         * @return this
         */
		pushMatrix : function(matrix) {
			this.stack.push(matrix);
            return this;
		},
        /**
         * Remove the last matrix from this stack.
         * @return {CAAT.Matrix} the poped matrix.
         */
		popMatrix : function()	{
			return this.stack.pop();
		},
        /**
         * Create a restoration point of pushed matrices.
         * @return this
         */
		save : function() {
			this.saved.push(this.stack.length);
            return this;
		},
        /**
         * Restore from the last restoration point set.
         * @return this
         */
		restore : function() {
			var pos= this.saved.pop();
			while( this.stack.length!==pos ) {
				this.popMatrix();
			}
            return this;
		},
        /**
         * Return the concatenation (multiplication) matrix of all the matrices contained in this stack.
         * @return {CAAT.Matrix} a new matrix.
         */
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