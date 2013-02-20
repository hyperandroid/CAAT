CAAT.Module({
    defines:"CAAT.Behavior.RotateBehavior",
    extendsClass: "CAAT.Behavior.BaseBehavior",
    depends:[
        "CAAT.Behavior.BaseBehavior",
        "CAAT.Foundation.Actor"
    ],
    aliases: ["CAAT.RotateBehavior"],
    extendsWith:function () {

        return {

            __init:function () {
                this.__super();
                this.anchor = CAAT.Foundation.Actor.ANCHOR_CENTER;
                return this;
            },

            parse : function( obj ) {
                CAAT.Behavior.RotateBehavior.superclass.parse.call(this,obj);
                this.startAngle= obj.start || 0;
                this.endAngle= obj.end || 0;
                this.anchorX= parseInt(obj.anchorX || 0.5);
                this.anchorY= parseInt(obj.anchorY || 0.5);
            },

            startAngle:0, // behavior start angle
            endAngle:0, // behavior end angle
            anchorX:.50, // rotation center x.
            anchorY:.50, // rotation center y.

            getPropertyName:function () {
                return "rotate";
            },

            /**
             * Behavior application function.
             * Do not call directly.
             * @param time an integer indicating the application time.
             * @param actor a CAAT.Actor the behavior will be applied to.
             * @return the set angle.
             */
            setForTime:function (time, actor) {
                var angle = this.startAngle + time * (this.endAngle - this.startAngle);

                if (this.doValueApplication) {
                    actor.setRotationAnchored(angle, this.anchorX, this.anchorY);
                }

                return angle;

            },
            /**
             * Set behavior bound values.
             * if no anchorx,anchory values are supplied, the behavior will assume
             * 50% for both values, that is, the actor's center.
             *
             * Be aware the anchor values are supplied in <b>RELATIVE PERCENT</b> to
             * actor's size.
             *
             * @param startAngle {float} indicating the starting angle.
             * @param endAngle {float} indicating the ending angle.
             * @param anchorx {float} the percent position for anchorX
             * @param anchory {float} the percent position for anchorY
             */
            setValues:function (startAngle, endAngle, anchorx, anchory) {
                this.startAngle = startAngle;
                this.endAngle = endAngle;
                if (typeof anchorx !== 'undefined' && typeof anchory !== 'undefined') {
                    this.anchorX = anchorx;
                    this.anchorY = anchory;
                }
                return this;
            },
            /**
             * @deprecated
             * Use setValues instead
             * @param start
             * @param end
             */
            setAngles:function (start, end) {
                return this.setValues(start, end);
            },
            /**
             * Set the behavior rotation anchor. Use this method when setting an exact percent
             * by calling setValues is complicated.
             * @see CAAT.Actor
             * @param anchor any of CAAT.Actor.prototype.ANCHOR_* constants.
             *
             * These parameters are to set a custom rotation anchor point. if <code>anchor==CAAT.Actor.ANCHOR_CUSTOM
             * </code> the custom rotation point is set.
             * @param rx
             * @param ry
             *
             */
            setAnchor:function (actor, rx, ry) {
                this.anchorX = rx / actor.width;
                this.anchorY = ry / actor.height;
                return this;
            },


            calculateKeyFrameData:function (time) {
                time = this.interpolator.getPosition(time).y;
                return "rotate(" + (this.startAngle + time * (this.endAngle - this.startAngle)) + "rad)";
            },

            /**
             * @param prefix {string} browser vendor prefix
             * @param name {string} keyframes animation name
             * @param keyframessize {integer} number of keyframes to generate
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
                        "-" + prefix + "-transform:" + this.calculateKeyFrameData(i / keyframessize) +
                        "}\n";

                    kfd += kfr;
                }

                kfd += "}";

                return kfd;
            }

        };

    }
});
