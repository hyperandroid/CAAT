/**
 * See LICENSE file.
 *
 **/

CAAT.Module({

    /**
     * @name Font
     * @memberOf CAAT.Module
     * @namespace
     */

    /**
     * @name Font
     * @memberOf CAAT.Module.Font
     * @constructor
     */

    defines : "CAAT.Module.Font.Font",
    aliases : "CAAT.Font",
    depends : [
        "CAAT.Foundation.SpriteImage"
    ],
    constants: {

        /**
         * @lends CAAT.Module.Font.Font
         */

        getFontMetrics:function (font) {
            var ret;
            if (CAAT.CSS_TEXT_METRICS) {
                try {
                    ret = CAAT.Module.Font.Font.getFontMetricsCSS(font);
                    return ret;
                } catch (e) {

                }
            }

            return CAAT.Module.Font.Font.getFontMetricsNoCSS(font);
        },

        getFontMetricsNoCSS:function (font) {

            var re = /(\d+)p[x|t]\s*/i;
            var res = re.exec(font);

            var height;

            if (!res) {
                height = 32;     // no px or pt value in font. assume 32.)
            } else {
                height = res[1] | 0;
            }

            var ascent = height - 1;
            var h = (height + height * .2) | 0;
            return {
                height:h,
                ascent:ascent,
                descent:h - ascent
            }

        },

        /**
         * Totally ripped from:
         *
         * jQuery (offset function)
         * Daniel Earwicker: http://stackoverflow.com/questions/1134586/how-can-you-find-the-height-of-text-on-an-html-canvas
         *
         * @param font
         * @return {*}
         */
        getFontMetricsCSS:function (font) {

            function offset(elem) {

                var box, docElem, body, win, clientTop, clientLeft, scrollTop, scrollLeft, top, left;
                var doc = elem && elem.ownerDocument;
                docElem = doc.documentElement;

                box = elem.getBoundingClientRect();
                //win = getWindow( doc );

                body = document.body;
                win = doc.nodeType === 9 ? doc.defaultView || doc.parentWindow : false;

                clientTop = docElem.clientTop || body.clientTop || 0;
                clientLeft = docElem.clientLeft || body.clientLeft || 0;
                scrollTop = win.pageYOffset || docElem.scrollTop;
                scrollLeft = win.pageXOffset || docElem.scrollLeft;
                top = box.top + scrollTop - clientTop;
                left = box.left + scrollLeft - clientLeft;

                return { top:top, left:left };
            }

            try {
                var text = document.createElement("span");
                text.style.font = font;
                text.innerHTML = "Hg";

                var block = document.createElement("div");
                block.style.display = "inline-block";
                block.style.width = "1px";
                block.style.heigh = "0px";

                var div = document.createElement("div");
                div.appendChild(text);
                div.appendChild(block);


                var body = document.body;
                body.appendChild(div);

                try {

                    var result = {};

                    block.style.verticalAlign = 'baseline';
                    result.ascent = offset(block).top - offset(text).top;

                    block.style.verticalAlign = 'bottom';
                    result.height = offset(block).top - offset(text).top;

                    result.ascent = Math.ceil(result.ascent);
                    result.height = Math.ceil(result.height);

                    result.descent = result.height - result.ascent;

                    return result;

                } finally {
                    body.removeChild(div);
                }
            } catch (e) {
                return null;
            }
        }
    },
    extendsWith:function () {

        var UNKNOWN_CHAR_WIDTH = 10;

        return {

            /**
             * @lends CAAT.Module.Font.Font.prototype
             */

            fontSize:10,
            fontSizeUnit:"px",
            font:'Sans-Serif',
            fontStyle:'',
            fillStyle:'#fff',
            strokeStyle:null,
            strokeSize:1,
            padding:0,
            image:null,
            charMap:null,

            height:0,
            ascent:0,
            descent:0,

            setPadding:function (padding) {
                this.padding = padding;
                return this;
            },

            setFontStyle:function (style) {
                this.fontStyle = style;
                return this;
            },

            setStrokeSize:function (size) {
                this.strokeSize = size;
                return this;
            },

            setFontSize:function (fontSize) {
                this.fontSize = fontSize;
                this.fontSizeUnit = 'px';
                return this;
            },

            setFont:function (font) {
                this.font = font;
                return this;
            },

            setFillStyle:function (style) {
                this.fillStyle = style;
                return this;
            },

            setStrokeStyle:function (style) {
                this.strokeStyle = style;
                return this;
            },

            createDefault:function (padding) {
                var str = "";
                for (var i = 32; i < 128; i++) {
                    str = str + String.fromCharCode(i);
                }

                return this.create(str, padding);
            },

            create:function (chars, padding) {

                padding = padding | 0;
                this.padding = padding;

                var canvas = document.createElement('canvas');
                var ctx = canvas.getContext('2d');

                ctx.textBaseline = 'bottom';
                ctx.font = this.fontStyle + ' ' + this.fontSize + "" + this.fontSizeUnit + " " + this.font;

                var textWidth = 0;
                var charWidth = [];
                var i;
                var x;
                var cchar;

                for (i = 0; i < chars.length; i++) {
                    var cw = Math.max(1, (ctx.measureText(chars.charAt(i)).width >> 0) + 1) + 2 * padding;
                    charWidth.push(cw);
                    textWidth += cw;
                }


                var fontMetrics = CAAT.Font.getFontMetrics(ctx.font);
                var baseline = "alphabetic", yoffset, canvasheight;

                canvasheight = fontMetrics.height;
                this.ascent = fontMetrics.ascent;
                this.descent = fontMetrics.descent;
                this.height = fontMetrics.height;
                yoffset = fontMetrics.ascent;

                canvas.width = textWidth;
                canvas.height = canvasheight;
                ctx = canvas.getContext('2d');

                //ctx.textBaseline= 'bottom';
                ctx.textBaseline = baseline;
                ctx.font = this.fontStyle + ' ' + this.fontSize + "" + this.fontSizeUnit + " " + this.font;
                ctx.fillStyle = this.fillStyle;
                ctx.strokeStyle = this.strokeStyle;

                this.charMap = {};

                x = 0;
                for (i = 0; i < chars.length; i++) {
                    cchar = chars.charAt(i);
                    ctx.fillText(cchar, x + padding, yoffset);
                    if (this.strokeStyle) {
                        ctx.beginPath();
                        ctx.lineWidth = this.strokeSize;
                        ctx.strokeText(cchar, x + padding, yoffset);
                    }
                    this.charMap[cchar] = {
                        x:x + padding,
                        width:charWidth[i] - 2 * padding,
                        height: this.height
                    };
                    x += charWidth[i];
                }

                this.image = canvas;

                return this;
            },

            setAsSpriteImage:function () {
                var cm = [];
                var _index = 0;
                for (var i in this.charMap) {
                    var _char = i;
                    var charData = this.charMap[i];

                    cm[i] = {
                        id:_index++,
                        height:this.height,
                        xoffset:0,
                        letter:_char,
                        yoffset:0,
                        width:charData.width,
                        xadvance:charData.width,
                        x:charData.x,
                        y:0
                    };
                }

                this.spriteImage = new CAAT.Foundation.SpriteImage().initializeAsGlyphDesigner(this.image, cm);
                return this;
            },

            getAscent:function () {
                return this.ascent;
            },

            getDescent:function () {
                return this.descent;
            },

            stringHeight:function () {
                return this.height;
            },

            getFontData:function () {
                return {
                    height:this.height,
                    ascent:this.ascent,
                    descent:this.descent
                };
            },

            stringWidth:function (str) {
                var i, l, w = 0, c;

                for (i = 0, l = str.length; i < l; i++) {
                    c = this.charMap[ str.charAt(i) ];
                    if (c) {
                        w += c.width;
                    } else {
                        w += UNKNOWN_CHAR_WIDTH;
                    }
                }

                return w;
            },

            drawText:function (str, ctx, x, y) {
                var i, l, charInfo, w;
                var height = this.image.height;

                for (i = 0, l = str.length; i < l; i++) {
                    charInfo = this.charMap[ str.charAt(i) ];
                    if (charInfo) {
                        w = charInfo.width;
                        if ( w>0 && charInfo.height>0 ) {
                            ctx.drawImage(
                                this.image,
                                charInfo.x, 0,
                                w, height,
                                x, y,
                                w, height);
                        }
                        x += w;
                    } else {
                        ctx.strokeStyle = '#f00';
                        ctx.strokeRect(x, y, UNKNOWN_CHAR_WIDTH, height);
                        x += UNKNOWN_CHAR_WIDTH;
                    }
                }
            },

            save:function () {
                var str = "image/png";
                var strData = this.image.toDataURL(str);
                document.location.href = strData.replace(str, "image/octet-stream");
            },

            drawSpriteText:function (director, time) {
                this.spriteImage.drawSpriteText(director, time);
            }

        }
    }

});

