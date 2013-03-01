/**
 * See LICENSE file.
 *
 * This object manages CSS3 transitions reflecting applying behaviors.
 *
 **/

(function() {

    /**
     * @name CSS
     * @memberOf CAAT
     * @namespace
     */

    CAAT.CSS= {};

    /**
     * @lends CAAT.CSS
     */


    /**
     * Guess a browser custom prefix.
     * @type {*}
     */
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

        CAAT.CSS.PROP_ANIMATION= '-'+prefix+'-animation';

        return prefix;
    })();

    /**
     * Apply a given @key-frames animation to a DOM element.
     * @param domElement {DOMElement}
     * @param name {string} animation name
     * @param duration_millis {number}
     * @param delay_millis {number}
     * @param forever {boolean}
     */
    CAAT.CSS.applyKeyframe= function( domElement, name, duration_millis, delay_millis, forever ) {
        domElement.style[CAAT.CSS.PROP_ANIMATION]= name+' '+(duration_millis/1000)+'s '+(delay_millis/1000)+'s linear both '+(forever ? 'infinite' : '') ;
    };

    /**
     * Remove a @key-frames animation from the stylesheet.
     * @param name
     */
    CAAT.CSS.unregisterKeyframes= function( name ) {
        var index= CAAT.CSS.getCSSKeyframesIndex(name);
        if ( -1!==index ) {
            document.styleSheets[0].deleteRule( index );
        }
    };

    /**
     *
     * @param kfDescriptor {object}
     *      {
     *          name{string},
     *          behavior{CAAT.Behavior},
     *          size{!number},
     *          overwrite{boolean}
     *      }
     *  }
     */
    CAAT.CSS.registerKeyframes= function( kfDescriptor ) {

        var name=       kfDescriptor.name;
        var behavior=   kfDescriptor.behavior;
        var size=       kfDescriptor.size;
        var overwrite=  kfDescriptor.overwrite;

        if ( typeof name==='undefined' || typeof behavior==='undefined' ) {
            throw 'Keyframes must be defined by a name and a CAAT.Behavior instance.';
        }

        if ( typeof size==='undefined' ) {
            size= 100;
        }
        if ( typeof overwrite==='undefined' ) {
            overwrite= false;
        }

        // find if keyframes has already a name set.
        var cssRulesIndex= CAAT.CSS.getCSSKeyframesIndex(name);
        if (-1!==cssRulesIndex && !overwrite) {
            return;
        }

        var keyframesRule= behavior.calculateKeyFramesData(CAAT.CSS.PREFIX, name, size, kfDescriptor.anchorX, kfDescriptor.anchorY );

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

        return keyframesRule;
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
