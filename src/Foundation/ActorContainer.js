CAAT.Module({

    /**
     * @name ActorContainer
     * @memberOf CAAT.Foundation
     * @extends CAAT.Foundation.Actor
     * @constructor
     */

    /**
     * @name ADDHINT
     * @memberOf CAAT.Foundation.ActorContainer
     * @namespace
     */

    /**
     * @name AddHint
     * @memberOf CAAT.Foundation.ActorContainer
     * @namespace
     * @deprecated
     */

    defines:"CAAT.Foundation.ActorContainer",
    aliases:["CAAT.ActorContainer"],
    depends:[
        "CAAT.Foundation.Actor",
        "CAAT.Math.Point",
        "CAAT.Math.Rectangle"
    ],
    constants :  {

        /**
         * @lends CAAT.Foundation.ActorContainer
         * */

        ADDHINT:{

            /**
             * @lends CAAT.Foundation.ActorContainer.ADDHINT
             */

            /** @const */ CONFORM:1
        },

        AddHint : {

            /**
             * @lends CAAT.Foundation.ActorContainer.AddHint
             */
            /** @const */ CONFORM:1
        }
    },
    extendsClass : "CAAT.Foundation.Actor",
    extendsWith : function () {



        var __CD =                      CAAT.Foundation.Actor.CACHE_DEEP;

        var sc=                         CAAT.Foundation.ActorContainer.superclass;
        var sc_drawScreenBoundingBox=   sc.drawScreenBoundingBox;
        var sc_paintActor=              sc.paintActor;
        var sc_paintActorGL=            sc.paintActorGL;
        var sc_animate=                 sc.animate;
        var sc_findActorAtPosition =    sc.findActorAtPosition;
        var sc_destroy =                sc.destroy;

        return {

            /**
             *
             * @lends CAAT.Foundation.ActorContainer.prototype
             */

            /**
             * Constructor delegate
             * @param hint {CAAT.Foundation.ActorContainer.AddHint}
             * @return {*}
             * @private
             */
            __init:function (hint) {

                this.__super();

                this.childrenList = [];
                this.activeChildren = [];
                this.pendingChildrenList = [];
                if (typeof hint !== 'undefined') {
                    this.addHint = hint;
                    this.boundingBox = new CAAT.Math.Rectangle();
                }
                return this;
            },

            /**
             * This container children.
             * @type {Array.<CAAT.Foundation.Actor>}
             */
            childrenList:null,

            /**
             * This container active children.
             * @type {Array.<CAAT.Foundation.Actor>}
             * @private
             */
            activeChildren:null,

            /**
             * This container pending to be added children.
             * @type {Array.<CAAT.Foundation.Actor>}
             * @private
             */
            pendingChildrenList:null,

            /**
             * Container redimension policy when adding children:
             *  0 : no resize.
             *  CAAT.Foundation.ActorContainer.AddHint.CONFORM : resize container to a bounding box.
             *
             * @type {number}
             * @private
             */
            addHint:0,

            /**
             * If container redimension on children add, use this rectangle as bounding box store.
             * @type {CAAT.Math.Rectangle}
             * @private
             */
            boundingBox:null,

            /**
             * Spare rectangle to avoid new allocations when adding children to this container.
             * @type {CAAT.Math.Rectangle}
             * @private
             */
            runion:new CAAT.Math.Rectangle(), // Watch out. one for every container.

            /**
             * Define a layout manager for this container that enforces children position and/or sizes.
             * @see demo26 for an example of layouts.
             * @type {CAAT.Foundation.UI.Layout.LayoutManager}
             */
            layoutManager:null, // a layout manager instance.

            /**
             * @type {boolean}
             */
            layoutInvalidated:true,

            setLayout:function (layout) {
                this.layoutManager = layout;
                return this;
            },

            setBounds:function (x, y, w, h) {
                CAAT.Foundation.ActorContainer.superclass.setBounds.call(this, x, y, w, h);
                if (CAAT.currentDirector && !CAAT.currentDirector.inValidation) {
                    this.invalidateLayout();
                }
                return this;
            },

            __validateLayout:function () {

                this.__validateTree();
                this.layoutInvalidated = false;
            },

            __validateTree:function () {
                if (this.layoutManager && this.layoutManager.isInvalidated()) {

                    CAAT.currentDirector.inValidation = true;

                    this.layoutManager.doLayout(this);

                    for (var i = 0; i < this.getNumChildren(); i += 1) {
                        this.getChildAt(i).__validateLayout();
                    }
                }
            },

            invalidateLayout:function () {
                this.layoutInvalidated = true;

                if (this.layoutManager) {
                    this.layoutManager.invalidateLayout(this);

                    for (var i = 0; i < this.getNumChildren(); i += 1) {
                        this.getChildAt(i).invalidateLayout();
                    }
                }
            },

            getLayout:function () {
                return this.layoutManager;
            },

            /**
             * Draws this ActorContainer and all of its children screen bounding box.
             *
             * @param director the CAAT.Foundation.Director object instance that contains the Scene the Actor is in.
             * @param time an integer indicating the Scene time when the bounding box is to be drawn.
             */
            drawScreenBoundingBox:function (director, time) {

                if (!this.inFrame) {
                    return;
                }

                var cl = this.activeChildren;
                for (var i = 0; i < cl.length; i++) {
                    cl[i].drawScreenBoundingBox(director, time);
                }
                sc_drawScreenBoundingBox.call(this, director, time);
            },
            /**
             * Removes all children from this ActorContainer.
             *
             * @return this
             */
            emptyChildren:function () {
                this.childrenList = [];

                return this;
            },
            /**
             * Private
             * Paints this container and every contained children.
             *
             * @param director the CAAT.Foundation.Director object instance that contains the Scene the Actor is in.
             * @param time an integer indicating the Scene time when the bounding box is to be drawn.
             */
            paintActor:function (director, time) {

                if (!this.visible) {
                    return false;
                }

                var ctx = director.ctx;

                ctx.save();

                if (!sc_paintActor.call(this, director, time)) {
                    return false;
                }

                if (this.cached === __CD) {
                    return false;
                }

                if (!this.isGlobalAlpha) {
                    this.frameAlpha = this.parent ? this.parent.frameAlpha : 1;
                }

                for (var i = 0, l = this.activeChildren.length; i < l; ++i) {
                    var actor = this.activeChildren[i];

                    if (actor.visible) {
                        ctx.save();
                        actor.paintActor(director, time);
                        ctx.restore();
                    }
                }

                if (this.postPaint) {
                    this.postPaint( director, time );
                }

                ctx.restore();

                return true;
            },
            __paintActor:function (director, time) {
                if (!this.visible) {
                    return true;
                }

                var ctx = director.ctx;

                this.frameAlpha = this.parent ? this.parent.frameAlpha * this.alpha : 1;
                var m = this.worldModelViewMatrix.matrix;
                ctx.setTransform(m[0], m[3], m[1], m[4], m[2], m[5], this.frameAlpha);
                this.paint(director, time);

                if (!this.isGlobalAlpha) {
                    this.frameAlpha = this.parent ? this.parent.frameAlpha : 1;
                }

                for (var i = 0, l = this.activeChildren.length; i < l; ++i) {
                    var actor = this.activeChildren[i];
                    actor.paintActor(director, time);
                }
                return true;
            },
            paintActorGL:function (director, time) {

                var i, l, c;

                if (!this.visible) {
                    return true;
                }

                sc_paintActorGL.call(this, director, time);

                if (!this.isGlobalAlpha) {
                    this.frameAlpha = this.parent.frameAlpha;
                }

                for (i = 0, l = this.activeChildren.length; i < l; ++i) {
                    c = this.activeChildren[i];
                    c.paintActorGL(director, time);
                }

            },
            /**
             * Private.
             * Performs the animate method for this ActorContainer and every contained Actor.
             *
             * @param director the CAAT.Foundation.Director object instance that contains the Scene the Actor is in.
             * @param time an integer indicating the Scene time when the bounding box is to be drawn.
             *
             * @return {boolean} is this actor in active children list ??
             */
            animate:function (director, time) {

                if (!this.visible) {
                    return false;
                }

                this.activeChildren = [];
                var last = null;

                if (false === sc_animate.call(this, director, time)) {
                    return false;
                }

                if (this.cached === __CD) {
                    return true;
                }

                this.__validateLayout();
                CAAT.currentDirector.inValidation = false;

                var i, l;

                /**
                 * Incluir los actores pendientes.
                 * El momento es ahora, antes de procesar ninguno del contenedor.
                 */
                var pcl = this.pendingChildrenList;
                for (i = 0; i < pcl.length; i++) {
                    var child = pcl[i];
                    this.addChildImmediately(child.child, child.constraint);
                }

                this.pendingChildrenList = [];
                var markDelete = [];

                var cl = this.childrenList;
                this.size_active = 1;
                this.size_total = 1;
                for (i = 0; i < cl.length; i++) {
                    var actor = cl[i];
                    actor.time = time;
                    this.size_total += actor.size_total;
                    if (actor.animate(director, time)) {
                        this.activeChildren.push(actor);
                        this.size_active += actor.size_active;
                    } else {
                        if (actor.expired && actor.discardable) {
                            markDelete.push(actor);
                        }
                    }
                }

                for (i = 0, l = markDelete.length; i < l; i++) {
                    var md = markDelete[i];
                    md.destroy(time);
                    if (director.dirtyRectsEnabled) {
                        director.addDirtyRect(md.AABB);
                    }
                }

                return true;
            },
            /**
             * Removes Actors from this ActorContainer which are expired and flagged as Discardable.
             *
             * @param director the CAAT.Foundation.Director object instance that contains the Scene the Actor is in.
             * @param time an integer indicating the Scene time when the bounding box is to be drawn.
             *
             * @deprecated
             */
            endAnimate:function (director, time) {
            },
            /**
             * Adds an Actor to this Container.
             * The Actor will be added ON METHOD CALL, despite the rendering pipeline stage being executed at
             * the time of method call.
             *
             * This method is only used by director's transitionScene.
             *
             * @param child {CAAT.Foundation.Actor}
             * @param constraint {object}
             * @return this.
             */
            addChildImmediately:function (child, constraint) {
                return this.addChild(child, constraint);
            },

            addActorImmediately: function(child,constraint) {
                return this.addChildImmediately(child,constraint);
            },

            addActor : function( child, constraint ) {
                return this.addChild(child,constraint);
            },

            /**
             * Adds an Actor to this ActorContainer.
             * The Actor will be added to the container AFTER frame animation, and not on method call time.
             * Except the Director and in orther to avoid visual artifacts, the developer SHOULD NOT call this
             * method directly.
             *
             * If the container has addingHint as CAAT.Foundation.ActorContainer.AddHint.CONFORM, new continer size will be
             * calculated by summing up the union of every client actor bounding box.
             * This method will not take into acount actor's affine transformations, so the bounding box will be
             * AABB.
             *
             * @param child {CAAT.Foundation.Actor} object instance.
             * @param constraint {object}
             * @return this
             */
            addChild:function (child, constraint) {

                if (child.parent != null) {
                    throw('adding to a container an element with parent.');
                }

                child.parent = this;
                this.childrenList.push(child);
                child.dirty = true;

                if (this.layoutManager) {
                    this.layoutManager.addChild(child, constraint);
                    this.invalidateLayout();
                } else {
                    /**
                     * if Conforming size, recalc new bountainer size.
                     */
                    if (this.addHint === CAAT.Foundation.ActorContainer.AddHint.CONFORM) {
                        this.recalcSize();
                    }
                }

                return this;
            },

            /**
             * Recalc this container size by computing the union of every children bounding box.
             */
            recalcSize:function () {
                var bb = this.boundingBox;
                bb.setEmpty();
                var cl = this.childrenList;
                var ac;
                for (var i = 0; i < cl.length; i++) {
                    ac = cl[i];
                    this.runion.setBounds(
                        ac.x < 0 ? 0 : ac.x,
                        ac.y < 0 ? 0 : ac.y,
                        ac.width,
                        ac.height);
                    bb.unionRectangle(this.runion);
                }
                this.setSize(bb.x1, bb.y1);

                return this;
            },

            /**
             * Add a child element and make it active in the next frame.
             * @param child {CAAT.Foundation.Actor}
             */
            addChildDelayed:function (child, constraint) {
                this.pendingChildrenList.push({ child:child, constraint: constraint });
                return this;
            },
            /**
             * Adds an Actor to this ActorContainer.
             *
             * @param child {CAAT.Foundation.Actor}.
             * @param index {number}
             *
             * @return this
             */
            addChildAt:function (child, index) {

                if (index <= 0) {
                    child.parent = this;
                    child.dirty = true;
                    this.childrenList.splice(0, 0, child);
                    this.invalidateLayout();
                    return this;
                } else {
                    if (index >= this.childrenList.length) {
                        index = this.childrenList.length;
                    }
                }

                child.parent = this;
                child.dirty = true;
                this.childrenList.splice(index, 0, child);
                this.invalidateLayout();

                return this;
            },
            /**
             * Find the first actor with the supplied ID.
             * This method is not recommended to be used since executes a linear search.
             * @param id
             */
            findActorById:function (id) {

                if ( CAAT.Foundation.ActorContainer.superclass.findActorById.call(this,id) ) {
                    return this;
                }

                var cl = this.childrenList;
                for (var i = 0, l = cl.length; i < l; i++) {
                    var ret= cl[i].findActorById(id);
                    if (null!=ret) {
                        return ret;
                    }
                }

                return null;
            },
            /**
             * Private
             * Gets a contained Actor z-index on this ActorContainer.
             *
             * @param child a CAAT.Foundation.Actor object instance.
             *
             * @return {number}
             */
            findChild:function (child) {
                var cl = this.childrenList;
                var i;
                var len = cl.length;

                for (i = 0; i < len; i++) {
                    if (cl[i] === child) {
                        return i;
                    }
                }
                return -1;
            },
            /**
             * Removed all Actors from this ActorContainer.
             *
             * @return array of former children
             */
            removeAllChildren: function() {
                var cl = this.childrenList.slice(); // Make a shalow copy
                for (var pos = cl.length-1;pos>=0;pos--) {
                    this.removeChildAt(pos);
                }
                return cl;
            },
            removeChildAt:function (pos) {
                var cl = this.childrenList;
                var rm;
                if (-1 !== pos && pos>=0 && pos<this.childrenList.length) {
                    cl[pos].setParent(null);
                    rm = cl.splice(pos, 1);
                    if (rm[0].isVisible() && CAAT.currentDirector.dirtyRectsEnabled) {
                        CAAT.currentDirector.scheduleDirtyRect(rm[0].AABB);
                    }

                    this.invalidateLayout();
                    return rm[0];
                }

                return null;
            },
            /**
             * Removed an Actor from this ActorContainer.
             * If the Actor is not contained into this Container, nothing happends.
             *
             * @param child a CAAT.Foundation.Actor object instance.
             *
             * @return this
             */
            removeChild:function (child) {
                var pos = this.findChild(child);
                var ret = this.removeChildAt(pos);

                return ret;
            },
            removeFirstChild:function () {
                var first = this.childrenList.shift();
                first.parent = null;
                if (first.isVisible() && CAAT.currentDirector.dirtyRectsEnabled) {
                    CAAT.currentDirector.scheduleDirtyRect(first.AABB);
                }

                this.invalidateLayout();

                return first;
            },
            removeLastChild:function () {
                if (this.childrenList.length) {
                    var last = this.childrenList.pop();
                    last.parent = null;
                    if (last.isVisible() && CAAT.currentDirector.dirtyRectsEnabled) {
                        CAAT.currentDirector.scheduleDirtyRect(last.AABB);
                    }

                    this.invalidateLayout();

                    return last;
                }

                return null;
            },
            /**
             * @private
             *
             * Gets the Actor inside this ActorContainer at a given Screen coordinate.
             *
             * @param point an object of the form { x: float, y: float }
             *
             * @return the Actor contained inside this ActorContainer if found, or the ActorContainer itself.
             */
            findActorAtPosition:function (point) {

                if (null === sc_findActorAtPosition.call(this, point)) {
                    return null;
                }

                // z-order
                var cl = this.childrenList;
                for (var i = cl.length - 1; i >= 0; i--) {
                    var child = this.childrenList[i];

                    var np = new CAAT.Math.Point(point.x, point.y, 0);
                    var contained = child.findActorAtPosition(np);
                    if (null !== contained) {
                        return contained;
                    }
                }

                return this;
            },
            /**
             * Destroys this ActorContainer.
             * The process falls down recursively for each contained Actor into this ActorContainer.
             *
             * @return this
             */
            destroy:function () {
                var cl = this.childrenList;
                for (var i = cl.length - 1; i >= 0; i--) {
                    cl[i].destroy();
                }
                sc_destroy.call(this);

                return this;
            },
            /**
             * Get number of Actors into this container.
             * @return integer indicating the number of children.
             */
            getNumChildren:function () {
                return this.childrenList.length;
            },
            getNumActiveChildren:function () {
                return this.activeChildren.length;
            },
            /**
             * Returns the Actor at the iPosition(th) position.
             * @param iPosition an integer indicating the position array.
             * @return the CAAT.Foundation.Actor object at position.
             */
            getChildAt:function (iPosition) {
                return this.childrenList[ iPosition ];
            },
            /**
             * Changes an actor's ZOrder.
             * @param actor the actor to change ZOrder for
             * @param index an integer indicating the new ZOrder. a value greater than children list size means to be the
             * last ZOrder Actor.
             */
            setZOrder:function (actor, index) {
                var actorPos = this.findChild(actor);
                // the actor is present
                if (-1 !== actorPos) {
                    var cl = this.childrenList;
                    // trivial reject.
                    if (index === actorPos) {
                        return;
                    }

                    if (index >= cl.length) {
                        cl.splice(actorPos, 1);
                        cl.push(actor);
                    } else {
                        var nActor = cl.splice(actorPos, 1);
                        if (index < 0) {
                            index = 0;
                        } else if (index > cl.length) {
                            index = cl.length;
                        }

                        cl.splice(index, 0, nActor[0]);
                    }

                    this.invalidateLayout();
                }
            }
        }

    }
});
