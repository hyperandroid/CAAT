CAAT.Module({

    defines:"HN.Garden",
    depends:[
        "CAAT.Foundation.Actor",
        "HN.Grass"
    ],
    extendsClass: "CAAT.Foundation.Actor",
    extendsWith:function () {


        return  {
            grass:null,
            ambient:1,
            stars:null,
            firefly_radius:10,
            num_fireflyes:40,
            num_stars:512,
            fireflyColor:[ '#ffff00', '#7fff00', '#c0c000' ],
            backgroundEnabled:true,

            initialize:function (ctx, size, maxGrassHeight) {
                this.grass = [];

                for (var i = 0; i < size; i++) {
                    var g = new HN.Grass();
                    g.initialize(
                        this.width,
                        this.height,
                        50, // min grass height
                        maxGrassHeight, // max grass height
                        20, // grass max initial random angle
                        40            // max random angle for animation
                    );
                    this.grass.push(g);
                }

                this.stars = [];
                for (i = 0; i < this.num_stars; i++) {
                    this.stars.push(Math.floor(Math.random() * (this.width - 10) + 5));
                    this.stars.push(Math.floor(Math.random() * (this.height - 10) + 5));
                }

                if (this.backgroundEnabled) {
                    this.lerp(ctx, 0, 2000);
                }

                return this;
            },
            paint:function (director, time) {


                var ctx = director.ctx;

                if (this.backgroundEnabled) {
                    ctx.fillStyle = this.gradient;
                    ctx.fillRect(0, 0, this.width, this.height);

                    // draw stars if ambient below .3 -> night
                    if (this.ambient < .3) {

                        // modify stars translucency by ambient (as transitioning to day, make them dissapear).
                        ctx.globalAlpha = 1 - ((this.ambient - .05) / .25);

                        // as well as making them dimmer
                        var intensity = 1 - (this.ambient / 2 - .05) / .25;

                        // how white do you want the stars to be ??
                        var c = Math.floor(192 * intensity);
                        var strc = 'rgb(' + c + ',' + c + ',' + c + ')';
                        ctx.strokeStyle = strc;

                        // first num_fireflyes coordinates are fireflyes themshelves.
                        for (var j = this.num_fireflyes * 2; j < this.stars.length; j += 2) {
                            var inc = 1;
                            if (j % 3 == 0) {
                                inc = 1.5;
                            } else if (j % 11 == 0) {
                                inc = 2.5;
                            }
                            this.stars[j] = (this.stars[j] + .1 * inc) % this.width;

                            var y = this.stars[j + 1];
                            ctx.strokeRect(this.stars[j], this.stars[j + 1], 1, 1);

                        }
                    }

                    ctx.globalAlpha = 1;
                }

                // draw fireflyes

                for (var i = 0; i < this.num_fireflyes * 2; i += 2) {
                    ctx.fillStyle = this.fireflyColor[i % 3];
                    var angle = Math.PI * 2 * Math.sin(time * 3E-4) + i * Math.PI / 50;
                    var radius = this.firefly_radius * Math.cos(time * 3E-4);
                    var fy = this.height - this.height * .3 +
                        .5 * this.stars[i + 1] +
                        20 * Math.sin(time * 3E-4) + // move vertically with time
                        radius * Math.sin(angle);

                    if (fy < director.height) {
                        ctx.beginPath();
                        ctx.arc(
                            this.width / 2 +
                                .5 * this.stars[i] +
                                150 * Math.cos(time * 3E-4) + // move horizontally with time
                                (radius + 20 * Math.cos((i % 5) * Math.PI / 3600)) * Math.cos(angle),

                            fy,

                            2,
                            0,
                            Math.PI * 2,
                            false);
                        ctx.fill();
                    }
                }

                for (var i = 0; i < this.grass.length; i++) {
                    this.grass[i].paint(ctx, time, this.ambient);
                }


                if (this.backgroundEnabled) {
                    // lerp.
                    if (time > this.nextLerpTime) {
                        this.lerpindex = Math.floor((time - this.nextLerpTime) / this.nextLerpTime);
                        if ((time - this.nextLerpTime) % this.nextLerpTime < this.lerpTime) {
                            this.lerp(ctx, (time - this.nextLerpTime) % this.nextLerpTime, this.lerpTime);
                        }
                    }
                }
            },

            gradient:null,
            lerpTime:10000, // time taken to fade sky colors
            nextLerpTime:15000, // after fading, how much time to wait to fade colors again.
            colors:[
                [   0x00, 0x3f, 0x7f, //0x00, 0x00, 0x3f,
                    0x00, 0x3f, 0x7f,
                    0x1f, 0x5f, 0xc0,
                    0x3f, 0xa0, 0xff ],

                [   0x00, 0x3f, 0x7f,
                    0xa0, 0x5f, 0x7f,
                    0xff, 0x90, 0xe0,
                    0xff, 0x90, 0x00 ],

                [     0x00, 0x3f, 0x7f, //0x00, 0x00, 0x00,
                    0x00, 0x2f, 0x7f,
                    0x00, 0x28, 0x50,
                    0x00, 0x1f, 0x3f ],

                [ 0x00, 0x3f, 0x7f, //0x1f, 0x00, 0x5f,
                    0x3f, 0x2f, 0xa0,
                    0xa0, 0x1f, 0x1f,
                    0xff, 0x7f, 0x00 ]
            ],

            ambients:[ 1, .35, .05, .5 ], // ambient intensities for each sky color
            lerpindex:0, // start with this sky index.

            /**
             * fade sky colors
             */
            lerp:function (ctx, time, last) {
                this.gradient = ctx.createLinearGradient(0, 0, 0, this.height);

                var i0 = this.lerpindex % this.colors.length;
                var i1 = (this.lerpindex + 1) % this.colors.length;

                for (var i = 0; i < 4; i++) {
                    var rgb = 'rgb(';
                    for (var j = 0; j < 3; j++) {
                        rgb += Math.floor((this.colors[i1][i * 3 + j] - this.colors[i0][i * 3 + j]) * time / last + this.colors[i0][i * 3 + j]);
                        if (j < 2) rgb += ',';
                    }
                    rgb += ')';
                    this.gradient.addColorStop(i / 3, rgb);
                }

                this.ambient = (this.ambients[i1] - this.ambients[i0]) * time / last + this.ambients[i0];
            }

        }

    }
});