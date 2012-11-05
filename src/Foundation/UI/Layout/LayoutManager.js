CAAT.Module( {
    defines : "CAAT.Foundation.UI.Layout.LayoutManager",
    aliases : ["CAAT.UI.LayoutManager"],
    depends : [
        "CAAT.Behavior.Interpolator"
    ],
    constants : {

        AXIS: {
            X : 0,
            Y : 1
        },

        ALIGNMENT : {
            LEFT :  0,
            RIGHT:  1,
            CENTER: 2,
            TOP:    3,
            BOTTOM: 4,
            JUSTIFY:5
        }

    },
    extendsWith : function() {

        return {
            __init : function( ) {

                this.newChildren= [];
                this.padding= {
                    left:   2,
                    right:  2,
                    top:    2,
                    bottom: 2
                };

                return this;
            },

            newElementInterpolator : new CAAT.Behavior.Interpolator().createElasticOutInterpolator(1.1,.7),
            moveElementInterpolator : new CAAT.Behavior.Interpolator().createExponentialOutInterpolator(2),

            padding : null,
            invalid : true,

            hgap        : 2,
            vgap        : 2,
            animated    : false,
            newChildren : null,

            setAnimated : function( animate ) {
                this.animated= animate;
                return this;
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
        }
    }
});
