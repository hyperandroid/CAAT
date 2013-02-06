CAAT.Module({
    defines : "CAAT.FC.Ship",
    depends : [
        "CAAT.Foundation.Actor"
    ],
    extendsClass : "CAAT.Foundation.Actor",
    extendsWith : {

        style : 'rgba(0,0,255,.8)',

        paint : function( director, time ) {
            var ctx = director.ctx;

            ctx.strokeStyle = this.style;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(this.width / 2, this.height / 2, this.width / 2, 0, 2 * Math.PI, false);
            ctx.stroke();

            var _sizeship = this.width / 2 - 4;
            ctx.globalAlpha = 1;
            ctx.fillStyle = this.style;

            ctx.save();
            ctx.beginPath();

            ctx.translate(this.width / 2, this.height / 2);
            ctx.moveTo(_sizeship, 0);
            ctx.lineTo(_sizeship * Math.cos(3 * Math.PI / 4), _sizeship * Math.sin(3 * Math.PI / 4));
            ctx.lineTo(_sizeship * Math.cos(5 * Math.PI / 4), _sizeship * Math.sin(5 * Math.PI / 4));
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        },

        setFillStyle : function(style) {
            this.style= style;
            return this;
        }
    }
});