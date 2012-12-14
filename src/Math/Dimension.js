CAAT.Module({
    defines:"CAAT.Math.Dimension",
    aliases:["CAAT.Dimension"],
    extendsWith:function () {
        return {

            width:0,
            height:0,

            __init:function (w, h) {
                this.width = w;
                this.height = h;
                return this;
            }
        }
    }
});
