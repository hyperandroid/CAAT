/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * An actor to show the path and its handles in the scene graph. 
 *
 **/
(function() {
    /**
     * This class paints and handles the interactive behavior of a path.
     *
     * @constructor
     * @extends CAAT.ActorContainer
     */
	CAAT.PathActor= function() {
		CAAT.PathActor.superclass.constructor.call(this);
		return this;
	};
	
	CAAT.PathActor.prototype= {
		path:					null,
		pathBoundingRectangle:	null,
		bOutline:				false,

        /**
         * Return the contained path.
         * @return {CAAT.Path}
         */
        getPath : function() {
            return this.path;
        },
        /**
         * Sets the path to manage.
         * @param path {CAAT.PathSegment}
         * @return this
         */
		setPath : function(path) {
			this.path= path;
			this.pathBoundingRectangle= path.getBoundingBox();
            return this;
		},
        /**
         * Paint this actor.
         * @param director {CAAT.Director}
         * @param time {number}. Scene time.
         */
		paint : function(director, time) {

            var canvas= director.crc;

            canvas.strokeStyle='black';
			this.path.paint(director);
			
			if ( this.bOutline ) {
				canvas.strokeStyle='black';
				canvas.strokeRect(0,0,this.width,this.height);
			}
		},
        /**
         * Route mouse dragging functionality to the contained path.
         * @param mouseEvent {CAAT.MouseEvent}
         */
		mouseDrag : function(mouseEvent) {
			this.path.drag(mouseEvent.point.x, mouseEvent.point.y);
		},
        /**
         * Route mouse down functionality to the contained path.
         * @param mouseEvent {CAAT.MouseEvent}
         */
		mouseDown : function(mouseEvent) {
			this.path.press(mouseEvent.point.x, mouseEvent.point.y);
		},
        /**
         * Route mouse up functionality to the contained path.
         * @param mouseEvent {CAAT.MouseEvent}
         */
		mouseUp : function(mouseEvent) {
			this.path.release();
		}
	};

    extend( CAAT.PathActor, CAAT.ActorContainer, null);
})();