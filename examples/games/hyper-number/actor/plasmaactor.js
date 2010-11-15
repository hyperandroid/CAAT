(function() {
    HN.Plasma= function() {
        return this;
    };

    HN.Plasma.prototype= {

        dstImageData: null,

        m_awidth:   0,
        m_aheight:  0,

        // plasma
        wavetable:  null,
        m_colorMap: null,
        spd1:       1,
        spd2:       2,
        spd3:       3,
        spd4:       4,
        pos1:       0,
        pos2:       0,
        pos3:       0,
        pos4:       0,
        tpos1:      0,
        tpos2:      0,
        tpos3:      0,
        tpos4:      0,
        m_colorMapSize: 256,
        i1:             0,
        i2:             0,
        i3:             0,
        i4:             0,
        b1:             false,
        b2:             false,
        b3:             false,
        b4:             false,
        fc:             1000,
        mfc:            1000,

        color:          [0xff00ff, 0xffff00, 0xff0000, 0x000000],

        timeStep:       20,
        canvas:         null,
        ctx:            null,

        prevTime:       0,

        setB : function ()	{
            this.b1= (Math.random()>.5);
            this.b2= (Math.random()>.5);
            this.b3= (Math.random()>.5);
            this.b4= (Math.random()>.5);

            this.spd1= Math.floor(((Math.random()*3+1)*((Math.random()<.5) ? 1 : -1)));
            this.spd2= Math.floor(((Math.random()*3+1)*((Math.random()<.5) ? 1 : -1)));
            this.spd3= Math.floor(((Math.random()*3+1)*((Math.random()<.5) ? 1 : -1)));
            this.spd4= Math.floor(((Math.random()*3+1)*((Math.random()<.5) ? 1 : -1)));

            this.i1= Math.floor(((Math.random()*2.4+1)*((Math.random()<.5) ? 1 : -1)));
            this.i2= Math.floor(((Math.random()*2.4+1)*((Math.random()<.5) ? 1 : -1)));
            this.i3= Math.floor(((Math.random()*2.4+1)*((Math.random()<.5) ? 1 : -1)));
            this.i4= Math.floor(((Math.random()*2.4+1)*((Math.random()<.5) ? 1 : -1)));

            this.spd1>>=0;
            this.spd2>>=0;
            this.spd3>>=0;
            this.spd4>>=0;

            this.i1>>=0;
            this.i2>>=0;
            this.i3>>=0;
            this.i4>>=0;

        },
        makeArray : function (size, initvalue) {
            var a= [];
            for(var i=0; i<size; i++ )  {
                a.push( initvalue );
            }
            return a;
        },
        setupPlasma : function ()	{
            var x, y;
            this.wavetable=     this.makeArray(256,0);
            this.m_colorMap=    this.makeArray(this.m_colorMapSize,0);

            var r= 0xff<<16;
	        var g= 0xff<<16;
	        var b= 0;
	        var c;

            var i;

            for( i=0; i<this.m_colorMapSize/3; i++ ) {
                b+= ( (0xff<<16)/(this.m_colorMapSize/3) );
                c= 0xff000000 | ( (r>>16)<<16 ) | ( (g>>16)<<8 ) | (b>>16);
                this.m_colorMap[ i+2*(this.m_colorMapSize/3) ]= c;
	        }

	        r= 0xff<<16;
	        b=0;
	        g=0;

            for( i=0; i<this.m_colorMapSize/3; i++ ) {
                g+= ( (0xff<<16)/(this.m_colorMapSize/3) );
                c= 0xff000000 | ( (r>>16)<<16 ) | ( (g>>16)<<8 ) | (b>>16);
                this.m_colorMap[ (this.m_colorMapSize/3)+i ]= c;
	        }

	        g=0;
	        b=0;
	        r=0;

            for( i=0; i<this.m_colorMapSize/3; i++ ) {
                r+= ( (0xff<<16)/(this.m_colorMapSize/3) );
                c= 0xff000000 | ( (r>>16)<<16 ) | ( (g>>16)<<8 ) | (b>>16);
                this.m_colorMap[ i ]= c;
	        }

            for (x=0; x<256; x++)   {
                this.wavetable[x] = Math.floor(32 * (1 + Math.cos(x*2 * Math.PI / 256)));
            }

            this.pos1=Math.floor(255*Math.random());
            this.pos2=Math.floor(255*Math.random());
            this.pos3=Math.floor(255*Math.random());
            this.pos4=Math.floor(255*Math.random());
        },
        plasmaStep : function ( dstPixels ) {
            var v = 0;
	        this.tpos1 = this.pos1;
	        this.tpos2 = this.pos2;

	        for (var x=0; x<this.m_aheight; x++) {
                this.tpos3 = this.pos3;
                this.tpos4 = this.pos4;
                for(var y=0; y<this.m_awidth; y++) {
/*
				var o1= ( b1 ) ? tpos1+tpos2+tpos3 : tpos1-tpos2;
				var o2= ( b2 ) ? tpos2+tpos3 : tpos2-tpos3;
				var o3= ( b3 ) ? tpos3+tpos4 : tpos3-tpos4;
				var o4= ( b4 ) ? tpos4+tpos1-tpos2 : tpos4-tpos1;
*/

                var o1= this.tpos1+this.tpos2+this.tpos3;
		        var o2= this.tpos2+this.tpos3-this.tpos1;
		        var o3= this.tpos3+this.tpos4-this.tpos2;
		        var o4= this.tpos4+this.tpos1-this.tpos2;

                if ( this.b1 ) o1= -o1;
                if ( this.b2 ) o2= -o2;
                if ( this.b3 ) o3= -o3;
                if ( this.b4 ) o4= -o4;

                var z = Math.floor(
                    this.wavetable[o1&255] +
                    this.wavetable[o2&255] +
                    this.wavetable[o3&255] +
                    this.wavetable[o4&255] );

                this.setPixel(v,dstPixels,this.m_colorMap[z]);

                this.tpos3 += this.i1;
                this.tpos3&=255;
                this.tpos4 += this.i2;
                this.tpos4&=255;
                v++
                }

                this.tpos1 += this.i3;
                this.tpos1&=255;
                this.tpos2 += this.i4;
                this.tpos2&=255;
            }

            this.pos1 += this.spd1;
            this.pos2 -= this.spd2;
            this.pos3 += this.spd3;
            this.pos4 -= this.spd4;
            this.pos1&=255;
            this.pos3&=255;
            this.pos2&=255;
            this.pos4&=255;
        },
        setupColor : function () {
            var pal= this.makeArray(256*3,0);
            var pos=0;
	        var chunk= 256/(this.color.length-1);
            var i;
            var j;

            for( i=0; i<this.color.length-1; i++ ) {
                var c= this.color[i];
                var r0= (c&0xff0000)>>16;
                var g0= (c&0xff00)>>8;
                var b0= c&0xff;

                var c1= this.color[i+1];
                var r1= (c1&0xff0000)>>16;
                var g1= (c1&0xff00)>>8;
                var b1= c1&0xff;

                var dr= Math.floor(((r1-r0)<<16)/chunk);
                var dg= Math.floor(((g1-g0)<<16)/chunk);
                var db= Math.floor(((b1-b0)<<16)/chunk);

                r0<<=16;
                g0<<=16;
                b0<<=16;

                for( j=0; j<chunk; j++ ) {
                    pal[ pos*3   ]= r0>>16;
                    pal[ pos*3+1 ]= g0>>16;
                    pal[ pos*3+2 ]= b0>>16;
                    pos++;
                    r0+=dr;
                    g0+=dg;
                    b0+=db;
                }

            }

            for( i=0; i<256; i++ ) {
                this.m_colorMap[ i ]= pal[ i*3 ]<<16 | pal[ i*3+1 ]<<8 | pal[ i*3+2 ] | 0xff000000;
            }
        },
        init : function () {
            this.setupPlasma();
            this.setupColor();
        },
        initialize : function (width, height){

            this.canvas= document.createElement('canvas');
            this.ctx= this.canvas.getContext('2d');

            this.m_awidth= width;
            this.m_aheight= height;

            this.centerX= this.m_awidth/2;
            this.centerY= this.m_aheight/2;
            this.canvas.width  = this.m_awidth;
            this.canvas.height = this.m_aheight;

            this.dstImageData= this.ctx.getImageData(0,0,width,height);
            this.init();

            return this;
        },
        pixel : function ( pos, arr )  {
            pos*=4;
            return arr[pos]<<16 | arr[pos+1]<<8 | arr[pos+2];
        },
        setPixel : function ( pos, arr, argb ) {
            pos*=4;
            arr[pos  ]= (argb&0xff0000)>>16;
            arr[pos+1]= (argb&0xff00)>>8;
            arr[pos+2]= argb&0xff;
            arr[pos+3]= 255;
        },
        plasmaLoop : function(time){

            if ( this.mfc!=-1 ) {
                if ( this.fc>this.mfc ) {
                    this.setB( );
                    this.fc=0;
                }
            }

            if ( time-this.prevTime>0 ) {
                this.plasmaStep( this.dstImageData.data );
                this.prevTime= time;
            }
            this.ctx.putImageData( this.dstImageData, 0, 0 );
            this.fc++;

        }
    };
})();

(function() {
    HN.PlasmaActor= function() {
        HN.PlasmaActor.superclass.constructor.call(this);
        return this;
    };

    extend( HN.PlasmaActor, CAAT.Actor, {
        plasma:     null,

        initialize : function( plasmaWidth, plasmaHeight ) {
            this.plasma= new HN.Plasma().initialize(plasmaWidth, plasmaHeight);
            return this;
        },
        paint : function(director, time) {
            var ctx= director.ctx;
            ctx.drawImage( this.plasma.canvas, 0, 0, this.width, this.height );
        },
        animate : function( director, time ) {
            this.plasma.plasmaLoop(time);
            HN.PlasmaActor.superclass.animate.call(this,director,time);
        }
    });
})();