CAAT.Module( {

    /**
     * @name MouseEvent
     * @memberOf CAAT.Event
     * @constructor
     */

    defines : "CAAT.Event.MouseEvent",
    aliases : ["CAAT.MouseEvent"],
    depends : [
        "CAAT.Math.Point"
    ],
    extendsWith : {

        /**
         * @lends CAAT.Event.MouseEvent.prototype
         */

        /**
         * Constructor delegate
         * @private
         */
        __init : function() {
            this.point= new CAAT.Math.Point(0,0,0);
            this.screenPoint= new CAAT.Math.Point(0,0,0);
            this.touches= [];
            return this;
        },

        /**
         * Original mouse/touch screen coord
         */
		screenPoint:	null,

        /**
         * Transformed in-actor coordinate
         */
		point:			null,

        /**
         * scene time when the event was triggered.
         */
		time:			0,

        /**
         * Actor the event was produced in.
         */
		source:			null,

        /**
         * Was shift pressed ?
         */
        shift:          false,

        /**
         * Was control pressed ?
         */
        control:        false,

        /**
         * was alt pressed ?
         */
        alt:            false,

        /**
         * was Meta key pressed ?
         */
        meta:           false,

        /**
         * Original mouse/touch event
         */
        sourceEvent:    null,

        touches     :   null,

		init : function( x,y,sourceEvent,source,screenPoint,time ) {
			this.point.set(x,y);
			this.source=        source;
			this.screenPoint=   screenPoint;
            this.alt =          sourceEvent.altKey;
            this.control =      sourceEvent.ctrlKey;
            this.shift =        sourceEvent.shiftKey;
            this.meta =         sourceEvent.metaKey;
            this.sourceEvent=   sourceEvent;
            this.x=             x;
            this.y=             y;
            this.time=          time;
			return this;
		},
		isAltDown : function() {
			return this.alt;
		},
		isControlDown : function() {
			return this.control;
		},
		isShiftDown : function() {
			return this.shift;
		},
        isMetaDown: function() {
            return this.meta;
        },
        getSourceEvent : function() {
            return this.sourceEvent;
        }
	}
});
