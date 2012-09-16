(function() {

    CAAT.UI.Padding= function() {
        return this;
    };

    CAAT.UI.Padding.prototype= {
        left:   2,
        right:  2,
        top:    2,
        bottom: 2
    };

    CAAT.UI.LayoutManager= function( ) {

        this.newChildren= [];
        this.padding= new CAAT.UI.Padding();
        return this;
    };

    CAAT.UI.LayoutManager.newElementInterpolator= new CAAT.Interpolator().createElasticOutInterpolator(1.1,.7);
    CAAT.UI.LayoutManager.moveElementInterpolator= new CAAT.Interpolator().createExponentialOutInterpolator(2);

    CAAT.UI.LayoutManager.prototype= {

        padding : null,
        invalid : true,

        hgap        : 2,
        vgap        : 2,
        animated    : true,
        newChildren : null,

        setAnimated : function( animate ) {
            this.animated= animate;
        },

        setHGap : function( gap ) {
            this.hgap= gap;
            this.invalidateLayout();
            return this;
        },

        setVGap : function( gap ) {
            this.vgap= gap;
            this.invalidateLayout();
            return this;
        },

        setAllPadding : function( s ) {
            this.padding.left= s;
            this.padding.right= s;
            this.padding.top= s;
            this.padding.bottom= s;
            this.invalidateLayout();
            return this;
        },

        setPadding : function( l,r, t,b ) {
            this.padding.left= l;
            this.padding.right= r;
            this.padding.top= t;
            this.padding.bottom= b;
            this.invalidateLayout();
            return this;
        },

        addChild : function( child, constraints ) {
            this.newChildren.push( child );
        },

        removeChild : function( child ) {

        },

        doLayout : function( container ) {
            this.newChildren= [];
            this.invalid= false;
        },

        invalidateLayout : function( container ) {
            this.invalid= true;
        },

        getMinimumLayoutSize : function( container ) {

        },

        getPreferredLayoutSize : function(container ) {

        },

        isValid : function() {
            return !this.invalid;
        },

        isInvalidated : function() {
            return this.invalid;
        }
    };
}());

(function() {

    /**
     *
     * Layouts a container children in equal sized cells organized in rows by columns.
     *
     * @param rows {number=} number of initial rows, defaults to 2.
     * @param columns {number=} number of initial columns, defaults to 2.
     * @return {*}
     * @constructor
     */
    CAAT.UI.GridLayout= function( rows, columns ) {
        CAAT.UI.GridLayout.superclass.constructor.call(this);
        this.rows= rows;
        this.columns= columns;

        return this;
    };

    CAAT.UI.GridLayout.prototype= {
        rows    : 0,
        columns : 2,

        doLayout : function( container ) {

            var nactors= container.getNumChildren();
            if (nactors === 0) {
                return;
            }

            var nrows = this.rows;
            var ncols = this.columns;

            if (nrows > 0) {
                ncols = Math.floor( (nactors + nrows - 1) / nrows );
            } else {
                nrows = Math.floor( (nactors + ncols - 1) / ncols );
            }

            var totalGapsWidth = (ncols - 1) * this.hgap;
            var widthWOInsets = container.width - (this.padding.left + this.padding.right);
            var widthOnComponent = Math.floor( (widthWOInsets - totalGapsWidth) / ncols );
            var extraWidthAvailable = Math.floor( (widthWOInsets - (widthOnComponent * ncols + totalGapsWidth)) / 2 );

            var totalGapsHeight = (nrows - 1) * this.vgap;
            var heightWOInsets = container.height - (this.padding.top + this.padding.bottom);
            var heightOnComponent = Math.floor( (heightWOInsets - totalGapsHeight) / nrows );
            var extraHeightAvailable = Math.floor( (heightWOInsets - (heightOnComponent * nrows + totalGapsHeight)) / 2 );

            for (var c = 0, x = this.padding.left + extraWidthAvailable; c < ncols ; c++, x += widthOnComponent + this.hgap) {
                for (var r = 0, y = this.padding.top + extraHeightAvailable; r < nrows ; r++, y += heightOnComponent + this.vgap) {
                    var i = r * ncols + c;
                    if (i < nactors) {
                        var child= container.getChildAt(i);
                        if ( !this.animated ) {
                            child.setBounds(x, y, widthOnComponent, heightOnComponent);
                        } else {
                            child.setSize(widthOnComponent, heightOnComponent);
                            if ( this.newChildren.indexOf( child ) !==-1 ) {
                                child.setPosition( x,y );
                                child.setScale(0.01,0.01);
                                child.scaleTo( 1,1, 500, 0,.5,.5, CAAT.UI.LayoutManager.newElementInterpolator );
                            } else {
                                child.moveTo( x, y, 500, 0, CAAT.UI.LayoutManager.moveElementInterpolator );
                            }
                        }
                    }
                }
            }

            CAAT.UI.GridLayout.superclass.doLayout.call(this, container);
        },

        getMinimumLayoutSize : function( container ) {
            var nrows = this.rows;
            var ncols = this.columns;
            var nchildren= container.getNumChildren();
            var w=0, h=0, i;

            if (nrows > 0) {
                ncols = Math.ceil( (nchildren + nrows - 1) / nrows );
            } else {
                nrows = Math.ceil( (nchildren + ncols - 1) / ncols );
            }

            for ( i= 0; i < nchildren; i+=1 ) {
                var actor= container.getChildAt(i);
                var d = actor.getMinimumSize();
                if (w < d.width) {
                    w = d.width;
                }
                if (h < d.height) {
                    h = d.height;
                }
            }

            return new CAAT.Dimension(
                this.padding.left + this.padding.right + ncols * w + (ncols - 1) * this.hgap,
                this.padding.top + this.padding.bottom + nrows * h + (nrows - 1) * this.vgap
            );
        },

        getPreferredLayoutSize : function( container ) {

            var nrows = this.rows;
            var ncols = this.columns;
            var nchildren= container.getNumChildren();
            var w=0, h=0, i;

            if (nrows > 0) {
                ncols = Math.ceil( (nchildren + nrows - 1) / nrows );
            } else {
                nrows = Math.ceil( (nchildren + ncols - 1) / ncols );
            }

            for ( i= 0; i < nchildren; i+=1 ) {
                var actor= container.getChildAt(i);
                var d = actor.getPreferredSize();
                if (w < d.width) {
                    w = d.width;
                }
                if (h < d.height) {
                    h = d.height;
                }
            }

            return new CAAT.Dimension(
                this.padding.left + this.padding.right + ncols * w + (ncols - 1) * this.hgap,
                this.padding.top + this.padding.bottom + nrows * h + (nrows - 1) * this.vgap
            );
        }

    };

    extend( CAAT.UI.GridLayout, CAAT.UI.LayoutManager );

}());

(function() {
    CAAT.UI.BorderLayout= function() {
        CAAT.UI.BorderLayout.superclass.constructor.call(this);
        return this;
    };

    CAAT.UI.BorderLayout.prototype= {

        left    : null,
        right   : null,
        top     : null,
        bottom  : null,
        center  : null,

        addChild : function( child, constraint ) {
            CAAT.UI.BorderLayout.superclass.addChild.call( this, child, constraint );

            if ( constraint === "center" ) {
                this.center= child;
            } else if ( constraint==="left" ) {
                this.left= child;
            } else if ( constraint==="right" ) {
                this.right= child;
            } else if ( constraint==="top" ) {
                this.top= child;
            } else if ( constraint==="bottom" ) {
                this.bottom= child;
            }
        },

        removeChild : function( child ) {
            if ( this.center===child ) {
                this.center=null;
            } else if ( this.left===child ) {
                this.left= null;
            } else if ( this.right===child ) {
                this.right= null;
            } else if ( this.top===child ) {
                this.top= null;
            } else if ( this.bottom===child ) {
                this.bottom= null;
            }
        },

        __getChild : function( constraint ) {
            if ( constraint==="center" ) {
                return this.center;
            } else if ( constraint==="left" ) {
                return this.left;
            } else if ( constraint==="right" ) {
                return this.right;
            } else if ( constraint==="top" ) {
                return this.top;
            } else if ( constraint==="bottom" ) {
                return this.bottom;
            }
        },

        getMinimumLayoutSize : function( container ) {
            var c, d;
            var dim= new CAAT.Dimension();

            if ((c=this.__getChild("right")) != null) {
                d = c.getMinimumSize();
                dim.width += d.width + this.hgap;
                dim.height = Math.max(d.height, dim.height);
            }
            if ((c=this.__getChild("left")) != null) {
                d = c.getMinimumSize();
                dim.width += d.width + this.hgap;
                dim.height = Math.max(d.height, dim.height);
            }
            if ((c=this.__getChild("center")) != null) {
                d = c.getMinimumSize();
                dim.width += d.width;
                dim.height = Math.max(d.height, dim.height);
            }
            if ((c=this.__getChild("top")) != null) {
                d = c.getMinimumSize();
                dim.width = Math.max(d.width, dim.width);
                dim.height += d.height + this.vgap;
            }
            if ((c=this.__getChild("bottom")) != null) {
                d = c.getMinimumSize();
                dim.width = Math.max(d.width, dim.width);
                dim.height += d.height + this.vgap;
            }

            dim.width += this.padding.left + this.padding.right;
            dim.height += this.padding.top + this.padding.bottom;

            return dim;
        },

        getPreferredLayoutSize : function( container ) {
            var c, d;
            var dim= new CAAT.Dimension();

            if ((c=this.__getChild("left")) != null) {
                d = c.getPreferredSize();
                dim.width += d.width + this.hgap;
                dim.height = Math.max(d.height, dim.height);
            }
            if ((c=this.__getChild("right")) != null) {
                d = c.getPreferredSize();
                dim.width += d.width + this.hgap;
                dim.height = Math.max(d.height, dim.height);
            }
            if ((c=this.__getChild("center")) != null) {
                d = c.getPreferredSize();
                dim.width += d.width;
                dim.height = Math.max(d.height, dim.height);
            }
            if ((c=this.__getChild("top")) != null) {
                d = c.getPreferredSize();
                dim.width = Math.max(d.width, dim.width);
                dim.height += d.height + this.vgap;
            }
            if ((c=this.__getChild("bottom")) != null) {
                d = c.getPreferredSize();
                dim.width = Math.max(d.width, dim.width);
                dim.height += d.height + this.vgap;
            }

            dim.width += this.padding.left + this.padding.right;
            dim.height += this.padding.top + this.padding.bottom;

            return dim;
        },

        doLayout : function( container ) {

            var top = this.padding.top;
            var bottom = container.height - this.padding.bottom;
            var left = this.padding.left;
            var right = container.width - this.padding.right;
            var c, d;

            if ((c=this.__getChild("top")) != null) {
                c.setSize(right - left, c.height);
                d = c.getPreferredSize();
                c.setBounds(left, top, right - left, d.height);
                top += d.height + this.vgap;
            }
            if ((c=this.__getChild("bottom")) != null) {
                c.setSize(right - left, c.height);
                d = c.getPreferredSize();
                c.setBounds(left, bottom - d.height, right - left, d.height);
                bottom -= d.height + this.vgap;
            }
            if ((c=this.__getChild("right")) != null) {
                c.setSize(c.width, bottom - top);
                d = c.getPreferredSize();
                c.setBounds(right - d.width, top, d.width, bottom - top);
                right -= d.width + this.hgap;
            }
            if ((c=this.__getChild("left")) != null) {
                c.setSize(c.width, bottom - top);
                d = c.getPreferredSize();
                c.setBounds(left, top, d.width, bottom - top);
                left += d.width + this.hgap;
            }
            if ((c=this.__getChild("center")) != null) {
                c.setBounds(left, top, right - left, bottom - top);
            }

            CAAT.UI.BorderLayout.superclass.doLayout.call(this, container);
        }


    };

    extend( CAAT.UI.BorderLayout, CAAT.UI.LayoutManager );
}());

(function() {

    CAAT.UI.BoxLayout= function() {
        CAAT.UI.BoxLayout.superclass.constructor.call(this);
        return this;
    };

    CAAT.UI.BoxLayout.AXIS= {
        X : 0,
        Y : 1
    };

    CAAT.UI.BoxLayout.ALIGNMENT= {
        LEFT :  0,
        RIGHT:  1,
        CENTER: 2,
        TOP:    3,
        BOTTOM: 4
    };

    CAAT.UI.BoxLayout.prototype= {

        axis    : CAAT.UI.BoxLayout.AXIS.Y,
        valign  : CAAT.UI.BoxLayout.ALIGNMENT.CENTER,
        halign  : CAAT.UI.BoxLayout.ALIGNMENT.CENTER,

        setAxis : function( axis ) {
            this.axis= axis;
            this.invalidateLayout();
            return this;
        },

        setHorizontalAlignment : function(align ) {
            this.halign= align;
            this.invalidateLayout();
            return this;
        },

        setVerticalAlignment : function( align ) {
            this.valign= align;
            this.invalidateLayout();
            return this;
        },

        doLayout : function( container ) {

            if ( this.axis===CAAT.UI.BoxLayout.AXIS.Y ) {
                this.doLayoutVertical( container );
            } else {
                this.doLayoutHorizontal( container );
            }

            CAAT.UI.BoxLayout.superclass.doLayout.call(this, container);
        },

        doLayoutHorizontal : function( container ) {

            var computedW= 0, computedH=0;
            var yoffset= 0, xoffset;
            var i, l, actor;

            // calculamos ancho y alto de los elementos.
            for( i= 0, l=container.getNumChildren(); i<l; i+=1 ) {

                actor= container.getChildAt(i);
                if ( computedH < actor.height ) {
                    computedH= actor.height;
                }

                computedW += actor.width;
                if ( i>0 ) {
                    computedW+= this.hgap;
                }
            }

            switch( this.halign ) {
                case CAAT.UI.BoxLayout.ALIGNMENT.LEFT:
                    xoffset= this.padding.left;
                    break;
                case CAAT.UI.BoxLayout.ALIGNMENT.RIGHT:
                    xoffset= container.width - computedW - this.padding.right;
                    break;
                default:
                    xoffset= (container.width - computedW) / 2;
            }

            for( i= 0, l=container.getNumChildren(); i<l; i+=1 ) {
                actor= container.getChildAt(i);

                switch( this.valign ) {
                    case CAAT.UI.BoxLayout.ALIGNMENT.TOP:
                        yoffset= this.padding.top;
                        break;
                    case CAAT.UI.BoxLayout.ALIGNMENT.BOTTOM:
                        yoffset= container.height - this.padding.bottom - actor.height;
                        break;
                    default:
                        yoffset= (container.height - actor.height) / 2;
                }

                this.__setActorPosition( actor, xoffset, yoffset );

                xoffset += actor.width + this.hgap;
            }

        },

        __setActorPosition : function( actor, xoffset, yoffset ) {
            if ( this.animated ) {
                if ( this.newChildren.indexOf( actor )!==-1 ) {
                    actor.setPosition( xoffset, yoffset );
                    actor.setScale(0,0);
                    actor.scaleTo( 1,1, 500, 0,.5,.5, CAAT.UI.LayoutManager.newElementInterpolator );
                } else {
                    actor.moveTo( xoffset, yoffset, 500, 0, CAAT.UI.LayoutManager.moveElementInterpolator );
                }
            } else {
                actor.setPosition( xoffset, yoffset );
            }
        },

        doLayoutVertical : function( container ) {

            var computedW= 0, computedH=0;
            var yoffset, xoffset;
            var i, l, actor;

            // calculamos ancho y alto de los elementos.
            for( i= 0, l=container.getNumChildren(); i<l; i+=1 ) {

                actor= container.getChildAt(i);
                if ( computedW < actor.width ) {
                    computedW= actor.width;
                }

                computedH += actor.height;
                if ( i>0 ) {
                    computedH+= this.vgap;
                }
            }

            switch( this.valign ) {
                case CAAT.UI.BoxLayout.ALIGNMENT.TOP:
                    yoffset= this.padding.top;
                    break;
                case CAAT.UI.BoxLayout.ALIGNMENT.BOTTOM:
                    yoffset= container.height - computedH - this.padding.bottom;
                    break;
                default:
                    yoffset= (container.height - computedH) / 2;
            }

            for( i= 0, l=container.getNumChildren(); i<l; i+=1 ) {
                actor= container.getChildAt(i);

                switch( this.halign ) {
                    case CAAT.UI.BoxLayout.ALIGNMENT.LEFT:
                        xoffset= this.padding.left;
                        break;
                    case CAAT.UI.BoxLayout.ALIGNMENT.RIGHT:
                        xoffset= container.width - this.padding.right - actor.width;
                        break;
                    default:
                        xoffset= (container.width - actor.width) / 2;
                }

                this.__setActorPosition( actor, xoffset, yoffset );

                yoffset += actor.height + this.vgap;

            }
        },

        getPreferredLayoutSize : function( container ) {

            var dim= new CAAT.Dimension();
            var computedW= 0, computedH=0;
            var i, l;

            // calculamos ancho y alto de los elementos.
            for( i= 0, l=container.getNumChildren(); i<l; i+=1 ) {

                var actor= container.getChildAt(i);
                var ps= actor.getPreferredSize();

                if ( computedH < ps.height ) {
                    computedH= ps.height;
                }
                computedW += ps.width;
            }

            dim.width= computedW;
            dim.height= computedH;

            return dim;
        },

        getMinimumLayoutSize : function( container ) {
            var dim= new CAAT.Dimension();
            var computedW= 0, computedH=0;
            var i, l;

            // calculamos ancho y alto de los elementos.
            for( i= 0, l=container.getNumChildren(); i<l; i+=1 ) {

                var actor= container.getChildAt(i);
                var ps= actor.getMinimumSize();

                if ( computedH < ps.height ) {
                    computedH= ps.height;
                }
                computedW += ps.width;
            }

            dim.width= computedW;
            dim.height= computedH;

            return dim;
        }
    };

    extend( CAAT.UI.BoxLayout, CAAT.UI.LayoutManager );
}());