/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * In this file we'll be adding every useful Actor that is specific for certain purpose.
 *
 * + CAAT.Dock: a docking container that zooms in/out its actors.
 *
 */
(function() {
    CAAT.Dock = function() {
        CAAT.Dock.superclass.constructor.call(this);
        return this;
    };

    extend( CAAT.Dock, CAAT.ActorContainer, {

        scene:              null,   // scene the actor is in.
        ttask:              null,   // resetting dimension timer.
        minSize:            0,      // min contained actor size
        maxSize:            0,      // max contained actor size
        range:              2,      // aproximated number of elements affected.
        layoutOp:           0,
        OP_LAYOUT_BOTTOM:   0,
        OP_LAYOUT_TOP:      1,
        OP_LAYOUT_LEFT:     2,
        OP_LAYOUT_RIGHT:    3,

        setApplicationRange : function( range ) {
            this.range= range;
            return this;
        },
        setLayoutOp : function( lo ) {
            this.layoutOp= lo;
            return this;
        },
        setSizes : function( min, max ) {
            this.minSize= min;
            this.maxSize= max;
            return this;
        },
        layout : function() {
            var i;

            if ( this.layoutOp==this.OP_LAYOUT_BOTTOM || this.layoutOp==this.OP_LAYOUT_TOP ) {

                var currentWidth=0, currentX=0;

                for( i=0; i<this.getNumChildren(); i++ ) {
                    currentWidth+= this.getChildAt(i).width;
                }

                currentX= (this.width-currentWidth)/2;

                for( i=0; i<this.getNumChildren(); i++ ) {
                    var actor= this.getChildAt(i);
                    actor.x= currentX;
                    currentX+= actor.width;

                    if ( this.layoutOp==this.OP_LAYOUT_BOTTOM ) {
                        actor.y= this.maxSize- actor.height;
                    } else {
                        actor.y= 0;
                    }
                }
            } else {

                var currentHeight=0, currentY=0;

                for( i=0; i<this.getNumChildren(); i++ ) {
                    currentHeight+= this.getChildAt(i).height;
                }

                currentY= (this.height-currentHeight)/2;

                for( i=0; i<this.getNumChildren(); i++ ) {
                    var actor= this.getChildAt(i);
                    actor.y= currentY;
                    currentY+= actor.height;

                    if ( this.layoutOp==this.OP_LAYOUT_LEFT ) {
                        actor.x= 0;
                    } else {
                        actor.x= this.width - actor.width;
                    }
                }

            }

        },
        mouseMove : function(mouseEvent) {
            this.actorNotPointed();
        },
        mouseExit : function(mouseEvent) {
            this.actorNotPointed();
        },
        actorNotPointed : function() {

            var i;
            var me= this;

            for( i=0; i<this.getNumChildren(); i++ ) {
                var actor= this.getChildAt(i);
                actor.emptyBehaviorList();
                actor.addBehavior(
                        new CAAT.GenericBehavior().
                            setValues( actor.width, this.minSize, actor, 'width' ).
                            setFrameTime( this.scene.time, 250 ) ).
                    addBehavior(
                        new CAAT.GenericBehavior().
                            setValues( actor.height, this.minSize, actor, 'height' ).
                            setFrameTime( this.scene.time, 250 ) );

                if ( i==this.getNumChildren()-1 ) {
                    actor.behaviorList[0].addListener(
                    {
                        behaviorApplied : function(behavior,time,normalizedTime,targetActor,value) {
                            targetActor.parent.layout();
                        },
                        behaviorExpired : function(behavior,time,targetActor) {
                            for( i=0; i<me.getNumChildren(); i++ ) {
                                actor= me.getChildAt(i);
                                actor.width  = me.minSize;
                                actor.height = me.minSize;
                            }
                            targetActor.parent.layout();
                        }
                    });
                }
            }
        },
        actorPointed : function(x, y, pointedActor) {

            var index= this.findChild(pointedActor);

            var across= 0;
            if ( this.layoutOp==this.OP_LAYOUT_BOTTOM || this.layoutOp==this.OP_LAYOUT_TOP ) {
                across= x / pointedActor.width;
            } else {
                across= y / pointedActor.height;
            }
            var i;

            for( i=0; i<this.childrenList.length; i++ ) {
                var actor= this.childrenList[i];
                actor.emptyBehaviorList();

                var wwidth=0;
                if (i < index - this.range || i > index + this.range) {
                    wwidth = this.minSize;
                } else if (i == index) {
                    wwidth = this.maxSize;
                } else if (i < index) {
                    wwidth=
                        this.minSize +
                        (this.maxSize-this.minSize) *
                        (Math.cos((i - index - across + 1) / this.range * Math.PI) + 1) /
                        2;
                } else {
                    wwidth=
                        this.minSize +
                        (this.maxSize-this.minSize)*
                        (Math.cos( (i - index - across) / this.range * Math.PI) + 1) /
                        2;
                }

                actor.height= wwidth;
                actor.width= wwidth;
            }

            this.layout();
        },
        actorMouseExit : function(mouseEvent) {
            if ( null!=this.ttask ) {
                this.ttask.cancel();
            }

            this.ttask= this.scene.createTimer(
                    this.scene.time,
                    100,
                    function timeout(sceneTime, time, timerTask) {
                        mouseEvent.source.parent.actorNotPointed();
                    },
                    null,
                    null);
        },
        actorMouseEnter : function(mouseEvent) {
            if ( null!=this.ttask ) {
                this.ttask.cancel();
                this.ttask= null;
            }
        }
    });

})();
