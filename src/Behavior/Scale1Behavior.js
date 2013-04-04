CAAT.Module({
    /**
     * @name Scale1Behavior
     * @memberOf CAAT.Behavior
     * @extends CAAT.Behavior.BaseBehavior
     * @constructor
     */

    /**
     * @name AXIS
     * @memberOf CAAT.Behavior.Scale1Behavior
     * @enum {number}
     * @namespace
     */

    /**
     * @name Axis
     * @memberOf CAAT.Behavior.Scale1Behavior
     * @enum {number}
     * @namespace
     * @deprecated
     */


    defines:"CAAT.Behavior.Scale1Behavior",
    depends:[
        "CAAT.Behavior.BaseBehavior",
        "CAAT.Foundation.Actor"
    ],
    aliases: ["CAAT.Scale1Behavior"],
    constants : {

        AXIS : {
            /**
             * @lends CAAT.Behavior.Scale1Behavior.AXIS
             */

            /** @const */ X:  0,
            /** @const */ Y:  1
        },

        Axis : {
            /**
             * @lends CAAT.Behavior.Scale1Behavior.Axis
             */

            /** @const */ X:  0,
            /** @const */ Y:  1
        }
    },
    extendsClass:"CAAT.Behavior.BaseBehavior",
    extendsWith:function () {

        return {

            /**
             * @lends CAAT.Behavior.Scale1Behavior.prototype
             */

            __init:function () {
                this.__super();
                this.anchor = CAAT.Foundation.Actor.ANCHOR_CENTER;
                return this;
            },

            /**
             * Start scale value.
             * @private
             */
            startScale:1,

            /**
             * End scale value.
             * @private
             */
            endScale:1,

            /**
             * Scale X anchor.
             * @private
             */
            anchorX:.50,

            /**
             * Scale Y anchor.
             * @private
             */
            anchorY:.50,

            /**
             * Apply on Axis X or Y ?
             */
            applyOnX:true,

            parse : function( obj ) {
                CAAT.Behavior.Scale1Behavior.superclass.parse.call(this,obj);
                this.startScale= obj.start || 0;
                this.endScale= obj.end || 0;
                this.anchorX= (typeof obj.anchorX!=="undefined" ? parseInt(obj.anchorX) : 0.5);
                this.anchorY= (typeof obj.anchorY!=="undefined" ? parseInt(obj.anchorY) : 0.5);
                this.applyOnX= obj.axis ? obj.axis.toLowerCase()==="x" : true;
            },

            /**
             * @param axis {CAAT.Behavior.Scale1Behavior.AXIS}
             */
            applyOnAxis:function (axis) {
                if (axis === CAAT.Behavior.Scale1Behavior.AXIS.X) {
                    this.applyOnX = false;
                } else {
                    this.applyOnX = true;
                }
            },

            /**
             * @inheritDoc
             */
            getPropertyName:function () {
                return "scale";
            },

            /**
             * @inheritDoc
             */
            setForTime:function (time, actor) {

                var scale = this.startScale + time * (this.endScale - this.startScale);

                // Firefox 3.x & 4, will crash animation if either scaleX or scaleY equals 0.
                if (0 === scale) {
                    scale = 0.01;
                }

                if (this.doValueApplication) {
                    if (this.applyOnX) {
                        actor.setScaleAnchored(scale, actor.scaleY, this.anchorX, this.anchorY);
                    } else {
                        actor.setScaleAnchored(actor.scaleX, scale, this.anchorX, this.anchorY);
                    }
                }

                return scale;
            },

            /**
             * Define this scale behaviors values.
             *
             * Be aware the anchor values are supplied in <b>RELATIVE PERCENT</b> to
             * actor's size.
             *
             * @param start {number} initial X axis scale value.
             * @param end {number} final X axis scale value.
             * @param anchorx {float} the percent position for anchorX
             * @param anchory {float} the percent position for anchorY
             *
             * @return this.
             */
            setValues:function (start, end, applyOnX, anchorx, anchory) {
                this.startScale = start;
                this.endScale = end;
                this.applyOnX = !!applyOnX;

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
                var scale;

                time = this.interpolator.getPosition(time).y;
                scale = this.startScale + time * (this.endScale - this.startScale);

                return this.applyOnX ? "scaleX(" + scale + ")" : "scaleY(" + scale + ")";
            },

            /**
             * @inheritDoc
             */
            getKeyFrameDataValues : function(time) {
                time = this.interpolator.getPosition(time).y;
                var obj= {};
                obj[ this.applyOnX ? "scaleX" : "scaleY" ]= this.startScale + time * (this.endScale - this.startScale);

                return obj;
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
