CAAT.Module( {
    defines : "HN.Grass",
    extendsWith : {

        alto_hierba:0, // grass height
        maxAngle:0, // maximum grass rotation angle (wind movement)
        angle:0, // construction angle. thus, every grass is different to others
        coords:null, // quadric bezier curves coordinates
        color:null, // grass color. modified by ambient component.
        offset_control_point:3, // grass base size. greater values, wider at the basement.


        initialize:function (canvasWidth, canvasHeight, minHeight, maxHeight, angleMax, initialMaxAngle) {

            // grass start position
            var sx = Math.floor(Math.random() * canvasWidth);
            var sy = canvasHeight;

            var offset_control_x = 2;


            this.alto_hierba = minHeight + Math.random() * maxHeight;
            this.maxAngle = 10 + Math.random() * angleMax;
            this.angle = Math.random() * initialMaxAngle * (Math.random() < .5 ? 1 : -1) * Math.PI / 180;

            // hand crafted value. modify offset_control_x to play with grass curvature slope.
            var csx = sx - offset_control_x;

            // curvatura de la hierba. - menor, curva mas tiesa. +valor, hierba lacia.
            // grass curvature. greater values make grass bender.
            var csy = sy - this.alto_hierba / 2;

            var psx = csx;
            var psy = csy;

            // the bigger offset_control_point, the wider on its basement.
            this.offset_control_point = 10;
            var dx = sx + this.offset_control_point;
            var dy = sy;

            this.coords = [sx, sy, csx, csy, psx, psy, dx, dy];

            // grass color.
            this.color = [16 + Math.floor(Math.random() * 32),
                100 + Math.floor(Math.random() * 155),
                16 + Math.floor(Math.random() * 32) ];

        },

        /**
         * paint every grass.
         * @param ctx is the canvas2drendering context
         * @param time for grass animation.
         * @param ambient parameter to dim or brighten every grass.
         * @returns nothing
         */
        paint:function (ctx, time, ambient) {
            // grass peak position. how much to rotate the peak.
            // less values (ie the .0005), will make as if there were a softer wind.
            var inc_punta_hierba = Math.sin(time * .0005);

            // rotate the point, so grass curves are modified accordingly. If just moved horizontally, the curbe would
            // end by being unstable with undesired visuals.
            var ang = this.angle + Math.PI / 2 + inc_punta_hierba * Math.PI / 180 * (this.maxAngle * Math.cos(time * .0002));
            var px = this.coords[0] + this.offset_control_point + this.alto_hierba * Math.cos(ang);
            var py = this.coords[1] - this.alto_hierba * Math.sin(ang);

            ctx.beginPath();
            ctx.moveTo(this.coords[0], this.coords[1]);
            ctx.bezierCurveTo(this.coords[0], this.coords[1], this.coords[2], this.coords[3], px, py);

            ctx.bezierCurveTo(px, py, this.coords[4], this.coords[5], this.coords[6], this.coords[7]);
            ctx.closePath();
            ctx.fillStyle = 'rgb(' +
                Math.floor(this.color[0] * ambient) + ',' +
                Math.floor(this.color[1] * ambient) + ',' +
                Math.floor(this.color[2] * ambient) + ')';
            ctx.fill();

        }
    }
});
