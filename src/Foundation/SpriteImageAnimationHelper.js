CAAT.Module({
    defines : "CAAT.Foundation.SpriteImageAnimationHelper",
    extendsWith : function() {
        return {

            __init : function( animation, time, onEndPlayCallback ) {
                this.animation= animation;
                this.time= time;
                this.onEndPlayCallback= onEndPlayCallback;
                return this;
            },

            animation :         null,
            time :              0,
            onEndPlayCallback : null

        }
    }
});