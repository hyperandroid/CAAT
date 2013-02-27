CAAT.Module({

    /**
     *
     * Define an animation frame sequence, name it and supply with a callback which be called when the
     * sequence ends playing.
     *
     * @name SpriteImageAnimationHelper
     * @memberOf CAAT.Foundation
     * @constructor
     */

    defines : "CAAT.Foundation.SpriteImageAnimationHelper",
    extendsWith : function() {
        return {

            /**
             * @lends  CAAT.Foundation.SpriteImageAnimationHelper.prototype
             */

            __init : function( animation, time, onEndPlayCallback ) {
                this.animation= animation;
                this.time= time;
                this.onEndPlayCallback= onEndPlayCallback;
                return this;
            },

            /**
             * A sequence of integer values defining a frame animation.
             * For example [1,2,3,4,3,2,3,4,3,2]
             * Array.<number>
             */
            animation :         null,

            /**
             * Time between any two animation frames.
             */
            time :              0,

            /**
             * Call this callback function when the sequence ends.
             */
            onEndPlayCallback : null

        }
    }
});