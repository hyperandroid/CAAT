CAAT.Module({

    /**
     * @name BoxLayout
     * @memberOf CAAT.Foundation.UI.Layout
     * @extends CAAT.Foundation.UI.Layout.LayoutManager
     * @constructor
     */

    defines:"CAAT.Foundation.UI.Layout.BoxLayout",
    aliases:["CAAT.UI.BoxLayout"],
    depends:[
        "CAAT.Foundation.UI.Layout.LayoutManager",
        "CAAT.Math.Dimension"
    ],
    extendsClass:"CAAT.Foundation.UI.Layout.LayoutManager",
    extendsWith:function () {

        return {

            /**
             * @lends CAAT.Foundation.UI.Layout.BoxLayout.prototype
             */

            /**
             * Stack elements in this axis.
             * @type {CAAT.Foundation.UI.Layout.LayoutManager}
             */
            axis:CAAT.Foundation.UI.Layout.LayoutManager.AXIS.Y,

            /**
             * Vertical alignment.
             * @type {CAAT.Foundation.UI.Layout.LayoutManager.ALIGNMENT}
             */
            valign:CAAT.Foundation.UI.Layout.LayoutManager.ALIGNMENT.CENTER,

            /**
             * Horizontal alignment.
             * @type {CAAT.Foundation.UI.Layout.LayoutManager.ALIGNMENT}
             */
            halign:CAAT.Foundation.UI.Layout.LayoutManager.ALIGNMENT.CENTER,

            setAxis:function (axis) {
                this.axis = axis;
                this.invalidateLayout();
                return this;
            },

            setHorizontalAlignment:function (align) {
                this.halign = align;
                this.invalidateLayout();
                return this;
            },

            setVerticalAlignment:function (align) {
                this.valign = align;
                this.invalidateLayout();
                return this;
            },

            doLayout:function (container) {

                if (this.axis === CAAT.Foundation.UI.Layout.LayoutManager.AXIS.Y) {
                    this.doLayoutVertical(container);
                } else {
                    this.doLayoutHorizontal(container);
                }

                CAAT.Foundation.UI.Layout.BoxLayout.superclass.doLayout.call(this, container);
            },

            doLayoutHorizontal:function (container) {

                var computedW = 0, computedH = 0;
                var yoffset = 0, xoffset;
                var i, l, actor;

                // calculamos ancho y alto de los elementos.
                for (i = 0, l = container.getNumChildren(); i < l; i += 1) {

                    actor = container.getChildAt(i);
                    if (!actor.preventLayout && actor.isVisible() && actor.isInAnimationFrame(CAAT.getCurrentSceneTime())) {
                        if (computedH < actor.height) {
                            computedH = actor.height;
                        }

                        computedW += actor.width;
                        if (i > 0) {
                            computedW += this.hgap;
                        }
                    }
                }

                switch (this.halign) {
                    case CAAT.Foundation.UI.Layout.LayoutManager.ALIGNMENT.LEFT:
                        xoffset = this.padding.left;
                        break;
                    case CAAT.Foundation.UI.Layout.LayoutManager.ALIGNMENT.RIGHT:
                        xoffset = container.width - computedW - this.padding.right;
                        break;
                    default:
                        xoffset = (container.width - computedW) / 2;
                }

                for (i = 0, l = container.getNumChildren(); i < l; i += 1) {
                    actor = container.getChildAt(i);
                    if (!actor.preventLayout && actor.isVisible() && actor.isInAnimationFrame(CAAT.getCurrentSceneTime())) {
                        switch (this.valign) {
                            case CAAT.Foundation.UI.Layout.LayoutManager.ALIGNMENT.TOP:
                                yoffset = this.padding.top;
                                break;
                            case CAAT.Foundation.UI.Layout.LayoutManager.ALIGNMENT.BOTTOM:
                                yoffset = container.height - this.padding.bottom - actor.height;
                                break;
                            default:
                                yoffset = (container.height - actor.height) / 2;
                        }

                        this.__setActorPosition(actor, xoffset, yoffset);

                        xoffset += actor.width + this.hgap;
                    }
                }

            },

            __setActorPosition:function (actor, xoffset, yoffset) {
                if (this.animated) {
                    if (this.newChildren.indexOf(actor) !== -1) {
                        actor.setPosition(xoffset, yoffset);
                        actor.setScale(0, 0);
                        actor.scaleTo(1, 1, 500, 0, .5, .5, this.newElementInterpolator);
                    } else {
                        actor.moveTo(xoffset, yoffset, 500, 0, this.moveElementInterpolator);
                    }
                } else {
                    actor.setPosition(xoffset, yoffset);
                }
            },

            doLayoutVertical:function (container) {

                var computedW = 0, computedH = 0;
                var yoffset, xoffset;
                var i, l, actor;

                // calculamos ancho y alto de los elementos.
                for (i = 0, l = container.getNumChildren(); i < l; i += 1) {

                    actor = container.getChildAt(i);
                    if (!actor.preventLayout && actor.isVisible() && actor.isInAnimationFrame(CAAT.getCurrentSceneTime())) {
                        if (computedW < actor.width) {
                            computedW = actor.width;
                        }

                        computedH += actor.height;
                        if (i > 0) {
                            computedH += this.vgap;
                        }
                    }
                }

                switch (this.valign) {
                    case CAAT.Foundation.UI.Layout.LayoutManager.ALIGNMENT.TOP:
                        yoffset = this.padding.top;
                        break;
                    case CAAT.Foundation.UI.Layout.LayoutManager.ALIGNMENT.BOTTOM:
                        yoffset = container.height - computedH - this.padding.bottom;
                        break;
                    default:
                        yoffset = (container.height - computedH) / 2;
                }

                for (i = 0, l = container.getNumChildren(); i < l; i += 1) {
                    actor = container.getChildAt(i);
                    if (!actor.preventLayout && actor.isVisible() && actor.isInAnimationFrame(CAAT.getCurrentSceneTime())) {
                        switch (this.halign) {
                            case CAAT.Foundation.UI.Layout.LayoutManager.ALIGNMENT.LEFT:
                                xoffset = this.padding.left;
                                break;
                            case CAAT.Foundation.UI.Layout.LayoutManager.ALIGNMENT.RIGHT:
                                xoffset = container.width - this.padding.right - actor.width;
                                break;
                            default:
                                xoffset = (container.width - actor.width) / 2;
                        }

                        this.__setActorPosition(actor, xoffset, yoffset);

                        yoffset += actor.height + this.vgap;
                    }
                }
            },

            getPreferredLayoutSize:function (container) {

                var dim = new CAAT.Math.Dimension();
                var computedW = 0, computedH = 0;
                var i, l;

                // calculamos ancho y alto de los elementos.
                for (i = 0, l = container.getNumChildren(); i < l; i += 1) {

                    var actor = container.getChildAt(i);
                    if (!actor.preventLayout && actor.isVisible() && actor.isInAnimationFrame(CAAT.getCurrentSceneTime())) {
                        var ps = actor.getPreferredSize();

                        if (computedH < ps.height) {
                            computedH = ps.height;
                        }
                        computedW += ps.width;
                    }
                }

                dim.width = computedW;
                dim.height = computedH;

                return dim;
            },

            getMinimumLayoutSize:function (container) {
                var dim = new CAAT.Math.Dimension();
                var computedW = 0, computedH = 0;
                var i, l;

                // calculamos ancho y alto de los elementos.
                for (i = 0, l = container.getNumChildren(); i < l; i += 1) {

                    var actor = container.getChildAt(i);
                    if (!actor.preventLayout && actor.isVisible() && actor.isInAnimationFrame(CAAT.getCurrentSceneTime())) {
                        var ps = actor.getMinimumSize();

                        if (computedH < ps.height) {
                            computedH = ps.height;
                        }
                        computedW += ps.width;
                    }
                }

                dim.width = computedW;
                dim.height = computedH;

                return dim;
            }
        }
    }
});
