(function(global) {

    String.prototype.endsWith= function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };

    Function.prototype.bind = Function.prototype.bind || function () {
                var fn = this;                                   // the function
                var args = Array.prototype.slice.call(arguments);  // copy the arguments.
                var obj = args.shift();                           // first parameter will be context 'this'
                return function () {
                    return fn.apply(
                        obj,
                        args.concat(Array.prototype.slice.call(arguments)));
                }
            };

    isArray = function (input) {
        return typeof(input) == 'object' && (input instanceof Array);
    };
    isString = function (input) {
        return typeof(input) == 'string';
    };
    isFunction = function( input ) {
        return typeof input == "function"
    }

    var initializing = false;

    // The base Class implementation (does nothing)
    var Class = function () {
    };

    // Create a new Class that inherits from this class
    Class.extend = function (extendingProt, constants, name, aliases, flags) {

        var _super = this.prototype;

        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        var prototype = new this();
        initializing = false;

        // The dummy class constructor
        function CAATClass() {
            // All construction is actually done in the init method
            if (!initializing && this.__init) {
                this.__init.apply(this, arguments);
            }
        }

        // Populate our constructed prototype object
        CAATClass.prototype = prototype;
        // Enforce the constructor to be what we expect
        CAATClass.prototype.constructor = CAATClass;
        CAATClass.superclass = _super;
        // And make this class extendable
        CAATClass.extend = Class.extend;

        assignNamespace( name, CAATClass );
        if ( constants ) {
            for( var constant in constants ) {
                if ( constants.hasOwnProperty(constant) ) {
                    CAATClass[ constant ]= constants[constant];
                }
            }
        }

        if ( aliases ) {
            if ( !isArray(aliases) ) {
                aliases= [aliases];
            }
            for( var i=0; i<aliases.length; i++ ) {
                ensureNamespace( aliases[i] );
                var ns= assignNamespace( aliases[i], CAATClass );

                // assign constants to alias classes.
                if ( constants ) {
                    for( var constant in constants ) {
                        if ( constants.hasOwnProperty(constant) ) {
                            ns[ constant ]= constants[constant];
                        }
                    }
                }
            }
        }

        extendingProt= (isFunction(extendingProt) ? extendingProt() : extendingProt);

        // Copy the properties over onto the new prototype
        for (var fname in extendingProt) {
            // Check if we're overwriting an existing function
            prototype[fname] = ( (fname === "__init" || (flags && flags.decorated) ) && isFunction(extendingProt[fname]) && isFunction(_super[fname]) ) ?
                (function (name, fn) {
                    return function () {
                        var tmp = this.__super;
                        this.__super = _super[name];
                        var ret = fn.apply(this, arguments);
                        this.__super = tmp;
                        return ret;
                    };
                })(fname, extendingProt[fname]) :

                extendingProt[fname];
        }

        return CAATClass;
    }

    var Node= function( obj ) { //name, dependencies, callback ) {
        this.name= obj.defines;
        this.extendWith= obj.extendsWith;
        this.callback= obj.onCreate;
        this.callbackPreCreation= obj.onPreCreate;
        this.dependencies= obj.depends;
        this.baseClass= obj.extendsClass;
        this.aliases= obj.aliases;
        this.constants= obj.constants;
        this.decorated= obj.decorated;

        this.children= [];

        return this;
    };

    Node.prototype= {
        children:       null,
        name:           null,
        extendWith:     null,
        callback:       null,
        dependencies:   null,
        baseClass:      null,
        aliases:        null,
        constants:      null,

        decorated:      false,

        solved:         false,
        visited:        false,

        status : function() {
            console.log("  Module: "+this.name+
                (this.dependencies.length ?
                    (" unsolved_deps:["+this.dependencies+"]") :
                    " no dependencies.")+
                ( this.solved ? " solved" : " ------> NOT solved.")
            );
        },

        removeDependency : function( modulename ) {
            for( var i=0; i<this.dependencies.length; i++ ) {
                if ( this.dependencies[i]===modulename ) {
                    this.dependencies.splice(i,1);
                    break;
                }
            }


        },

        assignDependency : function( node ) {

            var i;
            for( i=0; i<this.dependencies.length; i++ ) {
                if ( this.dependencies[i] === node.name ) {
                    this.children.push( node );
                    this.dependencies.splice(i,1);
//                    console.log("Added dependency: "+node.name+" on "+this.name);
                    break;
                }
            }
        },

        isSolved : function() {
            return this.solved;
        },

        solveDeep : function() {

            if ( this.visited ) {
                return true;
            }

            this.visited= true;

            if ( this.solved ) {
                return true;
            }

            if ( this.dependencies.length!==0 ) {
                return false;
            }

            var b= true;
            for( var i=0; i<this.children.length; i++ ) {
                if (! this.children[i].solveDeep() ) {
                    return false;
                }
            }

            //////
            this.__initModule();

            this.solved= true;
            mm.solved( this );

            return true;
        },

        __initModule : function() {

            var c= null;
            if ( this.baseClass ) {
                c= findClass( this.baseClass );

                if ( !c ) {
                    console.log("  "+this.name+" -> Can't extend non-existant class: "+this.baseClass );
                    return;
                }

                c= c.extend(
                    this.extendWith,
                    this.constants,
                    this.name,
                    this.aliases,
                    { decorated : this.decorated } );

            } else {
                c= Class.extend(
                    this.extendWith,
                    this.constants,
                    this.name,
                    this.aliases,
                    { decorated : this.decorated } );
            }

            console.log("Created module: "+this.name);

            if ( this.callback ) {
                this.callback();
            }

        }
    };

    var ScriptFile= function(path, module) {
        this.path= path;
        this.module= module;
        return this;
    }

    ScriptFile.prototype= {
        path : null,
        processed: false,
        module: null,

        setProcessed : function() {
            this.processed= true;
        },

        isProcessed : function() {
            return this.processed;
        }
    };

    var ModuleManager= function() {
        this.nodes= [];
        this.loadedFiles= [];
        this.path= {};
        this.solveListener= [];
        this.orderedSolvedModules= [];
        this.readyListener= [];

        return this;
    };

    ModuleManager.baseURL= "";
    ModuleManager.modulePath= {};
    ModuleManager.sortedModulePath= [];

    ModuleManager.prototype= {

        nodes:      null,           // built nodes.
        loadedFiles:null,           // list of loaded files. avoid loading each file more than once
        solveListener: null,        // listener for a module solved
        readyListener: null,        // listener for all modules solved
        orderedSolvedModules: null, // order in which modules where solved.

        addSolvedListener : function( modulename, callback ) {
            this.solveListener.push( {
                name : modulename,
                callback : callback
            });
        },

        solved : function( module ) {
            var i;

            for( i=0; i<this.solveListener.length; i++ ) {
                if ( this.solveListener[i].name===module.name) {
                    this.solveListener[i].callback();
                }
            }

            this.orderedSolvedModules.push( module );

            this.notifyReady();
        },

        notifyReady : function() {
            var i;

            for( i=0; i<this.nodes.length; i++ ) {
                if ( !this.nodes[i].isSolved() ) {
                    return;
                }
            }

            // if there's any pending files to be processed, still not notify about being solved.
            for( i=0; i<this.loadedFiles.length; i++ ) {
                if ( !this.loadedFiles[i].isProcessed() ) {
                    // aun hay ficheros sin procesar, no notificar.
                    return;
                }
            }

            /**
             * Make ModuleManager.bring reentrant.
             */
            var me= this;
            var arr= Array.prototype.slice.call(this.readyListener);
            setTimeout( function() {
                for( var i=0; i<arr.length; i++ ) {
                    arr[i]();
                }
            }, 0 );

            this.readyListener= [];
        },

        status : function() {
            for( var i=0; i<this.nodes.length; i++ ) {
                this.nodes[i].status();
            }
        },

        module : function( obj ) {//name, dependencies, callback ) {

            var node, nnode, i;

            if ( this.isModuleScheduledToSolve( obj.defines ) ) {
//                console.log("Discarded module: "+obj.class+" (already loaded)");
                return this;
            }

            if ( obj.onPreCreate ) {
//                console.log("  --> "+obj.defines+" onPrecreation");
                try {
                    obj.onPreCreate();
                } catch(e) {
                    console.log("  -> catched "+e+" on module "+obj.defines+" preCreation.");
                }
            }

            if (!obj.depends ) {
                obj.depends= [];
            }

            var dependencies= obj.depends;

            if ( dependencies ) {
                if ( !isArray(dependencies) ) {
                    dependencies= [ dependencies ];
                    obj.depends= dependencies;
                }
            }

            // elimina dependencias ya resueltas en otras cargas.
            i=0;
            while( i<dependencies.length ) {
                if ( this.alreadySolved( dependencies[i] ) ) {
                     dependencies.splice(i,1);
                } else {
                    i++;
                }
            }

            nnode= new Node( obj );

            // asignar nuevo nodo a quien lo tenga como dependencia.
            for( var i=0; i<this.nodes.length; i++ ) {
                this.nodes[i].assignDependency(nnode);
            }
            this.nodes.push( nnode );

            /**
             * Making dependency resolution a two step process will allow us to pack all modules into one
             * single file so that the module manager does not have to load external files.
             * Useful when MoMa has been packed into one single bundle.
             */

            /**
             * remove already loaded modules dependencies.
             */
            for( i=0; i<obj.depends.length;  ) {

                if ( this.isModuleScheduledToSolve( obj.depends[i] ) ) {
                    var dep= this.findNode( obj.depends[i] );
                    if ( null!==dep ) {
                        nnode.assignDependency( dep );
                    } else {
                        //// ERRR
                        alert("Module loaded and does not exist in loaded modules nodes. "+obj.depends[i]);
                        i++;
                    }
                } else {
                    i+=1;
                }
            }

            /**
             * now, for the rest of non solved dependencies, load their files.
             */
            (function(mm, obj) {
                setTimeout( function() {
                    for( i=0; i<obj.depends.length; i++ ) {
                        mm.loadFile( obj.depends[i] );
                    }
                }, 0 );
            })(this, obj);

            return this;

        },

        findNode : function( name ) {
            for( var i=0; i<this.nodes.length; i++ ) {
                if ( this.nodes[i].name===name ) {
                    return this.nodes[i];
                }
            }

            return null;
        } ,

        alreadySolved : function( name ) {
            for( var i= 0; i<this.nodes.length; i++ ) {
                if ( this.nodes[i].name===name && this.nodes[i].isSolved() ) {
                    return true;
                }
            }

            return false;
        },

        loadFile : function( module ) {

            var path= this.getPath( module );

            // avoid loading any js file more than once.
            for( var i=0; i<this.loadedFiles.length; i++ ) {
                if ( this.loadedFiles[i].path===path ) {
                    return;
                }
            }

            var sf= new ScriptFile( path, module );
            this.loadedFiles.push( sf );

            var node= document.createElement("script");
            node.type = 'text/javascript';
            node.charset = 'utf-8';
            node.async = true;
            node.addEventListener('load', this.moduleLoaded.bind(this), false);
            node.addEventListener('error', this.moduleErrored.bind(this), false);
            node.setAttribute('module-name', module);
            node.src = path+(!DEBUG ? "?"+(new Date().getTime()) : "");

            document.getElementsByTagName('head')[0].appendChild( node );

        },

        /**
         * Resolve a module name.
         *
         *  + if the module ends with .js
         *    if starts with /, return as is.
         *    else reppend baseURL and return.
         *
         * @param module
         */
        getPath : function( module ) {

            // endsWith
            if ( module.endsWith(".js") ) {
                if ( module.charAt(0)!=="/" ) {
                    module= ModuleManager.baseURL+module;
                } else {
                    module= module.substring(1);
                }
                return module;
            }

            //for( var modulename in ModuleManager.modulePath ) {
            for( var i=0; i<ModuleManager.sortedModulePath.length; i++ ) {
                var modulename= ModuleManager.sortedModulePath[i];

                if ( ModuleManager.modulePath.hasOwnProperty(modulename) ) {
                    var path= ModuleManager.modulePath[modulename];

                    // startsWith
                    if ( module.indexOf(modulename)===0 ) {
                        // +1 to skip '.' class separator.
                        var nmodule= module.substring(modulename.length + 1);

                        /**
                         * Avoid name clash:
                         * MoMa.Foundation and MoMa.Foundation.Timer will both be valid for
                         * MoMa.Foundation.Timer.TimerManager module.
                         * So in the end, the module name can't have '.' after chopping the class
                         * namespace.
                         */

                        nmodule= nmodule.replace(/\./g,"/");

                        //if ( nmodule.indexOf(".")===-1 ) {
                            nmodule= path+nmodule+".js";
                            return ModuleManager.baseURL + nmodule;
                        //}
                    }
                }
            }

            // what's that ??!?!?!?
            return module;
        },

        isModuleScheduledToSolve : function( name ) {
            for( var i=0; i<this.nodes.length; i++ ) {
                if ( this.nodes[i].name===name ) {
                    return true;
                }
            }
            return false;
        },

        moduleLoaded : function(e) {
            if (e.type==="load") {

                var node = e.currentTarget || e.srcElement;
                var mod= node.getAttribute("module-name");

                // marcar fichero de modulo como procesado.
                for( var i=0; i<this.loadedFiles.length; i++ ) {
                    if ( this.loadedFiles[i].module===mod ) {
                        this.loadedFiles[i].setProcessed();
                        break;
                    }
                }

                for( var i=0; i<this.nodes.length; i++ ) {
                    this.nodes[i].removeDependency( mod );
                }

                for( var i=0; i<this.nodes.length; i++ ) {
                    for( var j=0; j<this.nodes.length; j++ ) {
                        this.nodes[j].visited= false;
                    }
                    this.nodes[i].solveDeep();
                }

                /**
                 * Despues de cargar un fichero, este puede contener un modulo o no.
                 * Si todos los ficheros que se cargan fueran bibliotecas, nunca se pasaria de aqui porque
                 * no se hace una llamada a solveDeep, y notificacion a solved, y de ahí a notifyReady.
                 * Por eso se hace aqui una llamada a notifyReady, aunque pueda ser redundante.
                 */
                var me= this;
                setTimeout(function() {
                    me.notifyReady();
                }, 0 );
            }
        },

        moduleErrored : function(e) {
            var node = e.currentTarget || e.srcElement;
            console.log("Error loading module: "+ node.getAttribute("module-name") );
        },

        solvedInOrder : function() {
            for( var i=0; i<this.orderedSolvedModules.length; i++ ) {
                console.log(this.orderedSolvedModules[i].name);
            }
        },

        solveAll : function() {
            for( var i=0; i<this.nodes.length; i++ ) {
                this.nodes[i].solveDeep();
            }
        },

        onReady : function( f ) {
            this.readyListener.push(f);
        }

    };

    function ensureNamespace( qualifiedClassName ) {
        var ns= qualifiedClassName.split(".");
        var _global= global;
        for( var i=0; i<ns.length-1; i++ ) {
            if ( !_global[ns[i]] ) {
                _global[ns[i]]= {};
            }
            _global= _global[ns[i]];
        }
    }

    /**
     *
     * Create a namespace object from a string.
     *
     * @param namespace {string}
     * @param obj {object}
     * @return {object} the namespace object
     */
    function assignNamespace( namespace, obj ) {
        var ns= namespace.split(".");
        var _global= global;
        for( var i=0; i<ns.length-1; i++ ) {
            if ( !_global[ns[i]] ) {
                console.log("    Error assigning value to namespace :"+namespace+". '"+ns[i]+"' does not exist.");
                return null;
            }

            _global= _global[ns[i]];
        }

        _global[ ns[ns.length-1] ]= obj;

        return _global[ ns[ns.length-1] ];
    }

    function findClass( qualifiedClassName ) {
        var ns= qualifiedClassName.split(".");
        var _global= global;
        for( var i=0; i<ns.length; i++ ) {
            if ( !_global[ns[i]] ) {
                return null;
            }

            _global= _global[ns[i]];
        }

        return _global;
    }

    var mm= new ModuleManager();
    var DEBUG= false;

    global.MoMa= global.MoMa || {};

    /**
     *
     * @param obj {
     *   defines{string},             // class name
     *   depends{Array<string>=},   // dependencies class names
     *   extendsClass{string},            // class to extend from
     *   extensdWith{object},        // actual prototype to extend
     *   aliases{Array<string>},    // other class names
     *   onCreation{function=}        // optional callback to call after class creation.
     *   onPreCreation{function=}        // optional callback to call after namespace class creation.
     * }
     */
    MoMa.Module= function loadModule(obj) {

        if (!obj.defines) {
            console.error("Bad module definition: "+obj);
            return;
        }

        ensureNamespace(obj.defines);

        mm.module( obj );

    };

    MoMa.ModuleManager= {};

    MoMa.ModuleManager.baseURL= function(baseURL) {

        if ( !baseURL ) {
            return MoMa.Module;
        }

        if (!baseURL.endsWith("/") ) {
            baseURL= baseURL + "/";
        }

        ModuleManager.baseURL= baseURL;
        return MoMa.ModuleManager;
    };

    MoMa.ModuleManager.setModulePath= function( module, path ) {

        if ( !path.endsWith("/") ) {
            path= path + "/";
        }

        if ( !ModuleManager.modulePath[module] ) {
            ModuleManager.modulePath[ module ]= path;

            ModuleManager.sortedModulePath.push( module );
            ModuleManager.sortedModulePath.sort( function(a,b) {
                return a<b;
            } );
        }
        return MoMa.ModuleManager;
    };

    MoMa.ModuleManager.bring= function( file ) {

        if ( !isArray(file) ) {
            file= [file];
        }

        for( var i=0; i<file.length; i++ ) {
            mm.loadFile( file[i] );
        }

        return MoMa.ModuleManager;
    };

    MoMa.ModuleManager.status= function() {
        mm.status();
    }

    MoMa.ModuleManager.addModuleSolvedListener= function(modulename,callback) {
        mm.addSolveListener( modulename, callback );
        return MoMa.ModuleManager;
    }

    MoMa.ModuleManager.load= function(file, onload, onerror) {
        var node= document.createElement("script");
        node.type = 'text/javascript';
        node.charset = 'utf-8';
        node.async = true;
        if ( onload ) {
            node.addEventListener('load', onload, false);
        }
        if ( onerror ) {
            node.addEventListener('error', onerror, false);
        }

        node.addEventListener("load", function( ) {
            mm.solveAll();
        }, false);

        node.src = file+(!DEBUG ? "?"+(new Date().getTime()) : "");

        document.getElementsByTagName('head')[0].appendChild( node );

        // maybe this file has all the modules needed so no more file loading/module resolution must be performed.

    }

    MoMa.ModuleManager.solvedInOrder= function() {
        mm.solvedInOrder();
    }

    MoMa.ModuleManager.onReady= function(f) {
        mm.onReady(f);
        return MoMa.ModuleManager;
    }

    MoMa.ModuleManager.solveAll= function() {
        mm.solveAll();
    }

    MoMa.ModuleManager.debug= function(d) {
        DEBUG= d;
        return MoMa.ModuleManager;
    }

})(this);
