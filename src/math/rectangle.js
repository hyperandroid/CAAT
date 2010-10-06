/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * Rectangle Class.
 * Needed to compute Curve bounding box.
 * Needed to compute Actor affected area on change.
 *
 **/


(function() {
	CAAT.Rectangle= function() {
		return this;
	};
	
	CAAT.Rectangle.prototype= {
		x:		0,
		y:		0,
		x1:		0,
		y1:		0,
		width:	0,
		height:	0,
		
		contains : function(px,py) {
			return px>=0 && px<this.width && py>=0 && py<this.height; 
		},
		isEmpty : function() {
			return this.width==0 && this.height==0;
		},
		union : function(px,py) {
			
			if ( this.isEmpty() && this.x==0 && this.y==0 ) {
				this.x= px;
				this.y= py;
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
		}
	};
})();