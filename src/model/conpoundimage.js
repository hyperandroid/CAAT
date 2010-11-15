/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * ConpoundBitmap handles subimaging from an image.
 * It's useful for SpriteActor class.
 *
 * TODO: allow set of margins, spacing, etc. to define subimages. 
 *
 **/


(function() {
	 
	CAAT.CompoundImage= function() {
		return this;
	};
	
	CAAT.CompoundImage.prototype= {

		NORMAL: 					1,
    	INV_VERTICAL: 				2,
    	INV_HORIZONTAL: 			4,
    	INV_VERTICAL_AND_HORIZONTAL: 8,
    
    	image:						null,
    	rows:						0,
    	cols:						0,
    	width:						0,
    	height:						0,
    	singleWidth:				0,
    	singleHeight:				0,

    	initialize : function( image, rows, cols ) {
        	this.image= image;
        	this.rows=  rows;
        	this.cols=  cols;
        	this.width= image.width;
        	this.height=image.height;
        	this.singleWidth=  	Math.floor(this.width/cols);
        	this.singleHeight= 	Math.floor(this.height/rows);
            return this;
    	},
	    paintInvertedH : function( canvas, imageIndex, x, y ) {
	    	var sx0= Math.floor(imageIndex%this.cols)*this.singleWidth;
	        var sy0= Math.floor(imageIndex/this.cols)*this.singleHeight;
	       
	        canvas.save();
		        canvas.translate( x+this.singleWidth, y );
		        canvas.scale(-1, 1);
		        
//		        try {
		        canvas.drawImage( this.image,
		        				  sx0, sy0, this.singleWidth, this.singleHeight,
		        				  0, 0, this.singleWidth, this.singleHeight );
//		        } catch(e) {}
	 
	        canvas.restore();
	    },
	    paintInvertedV : function( canvas, imageIndex, x, y ) {
	    	var sx0= Math.floor(imageIndex%this.cols)*this.singleWidth;
	        var sy0= Math.floor(imageIndex/this.cols)*this.singleHeight;
	    	
	        canvas.save();
	        	canvas.translate( x, y+this.singleHeight );
	        	canvas.scale(1, -1);
	        	
//	        	try {
		        canvas.drawImage( 
		        	this.image, 
	  				sx0, sy0, this.singleWidth, this.singleHeight,
	  				0, 0, this.singleWidth, this.singleHeight );
//	        	} catch(e) {}
	        canvas.restore();
	    },
	    paintInvertedHV : function( canvas, imageIndex, x, y ) {
	    	var sx0= Math.floor(imageIndex%this.cols)*this.singleWidth;
	        var sy0= Math.floor(imageIndex/this.cols)*this.singleHeight;
	    	
	        canvas.save();
		    	canvas.translate( x, y+this.singleHeight );
		    	canvas.scale(1, -1);
	        	canvas.translate( this.singleWidth, 0 );
	        	canvas.scale(-1, 1);
	        	
//	        	try {
		        canvas.drawImage( 
		        		this.image, 
		  				sx0, sy0, this.singleWidth, this.singleHeight,
		  				0, 0, this.singleWidth, this.singleHeight );
//	        	} catch(e) {}
	        	
	        canvas.restore();
	    },
	    paint : function( canvas, imageIndex, x, y ) {
	
	        var sx0= Math.floor(imageIndex%this.cols)*this.singleWidth;
	        var sy0= Math.floor(imageIndex/this.cols)*this.singleHeight;

            if ( sx0<0 || sy0<0 ) {
                return;
            }
//	        try {
	        canvas.drawImage( 
	        		this.image, 
					sx0, sy0, this.singleWidth, this.singleHeight,
					x, y, this.singleWidth, this.singleHeight );
//	        } catch(e) {}
	
	    },
	    paintScaled : function( canvas, imageIndex, x, y, w, h ) {
	        var sx0= Math.floor(imageIndex%this.cols)*this.singleWidth;
	        var sy0= Math.floor(imageIndex/this.cols)*this.singleHeight;
	        canvas.drawImage( 
	        		this.image, 
					sx0, sy0, this.singleWidth, this.singleHeight,
					x, y, w, h );
	    },
	    getNumImages : function() {
	    	return this.rows*this.cols;
	    }
	};
})();