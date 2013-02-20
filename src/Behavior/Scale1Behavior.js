CAAT.Module({

    defines:"CAAT.Behavior.Scale1Behavior",
    depends:[
        "CAAT.Behavior.BaseBehavior",
        "CAAT.Foundation.Actor"
    ],
    aliases: ["CAAT.Scale1Behavior"],
    constants : {
        Axis : {
            X:  0,
            Y:  1
        }
    },
    extendsClass:"CAAT.Behavior.BaseBehavior",
    extendsWith:function () {

        return {

            __init:function () {
                this.__super();
                this.anchor = CAAT.Foundation.Actor.ANCHOR_CENTER;
                return this;
            },

            startScale:1,
            endScale:1,
            anchorX:.50,
            anchorY:.50,

            sx:1,
            sy:1,

            applyOnX:true,

            parse : function( obj ) {
                CAAT.Behavior.Scale1Behavior.superclass.parse.call(this,obj);
                this.startScale= obj.start || 0;
                this.endScale= obj.end || 0;
                this.anchorX= parseInt(obj.anchorX || 0.5);
                this.anchorY= parseInt(obj.anchorY || 0.5);
                this.applyOnX= (obj.axis && obj.axis.toLowerCase()==="x") || true;
            },

            /**
             *
             * @param axis {Axis}
             */
            applyOnAxis:function (axis) {
                if (axis === CAAT.Behavior.Scale1Behavior.Axis.X) {
                    this.applyOnX = false;
                } else {
                    this.applyOnX = true;
                }
            },

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

            calculateKeyFrameData:function (time) {
                var scale;

                time = this.interpolator.getPosition(time).y;
                scale = this.startScale + time * (this.endScale - this.startScale);

                return this.applyOnX ? "scaleX(" + scale + ")" : "scaleY(" + scale + ")";
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
