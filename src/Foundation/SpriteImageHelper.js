CAAT.Module( {
    defines : "CAAT.Foundation.SpriteImageHelper",

    extendsWith : {
        __init : function (x, y, w, h, iw, ih) {
            this.x = x;
            this.y = y;
            this.width = w;
            this.height = h;

            this.setGL(x / iw, y / ih, (x + w - 1) / iw, (y + h - 1) / ih);
            return this;
        },

        x:0,
        y:0,
        width:0,
        height:0,
        u:0,
        v:0,
        u1:0,
        v1:0,

        setGL:function (u, v, u1, v1) {
            this.u = u;
            this.v = v;
            this.u1 = u1;
            this.v1 = v1;
            return this;
        }
    }
});
