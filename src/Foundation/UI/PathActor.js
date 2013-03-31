/**
 * See LICENSE file.
 *
 * An actor to show the path and its handles in the scene graph. 
 *
 **/
CAAT.Module( {

    /**
     * @name PathActor
     * @memberOf CAAT.Foundation.UI
     * @extends CAAT.Foundation.Actor
     * @constructor
     */

    defines : "CAAT.Foundation.UI.PathActor",
    aliases : ["CAAT.PathActor"],
    depends : [
        "CAAT.Foundation.Actor"
    ],
    extendsClass : "CAAT.Foundation.Actor",
    extendsWith : {

        /**
         * @lends CAAT.Foundation.UI.PathActor.prototype
         */

        /**
         * Path to draw.
         * @type {CAAT.PathUtil.Path}
         */
		path                    : null,

        /**
         * Calculated path´s bounding box.
         */
		pathBoundingRectangle   : null,

        /**
         * draw the bounding rectangle too ?
         */
		bOutline                : false,

        /**
         * Outline the path in this color.
         */
        outlineColor            : 'black',

        /**
         * If the path is interactive, some handlers are shown to modify the path.
         * This callback function will be called when the path is interactively changed.
         */
        onUpdateCallback        : null,

        /**
         * Set this path as interactive.
         */
        interactive             : false,

        /**
         * Return the contained path.
         * @return {CAAT.Path}
         */
        getPath : function() {
            return this.path;
        },

        /**
         * Sets the path to manage.
         * @param path {CAAT.PathUtil.PathSegment}
         * @return this
         */
		setPath : function(path) {
			this.path= path;
            if ( path!=null ) {
			    this.pathBoundingRectangle= path.getBoundingBox();
                this.setInteractive( this.interactive );
            }
            return this;
		},
        /**
         * Paint this actor.
         * @param director {CAAT.Foundation.Director}
         * @param time {number}. Scene time.
         */
		paint : function(director, time) {

            CAAT.Foundation.UI.PathActor.superclass.paint.call( this, director, time );

            if ( !this.path ) {
                return;
            }

            var ctx= director.ctx;

            ctx.strokeStyle='#000';
			this.path.paint(director, this.interactive);

            if ( this.bOutline ) {
                ctx.strokeStyle= this.outlineColor;
                ctx.strokeRect(
                    this.pathBoundingRectangle.x,
                    this.pathBoundingRectangle.y,
                    this.pathBoundingRectangle.width,
                    this.pathBoundingRectangle.height
                );
            }
		},
        /**
         * Enables/disables drawing of the contained path's bounding box.
         * @param show {boolean} whether to show the bounding box
         * @param color {=string} optional parameter defining the path's bounding box stroke style.
         */
        showBoundingBox : function(show, color) {
            this.bOutline= show;
            if ( show && color ) {
                this.outlineColor= color;
            }
            return this;
        },
        /**
         * Set the contained path as interactive. This means it can be changed on the fly by manipulation
         * of its control points.
         * @param interactive
         */
        setInteractive : function(interactive) {
            this.interactive= interactive;
            if ( this.path ) {
                this.path.setInteractive(interactive);
            }
            return this;
        },
        setOnUpdateCallback : function( fn ) {
            this.onUpdateCallback= fn;
            return this;
        },
        /**
         * Route mouse dragging functionality to the contained path.
         * @param mouseEvent {CAAT.Event.MouseEvent}
         */
		mouseDrag : function(mouseEvent) {
			this.path.drag(mouseEvent.point.x, mouseEvent.point.y, this.onUpdateCallback);
		},
        /**
         * Route mouse down functionality to the contained path.
         * @param mouseEvent {CAAT.Event.MouseEvent}
         */
		mouseDown : function(mouseEvent) {
			this.path.press(mouseEvent.point.x, mouseEvent.point.y);
		},
        /**
         * Route mouse up functionality to the contained path.
         * @param mouseEvent {CAAT.Event.MouseEvent}
         */
		mouseUp : function(mouseEvent) {
			this.path.release();
		}
	}
});
