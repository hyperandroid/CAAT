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
        framerate: null,

        SCALE:  60,

        setScale : function(s) {
            this.scale= s;
            return this;
        },

        initialize: function(w,h) {
            this.width= w;
            this.height= h;

            this.framerate = {
                refreshInterval: CAAT.FPS_REFRESH || 500,   // refresh every ? ms, updating too quickly gives too large rounding errors
                frames: 0,                                  // number offrames since last refresh
                timeLastRefresh: 0,                         // When was the framerate counter refreshed last
                fps: 0,                                     // current framerate
                prevFps: -1,                                // previously drawn FPS
                fpsMin: 1000,                               // minimum measured framerate
                fpsMax: 0,                                  // maximum measured framerate
            };

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

            /* Update the framerate counter */
            this.framerate.frames++;
            if ( CAAT.RAF > this.framerate.timeLastRefresh + this.framerate.refreshInterval ) {
                this.framerate.fps = Math.round( ( this.framerate.frames * 1000 ) / ( CAAT.RAF - this.framerate.timeLastRefresh ) );
                this.framerate.fpsMin = this.framerate.frames > 0 ? Math.min( this.framerate.fpsMin, this.framerate.fps ) : this.framerate.fpsMin;
                this.framerate.fpsMax = Math.max( this.framerate.fpsMax, this.framerate.fps );

                this.framerate.timeLastRefresh = CAAT.RAF;
                this.framerate.frames = 0;
            }

            this.paint();
        },

        prevRAF: -1,

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

            ctx.strokeStyle= 'rgba(0,255,0,.8)';
            ctx.beginPath();
            t= this.height-((15/this.SCALE*this.height)>>0)-.5;
            ctx.moveTo( .5, t );
            ctx.lineTo( this.width+.5, t );
            ctx.stroke();

            ctx.strokeStyle= 'rgba(255,255,0,.8)';
            ctx.beginPath();
            t= this.height-((25/this.SCALE*this.height)>>0)-.5;
            ctx.moveTo( .5, t );
            ctx.lineTo( this.width+.5, t );
            ctx.stroke();

            var fps = this.height-(this.framerate.fps/this.SCALE*this.height);
            if (-1===this.framerate.prevFps) {
                this.framerate.prevFps= fps;
            }

            ctx.strokeStyle= 'red';//this.framerate.fps<15 ? 'red' : this.framerate.fps<30 ? 'yellow' : 'green';
            ctx.beginPath();
            ctx.moveTo( this.width, fps );
            ctx.lineTo( this.width-.5, this.framerate.prevFps );
            ctx.stroke();

            this.framerate.prevFps= fps;

            var t1= this.height-(CAAT.REQUEST_ANIMATION_FRAME_TIME/this.SCALE*this.height);
            if (-1===this.prevRAF)   {
                this.prevRAF= t1;
            }

            ctx.strokeStyle= 'rgba(255,0,255,.5)';
            ctx.beginPath();
            ctx.moveTo( this.width, t1 );
            ctx.lineTo( this.width-.5, this.prevRAF );
            ctx.stroke();

            this.prevRAF= t1;

            ctx.fillStyle='rgba(255,0,0,.75)';
            ctx.fillRect( 0,0,300,15);
            ctx.fillStyle='white';
            ctx.fillText(
                    '  Total: '+this.statistics.size_total+
                    '  Active: '+this.statistics.size_active+
                    '  Draws: '+this.statistics.draws+
                    '  Framerate: '+this.framerate.fps+' (min:'+this.framerate.fpsMin+', max:'+this.framerate.fpsMax+')',
                    0,
                    12 );
        }
    };
})();