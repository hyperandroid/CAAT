CAAT.Module({
    /**
     * @name GenericBehavior
     * @memberOf CAAT.Behavior
     * @extends CAAT.Behavior.BaseBehavior
     * @constructor
     */
    defines:"CAAT.Behavior.GenericBehavior",
    depends:["CAAT.Behavior.BaseBehavior"],
    aliases:["CAAT.GenericBehavior"],
    extendsClass:"CAAT.Behavior.BaseBehavior",
    extendsWith:function () {

        return {

            /**
             *  @lends CAAT.Behavior.GenericBehavior.prototype
             */


            /**
             * starting value.
             */
            start:0,

            /**
             * ending value.
             */
            end:0,

            /**
             * target to apply this generic behvior.
             */
            target:null,

            /**
             * property to apply values to.
             */
            property:null,

            /**
             * this callback will be invoked for every behavior application.
             */
            callback:null,

            /**
             * @inheritDoc
             */
            setForTime:function (time, actor) {
                var value = this.start + time * (this.end - this.start);
                if (this.callback) {
                    this.callback(value, this.target, actor);
                }

                if (this.property) {
                    this.target[this.property] = value;
                }
            },

            /**
             * Defines the values to apply this behavior.
             *
             * @param start {number} initial behavior value.
             * @param end {number} final behavior value.
             * @param target {object} an object. Usually a CAAT.Actor.
             * @param property {string} target object's property to set value to.
             * @param callback {function} a function of the form <code>function( target, value )</code>.
             */
            setValues:function (start, end, target, property, callback) {
                this.start = start;
                this.end = end;
                this.target = target;
                this.property = property;
                this.callback = callback;
                return this;
            }
        };
    }
});
