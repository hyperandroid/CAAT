/**
 * See LICENSE file.
 *
 * TODO: allow set of margins, spacing, etc. to define subimages.
 *
 **/

CAAT.Module({

    /**
     * @name SpriteImage
     * @memberOf CAAT.Foundation
     * @constructor
     */


    defines : "CAAT.Foundation.SpriteImage",
    aliases : ["CAAT.SpriteImage"],
    depends : [
        "CAAT.Foundation.SpriteImageHelper",
        "CAAT.Foundation.SpriteImageAnimationHelper",
        "CAAT.Math.Rectangle"
    ],
    constants:{
        /**
         * @lends  CAAT.Foundation.SpriteImage
         */

        /** @const @type {number} */ TR_NONE:0, // constants used to determine how to draw the sprite image,
        /** @const @type {number} */ TR_FLIP_HORIZONTAL:1,
        /** @const @type {number} */ TR_FLIP_VERTICAL:2,
        /** @const @type {number} */ TR_FLIP_ALL:3,
        /** @const @type {number} */ TR_FIXED_TO_SIZE:4,
        /** @const @type {number} */ TR_FIXED_WIDTH_TO_SIZE:6,
        /** @const @type {number} */ TR_TILE:5
    },
    extendsWith:function () {

        return {

            /**
             * @lends  CAAT.Foundation.SpriteImage.prototype
             */

            __init:function () {
                this.paint = this.paintN;
                this.setAnimationImageIndex([0]);
                this.mapInfo = {};
                this.animationsMap= {};

                if ( arguments.length===1 ) {
                    this.initialize.call(this, arguments[0], 1, 1);
                } else if ( arguments.length===3 ) {
                    this.initialize.apply(this, arguments);
                }
                return this;
            },

            /**
             * an Array defining the sprite frame sequence
             */
            animationImageIndex:null,

            /**
             * Previous animation frame time.
             */
            prevAnimationTime:-1,

            /**
             * how much Scene time to take before changing an Sprite frame.
             */
            changeFPS:1000,

            /**
             * any of the TR_* constants.
             */
            transformation:0,

            /**
             * the current sprite frame
             */
            spriteIndex:0,

            /**
             * current index of sprite frames array.
             */
            prevIndex:0,    //

            /**
             * current animation name
             */
            currentAnimation: null,

            /**
             * Image to get frames from.
             */
            image:null,

            /**
             * Number of rows
             */
            rows:1,

            /**
             * Number of columns.
             */
            columns:1,

            /**
             * This sprite image image´s width
             */
            width:0,

            /**
             * This sprite image image´s width
             */
            height:0,

            /**
             * For each element in the sprite image array, its size.
             */
            singleWidth:0,

            /**
             * For each element in the sprite image array, its height.
             */
            singleHeight:0,

            scaleX:1,
            scaleY:1,

            /**
             * Displacement offset to get the sub image from. Useful to make images shift.
             */
            offsetX:0,

            /**
             * Displacement offset to get the sub image from. Useful to make images shift.
             */
            offsetY:0,

            /**
             * When nesting sprite images, this value is the star X position of this sprite image in the parent.
             */
            parentOffsetX:0,    // para especificar una subimagen dentro un textmap.

            /**
             * When nesting sprite images, this value is the star Y position of this sprite image in the parent.
             */
            parentOffsetY:0,

            /**
             * The actor this sprite image belongs to.
             */
            ownerActor:null,

            /**
             * If the sprite image is defined out of a JSON object (sprite packer for example), this is
             * the subimages calculated definition map.
             */
            mapInfo:null,

            /**
             * If the sprite image is defined out of a JSON object (sprite packer for example), this is
             * the subimages original definition map.
             */
            map:null,

            /**
             * This property allows to have multiple different animations defined for one actor.
             * see demo31 for a sample.
             */
            animationsMap : null,

            /**
             * When an animation sequence ends, this callback function will be called.
             */
            callback : null,        // on end animation callback

            /**
             * pending: refactor -> font scale to a font object.
             */
            fontScale : 1,

            getOwnerActor : function() {
                return this.ownerActor;
            },

            /**
             * Add an animation to this sprite image.
             * An animation is defines by an array of pretend-to-be-played sprite sequence.
             *
             * @param name {string} animation name.
             * @param array {Array<number|string>} the sprite animation sequence array. It can be defined
             *              as number array for Grid-like sprite images or strings for a map-like sprite
             *              image.
             * @param time {number} change animation sequence every 'time' ms.
             * @param callback {function({SpriteImage},{string}} a callback function to invoke when the sprite
             *              animation sequence has ended.
             */
            addAnimation : function( name, array, time, callback ) {
                this.animationsMap[name]= new CAAT.Foundation.SpriteImageAnimationHelper(array,time,callback);
                return this;
            },

            setAnimationEndCallback : function(f) {
                this.callback= f;
            },

            /**
             * Start playing a SpriteImage animation.
             * If it does not exist, nothing happens.
             * @param name
             */
            playAnimation : function(name) {
                if (name===this.currentAnimation) {
                    return this;
                }

                var animation= this.animationsMap[name];
                if ( !animation ) {
                    return this;
                }

                this.currentAnimation= name;

                this.setAnimationImageIndex( animation.animation );
                this.changeFPS= animation.time;
                this.callback= animation.onEndPlayCallback;

                return this;
            },

            setOwner:function (actor) {
                this.ownerActor = actor;
                return this;
            },
            getRows:function () {
                return this.rows;
            },
            getColumns:function () {
                return this.columns;
            },

            getWidth:function () {
                var el = this.mapInfo[this.spriteIndex];
                return el.width;
            },

            getHeight:function () {
                var el = this.mapInfo[this.spriteIndex];
                return el.height;
            },

            getWrappedImageWidth:function () {
                return this.image.width;
            },

            getWrappedImageHeight:function () {
                return this.image.height;
            },

            /**
             * Get a reference to the same image information (rows, columns, image and uv cache) of this
             * SpriteImage. This means that re-initializing this objects image info (that is, calling initialize
             * method) will change all reference's image information at the same time.
             */
            getRef:function () {
                var ret = new CAAT.Foundation.SpriteImage();
                ret.image = this.image;
                ret.rows = this.rows;
                ret.columns = this.columns;
                ret.width = this.width;
                ret.height = this.height;
                ret.singleWidth = this.singleWidth;
                ret.singleHeight = this.singleHeight;
                ret.mapInfo = this.mapInfo;
                ret.offsetX = this.offsetX;
                ret.offsetY = this.offsetY;
                ret.scaleX = this.scaleX;
                ret.scaleY = this.scaleY;
                ret.animationsMap= this.animationsMap;
                ret.parentOffsetX= this.parentOffsetX;
                ret.parentOffsetY= this.parentOffsetY;

                ret.scaleFont= this.scaleFont;

                return ret;
            },
            /**
             * Set horizontal displacement to draw image. Positive values means drawing the image more to the
             * right.
             * @param x {number}
             * @return this
             */
            setOffsetX:function (x) {
                this.offsetX = x;
                return this;
            },
            /**
             * Set vertical displacement to draw image. Positive values means drawing the image more to the
             * bottom.
             * @param y {number}
             * @return this
             */
            setOffsetY:function (y) {
                this.offsetY = y;
                return this;
            },
            setOffset:function (x, y) {
                this.offsetX = x;
                this.offsetY = y;
                return this;
            },
            /**
             * Initialize a grid of subimages out of a given image.
             * @param image {HTMLImageElement|Image} an image object.
             * @param rows {number} number of rows.
             * @param columns {number} number of columns
             *
             * @return this
             */
            initialize:function (image, rows, columns) {

                if (!image) {
                    console.log("Null image for SpriteImage.");
                }

                if ( isString(image) ) {
                    image= CAAT.currentDirector.getImage(image);
                }

                this.parentOffsetX= 0;
                this.parentOffsetY= 0;

                this.rows = rows;
                this.columns = columns;

                if ( image instanceof CAAT.Foundation.SpriteImage || image instanceof CAAT.SpriteImage ) {
                    this.image =        image.image;
                    var sihelper= image.mapInfo[0];
                    this.width= sihelper.width;
                    this.height= sihelper.height;

                    this.parentOffsetX= sihelper.x;
                    this.parentOffsetY= sihelper.y;

                    this.width= image.mapInfo[0].width;
                    this.height= image.mapInfo[0].height;

                } else {
                    this.image = image;
                    this.width = image.width;
                    this.height = image.height;
                    this.mapInfo = {};

                }

                this.singleWidth = Math.floor(this.width / columns);
                this.singleHeight = Math.floor(this.height / rows);

                var i, sx0, sy0;
                var helper;

                if (image.__texturePage) {
                    image.__du = this.singleWidth / image.__texturePage.width;
                    image.__dv = this.singleHeight / image.__texturePage.height;


                    var w = this.singleWidth;
                    var h = this.singleHeight;
                    var mod = this.columns;
                    if (image.inverted) {
                        var t = w;
                        w = h;
                        h = t;
                        mod = this.rows;
                    }

                    var xt = this.image.__tx;
                    var yt = this.image.__ty;

                    var tp = this.image.__texturePage;

                    for (i = 0; i < rows * columns; i++) {


                        var c = ((i % mod) >> 0);
                        var r = ((i / mod) >> 0);

                        var u = xt + c * w;  // esquina izq x
                        var v = yt + r * h;

                        var u1 = u + w;
                        var v1 = v + h;

                        helper = new CAAT.Foundation.SpriteImageHelper(u, v, (u1 - u), (v1 - v), tp.width, tp.height).setGL(
                            u / tp.width,
                            v / tp.height,
                            u1 / tp.width,
                            v1 / tp.height);

                        this.mapInfo[i] = helper;
                    }

                } else {
                    for (i = 0; i < rows * columns; i++) {
                        sx0 = ((i % this.columns) | 0) * this.singleWidth + this.parentOffsetX;
                        sy0 = ((i / this.columns) | 0) * this.singleHeight + this.parentOffsetY;

                        helper = new CAAT.Foundation.SpriteImageHelper(sx0, sy0, this.singleWidth, this.singleHeight, image.width, image.height);
                        this.mapInfo[i] = helper;
                    }
                }

                return this;
            },

            /**
             * Create elements as director.getImage values.
             * Create as much as elements defined in this sprite image.
             * The elements will be named prefix+<the map info element name>
             * @param prefix
             */
            addElementsAsImages : function( prefix ) {
                for( var i in this.mapInfo ) {
                    var si= new CAAT.Foundation.SpriteImage().initialize( this.image, 1, 1 );
                    si.addElement(0, this.mapInfo[i]);
                    si.setSpriteIndex(0);
                    CAAT.currentDirector.addImage( prefix+i, si );
                }
            },

            copy : function( other ) {
                this.initialize(other,1,1);
                this.mapInfo= other.mapInfo;
                return this;
            },

            /**
             * Must be used to draw actor background and the actor should have setClip(true) so that the image tiles
             * properly.
             * @param director
             * @param time
             * @param x
             * @param y
             */
            paintTiled:function (director, time, x, y) {

                // PENDING: study using a pattern

                var el = this.mapInfo[this.spriteIndex];

                var r = new CAAT.Math.Rectangle();
                this.ownerActor.AABB.intersect(director.AABB, r);

                var w = this.getWidth();
                var h = this.getHeight();
                var xoff = (this.offsetX - this.ownerActor.x) % w;
                if (xoff > 0) {
                    xoff = xoff - w;
                }
                var yoff = (this.offsetY - this.ownerActor.y) % h;
                if (yoff > 0) {
                    yoff = yoff - h;
                }

                var nw = (((r.width - xoff) / w) >> 0) + 1;
                var nh = (((r.height - yoff) / h) >> 0) + 1;
                var i, j;
                var ctx = director.ctx;

                for (i = 0; i < nh; i++) {
                    for (j = 0; j < nw; j++) {
                        ctx.drawImage(
                            this.image,
                            el.x, el.y,
                            el.width, el.height,
                            (r.x - this.ownerActor.x + xoff + j * el.width) >> 0, (r.y - this.ownerActor.y + yoff + i * el.height) >> 0,
                            el.width, el.height);
                    }
                }
            },

            /**
             * Draws the subimage pointed by imageIndex horizontally inverted.
             * @param director {CAAT.Foundation.Director}
             * @param time {number} scene time.
             * @param x {number} x position in canvas to draw the image.
             * @param y {number} y position in canvas to draw the image.
             *
             * @return this
             */
            paintInvertedH:function (director, time, x, y) {

                var el = this.mapInfo[this.spriteIndex];

                var ctx = director.ctx;
                ctx.save();
                //ctx.translate(((0.5 + x) | 0) + el.width, (0.5 + y) | 0);
                ctx.translate((x | 0) + el.width, y | 0);
                ctx.scale(-1, 1);


                ctx.drawImage(
                    this.image,
                    el.x, el.y,
                    el.width, el.height,
                    this.offsetX >> 0, this.offsetY >> 0,
                    el.width, el.height);

                ctx.restore();

                return this;
            },
            /**
             * Draws the subimage pointed by imageIndex vertically inverted.
             * @param director {CAAT.Foundation.Director}
             * @param time {number} scene time.
             * @param x {number} x position in canvas to draw the image.
             * @param y {number} y position in canvas to draw the image.
             *
             * @return this
             */
            paintInvertedV:function (director, time, x, y) {

                var el = this.mapInfo[this.spriteIndex];

                var ctx = director.ctx;
                ctx.save();
                //ctx.translate((x + 0.5) | 0, (0.5 + y + el.height) | 0);
                ctx.translate(x | 0, (y + el.height) | 0);
                ctx.scale(1, -1);

                ctx.drawImage(
                    this.image,
                    el.x, el.y,
                    el.width, el.height,
                    this.offsetX >> 0, this.offsetY >> 0,
                    el.width, el.height);

                ctx.restore();

                return this;
            },
            /**
             * Draws the subimage pointed by imageIndex both horizontal and vertically inverted.
             * @param director {CAAT.Foundation.Director}
             * @param time {number} scene time.
             * @param x {number} x position in canvas to draw the image.
             * @param y {number} y position in canvas to draw the image.
             *
             * @return this
             */
            paintInvertedHV:function (director, time, x, y) {

                var el = this.mapInfo[this.spriteIndex];

                var ctx = director.ctx;
                ctx.save();
                //ctx.translate((x + 0.5) | 0, (0.5 + y + el.height) | 0);
                ctx.translate(x | 0, (y + el.height) | 0);
                ctx.scale(1, -1);
                ctx.translate(el.width, 0);
                ctx.scale(-1, 1);

                ctx.drawImage(
                    this.image,
                    el.x, el.y,
                    el.width, el.height,
                    this.offsetX >> 0, this.offsetY >> 0,
                    el.width, el.height);

                ctx.restore();

                return this;
            },
            /**
             * Draws the subimage pointed by imageIndex.
             * @param director {CAAT.Foundation.Director}
             * @param time {number} scene time.
             * @param x {number} x position in canvas to draw the image.
             * @param y {number} y position in canvas to draw the image.
             *
             * @return this
             */
            paintN:function (director, time, x, y) {

                var el = this.mapInfo[this.spriteIndex];

                director.ctx.drawImage(
                    this.image,
                    el.x, el.y,
                    el.width, el.height,
                    (this.offsetX + x) >> 0, (this.offsetY + y) >> 0,
                    el.width, el.height);

                return this;
            },
            paintAtRect:function (director, time, x, y, w, h) {

                var el = this.mapInfo[this.spriteIndex];

                director.ctx.drawImage(
                    this.image,
                    el.x, el.y,
                    el.width, el.height,
                    (this.offsetX + x) >> 0, (this.offsetY + y) >> 0,
                    w, h);

                return this;
            },
            /**
             * Draws the subimage pointed by imageIndex.
             * @param director {CAAT.Foundation.Director}
             * @param time {number} scene time.
             * @param x {number} x position in canvas to draw the image.
             * @param y {number} y position in canvas to draw the image.
             *
             * @return this
             */
            paintScaledWidth:function (director, time, x, y) {

                var el = this.mapInfo[this.spriteIndex];

                director.ctx.drawImage(
                    this.image,
                    el.x, el.y,
                    el.width, el.height,
                    (this.offsetX + x) >> 0, (this.offsetY + y) >> 0,
                    this.ownerActor.width, el.height);

                return this;
            },
            paintChunk:function (ctx, dx, dy, x, y, w, h) {
                ctx.drawImage(this.image, x, y, w, h, dx, dy, w, h);
            },
            paintTile:function (ctx, index, x, y) {
                var el = this.mapInfo[index];
                ctx.drawImage(
                    this.image,
                    el.x, el.y,
                    el.width, el.height,
                    (this.offsetX + x) >> 0, (this.offsetY + y) >> 0,
                    el.width, el.height);

                return this;
            },
            /**
             * Draws the subimage pointed by imageIndex scaled to the size of w and h.
             * @param director {CAAT.Foundation.Director}
             * @param time {number} scene time.
             * @param x {number} x position in canvas to draw the image.
             * @param y {number} y position in canvas to draw the image.
             *
             * @return this
             */
            paintScaled:function (director, time, x, y) {

                var el = this.mapInfo[this.spriteIndex];

                director.ctx.drawImage(
                    this.image,
                    el.x, el.y,
                    el.width, el.height,
                    (this.offsetX + x) >> 0, (this.offsetY + y) >> 0,
                    this.ownerActor.width, this.ownerActor.height);

                return this;
            },
            getCurrentSpriteImageCSSPosition:function () {
                var el = this.mapInfo[this.spriteIndex];

                var x = -(el.x + this.parentOffsetX - this.offsetX);
                var y = -(el.y + this.parentOffsetY - this.offsetY);

                return '' + x + 'px ' +
                    y + 'px ' +
                    (this.ownerActor.transformation === CAAT.Foundation.SpriteImage.TR_TILE ? 'repeat' : 'no-repeat');
            },
            /**
             * Get the number of subimages in this compoundImage
             * @return {number}
             */
            getNumImages:function () {
                return this.rows * this.columns;
            },

            setUV:function (uvBuffer, uvIndex) {
                var im = this.image;

                if (!im.__texturePage) {
                    return;
                }

                var index = uvIndex;
                var sIndex = this.spriteIndex;
                var el = this.mapInfo[this.spriteIndex];

                var u = el.u;
                var v = el.v;
                var u1 = el.u1;
                var v1 = el.v1;
                if (this.offsetX || this.offsetY) {
                    var w = this.ownerActor.width;
                    var h = this.ownerActor.height;

                    var tp = im.__texturePage;

                    var _u = -this.offsetX / tp.width;
                    var _v = -this.offsetY / tp.height;
                    var _u1 = (w - this.offsetX) / tp.width;
                    var _v1 = (h - this.offsetY) / tp.height;

                    u = _u + im.__u;
                    v = _v + im.__v;
                    u1 = _u1 + im.__u;
                    v1 = _v1 + im.__v;
                }

                if (im.inverted) {
                    uvBuffer[index++] = u1;
                    uvBuffer[index++] = v;

                    uvBuffer[index++] = u1;
                    uvBuffer[index++] = v1;

                    uvBuffer[index++] = u;
                    uvBuffer[index++] = v1;

                    uvBuffer[index++] = u;
                    uvBuffer[index++] = v;
                } else {
                    uvBuffer[index++] = u;
                    uvBuffer[index++] = v;

                    uvBuffer[index++] = u1;
                    uvBuffer[index++] = v;

                    uvBuffer[index++] = u1;
                    uvBuffer[index++] = v1;

                    uvBuffer[index++] = u;
                    uvBuffer[index++] = v1;
                }
            },
            /**
             * Set the elapsed time needed to change the image index.
             * @param fps an integer indicating the time in milliseconds to change.
             * @return this
             */
            setChangeFPS:function (fps) {
                this.changeFPS = fps;
                return this;
            },
            /**
             * Set the transformation to apply to the Sprite image.
             * Any value of
             *  <li>TR_NONE
             *  <li>TR_FLIP_HORIZONTAL
             *  <li>TR_FLIP_VERTICAL
             *  <li>TR_FLIP_ALL
             *
             * @param transformation an integer indicating one of the previous values.
             * @return this
             */
            setSpriteTransformation:function (transformation) {
                this.transformation = transformation;
                var v = CAAT.Foundation.SpriteImage;
                switch (transformation) {
                    case v.TR_FLIP_HORIZONTAL:
                        this.paint = this.paintInvertedH;
                        break;
                    case v.TR_FLIP_VERTICAL:
                        this.paint = this.paintInvertedV;
                        break;
                    case v.TR_FLIP_ALL:
                        this.paint = this.paintInvertedHV;
                        break;
                    case v.TR_FIXED_TO_SIZE:
                        this.paint = this.paintScaled;
                        break;
                    case v.TR_FIXED_WIDTH_TO_SIZE:
                        this.paint = this.paintScaledWidth;
                        break;
                    case v.TR_TILE:
                        this.paint = this.paintTiled;
                        break;
                    default:
                        this.paint = this.paintN;
                }
                this.ownerActor.invalidate();
                return this;
            },

            resetAnimationTime:function () {
                this.prevAnimationTime = -1;
                return this;
            },

            /**
             * Set the sprite animation images index. This method accepts an array of objects which define indexes to
             * subimages inside this sprite image.
             * If the SpriteImage is instantiated by calling the method initialize( image, rows, cols ), the value of
             * aAnimationImageIndex should be an array of numbers, which define the indexes into an array of subimages
             * with size rows*columns.
             * If the method InitializeFromMap( image, map ) is called, the value for aAnimationImageIndex is expected
             * to be an array of strings which are the names of the subobjects contained in the map object.
             *
             * @param aAnimationImageIndex an array indicating the Sprite's frames.
             */
            setAnimationImageIndex:function (aAnimationImageIndex) {
                this.animationImageIndex = aAnimationImageIndex;
                this.spriteIndex = aAnimationImageIndex[0];
                this.prevAnimationTime = -1;

                return this;
            },
            setSpriteIndex:function (index) {
                this.spriteIndex = index;
                return this;
            },

            /**
             * Draws the sprite image calculated and stored in spriteIndex.
             *
             * @param time {number} Scene time when the bounding box is to be drawn.
             */
            setSpriteIndexAtTime:function (time) {

                if (this.animationImageIndex.length > 1) {
                    if (this.prevAnimationTime === -1) {
                        this.prevAnimationTime = time;

                        //thanks Phloog and ghthor, well spotted.
                        this.spriteIndex = this.animationImageIndex[0];
                        this.prevIndex= 0;
                        this.ownerActor.invalidate();
                    }
                    else {
                        var ttime = time;
                        ttime -= this.prevAnimationTime;
                        ttime /= this.changeFPS;
                        ttime %= this.animationImageIndex.length;
                        var idx = Math.floor(ttime);
//                    if ( this.spriteIndex!==idx ) {

                        if ( idx<this.prevIndex ) {   // we are getting back in time, or ended playing the animation
                            if ( this.callback ) {
                                this.callback( this, time );
                            }
                        }

                        this.prevIndex= idx;
                        this.spriteIndex = this.animationImageIndex[idx];
                        this.ownerActor.invalidate();
//                    }
                    }
                }
            },

            getMapInfo:function (index) {
                return this.mapInfo[ index ];
            },

            initializeFromGlyphDesigner : function( text ) {
                for (var i = 0; i < text.length; i++) {
                    if (0 === text[i].indexOf("char ")) {
                        var str = text[i].substring(5);
                        var pairs = str.split(' ');
                        var obj = {
                            x: 0,
                            y: 0,
                            width: 0,
                            height: 0,
                            xadvance: 0,
                            xoffset: 0,
                            yoffset: 0
                        };

                        for (var j = 0; j < pairs.length; j++) {
                            var pair = pairs[j];
                            var pairData = pair.split("=");
                            var key = pairData[0];
                            var value = pairData[1];
                            if (value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
                                value.substring(1, value.length - 1);
                            }
                            obj[ key ] = value;
                        }

                        this.addElement(String.fromCharCode(obj.id), obj);
                    }
                }

                return this;
            },

            /**
             * This method takes the output generated from the tool at http://labs.hyperandroid.com/static/texture/spriter.html
             * and creates a map into that image.
             * @param image {Image|HTMLImageElement|Canvas} an image
             * @param map {object} the map into the image to define subimages.
             */
            initializeFromMap:function (image, map) {
                this.initialize(image, 1, 1);

                var key;
                var helper;
                var count = 0;

                for (key in map) {
                    var value = map[key];

                    helper = new CAAT.Foundation.SpriteImageHelper(
                        parseFloat(value.x) + this.parentOffsetX,
                        parseFloat(value.y) + this.parentOffsetY,
                        parseFloat(value.width),
                        parseFloat(value.height),
                        image.width,
                        image.height
                    );

                    this.mapInfo[key] = helper;

                    // set a default spriteIndex
                    if (!count) {
                        this.setAnimationImageIndex([key]);
                    }

                    count++;
                }

                return this;
            },

            initializeFromTexturePackerJSON : function( image, obj ) {

                for( var img in obj.frames ) {
                    var imgData= obj.frames[img];

                    var si_obj= {
                        x: imgData.frame.x,
                        y: imgData.frame.y,
                        width: imgData.spriteSourceSize.w,
                        height: imgData.spriteSourceSize.h,
                        id: '0'
                    };

                    var si= new CAAT.Foundation.SpriteImage().initialize( image, 1, 1 );
                    si.addElement(0,si_obj);
                    CAAT.currentDirector.addImage( img.substring(0,img.indexOf('.')), si );
                }
            },

            /**
             * Add one element to the spriteImage.
             * @param key {string|number} index or sprite identifier.
             * @param value object{
             *      x: {number},
             *      y: {number},
             *      width: {number},
             *      height: {number},
             *      xoffset: {number=},
             *      yoffset: {number=},
             *      xadvance: {number=}
             *      }
             * @return {*}
             */
            addElement : function( key, value ) {
                var helper = new CAAT.Foundation.SpriteImageHelper(
                    parseFloat(value.x) + this.parentOffsetX,
                    parseFloat(value.y) + this.parentOffsetY,
                    parseFloat(value.width),
                    parseFloat(value.height),
                    this.image.width,
                    this.image.height );

                helper.xoffset = typeof value.xoffset === 'undefined' ? 0 : parseFloat(value.xoffset);
                helper.yoffset = typeof value.yoffset === 'undefined' ? 0 : parseFloat(value.yoffset);
                helper.xadvance = typeof value.xadvance === 'undefined' ? value.width : parseFloat(value.xadvance);

                this.mapInfo[key] = helper;

                return this;
            },

            /**
             *
             * @param image {Image|HTMLImageElement|Canvas}
             * @param map object with pairs "<a char>" : {
             *              id      : {number},
             *              height  : {number},
             *              xoffset : {number},
             *              letter  : {string},
             *              yoffset : {number},
             *              width   : {number},
             *              xadvance: {number},
             *              y       : {number},
             *              x       : {number}
             *          }
             */
            initializeAsGlyphDesigner:function (image, map) {
                this.initialize(image, 1, 1);

                var key;
                var helper;
                var count = 0;

                for (key in map) {
                    var value = map[key];

                    helper = new CAAT.Foundation.SpriteImageHelper(
                        parseFloat(value.x) + this.parentOffsetX,
                        parseFloat(value.y) + this.parentOffsetX,
                        parseFloat(value.width),
                        parseFloat(value.height),
                        image.width,
                        image.height
                    );

                    helper.xoffset = typeof value.xoffset === 'undefined' ? 0 : value.xoffset;
                    helper.yoffset = typeof value.yoffset === 'undefined' ? 0 : value.yoffset;
                    helper.xadvance = typeof value.xadvance === 'undefined' ? value.width : value.xadvance;

                    this.mapInfo[key] = helper;

                    // set a default spriteIndex
                    if (!count) {
                        this.setAnimationImageIndex([key]);
                    }

                    count++;
                }

                return this;

            },


            initializeAsFontMap:function (image, chars) {
                this.initialize(image, 1, 1);

                var helper;
                var x = 0;

                for (var i = 0; i < chars.length; i++) {
                    var value = chars[i];

                    helper = new CAAT.Foundation.SpriteImageHelper(
                        parseFloat(x) + this.parentOffsetX,
                        0 + this.parentOffsetY,
                        parseFloat(value.width),
                        image.height,
                        image.width,
                        image.height
                    );

                    helper.xoffset = 0;
                    helper.yoffset = 0;
                    helper.xadvance = value.width;


                    x += value.width;

                    this.mapInfo[chars[i].c] = helper;

                    // set a default spriteIndex
                    if (!i) {
                        this.setAnimationImageIndex([chars[i].c]);
                    }
                }

                return this;
            },

            /**
             * This method creates a font sprite image based on a proportional font
             * It assumes the font is evenly spaced in the image
             * Example:
             * var font =   new CAAT.SpriteImage().initializeAsMonoTypeFontMap(
             *  director.getImage('numbers'),
             *  "0123456789"
             * );
             */

            initializeAsMonoTypeFontMap:function (image, chars) {
                var map = [];
                var charArr = chars.split("");

                var w = image.width / charArr.length >> 0;

                for (var i = 0; i < charArr.length; i++) {
                    map.push({c:charArr[i], width:w });
                }

                return this.initializeAsFontMap(image, map);
            },

            stringWidth:function (str) {
                var i, l, w = 0, charInfo;

                for (i = 0, l = str.length; i < l; i++) {
                    charInfo = this.mapInfo[ str.charAt(i) ];
                    if (charInfo) {
                        w += charInfo.xadvance * this.fontScale;
                    }
                }

                return w;
            },

            stringHeight:function () {
                if (this.fontHeight) {
                    return this.fontHeight * this.fontScale;
                }

                var y = 0;
                for (var i in this.mapInfo) {
                    var mi = this.mapInfo[i];

                    var h = mi.height + mi.yoffset;
                    if (h > y) {
                        y = h;
                    }
                }

                this.fontHeight = y;
                return this.fontHeight * this.fontScale;
            },

            drawText:function (str, ctx, x, y) {
                var i, l, charInfo, w;

                for (i = 0; i < str.length; i++) {
                    charInfo = this.mapInfo[ str.charAt(i) ];
                    if (charInfo) {
                        w = charInfo.width;
                        if ( w>0 && charInfo.height>0 ) {
                            ctx.drawImage(
                                this.image,
                                charInfo.x, charInfo.y,
                                w, charInfo.height,

                                x + charInfo.xoffset* this.fontScale, y + charInfo.yoffset* this.fontScale,
                                w* this.fontScale, charInfo.height* this.fontScale);
                        }
                        x += charInfo.xadvance* this.fontScale;
                    }
                }
            },

            getFontData : function() {
                var as= (this.stringHeight() *.8)>>0;
                return {
                    height : this.stringHeight(),
                    ascent : as,
                    descent: this.stringHeight() - as
                };

            }

        }
    }
});
