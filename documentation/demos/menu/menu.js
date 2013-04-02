(function() {
    var req;

    function loadXMLDoc() {
        req = false;
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
            req.onreadystatechange = processReqChange;
            req.open("GET", '../menu/menu.html', true);
            req.send("");
        }
    }

    function processReqChange() {
        if (req.readyState == 4) {
            if (req.status == 200) {
                var menu= document.getElementById('menu');
                menu.innerHTML= req.responseText;
            } else {
                document.getElementById('menu').innerHTML="<strong>Unable to load menu</strong>";
            }
        }
    }

    window.addEventListener('load',loadXMLDoc,false);
    
})();