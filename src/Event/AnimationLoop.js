CAAT.Module({
    defines:"CAAT.Event.AnimationLoop",
    onCreate : function() {

        /**
         * @lends CAAT
         */

        /**
         * if RAF, this value signals end of RAF.
         * @type {Boolean}
         */
        CAAT.ENDRAF=false;

        /**
         * This value holds setInterval ID or RAF handler ID required to stop the CAAT loop
         * @type {null}
         */
        CAAT.LOOP_ID=null;

        /**
         * Boolean flag to determine if CAAT.loop has already been called.
         * @type {Boolean}
         */
        CAAT.renderEnabled=false;

        /**
         * expected FPS when using setInterval animation.
         * @type {Number}
         */
        CAAT.FPS=60;

        /**
         * Use RAF shim instead of setInterval. Set to != 0 to use setInterval.
         * @type {Number}
         */
        CAAT.NO_RAF=0;

        /**
         * debug panel update time.
         * @type {Number}
         */
        CAAT.FPS_REFRESH=500;

        /**
         * requestAnimationFrame time reference.
         * @type {Number}
         */
        CAAT.RAF=0;

        /**
         * time between two consecutive RAF. usually bigger than FRAME_TIME
         * @type {Number}
         */
        CAAT.REQUEST_ANIMATION_FRAME_TIME=0;

        /**
         * time between two consecutive setInterval calls.
         * @type {Number}
         */
        CAAT.SET_INTERVAL=0;

        /**
         * time to process one frame.
         * @type {Number}
         */
        CAAT.FRAME_TIME=0;

        /**
         * Current animated director.
         * @type {CAAT.Foundation.Director}
         */
        CAAT.currentDirector=null;

        /**
         * Registered director objects.
         * @type {Array}
         */
        CAAT.director=[];

        /**
         * Register and keep track of every CAAT.Director instance in the document.
         */
        CAAT.RegisterDirector=function (director) {
            if (!CAAT.currentDirector) {
                CAAT.currentDirector = director;
            }
            CAAT.director.push(director);
        };

        /**
         * Return current scene.
         * @return {CAAT.Foundation.Scene}
         */
        CAAT.getCurrentScene=function () {
            return CAAT.currentDirector.getCurrentScene();
        };

        /**
         * Return current director's current scene's time.
         * The way to go should be keep local scene references, but anyway, this function is always handy.
         * @return {number} current scene's virtual time.
         */
        CAAT.getCurrentSceneTime=function () {
            return CAAT.currentDirector.getCurrentScene().time;
        };

        /**
         * Stop animation loop.
         */
        CAAT.endLoop=function () {
            if (CAAT.NO_RAF) {
                if (CAAT.LOOP_ID !== null) {
                    clearInterval(CAAT.LOOP_ID);
                }
            } else {
                CAAT.ENDRAF = true;
                if (CAAT.LOOP_ID !== null) {
                    window.cancelRequestAnimFrame(CAAT.LOOP_ID);
                }
            }

            CAAT.renderEnabled = false;
        };

        /**
         * Main animation loop entry point.
         * Must called only once, or only after endLoop.
         *
         * @param fps {number} desired fps. fps parameter will only be used if CAAT.NO_RAF is specified, that is
         * switch from RequestAnimationFrame to setInterval for animation loop.
         */
        CAAT.loop=function (fps) {
            if (CAAT.renderEnabled) {
                return;
            }

            for (var i = 0, l = CAAT.director.length; i < l; i++) {
                CAAT.director[i].timeline = new Date().getTime();
            }

            CAAT.FPS = fps || 60;
            CAAT.renderEnabled = true;
            if (CAAT.NO_RAF) {
                CAAT.LOOP_ID = setInterval(
                    function () {
                        var t = new Date().getTime();

                        for (var i = 0, l = CAAT.director.length; i < l; i++) {
                            var dr = CAAT.director[i];
                            if (dr.renderMode === CAAT.Foundation.Director.RENDER_MODE_CONTINUOUS || dr.needsRepaint) {
                                dr.renderFrame();
                            }
                        }

                        CAAT.FRAME_TIME = t - CAAT.SET_INTERVAL;

                        if (CAAT.RAF) {
                            CAAT.REQUEST_ANIMATION_FRAME_TIME = new Date().getTime() - CAAT.RAF;
                        }
                        CAAT.RAF = new Date().getTime();

                        CAAT.SET_INTERVAL = t;

                    },
                    1000 / CAAT.FPS
                );
            } else {
                CAAT.ENDRAF = false;
                CAAT.renderFrameRAF();
            }
        };
        
        CAAT.renderFrameRAF= function (now) {
            var c= CAAT;

            if (c.ENDRAF) {
                c.ENDRAF = false;
                return;
            }

            if (!now) now = new Date().getTime();

            var t= new Date().getTime();
            c.REQUEST_ANIMATION_FRAME_TIME = c.RAF ? now - c.RAF : 16;
            for (var i = 0, l = c.director.length; i < l; i++) {
                c.director[i].renderFrame();
            }
            c.RAF = now;
            c.FRAME_TIME = new Date().getTime() - t;


            CAAT.LOOP_ID = window.requestAnimFrame(c.renderFrameRAF, 0);
        };
        
        /**
         * Polyfill for requestAnimationFrame.
         */
        window.requestAnimFrame = (function () {
            return  window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function raf(/* function */ callback, /* DOMElement */ element) {
                    return window.setTimeout(callback, 1000 / CAAT.FPS);
                };
        })(); 

        /**
         * Polyfill for cancelRequestAnimationFrame.
         */
        window.cancelRequestAnimFrame = (function () {
            return  window.cancelRequestAnimationFrame ||
                window.webkitCancelRequestAnimationFrame ||
                window.mozCancelRequestAnimationFramee ||
                window.oCancelRequestAnimationFrame ||
                window.msCancelRequestAnimationFrame ||
                function cancelRaf(handleID) {
                    window.clearTimeout(handleID);
                };
        })();       
    },

    extendsWith:function () {
        return {
        };
    }
});
