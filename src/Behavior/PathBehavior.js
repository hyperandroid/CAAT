CAAT.Module({
    defines:"CAAT.Behavior.PathBehavior",
    aliases: ["CAAT.PathBehavior"],
    depends:[
        "CAAT.Behavior.BaseBehavior",
        "CAAT.Foundation.SpriteImage"
    ],
    constants : {
        autorotate: {
            LEFT_TO_RIGHT:  0,
            RIGHT_TO_LEFT:  1,
            FREE:           2
        }
    },
    extendsClass : "CAAT.Behavior.BaseBehavior",
    extendsWith:function () {

        return {

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

            path:null, // the path to traverse
            autoRotate:false, // set whether the actor must be rotated tangentially to the path.
            prevX:-1, // private, do not use.
            prevY:-1, // private, do not use.

            autoRotateOp: CAAT.Behavior.PathBehavior.autorotate.FREE,

            getPropertyName:function () {
                return "translate";
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

            calculateKeyFrameData:function (time) {
                time = this.interpolator.getPosition(time).y;
                var point = this.path.getPosition(time);
                return "translateX(" + point.x + "px) translateY(" + point.y + "px)";
            },

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
             * Translates the Actor to the corresponding time path position.
             * If autoRotate=true, the actor is rotated as well. The rotation anchor will (if set) always be ANCHOR_CENTER.
             * @param time an integer indicating the time the behavior is being applied at.
             * @param actor a CAAT.Actor instance to be translated.
             * @return {object} an object of the form <code>{ x: {float}, y: {float}�}</code>.
             */
            setForTime:function (time, actor) {

                if (!this.path) {
                    return {
                        x:actor.x,
                        y:actor.y
                    };
                }

                var point = this.path.getPosition(time);

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
                    var pba = CAAT.Behavior.PathBehavior.autorotate;

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
