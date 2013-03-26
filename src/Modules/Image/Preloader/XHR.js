CAAT.Module({

    defines : "CAAT.Module.Preloader.XHR",
    extendsWith : {

        /**
         *
         * @param callback function({string},{object}) a callback function. string will be "ok" or "error"
         * @param url {string} a url
         * @param asynch {bool}  load synchronous or asynchronously
         * @param method {string} GET or POST
         */
        load : function( callback, url, asynch, method ) {

            if (typeof asynch==="undefined") {
                asynch= true;
            }
            if (typeof method==="undefined") {
                method= "GET";;
            }

            var req = false;
            if(window.XMLHttpRequest && !(window.ActiveXObject)) {
                try {
                    req = new XMLHttpRequest();
                } catch(e) {
                    req = false;
                }
            } else if(window.ActiveXObject) {
                try {
                    req = new ActiveXObject("Msxml2.XMLHTTP");
                } catch(e) {
                    try {
                        req = new ActiveXObject("Microsoft.XMLHTTP");
                    } catch(e) {
                        req = false;
                    }
                }
            }

            if(req) {
                req.open(method, url, false);
                req.onreadystatechange =  function(e) {
                    if( req.status != 200 )
                        return callback("error");

                    var text= e.currentTarget ? e.currentTarget.responseText : e.target.responseText;
                    callback("ok", text);
                } ;
                req.send();
            }
        }
    }

});