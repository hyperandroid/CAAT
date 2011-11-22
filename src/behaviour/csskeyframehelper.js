/**
 * See LICENSE file.
 *
 * This object manages CSS3 transitions reflecting applying behaviors.
 *
 **/

(function() {

    CAAT.CSS= {};

    CAAT.CSS.PREFIX= (function() {

        var prefix = "";
        var prefixes = ['WebKit', 'Moz', 'O'];
        var keyframes= "";

        // guess this browser vendor prefix.
        for (var i = 0; i < prefixes.length; i++) {
            if (window[prefixes[i] + 'CSSKeyframeRule']) {
                prefix = prefixes[i].toLowerCase();
                break;
            }
        }

        return prefix;
    })();

    /**
     *
     * @param keyframeObject {CAAT.Keyframe}
     */
    CAAT.CSS.addKeyframes= function(name, behavior, size) {

        if ( typeof size==='undefined' ) {
            size= 100;
        }

        // find if keyframes has already a name set.
        var cssRulesIndex= -1;
        var oldName= KeyframesObject.getCSSKeyframesName();
        if ( oldName ) {
            cssRulesIndex= CAAT.CSS.getCSSKeyframesIndex(oldName);
        }

        // create a random name.
        // this is due to some of the css3 oddities. It seems that a DOM element takes information
        // from the @-keyframes element once. That means, that even i can set new keyframeRules for
        // the @-keyframes element, the DOM doesn't get notified about it.
        // If i reset the DOM element with -[webkit|moz]-transition with the same one, it somehow
        // decides the @-keyframes is the same and does not update the transition.
        // So, i'm building new names to the supplied CAAT.Keyframe element, and removing the
        // previously created from the stylesheet.
        name= name + new Date().getTime();

        var keyframesRule= behavior.calculateKeyframesData(CAAT.CSS.PREFIX, name, size );

        if (document.styleSheets) {
            if ( !document.styleSheets.length) {
                var s = document.createElement('style');
                s.type="text/css";

                document.getElementsByTagName('head')[ 0 ].appendChild(s);
            }

            if ( -1!==cssRulesIndex ) {
                document.styleSheets[0].deleteRule( cssRulesIndex );
            }

            document.styleSheets[0].insertRule( keyframesRule, 0 );
        }

    };

    CAAT.CSS.getCSSKeyframesIndex= function(name) {
        var ss = document.styleSheets;
        for (var i = ss.length - 1; i >= 0; i--) {
            try {
                var s = ss[i],
                    rs = s.cssRules ? s.cssRules :
                         s.rules ? s.rules :
                         [];

                for (var j = rs.length - 1; j >= 0; j--) {
                    if ( ( rs[j].type === window.CSSRule.WEBKIT_KEYFRAMES_RULE ||
                           rs[j].type === window.CSSRule.MOZ_KEYFRAMES_RULE ) && rs[j].name === name) {

                        return j;
                    }
                }
            } catch(e) {
            }
        }

        return -1;
    };

    CAAT.CSS.getCSSKeyframes= function(name) {

        var ss = document.styleSheets;
        for (var i = ss.length - 1; i >= 0; i--) {
            try {
                var s = ss[i],
                    rs = s.cssRules ? s.cssRules :
                         s.rules ? s.rules :
                         [];

                for (var j = rs.length - 1; j >= 0; j--) {
                    if ( ( rs[j].type === window.CSSRule.WEBKIT_KEYFRAMES_RULE ||
                           rs[j].type === window.CSSRule.MOZ_KEYFRAMES_RULE ) && rs[j].name === name) {

                        return rs[j];
                    }
                }
            }
            catch(e) {
            }
        }
        return null;
    };



})();