CAAT.Module({
    defines:"CAAT.Behavior.GenericBehavior",
    depends:["CAAT.Behavior.BaseBehavior"],
    aliases:["CAAT.GenericBehavior"],
    extendsClass:"CAAT.Behavior.BaseBehavior",
    extendsWith:function () {

        return {

            start:0,
            end:0,
            target:null,
            property:null,
            callback:null,

            /**
             * Sets the target objects property to the corresponding value for the given time.
             * If a callback function is defined, it is called as well.
             *
             * @param time {number} the scene time to apply the behavior at.
             * @param actor {CAAT.Actor} a CAAT.Actor object instance.
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
