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

        /**
         * @lends CAAT
         */

        /**
         * // do not clamp coordinates. speeds things up in older browsers.
         * @type {Boolean}
         * @private
         */
        CAAT.CLAMP= false;

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

        /**
         * is GLRendering enabled.
         * @type {Boolean}
         */
        CAAT.GLRENDER= false;

        /**
         * set this variable before building CAAT.Director intances to enable debug panel.
         */
        CAAT.DEBUG= false;

        /**
         * show Bounding Boxes
         * @type {Boolean}
         */
        CAAT.DEBUGBB= false;

        /**
         * Bounding Boxes color.
         * @type {String}
         */
        CAAT.DEBUGBBBCOLOR = '#00f';

        /**
         * debug axis aligned bounding boxes.
         * @type {Boolean}
         */
        CAAT.DEBUGAABB = false;

        /**
         * Bounding boxes color.
         * @type {String}
         */
        CAAT.DEBUGAABBCOLOR = '#f00';

        /**
         * if CAAT.Director.setClear uses CLEAR_DIRTY_RECTS, this will show them on screen.
         * @type {Boolean}
         */
        CAAT.DEBUG_DIRTYRECTS= false;

        /**
         * Do not consider mouse drag gesture at least until you have dragged
         * DRAG_THRESHOLD_X and DRAG_THRESHOLD_Y pixels.
         * This is suitable for tablets, where just by touching, drag events are delivered.
         */
        CAAT.DRAG_THRESHOLD_X=      5;
        CAAT.DRAG_THRESHOLD_Y=      5;

        /**
         * When switching scenes, cache exiting scene or not. Set before building director instance.
         * @type {Boolean}
         */
        CAAT.CACHE_SCENE_ON_CHANGE= true;

        return {
        }
    }
} );
