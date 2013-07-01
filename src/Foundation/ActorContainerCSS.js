CAAT.Module({
    defines:"CAAT.Foundation.ActorContainer",
    aliases:["CAAT.ActorContainer"],
    depends:[
        "CAAT.Foundation.Actor",
        "CAAT.Math.Rectangle"
    ],
    constants:{
        AddHint:{
            CONFORM:1
        }
    },
    extendsClass:"CAAT.Foundation.Actor",
    extendsWith:function () {

        return {
            __init:function () {
                this.__super();
                this.childrenList = [];
                this.pendingChildrenList = [];
                if (typeof hint !== 'undefined') {
                    this.addHint = hint;
                    this.boundingBox = new CAAT.Math.Rectangle();
                }
                return this;
            },

            childrenList:null, // the list of children contained.
            activeChildren:null,
            pendingChildrenList:null,

            addHint:0,
            boundingBox:null,
            runion:new CAAT.Rectangle(), // Watch out. one for every container.

            layoutManager:null, // a layout manager instance.
            layoutInvalidated:true,


            setLayout:function (layout) {
                this.layoutManager = layout;
                return this;
            },

            setBounds:function (x, y, w, h) {
                CAAT.ActorContainer.superclass.setBounds.call(this, x, y, w, h);
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
             * Removes all children from this ActorContainer.
             *
             * @return this
             */
            emptyChildren:function () {
                this.domElement.innerHTML = '';
                this.childrenList = [];

                return this;
            },
            /**
             * Private
             * Paints this container and every contained children.
             *
             * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
             * @param time an integer indicating the Scene time when the bounding box is to be drawn.
             */
            paintActor:function (director, time) {
                CAAT.ActorContainer.superclass.paintActor.call(this, director, time);

                for (var actor = this.activeChildren; actor; actor = actor.__next) {
                    if (actor.visible) {
                        actor.paintActor(director, time);
                    }
                }

                return true;
            },
            /**
             * Private.
             * Performs the animate method for this ActorContainer and every contained Actor.
             *
             * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
             * @param time an integer indicating the Scene time when the bounding box is to be drawn.
             *
             * @return {boolean} is this actor in active children list ??
             */
            animate:function (director, time) {

                this.activeChildren = null;
                var last = null;

                if (false === CAAT.ActorContainer.superclass.animate.call(this, director, time)) {
                    return false;
                }

                this.__validateLayout();
                CAAT.currentDirector.inValidation = false;

                var i, l;
                var notActive = [];

                this.size_active = 0;
                this.size_total = 0;

                /**
                 * Incluir los actores pendientes.
                 * El momento es ahora, antes de procesar ninguno del contenedor.
                 */
                for (i = 0; i < this.pendingChildrenList.length; i++) {
                    var child = this.pendingChildrenList[i];
                    this.addChild(child);
                }
                this.pendingChildrenList = [];


                var cl = this.childrenList;
                for (i = 0; i < cl.length; i++) {
                    var actor = cl[i];
                    actor.time = time;
                    this.size_total += actor.size_total;
                    if (actor.animate(director, time)) {
                        if (!this.activeChildren) {
                            this.activeChildren = actor;
                            actor.__next = null;
                            last = actor;
                        } else {
                            actor.__next = null;
                            last.__next = actor;
                            last = actor;
                        }

                        this.size_active += actor.size_active;

                    } else {
                        if (actor.expired && actor.discardable) {
                            this.domElement.removeChild(actor.domElement);
                            actor.destroy(time);
                            cl.splice(i, 1);
                        }
                    }
                }

                return true;
            },
            /**
             * Removes Actors from this ActorContainer which are expired and flagged as Discardable.
             *
             * @param director the CAAT.Director object instance that contains the Scene the Actor is in.
             * @param time an integer indicating the Scene time when the bounding box is to be drawn.
             *
             * @deprecated
             */
            endAnimate:function (director, time) {
            },

            addActorImmediately: function(child,constraint) {
                return this.addChildImmediately(child,constraint);
            },

            addActor : function( child, constraint ) {
                return this.addChild(child,constraint);
            },

            /**
             * Adds an Actor to this Container.
             * The Actor will be added ON METHOD CALL, despite the rendering pipeline stage being executed at
             * the time of method call.
             *
             * This method is only used by CAAT.Director's transitionScene.
             *
             * @param child a CAAT.Actor instance.
             * @return this.
             */
            addChildImmediately:function (child, constraint) {
                return this.addChild(child, constraint);
            },
            /**
             * Adds an Actor to this ActorContainer.
             * The Actor will be added to the container AFTER frame animation, and not on method call time.
             * Except the Director and in orther to avoid visual artifacts, the developer SHOULD NOT call this
             * method directly.
             *
             * @param child a CAAT.Actor object instance.
             * @return this
             */
            addChild:function (child, constraint) {
                child.setParent(this);
                this.childrenList.push(child);
                child.dirty = true;

                if (this.layoutManager) {
                    this.layoutManager.addChild(child, constraint);
                    this.invalidateLayout();
                } else {
                    /**
                     * if Conforming size, recalc new bountainer size.
                     */
                    if (this.addHint === CAAT.ActorContainer.AddHint.CONFORM) {
                        this.recalcSize();
                    }
                }

                return this;
            },

            /**
             * Recalc this container size by computin the union of every children bounding box.
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
             * @param child {CAAT.Actor}
             */
            addChildDelayed:function (child) {
                this.pendingChildrenList.push(child);
                return this;
            },
            /**
             * Adds an Actor to this ActorContainer.
             *
             * @param child a CAAT.Actor object instance.
             *
             * @return this
             */
            addChildAt:function (child, index) {

                if (index <= 0) {
                    //this.childrenList.unshift(child);  // unshift unsupported on IE
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

                child.setParent(this);
                this.childrenList.splice(index, 0, child);

                this.domElement.insertBefore(child.domElement, this.domElement.childNodes[index]);
                this.invalidateLayout();

                child.dirty = true;

                return this;
            },
            /**
             * Find the first actor with the supplied ID.
             * This method is not recommended to be used since executes a linear search.
             * @param id
             */
            findActorById:function (id) {
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
             * @param child a CAAT.Actor object instance.
             *
             * @return an integer indicating the Actor's z-order.
             */
            findChild:function (child) {
                var i = 0,
                    len = this.childrenList.length;
                for (i = 0; i < len; i++) {
                    if (this.childrenList[i] === child) {
                        return i;
                    }
                }
                return -1;
            },

            removeChildAt:function (pos) {
                var cl = this.childrenList;
                var rm;
                if (-1 !== pos) {
                    cl[pos].setParent(null);
                    rm = cl.splice(pos, 1);
                    this.invalidateLayout();
                    return rm[0];
                }

                return null;
            },
            /**
             * Removed an Actor form this ActorContainer.
             * If the Actor is not contained into this Container, nothing happends.
             *
             * @param child a CAAT.Actor object instance.
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
                first.setParent(null);
                this.invalidateLayout();

                return first;
            },
            removeLastChild:function () {
                if (this.childrenList.length) {
                    var last = this.childrenList.pop();
                    last.setParent(null);
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

                if (null === CAAT.ActorContainer.superclass.findActorAtPosition.call(this, point)) {
                    return null;
                }

                // z-order
                for (var i = this.childrenList.length - 1; i >= 0; i--) {
                    var child = this.childrenList[i];

                    var np = new CAAT.Point(point.x, point.y, 0);
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
                for (var i = this.childrenList.length - 1; i >= 0; i--) {
                    this.childrenList[i].destroy();
                }
                CAAT.ActorContainer.superclass.destroy.call(this);

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
             * @return the CAAT.Actor object at position.
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

                        //this.childrenList.splice( index, 1, nActor );
                        cl.splice(index, 0, nActor[0]);
                    }

                    for (var i = 0, l = cl.length; i < l; i++) {
                        cl[i].domElement.style.zIndex = i;
                    }

                    this.invalidateLayout();
                }
            }
        }
    }
});
