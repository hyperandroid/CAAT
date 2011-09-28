/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * Rectangle Class.
 * Needed to compute Curve bounding box.
 * Needed to compute Actor affected area on change.
 *
 **/


(function() {
    /**
     * A Rectangle implementation, which defines an area positioned somewhere.
     *
     * @constructor
     */
	CAAT.Rectangle= function() {
		return this;
	};
	
	CAAT.Rectangle.prototype= {
		x:		0,
		y:		0,
		x1:		0,
		y1:		0,
		width:	-1,
		height:	-1,

        setEmpty : function() {
            this.width=-1;
            this.height=-1;
            return this;
        },
        /**
         * Set this rectangle's location.
         * @param x {number}
         * @param y {number}
         */
        setLocation: function( x,y ) {
            this.x= x;
            this.y= y;
            this.x1= this.x+this.width;
            this.y1= this.y+this.height;
            return this;
        },
        /**
         * Set this rectangle's dimension.
         * @param w {number}
         * @param h {number}
         */
        setDimension : function( w,h ) {
            this.width= w;
            this.height= h;
            this.x1= this.x+this.width;
            this.y1= this.y+this.height;
            return this;
        },
        /**
         * Return whether the coordinate is inside this rectangle.
         * @param px {number}
         * @param py {number}
         *
         * @return {boolean}
         */
		contains : function(px,py) {
			return px>=0 && px<this.width && py>=0 && py<this.height; 
		},
        /**
         * Return whether this rectangle is empty, that is, has zero dimension.
         * @return {boolean}
         */
		isEmpty : function() {
			return this.width===-1 && this.height===-1;
		},
        /**
         * Set this rectangle as the union of this rectangle and the given point.
         * @param px {number}
         * @param py {number}
         */
		union : function(px,py) {
			
			if ( this.isEmpty() ) {
				this.x= px;
                this.x1= px;
				this.y= py;
                this.y1= py;
                this.width=0;
                this.height=0;
				return;
			}
			
			this.x1= this.x+this.width;
			this.y1= this.y+this.height;
			
			if ( py<this.y ) {
				this.y= py;
			}
			if ( px<this.x ) {
				this.x= px;
			}
			if ( py>this.y1 ) {
				this.y1= py;
			}
			if ( px>this.x1 ){
				this.x1= px;
			}
			
			this.width= this.x1-this.x;
			this.height= this.y1-this.y;
		},
        unionRectangle : function( rectangle ) {
            this.union( rectangle.x , rectangle.y  );
            this.union( rectangle.x1, rectangle.y  );
            this.union( rectangle.x,  rectangle.y1 );
            this.union( rectangle.x1, rectangle.y1 );
            return this;
        }
	};
})();