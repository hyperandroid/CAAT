CAAT.Module( {
    defines : "CAAT.Foundation.UI.Layout.GridLayout",
    aliases : ["CAAT.UI.GridLayout"],
    depends : [
        "CAAT.Foundation.UI.Layout.LayoutManager",
        "CAAT.Math.Dimension"
    ],
    extendsClass : "CAAT.Foundation.UI.Layout.LayoutManager",
    extendsWith : {

        __init : function( rows, columns ) {
            this.__super();
            this.rows= rows;
            this.columns= columns;

            return this;
        },

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
                        if ( child.isVisible() && child.isInAnimationFrame( CAAT.getCurrentSceneTime() ) ) {
                            if ( !this.animated ) {
                                child.setBounds(x, y, widthOnComponent, heightOnComponent);
                            } else {
                                if ( child.width!==widthOnComponent || child.height!==heightOnComponent ) {
                                    child.setSize(widthOnComponent, heightOnComponent);
                                    if ( this.newChildren.indexOf( child ) !==-1 ) {
                                        child.setPosition( x,y );
                                        child.setScale(0.01,0.01);
                                        child.scaleTo( 1,1, 500, 0,.5,.5, this.newElementInterpolator );
                                    } else {
                                        child.moveTo( x, y, 500, 0, this.moveElementInterpolator );
                                    }
                                }
                            }
                        }
                    }
                }
            }

            CAAT.Foundation.UI.Layout.GridLayout.superclass.doLayout.call(this, container);
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
                if ( actor.isVisible() && actor.isInAnimationFrame( CAAT.getCurrentSceneTime() ) ) {
                    var d = actor.getMinimumSize();
                    if (w < d.width) {
                        w = d.width;
                    }
                    if (h < d.height) {
                        h = d.height;
                    }
                }
            }

            return new CAAT.Math.Dimension(
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
                if ( actorisVisible() && actor.isInAnimationFrame( CAAT.getCurrentSceneTime() ) ) {
                    var d = actor.getPreferredSize();
                    if (w < d.width) {
                        w = d.width;
                    }
                    if (h < d.height) {
                        h = d.height;
                    }
                }
            }

            return new CAAT.Math.Dimension(
                this.padding.left + this.padding.right + ncols * w + (ncols - 1) * this.hgap,
                this.padding.top + this.padding.bottom + nrows * h + (nrows - 1) * this.vgap
            );
        }

    }
});
