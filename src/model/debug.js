/**
 * See LICENSE file.
 *
 * Get realtime Debug information of CAAT's activity.
 * Set CAAT.DEBUG=1 before any CAAT.Director object creation.
 * This class expects a DOM node called 'caat-debug' being a container element (DIV) where
 * it will append itself. If this node is not present, it will append itself to the document's body.
 *
 */

(function() {

    CAAT.Debug= function() {
        return this;
    };

    CAAT.Debug.prototype= {

        width:  0,
        height: 0,
        canvas: null,
        ctx:    null,
        statistics: null,

        SCALE:  50,

        setScale : function(s) {
            this.scale= s;
            return this;
        },

        initialize: function(w,h) {
            this.width= w;
            this.height= h;

            this.canvas= document.createElement('canvas');
            this.canvas.width= w;
            this.canvas.height=h;
            this.ctx= this.canvas.getContext('2d');

            this.ctx.fillStyle= 'black';
            this.ctx.fillRect(0,0,this.width,this.height);

            var dom= document.getElementById('caat-debug');
            if ( null===dom ) {
                document.body.appendChild( this.canvas );
            } else {
                dom.appendChild( this.canvas );
            }

            return this;
        },

        debugInfo : function( statistics ) {
            this.statistics= statistics;
            this.paint();
        },

        paint : function() {
            var ctx= this.ctx;
            var t=0;

            ctx.drawImage(
                this.canvas,
                1, 0, this.width-1, this.height,
                0, 0, this.width-1, this.height );

            ctx.strokeStyle= 'black';
            ctx.beginPath();
            ctx.moveTo( this.width-.5, 0 );
            ctx.lineTo( this.width-.5, this.height );
            ctx.stroke();

            ctx.strokeStyle= CAAT.FRAME_TIME<16 ? 'green' : CAAT.FRAME_TIME<25 ? 'yellow' : 'red';
            ctx.beginPath();
            ctx.moveTo( this.width-.5, this.height );
            ctx.lineTo( this.width-.5, this.height-(CAAT.FRAME_TIME*this.height/this.SCALE) );
            ctx.stroke();

            ctx.strokeStyle= 'rgba(0,255,0,.8)';
            ctx.beginPath();

            t= this.height-((15/this.SCALE*this.height)>>0)-.5;
            ctx.moveTo( 0, t );
            ctx.lineTo( this.width, t );
            ctx.stroke();

            ctx.strokeStyle= 'rgba(255,255,0,.8)';
            ctx.beginPath();
            t= this.height-((25/this.SCALE*this.height)>>0)-.5;
            ctx.moveTo( 0, t );
            ctx.lineTo( this.width, t );
            ctx.stroke();

            ctx.fillStyle='rgba(255,0,0,.75)';
            ctx.fillRect( 0,0,180,15);
            ctx.fillStyle='white';
            ctx.fillText(
                    '  Total: '+this.statistics.size_total+
                    '  Active: '+this.statistics.size_active+
                    '  Draws: '+this.statistics.draws,
                    0,
                    12 );
        }
    };
})();