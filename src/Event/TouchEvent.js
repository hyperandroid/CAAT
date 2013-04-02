CAAT.Module( {

    /**
     * @name TouchEvent
     * @memberOf CAAT.Event
     * @constructor
     */


    defines : "CAAT.Event.TouchEvent",
    aliases : ["CAAT.TouchEvent"],
    depends : [
        "CAAT.Event.TouchInfo"
    ],
    extendsWith : {

        /**
         * @lends CAAT.Event.TouchEvent.prototype
         */

        /**
         * Constructor delegate
         * @private
         */
        __init : function() {
            this.touches= [];
            this.changedTouches= [];
            return this;
        },

        /**
         * Time the touch event was triggered at.
         */
		time:			0,

        /**
         * Source Actor the event happened in.
         */
		source:			null,

        /**
         * Original touch event.
         */
        sourceEvent:    null,

        /**
         * Was shift pressed ?
         */
        shift:          false,

        /**
         * Was control pressed ?
         */
        control:        false,

        /**
         * Was alt pressed ?
         */
        alt:            false,

        /**
         * Was meta pressed ?
         */
        meta:           false,

        /**
         * touches collection
         */
        touches         : null,

        /**
         * changed touches collection
         */
        changedTouches  : null,

		init : function( sourceEvent,source,time ) {

			this.source=        source;
            this.alt =          sourceEvent.altKey;
            this.control =      sourceEvent.ctrlKey;
            this.shift =        sourceEvent.shiftKey;
            this.meta =         sourceEvent.metaKey;
            this.sourceEvent=   sourceEvent;
            this.time=          time;

			return this;
		},
        /**
         *
         * @param touchInfo
         *  <{
         *      id : <number>,
         *      point : {
         *          x: <number>,
         *          y: <number> }�
         *  }>
         * @return {*}
         */
        addTouch : function( touchInfo ) {
            if ( -1===this.touches.indexOf( touchInfo ) ) {
                this.touches.push( touchInfo );
            }
            return this;
        },
        addChangedTouch : function( touchInfo ) {
            if ( -1===this.changedTouches.indexOf( touchInfo ) ) {
                this.changedTouches.push( touchInfo );
            }
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
