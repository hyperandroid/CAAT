CAAT.Module( {
    defines : "CAAT.Event.Input",
    depends : [
        "CAAT.Event.KeyEvent",
        "CAAT.Event.MouseEvent",
        "CAAT.Event.TouchEvent"
    ],
    onCreate : function() {

        /**
         * @lends CAAT
         */

        /**
         * Set the cursor.
         * @param cursor
         */
        CAAT.setCursor= function(cursor) {
            if ( navigator.browser!=='iOS' ) {
                document.body.style.cursor= cursor;
            }
        };


        /**
         * Constant to set touch behavior as single touch, compatible with mouse.
         * @type {Number}
         * @constant
         */
        CAAT.TOUCH_AS_MOUSE=        1;

        /**
         * Constant to set CAAT touch behavior as multitouch.
         * @type {Number}
         * @contant
         */
        CAAT.TOUCH_AS_MULTITOUCH=   2;

        /**
         * Set CAAT touch behavior as single or multi touch.
         * @type {Number}
         */
        CAAT.TOUCH_BEHAVIOR= CAAT.TOUCH_AS_MOUSE;

        /**
         * Array of window resize listeners.
         * @type {Array}
         */
        CAAT.windowResizeListeners= [];

        /**
         * Register a function callback as window resize listener.
         * @param f
         */
        CAAT.registerResizeListener= function(f) {
            CAAT.windowResizeListeners.push(f);
        };

        /**
         * Remove a function callback as window resize listener.
         * @param director
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
         * Aray of Key listeners.
         */
        CAAT.keyListeners= [];

        /**
         * Register a function callback as key listener.
         * @param f
         */
        CAAT.registerKeyListener= function(f) {
            CAAT.keyListeners.push(f);
        };

        /**
         * Acceleration data.
         * @type {Object}
         */
        CAAT.accelerationIncludingGravity= {
            x:0,
            y:0,
            z:0
        };

        /**
         * Device motion angles.
         * @type {Object}
         */
        CAAT.rotationRate= {
            alpha: 0,
            beta:0,
            gamma: 0 };

        /**
         * Enable device motion events.
         * This function does not register a callback, instear it sets
         * CAAT.rotationRate and CAAt.accelerationIncludingGravity values.
         */
        CAAT.enableDeviceMotion= function() {

            CAAT.prevOnDeviceMotion=    null;   // previous accelerometer callback function.
            CAAT.onDeviceMotion=        null;   // current accelerometer callback set for CAAT.

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

    },
    extendsWith : {
    }
});
