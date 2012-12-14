/**
 * See LICENSE file.
 *
 **/

CAAT.Module( {
    defines: "CAAT.Core.Constants",

    extendsWith: function() {

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
            if ( clamp ) {
                CAAT.Matrix.prototype.transformRenderingContext= CAAT.Matrix.prototype.transformRenderingContext_Clamp;
                CAAT.Matrix.prototype.transformRenderingContextSet= CAAT.Matrix.prototype.transformRenderingContextSet_Clamp;
                CAAT.Math.Matrix.prototype.transformRenderingContext= CAAT.Matrix.prototype.transformRenderingContext_Clamp;
                CAAT.Math.Matrix.prototype.transformRenderingContextSet= CAAT.Matrix.prototype.transformRenderingContextSet_Clamp;
            } else {
                CAAT.Matrix.prototype.transformRenderingContext= CAAT.Matrix.prototype.transformRenderingContext_NoClamp;
                CAAT.Matrix.prototype.transformRenderingContextSet= CAAT.Matrix.prototype.transformRenderingContextSet_NoClamp;
                CAAT.Math.Matrix.prototype.transformRenderingContext= CAAT.Matrix.prototype.transformRenderingContext_NoClamp;
                CAAT.Math.Matrix.prototype.transformRenderingContextSet= CAAT.Matrix.prototype.transformRenderingContextSet_NoClamp;
            }
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

        return {
        }
    }
} );
