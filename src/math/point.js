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
        },
		translatePoint: function(aPoint)
		{
		    this.x += aPoint.x;
		    this.y += aPoint.y;
		    return this;
		},
		subtract: function(aPoint)
		{
			this.x -= aPoint.x;
			this.y -= aPoint.y;
			return this;
		},
		multiply: function(factor)
		{
			this.x *= factor;
			this.y *= factor;
			return this;
		},

		rotate: function(angle)
		{
			var x = this.x, y = this.y;
		    this.x = x * Math.cos(angle) - Math.sin(angle) * y;
		    this.y = x * Math.sin(angle) + Math.cos(angle) * y;
		    return this;
		},

		setAngle: function(angle)
		{
		    var len = this.getLength();
		    this.x = Math.cos(angle) * len;
		    this.y = Math.sin(angle) * len;
		    return this;
		},

		setLength: function(length)
		{
		    var len = this.getLength();
		    if (len)this.multiply(length / len);
		    else this.x = this.y = length;
		    return this;
		},

		normalize: function()
		{
		    var len = this.getLength();
		    this.x /= len;
		    this.y /= len;
		    return this;
		},

		getAngle: function()
		{
		    return Math.atan2(this.y, this.x);
		},

		limit: function(max)
		{
			var aLenthSquared = this.getLengthSquared();
			if(aLenthSquared+0.01 > max*max)
			{
				var aLength = Math.sqrt(aLenthSquared);
				this.x = (this.x/aLength) * max;
				this.y = (this.y/aLength) * max;
			}
		},

		getLength: function()
		{
		    var length = Math.sqrt(this.x * this.x + this.y * this.y);
		    if ( length < 0.005 && length > -0.005) return 0.000001;
		    return length;

		},
		getLengthSquared: function()
		{
		    var lengthSquared = this.x * this.x + this.y * this.y;
		    if ( lengthSquared < 0.005 && lengthSquared > -0.005) return 0;
		    return lengthSquared;
		},

		getDistance: function(point)
		{
			var deltaX = this.x - point.x;
			var deltaY = this.y - point.y;
			return Math.sqrt( (deltaX * deltaX) + (deltaY * deltaY) );
		},

		getDistanceSquared: function(point)
		{
			var deltaX = this.x - point.x;
			var deltaY = this.y - point.y;
			return (deltaX * deltaX) + (deltaY * deltaY);
		},

		toString: function()
		{
			return "(CAAT.Point) x:'" + String(Math.round(Math.floor(this.x*10))/10) + " y:" + String(Math.round(Math.floor(this.y*10))/10);
		}
	};
})();