
(function() {
	HN.Grass = function() {
		return this;
	};

	HN.Grass.prototype= {

		alto_hierba:			0,		// grass height
		maxAngle:				0,		// maximum grass rotation angle (wind movement)
		angle:					0,		// construction angle. thus, every grass is different to others
		coords:					null,	// quadric bezier curves coordinates
		color:					null,	// grass color. modified by ambient component.
		offset_control_point: 	3,		// grass base size. greater values, wider at the basement.

		initialize : function(canvasWidth, canvasHeight, minHeight, maxHeight, angleMax, initialMaxAngle)	{

	        // grass start position
			var sx= Math.floor( Math.random()*canvasWidth );
			var sy= canvasHeight;

	        var offset_control_x=2;


			this.alto_hierba= minHeight+Math.random()*maxHeight;
			this.maxAngle= 10+Math.random()*angleMax;
			this.angle= Math.random()*initialMaxAngle*(Math.random()<.5?1:-1)*Math.PI/180;

			// hand crafted value. modify offset_control_x to play with grass curvature slope.
	        var csx= sx-offset_control_x ;

	        // curvatura de la hierba. - menor, curva mas tiesa. +valor, hierba lacia.
	        // grass curvature. greater values make grass bender.
	        var csy= sy-this.alto_hierba/2;

	        var psx= csx;
	        var psy= csy;

	        // the bigger offset_control_point, the wider on its basement.
	        this.offset_control_point=10;
	        var dx= sx+this.offset_control_point;
	        var dy= sy;

	        this.coords= [sx,sy,csx,csy,psx,psy,dx,dy];

	        // grass color.
	        this.color= [16+Math.floor(Math.random()*32),
	                     100+Math.floor(Math.random()*155),
	                     16+Math.floor(Math.random()*32) ];

		},

		/**
		 * paint every grass.
		 * @param ctx is the canvas2drendering context
		 * @param time for grass animation.
		 * @param ambient parameter to dim or brighten every grass.
		 * @returns nothing
		 */
		paint : function(ctx,time,ambient) {

//	        ctx.save();

	        // grass peak position. how much to rotate the peak.
	        // less values (ie the .0005), will make as if there were a softer wind.
	        var inc_punta_hierba= Math.sin(time*.0005);

	        // rotate the point, so grass curves are modified accordingly. If just moved horizontally, the curbe would
	        // end by being unstable with undesired visuals.
	        var ang= this.angle + Math.PI/2 + inc_punta_hierba * Math.PI/180*(this.maxAngle*Math.cos(time*.0002));
	        var px= this.coords[0]+ this.offset_control_point + this.alto_hierba*Math.cos(ang);
	        var py= this.coords[1]   			  			 - this.alto_hierba*Math.sin(ang);

	        ctx.beginPath();
	        ctx.moveTo( this.coords[0], this.coords[1] );
	        ctx.bezierCurveTo(this.coords[0], this.coords[1], this.coords[2], this.coords[3], px, py);

	        ctx.bezierCurveTo(px, py, this.coords[4], this.coords[5],  this.coords[6], this.coords[7]);
	        ctx.closePath();
	        ctx.fillStyle='rgb('+
	        		Math.floor(this.color[0]*ambient)+','+
	        		Math.floor(this.color[1]*ambient)+','+
	        		Math.floor(this.color[2]*ambient)+')';
	        ctx.fill();
/*
            ctx.strokeStyle='rgb('+
	        		Math.floor(this.color[0]*ambient)+','+
	        		Math.floor(this.color[1]*ambient)+','+
	        		Math.floor(this.color[2]*ambient)+')';
            ctx.stroke();
*/
//	        ctx.restore();

		}
	};
})();

(function() {
	HN.Garden= function() {
        HN.Garden.superclass.constructor.call(this);
		return this;
	};

	extend( HN.Garden, CAAT.Actor, {
		grass:			null,
		ambient:		1,
		stars:			null,
		firefly_radius:	10,
		num_fireflyes:	40,
		num_stars:		512,
        fireflyColor:   [ '#ffff00', '#7fff00', '#c0c000' ],

		initialize : function(ctx,size,maxGrassHeight)	{
			this.grass= [];

			for(var i=0; i<size; i++ ) {
				var g= new HN.Grass();
				g.initialize(
						this.width,
						this.height,
						50,			// min grass height
						maxGrassHeight, // max grass height
						20, 		// grass max initial random angle
						40			// max random angle for animation
						);
				this.grass.push(g);
			}

			this.stars= [];
			for( i=0; i<this.num_stars; i++ )	{
				this.stars.push( Math.floor( Math.random()*(this.width-10)+5  ) );
				this.stars.push( Math.floor( Math.random()*(this.height-10)+5 ) );
			}

            this.lerp(ctx,0,2000);

            return this;
		},

		paint : function(director, time){


			var ctx= director.ctx;
/*
            ctx.fillStyle= this.gradient;
            ctx.fillRect(0,0,this.width,this.height);
*/
			// draw stars if ambient below .3 -> night
			if ( this.ambient<.3 )	{

				// modify stars translucency by ambient (as transitioning to day, make them dissapear).
				ctx.globalAlpha= 1-((this.ambient-.05)/.25);

				// as well as making them dimmer
				var intensity= 1 - (this.ambient/2-.05)/.25;

				// how white do you want the stars to be ??
				var c= Math.floor( 192*intensity );
				var strc= 'rgb('+c+','+c+','+c+')';
				ctx.strokeStyle=strc;

				// first num_fireflyes coordinates are fireflyes themshelves.
				for( var j=this.num_fireflyes*2; j<this.stars.length; j+=2 )	{
					var inc=1;
					if ( j%3==0 ) {
						inc=1.5;
					} else if ( j%11==0 ) {
						inc=2.5;
					}
					this.stars[j]= (this.stars[j]+.1*inc)%this.width;

					var y= this.stars[j+1];
					ctx.strokeRect(this.stars[j],this.stars[j+1],1,1);

				}
			}

			ctx.globalAlpha= 1;

			// draw fireflyes

	    	for(var i=0; i<this.num_fireflyes*2; i+=2) {
                ctx.fillStyle= this.fireflyColor[i%3];
		    	var angle= Math.PI*2*Math.sin(time*3E-4) + i*Math.PI/50;
		    	var radius= this.firefly_radius*Math.cos(time*3E-4);
                ctx.beginPath();
		    	ctx.arc(
		    			this.width/2 +
		    			.5*this.stars[i] +
		    			150*Math.cos(time*3E-4) +	// move horizontally with time
		    			(radius+20*Math.cos((i%5)*Math.PI/3600))*Math.cos(angle),

		    			this.height/2 +
		    			.5*this.stars[i+1] +
		    			20*Math.sin(time*3E-4) +	// move vertically with time
		    			radius*Math.sin(angle),

		   			 	2,
		   			 	0,
                        Math.PI*2,
                        false );
                ctx.fill();
	    	}

			for( var i=0; i<this.grass.length; i++ ) {
				this.grass[i].paint(ctx,time,this.ambient);
			}

            // lerp.
            if ( time>this.nextLerpTime ) {
                this.lerpindex= Math.floor((time-this.nextLerpTime)/this.nextLerpTime);
                if ( (time-this.nextLerpTime)%this.nextLerpTime<this.lerpTime ) {
                    this.lerp( ctx, (time-this.nextLerpTime)%this.nextLerpTime, this.lerpTime );
                }
            }

		},

        gradient:       null,
        lerpTime:       10000,		// time taken to fade sky colors
        nextLerpTime:   15000,	// after fading, how much time to wait to fade colors again.
        colors:         [
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
                              0xff, 0x7f, 0x00 ] ],

        ambients:       [ 1, .35, .05, .5 ],    // ambient intensities for each sky color
        lerpindex:      0,                      // start with this sky index.

        /**
         * fade sky colors
         * @param time current time
         * @param last how much time to take fading colors
         */
        lerp: function( ctx, time, last ) {
            this.gradient= ctx.createLinearGradient(0,0,0,this.height);

            var i0= this.lerpindex%this.colors.length;
            var i1= (this.lerpindex+1)%this.colors.length;

            for( var i=0; i<4; i++ )	{
                var rgb='rgb(';
                for( var j=0; j<3; j++ ) {
                    rgb+= Math.floor( (this.colors[i1][i*3+j]-this.colors[i0][i*3+j])*time/last + this.colors[i0][i*3+j]);
                    if ( j<2 ) rgb+=',';
                }
                rgb+=')';
                this.gradient.addColorStop( i/3, rgb );
            }

            this.ambient= (this.ambients[i1]-this.ambients[i0])*time/last + this.ambients[i0];
        }

	});
})();

(function() {

    HN.GardenScene= function() {
        return this;
    };

    HN.GardenScene.prototype= {

        gameScene:      null,
        directorScene:  null,
        director:       null,
        buttonImage:    null,

        /**
         * Creates the main game Scene.
         * @param director a CAAT.Director instance.
         */
        create : function(director, gardenSize) {
            this.director= director;
            this.directorScene= director.createScene();

            var dw= director.canvas.width;
            var dh= director.canvas.height;
            var me= this;

            this.directorScene.addChild(
                    new CAAT.ImageActor().
                            create().
                            setBounds(0,0,dw,dh).
                            setImage( director.getImage('background') ).
                            setOffsetY( -director.getImage('background').height+dh ).
                            setClip(true)
                    );

            // fondo. jardin.
            this.directorScene.addChild(
                    new HN.Garden().
                            create().
                            setBounds(0,0,dw,dh).
                            initialize( director.ctx, gardenSize, dh/2 )
                    );

            var madeWith= new CAAT.Button().
                    create().
                    initialize( new CAAT.CompoundImage().initialize(director.getImage('madewith'),1,1), 0,0,0,0 ).
                    setLocation( dw-60, 0 );
            this.directorScene.addChild(madeWith);


            this.buttonImage= new CAAT.CompoundImage().initialize(
                    director.getImage('buttons'), 6,4 );

            var bw=         this.buttonImage.singleWidth;
            var bh=         this.buttonImage.singleHeight;
            var numButtons= 4;
            var yGap=       10;

            var offsetY= (dh -((bh+yGap)*numButtons - yGap))/2;

            // opciones del menu.
            var easy= new CAAT.Button().
                    create().
                    initialize(this.buttonImage, 0, 1, 2, 3, function() {
                        //director.switchToNextScene(1000,false,true);
                        me.gameScene.setDifficulty(0);
                        me.gameScene.prepareSceneIn();
                        director.easeInOut(
                                1,
                                CAAT.Scene.EASE_TRANSLATE,
                                CAAT.Actor.prototype.ANCHOR_RIGHT,
                                0,
                                CAAT.Scene.EASE_TRANSLATE,
                                CAAT.Actor.prototype.ANCHOR_LEFT,
                                1000,
                                false,
                                new CAAT.Interpolator().createExponentialInOutInterpolator(3,false),
                                new CAAT.Interpolator().createExponentialInOutInterpolator(3,false) );
                    }).
                    setBounds( (dw-bw)/2, offsetY, bw, bh );

            var medium= new CAAT.Button().
                    create().
                    initialize(this.buttonImage, 4,5,6,7,function() {
                        //director.switchToNextScene(1000,false,true);
                        me.gameScene.setDifficulty(1);
                        me.gameScene.prepareSceneIn();
                        director.easeInOut(
                                1,
                                CAAT.Scene.EASE_TRANSLATE,
                                CAAT.Actor.prototype.ANCHOR_TOP,
                                0,
                                CAAT.Scene.EASE_TRANSLATE,
                                CAAT.Actor.prototype.ANCHOR_BOTTOM,
                                1000,
                                false,
                                new CAAT.Interpolator().createExponentialInOutInterpolator(3,false),
                                new CAAT.Interpolator().createExponentialInOutInterpolator(3,false) );
                    }).
                    setBounds( (dw-bw)/2, offsetY + yGap+bh, bw, bh );

            var hard= new CAAT.Button().
                    create().
                    initialize(this.buttonImage, 8,9,10,11,function() {
                        //director.switchToNextScene(1000,false,true);
                        me.gameScene.setDifficulty(2);
                        me.gameScene.prepareSceneIn();
                        director.easeInOut(
                                1,
                                CAAT.Scene.EASE_TRANSLATE,
                                CAAT.Actor.prototype.ANCHOR_BOTTOM,
                                0,
                                CAAT.Scene.EASE_TRANSLATE,
                                CAAT.Actor.prototype.ANCHOR_TOP,
                                1000,
                                false,
                                new CAAT.Interpolator().createExponentialInOutInterpolator(3,false),
                                new CAAT.Interpolator().createExponentialInOutInterpolator(3,false) );
                    }).
                    setBounds( (dw-bw)/2, offsetY + 2*(yGap+bh), bw, bh );

            var info= new CAAT.Button().
                    create().
                    initialize(this.buttonImage, 16,17,18,19).
                    setBounds( (dw-bw)/2, offsetY + 3.5*(yGap+bh), bw, bh );

            this.directorScene.addChild(easy);
            this.directorScene.addChild(medium);
            this.directorScene.addChild(hard);
            this.directorScene.addChild(info);

            return this;
        }
    };
})();