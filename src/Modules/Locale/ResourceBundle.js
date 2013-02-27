CAAT.Module({

    /**
     * @name Locale
     * @memberOf CAAT.Module
     * @namespace
     */

    /**
     * @name ResourceBundle
     * @memberOf CAAT.Module.Locale
     * @constructor
     */

    defines:"CAAT.Module.Locale.ResourceBundle",
    extendsWith:function () {

        return {

            /**
             * @lends CAAT.Module.Locale.ResourceBundle.prototype
             */


            /**
             * Is this bundle valid ?
             */
            valid : false,

            /**
             * Original file contents.
             */
            localeInfo : null,      // content from resourceFile

            /**
             * Current set locale.
             */
            __currentLocale : null, // default locale data

            /**
             * Default locale info.
             */
            __defaultLocale : null,

            /**
             * <p>
             * Load a bundle file.
             * The expected file format is as follows:
             *
             * <code>
             * {
             *  "defaultLocale" : "en-US",
             *  "en-US" : {
             *          "key1", "value1",
             *          "key2", "value2",
             *          ...
             *      },
             *  "en-UK" : {
             *          "key1", "value1",
             *          "key2", "value2",
             *          ...
             *      }
             * }
             * </code>
             *
             * <p>
             * defaultLocale is compulsory.
             *
             * <p>
             * The function getString solves as follows:
             *
             * <li>a ResouceBundle object will honor browser/system locale by searching for these strings in
             *   the navigator object to define the value of currentLocale:
             *
             *   <ul>navigator.language
             *   <ul>navigator.browserLanguage
             *   <ul>navigator.systemLanguage
             *   <ul>navigator.userLanguage
             *
             * <li>the ResouceBundle class will also get defaultLocale value, and set the corresponding key
             *   as default Locale.
             *
             * <li>a call to getString(id,defaultValue) will work as follows:
             *
             * <pre>
             *   1)     will get the value associated in currentLocale[id]
             *   2)     if the value is set, it is returned.
             *   2.1)       else if it is not set, will get the value from defaultLocale[id] (sort of fallback)
             *   3)     if the value of defaultLocale is set, it is returned.
             *   3.1)       else defaultValue is returned.
             * </pre>
             *
             * @param resourceFile
             * @param asynch
             * @param onSuccess
             * @param onError
             * @return {*}
             * @private
             */
            __init : function( resourceFile, asynch, onSuccess, onError ) {

                this.loadDoc( resourceFile, asynch, onSuccess, onError );
                if ( this.valid ) {
                    try {
                        var locale= navigator.language || navigator.browserLanguage || navigator.systemLanguage  || navigator.userLanguage;
                        this.__currentLocale= this.localeInfo[locale];
                        this.__defaultLocale= this.localeInfo["defaultLocale"];

                        if ( typeof this.__currentLocale==='undefined' ) {
                            this.__currentLocale= this.__defaultLocale;
                        }

                        if ( !this.__currentLocale ) {
                            onError("No available default or system defined locale('"+locale+"'");
                        }

                        this.valid= false;

                    } catch(e) {
                        onError("No default locale");
                        this.valid= false;
                    }
                }

                return this;
            },

            /**
             * A formated string is a regular string that has embedded holder for string values.
             * for example a string like:
             *
             * "hi this is a $2 $1"
             *
             * will be after calling __formatString( str, ["string","parameterized"] );
             *
             * "hi this is a parameterized string"
             *
             * IMPORTANT: Holder values start in 1.
             *
             * @param string {string} a parameterized string
             * @param args {object} object whose keys are used to find holders and replace them in string parameter
             * @return {string}
             * @private
             */
            __formatString : function( string, args ) {

                if ( !args ) {
                    return string;
                }

                for( var key in args ) {
                    string= string.replace("$"+key, args[key]);
                }

                return string;

            },

            /**
             *
             * @param id {string} a key from the bundle file.
             * @param defaultValue {string} default value in case
             * @param args {Array.<string>=} optional arguments array in case the returned string is a
             *          parameterized string.
             *
             * @return {string}
             */
            getString : function(id, defaultValue, args) {

                if ( this.valid ) {
                    var str= this.__currentLocale[id];
                    if ( str ) {
                        return this.__formatString(str,args);
                    } else {

                        if ( this.__currentLocale!==this.__defaultLocale ) {
                            str= this.__defaultLocale[id];
                            if ( str ) {
                                return this.__formatString(str,args);
                            }
                        }
                    }
                }

                return this.__formatString(defaultValue,args);
            },

            loadDoc : function(resourceFile, asynch, onSuccess, onError ) {
                var me= this;

                var req;
                if (window.XMLHttpRequest && !(window.ActiveXObject)) {
                    try {
                        req = new XMLHttpRequest();
                    } catch (e) {
                        req = null;
                        onError(e);
                    }
                } else if (window.ActiveXObject) {
                    try {
                        req = new ActiveXObject("Msxml2.XMLHTTP");
                    } catch (e) {
                        try {
                            req = new ActiveXObject("Microsoft.XMLHTTP");
                        } catch (e) {
                            req = null;
                            onError(e);
                        }
                    }
                }

                if (req) {
                    req.onreadystatechange = function () {
                        if (req.readyState == 4) {
                            if (req.status == 200) {
                                try {
                                    me.localeInfo= JSON.parse(req.responseText);
                                    me.valid= true;
                                    onSuccess(me.localeInfo);
                                } catch(e) {
                                    onError(e);
                                }
                            } else {
                                onError("onReadyStateChange status="+req.status);
                            }
                        }
                    };

                    req.open("GET", resourceFile, false);
                    req.send("");
                }
            }
        }
    }
});