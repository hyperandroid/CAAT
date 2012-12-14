CAAT.Module( {
    defines : "CAAT.Event.Input",
    depends : [
        "CAAT.Event.KeyEvent",
        "CAAT.Event.MouseEvent",
        "CAAT.Event.TouchEvent"
    ],
    onCreate : function() {

        (function() {

            CAAT.setCursor= function(cursor) {
                if ( navigator.browser!=='iOS' ) {
                    document.body.style.cursor= cursor;
                }
            };

        })();

        /**
         * Constants to define input behavior: route as mouse or as multitouch device
         * @type {Number}
         */
        (function() {
            CAAT.TOUCH_AS_MOUSE=        1;
            CAAT.TOUCH_AS_MULTITOUCH=   2;

            CAAT.TOUCH_BEHAVIOR= CAAT.TOUCH_AS_MOUSE;
        })();

        /**
         * Set window resize listeners.
         */
        (function() {


            CAAT.windowResizeListeners= [];

            CAAT.registerResizeListener= function(f) {
                CAAT.windowResizeListeners.push(f);
            };

            CAAT.unregisterResizeListener= function(director) {
                for( var i=0; i<CAAT.windowResizeListeners.length; i++ ) {
                    if ( director===CAAT.windowResizeListeners[i] ) {
                        CAAT.windowResizeListeners.splice(i,1);
                        return;
                    }
                }
            };
        })();

        /**
         * Key listeners.
         */
        (function() {

            CAAT.keyListeners= [];

            CAAT.registerKeyListener= function(f) {
                CAAT.keyListeners.push(f);
            };
        })();


        /**
         * Enable at window level accelerometer events.
         */
        CAAT.enableDeviceMotion= function() {

            CAAT.prevOnDeviceMotion=    null;   // previous accelerometer callback function.
            CAAT.onDeviceMotion=        null;   // current accelerometer callback set for CAAT.
            CAAT.accelerationIncludingGravity= { x:0, y:0, z:0 };   // acceleration data.
            CAAT.rotationRate= { alpha: 0, beta:0, gamma: 0 };      // angles data.

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

        };


        /**
         * Enable window level input events, keys and redimension.
         */
        (function() {

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
        })();
    },
    extendsWith : {
    }
});
