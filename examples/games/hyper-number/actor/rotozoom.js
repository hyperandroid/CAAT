(function() {
    HN.RotoZoom = function() {
        return this;
    };

    HN.RotoZoom.prototype= {
        pattern:    null,
        width:      0,
        height:     0,
        size:       3000,
        setDimension : function(w,h) {
            this.width= w;
            this.height= h;
            return this;
        },
        setPattern : function(pattern) {
            this.pattern= pattern;
            return this;
        },
        apply : function(ctx) {

            //ctx.clearRect(0,0,this.width,this.height);

            ctx.rect(0,0,this.width,this.height);
            ctx.clip();

            var scaleX, scaleY, tx, ty;
            var timer = new Date().getTime();

            tx = this.width/2 + Math.sin(timer * 0.0001) * 256;
            ty = this.height/2 + Math.sin(timer * 0.0001) * 256;
            scaleX = (Math.sin(timer*0.00005) + 1.1) * 3.5;
            scaleY = scaleX;
            var angle=Math.PI*2 * Math.cos(timer * 0.00005);

            ctx.save();

                ctx.translate(tx, ty);
                ctx.rotate(angle);
                ctx.translate(-tx, -ty);

                ctx.translate(tx - this.size, ty - this.size);
                ctx.scale(scaleX, scaleY);
                ctx.translate(
                    -(tx - this.size / scaleX),
                    -(ty - this.size / scaleY));
                ctx.fillStyle= this.pattern;
                ctx.fillRect(
                    this.width/2-this.size,
                    this.height/2-this.size,
                    2*this.size,
                    2*this.size);
            ctx.restore();

        }
    };
})();

(function() {
    HN.RotoZoomActor= function() {
        HN.RotoZoomActor.superclass.constructor.call(this);
        return this;
    };

    extend( HN.RotoZoomActor, CAAT.Actor, {
        rotozoomer: null,

        initialize : function(director, image) {
            var pattern= director.ctx.createPattern(image,'repeat');
            this.rotozoomer= new HN.RotoZoom().
                    setDimension(this.width,this.height).
                    setPattern( pattern );
            return this;
        },
        paint : function(director,time) {
            this.rotozoomer.apply(director.ctx);
        }
    });
})();