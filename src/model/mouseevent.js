/**
 * See LICENSE file.
 *
 * MouseEvent is a class to hold necessary information of every mouse event related to concrete
 * scene graph Actors.
 *
 * Here it is also the logic to on mouse events, pump the correct event to the appropiate scene
 * graph Actor.
 *
 * TODO: add events for event pumping:
 *  + cancelBubling
 *
 **/

CAAT.TouchInfo= function( id, x, y, target ) {

    this.identifier= id;
    this.clientX= x;
    this.pageX= x;
    this.clientY= y;
    this.pageY= y;
    this.target= target;
    this.time= new Date().getTime();

    return this;
};

(function() {
    /**
     * This function creates a mouse event that represents a touch or mouse event.
     * @constructor
     */
	CAAT.TouchEvent = function() {
        this.touches= [];
        this.changedTouches= [];
		return this;
	};

	CAAT.TouchEvent.prototype= {

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
	};
})();

(function() {
    /**
     * This function creates a mouse event that represents a touch or mouse event.
     * @constructor
     */
	CAAT.MouseEvent = function() {
		this.point= new CAAT.Point(0,0,0);
		this.screenPoint= new CAAT.Point(0,0,0);
        this.touches= [];
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
	};
})();

CAAT.setCoordinateClamping= function( clamp ) {
    if ( clamp ) {
        CAAT.Matrix.prototype.transformRenderingContext= CAAT.Matrix.prototype.transformRenderingContext_Clamp;
        CAAT.Matrix.prototype.transformRenderingContextSet= CAAT.Matrix.prototype.transformRenderingContextSet_Clamp;
    } else {
        CAAT.Matrix.prototype.transformRenderingContext= CAAT.Matrix.prototype.transformRenderingContext_NoClamp;
        CAAT.Matrix.prototype.transformRenderingContextSet= CAAT.Matrix.prototype.transformRenderingContextSet_NoClamp;
    }
};

CAAT.TOUCH_AS_MOUSE=        1;
CAAT.TOUCH_AS_MULTITOUCH=   2;

CAAT.TOUCH_BEHAVIOR= CAAT.TOUCH_AS_MOUSE;

/**
 * Box2D point meter conversion ratio.
 */
CAAT.PMR= 64;

CAAT.GLRENDER= false;

/**
 * Allow visual debugging artifacts.
 */
CAAT.DEBUG= false;
CAAT.DEBUGBB= false;
CAAT.DEBUGBBBCOLOR='#00f';
CAAT.DEBUGAABB= false;    // debug bounding boxes.
CAAT.DEBUGAABBCOLOR='#f00';
CAAT.DEBUG_DIRTYRECTS=false;

/**
 * Log function which deals with window's Console object.
 */
CAAT.log= function() {
    if(window.console){
        window.console.log( Array.prototype.slice.call(arguments) );
    }
};

CAAT.FRAME_TIME= 0;

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

// has the animation loop began ?
CAAT.renderEnabled= false;
CAAT.FPS=           60;

/**
 * On resize event listener
 */
CAAT.windowResizeListeners= [];

/**
 * Register an object as resize callback.
 * @param f { function( windowResized(width{number},height{number})} ) }
 */
CAAT.registerResizeListener= function(f) {
    CAAT.windowResizeListeners.push(f);
};

/**
 * Unregister a resize listener.
 * @param director {CAAT.Director}
 */
CAAT.unregisterResizeListener= function(director) {
    for( var i=0; i<CAAT.windowResizeListeners.length; i++ ) {
        if ( director===CAAT.windowResizeListeners[i] ) {
            CAAT.windowResizeListeners.splice(i,1);
            return;
        }
    }
};

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
};

CAAT.Keys = {
    ENTER:13,
    BACKSPACE:8,
    TAB:9,
    SHIFT:16,
    CTRL:17,
    ALT:18,
    PAUSE:19,
    CAPSLOCK:20,
    ESCAPE:27,
//    SPACE:32,
    PAGEUP:33,
    PAGEDOWN:34,
    END:35,
    HOME:36,
    LEFT:37,
    UP:38,
    RIGHT:39,
    DOWN:40,
    INSERT:45,
    DELETE:46,
    0:48,
    1:49,
    2:50,
    3:51,
    4:52,
    5:53,
    6:54,
    7:55,
    8:56,
    9:57,
    a:65,
    b:66,
    c:67,
    d:68,
    e:69,
    f:70,
    g:71,
    h:72,
    i:73,
    j:74,
    k:75,
    l:76,
    m:77,
    n:78,
    o:79,
    p:80,
    q:81,
    r:82,
    s:83,
    t:84,
    u:85,
    v:86,
    w:87,
    x:88,
    y:89,
    z:90,
    SELECT:93,
    NUMPAD0:96,
    NUMPAD1:97,
    NUMPAD2:98,
    NUMPAD3:99,
    NUMPAD4:100,
    NUMPAD5:101,
    NUMPAD6:102,
    NUMPAD7:103,
    NUMPAD8:104,
    NUMPAD9:105,
    MULTIPLY:106,
    ADD:107,
    SUBTRACT:109,
    DECIMALPOINT:110,
    DIVIDE:111,
    F1:112,
    F2:113,
    F3:114,
    F4:115,
    F5:116,
    F6:117,
    F7:118,
    F8:119,
    F9:120,
    F10:121,
    F11:122,
    F12:123,
    NUMLOCK:144,
    SCROLLLOCK:145,
    SEMICOLON:186,
    EQUALSIGN:187,
    COMMA:188,
    DASH:189,
    PERIOD:190,
    FORWARDSLASH:191,
    GRAVEACCENT:192,
    OPENBRACKET:219,
    BACKSLASH:220,
    CLOSEBRAKET:221,
    SINGLEQUOTE:222
};

CAAT.SHIFT_KEY=    16;
CAAT.CONTROL_KEY=  17;
CAAT.ALT_KEY=      18;
CAAT.ENTER_KEY=    13;

/**
 * Event modifiers.
 */
CAAT.KEY_MODIFIERS= {
    alt:        false,
    control:    false,
    shift:      false
};

/**
 * Define a key event.
 * @constructor
 * @param keyCode
 * @param up_or_down
 * @param modifiers
 * @param originalEvent
 */
CAAT.KeyEvent= function( keyCode, up_or_down, modifiers, originalEvent ) {
    this.keyCode= keyCode;
    this.action=  up_or_down;
    this.modifiers= modifiers;
    this.sourceEvent= originalEvent;

    this.preventDefault= function() {
        this.sourceEvent.preventDefault();
    }

    this.getKeyCode= function() {
        return this.keyCode;
    };

    this.getAction= function() {
        return this.action;
    };

    this.modifiers= function() {
        return this.modifiers;
    };

    this.isShiftPressed= function() {
        return this.modifiers.shift;
    };

    this.isControlPressed= function() {
        return this.modifiers.control;
    };

    this.isAltPressed= function() {
        return this.modifiers.alt;
    };

    this.getSourceEvent= function() {
        return this.sourceEvent;
    };
};

/**
 * Enable window level input events, keys and redimension.
 */
CAAT.GlobalEnableEvents= function __GlobalEnableEvents() {

    if ( CAAT.GlobalEventsEnabled ) {
        return;
    }

    this.GlobalEventsEnabled= true;

    window.addEventListener('keydown',
        function(evt) {
            var key = (evt.which) ? evt.which : evt.keyCode;

            if ( key===CAAT.SHIFT_KEY ) {
                CAAT.KEY_MODIFIERS.shift= true;
            } else if ( key===CAAT.CONTROL_KEY ) {
                CAAT.KEY_MODIFIERS.control= true;
            } else if ( key===CAAT.ALT_KEY ) {
                CAAT.KEY_MODIFIERS.alt= true;
            } else {
                for( var i=0; i<CAAT.keyListeners.length; i++ ) {
                    CAAT.keyListeners[i]( new CAAT.KeyEvent(
                        key,
                        'down',
                        {
                            alt:        CAAT.KEY_MODIFIERS.alt,
                            control:    CAAT.KEY_MODIFIERS.control,
                            shift:      CAAT.KEY_MODIFIERS.shift
                        },
                        evt)) ;
                }
            }
        },
        false);

    window.addEventListener('keyup',
        function(evt) {

            var key = (evt.which) ? evt.which : evt.keyCode;
            if ( key===CAAT.SHIFT_KEY ) {
                CAAT.KEY_MODIFIERS.shift= false;
            } else if ( key===CAAT.CONTROL_KEY ) {
                CAAT.KEY_MODIFIERS.control= false;
            } else if ( key===CAAT.ALT_KEY ) {
                CAAT.KEY_MODIFIERS.alt= false;
            } else {

                for( var i=0; i<CAAT.keyListeners.length; i++ ) {
                    CAAT.keyListeners[i]( new CAAT.KeyEvent(
                        key,
                        'up',
                        {
                            alt:        CAAT.KEY_MODIFIERS.alt,
                            control:    CAAT.KEY_MODIFIERS.control,
                            shift:      CAAT.KEY_MODIFIERS.shift
                        },
                        evt));
                }
            }
        },
        false );

    window.addEventListener('resize',
        function(evt) {
            for( var i=0; i<CAAT.windowResizeListeners.length; i++ ) {
                CAAT.windowResizeListeners[i].windowResized(
                        window.innerWidth,
                        window.innerHeight);
            }
        },
        false);
};

/**
 * Polyfill for requestAnimationFrame.
 */
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          window.oRequestAnimationFrame      ||
          window.msRequestAnimationFrame     ||
          function raf(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 1000 / CAAT.FPS);
          };
})();

CAAT.SET_INTERVAL=0;
/**
 * Main animation loop entry point.
 * @param fps {number} desired fps. This parameter makes no sense unless requestAnimationFrame function
 * is not present in the system.
 */
CAAT.loop= function(fps) {
    if (CAAT.renderEnabled) {
        return;
    }


    CAAT.FPS= fps || 60;
    CAAT.renderEnabled= true;
    if (CAAT.NO_RAF) {
        setInterval(
                function() {
                    var t= new Date().getTime();
                    for (var i = 0, l = CAAT.director.length; i < l; i++) {
                        CAAT.director[i].renderFrame();
                    }
                    //t= new Date().getTime()-t;
                    CAAT.FRAME_TIME= t - CAAT.SET_INTERVAL;
                    
                    CAAT.SET_INTERVAL= t;

                },
                1000 / CAAT.FPS
        );
    } else {
        CAAT.renderFrame();
    }
}

CAAT.currentDirector= null;   // this variable always points to current director.
CAAT.getCurrentScene= function() {
    return CAAT.currentDirector.getCurrentScene();
}

CAAT.FPS_REFRESH= 500;  // debug panel update time.
CAAT.RAF= 0;            // requestAnimationFrame time reference.
CAAT.REQUEST_ANIMATION_FRAME_TIME=   0;
/**
 * Make a frame for each director instance present in the system.
 */
CAAT.renderFrame= function() {
    var t= new Date().getTime();
    for( var i=0, l=CAAT.director.length; i<l; i++ ) {
        var dr= CAAT.director[i];
        if ( dr.renderMode===CAAT.Director.RENDER_MODE_CONTINUOUS || dr.needsRepaint ) {
            dr.renderFrame();
        }
    }
    t= new Date().getTime()-t;
    CAAT.FRAME_TIME= t;

    if (CAAT.RAF)   {
        CAAT.REQUEST_ANIMATION_FRAME_TIME= new Date().getTime()-CAAT.RAF;
    }
    CAAT.RAF= new Date().getTime();

    window.requestAnimFrame(CAAT.renderFrame, 0 );
}

/**
 * Set browser cursor. The preferred method for cursor change is this method.
 * @param cursor
 */
CAAT.setCursor= function(cursor) {
    if ( navigator.browser!=='iOS' ) {
        document.body.style.cursor= cursor;
    }
};

/**
 * Register and keep track of every CAAT.Director instance in the document.
 */
CAAT.RegisterDirector= function __CAATGlobal_RegisterDirector(director) {

    if ( !CAAT.director ) {
        CAAT.director=[];
    }
    CAAT.director.push(director);
    CAAT.GlobalEnableEvents();
};

/**
 * Enable at window level accelerometer events.
 */
(function() {

    function tilt(data) {
        CAAT.rotationRate= {
                alpha : 0,
                beta  : data[0],
                gamma : data[1]
            };
    }

    if (window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", function (event) {
            tilt([event.beta, event.gamma]);
        }, true);
    } else if (window.DeviceMotionEvent) {
        window.addEventListener('devicemotion', function (event) {
            tilt([event.acceleration.x * 2, event.acceleration.y * 2]);
        }, true);
    } else {
        window.addEventListener("MozOrientation", function (event) {
            tilt([-event.y * 45, event.x * 45]);
        }, true);
    }

})();