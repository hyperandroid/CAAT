CAAT.Module({

    /**
     * @name ShapeActor
     * @memberOf CAAT.Foundation.UI
     * @extends CAAT.Foundation.ActorContainer
     * @constructor
     */

    defines : "CAAT.Foundation.UI.ShapeActor",
    aliases : ["CAAT.ShapeActor"],
    extendsClass : "CAAT.Foundation.ActorContainer",
    depends : [
        "CAAT.Foundation.ActorContainer"
    ],
    constants : {

        /**
         * @lends CAAT.Foundation.UI.ShapeActor
         */

        /** @const */ SHAPE_CIRCLE:   0,      // Constants to describe different shapes.
        /** @const */ SHAPE_RECTANGLE:1
    },
    extendsWith : {

        /**
         * @lends CAAT.Foundation.UI.ShapeActor.prototype
         */

        __init : function() {
            this.__super();
            this.compositeOp= 'source-over';

            /**
             * Thanks Svend Dutz and Thomas Karolski for noticing this call was not performed by default,
             * so if no explicit call to setShape was made, nothing would be drawn.
             */
            this.setShape( CAAT.Foundation.UI.ShapeActor.SHAPE_CIRCLE );
            return this;
        },

        /**
         * Define this actor shape: rectangle or circle
         */
        shape:          0,      // shape type. One of the constant SHAPE_* values

        /**
         * Set this shape composite operation when drawing it.
         */
        compositeOp:    null,   // a valid canvas rendering context string describing compositeOps.

        /**
         * Stroke the shape with this line width.
         */
        lineWidth:      1,

        /**
         * Stroke the shape with this line cap.
         */
        lineCap:        null,

        /**
         * Stroke the shape with this line Join.
         */
        lineJoin:       null,

        /**
         * Stroke the shape with this line mitter limit.
         */
        miterLimit:     null,

        /**
         * 
         * @param l {number>0}
         */
        setLineWidth : function(l)  {
            this.lineWidth= l;
            return this;
        },
        /**
         *
         * @param lc {string{butt|round|square}}
         */
        setLineCap : function(lc)   {
            this.lineCap= lc;
            return this;
        },
        /**
         *
         * @param lj {string{bevel|round|miter}}
         */
        setLineJoin : function(lj)  {
            this.lineJoin= lj;
            return this;
        },
        /**
         *
         * @param ml {integer>0}
         */
        setMiterLimit : function(ml)    {
            this.miterLimit= ml;
            return this;
        },
        getLineCap : function() {
            return this.lineCap;
        },
        getLineJoin : function()    {
            return this.lineJoin;
        },
        getMiterLimit : function()  {
            return this.miterLimit;
        },
        getLineWidth : function()   {
            return this.lineWidth;
        },
        /**
         * Sets shape type.
         * No check for parameter validity is performed.
         * Set paint method according to the shape.
         * @param iShape an integer with any of the SHAPE_* constants.
         * @return this
         */
        setShape : function(iShape) {
            this.shape= iShape;
            this.paint= this.shape===CAAT.Foundation.UI.ShapeActor.SHAPE_CIRCLE ?
                    this.paintCircle :
                    this.paintRectangle;
            return this;
        },
        /**
         * Sets the composite operation to apply on shape drawing.
         * @param compositeOp an string with a valid canvas rendering context string describing compositeOps.
         * @return this
         */
        setCompositeOp : function(compositeOp){
            this.compositeOp= compositeOp;
            return this;
        },
        /**
         * Draws the shape.
         * Applies the values of fillStype, strokeStyle, compositeOp, etc.
         *
         * @param director a valid CAAT.Director instance.
         * @param time an integer with the Scene time the Actor is being drawn.
         */
        paint : function(director,time) {
        },
        /**
         * @private
         * Draws a circle.
         * @param director a valid CAAT.Director instance.
         * @param time an integer with the Scene time the Actor is being drawn.
         */
        paintCircle : function(director,time) {

            if ( this.cached ) {
                CAAT.Foundation.ActorContainer.prototype.paint.call( this, director, time );
                return;
            }

            var ctx= director.ctx;

            ctx.lineWidth= this.lineWidth;

            ctx.globalCompositeOperation= this.compositeOp;
            if ( null!==this.fillStyle ) {
                ctx.fillStyle= this.fillStyle;
                ctx.beginPath();
                ctx.arc( this.width/2, this.height/2, Math.min(this.width,this.height)/2- this.lineWidth/2, 0, 2*Math.PI, false );
                ctx.fill();
            }

            if ( null!==this.strokeStyle ) {
                ctx.strokeStyle= this.strokeStyle;
                ctx.beginPath();
                ctx.arc( this.width/2, this.height/2, Math.min(this.width,this.height)/2- this.lineWidth/2, 0, 2*Math.PI, false );
                ctx.stroke();
            }
        },
        /**
         *
         * Private
         * Draws a Rectangle.
         *
         * @param director a valid CAAT.Director instance.
         * @param time an integer with the Scene time the Actor is being drawn.
         */
        paintRectangle : function(director,time) {

            if ( this.cached ) {
                CAAT.Foundation.ActorContainer.prototype.paint.call( this, director, time );
                return;
            }

            var ctx= director.ctx;

            ctx.lineWidth= this.lineWidth;

            if ( this.lineCap ) {
                ctx.lineCap= this.lineCap;
            }
            if ( this.lineJoin )    {
                ctx.lineJoin= this.lineJoin;
            }
            if ( this.miterLimit )  {
                ctx.miterLimit= this.miterLimit;
            }

            ctx.globalCompositeOperation= this.compositeOp;
            if ( null!==this.fillStyle ) {
                ctx.fillStyle= this.fillStyle;
                ctx.beginPath();
                ctx.fillRect(0,0,this.width,this.height);
                ctx.fill();
            }

            if ( null!==this.strokeStyle ) {
                ctx.strokeStyle= this.strokeStyle;
                ctx.beginPath();
                ctx.strokeRect(0,0,this.width,this.height);
                ctx.stroke();
            }
        }
    }

});
