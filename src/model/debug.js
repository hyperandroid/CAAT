/**
 * See LICENSE file.
 *
 * Get realtime Debug information of CAAT's activity.
 * Set CAAT.DEBUG=1 before any CAAT.Director object creation.
 * This class creates a DOM node called 'caat-debug' and associated styles
 * The debug panel is minimized by default and shows short information. It can be expanded and minimized again by clicking on it
 *
 */

(function() {

    CAAT.Debug= function() {
        return this;
    };

    CAAT.Debug.prototype= {

        width:              0,
        height:             0,
        canvas:             null,
        ctx:                null,
        statistics:         null,
        framerate:          null,
        textContainer:      null,
        textFPS:            null,
        textEntitiesTotal:  null,
        textEntitiesActive: null,
        textDraws:          null,
        textDrawTime:       null,
        textRAFTime:        null,

        frameTimeAcc :      0,
        frameRAFAcc :       0,

        canDebug:           false,

        SCALE:  60,

        debugTpl: 
            '<style type="text/css">'+
                '#caat-debug {'+
                    'z-index: 10000;'+
                    'position:fixed; '+
                    'bottom:0; '+
                    'left:0; '+
                    'width:100%;'+
                    'background-color: rgba(0,0,0,0.8);'+
                    'height: 120px;'+
                    'margin-bottom: -104px;'+
                '}'+
                '#caat-debug.caat_debug_max {'+
                    'margin-bottom: 0px;'+
                '}'+
                '.caat_debug_bullet {'+
                    'display:inline-block;'+
                    'background-color:#f00;'+
                    'width:6px;'+
                    'height:10px;'+
                    'margin-left:4px;'+
                    'margin-right:4px;'+
                '}'+
                '.caat_debug_description {'+
                    'font-size:11px;'+
                    'font-family: helvetica, arial;'+
                    'color: #aaa;'+
                    'display: inline-block;'+
                '}'+
                '.caat_debug_value {'+
                    'font-size:11px;'+
                    'font-family: helvetica, arial;'+
                    'color: #fff;'+
                    'width:25px;'+
                    'text-align: right;'+
                    'display: inline-block;'+
                    'margin-right: .3em;'+
                '}'+
                '.caat_debug_menu {'+
                    'font-family: helvetica, arial;'+
                    'font-size: 12px;'+
                    'font-weight: bold;'+
                    'color: #888;'+
                    'padding: 2px;'+
                '}'+
            '</style>'+
            '<div id="caat-debug" onCLick="javascript: var debug = document.getElementById(\'caat-debug\');if (debug.className == \'\') {debug.className = \'caat_debug_max\'} else {debug.className = \'\'}">'+
                '<div style="width:100%;">'+
                    '<div class="caat_debug_menu">CAAT Performance '+
                        '<span>'+
                            '<span class="caat_debug_bullet" style="background-color:#f00;"></span>'+
                            '<span class="caat_debug_value" id="textFPSShort">48</span>'+
                        '</span>'+
                        '<span>'+
                            '<span class="caat_debug_bullet" style="background-color:#0f0;"></span>'+
                            '<span class="caat_debug_value" id="textDrawTimeShort">5.46</span>'+
                            '<span class="caat_debug_description">ms.</span>'+
                        '</span>'+
                        '<span>'+
                            '<span class="caat_debug_bullet" style="background-color:#0f0;"></span>'+
                            '<span class="caat_debug_value" id="textRAFTimeShort">20.76</span>'+
                            '<span class="caat_debug_description">ms.</span>'+
                        '</span>'+
                        '<span>'+
                            '<span class="caat_debug_bullet" style="background-color:#0ff;"></span>'+
                            '<span class="caat_debug_value" id="textEntitiesTotalShort">41</span>'+
                        '</span>'+
                        '<span>'+
                            '<span class="caat_debug_bullet" style="background-color:#0ff;"></span>'+
                            '<span class="caat_debug_value" id="textEntitiesActiveShort">37</span>'+
                        '</span>'+
                        '<span>'+
                            '<span class="caat_debug_bullet" style="background-color:#00f;"></span>'+
                            '<span class="caat_debug_value" id="textDrawsShort">0</span>'+
                        '</span>'+
                    '</div>'+
                '</div>'+
                '<div id="caat-debug-performance">'+
                    '<canvas id="caat-debug-canvas" height="60"></canvas>'+
                    '<div>'+
                        '<span>'+
                            '<span class="caat_debug_bullet" style="background-color:#f00;"></span>'+
                            '<span class="caat_debug_description">FPS: </span>'+
                            '<span class="caat_debug_value" id="textFPS">48</span>'+
                        '</span>'+
                        '<span>'+
                            '<span class="caat_debug_bullet" style="background-color:#0f0;"></span>'+
                            '<span class="caat_debug_description">Draw Time: </span>'+
                            '<span class="caat_debug_value" id="textDrawTime">5.46</span>'+
                            '<span class="caat_debug_description">ms.</span>'+
                        '</span>'+
                        '<span>'+
                            '<span class="caat_debug_bullet" style="background-color:#0f0;"></span>'+
                            '<span class="caat_debug_description">RAF Time:</span>'+
                            '<span class="caat_debug_value" id="textRAFTime">20.76</span>'+
                            '<span class="caat_debug_description">ms.</span>'+
                        '</span>'+
                        '<span>'+
                            '<span class="caat_debug_bullet" style="background-color:#0ff;"></span>'+
                            '<span class="caat_debug_description">Entities Total: </span>'+
                            '<span class="caat_debug_value" id="textEntitiesTotal">41</span>'+
                        '</span>'+
                        '<span>'+
                            '<span class="caat_debug_bullet" style="background-color:#0ff;"></span>'+
                            '<span class="caat_debug_description">Entities Active: </span>'+
                            '<span class="caat_debug_value" id="textEntitiesActive">37</span>'+
                        '</span>'+
                        '<span>'+
                            '<span class="caat_debug_bullet" style="background-color:#00f;"></span>'+
                            '<span class="caat_debug_description">Draws: </span>'+
                            '<span class="caat_debug_value" id="textDraws">0</span>'+
                        '</span>'+
                    '</div>'+
                '</div>'+
            '</div>',

        setScale : function(s) {
            this.scale= s;
            return this;
        },

        initialize: function(w,h) {
            w= window.innerWidth;

            this.width= w;
            this.height= h;

            this.framerate = {
                refreshInterval: CAAT.FPS_REFRESH || 500,   // refresh every ? ms, updating too quickly gives too large rounding errors
                frames: 0,                                  // number offrames since last refresh
                timeLastRefresh: 0,                         // When was the framerate counter refreshed last
                fps: 0,                                     // current framerate
                prevFps: -1,                                // previously drawn FPS
                fpsMin: 1000,                               // minimum measured framerate
                fpsMax: 0                                   // maximum measured framerate
            };

            var debugContainer= document.getElementById('caat-debug');
            if (!debugContainer) {
                var wrap = document.createElement('div');
                wrap.innerHTML=this.debugTpl;
                document.body.appendChild(wrap);
                console.log(wrap);
            }

            this.canvas= document.getElementById('caat-debug-canvas');
            if ( null===this.canvas ) {
                this.canDebug= false;
                return;
            }

            this.canvas.width= w;
            this.canvas.height=h;
            this.ctx= this.canvas.getContext('2d');

            this.ctx.fillStyle= 'rgba(0,0,0,0.5)';
            this.ctx.fillRect(0,0,this.width,this.height);

            this.textFPS= document.getElementById("textFPS");
            this.textDrawTime= document.getElementById("textDrawTime");
            this.textRAFTime= document.getElementById("textRAFTime");
            this.textEntitiesTotal= document.getElementById("textEntitiesTotal");
            this.textEntitiesActive= document.getElementById("textEntitiesActive");
            this.textDraws= document.getElementById("textDraws");

            this.textFPSShort= document.getElementById("textFPSShort");
            this.textDrawTimeShort= document.getElementById("textDrawTimeShort");
            this.textRAFTimeShort= document.getElementById("textRAFTimeShort");
            this.textEntitiesTotalShort= document.getElementById("textEntitiesTotalShort");
            this.textEntitiesActiveShort= document.getElementById("textEntitiesActiveShort");
            this.textDrawsShort= document.getElementById("textDrawsShort");

            this.canDebug= true;

            return this;
        },

        debugInfo : function( statistics ) {
            this.statistics= statistics;

            this.frameTimeAcc+= CAAT.FRAME_TIME;
            this.frameRAFAcc+= CAAT.REQUEST_ANIMATION_FRAME_TIME;

            /* Update the framerate counter */
            this.framerate.frames++;
            if ( CAAT.RAF > this.framerate.timeLastRefresh + this.framerate.refreshInterval ) {
                this.framerate.fps = ( ( this.framerate.frames * 1000 ) / ( CAAT.RAF - this.framerate.timeLastRefresh ) ) | 0;
                this.framerate.fpsMin = this.framerate.frames > 0 ? Math.min( this.framerate.fpsMin, this.framerate.fps ) : this.framerate.fpsMin;
                this.framerate.fpsMax = Math.max( this.framerate.fpsMax, this.framerate.fps );

                this.textFPS.innerHTML= this.textFPSShort.innerHTML= this.framerate.fps;

                var value= ((this.frameTimeAcc*100/this.framerate.frames)|0)/100;
                this.frameTimeAcc=0;
                this.textDrawTime.innerHTML= this.textDrawTimeShort.innerHTML= value;

                var value2= ((this.frameRAFAcc*100/this.framerate.frames)|0)/100;
                this.frameRAFAcc=0;
                this.textRAFTime.innerHTML= this.textRAFTimeShort.innerHTML= value2;

                this.framerate.timeLastRefresh = CAAT.RAF;
                this.framerate.frames = 0;

                this.paint(value2);
            }

            this.textEntitiesTotal.innerHTML= this.textEntitiesTotalShort.innerHTML= this.statistics.size_total;
            this.textEntitiesActive.innerHTML= this.textEntitiesActiveShort.innerHTML= this.statistics.size_active;
            this.textDraws.innerHTML= this.textDrawsShort.innerHTML= this.statistics.draws;
        },

        paint : function( rafValue ) {
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

            ctx.strokeStyle= '#a22';
            ctx.beginPath();
            t= this.height-((20/this.SCALE*this.height)>>0)-.5;
            ctx.moveTo( .5, t );
            ctx.lineTo( this.width+.5, t );
            ctx.stroke();

            ctx.strokeStyle= '#aa2';
            ctx.beginPath();
            t= this.height-((30/this.SCALE*this.height)>>0)-.5;
            ctx.moveTo( .5, t );
            ctx.lineTo( this.width+.5, t );
            ctx.stroke();

            var fps = Math.min( this.height-(this.framerate.fps/this.SCALE*this.height), 60 );
            if (-1===this.framerate.prevFps) {
                this.framerate.prevFps= fps|0;
            }

            ctx.strokeStyle= '#0ff';//this.framerate.fps<15 ? 'red' : this.framerate.fps<30 ? 'yellow' : 'green';
            ctx.beginPath();
            ctx.moveTo( this.width, (fps|0)-.5 );
            ctx.lineTo( this.width, this.framerate.prevFps-.5 );
            ctx.stroke();

            this.framerate.prevFps= fps;


            var t1= ((this.height-(rafValue/this.SCALE*this.height))>>0)-.5;
            ctx.strokeStyle= '#ff0';
            ctx.beginPath();
            ctx.moveTo( this.width, t1 );
            ctx.lineTo( this.width, t1 );
            ctx.stroke();
        }
    };
})();