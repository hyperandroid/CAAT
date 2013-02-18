/**
 * See LICENSE file.
 *
 **/

CAAT.Module( {
    defines: "CAAT.Core.Constants",
    depends : [
        "CAAT.Math.Matrix"
    ],

    extendsWith: function() {

        CAAT.CLAMP= false;  // do not clamp coordinates. speeds things up in older browsers.

        /**
         * This function makes the system obey decimal point calculations for actor's position, size, etc.
         * This may speed things up in some browsers, but at the cost of affecting visuals (like in rotating
         * objects).
         *
         * Latest Chrome (20+) is not affected by this.
         *
         * Default CAAT.Matrix try to speed things up.
         *
         * @param clamp {boolean}
         */
        CAAT.setCoordinateClamping= function( clamp ) {
            CAAT.CLAMP= clamp;
            CAAT.Math.Matrix.setCoordinateClamping(clamp);
        };

        /**
         * Log function which deals with window's Console object.
         */
        CAAT.log= function() {
            if(window.console){
                window.console.log( Array.prototype.slice.call(arguments) );
            }
        };

        /**
         * Control how CAAT.Font and CAAT.TextActor control font ascent/descent values.
         * 0 means it will guess values from a font height
         * 1 means it will try to use css to get accurate ascent/descent values and fall back to the previous method
         *   in case it couldn't.
         *
         * @type {Number}
         */
        CAAT.CSS_TEXT_METRICS=      0;

        CAAT.GLRENDER= false;

        /**
         * DEBUGGING CONSTANTS
         */
        CAAT.DEBUG= false;              // set this variable before building CAAT.Director intances to
                                    // enable debug panel.
        CAAT.DEBUGBB= false;            // show Bounding Boxes
        CAAT.DEBUGBBBCOLOR = '#00f';      // Bounding Boxes color.
        CAAT.DEBUGAABB = false;         // debug axis aligned bounding boxes.
        CAAT.DEBUGAABBCOLOR = '#f00';
        CAAT.DEBUG_DIRTYRECTS= false;    // if CAAT.Director.setClear uses CLEAR_DIRTY_RECTS, this will show them
                                    // on screen.

        /**
         * Do not consider mouse drag gesture at least until you have dragged
         * DRAG_THRESHOLD_X and DRAG_THRESHOLD_Y pixels.
         * This is suitable for tablets, where just by touching, drag events are delivered.
         */
        CAAT.DRAG_THRESHOLD_X=      5;
        CAAT.DRAG_THRESHOLD_Y=      5;

        CAAT.CACHE_SCENE_ON_CHANGE= true;   // cache scenes on change. set before building director instance.

        return {
        }
    }
} );
