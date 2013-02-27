CAAT.Module({

    /**
     * @name ScaleBehavior
     * @memberOf CAAT.Behavior
     * @extends CAAT.Behavior.BaseBehavior
     * @constructor
     */

    defines:"CAAT.Behavior.ScaleBehavior",
    depends:[
        "CAAT.Behavior.BaseBehavior",
        "CAAT.Foundation.Actor"
    ],
    extendsClass:"CAAT.Behavior.BaseBehavior",
    aliases : ["CAAT.ScaleBehavior"],
    extendsWith:function () {

        return  {

            /**
             * @lends CAAT.Behavior.ScaleBehavior
             */

            __init:function () {
                this.__super();
                this.anchor = CAAT.Foundation.Actor.ANCHOR_CENTER;
                return this;
            },

            /**
             * Start X scale value.
             * @private
             * @type {number}
             */
            startScaleX:1,

            /**
             * End X scale value.
             * @private
             * @type {number}
             */
            endScaleX:1,

            /**
             * Start Y scale value.
             * @private
             * @type {number}
             */
            startScaleY:1,

            /**
             * End Y scale value.
             * @private
             * @type {number}
             */
            endScaleY:1,

            /**
             * Scale X anchor value.
             * @private
             * @type {number}
             */
            anchorX:.50,

            /**
             * Scale Y anchor value.
             * @private
             * @type {number}
             */
            anchorY:.50,

            /**
             * @inheritDoc
             */
            parse : function( obj ) {
                CAAT.Behavior.ScaleBehavior.superclass.parse.call(this,obj);
                this.startScaleX= (obj.scaleX && obj.scaleX.start) || 0;
                this.endScaleX= (obj.scaleX && obj.scaleX.end) || 0;
                this.startScaleY= (obj.scaleY && obj.scaleY.start) || 0;
                this.endScaleY= (obj.scaleY && obj.scaleY.end) || 0;
                this.anchorX= (typeof obj.anchorX!=="undefined" ? parseInt(obj.anchorX) : 0.5);
                this.anchorY= (typeof obj.anchorY!=="undefined" ? parseInt(obj.anchorY) : 0.5);
            },

            /**
             * @inheritDoc
             */
            getPropertyName:function () {
                return "scale";
            },

            /**
             * Applies corresponding scale values for a given time.
             *
             * @param time the time to apply the scale for.
             * @param actor the target actor to Scale.
             * @return {object} an object of the form <code>{ scaleX: {float}, scaleY: {float}�}</code>
             */
            setForTime:function (time, actor) {

                var scaleX = this.startScaleX + time * (this.endScaleX - this.startScaleX);
                var scaleY = this.startScaleY + time * (this.endScaleY - this.startScaleY);

                // Firefox 3.x & 4, will crash animation if either scaleX or scaleY equals 0.
                if (0 === scaleX) {
                    scaleX = 0.01;
                }
                if (0 === scaleY) {
                    scaleY = 0.01;
                }

                if (this.doValueApplication) {
                    actor.setScaleAnchored(scaleX, scaleY, this.anchorX, this.anchorY);
                }

                return { scaleX:scaleX, scaleY:scaleY };
            },
            /**
             * Define this scale behaviors values.
             *
             * Be aware the anchor values are supplied in <b>RELATIVE PERCENT</b> to
             * actor's size.
             *
             * @param startX {number} initial X axis scale value.
             * @param endX {number} final X axis scale value.
             * @param startY {number} initial Y axis scale value.
             * @param endY {number} final Y axis scale value.
             * @param anchorx {float} the percent position for anchorX
             * @param anchory {float} the percent position for anchorY
             *
             * @return this.
             */
            setValues:function (startX, endX, startY, endY, anchorx, anchory) {
                this.startScaleX = startX;
                this.endScaleX = endX;
                this.startScaleY = startY;
                this.endScaleY = endY;

                if (typeof anchorx !== 'undefined' && typeof anchory !== 'undefined') {
                    this.anchorX = anchorx;
                    this.anchorY = anchory;
                }

                return this;
            },
            /**
             * Set an exact position scale anchor. Use this method when it is hard to
             * set a thorough anchor position expressed in percentage.
             * @param actor
             * @param x
             * @param y
             */
            setAnchor:function (actor, x, y) {
                this.anchorX = x / actor.width;
                this.anchorY = y / actor.height;

                return this;
            },

            /**
             * @inheritDoc
             */
            calculateKeyFrameData:function (time) {
                var scaleX;
                var scaleY;

                time = this.interpolator.getPosition(time).y;
                scaleX = this.startScaleX + time * (this.endScaleX - this.startScaleX);
                scaleY = this.startScaleY + time * (this.endScaleY - this.startScaleY);

                return "scale(" + scaleX +"," + scaleY + ")";
            },

            /**
             * @inheritDoc
             */
            getKeyFrameDataValues : function(time) {
                time = this.interpolator.getPosition(time).y;
                return {
                    scaleX : this.startScaleX + time * (this.endScaleX - this.startScaleX),
                    scaleY : this.startScaleY + time * (this.endScaleY - this.startScaleY)
                };
            },


            /**
             * @inheritDoc
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
                        "-" + prefix + "-transform:" + this.calculateKeyFrameData(i / keyframessize) +
                        "; -" + prefix + "-transform-origin:" + (this.anchorX*100) + "% " + (this.anchorY*100) + "% " +
                        "}\n";

                    kfd += kfr;
                }

                kfd += "}\n";

                return kfd;
            }
        }

    }
});
