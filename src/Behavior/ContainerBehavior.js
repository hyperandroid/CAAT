CAAT.Module({
    defines:"CAAT.Behavior.ContainerBehavior",
    depends:["CAAT.Behavior.BaseBehavior", "CAAT.Behavior.GenericBehavior"],
    aliases: ["CAAT.ContainerBehavior"],
    extendsClass : "CAAT.Behavior.BaseBehavior",
    extendsWith:function () {

        return {

            parse : function( obj ) {
                if ( obj.behaviors && obj.behaviors.length ) {
                    for( var i=0; i<obj.behaviors.length; i+=1 ) {
                        this.addBehavior( CAAT.Behavior.BaseBehavior.parse( obj.behaviors[i] ) );
                    }
                }
                CAAT.Behavior.ContainerBehavior.superclass.parse.call(this,obj);
            },

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

            getKeyFrameDataValues : function(referenceTime) {

                var i, bh, time;
                var keyFrameData= {
                    angle : 0,
                    scaleX : 1,
                    scaleY : 1,
                    x : 0,
                    y : 0
                };

                for (i = 0; i < this.behaviors.length; i++) {
                    bh = this.behaviors[i];
                    if (bh.status !== CAAT.Behavior.BaseBehavior.Status.EXPIRED && !(bh instanceof CAAT.Behavior.GenericBehavior)) {

                        // ajustar tiempos:
                        //  time es tiempo normalizado a duracion de comportamiento contenedor.
                        //      1.- desnormalizar
                        time = referenceTime * this.behaviorDuration;

                        //      2.- calcular tiempo relativo de comportamiento respecto a contenedor
                        if (bh.behaviorStartTime <= time && bh.behaviorStartTime + bh.behaviorDuration >= time) {
                            //      3.- renormalizar tiempo reltivo a comportamiento.
                            time = (time - bh.behaviorStartTime) / bh.behaviorDuration;

                            //      4.- obtener valor de comportamiento para tiempo normalizado relativo a contenedor
                            var obj= bh.getKeyFrameDataValues(time);
                            for( var pr in obj ) {
                                keyFrameData[pr]= obj[pr];
                            }
                        }
                    }
                }

                return keyFrameData;
            },

            calculateKeyFrameData:function (referenceTime, prefix) {

                var i;
                var bh;

                var retValue = {};
                var time;
                var cssRuleValue;
                var cssProperty;
                var property;

                for (i = 0; i < this.behaviors.length; i++) {
                    bh = this.behaviors[i];
                    if (bh.status !== CAAT.Behavior.BaseBehavior.Status.EXPIRED && !(bh instanceof CAAT.Behavior.GenericBehavior)) {

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

                keyFrameRule+=" -webkit-transform-origin: 0% 0%";

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
             *//*
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
*/
            calculateKeyFramesData:function (prefix, name, keyframessize, anchorX, anchorY) {

                function toKeyFrame(obj, prevKF) {

                    for( var i in prevKF ) {
                        if ( !obj[i] ) {
                            obj[i]= prevKF[i];
                        }
                    }

                    var ret= "-" + prefix + "-transform:";

                    if ( obj.x || obj.y ) {
                        var x= obj.x || 0;
                        var y= obj.y || 0;
                        ret+= "translate("+x+"px,"+y+"px)";
                    }

                    if ( obj.angle ) {
                        ret+= " rotate("+obj.angle+"rad)";
                    }

                    if ( obj.scaleX!==1 || obj.scaleY!==1 ) {
                        ret+= " scale("+(obj.scaleX)+","+(obj.scaleY)+")";
                    }

                    ret+=";";

                    if ( obj.alpha ) {
                        ret+= " opacity: "+obj.alpha+";";
                    }

                    if ( anchorX!==.5 || anchorY!==.5) {
                        ret+= " -" + prefix + "-transform-origin:"+ (anchorX*100) + "% " + (anchorY*100) + "%;";
                    }

                    return ret;
                }

                if (this.duration === Number.MAX_VALUE) {
                    return "";
                }

                if (typeof anchorX==="undefined") {
                    anchorX= .5;
                }

                if (typeof anchorY==="undefined") {
                    anchorY= .5;
                }

                if (typeof keyframessize === 'undefined') {
                    keyframessize = 100;
                }

                var i;
                var kfd = "@-" + prefix + "-keyframes " + name + " {";
                var time;
                var prevKF= {};

                for (i = 0; i <= keyframessize; i++) {
                    time = this.interpolator.getPosition(i / keyframessize).y;

                    var obj = this.getKeyFrameDataValues(time);

                    kfd += "" +
                        (i / keyframessize * 100) + "%" + // percentage
                        "{" + toKeyFrame(obj, prevKF) + "}\n";

                    prevKF= obj;

                }

                kfd += "}\n";

                return kfd;
            }
        }
    }
});
