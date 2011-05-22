/**
 * based on http://www.kevs3d.co.uk/dev/canvask3d/scripts/mathlib.js 

function extend(subc, superc, overrides)
{
   var F = function() {};
   var i;

    if (overrides) {
        F.prototype = superc.prototype;
        subc.prototype = new F();
        subc.prototype.constructor = subc;
        subc.superclass = superc.prototype;
        if (superc.prototype.constructor == Object.prototype.constructor)   {
           superc.prototype.constructor = superc;
        }
       for (i in overrides) {
          if (overrides.hasOwnProperty(i)) {
             subc.prototype[i] = overrides[i];
          }
       }
    } else {

        subc.prototype.constructor = subc;
        subc.superclass= superc.prototype;
        if (superc.prototype.constructor == Object.prototype.constructor)   {
           superc.prototype.constructor = superc;
        }
        for( i in superc.prototype ) {
            if ( false==subc.prototype.hasOwnProperty(i)) {
                subc.prototype[i]= superc.prototype[i];
            }
        }

    }
}
 */

function extend(subc, superc) {
    var subcp = subc.prototype;

    var F = function() {
    };
    F.prototype = superc.prototype;

    subc.prototype = new F();       // chain prototypes.
    subc.superclass = superc.prototype;
    subc.prototype.constructor = subc;

    if (superc.prototype.constructor == Object.prototype.constructor) {
        superc.prototype.constructor = superc;
    }

    // los metodos de superc, que no esten en esta clase, crear un metodo que
    // llama al metodo de superc.
    for (var method in subcp) {
        if (subcp.hasOwnProperty(method)) {
            subc.prototype[method] = subcp[method];

            // tenemos en super un metodo con igual nombre.
            if ( superc.prototype[method] &&
                    superc.prototype[method].length==subcp[method].length ) {
                subc.prototype[method]= (function(fn, fnsuper) {
                    return function() {
                        var prevMethod= this.__super;

                        this.__super= fnsuper;

                        var retValue= fn.apply(
                                this,
                                Array.prototype.slice.call(arguments) );

                        this.__super= prevMethod;

                        return retValue;
                    }
                })(subc.prototype[method], superc.prototype[method]);
            }
        }
    }
}

function proxy(object, preMethod, postMethod, errorMethod) {

    /**
     * Only objects can be proxied. And not primitive ones!!!.
     */
    if ( !typeof object=='object' ||
            object.constructor==Array ||
            object.constructor==String ) {

        return object;
    }

    // Our proxy object class.
    var cproxy= function() {};
    // A new proxy instance.
    var proxy= new cproxy();
    // hold the proxied object as member. Needed to assign proper
    // context on proxy method call.
    proxy.__object= object;

    // For every element in the object to be proxied
    for( var method in object ) {
        // only function members
        if ( typeof object[method]=='function' ) {
            // add to the proxy object a method of equal signature to the
            // method present at the object to be proxied.
            // cache references of object, function and function name.
            proxy[method]= (function(proxy,fn,method) {
                return function() {
                    // call pre-method hook if present.
                    if ( preMethod ) {
                        preMethod({
                                object:     proxy.__object,
                                method:     method,
                                arguments:  Array.prototype.slice.call(arguments)} );
                    }
                    var retValue= null;
                    try {
                        // apply original object call with proxied object as
                        // function context.
                        retValue= fn.apply( proxy.__object, arguments );
                        // everything went right on function call, the call
                        // post-method hook if present
                        if ( postMethod ) {
                            postMethod({
                                    object:     proxy.__object,
                                    method:     method,
                                    arguments:  Array.prototype.slice.call(arguments)} );
                        }
                    } catch(e) {
                        // an exeception was thrown, call exception-method hook if
                        // present and return its result as execution result.
                        if( errorMethod ) {
                            retValue= errorMethod({
                                object:     proxy.__object,
                                method:     method,
                                arguments:  Array.prototype.slice.call(arguments),
                                exception:  e} );
                        } else {
                            // since there's no error hook, just throw the exception
                            throw e;
                        }
                    }

                    // return original returned value to the caller.
                    return retValue;
                }
            })(proxy,object[method],method);
        }
    }

    // return our newly created and populated of functions proxy object.
    return proxy;
}

/** proxy sample usage

var c0= new Meetup.C1(5);

var cp1= proxy(
        c1,
        function() {
            console.log('pre method on object: ',
                    arguments[0].object.toString(),
                    arguments[0].method,
                    arguments[0].arguments );
        },
        function() {
            console.log('post method on object: ',
                    arguments[0].object.toString(),
                    arguments[0].method,
                    arguments[0].arguments );

        },
        function() {
            console.log('exception on object: ',
                    arguments[0].object.toString(),
                    arguments[0].method,
                    arguments[0].arguments,
                    arguments[0].exception);

            return -1;
        });
 **/