CAAT.Module({
    defines:"CAAT.Event.AnimationLoop",
    onCreate : function() {
        CAAT.ENDRAF=false; // if RAF, this value signals end of RAF.
        CAAT.INTERVAL_ID=null; // if setInterval, this value holds CAAT.setInterval return value.
        CAAT.renderEnabled=false; // Boolean flag to determine if CAAT.loop has already been called.
        CAAT.FPS=60; // expected FPS when using setInterval animation.
        CAAT.NO_RAF=0; // Use RAF shim instead of setInterval.
        CAAT.FPS_REFRESH=500; // debug panel update time.
        CAAT.RAF=0; // requestAnimationFrame time reference.
        CAAT.REQUEST_ANIMATION_FRAME_TIME=0; // time between two consecutive RAF. usually bigger than FRAME_TIME
        CAAT.SET_INTERVAL=0; // time between two consecutive setInterval calls.
        CAAT.FRAME_TIME=0; // time to process one frame.
        CAAT.currentDirector=null; // Current animated director.
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
                if (CAAT.INTERVAL_ID !== null) {
                    clearInterval(CAAT.INTERVAL_ID);
                }
            } else {
                CAAT.ENDRAF = true;
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
                CAAT.INTERVAL_ID = setInterval(
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
                CAAT.renderFrameRAF();
            }
        };
        
        CAAT.renderFrameRAF= function () {
            var c= CAAT;

            if (c.ENDRAF) {
                c.ENDRAF = false;
                return;
            }

            var t = new Date().getTime();
            for (var i = 0, l = c.director.length; i < l; i++) {
                c.director[i].renderFrame();
            }
            t = new Date().getTime() - t;
            c.FRAME_TIME = t;

            if (c.RAF) {
                c.REQUEST_ANIMATION_FRAME_TIME = new Date().getTime() - c.RAF;
            }
            c.RAF = new Date().getTime();

            window.requestAnimFrame(c.renderFrameRAF, 0);
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
                    window.setTimeout(callback, 1000 / CAAT.FPS);
                };
        })();        
    },

    extendsWith:function () {
        return {
        };
    }
});
