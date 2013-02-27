CAAT.Module( {

    /**
     * @name Layout
     * @memberOf CAAT.Foundation.UI
     * @namespace
     */

    /**
     * @name LayoutManager
     * @memberOf CAAT.Foundation.UI.Layout
     * @constructor
     */

    defines : "CAAT.Foundation.UI.Layout.LayoutManager",
    aliases : ["CAAT.UI.LayoutManager"],
    depends : [
        "CAAT.Behavior.Interpolator"
    ],
    constants : {

        /**
         * @lends CAAT.Foundation.UI.Layout.LayoutManager
         */

        /**
         * @enum {number}
         */
        AXIS: {
            X : 0,
            Y : 1
        },

        /**
         * @enum {number}
         */
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

            /**
             * @lends CAAT.Foundation.UI.Layout.LayoutManager.prototype
             */


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

            /**
             * If animation enabled, new element interpolator.
             */
            newElementInterpolator : new CAAT.Behavior.Interpolator().createElasticOutInterpolator(1.1,.7),

            /**
             * If animation enabled, relayout elements interpolator.
             */
            moveElementInterpolator : new CAAT.Behavior.Interpolator().createExponentialOutInterpolator(2),

            /**
             * Defines insets:
             * @type {{ left, right, top, botton }}
             */
            padding : null,

            /**
             * Needs relayout ??
             */
            invalid : true,

            /**
             * Horizontal gap between children.
             */
            hgap        : 2,

            /**
             * Vertical gap between children.
             */
            vgap        : 2,

            /**
             * Animate on adding/removing elements.
             */
            animated    : false,

            /**
             * pending to be laid-out actors.
             */
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
