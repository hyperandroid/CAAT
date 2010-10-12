/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * Hold a 2D point information.
 * Think about the possibility of turning CAAT.Point into {x:,y:}.
 *
 **/
(function() {
	CAAT.Point= function() {
		return this;
	};
	
	CAAT.Point.prototype= {
		x:	0,
		y: 	0,
			
		set : function(x,y) {
			this.x= x;
			this.y= y;
			return this;
		},
        clone : function() {
            var p= new CAAT.Point();
            p.set( this.x, this.y );
            return p;
        },
        translate : function(x,y) {
            this.x+= x;
            this.y+= y;

            return this;
        }
	};
})();