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
         * @type {Object}
         */
        CAAT.Keys = {
            ENTER:13,
            BACKSPACE:8,
            TAB:9,
            SHIFT:16,
            CTRL:17,
            ALT:18,
            PAUSE:19,
            CAPSLOCK:20,
            ESCAPE:27,
            PAGEUP:33,
            PAGEDOWN:34,
            END:35,
            HOME:36,
            LEFT:37,
            UP:38,
            RIGHT:39,
            DOWN:40,
            INSERT:45,
            DELETE:46,
            0:48,
            1:49,
            2:50,
            3:51,
            4:52,
            5:53,
            6:54,
            7:55,
            8:56,
            9:57,
            a:65,
            b:66,
            c:67,
            d:68,
            e:69,
            f:70,
            g:71,
            h:72,
            i:73,
            j:74,
            k:75,
            l:76,
            m:77,
            n:78,
            o:79,
            p:80,
            q:81,
            r:82,
            s:83,
            t:84,
            u:85,
            v:86,
            w:87,
            x:88,
            y:89,
            z:90,
            SELECT:93,
            NUMPAD0:96,
            NUMPAD1:97,
            NUMPAD2:98,
            NUMPAD3:99,
            NUMPAD4:100,
            NUMPAD5:101,
            NUMPAD6:102,
            NUMPAD7:103,
            NUMPAD8:104,
            NUMPAD9:105,
            MULTIPLY:106,
            ADD:107,
            SUBTRACT:109,
            DECIMALPOINT:110,
            DIVIDE:111,
            F1:112,
            F2:113,
            F3:114,
            F4:115,
            F5:116,
            F6:117,
            F7:118,
            F8:119,
            F9:120,
            F10:121,
            F11:122,
            F12:123,
            NUMLOCK:144,
            SCROLLLOCK:145,
            SEMICOLON:186,
            EQUALSIGN:187,
            COMMA:188,
            DASH:189,
            PERIOD:190,
            FORWARDSLASH:191,
            GRAVEACCENT:192,
            OPENBRACKET:219,
            BACKSLASH:220,
            CLOSEBRAKET:221,
            SINGLEQUOTE:222
        };

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
         */
        CAAT.KEY_MODIFIERS= {
            alt:        false,
            control:    false,
            shift:      false
        };
    }

});
