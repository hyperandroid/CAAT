CAAT.Module({

    /**
     * @name PathBehavior
     * @memberOf CAAT.Behavior
     * @extends CAAT.Behavior.BaseBehavior
     * @constructor
     */

    /**
     *
     * Internal PathBehavior rotation constants.
     *
     * @name AUTOROTATE
     * @memberOf CAAT.Behavior.PathBehavior
     * @namespace
     * @enum {number}
     */

    /**
     *
     * Internal PathBehavior rotation constants.
     *
     * @name autorotate
     * @memberOf CAAT.Behavior.PathBehavior
     * @namespace
     * @enum {number}
     * @deprecated
     */

    defines:"CAAT.Behavior.PathBehavior",
    aliases: ["CAAT.PathBehavior"],
    depends:[
        "CAAT.Behavior.BaseBehavior",
        "CAAT.Foundation.SpriteImage"
    ],
    constants : {

        AUTOROTATE : {

            /**
             * @lends CAAT.Behavior.PathBehavior.AUTOROTATE
             */

            /** @const */ LEFT_TO_RIGHT:  0,
            /** @const */ RIGHT_TO_LEFT:  1,
            /** @const */ FREE:           2
        },

        autorotate: {
            /**
             * @lends CAAT.Behavior.PathBehavior.autorotate
             */

            /** @const */ LEFT_TO_RIGHT:  0,
            /** @const */ RIGHT_TO_LEFT:  1,
            /** @const */ FREE:           2
        }
    },
    extendsClass : "CAAT.Behavior.BaseBehavior",
    extendsWith:function () {

        return {

            /**
             * @lends CAAT.Behavior.PathBehavior.prototype
             * @param obj
             */

            /**
             * @inheritDoc
             */
            parse : function( obj ) {
                CAAT.Behavior.PathBehavior.superclass.parse.call(this,obj);

                if ( obj.SVG ) {
                    var parser= new CAAT.PathUtil.SVGPath();
                    var path=parser.parsePath( obj.SVG );
                    this.setValues(path);
                }

                if ( obj.autoRotate ) {
                    this.autoRotate= obj.autoRotate;
                }
            },

            /**
             * A path to traverse.
             * @type {CAAT.PathUtil.Path}
             * @private
             */
            path:null,

            /**
             * Whether to set rotation angle while traversing the path.
             * @private
             */
            autoRotate:false,

            prevX:-1, // private, do not use.
            prevY:-1, // private, do not use.

            /**
             * Autorotation hint.
             * @type {CAAT.Behavior.PathBehavior.autorotate}
             * @private
             */
            autoRotateOp: CAAT.Behavior.PathBehavior.autorotate.FREE,

            isOpenContour : false,

            relativeX : 0,
            relativeY : 0,

            setOpenContour : function(b) {
                this.isOpenContour= b;
                return this;
            },

            /**
             * @inheritDoc
             */
            getPropertyName:function () {
                return "translate";
            },

            setRelativeValues : function( x, y ) {
                this.relativeX= x;
                this.relativeY= y;
                this.isRelative= true;
                return this;
            },


            /**
             * Sets an actor rotation to be heading from past to current path's point.
             * Take into account that this will be incompatible with rotation Behaviors
             * since they will set their own rotation configuration.
             * @param autorotate {boolean}
             * @param autorotateOp {CAAT.PathBehavior.autorotate} whether the sprite is drawn heading to the right.
             * @return this.
             */
            setAutoRotate:function (autorotate, autorotateOp) {
                this.autoRotate = autorotate;
                if (autorotateOp !== undefined) {
                    this.autoRotateOp = autorotateOp;
                }
                return this;
            },

            /**
             * Set the behavior path.
             * The path can be any length, and will take behaviorDuration time to be traversed.
             * @param {CAAT.Path}
                *
             * @deprecated
             */
            setPath:function (path) {
                this.path = path;
                return this;
            },

            /**
             * Set the behavior path.
             * The path can be any length, and will take behaviorDuration time to be traversed.
             * @param {CAAT.Path}
                * @return this
             */
            setValues:function (path) {
                return this.setPath(path);
            },

            /**
             * @see Actor.setPositionAnchor
             * @deprecated
             * @param tx a float with xoffset.
             * @param ty a float with yoffset.
             */
            setTranslation:function (tx, ty) {
                return this;
            },

            /**
             * @inheritDoc
             */
            calculateKeyFrameData:function (time) {
                time = this.interpolator.getPosition(time).y;
                var point = this.path.getPosition(time);
                return "translateX(" + point.x + "px) translateY(" + point.y + "px)";
            },

            /**
             * @inheritDoc
             */
            getKeyFrameDataValues : function(time) {
                time = this.interpolator.getPosition(time).y;
                var point = this.path.getPosition(time);
                var obj= {
                    x : point.x,
                    y : point.y
                };

                if ( this.autoRotate ) {

                    var point2= time===0 ? point : this.path.getPosition(time -.001);
                    var ax = point.x - point2.x;
                    var ay = point.y - point2.y;
                    var angle = Math.atan2(ay, ax);

                    obj.angle= angle;
                }

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
                var time;
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
            },

            /**
             * @inheritDoc
             */
            setForTime:function (time, actor) {

                if (!this.path) {
                    return {
                        x:actor.x,
                        y:actor.y
                    };
                }

                var point = this.path.getPosition(time, this.isOpenContour,.001);
                if (this.isRelative ) {
                    point.x+= this.relativeX;
                    point.y+= this.relativeY;
                }

                if (this.autoRotate) {

                    if (-1 === this.prevX && -1 === this.prevY) {
                        this.prevX = point.x;
                        this.prevY = point.y;
                    }

                    var ax = point.x - this.prevX;
                    var ay = point.y - this.prevY;

                    if (ax === 0 && ay === 0) {
                        actor.setLocation(point.x, point.y);
                        return { x:actor.x, y:actor.y };
                    }

                    var angle = Math.atan2(ay, ax);
                    var si = CAAT.Foundation.SpriteImage;
                    var pba = CAAT.Behavior.PathBehavior.AUTOROTATE;

                    // actor is heading left to right
                    if (this.autoRotateOp === pba.LEFT_TO_RIGHT) {
                        if (this.prevX <= point.x) {
                            actor.setImageTransformation(si.TR_NONE);
                        }
                        else {
                            actor.setImageTransformation(si.TR_FLIP_HORIZONTAL);
                            angle += Math.PI;
                        }
                    } else if (this.autoRotateOp === pba.RIGHT_TO_LEFT) {
                        if (this.prevX <= point.x) {
                            actor.setImageTransformation(si.TR_FLIP_HORIZONTAL);
                        }
                        else {
                            actor.setImageTransformation(si.TR_NONE);
                            angle -= Math.PI;
                        }
                    }

                    actor.setRotation(angle);

                    this.prevX = point.x;
                    this.prevY = point.y;

                    var modulo = Math.sqrt(ax * ax + ay * ay);
                    ax /= modulo;
                    ay /= modulo;
                }

                if (this.doValueApplication) {
                    actor.setLocation(point.x, point.y);
                    return { x:actor.x, y:actor.y };
                } else {
                    return {
                        x:point.x,
                        y:point.y
                    };
                }


            },

            /**
             * Get a point on the path.
             * If the time to get the point at is in behaviors frame time, a point on the path will be returned, otherwise
             * a default {x:-1, y:-1} point will be returned.
             *
             * @param time {number} the time at which the point will be taken from the path.
             * @return {object} an object of the form {x:float y:float}
             */
            positionOnTime:function (time) {
                if (this.isBehaviorInTime(time, null)) {
                    time = this.normalizeTime(time);
                    return this.path.getPosition(time);
                }

                return {x:-1, y:-1};

            }
        };
    }
});
