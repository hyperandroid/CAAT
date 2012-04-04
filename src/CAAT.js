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

/**
 * Common bind function. Allows to set an object's function as callback. Set for every function in the
 * javascript context.
 */
Function.prototype.bind= Function.prototype.bind || function() {
    var fn=     this;                                   // the function
    var args=   Array.prototype.slice.call(arguments);  // copy the arguments.
    var obj=    args.shift();                           // first parameter will be context 'this'
    return function() {
        return fn.apply(
                obj,
                args.concat(Array.prototype.slice.call(arguments)));
    }
};

/*
Array.prototype.forEach = Array.prototype.forEach || function (fun) {
    var i;
    var len= this.length;

    if (typeof fun!=="function") {
        throw new TypeError();
    }

    var thisp = arguments[1];
    for (i= 0; i<len; i++) {
        if (i in this) {
            fun.call(thisp, this[i], i, this);
        }
    }
};
    */

