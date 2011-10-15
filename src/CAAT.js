/**
 * See LICENSE file.
 *
 * Library namespace.
 * CAAT stands for: Canvas Advanced Animation Tookit.
 */

/**
 * @namespace
 */
var CAAT= CAAT || {};

Function.prototype.bind= function() {
    var fn=     this;                                   // the function
    var args=   Array.prototype.slice.call(arguments);  // copy the arguments.
    var obj=    args.shift();                           // first parameter will be context 'this'
    return function() {
        return fn.apply(
                obj,
                args.concat(Array.prototype.slice.call(arguments)));
    }
};
