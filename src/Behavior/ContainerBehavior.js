CAAT.Module({
    defines:"CAAT.Behavior.ContainerBehavior",
    depends:["CAAT.Behavior.BaseBehavior", "CAAT.Behavior.GenericBehavior"],
    aliases: ["CAAT.ContainerBehavior"],
    extendsClass : "CAAT.Behavior.BaseBehavior",
    extendsWith:function () {

        return {

            behaviors:null, // contained behaviors array

            __init:function () {
                this.__super();
                this.behaviors = [];
                return this;
            },

            /**
             * Proportionally change this container duration to its children.
             * @param duration {number} new duration in ms.
             * @return this;
             */
            conformToDuration:function (duration) {
                this.duration = duration;

                var f = duration / this.duration;
                var bh;
                for (var i = 0; i < this.behaviors.length; i++) {
                    bh = this.behaviors[i];
                    bh.setFrameTime(bh.getStartTime() * f, bh.getDuration() * f);
                }

                return this;
            },

            getBehaviorById : function(id) {
                for( var i=0; i<this.behaviors.length; i++ ) {
                    if ( this.behaviors[i].id===id ) {
                        return this.behaviors[i];
                    }
                }

                return null;
            },

            /**
             * Adds a new behavior to the container.
             * @param behavior
             *
             * @override
             */
            addBehavior:function (behavior) {
                this.behaviors.push(behavior);
                behavior.addListener(this);
                return this;
            },
            /**
             * Applies every contained Behaviors.
             * The application time the contained behaviors will receive will be ContainerBehavior related and not the
             * received time.
             * @param time an integer indicating the time to apply the contained behaviors at.
             * @param actor a CAAT.Foundation.Actor instance indicating the actor to apply the behaviors for.
             */
            apply:function (time, actor) {

                if (!this.solved) {
                    this.behaviorStartTime += time;
                    this.solved = true;
                }

                time += this.timeOffset * this.behaviorDuration;

                if (this.isBehaviorInTime(time, actor)) {
                    time -= this.getStartTime();
                    if (this.cycleBehavior) {
                        time %= this.getDuration();
                    }

                    var bh = this.behaviors;
                    for (var i = 0; i < bh.length; i++) {
                        bh[i].apply(time, actor);
                    }
                }
            },
            /**
             * This method is the observer implementation for every contained behavior.
             * If a container is Cycle=true, won't allow its contained behaviors to be expired.
             * @param behavior a CAAT.Behavior.BaseBehavior instance which has been expired.
             * @param time an integer indicating the time at which has become expired.
             * @param actor a CAAT.Foundation.Actor the expired behavior is being applied to.
             */
            behaviorExpired:function (behavior, time, actor) {
                if (this.cycleBehavior) {
                    behavior.setStatus(CAAT.Behavior.BaseBehavior.Status.STARTED);
                }
            },
            /**
             * Implementation method of the behavior.
             * Just call implementation method for its contained behaviors.
             * @param time{number} an integer indicating the time the behavior is being applied at.
             * @param actor{CAAT.Foundation.Actor} an actor the behavior is being applied to.
             */
            setForTime:function (time, actor) {
                var bh = this.behaviors;
                for (var i = 0; i < bh.length; i++) {
                    bh[i].setForTime(time, actor);
                }

                return null;
            },

            setExpired:function (actor, time) {

                //CAAT.Behavior.ContainerBehavior.superclass.setExpired.call(this, actor, time);

                var bh = this.behaviors;
                // set for final interpolator value.
                for (var i = 0; i < bh.length; i++) {
                    var bb = bh[i];
                    if ( bb.status !== CAAT.Behavior.BaseBehavior.Status.EXPIRED) {
                        bb.setExpired(actor, time - this.behaviorStartTime);
                    }
                }

                /**
                 * moved here from the beggining of the method.
                 * allow for expiration observers to reset container behavior and its sub-behaviors
                 * to redeem.
                 */
                CAAT.Behavior.ContainerBehavior.superclass.setExpired.call(this, actor, time);

                return this;
            },

            setFrameTime:function (start, duration) {
                CAAT.Behavior.ContainerBehavior.superclass.setFrameTime.call(this, start, duration);

                var bh = this.behaviors;
                for (var i = 0; i < bh.length; i++) {
                    bh[i].setStatus(CAAT.Behavior.BaseBehavior.Status.NOT_STARTED);
                }
                return this;
            },

            setDelayTime:function (start, duration) {
                CAAT.Behavior.ContainerBehavior.superclass.setDelayTime.call(this, start, duration);

                var bh = this.behaviors;
                for (var i = 0; i < bh.length; i++) {
                    bh[i].setStatus(CAAT.Behavior.BaseBehavior.Status.NOT_STARTED);
                }
                return this;
            },

            calculateKeyFrameData:function (referenceTime, prefix, prevValues) {

                var i;
                var bh;

                var retValue = {};
                var time;
                var cssRuleValue;
                var cssProperty;
                var property;

                for (i = 0; i < this.behaviors.length; i++) {
                    bh = this.behaviors[i];
                    if (bh.status !== CAAT.Behavior.BehaviorConstants.Status.EXPIRED && !(bh instanceof CAAT.Behavior.GenericBehavior)) {

                        // ajustar tiempos:
                        //  time es tiempo normalizado a duracion de comportamiento contenedor.
                        //      1.- desnormalizar
                        time = referenceTime * this.behaviorDuration;

                        //      2.- calcular tiempo relativo de comportamiento respecto a contenedor
                        if (bh.behaviorStartTime <= time && bh.behaviorStartTime + bh.behaviorDuration >= time) {
                            //      3.- renormalizar tiempo reltivo a comportamiento.
                            time = (time - bh.behaviorStartTime) / bh.behaviorDuration;

                            //      4.- obtener valor de comportamiento para tiempo normalizado relativo a contenedor
                            cssRuleValue = bh.calculateKeyFrameData(time);
                            cssProperty = bh.getPropertyName(prefix);

                            if (typeof retValue[cssProperty] === 'undefined') {
                                retValue[cssProperty] = "";
                            }

                            //      5.- asignar a objeto, par de propiedad/valor css
                            retValue[cssProperty] += cssRuleValue + " ";
                        }

                    }
                }


                var tr = "";
                var pv;

                function xx(pr) {
                    if (retValue[pr]) {
                        tr += retValue[pr];
                    } else {
                        if (prevValues) {
                            pv = prevValues[pr];
                            if (pv) {
                                tr += pv;
                                retValue[pr] = pv;
                            }
                        }
                    }

                }

                xx('translate');
                xx('rotate');
                xx('scale');

                var keyFrameRule = "";

                if (tr) {
                    keyFrameRule = '-' + prefix + '-transform: ' + tr + ';';
                }

                tr = "";
                xx('opacity');
                if (tr) {
                    keyFrameRule += ' opacity: ' + tr + ';';
                }

                return {
                    rules:keyFrameRule,
                    ret:retValue
                };

            },

            /**
             *
             * @param prefix
             * @param name
             * @param keyframessize
             */
            calculateKeyFramesData:function (prefix, name, keyframessize) {

                if (this.duration === Number.MAX_VALUE) {
                    return "";
                }

                if (typeof keyframessize === 'undefined') {
                    keyframessize = 100;
                }

                var i;
                var prevValues = null;
                var kfd = "@-" + prefix + "-keyframes " + name + " {";
                var ret;
                var time;
                var kfr;

                for (i = 0; i <= keyframessize; i++) {
                    time = this.interpolator.getPosition(i / keyframessize).y;
                    ret = this.calculateKeyFrameData(time, prefix, prevValues);
                    kfr = "" +
                        (i / keyframessize * 100) + "%" + // percentage
                        "{" + ret.rules + "}\n";

                    prevValues = ret.ret;
                    kfd += kfr;
                }

                kfd += "}";

                return kfd;
            }

        }
    }
});
