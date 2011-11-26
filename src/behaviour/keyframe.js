/**
 * Created by Ibon Tolosana - @hyperandroid
 * User: ibon
 * Date: 16/11/11
 * Time: 21:35
 */

/**
 This file contains definitions for the keyframing interface.
 It aims to override behavior functionality because their rigid configuration since a behavior instance
 tightly couples the easing function, the application frame time and the property to be applied to.

 keyframes will define each of these elements independently so that they can be reused across different
 applications and actors.
 */

(function() {
    CAAT.kfGenericBehavior= function(start, end, target, property, callback ) {
        this.setValues(start, end, target, property, callback );
        return this;
    };

    CAAT.kfGenericBehavior.prototype= {


        start:      0,
        end:        0,
        target:     null,
        property:   null,
        callback:   null,

        /**
         * Sets the target objects property to the corresponding value for the given time.
         * If a callback function is defined, it is called as well.
         *
         * @param time {number} the scene time to apply the behavior at.
         * @param actor {CAAT.Actor} a CAAT.Actor object instance.
         */
        apply : function(time, actor) {
            var value= this.start+ time*(this.end-this.start);
            if ( this.callback ) {
                this.callback( value, this.target, actor );
            }

            if ( this.property ) {
                this.target[this.property]= value;
            }
        },
        /**
         * Defines the values to apply this behavior.
         *
         * @param start {number} initial behavior value.
         * @param end {number} final behavior value.
         * @param target {object} an object. Usually a CAAT.Actor.
         * @param property {string} target object's property to set value to.
         * @param callback {function} a function of the form <code>function( target, value )</code>.
         */
        setValues : function( start, end, target, property, callback ) {
            this.start= start;
            this.end= end;
            this.target= target;
            this.property= property;
            this.callback= callback;
            return this;
        }
    };


})();

(function() {

    /**
     *
     * @param startAlpha {number}
     * @param endAlpha {number}
     *
     * @constructor
     */
    CAAT.kfAlphaBehavior= function(startAlpha, endAlpha)   {
        this.setValues(startAlpha,endAlpha);
        return this;
    };

    CAAT.kfAlphaBehavior.prototype= {

        startAlpha: 1,
        endAlpha:   1,

        /**
         *
         * @param startAlpha {number} starting angle.
         * @param endAlpha {number} ending angle.
         */
        setValues: function( startAlpha, endAlpha ) {
            if ( typeof startAlpha==='undefined' ) {
                startAlpha= 1;
            }
            if ( typeof endAlpha==='undefined' ) {
                endAlpha= 1;
            }

            this.startAlpha=    startAlpha;
            this.endAlpha=      endAlpha;

            return this;
        },

        /**
         * Get this keyframe rotation value for the given time.
         *
         * @param time {number}
         *
         * @return {number}
         *
         */
        getValueForTime : function( time ) {
            return this.startAlpha + time * (this.endAlpha - this.startAlpha);
        },

        apply: function( time, actor ) {
            var value= this.getValueForTime(time);
            actor.setAlpha( value );
            return value;
        },

        calculateCSS3Keyframe : function( time ) {
            return  this.getValueForTime(time);
        },

        /**
         * @param prefix {string} browser vendor prefix
         * @param name {string} keyframes animation name
         * @param keyframessize {integer} number of keyframes to generate
         * @override
         */
        calculateKeyCSS3Frames : function(name, interpolator, keyframessize) {

            if ( typeof keyframessize==='undefined' ) {
                keyframessize= 100;
            }
            keyframessize>>=0;

            var i;
            var kfr;
            var kfd= "@-"+CAAT.CSS.PREFIX+"-keyframes "+name+" {";

            for( i=0; i<=keyframessize; i++ )    {
                kfr= "" +
                    (i/keyframessize*100) + "%" + // percentage
                    "{" +
                        "opacity: " + this.calculateCSS3Keyframe( interpolator.getPosition( i / keyframessize ).y ) +
                    "}";

                kfd+= kfr;
            }

            kfd+="}";

            return kfd;
        },

        getCSS3PropertyName : function() {
            return "opacity";
        }

    };

})();

(function() {
    CAAT.kfPathBehavior= function( path, modifiers ) {
        if ( typeof path!=='undefined' ) {
            this.path= path;
        }
        if ( typeof modifiers==='undefined' ) {
            modifiers= new CAAT.kfPathBehaviorModifiers();
        }
        this.modifiers= modifiers;

        return this;
    };

    CAAT.kfPathBehaviorModifiers= function() {

        this.autorotate=    false;  // rotate tangentially traversing actor
        this.relative=      false;  // make this path relative to x,y position. that means actor location will
                                    // be set to path.getPosition(time).offset(x,y).
        this.x=             0;      // x,y are used to back up actor position.
        this.y=             0;

        return this;
    };

    CAAT.kfPathBehavior.prototype= {

        path:       null,
        modifiers:  null,

        /**
         *
         * @param path {CAAT.Path}
         * @param modifiers {CAAT.kfPathBehaviorModifiers} modifiers to behavior application.
         *
         */
        setValues : function( path, modifiers ) {

            if ( typeof modifiers==='undefined' ) {
                modifiers= new kfPathBehaviorModifiers();
            }

            modifiers.x>>=0;
            modifiers.y>>=0;

            this.path=      path;
            this.modifiers= modifiers;

            return this;
        },

        /**
         *
         * @param time
         *
         * @return  {  { x: {number}, y: {number} }
         */
        getValueForTime : function( time ) {
            var value= this.path.getPosition(time);
            var mod= this.modifiers;

            if ( mod.relative ) {
                value.x+= mod.x;
                value.y+= mod.y;
            }

            return value;
        },

        /**
         *
         * @param time
         * @param actor
         */
        apply : function( time, actor ) {
            var value= this.getValueForTime( time );
            actor.setLocation( value.x, value.y );
        },

        calculateCSS3Keyframe : function( time ) {
            var point= this.getValueForTime(time);

            return "translateX("+point.x+"px) translateY("+point.y+"px)" ;
        },

        calculateCSS3Keyframes : function( name, interpolator, keyframessize) {

            if ( typeof keyframessize==='undefined' ) {
                keyframessize= 100;
            }
            keyframessize>>=0;

            var i;
            var kfr;
            var time;
            var kfd= "@-"+CAAT.CSS.PREFIX+"-keyframes "+name+" {";

            for( i=0; i<=keyframessize; i++ )    {
                kfr= "" +
                    (i/keyframessize*100) + "%" + // percentage
                    "{" +
                        "-"+CAAT.CSS.PREFIX+"-transform: " + this.calculateCSS3Keyframe(interpolator.getPosition(i/keyframessize).y) +
                    "}";

                kfd+= kfr;
            }

            kfd+="}";

            return kfd;
        },

        getCSS3PropertyName : function() {
            return "translate";
        }

    };

})();

(function() {

    CAAT.kfRotateBehavior= function(startAngle, endAngle, anchorX, anchorY)   {
        this.setValues(startAngle, endAngle, anchorX, anchorY);
        return this;
    };

    CAAT.kfRotateBehavior.prototype= {

        startAngle: 0,
        endAngle:   0,
        anchorX:    .5,
        anchorY:    .5,

        /**
         *
         * @param startAngle {number} starting angle.
         * @param endAngle {number} ending angle.
         * @param anchorX {number} anchor x position.
         * @param anchorY {number} anchor y position.
         */
        setValues: function( startAngle, endAngle, anchorX, anchorY ) {

            if ( typeof startAngle==='undefined' ) {
                startAngle=0;
            }
            if ( typeof endAngle==='undefined' ) {
                endAngle=0;
            }
            if ( typeof anchorX==='undefined' ) {
                anchorX= .5;
            }
            if ( typeof anchorY==='undefined' ) {
                anchorY= .5;
            }

            this.startAngle=    startAngle;
            this.endAngle=      endAngle;
            this.anchorX= anchorX;
            this.anchorY= anchorY;

            return this;
        },

        /**
         * Get this keyframe rotation value for the given time.
         *
         * @param time {number}
         *
         * @return {number}
         *
         */
        getValueForTime : function( time ) {
            return this.startAngle + time*(this.endAngle-this.startAngle);
        },

        apply: function( time, actor ) {
            var value= this.getValueForTime( time );
            actor.setRotationAnchored( value, this.anchorX, this.anchorY );
            return value;
        },

        calculateCSS3Keyframe : function( time ) {
            var value= this.getValueForTime(time);
            return "rotate(" + value +"rad)";
        },

        /**
         * @param prefix {string} browser vendor prefix
         * @param name {string} keyframes animation name
         * @param keyframessize {integer} number of keyframes to generate
         * @override
         */
        calculateCSS3Keyframes : function( name, interpolator, keyframessize) {

            if ( typeof keyframessize==='undefined' ) {
                keyframessize= 100;
            }
            keyframessize>>=0;

            var i;
            var kfr;
            var kfd= "@-"+CAAT.CSS.PREFIX+"-keyframes "+name+" {";

            for( i=0; i<=keyframessize; i++ )    {
                kfr= "" +
                    (i/keyframessize*100) + "%" + // percentage
                    "{" +
                        "-"+CAAT.CSS.PREFIX+"-transform:" + this.calculateCSS3Keyframe(interpolator.getPosition(i/keyframessize).y) +
                    "}\n";

                kfd+= kfr;
            }

            kfd+="}";

            return kfd;
        },

        getCSS3PropertyName : function() {
            return "rotate";
        }

    };

})();

(function() {

    CAAT.kfScaleBehavior= function( startScaleX, endScaleX, startScaleY, endScaleY, anchorX, anchorY )    {
        this.setValues( startScaleX, endScaleX, startScaleY, endScaleY, anchorX, anchorY );
        return this;
    };

    CAAT.kfScaleBehavior.prototype= {

        startScaleX:  1,
        endScaleX:  1,
        startScaleY:  1,
        endScaleY:  1,
        anchorX:    .5,
        anchorY:    .5,

        setValues: function( startScaleX, endScaleX, startScaleY, endScaleY, anchorX, anchorY ) {
            if ( typeof startScaleX==='undefined' ) {
                startScaleX=1;
            }
            if ( typeof startScaleY==='undefined' ) {
                startScaleY=1;
            }
            if ( typeof endScaleX==='undefined' ) {
                endScaleX=1;
            }
            if ( typeof endScaleY==='undefined' ) {
                endScaleY=1;
            }
            if ( typeof anchorX==='undefined' ) {
                anchorX= .5;
            }
            if ( typeof anchorY==='undefined' ) {
                anchorY= .5;
            }

            this.startScaleX=   startScaleX;
            this.endScaleX=     endScaleX;
            this.startScaleY=   startScaleY;
            this.endScaleY=     endScaleY;
            this.anchorX=       anchorX;
            this.anchorY=       anchorY;

            return this;
        },

        /**
         * Get this keyframe rotation value for the given time.
         * @param time {number}
         *
         * @return { { scaleX: {number}, scaleY: {number} }
         */
        getValueForTime : function( time ) {
            var scaleX= this.startScaleX + time*(this.endScaleX-this.startScaleX);
            var scaleY= this.startScaleY + time*(this.endScaleY-this.startScaleY);

            return {
                scaleX: scaleX,
                scaleY: scaleY
            };
        },

        apply: function( time, actor ) {

            var scaleX= this.startScaleX + time*(this.endScaleX-this.startScaleX);
            var scaleY= this.startScaleY + time*(this.endScaleY-this.startScaleY);

            // Firefox 3.x & 4, will crash animation if either scaleX or scaleY equals 0.
            if (0===scaleX ) {
                scaleX=0.01;
            }
            if (0===scaleY ) {
                scaleY=0.01;
            }

            actor.setScaleAnchored( scaleX, scaleY, this.anchorX, this.anchorY );

            return {
                scaleX: scaleX,
                scaleY: scaleY
            };
        },

        calculateCSS3Keyframe : function( time ) {
            var value= this.getValueForTime(time);
            return "scaleX("+value.scaleX+") scaleY("+value.scaleY+")";
        },

        calculateCSS3Keyframes : function( name, interpolator, keyframessize ) {

            if ( typeof keyframessize==='undefined' ) {
                keyframessize= 100;
            }
            keyframessize>>=0;

            var i;
            var kfr;
            var kfd= "@-"+CAAT.CSS.PREFIX+"-keyframes "+name+" {";

            for( i=0; i<=keyframessize; i++ )    {
                kfr= "" +
                    (i/keyframessize*100) + "%" + // percentage
                    "{" +
                        "-"+CAAT.CSS.PREFIX+ "-transform:" + this.calculateCSS3Keyframe(interpolator.getPosition(i/keyframessize).y) +
                    "}\n";

                kfd+= kfr;
            }

            kfd+="}";

            return kfd;
        },

        getCSS3PropertyName : function() {
            return "scale";
        }
    }

})();


(function() {

    var __index= 0;
    
    CAAT.Keyframes= function( id, behavior, interpolator ) {

        this.id= id;

        this.onStart= [];
        this.onApply= [];
        this.onExpire=[];

        if ( typeof behavior!=='undefined' ) {
            this.setBehavior(behavior);
        }
        if ( typeof interpolator!=='undefined' ) {
            this.setInterpolator(interpolator);
        }

        return this;
    };

    CAAT.Keyframes.Status= {
        NOT_STARTED:    0,
        STARTED:        1,
        EXPIRED:        2
    };

    var DefaultInterpolator=
        new CAAT.Interpolator().createLinearInterpolator( false );
    var DefaultPingPongInterpolator=
        new CAAT.Interpolator().createLinearInterpolator( true );

    CAAT.Keyframes.prototype= {

        id:             null,

        behavior:       null,                               // what to apply
        interpolator:   DefaultInterpolator,                // easing function
        status :        CAAT.Keyframes.Status.NOT_STARTED,   // keyframes status.
        cycle:          false,                              // apply forever ?

        startOffset:    0,                                  //

        asCSS:          false,                              // let the hardware manage this keyframe.
        cssKeyframesName:null,

        onStart:        null,                               // keyframe onStart registered callback
        onApply:        null,                               // keyframe onApplication registered callback
        onExpire:       null,                               // keyframe onExpiration registered callback


        /**
         * Value between 0 and 1. 0 means start, 1 means duration.
         * @param offset {number}
         */
        setStartOffset : function( offset ) {
            this.startOffset= offset;
            return this;
        },

        getId : function() {
            return this.id;
        },

        /**
         *
         * @param id {object}
         */
        setId : function( id ) {
            this.id= id;
            return this;
        },

        /**
         *
         * @param behavior {CAAT.kfAlphaBehavior|CAAT.kfRotateBehavior|CAAT.kfScaleBehavior|CAAT.kfPathBehavior}
         */
        setBehavior : function( behavior ) {
            this.behavior= behavior;
            return this;
        },

        getInterpolator : function() {
            return this.interpolator;
        },

        getBehavior : function() {
            return this.behavior;
        },

        /**
         * Sets the default interpolator to a linear ramp.
         *
         * @return this
         */
        setDefaultInterpolator : function() {
            this.interpolator= DefaultInterpolator;
            return this;
        },

        /**
         * Sets default interpolator to be linear from 0..1 and from 1..0.
         *
         * @return this
         */
        setPingPong : function() {
            this.interpolator= DefaultPingPongInterpolator;
            return this;
        },

        /**
         *
         * @param status {CAAT.Keyframe.Status}
         *
         * @return this
         *
         * @private
         */
        setStatus : function( status ) {
            this.status= status;

            return this;
        },

        /**
         * Set this keyframe ready to be used.
         *
         * @return this
         */
		setFrameTime : function( ) {
            this.setStatus( CAAT.Keyframes.Status.NOT_STARTED );
            return this;
		},

        /**
         * Avoid application of this keyframe.
         *
         * @return this
         */
        setOutOfFrameTime : function() {
            this.setStatus( CAAT.Keyframes.Status.EXPIRED );
            return this;
        },

        /**
         * Changes this keyframe's default interpolator to another instance of CAAT.Interpolator.
         *
         * @param interpolator {CAAT.Interpolator} instance.
         *
         * @return this
         */
		setInterpolator : function(interpolator) {
			this.interpolator= interpolator;

            return this;
		},

        /**
         * Apply a keyframe.
         * This method notifies registered observers about keyframe rules application.
         * If CSS3 transitions are enabled trasnformations are being applied by the browser itself. This
         * means that instead applying the behavior, we're getting the just supposed application value. This
         * value is notified to onApply registered observers and it may not be the exact just applied value.
         * Take this into consideration when trying to thoroughly synchronize hardware animations and javascript.
         *
         * @param time {number} the scene time.
         * @param actor {CAAT.Actor} actor instance.
         * @param startTime {number} keyframe application start time
         * @param duration {number} keyframe duration time
         *
         * @private
         */
		apply : function( time, actor, startTime, duration, cycle )	{
            time+= this.startOffset*duration;
            
            var orgTime= time;
			if ( this.isInTime(time,actor,startTime,duration, cycle) )	{

                time= time-startTime;
                if ( cycle )	{
                    time%=duration;
                }
                time=  this.interpolator.getPosition(time/duration).y;

                var value;
                value= this.behavior.apply( time, actor );

                for( var i= this.onApply.length-1; i>=0; i-- ) {
                    this.onApply[i]( this, orgTime, actor, value, time );
                }
			}

            return this;
		},

        /**
         * Get this behavior value for a given normalized time.
         * @param time
         */
        getValueForTime : function(time) {
            time= this.interpolator.getPosition(time).y;
            return this.behavior.getValueForTime( time );
        },

        /**
         *
         * @param f {function( keyframe {CAAT.Keyframe}, time {number}, actor {CAAT.Actor} )}
         */
        addOnStartCallback : function(f) {
            this.onStart.push( f );
            return this;
        },

        /**
         *
         * @param f {function( keyframe {CAAT.Keyframe}, time {number}, actor {CAAT.Actor}, value {object}, normalizedTime {number} )}
         */
        addOnApplyCallback : function(f) {
            this.onApply.push(f);
            return this;
        },

        /**
         *
         * @param f {function( keyframe {CAAT.Keyframe}, time {number}, actor {CAAT.Actor} )}
         */
        addOnExpireCallback : function(f) {
            this.onExpire.push(f);
            return this;
        },

        /**
         * Chekcs whether the keyframe is in scene time.
         * In case it gets out of scene time, and has not been tagged as expired, it is expired and observers
         * are notified about that fact.
         * @param currentTime {number} the scene time.
         * @param actor {CAAT.Actor} the actor to apply to.
         *
         * @return {boolean} whether the keyframe is in scene time.
         *
         * @private
         */
		isInTime : function( currentTime, actor, startTime, duration, cycle ) {

            var S= CAAT.Keyframes.Status;
            var i;

			if ( this.status===S.EXPIRED || startTime<0 )	{
				return false;
			}

			if ( cycle )	{
				if ( currentTime>=startTime )	{
					currentTime= (currentTime-startTime)%duration + startTime;
				}
			}

            // BUGBUG if css3 transitions are enabled, this 'transitionEnd' listener expires the
            // keyframe.
			if ( currentTime>startTime+duration )	{
				if ( this.status!==S.EXPIRED )	{
					this.setExpired(actor,currentTime,startTime,duration);
				}

				return false;
			}

            if ( this.status===S.NOT_STARTED ) {
                this.status=S.STARTED;
                if ( this.onStart ) {
                    for( i=this.onStart.length-1; i>=0; i-- ) {
                        this.onStart[i]( this, actor, currentTime );
                    }
                }
            }

			return startTime<=currentTime && currentTime<startTime+duration;
		},

        /**
         * Sets this keyframe as expired.
         * @param actor {CAAT.Actor}
         * @param time {integer} the scene time.
         *
         * @private
         */
		setExpired : function(actor,time,startTime,duration) {

            var i;

            // set for final interpolator value.
            this.status= CAAT.Keyframes.Status.EXPIRED;
			this.behavior.apply( this.interpolator.getPosition( 1 ).y, actor);

            for( i=this.onExpire.length-1; i>=0; i-- ) {
                this.onExpire[i](this,actor,time);
            }
		},

        calculateCSS3Keyframe : function( time ) {
            return this.behavior.calculateCSS3Keyframe( time );
        },

        calculateCSS3Keyframes : function( name, size ) {
            if ( this.hasCSS3Keyframes() ) {
                return this.behavior.calculateCSS3Keyframes( name, size );
            }
        },

        hasCSS3Keyframes : function() {
            return !(this.behavior instanceof CAAT.kfGenericBehavior);
        },

        /**
         * Clone this keyframe. Listener handlers are not copied.
         */
        clone : function() {
            return new CAAT.Keyframes(
                this.getBehavior(),
                this.getInterpolator() ).
                setName( this.getName() );
        },

        getCSS3PropertyName : function() {
            return this.behavior.getCSS3PropertyName();
        }

    };

})();

(function() {

    CAAT.KeyframesDescriptor = function( keyframe, startTime, duration, cycle ) {

        this.keyframe=  keyframe;
        this.startTime= startTime;
        this.duration=  duration;
        this.cycle=     cycle;
        this.id=        keyframe.getId();

        this.schedule= function( start, duration ) {
            this.startTime= start;
            this.duration= duration;
            return this;
        };

        this.setCycle= function( cycle ) {
            this.cycle= cycle;
        };

        return this;
    };

})();

(function() {

    CAAT.KeyframesContainer = function() {
        CAAT.KeyframesContainer.superclass.constructor.call(this);
        this.keyframes= [];
        return this;
    };

    CAAT.KeyframesContainer.prototype= {

        keyframes :         null,
        referenceDuration:  1,

        setReferenceDuration : function(rd) {
            this.referenceDuration= rd;
        },

        getReferenceDuration : function() {
            return this.referenceDuration;
        },

        /**
         * Clone this keyframeContainer and all its contained keyframes. Listener handlers are not copied.
         */
        clone : function() {

            var kf= new CAAT.KeyframesContainer().
                setFrameTime( ).
                setInterpolator( this.getInterpolator() ).
                setName( this.getName() ).
                setReferenceDuration( this.getReferenceDuration() );

            for( var i=0; i<this.keyframes.length; i++ ) {
                kf.addKeyframes( this.keyframes[i].clone() );
            }

            return kf;
        },

        /**
         * Add a keyframe to this container.
         *
         * @param keyframe {CAAT.KeyframeDescriptor}
         */
		addKeyframes : function( keyframe, startTime, duration, cycle )	{
            var me= this;

			this.keyframes.push( new CAAT.KeyframesDescriptor(
                keyframe,
                startTime,
                duration,
                cycle
            ));

			keyframe.addOnExpireCallback(
                function( keyframe, actor, time ) {
                    keyframe.setStatus( CAAT.Keyframes.Status.STARTED );
                });

            return this;
		},
        /**
         * Applies every contained keyframe.
         * @param time an integer indicating the time to apply the contained behaviors at.
         * @param actor a CAAT.Actor instance indicating the actor to apply the behaviors for.
         */
		apply : function( time, actor, startTime, duration, cycle ) {
			if ( this.isInTime(time,actor, startTime, duration) )	{
				time-= startTime;
				if ( cycle ){
					time%= duration;
				}

                var f= duration/this.referenceDuration;
                var kfs= this.keyframes;
				for( var i=0; i<kfs.length; i++ )	{
                    var kf= kfs[i];
					kf.keyframe.apply(time, actor, kf.startTime*f, kf.duration*f );
				}
			}
		},

        setExpired : function(actor,time,startTime,duration) {
            CAAT.KeyframesContainer.superclass.setExpired.call(this,actor,time);

            var i;
            var kfs= this.keyframes;

            for( var i=0; i<kfs.length; i++ ) {
                var bb= kfs[i];
                if ( bb.keyframe.status!==CAAT.Keyframes.Status.EXPIRED ) {
                    bb.keyframe.setExpired(actor,time-startTime);
                }
            }

            return this;
        },

        setFrameTime : function( )  {
            CAAT.KeyframesContainer.superclass.setFrameTime.call(this);

            var bh= this.keyframes;
            for( var i=0; i<bh.length; i++ ) {
                bh[i].keyframe.setFrameTime();
            }
            return this;
        },

        calculateCSS3Keyframe : function(referenceTime, prevValues)  {

            var S= CAAT.Keyframes.Status;
            var i;
            var keyframesDescriptor;

            var retValue= {};
            var time;
            var cssRuleValue;
            var cssProperty;
            var property;
            var keyframes;

            for( i=0; i<this.keyframes.length; i++ ) {
                keyframesDescriptor= this.keyframes[i];
                if ( keyframesDescriptor.keyframe.hasCSS3Keyframes() && keyframesDescriptor.status!==S.EXPIRED ) {

                    keyframes= keyframesDescriptor.keyframe;

                    // ajustar tiempos:
                    //  time es tiempo normalizado a duración de comportamiento contenedor.
                    //      1.- desnormalizar
                    time= referenceTime * this.referenceDuration;

                    //      2.- calcular tiempo relativo de comportamiento respecto a contenedor
                    if ( keyframesDescriptor.startTime<=time && keyframesDescriptor.startTime+keyframesDescriptor.duration>=time ) {
                        //      3.- renormalizar tiempo reltivo a comportamiento.
                        time= (time-keyframesDescriptor.startTime)/keyframesDescriptor.duration;

                        //      4.- obtener valor de comportamiento para tiempo normalizado relativo a contenedor
                        cssRuleValue= keyframes.calculateCSS3Keyframe(time);
                        cssProperty= keyframes.getCSS3PropertyName();

                        if ( typeof retValue[cssProperty] ==='undefined' ) {
                            retValue[cssProperty]= "";
                        }

                        //      5.- asignar a objeto, par de propiedad/valor css
                        retValue[cssProperty]+= cssRuleValue+" ";
                    }

                }
            }


            var tr="";
            var pv;
            function xx(pr) {
                if ( retValue[pr] ) {
                    tr+= retValue[pr];
                } else {
                    if ( prevValues ) {
                        pv= prevValues[pr];
                        if ( pv ) {
                            tr+= pv;
                            retValue[pr]= pv;
                        }
                    }
                }

            }

            xx('translate');
            xx('rotate');
            xx('scale');

            var keyFrameRule= "";

            if ( tr ) {
                keyFrameRule='-'+CAAT.CSS.PREFIX+'-transform: '+tr+';';
            }

            tr="";
            xx('opacity');
            if( tr ) {
                keyFrameRule+= ' opacity: '+tr+';';
            }

            return {
                rules: keyFrameRule,
                ret: retValue
            };
        },

        calculateCSS3Keyframes : function(name, keyframessize) {

            if ( typeof keyframessize==='undefined' ) {
                keyframessize=100;
            }

            var i;
            var prevValues= null;
            var kfd= "@-"+CAAT.CSS.PREFIX+"-keyframes "+name+" {";
            var ret;
            var time;
            var kfr;

            for( i=0; i<=keyframessize; i++ )    {
                time= this.interpolator.getPosition(i/keyframessize).y;
                ret= this.calculateCSS3Keyframe(time, prevValues);
                kfr= "" +
                    (i/keyframessize*100) + "%" + // percentage
                    "{" + ret.rules + "}\n";

                prevValues= ret.ret;
                kfd+= kfr;
            }

            kfd+= "}";

            return kfd;
        }
    };

    extend( CAAT.KeyframesContainer, CAAT.Keyframes );

})();

(function() {

    CAAT.KeyframesRegistry= {};

    var KFR= CAAT.KeyframesRegistry;
    var registeredKeyframes= {};

    /**
     * Register a keyframe for reuse.
     * A new keyframe is returned which has a reference to the shame behavior and interpolator than the originally
     * registered keyframe.
     *
     * @param name {string}
     * @param keyframes {CAAT.Keyframes}
     */
    CAAT.KeyframesRegistry.register= function( keyframes ) {
        var prev= registeredKeyframes[keyframes.getId()];
        registeredKeyframes[keyframes.getId()]= keyframes;

        return prev;
    };

    CAAT.KeyframesRegistry.getKeyframes= function( id ) {
        return registeredKeyframes[id];
    };

    /**
     * Copies a given keyframe animation.
     * 
     * @param name
     * @param startTime
     * @param duration
     */
    CAAT.KeyframesRegistry.copyKeyframe= function( name, startTime, duration ) {
        var keyframe= registeredKeyframes[name];
        if ( typeof keyframe==='undefined' ) {
            return null;
        }

        var kf= keyframe.clone();
        if ( typeof startTime!=='undefined' && typeof duration!=='undefined' ) {
            kf.setFrameTime( startTime, duration );
        }
        return kf;
    };


})();