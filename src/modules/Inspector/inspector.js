/**
 * See LICENSE file.
 *
 *
 *
 */

(function() {
    var Inspector= function() {
        return this;
    };

    Inspector.prototype= {

        initialize : function(root) {

            if ( !root ) {
                root= CAAT;
            }

            CAAT.log("Analyzing "+root.toString()+" for reflection info.");
            for( var clazz in root ) {
                if ( root[clazz].__reflectionInfo ) {
                    CAAT.log("  Extracting reflection info for: "+root[clazz] );
                    this.extractReflectionInfo( root[clazz] );
                }
            }
        },

        extractReflectionInfo : function( object ) {
            var ri= object.__reflectionInfo;
            var key;
            var i;
            var __removeEmpty= function( el, index, array ) {
                array[index]= array[index].trim();
                if ( array[index]==="" ) array.splice(index,1);
            };

            reflection[ object ]= {};

            for( key in ri ) {
                var metadata= ri[key];
                CAAT.log("    reflection info for: "+key+"="+metadata );

                var ks= key.split(",");
                var data= metadata.split(",");

                ks.forEach( __removeEmpty );
                data.forEach( __removeEmpty );

                if ( ks.length===1 ) {  // one property.
                    data.forEach( function( el, index, array ) {
                        // el is each metadata definition of the form: key:value
                        var operation= el.split(":");
                        operation.forEach( __removeEmpty );
                        if ( operation.length!=2 ) {
                            CAAT.log("      ERR. operation: "+el+" wrong format");
                        } else {
                            if ( operation[0]==="set" ) {
                                CAAT.log("set="+operation[1]);
                            } else if ( operation[0]==="get" ) {
                                CAAT.log("get="+operation[1]);
                            } else if ( operation[0]==="type" ) {
                                CAAT.log("type="+operation[1]);
                            }
                        }
                    });
                }
            }
        }

    };

    var reflection= {};

    var inspector= new Inspector();

    CAAT.Inspector= {
        extractReflectionInfo : inspector.extractReflectionInfo.bind(inspector)
    };

})();