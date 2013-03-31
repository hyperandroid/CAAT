CAAT.Module({

    /**
     * @name RotateBehavior
     * @memberOf CAAT.Behavior
     * @extends CAAT.Behavior.BaseBehavior
     * @constructor
     */

    defines:"CAAT.Behavior.RotateBehavior",
    extendsClass: "CAAT.Behavior.BaseBehavior",
    depends:[
        "CAAT.Behavior.BaseBehavior",
        "CAAT.Foundation.Actor"
    ],
    aliases: ["CAAT.RotateBehavior"],
    extendsWith:function () {

        return {

            /**
             * @lends CAAT.Behavior.RotateBehavior.prototype
             */


            __init:function () {
                this.__super();
                this.anchor = CAAT.Foundation.Actor.ANCHOR_CENTER;
                return this;
            },

            /**
             * @inheritDoc
             */
            parse : function( obj ) {
                CAAT.Behavior.RotateBehavior.superclass.parse.call(this,obj);
                this.startAngle= obj.start || 0;
                this.endAngle= obj.end || 0;
                this.anchorX= (typeof obj.anchorX!=="undefined" ? parseInt(obj.anchorX) : 0.5);
                this.anchorY= (typeof obj.anchorY!=="undefined" ? parseInt(obj.anchorY) : 0.5);
            },

            /**
             * Start rotation angle.
             * @type {number}
             * @private
             */
            startAngle:0,

            /**
             * End rotation angle.
             * @type {number}
             * @private
             */
            endAngle:0,

            /**
             * Rotation X anchor.
             * @type {number}
             * @private
             */
            anchorX:.50,

            /**
             * Rotation Y anchor.
             * @type {number}
             * @private
             */
            anchorY:.50,

            rotationRelative: 0,

            setRelativeValues : function(r) {
                this.rotationRelative= r;
                this.isRelative= true;
                return this;
            },

            /**
             * @inheritDoc
             */
            getPropertyName:function () {
                return "rotate";
            },

            /**
             * @inheritDoc
             */
            setForTime:function (time, actor) {
                var angle = this.startAngle + time * (this.endAngle - this.startAngle);

                if ( this.isRelative ) {
                    angle+= this.rotationRelative;
                    if (angle>=Math.PI) {
                        angle= (angle-2*Math.PI)
                    }
                    if ( angle<-2*Math.PI) {
                        angle= (angle+2*Math.PI);
                    }
                }

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
             *
             * These parameters are to set a custom rotation anchor point. if <code>anchor==CAAT.Actor.ANCHOR_CUSTOM
             * </code> the custom rotation point is set.
             * @param actor
             * @param rx
             * @param ry
             *
             */
            setAnchor:function (actor, rx, ry) {
                this.anchorX = rx / actor.width;
                this.anchorY = ry / actor.height;
                return this;
            },

            /**
             * @inheritDoc
             */
            calculateKeyFrameData:function (time) {
                time = this.interpolator.getPosition(time).y;
                return "rotate(" + (this.startAngle + time * (this.endAngle - this.startAngle)) + "rad)";
            },

            /**
             * @inheritDoc
             */
            getKeyFrameDataValues : function(time) {
                time = this.interpolator.getPosition(time).y;
                return {
                    angle : this.startAngle + time * (this.endAngle - this.startAngle)
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

        };

    }
});
