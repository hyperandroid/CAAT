CAAT.Module({
    defines:"CAAT.Behavior.AlphaBehavior",
    aliases:["CAAT.AlphaBehavior"],
    depends:["CAAT.Behavior.BaseBehavior"],
    extendsClass:"CAAT.Behavior.BaseBehavior",
    extendsWith:function () {
        return {

            startAlpha:0,
            endAlpha:0,

            parse : function( obj ) {
                CAAT.Behavior.AlphaBehavior.superclass.parse.call(this,obj);
                this.startAlpha= obj.start || 0;
                this.endAlpha= obj.end || 0;
            },

            getPropertyName:function () {
                return "opacity";
            },

            /**
             * Applies corresponding alpha transparency value for a given time.
             *
             * @param time the time to apply the scale for.
             * @param actor the target actor to set transparency for.
             * @return {number} the alpha value set. Normalized from 0 (total transparency) to 1 (total opacity)
             */
            setForTime:function (time, actor) {

                CAAT.Behavior.AlphaBehavior.superclass.setForTime.call(this, time, actor);

                var alpha = (this.startAlpha + time * (this.endAlpha - this.startAlpha));
                if (this.doValueApplication) {
                    actor.setAlpha(alpha);
                }
                return alpha;
            },
            /**
             * Set alpha transparency minimum and maximum value.
             * This value can be coerced by Actor's property isGloblAlpha.
             *
             * @param start {number} a float indicating the starting alpha value.
             * @param end {number} a float indicating the ending alpha value.
             */
            setValues:function (start, end) {
                this.startAlpha = start;
                this.endAlpha = end;
                return this;
            },

            calculateKeyFrameData:function (time) {
                time = this.interpolator.getPosition(time).y;
                return  (this.startAlpha + time * (this.endAlpha - this.startAlpha));
            },

            /**
             * @param prefix {string} browser vendor prefix
             * @param name {string} keyframes animation name
             * @param keyframessize {number} number of keyframes to generate
             * @override
             */
            calculateKeyFramesData:function (prefix, name, keyframessize) {

                if (typeof keyframessize === 'undefined') {
                    keyframessize = 100;
                }
                keyframessize >>= 0;

                var i;
                var kfr;
                var kfd = "@-" + prefix + "-keyframes " + name + " {";

                for (i = 0; i <= keyframessize; i++) {
                    kfr = "" +
                        (i / keyframessize * 100) + "%" + // percentage
                        "{" +
                        "opacity: " + this.calculateKeyFrameData(i / keyframessize) +
                        "}";

                    kfd += kfr;
                }

                kfd += "}";

                return kfd;
            }
        }
    }
});
