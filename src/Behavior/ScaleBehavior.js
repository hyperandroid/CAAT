CAAT.Module({
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
             * ScaleBehavior applies scale affine transforms in both axis.
             * StartScale and EndScale must be supplied for each axis. This method takes care of a FF bug in which if a Scale is
             * set to 0, the animation will fail playing.
             *
             * This behavior specifies anchors in values ranges 0..1
             *
             * @constructor
             * @extendsClass CAAT.Behavior
             *
             */
            __init:function () {
                this.__super();
                this.anchor = CAAT.Foundation.Actor.ANCHOR_CENTER;
                return this;
            },

            startScaleX:1,
            endScaleX:1,
            startScaleY:1,
            endScaleY:1,
            anchorX:.50,
            anchorY:.50,

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

            calculateKeyFrameData:function (time) {
                var scaleX;
                var scaleY;

                time = this.interpolator.getPosition(time).y;
                scaleX = this.startScaleX + time * (this.endScaleX - this.startScaleX);
                scaleY = this.startScaleY + time * (this.endScaleY - this.startScaleY);

                return "scaleX(" + scaleX + ") scaleY(" + scaleY + ")";
            },

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
                        "}";

                    kfd += kfr;
                }

                kfd += "}";

                return kfd;
            }
        }

    }
});
