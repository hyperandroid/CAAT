
extend = function (subc, superc) {
    var subcp = subc.prototype;

    // Class pattern.
    var CAATObject = function () {
    };
    CAATObject.prototype = superc.prototype;

    subc.prototype = new CAATObject();       // chain prototypes.
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
};


extendWith = function (base, subclass, with_object) {
    var CAATObject = function () {
    };

    CAATObject.prototype = base.prototype;

    subclass.prototype = new CAATObject();
    subclass.superclass = base.prototype;
    subclass.prototype.constructor = subclass;

    if (base.prototype.constructor === Object.prototype.constructor) {
        base.prototype.constructor = base;
    }

    if (with_object) {
        for (var method in with_object) {
            if (with_object.hasOwnProperty(method)) {
                subclass.prototype[ method ] = with_object[method];
                /*
                 if ( base.prototype[method]) {
                 subclass.prototype[method]= (function(fn, fnsuper) {
                 return function() {
                 var prevMethod= this.__super;
                 this.__super= fnsuper;
                 var retValue= fn.apply(this, arguments );
                 this.__super= prevMethod;

                 return retValue;
                 };
                 })(subclass.prototype[method], base.prototype[method]);
                 }
                 /**/
            }
        }
    }
};



function proxyFunction(object, method, preMethod, postMethod, errorMethod) {

    return function () {

        var args = Array.prototype.slice.call(arguments);

        // call pre-method hook if present.
        if (preMethod) {
            preMethod({
                object: object,
                method: method,
                arguments: args });
        }

        var retValue = null;

        try {
            // apply original object call with proxied object as
            // function context.
            retValue = object[method].apply(object, args);

            // everything went right on function call, the call
            // post-method hook if present
            if (postMethod) {
                /*var rr= */
                var ret2 = postMethod({
                    object: object,
                    method: method,
                    arguments: args });

                if (ret2) {
                    retValue = ret2;
                }
            }
        } catch (e) {
            // an exeception was thrown, call exception-method hook if
            // present and return its result as execution result.
            if (errorMethod) {
                retValue = errorMethod({
                    object: object,
                    method: method,
                    arguments: args,
                    exception: e});
            } else {
                // since there's no error hook, just throw the exception
                throw e;
            }
        }

        // return original returned value to the caller.
        return retValue;
    };

}

function proxyAttribute( proxy, object, attribute, getter, setter) {

    proxy.__defineGetter__(attribute, function () {
        if (getter) {
            getter(object, attribute);
        }
        return object[attribute];
    });
    proxy.__defineSetter__(attribute, function (value) {
        object[attribute] = value;
        if (setter) {
            setter(object, attribute, value);
        }
    });
}

function proxyObject(object, preMethod, postMethod, errorMethod, getter, setter) {

    /**
     * If not a function then only non privitive objects can be proxied.
     * If it is a previously created proxy, return the proxy itself.
     */
    if (typeof object !== 'object' || isArray(object) || isString(object) || object.$proxy) {
        return object;
    }

    var proxy = {};

    // hold the proxied object as member. Needed to assign proper
    // context on proxy method call.
    proxy.$proxy = true;
    proxy.$proxy_delegate = object;

    // For every element in the object to be proxied
    for (var method in object) {

        if (method === "constructor") {
            continue;
        }

        // only function members
        if (typeof object[method] === 'function') {
            proxy[method] = proxyFunction(object, method, preMethod, postMethod, errorMethod );
        } else {
            proxyAttribute(proxy, object, method, getter, setter);
        }
    }

    // return our newly created and populated with functions proxied object.
    return proxy;
}


CAAT.Module({
    defines : "CAAT.Core.Class",
    extendsWith : function() {

        /**
         * See LICENSE file.
         *
         * Extend a prototype with another to form a classical OOP inheritance procedure.
         *
         * @param subc {object} Prototype to define the base class
         * @param superc {object} Prototype to be extended (derived class).
         */


        return {

        };
    }
});