CAAT.Module( {

    /**
     * @name TouchInfo
     * @memberOf CAAT.Event
     * @constructor
     */

    defines : "CAAT.Event.TouchInfo",
    aliases : ["CAAT.TouchInfo"],
    extendsWith : {

        /**
         * @lends CAAT.Event.TouchInfo.prototype
         */

        /**
         * Constructor delegate.
         * @param id {number}
         * @param x {number}
         * @param y {number}
         * @param target {DOMElement}
         * @private
         */
        __init : function( id, x, y, target ) {

            this.identifier= id;
            this.clientX= x;
            this.pageX= x;
            this.clientY= y;
            this.pageY= y;
            this.target= target;
            this.time= new Date().getTime();

            return this;
        }
    }
});
