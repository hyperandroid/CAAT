/**
 *
 * taken from: http://www.quirksmode.org/js/detect.html
 *
 * 20101008 Hyperandroid. IE9 seems to identify himself as Explorer and stopped calling himself MSIE.
 *          Added Explorer description to browser list. Thanks @alteredq for this tip.
 *
 */
CAAT.Module({

    /**
     * @name Runtime
     * @memberOf CAAT.Module
     * @namespace
     */

    /**
     * @name BrowserInfo
     * @memberOf CAAT.Module.Runtime
     * @namespace
     */

    defines:"CAAT.Module.Runtime.BrowserInfo",

    constants: function() {

        /**
         * @lends CAAT.Module.Runtime.BrowserInfo
         */

        function searchString(data) {
            for (var i = 0; i < data.length; i++) {
                var dataString = data[i].string;
                var dataProp = data[i].prop;
                this.versionSearchString = data[i].versionSearch || data[i].identity;
                if (dataString) {
                    if (dataString.indexOf(data[i].subString) !== -1)
                        return data[i].identity;
                }
                else if (dataProp)
                    return data[i].identity;
            }
        }

        function searchVersion(dataString) {
            var index = dataString.indexOf(this.versionSearchString);
            if (index === -1) return;
            return parseFloat(dataString.substring(index + this.versionSearchString.length + 1));
        }

        var dataBrowser= [
            {
                string:navigator.userAgent,
                subString:"Chrome",
                identity:"Chrome"
            },
            {   string:navigator.userAgent,
                subString:"OmniWeb",
                versionSearch:"OmniWeb/",
                identity:"OmniWeb"
            },
            {
                string:navigator.vendor,
                subString:"Apple",
                identity:"Safari",
                versionSearch:"Version"
            },
            {
                prop:window.opera,
                identity:"Opera"
            },
            {
                string:navigator.vendor,
                subString:"iCab",
                identity:"iCab"
            },
            {
                string:navigator.vendor,
                subString:"KDE",
                identity:"Konqueror"
            },
            {
                string:navigator.userAgent,
                subString:"Firefox",
                identity:"Firefox"
            },
            {
                string:navigator.vendor,
                subString:"Camino",
                identity:"Camino"
            },
            {        // for newer Netscapes (6+)
                string:navigator.userAgent,
                subString:"Netscape",
                identity:"Netscape"
            },
            {
                string:navigator.userAgent,
                subString:"MSIE",
                identity:"Explorer",
                versionSearch:"MSIE"
            },
            {
                string:navigator.userAgent,
                subString:"Explorer",
                identity:"Explorer",
                versionSearch:"Explorer"
            },
            {
                string:navigator.userAgent,
                subString:"Gecko",
                identity:"Mozilla",
                versionSearch:"rv"
            },
            { // for older Netscapes (4-)
                string:navigator.userAgent,
                subString:"Mozilla",
                identity:"Netscape",
                versionSearch:"Mozilla"
            }
        ];

        var dataOS=[
            {
                string:navigator.platform,
                subString:"Win",
                identity:"Windows"
            },
            {
                string:navigator.platform,
                subString:"Mac",
                identity:"Mac"
            },
            {
                string:navigator.userAgent,
                subString:"iPhone",
                identity:"iPhone/iPod"
            },
            {
                string:navigator.platform,
                subString:"Linux",
                identity:"Linux"
            }
        ];

        var browser = searchString(dataBrowser) || "An unknown browser";
        var version = searchVersion(navigator.userAgent) ||
                      searchVersion(navigator.appVersion) ||
                      "an unknown version";
        var OS = searchString(dataOS) || "an unknown OS";

        var DevicePixelRatio = window.devicePixelRatio || 1;

        return {
            browser: browser,
            version: version,
            OS: OS,
            DevicePixelRatio : DevicePixelRatio
        }

    }
});
