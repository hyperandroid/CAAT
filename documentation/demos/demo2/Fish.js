/**  
 * @license
 * 
 * The MIT License
 * Copyright (c) 2010-2011 Ibon Tolosana, Hyperandroid || http://labs.hyperandroid.com/

 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

CAAT.Module( {
    defines : "CAAT.Procedural.Fish",
    depends : [
        "CAAT.Foundation.Actor"
    ],
    extendsClass : "CAAT.Foundation.Actor",
    extendsWith : {
        __init : function() {
            this.__super();
            this.tail=  [];
            this.tail1= [];
            this.tail2= [];
            this.head1= [];
            this.head2= [];

            return this;
        },

        tail:       null,
        tail1:      null,
        tail2:      null,
        head1:      null,
        head2:      null,
        maxAngle:   45,
        bodyColor:  'red',
        f1:         0,
        f2:         0,
        f3:         0,
        f4:         0,
        tailSize:   0,
        timeOffset: 0,  // para que las colas se muevan a distinta frecuencia.
        headProportion:  0,  // proporcion desde donde tiene la cabeza.
        antihead:   false,

        headStart:  0,

        setBodyColor : function(color) {
            this.bodyColor= color;
            return this;
        },
        /**
         * born method must be called after Actor complete definition.
         */
        born : function() {
            this.f1= ((Math.random()*2)>>0)/1000 + .002;
            this.f2= ((Math.random()*2)>>0)/1000 + .002;
            this.f3= ((Math.random()*5)>>0)/1000;
            this.f4= ((Math.random()*5)>>0)/1000;

            this.tailSize= (Math.random()*3+2)>>0;
            this.timeOffset= (Math.random()*10000);

            this.antihead= Math.random()<.25;
            if ( this.antihead ) {
                this.headProportion= Math.random()*.25+.65;
                if ( this.headProportion<.8 ) {
                    this.headProportion=.8;
                }
            } else {
                this.headProportion= Math.random()*.25+.6;
            }

            this.maxAngle= 40+25*Math.random();

            var w= this.width;
            var h= this.height;

            var w2= w/2;
            var h2= h/2;

            this.headStart= this.antihead ? w : w*this.headProportion;

            this.tail[0]= 0;
            this.tail[1]= h2;


            /////////////---------------




            // tail son 1 y 2 punto de control, y el ultimo punto de la cubica.
            // ek primer punto fijo sera tail.
            this.tail1[0]= w2;
            this.tail1[1]= h2;

            this.tail1[2]= w2;
            this.tail1[3]= 0;

            this.tail1[4]= this.headStart;
            this.tail1[5]= 0;

            this.headpos= w;
            if ( this.antihead ) {
                this.headpos= w*this.headProportion;
            }

            this.head1[0]= this.headpos;
            this.head1[1]= 0;
            this.head1[2]= this.headpos;
            this.head1[3]= h2;

            this.head2[0]= this.headpos;
            this.head2[1]= h;
            this.head2[2]= this.headStart;
            this.head2[3]= h;


            this.tail2[0]= w2;
            this.tail2[1]= h;

            this.tail2[2]= w2;
            this.tail2[3]= h2;

            return this;
        },
        paint : function(director, time) {
            var ctx= director.ctx;

            time+= this.timeOffset;

            var w= this.width;
            var h= this.height;
            var w2= w/2;
            var w4= w2/2;
            var h2= h/2;


            // .002 .003
            var ang= Math.cos(time*this.f1)*this.maxAngle*Math.sin(time*this.f2)*Math.PI/180;
            var px= w4-w4*Math.cos(ang);
            var py= w4*Math.sin(ang);

            this.tail[0]= px;
            this.tail[1]= h2+ py;


            var inc= -3*(Math.sin(time*.005)+Math.cos(time*.001))/2;

            this.tail1[0]= w4;
            this.tail1[1]= h2+inc;
            this.tail1[2]= w2;
            this.tail1[3]= inc;


            ///// curva de cabeza.
            /*
            this.tail1[5]= -inc;
            this.head1[1]= -inc;
            this.head1[3]= h2-inc;
            this.head2[1]= h-inc;
            this.head2[3]= h-inc;
            */

            this.tail2[0]= w2;
            this.tail2[1]= h+inc;
            this.tail2[2]= w4;
            this.tail2[3]= h2+inc;


            ctx.beginPath();
            ctx.fillStyle='orange';

            //////////////////////////////////////////////// START ALETAS
            aletaSize= h2;      // ancho
            var aletaHeight= 7;   // alto aleta
            var aletaWidth= 5;
            var aletaPos= w*2/3 + aletaWidth;

            ctx.beginPath();
                ctx.moveTo( aletaPos, 2 );
                ctx.quadraticCurveTo(
                        aletaPos, -aletaHeight,
                        aletaPos-aletaSize, -aletaHeight-3*Math.sin(time*.002) );
                ctx.lineTo( aletaPos-aletaWidth, 2);
                ctx.closePath();
            ctx.fill();
            ctx.beginPath();
                ctx.moveTo( aletaPos, h-2 );
                ctx.quadraticCurveTo(
                        aletaPos, h+aletaHeight,
                        aletaPos-aletaSize, h+aletaHeight-3*Math.cos(time*.002) );
                ctx.lineTo( aletaPos-aletaWidth, h-2 );
                ctx.closePath();
            ctx.fill();
            //////////////////////////////////////////////// END ALETAS

            //////////////////////////////////////////////// START BODY
/*
            this.head1[3]= h2-inc ;

            // subir bajar cuerpo
            this.tail1[5]= inc;
            this.head2[3]= h+inc;
*/
            ctx.beginPath();
                ctx.moveTo( this.tail[0], this.tail[1] + this.tailSize );
                ctx.bezierCurveTo(
                        this.tail1[0], this.tail1[1],
                        this.tail1[2], this.tail1[3],
                        this.tail1[4], this.tail1[5] );
                ctx.quadraticCurveTo(
                        this.head1[0], this.head1[1],
                        this.head1[2], this.head1[3]
                        );
                ctx.quadraticCurveTo(
                        this.head2[0], this.head2[1],
                        this.head2[2], this.head2[3]
                        );
                ctx.bezierCurveTo(
                        this.tail2[0], this.tail2[1],
                        this.tail2[2], this.tail2[3],
                        this.tail[0], this.tail[1] - this.tailSize );
            ctx.closePath();
            ctx.fillStyle=this.bodyColor;
            ctx.fill();
            ctx.strokeStyle=this.bodyColor;
            ctx.stroke();
            //////////////////////////////////////////////// END BODY

            //////////////////////////////////////////////// START EYES
            ctx.beginPath();
            ctx.fillStyle='black';
            var eyeradius= h2/6;

            if ( this.antihead ) {
                ctx.arc(this.headpos-eyeradius*2, h2-h2/3, eyeradius, 0, 2*Math.PI, false );
                ctx.arc(this.headpos-eyeradius*2, h2+h2/3, eyeradius, 0, 2*Math.PI, false );

            } else {
                ctx.arc(w-w2/4, h2-h2/3, eyeradius, 0, 2*Math.PI, false );
                ctx.arc(w-w2/4, h2+h2/3, eyeradius, 0, 2*Math.PI, false );
            }
            ctx.fill();
            //////////////////////////////////////////////// END EYES
        }
    }

});
