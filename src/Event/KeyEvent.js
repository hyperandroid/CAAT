CAAT.Module( {

    /**
     * @name Event
     * @memberOf CAAT
     * @namespace
     */

    /**
     * @name KeyEvent
     * @memberOf CAAT.Event
     * @constructor
     */

    /**
     * @name KEYS
     * @memberOf CAAT
     * @namespace
     */

    /**
     * @name KEY_MODIFIERS
     * @memberOf CAAT
     * @namespace
     */

    defines : "CAAT.Event.KeyEvent",
    aliases : "CAAT.KeyEvent",
    extendsWith : {

        /**
         * @lends CAAT.Event.KeyEvent.prototype
         */

        /**
         * Define a key event.
         * @param keyCode
         * @param up_or_down
         * @param modifiers
         * @param originalEvent
         */
        __init : function( keyCode, up_or_down, modifiers, originalEvent ) {
            this.keyCode= keyCode;
            this.action=  up_or_down;
            this.modifiers= modifiers;
            this.sourceEvent= originalEvent;

            this.preventDefault= function() {
                this.sourceEvent.preventDefault();
            }

            this.getKeyCode= function() {
                return this.keyCode;
            };

            this.getAction= function() {
                return this.action;
            };

            this.modifiers= function() {
                return this.modifiers;
            };

            this.isShiftPressed= function() {
                return this.modifiers.shift;
            };

            this.isControlPressed= function() {
                return this.modifiers.control;
            };

            this.isAltPressed= function() {
                return this.modifiers.alt;
            };

            this.getSourceEvent= function() {
                return this.sourceEvent;
            };
        }
    },
    onCreate : function() {

        /**
         * @lends CAAT
         */

        /**
         * Key codes
         * @type {enum}
         */
        CAAT.KEYS = {

            /** @const */ ENTER:13,
            /** @const */ BACKSPACE:8,
            /** @const */ TAB:9,
            /** @const */ SHIFT:16,
            /** @const */ CTRL:17,
            /** @const */ ALT:18,
            /** @const */ PAUSE:19,
            /** @const */ CAPSLOCK:20,
            /** @const */ ESCAPE:27,
            /** @const */ PAGEUP:33,
            /** @const */ PAGEDOWN:34,
            /** @const */ END:35,
            /** @const */ HOME:36,
            /** @const */ LEFT:37,
            /** @const */ UP:38,
            /** @const */ RIGHT:39,
            /** @const */ DOWN:40,
            /** @const */ INSERT:45,
            /** @const */ DELETE:46,
            /** @const */ 0:48,
            /** @const */ 1:49,
            /** @const */ 2:50,
            /** @const */ 3:51,
            /** @const */ 4:52,
            /** @const */ 5:53,
            /** @const */ 6:54,
            /** @const */ 7:55,
            /** @const */ 8:56,
            /** @const */ 9:57,
            /** @const */ a:65,
            /** @const */ b:66,
            /** @const */ c:67,
            /** @const */ d:68,
            /** @const */ e:69,
            /** @const */ f:70,
            /** @const */ g:71,
            /** @const */ h:72,
            /** @const */ i:73,
            /** @const */ j:74,
            /** @const */ k:75,
            /** @const */ l:76,
            /** @const */ m:77,
            /** @const */ n:78,
            /** @const */ o:79,
            /** @const */ p:80,
            /** @const */ q:81,
            /** @const */ r:82,
            /** @const */ s:83,
            /** @const */ t:84,
            /** @const */ u:85,
            /** @const */ v:86,
            /** @const */ w:87,
            /** @const */ x:88,
            /** @const */ y:89,
            /** @const */ z:90,
            /** @const */ SELECT:93,
            /** @const */ NUMPAD0:96,
            /** @const */ NUMPAD1:97,
            /** @const */ NUMPAD2:98,
            /** @const */ NUMPAD3:99,
            /** @const */ NUMPAD4:100,
            /** @const */ NUMPAD5:101,
            /** @const */ NUMPAD6:102,
            /** @const */ NUMPAD7:103,
            /** @const */ NUMPAD8:104,
            /** @const */ NUMPAD9:105,
            /** @const */ MULTIPLY:106,
            /** @const */ ADD:107,
            /** @const */ SUBTRACT:109,
            /** @const */ DECIMALPOINT:110,
            /** @const */ DIVIDE:111,
            /** @const */ F1:112,
            /** @const */ F2:113,
            /** @const */ F3:114,
            /** @const */ F4:115,
            /** @const */ F5:116,
            /** @const */ F6:117,
            /** @const */ F7:118,
            /** @const */ F8:119,
            /** @const */ F9:120,
            /** @const */ F10:121,
            /** @const */ F11:122,
            /** @const */ F12:123,
            /** @const */ NUMLOCK:144,
            /** @const */ SCROLLLOCK:145,
            /** @const */ SEMICOLON:186,
            /** @const */ EQUALSIGN:187,
            /** @const */ COMMA:188,
            /** @const */ DASH:189,
            /** @const */ PERIOD:190,
            /** @const */ FORWARDSLASH:191,
            /** @const */ GRAVEACCENT:192,
            /** @const */ OPENBRACKET:219,
            /** @const */ BACKSLASH:220,
            /** @const */ CLOSEBRAKET:221,
            /** @const */ SINGLEQUOTE:222
        };

        /**
         * @deprecated
         * @type {Object}
         */
        CAAT.Keys= CAAT.KEYS;

        /**
         * Shift key code
         * @type {Number}
         */
        CAAT.SHIFT_KEY=    16;

        /**
         * Control key code
         * @type {Number}
         */
        CAAT.CONTROL_KEY=  17;

        /**
         * Alt key code
         * @type {Number}
         */
        CAAT.ALT_KEY=      18;

        /**
         * Enter key code
         * @type {Number}
         */
        CAAT.ENTER_KEY=    13;

        /**
         * Event modifiers.
         * @type enum
         */
        CAAT.KEY_MODIFIERS= {

            /** @const */ alt:        false,
            /** @const */ control:    false,
            /** @const */ shift:      false
        };
    }

});
