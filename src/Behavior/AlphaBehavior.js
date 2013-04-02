CAAT.Module({

    /**
     * @name AlphaBehavior
     * @memberOf CAAT.Behavior
     * @extends CAAT.Behavior.BaseBehavior
     * @constructor
     */

    defines:"CAAT.Behavior.AlphaBehavior",
    aliases:["CAAT.AlphaBehavior"],
    depends:["CAAT.Behavior.BaseBehavior"],
    extendsClass:"CAAT.Behavior.BaseBehavior",
    extendsWith:function () {
        return {

            /**
             * @lends CAAT.Behavior.AlphaBehavior.prototype
             */

            /**
             * Starting alpha transparency value. Between 0 and 1.
             * @type {number}
             * @private
             */
            startAlpha:0,

            /**
             * Ending alpha transparency value. Between 0 and 1.
             * @type {number}
             * @private
             */
            endAlpha:0,

            /**
             * @inheritsDoc
             * @param obj
             */
            parse : function( obj ) {
                CAAT.Behavior.AlphaBehavior.superclass.parse.call(this,obj);
                this.startAlpha= obj.start || 0;
                this.endAlpha= obj.end || 0;
            },

            /**
             * @inheritDoc
             */
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

            /**
             * @inheritDoc
             */
            calculateKeyFrameData:function (time) {
                time = this.interpolator.getPosition(time).y;
                return  (this.startAlpha + time * (this.endAlpha - this.startAlpha));
            },

            /**
             * @inheritDoc
             */
            getKeyFrameDataValues : function(time) {
                time = this.interpolator.getPosition(time).y;
                return {
                    alpha : this.startAlpha + time * (this.endAlpha - this.startAlpha)
                };
            },

            /**
             * @inheritDoc
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
