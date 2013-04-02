/**
 * See LICENSE file.
 *
 * This file contains the definition for objects QuadTree and HashMap.
 * Quadtree offers an exact list of collisioning areas, while HashMap offers a list of potentially colliding
 * elements.
 * Specially suited for static content.
 *
 **/

CAAT.Module({

    /**
     * @name Collision
     * @memberOf CAAT.Module
     * @namespace
     */

    /**
     * @name QuadTree
     * @memberOf CAAT.Module.Collision
     * @constructor
     */

    defines:"CAAT.Module.Collision.QuadTree",
    depends:[
        "CAAT.Math.Rectangle"
    ],
    extendsClass:"CAAT.Math.Rectangle",
    extendsWith:function () {

        var QT_MAX_ELEMENTS = 1;
        var QT_MIN_WIDTH = 32;

        return {

            /**
             * @lends CAAT.Module.Collision.QuadTree.prototype
             */

            /**
             * For each quadtree level this keeps the list of overlapping elements.
             */
            bgActors:null,

            /**
             * For each quadtree, this quadData keeps another 4 quadtrees up to the  maximum recursion level.
             */
            quadData:null,

            create:function (l, t, r, b, backgroundElements, minWidth, maxElements) {

                if (typeof minWidth === 'undefined') {
                    minWidth = QT_MIN_WIDTH;
                }
                if (typeof maxElements === 'undefined') {
                    maxElements = QT_MAX_ELEMENTS;
                }

                var cx = (l + r) / 2;
                var cy = (t + b) / 2;

                this.x = l;
                this.y = t;
                this.x1 = r;
                this.y1 = b;
                this.width = r - l;
                this.height = b - t;

                this.bgActors = this.__getOverlappingActorList(backgroundElements);

                if (this.bgActors.length <= maxElements || this.width <= minWidth) {
                    return this;
                }

                this.quadData = new Array(4);
                this.quadData[0] = new CAAT.Module.Collision.QuadTree().create(l, t, cx, cy, this.bgActors);  // TL
                this.quadData[1] = new CAAT.Module.Collision.QuadTree().create(cx, t, r, cy, this.bgActors);  // TR
                this.quadData[2] = new CAAT.Module.Collision.QuadTree().create(l, cy, cx, b, this.bgActors);  // BL
                this.quadData[3] = new CAAT.Module.Collision.QuadTree().create(cx, cy, r, b, this.bgActors);

                return this;
            },

            __getOverlappingActorList:function (actorList) {
                var tmpList = [];
                for (var i = 0, l = actorList.length; i < l; i++) {
                    var actor = actorList[i];
                    if (this.intersects(actor.AABB)) {
                        tmpList.push(actor);
                    }
                }
                return tmpList;
            },

            /**
             * Call this method to thet the list of colliding elements with the parameter rectangle.
             * @param rectangle
             * @return {Array}
             */
            getOverlappingActors:function (rectangle) {
                var i, j, l;
                var overlappingActors = [];
                var qoverlappingActors;
                var actors = this.bgActors;
                var actor;

                if (this.quadData) {
                    for (i = 0; i < 4; i++) {
                        if (this.quadData[i].intersects(rectangle)) {
                            qoverlappingActors = this.quadData[i].getOverlappingActors(rectangle);
                            for (j = 0, l = qoverlappingActors.length; j < l; j++) {
                                overlappingActors.push(qoverlappingActors[j]);
                            }
                        }
                    }
                } else {
                    for (i = 0, l = actors.length; i < l; i++) {
                        actor = actors[i];
                        if (rectangle.intersects(actor.AABB)) {
                            overlappingActors.push(actor);
                        }
                    }
                }

                return overlappingActors;
            }
        }
    }
});
