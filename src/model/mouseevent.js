/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * MouseEvent is a class to hold necessary information of every mouse event related to concrete
 * scene graph Actors.
 *
 * Here it is also the logic to on mouse events, pump the correct event to the appropiate scene
 * graph Actor.
 *
 * 20101008 Hyperandroid. changed event scope from CAAT.director.canvas to window. Works under
 *          al major browsers on linux and win7. Thanks @alteredq for this tip.
 *
 * TODO: add events for event pumping:
 *  + cancelBubling
 *
 **/
(function() {
	CAAT.MouseEvent = function() {
		this.point= new CAAT.Point();
		this.screenPoint= new CAAT.Point();
		return this;
	};
	
	CAAT.MouseEvent.prototype= {
		screenPoint:	null,
		point:			null,
		time:			0,
		source:			null,

        shift:          false,
        control:        false,
        alt:            false,
        meta:           false,

        sourceEvent:    null,

		init : function( x,y,sourceEvent,source,screenPoint ) {
			this.point.set(x,y);
			this.source=        source;
			this.screenPoint=   screenPoint;
            this.alt =          sourceEvent.altKey;
            this.control =      sourceEvent.ctrlKey;
            this.shift =        sourceEvent.shiftKey;
            this.meta =         sourceEvent.metaKey;
            this.sourceEvent=   sourceEvent;
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
	};
})();

/**
 * Flag to signal whether events are enabled for CAAT.
 */
CAAT.GlobalEventsEnabled=   false;

/**
 * Accelerometer related data.
 */
CAAT.prevOnDeviceMotion=    null;   // previous accelerometer callback function.
CAAT.onDeviceMotion=        null;   // current accelerometer callback set for CAAT.
CAAT.accelerationIncludingGravity= { x:0, y:0, z:0 };   // acceleration data.
CAAT.rotationRate= { alpha: 0, beta:0, gamma: 0 };      // angles data.

/**
 * Do not consider mouse drag gesture at least until you have dragged
 * 5 pixels in any direction.
 */
CAAT.DRAG_THRESHOLD_X=      5;
CAAT.DRAG_THRESHOLD_Y=      5;

/**
 * Pressed key codes.
 */
CAAT.keyListeners= [];

/**
 * Register key events notification function.
 * @param f {function(key {integer}, action {'down'|'up'})}
 */
CAAT.registerKeyListener= function(f) {
    CAAT.keyListeners.push(f);
}

/**
  * @param director {CAAT.Director}
 */
CAAT.GlobalEnableEvents= function __GlobalEnableEvents(director) {

    if ( CAAT.GlobalEventsEnabled ) {
        return;
    }

    this.GlobalEventsEnabled= true;

    window.addEventListener('keydown',
        function(evt,c) {
            var key = (evt.which) ? evt.which : evt.keyCode;
            for( var i=0; i<CAAT.keyListeners.length; i++ ) {
                CAAT.keyListeners[i](key,'down');
            }
        },
        false);

    window.addEventListener('keyup',
        function(evt,c) {
            var key = (evt.which) ? evt.which : evt.keyCode;
            for( var i=0; i<CAAT.keyListeners.length; i++ ) {
                CAAT.keyListeners[i](key,'up');
            }
        },
        false );
};

/**
 * Register and keep track of every CAAT.Director instance in the document.
 */
CAAT.RegisterDirector= function __CAATGlobal_RegisterDirector(director) {

    if ( !CAAT.director ) {
        CAAT.director=[];
    }
    CAAT.director.push(this);

    CAAT.GlobalEnableEvents();
};

/**
 * Enable at window level accelerometer events.
 */
(function() {

    //----------- Test for Accelerometer enabled functions.
    try {
        if (window.DeviceMotionEvent != undefined) {
            CAAT.prevOnDeviceMotion= window.ondevicemotion;
            window.ondevicemotion = CAAT.onDeviceMotion= function(e) {
                CAAT.accelerationIncludingGravity= {
                    x: e.accelerationIncludingGravity.x,
                    y: e.accelerationIncludingGravity.y,
                    z: e.accelerationIncludingGravity.z
                };

                if ( e.rotationRate ) {
                    CAAT.rotationRate= {
                        alpha : e.rotationRate.alpha,
                        beta  : e.rotationRate.beta,
                        gamma : e.rotationRate.gamma
                    };
                }
            }
        }
    } catch (e) {
        // eat it.
    }

})();