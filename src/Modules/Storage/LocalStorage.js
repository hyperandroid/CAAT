/**
 * See LICENSE file.
 *
 **/
CAAT.Module({

    /**
     * @name Storage
     * @memberOf CAAT.Module
     * @namespace
     */

    /**
     * @name LocalStorage
     * @memberOf CAAT.Module.Storage
     * @namespace
     */

    defines : "CAAT.Module.Storage.LocalStorage",
    constants : {

        /**
         * @lends CAAT.Module.Storage.LocalStorage
         */

        /**
         * Stores an object in local storage. The data will be saved as JSON.stringify.
         * @param key {string} key to store data under.
         * @param data {object} an object.
         * @return this
         *
         * @static
         */
        save : function( key, data ) {
            try {
                localStorage.setItem( key, JSON.stringify(data) );
            } catch(e) {
                // eat it
            }
            return this;
        },
        /**
         * Retrieve a value from local storage.
         * @param key {string} the key to retrieve.
         * @return {object} object stored under the key parameter.
         *
         * @static
         */
        load : function( key, defValue ) {
            try {
                var v= localStorage.getItem( key );

                return null===v ? defValue : JSON.parse(v);
            } catch(e) {
                return null;
            }
        },

        /**
         * Removes a value stored in local storage.
         * @param key {string}
         * @return this
         *
         * @static
         */
        remove : function( key ) {
            try {
                localStorage.removeItem(key);
            } catch(e) {
                // eat it
            }
            return this;
        }
    },
    extendsWith : {

    }

});
