CAAT.Module( {

    /**
     * @name BorderLayout
     * @memberOf CAAT.Foundation.UI.Layout
     * @extends CAAT.Foundation.UI.Layout.LayoutManager
     * @constructor
     */

    defines : "CAAT.Foundation.UI.Layout.BorderLayout",
    aliases : ["CAAT.UI.BorderLayout"],
    depends : [
        "CAAT.Foundation.UI.Layout.LayoutManager",
        "CAAT.Math.Dimension"
    ],
    extendsClass : "CAAT.Foundation.UI.Layout.LayoutManager",
    extendsWith : {

        /**
         * @lends CAAT.Foundation.UI.Layout.BorderLayout.prototype
         */


        __init : function() {
            this.__super();
            return this;
        },

        /**
         * An actor to position left.
         */
        left    : null,

        /**
         * An actor to position right.
         */
        right   : null,

        /**
         * An actor to position top.
         */
        top     : null,

        /**
         * An actor to position botton.
         */
        bottom  : null,

        /**
         * An actor to position center.
         */
        center  : null,

        addChild : function( child, constraint ) {

            if ( typeof constraint==="undefined" ) {
                constraint="center";
            }

            CAAT.Foundation.UI.Layout.BorderLayout.superclass.addChild.call( this, child, constraint );

            if ( constraint==="left" ) {
                this.left= child;
            } else if ( constraint==="right" ) {
                this.right= child;
            } else if ( constraint==="top" ) {
                this.top= child;
            } else if ( constraint==="bottom" ) {
                this.bottom= child;
            } else {
                //"center"
                this.center= child;
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
            var dim= new CAAT.Math.Dimension();

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

            CAAT.Foundation.UI.Layout.BorderLayout.superclass.doLayout.call(this, container);
        }


    }

});
