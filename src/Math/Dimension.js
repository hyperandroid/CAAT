CAAT.Module({

    /**
     * @name Dimension
     * @memberOf CAAT.Math
     * @constructor
     */


    defines:"CAAT.Math.Dimension",
    aliases:["CAAT.Dimension"],
    extendsWith:function () {
        return {

            /**
             * @lends CAAT.Math.Dimension.prototype
             */

            /**
             * Width dimension.
             */
            width:0,

            /**
             * Height dimension.
             */
            height:0,

            __init:function (w, h) {
                this.width = w;
                this.height = h;
                return this;
            }
        }
    }
});
