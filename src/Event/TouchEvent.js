CAAT.Module( {
    defines : "CAAT.Event.TouchEvent",
    aliases : ["CAAT.TouchEvent"],
    depends : [
        "CAAT.Event.TouchInfo"
    ],
    extendsWith : {
        __init : function() {
            this.touches= [];
            this.changedTouches= [];
            return this;
        },

		time:			0,
		source:			null,
        sourceEvent:    null,

        shift:          false,
        control:        false,
        alt:            false,
        meta:           false,


        touches         : null,
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
