/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * An actor to show the path and its handles in the scene graph. 
 *
 **/
(function() {
	CAAT.PathActor= function() {
		CAAT.PathActor.superclass.constructor.call(this);
		return this;
	};
	
	extend( CAAT.PathActor, CAAT.Actor, {
		path:					null,
		pathBoundingRectangle:	null,
		bOutline:				false,
		
		setPath : function(path) {
			this.path= path;
			this.pathBoundingRectangle= path.getBoundingBox();
		},
		paint : function(director, time) {

            var canvas= director.crc;

            canvas.strokeStyle='black';
			this.path.paint(director);
			
			if ( this.bOutline ) {
				canvas.strokeStyle='black';
				canvas.strokeRect(0,0,this.width,this.height);
			}
		},
		mouseDrag : function(mouseEvent) {
			this.path.drag(mouseEvent.point.x, mouseEvent.point.y);
		},
		mouseDown : function(mouseEvent) {
			this.path.press(mouseEvent.point.x, mouseEvent.point.y);
		},
		mouseUp : function(mouseEvent) {
			this.path.release();
		}
	});
})();