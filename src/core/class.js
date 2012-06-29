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

isArray= function(input) { return typeof(input)=='object'&&(input instanceof Array); };
isString= function(input){ return typeof(input)=='string'; };


/**
 * See LICENSE file.
 *
 * Extend a prototype with another to form a classical OOP inheritance procedure.
 *
 * @param subc {object} Prototype to define the base class
 * @param superc {object} Prototype to be extended (derived class).
 */
function extend(subc, superc) {
    var subcp = subc.prototype;

    // Class pattern.
    var F = function() {
    };
    F.prototype = superc.prototype;

    subc.prototype = new F();       // chain prototypes.
    subc.superclass = superc.prototype;
    subc.prototype.constructor = subc;

    // Reset constructor. See Object Oriented Javascript for an in-depth explanation of this.
    if (superc.prototype.constructor === Object.prototype.constructor) {
        superc.prototype.constructor = superc;
    }

    // los metodos de superc, que no esten en esta clase, crear un metodo que
    // llama al metodo de superc.
    for (var method in subcp) {
        if (subcp.hasOwnProperty(method)) {
            subc.prototype[method] = subcp[method];

/**
 * Sintactic sugar to add a __super attribute on every overriden method.
 * Despite comvenient, it slows things down by 5fps.
 *
 * Uncomment at your own risk.
 *
            // tenemos en super un metodo con igual nombre.
            if ( superc.prototype[method]) {
                subc.prototype[method]= (function(fn, fnsuper) {
                    return function() {
                        var prevMethod= this.__super;

                        this.__super= fnsuper;

                        var retValue= fn.apply(
                                this,
                                Array.prototype.slice.call(arguments) );

                        this.__super= prevMethod;

                        return retValue;
                    };
                })(subc.prototype[method], superc.prototype[method]);
            }
            */
        }
    }
}

/**
 * Dynamic Proxy for an object or wrap/decorate a function.
 *
 * @param object
 * @param preMethod
 * @param postMethod
 * @param errorMethod
 */
function proxy(object, preMethod, postMethod, errorMethod) {

    // proxy a function
    if ( typeof object==='function' ) {

        if ( object.__isProxy ) {
            return object;
        }

        return (function(fn) {

            var proxyfn= function() {
                if ( preMethod ) {
                    preMethod({
                            fn: fn,
                            arguments:  Array.prototype.slice.call(arguments)} );
                }
                var retValue= null;
                try {
                    // apply original function call with itself as context
                    retValue= fn.apply(fn, Array.prototype.slice.call(arguments));
                    // everything went right on function call, then call
                    // post-method hook if present
                    if ( postMethod ) {
                        retValue= postMethod({
                                fn: fn,
                                arguments:  Array.prototype.slice.call(arguments)} );
                    }
                } catch(e) {
                    // an exeception was thrown, call exception-method hook if
                    // present and return its result as execution result.
                    if( errorMethod ) {
                        retValue= errorMethod({
                            fn: fn,
                            arguments:  Array.prototype.slice.call(arguments),
                            exception:  e} );
                    } else {
                        // since there's no error hook, just throw the exception
                        throw e;
                    }
                }

                // return original returned value to the caller.
                return retValue;
            };
            proxyfn.__isProxy= true;

            for( var method in fn ) {
                if ( typeof fn[method]!=="function" ) {
                    if (method!=="__object" && method!=="__isProxy") {
                        (function(proxyfn, fn) {
                            proxyfn.__defineGetter__( method, function() {
                                return fn[method];
                            });
                            proxyfn.__defineSetter__( method, function(vale) {
                                fn[method]= vale;
                            });
                        })(proxyfn, fn);
                    }
                }
            }


            return proxyfn;

        })(object);
    }

    /**
     * If not a function then only non privitive objects can be proxied.
     * If it is a previously created proxy, return the proxy itself.
     */
    if ( !typeof object==='object' ||
            isArray(object) ||
            isString(object) ||
            object.__isProxy ) {

        return object;
    }

    // Our proxy object class.
    var cproxy= function() {};
    // A new proxy instance.
    var proxy= new cproxy();
    // hold the proxied object as member. Needed to assign proper
    // context on proxy method call.
    proxy.__object= object;
    proxy.__isProxy= true;

    // For every element in the object to be proxied
    for( var method in object ) {

        // only function members
        if ( typeof object[method]==='function' ) {
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
                };
            })(proxy,object[method],method);
        } else {
            if (method!=="__object" && method!=="__isProxy") {
                (function(proxy, method) {
                    proxy.__defineGetter__( method, function() {
                        return proxy.__object[method];
                    });
                    proxy.__defineSetter__( method, function(vale) {
                        proxy.__object[method]= vale;
                    });
                })(proxy, method);
            }
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

function proxify( ns, preMethod, postMethod, errorMethod, getter, setter ) {

    var nns= "__"+ns+"__";

    var obj= window;
    var path= ns.split(".");
    while( path.length>1) {
        obj= obj[ path.shift() ];
    }

    window[nns] = obj[path];

    (function(root,obj,path, nns,ns) {
        var newC= function() {
            console.log("Creating object of type proxy["+ns+"]");
            var obj= new root[nns]( Array.prototype.slice.call(arguments) );

            obj.____name= ns;
            return proxyObject( obj, preMethod, postMethod, errorMethod, getter, setter );

        };

        // set new constructor function prototype as previous one.
        newC.prototype= root[nns].prototype;

        for( var method in obj[path] ) {
            if ( typeof obj[path][method]!=="function" ) {
                if (method!=="__object" && method!=="__isProxy") {
                    (function(prevConstructor, method, newC) {
                        newC.__defineGetter__( method, function() {
                            return prevConstructor[method];
                        });
                        newC.__defineSetter__( method, function(vale) {
                            prevConstructor[method]= vale;
                        });
                    })(obj[path],method,newC);
                }
            }
        }

        obj[path]= newC;

    })(window,obj,path,nns,ns);

}

function proxyObject(object, preMethod, postMethod, errorMethod, getter, setter) {

    /**
     * If not a function then only non privitive objects can be proxied.
     * If it is a previously created proxy, return the proxy itself.
     */
    if ( !typeof object==='object' ||
            isArray(object) ||
            isString(object) ||
            object.__isProxy ) {

        return object;
    }

    // hold the proxied object as member. Needed to assign proper
    // context on proxy method call.
    object.$proxy__isProxy= true;

    // For every element in the object to be proxied
    for( var method in object ) {

        if ( method==="constructor" ) {
            continue;
        }

        // only function members
        if ( typeof object[method]==='function' ) {

            var fn= object[method];
            object["$proxy__"+method]= fn;

            object[method]= (function(object,fn,fnname) {
                return function() {

                    var args= Array.prototype.slice.call(arguments);

                    // call pre-method hook if present.
                    if ( preMethod ) {
                        preMethod({
                                object:     object,
                                objectName: object.____name,
                                method:     fnname,
                                arguments:  args } );
                    }
                    var retValue= null;
                    try {
                        // apply original object call with proxied object as
                        // function context.
                        retValue= fn.apply( object, args );
                        // everything went right on function call, the call
                        // post-method hook if present
                        if ( postMethod ) {
                            var rr= postMethod({
                                    object:     object,
                                    objectName: object.____name,
                                    method:     fnname,
                                    arguments:  args } );
                            /*
                            if ( typeof rr!=="undefined" ) {
                                //retValue= rr;
                            }
                            */
                        }
                    } catch(e) {
                        // an exeception was thrown, call exception-method hook if
                        // present and return its result as execution result.
                        if( errorMethod ) {
                            retValue= errorMethod({
                                object:     object,
                                objectName: object.____name,
                                method:     fnname,
                                arguments:  args,
                                exception:  e} );
                        } else {
                            // since there's no error hook, just throw the exception
                            throw e;
                        }
                    }

                    // return original returned value to the caller.
                    return retValue;
                };
            })(object,fn,method);
        } else {
            if ( method!=="____name" ) {
                (function(object, attribute, getter, setter) {

                    object["$proxy__"+attribute]= object[attribute];

                    object.__defineGetter__( attribute, function() {
                        if ( getter) {
                            getter( object.____name, attribute );
                        }
                        return object["$proxy__"+attribute];
                    });
                    object.__defineSetter__( attribute, function (value) {
                        object["$proxy__"+attribute] = value;
                        if ( setter ) {
                            setter( object.____name, attribute, value );
                        }
                    });
                })( object, method, getter, setter );
            }
        }
    }

    // return our newly created and populated with functions proxied object.
    return object;
}