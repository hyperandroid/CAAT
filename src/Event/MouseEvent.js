CAAT.Module( {
    defines : "CAAT.Event.MouseEvent",
    aliases : ["CAAT.MouseEvent"],
    depends : [
        "CAAT.Math.Point"
    ],
    extendsWith : {
        __init : function() {
            this.point= new CAAT.Math.Point(0,0,0);
            this.screenPoint= new CAAT.Math.Point(0,0,0);
            this.touches= [];
            return this;
        },

		screenPoint:	null,
		point:			null,
		time:			0,
		source:			null,

        shift:          false,
        control:        false,
        alt:            false,
        meta:           false,

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
