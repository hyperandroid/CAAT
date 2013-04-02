/**
 * See LICENSE file.
 *
 * In this file we'll be adding every useful Actor that is specific for certain purpose.
 *
 * + CAAT.Dock: a docking container that zooms in/out its actors.
 *
 */

CAAT.Module( {

    /**
     * @name UI
     * @memberOf CAAT.Foundation
     * @namespace
     */

    /**
     * @name Dock
     * @memberOf CAAT.Foundation.UI
     * @extends CAAT.Foundation.ActorContainer
     * @constructor
     */

    defines : "CAAT.Foundation.UI.Dock",
    aliases : ["CAAT.Dock"],
    extendsClass : "CAAT.Foundation.ActorContainer",
    depends : [
        "CAAT.Foundation.ActorContainer",
        "CAAT.Behavior.GenericBehavior"
    ],
    constants : {

        /**
         * @lends CAAT.Foundation.UI.Dock
         */

        /**
         * @const
         */
        OP_LAYOUT_BOTTOM:   0,
        /**
         * @const
         */
        OP_LAYOUT_TOP:      1,
        /**
         * @const
         */
        OP_LAYOUT_LEFT:     2,
        /**
         * @const
         */
        OP_LAYOUT_RIGHT:    3
    },
    extendsWith : {

        /**
         * @lends CAAT.Foundation.UI.Dock.prototype
         */

        /**
         * scene the actor is in.
         */
        scene:              null,

        /**
         * resetting dimension timer task.
         */
        ttask:              null,

        /**
         * min contained actor size.
         */
        minSize:            0,

        /**
         * max contained actor size
         */
        maxSize:            0,

        /**
         * aproximated number of elements affected.
         */
        range:              2,

        /**
         * Any value from CAAT.Foundation.Dock.UI.OP_LAYOUT_*
         */
        layoutOp:           0,

        initialize : function(scene) {
            this.scene= scene;
            return this;
        },
        /**
         * Set the number of elements that will be affected (zoomed) when the mouse is inside the component.
         * @param range {number} a number. Defaults to 2.
         */
        setApplicationRange : function( range ) {
            this.range= range;
            return this;
        },
        /**
         * Set layout orientation. Choose from
         * <ul>
         *  <li>CAAT.Dock.OP_LAYOUT_BOTTOM
         *  <li>CAAT.Dock.OP_LAYOUT_TOP
         *  <li>CAAT.Dock.OP_LAYOUT_BOTTOM
         *  <li>CAAT.Dock.OP_LAYOUT_RIGHT
         * </ul>
         * By default, the layou operation is OP_LAYOUT_BOTTOM, that is, elements zoom bottom anchored.
         *
         * @param lo {number} one of CAAT.Dock.OP_LAYOUT_BOTTOM, CAAT.Dock.OP_LAYOUT_TOP,
         * CAAT.Dock.OP_LAYOUT_BOTTOM, CAAT.Dock.OP_LAYOUT_RIGHT.
         *
         * @return this
         */
        setLayoutOp : function( lo ) {
            this.layoutOp= lo;
            return this;
        },
        /**
         *
         * Set maximum and minimum size of docked elements. By default, every contained actor will be
         * of 'min' size, and will be scaled up to 'max' size.
         *
         * @param min {number}
         * @param max {number}
         * @return this
         */
        setSizes : function( min, max ) {
            this.minSize= min;
            this.maxSize= max;

            for( var i=0; i<this.childrenList.length; i++ ) {
                this.childrenList[i].width= min;
                this.childrenList[i].height= min;
            }

            return this;
        },
        /**
         * Lay out the docking elements. The lay out will be a row with the orientation set by calling
         * the method <code>setLayoutOp</code>.
         *
         * @private
         */
        layout : function() {
            var i,actor;

            var c= CAAT.Foundation.UI.Dock;

            if ( this.layoutOp===c.OP_LAYOUT_BOTTOM || this.layoutOp===c.OP_LAYOUT_TOP ) {

                var currentWidth=0, currentX=0;

                for( i=0; i<this.getNumChildren(); i++ ) {
                    currentWidth+= this.getChildAt(i).width;
                }

                currentX= (this.width-currentWidth)/2;

                for( i=0; i<this.getNumChildren(); i++ ) {
                    actor= this.getChildAt(i);
                    actor.x= currentX;
                    currentX+= actor.width;

                    if ( this.layoutOp===c.OP_LAYOUT_BOTTOM ) {
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
                    actor= this.getChildAt(i);
                    actor.y= currentY;
                    currentY+= actor.height;

                    if ( this.layoutOp===c.OP_LAYOUT_LEFT ) {
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
        /**
         * Performs operation when the mouse is not in the dock element.
         *
         * @private
         */
        actorNotPointed : function() {

            var i;
            var me= this;

            for( i=0; i<this.getNumChildren(); i++ ) {
                var actor= this.getChildAt(i);
                actor.emptyBehaviorList();
                actor.addBehavior(
                        new CAAT.Behavior.GenericBehavior().
                            setValues( actor.width, this.minSize, actor, 'width' ).
                            setFrameTime( this.scene.time, 250 ) ).
                    addBehavior(
                        new CAAT.Behavior.GenericBehavior().
                            setValues( actor.height, this.minSize, actor, 'height' ).
                            setFrameTime( this.scene.time, 250 ) );

                if ( i===this.getNumChildren()-1 ) {
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
        /**
         *
         * Perform the process of pointing a docking actor.
         *
         * @param x {number}
         * @param y {number}
         * @param pointedActor {CAAT.Actor}
         *
         * @private
         */
        actorPointed : function(x, y, pointedActor) {

            var index= this.findChild(pointedActor);
            var c= CAAT.Foundation.UI.Dock;

            var across= 0;
            if ( this.layoutOp===c.OP_LAYOUT_BOTTOM || this.layoutOp===c.OP_LAYOUT_TOP ) {
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
                } else if (i === index) {
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
        /**
         * Perform the process of exiting the docking element, that is, animate elements to the minimum
         * size.
         *
         * @param mouseEvent {CAAT.MouseEvent} a CAAT.MouseEvent object.
         *
         * @private
         */
        actorMouseExit : function(mouseEvent) {
            if ( null!==this.ttask ) {
                this.ttask.cancel();
            }

            var me= this;
            this.ttask= this.scene.createTimer(
                    this.scene.time,
                    100,
                    function timeout(sceneTime, time, timerTask) {
                        me.actorNotPointed();
                    },
                    null,
                    null);
        },
        /**
         * Perform the beginning of docking elements.
         * @param mouseEvent {CAAT.MouseEvent} a CAAT.MouseEvent object.
         *
         * @private
         */
        actorMouseEnter : function(mouseEvent) {
            if ( null!==this.ttask ) {
                this.ttask.cancel();
                this.ttask= null;
            }
        },
        /**
         * Adds an actor to Dock.
         * <p>
         * Be aware that actor mouse functions must be set prior to calling this method. The Dock actor
         * needs set his own actor input events functions for mouseEnter, mouseExit and mouseMove and
         * will then chain to the original methods set by the developer.
         *
         * @param actor {CAAT.Actor} a CAAT.Actor instance.
         *
         * @return this
         */
        addChild : function(actor) {
            var me= this;

            actor.__Dock_mouseEnter= actor.mouseEnter;
            actor.__Dock_mouseExit=  actor.mouseExit;
            actor.__Dock_mouseMove=  actor.mouseMove;

            /**
             * @ignore
             * @param mouseEvent
             */
            actor.mouseEnter= function(mouseEvent) {
                me.actorMouseEnter(mouseEvent);
                this.__Dock_mouseEnter(mouseEvent);
            };
            /**
             * @ignore
             * @param mouseEvent
             */
            actor.mouseExit= function(mouseEvent) {
                me.actorMouseExit(mouseEvent);
                this.__Dock_mouseExit(mouseEvent);
            };
            /**
             * @ignore
             * @param mouseEvent
             */
            actor.mouseMove= function(mouseEvent) {
                me.actorPointed( mouseEvent.point.x, mouseEvent.point.y, mouseEvent.source );
                this.__Dock_mouseMove(mouseEvent);
            };

            actor.width= this.minSize;
            actor.height= this.minSize;

            return CAAT.Foundation.UI.Dock.superclass.addChild.call(this,actor);
        }
    }

});
