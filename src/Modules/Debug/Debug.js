/**
 * See LICENSE file.
 *
 * Get realtime Debug information of CAAT's activity.
 * Set CAAT.DEBUG=1 before any CAAT.Director object creation.
 * This class creates a DOM node called 'caat-debug' and associated styles
 * The debug panel is minimized by default and shows short information. It can be expanded and minimized again by clicking on it
 *
 */

CAAT.Module( {

    /**
     * @name Debug
     * @memberOf CAAT.Module
     * @namespace
     */

    /**
     * @name Debug
     * @memberOf CAAT.Module.Debug
     * @constructor
     */

    defines : "CAAT.Module.Debug.Debug",
    depends : [
        "CAAT.Event.AnimationLoop"
    ],
    extendsWith : {

        /**
         * @lends CAAT.Module.Debug.Debug.prototype
         */

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
        textDirtyRects:     null,
        textDiscardDR:      null,

        frameTimeAcc :      0,
        frameRAFAcc :       0,

        canDebug:           false,

        SCALE:  60,

        debugTpl: 
            "    <style type=\"text/css\">"+
            "        #caat-debug {"+
            "            z-index: 10000;"+
            "            position:fixed;"+
            "            bottom:0;"+
            "            left:0;"+
            "            width:100%;"+
            "            background-color: rgba(0,0,0,0.8);"+
            "        }"+
            "        #caat-debug.caat_debug_max {"+
            "            margin-bottom: 0px;"+
            "        }"+
            "        .caat_debug_bullet {"+
            "            display:inline-block;"+
            "            background-color:#f00;"+
            "            width:8px;"+
            "            height:8px;"+
            "            border-radius: 4px;"+
            "            margin-left:10px;"+
            "            margin-right:2px;"+
            "        }"+
            "        .caat_debug_description {"+
            "            font-size:11px;"+
            "            font-family: helvetica, arial;"+
            "            color: #aaa;"+
            "            display: inline-block;"+
            "        }"+
            "        .caat_debug_value {"+
            "            font-size:11px;"+
            "            font-family: helvetica, arial;"+
            "            color: #fff;"+
            "            width:25px;"+
            "            text-align: right;"+
            "            display: inline-block;"+
            "            margin-right: .3em;"+
            "        }"+
            "        .caat_debug_indicator {"+
            "            float: right;"+
            "        }"+
            "        #debug_tabs {"+
            "            border-top: 1px solid #888;"+
            "            height:25px;"+
            "        }"+
            "        .tab_max_min {"+
            "            font-family: helvetica, arial;"+
            "            font-size: 12px;"+
            "            font-weight: bold;"+
            "            color: #888;"+
            "            border-right: 1px solid #888;"+
            "            float: left;"+
            "            cursor: pointer;"+
            "            padding-left: 5px;"+
            "            padding-right: 5px;"+
            "            padding-top: 5px;"+
            "            height: 20px;"+
            "        }"+
            "        .debug_tabs_content_hidden {"+
            "            display: none;"+
            "            width: 100%;"+
            "        }"+
            "        .debug_tabs_content_visible {"+
            "            display: block;"+
            "            width: 100%;"+
            "        }"+
            "        .checkbox_enabled {"+
            "            display:inline-block;"+
            "            background-color:#eee;"+
            "            border: 1px solid #eee;"+
            "            width:6px;"+
            "            height:8px;"+
            "            margin-left:12px;"+
            "            margin-right:2px;"+
            "            cursor: pointer;"+
            "        }"+
            "        .checkbox_disabled {"+
            "            display:inline-block;"+
            "            width:6px;"+
            "            height:8px;"+
            "            background-color: #333;"+
            "            border: 1px solid #eee;"+
            "            margin-left:12px;"+
            "            margin-right:2px;"+
            "            cursor: pointer;"+
            "        }"+
            "        .checkbox_description {"+
            "            font-size:11px;"+
            "            font-family: helvetica, arial;"+
            "            color: #fff;"+
            "        }"+
            "        .debug_tab {"+
            "            font-family: helvetica, arial;"+
            "            font-size: 12px;"+
            "            color: #fff;"+
            "            border-right: 1px solid #888;"+
            "            float: left;"+
            "            padding-left: 5px;"+
            "            padding-right: 5px;"+
            "            height: 20px;"+
            "            padding-top: 5px;"+
            "            cursor: default;"+
            "        }"+
            "        .debug_tab_selected {"+
            "            background-color: #444;"+
            "            cursor: default;"+
            "        }"+
            "        .debug_tab_not_selected {"+
            "            background-color: #000;"+
            "            cursor: pointer;"+
            "        }"+
            "    </style>"+
            "    <div id=\"caat-debug\">"+
            "        <div id=\"debug_tabs\">"+
            "            <span class=\"tab_max_min\" onCLick=\"javascript: var debug = document.getElementById('debug_tabs_content');if (debug.className === 'debug_tabs_content_visible') {debug.className = 'debug_tabs_content_hidden'} else {debug.className = 'debug_tabs_content_visible'}\"> CAAT Debug panel </span>"+
            "            <span id=\"caat-debug-tab0\" class=\"debug_tab debug_tab_selected\">Performance</span>"+
            "            <span id=\"caat-debug-tab1\" class=\"debug_tab debug_tab_not_selected\">Controls</span>"+
            "            <span class=\"caat_debug_indicator\">"+
            "                <span class=\"caat_debug_bullet\" style=\"background-color:#0f0;\"></span>"+
            "                <span class=\"caat_debug_description\">Draw Time: </span>"+
            "                <span class=\"caat_debug_value\" id=\"textDrawTime\">5.46</span>"+
            "                <span class=\"caat_debug_description\">ms.</span>"+
            "            </span>"+
            "            <span class=\"caat_debug_indicator\">"+
            "                <span class=\"caat_debug_bullet\" style=\"background-color:#f00;\"></span>"+
            "                <span class=\"caat_debug_description\">FPS: </span>"+
            "                <span class=\"caat_debug_value\" id=\"textFPS\">48</span>"+
            "            </span>"+
            "        </div>"+
            "        <div id=\"debug_tabs_content\" class=\"debug_tabs_content_hidden\">"+
            "            <div id=\"caat-debug-tab0-content\">"+
            "                <canvas id=\"caat-debug-canvas\" height=\"60\"></canvas>"+
            "                <div>"+
            "                    <span>"+
            "                        <span class=\"caat_debug_bullet\" style=\"background-color:#0f0;\"></span>"+
            "                        <span class=\"caat_debug_description\">RAF Time:</span>"+
            "                        <span class=\"caat_debug_value\" id=\"textRAFTime\">20.76</span>"+
            "                        <span class=\"caat_debug_description\">ms.</span>"+
            "                    </span>"+
            "                    <span>"+
            "                        <span class=\"caat_debug_bullet\" style=\"background-color:#0ff;\"></span>"+
            "                        <span class=\"caat_debug_description\">Entities Total: </span>"+
            "                        <span class=\"caat_debug_value\" id=\"textEntitiesTotal\">41</span>"+
            "                    </span>"+
            "                    <span>"+
            "                        <span class=\"caat_debug_bullet\" style=\"background-color:#0ff;\"></span>"+
            "                        <span class=\"caat_debug_description\">Entities Active: </span>"+
            "                        <span class=\"caat_debug_value\" id=\"textEntitiesActive\">37</span>"+
            "                    </span>"+
            "                    <span>"+
            "                        <span class=\"caat_debug_bullet\" style=\"background-color:#00f;\"></span>"+
            "                        <span class=\"caat_debug_description\">Draws: </span>"+
            "                        <span class=\"caat_debug_value\" id=\"textDraws\">0</span>"+
            "                    </span>"+
            "                    <span>"+
            "                        <span class=\"caat_debug_bullet\" style=\"background-color:#00f;\"></span>"+
            "                        <span class=\"caat_debug_description\">DirtyRects: </span>"+
            "                        <span class=\"caat_debug_value\" id=\"textDirtyRects\">0</span>"+
            "                    </span>"+
            "                    <span>"+
            "                        <span class=\"caat_debug_bullet\" style=\"background-color:#00f;\"></span>"+
            "                        <span class=\"caat_debug_description\">Discard DR: </span>"+
            "                        <span class=\"caat_debug_value\" id=\"textDiscardDR\">0</span>"+
            "                    </span>"+
            "                </div>"+
            "            </div>"+
            "            <div id=\"caat-debug-tab1-content\">"+
            "                <div>"+
            "                    <div>"+
            "                        <span id=\"control-sound\"></span>"+
            "                        <span class=\"checkbox_description\">Sound</span>"+
            "                    </div>"+
            "                    <div>"+
            "                        <span id=\"control-music\"></span>"+
            "                        <span class=\"checkbox_description\">Music</span>"+
            "                    </div>"+
            "                    <div>"+
            "                        <span id=\"control-aabb\"></span>"+
            "                        <span class=\"checkbox_description\">AA Bounding Boxes</span>"+
            "                    </div>"+
            "                    <div>"+
            "                        <span id=\"control-bb\"></span>"+
            "                        <span class=\"checkbox_description\">Bounding Boxes</span>"+
            "                    </div>"+
            "                    <div>"+
            "                        <span id=\"control-dr\"></span>"+
            "                        <span class=\"checkbox_description\">Dirty Rects</span>"+
            "                    </div>"+
            "                </div>"+
            "            </div>"+
            "        </div>"+
            "    </div>",


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

                eval( ""+
                    " var __x= CAAT;" +
                    "        function initCheck( name, bool, callback ) {"+
                    "            var elem= document.getElementById(name);"+
                    "            if ( elem ) {"+
                    "                elem.className= (bool) ? \"checkbox_enabled\" : \"checkbox_disabled\";"+
                    "                if ( callback ) {"+
                    "                    elem.addEventListener( \"click\", (function(elem, callback) {"+
                    "                        return function(e) {"+
                    "                            elem.__value= !elem.__value;"+
                    "                            elem.className= (elem.__value) ? \"checkbox_enabled\" : \"checkbox_disabled\";"+
                    "                            callback(e,elem.__value);"+
                    "                        }"+
                    "                    })(elem, callback), false );"+
                    "                }"+
                    "                elem.__value= bool;"+
                    "            }"+
                    "        }"+
                    "        function setupTabs() {"+
                    "            var numTabs=0;"+
                    "            var elem;"+
                    "            var elemContent;"+
                    "            do {"+
                    "                elem= document.getElementById(\"caat-debug-tab\"+numTabs);"+
                    "                if ( elem ) {"+
                    "                    elemContent= document.getElementById(\"caat-debug-tab\"+numTabs+\"-content\");"+
                    "                    if ( elemContent ) {"+
                    "                        elemContent.style.display= numTabs===0 ? 'block' : 'none';"+
                    "                        elem.className= numTabs===0 ? \"debug_tab debug_tab_selected\" : \"debug_tab debug_tab_not_selected\";"+
                    "                        elem.addEventListener( \"click\", (function(tabIndex) {"+
                    "                            return function(e) {"+
                    "                                for( var i=0; i<numTabs; i++ ) {"+
                    "                                    var _elem= document.getElementById(\"caat-debug-tab\"+i);"+
                    "                                    var _elemContent= document.getElementById(\"caat-debug-tab\"+i+\"-content\");"+
                    "                                    _elemContent.style.display= i===tabIndex ? 'block' : 'none';"+
                    "                                    _elem.className= i===tabIndex ? \"debug_tab debug_tab_selected\" : \"debug_tab debug_tab_not_selected\";"+
                    "                                }"+
                    "                            }"+
                    "                        })(numTabs), false );"+
                    "                    }"+
                    "                    numTabs++;"+
                    "                }"+
                    "            } while( elem );"+
                    "        }"+
                    "        initCheck( \"control-sound\", __x.director[0].isSoundEffectsEnabled(), function(e, bool) {"+
                    "            __x.director[0].setSoundEffectsEnabled(bool);"+
                    "        } );"+
                    "        initCheck( \"control-music\", __x.director[0].isMusicEnabled(), function(e, bool) {"+
                    "            __x.director[0].setMusicEnabled(bool);"+
                    "        } );"+
                    "        initCheck( \"control-aabb\", CAAT.DEBUGBB, function(e,bool) {"+
                    "            CAAT.DEBUGAABB= bool;"+
                    "            __x.director[0].currentScene.dirty= true;"+
                    "        } );"+
                    "        initCheck( \"control-bb\", CAAT.DEBUGBB, function(e,bool) {"+
                    "            CAAT.DEBUGBB= bool;"+
                    "            if ( bool ) {"+
                    "                CAAT.DEBUGAABB= true;"+
                    "            }"+
                    "            __x.director[0].currentScene.dirty= true;"+
                    "        } );"+
                    "        initCheck( \"control-dr\", CAAT.DEBUG_DIRTYRECTS , function( e,bool ) {"+
                    "            CAAT.DEBUG_DIRTYRECTS= bool;"+
                    "        });"+
                    "        setupTabs();" );

            }

            this.canvas= document.getElementById('caat-debug-canvas');
            if ( null===this.canvas ) {
                this.canDebug= false;
                return;
            }

            this.canvas.width= w;
            this.canvas.height=h;
            this.ctx= this.canvas.getContext('2d');

            this.ctx.fillStyle= '#000';
            this.ctx.fillRect(0,0,this.width,this.height);

            this.textFPS= document.getElementById("textFPS");
            this.textDrawTime= document.getElementById("textDrawTime");
            this.textRAFTime= document.getElementById("textRAFTime");
            this.textEntitiesTotal= document.getElementById("textEntitiesTotal");
            this.textEntitiesActive= document.getElementById("textEntitiesActive");
            this.textDraws= document.getElementById("textDraws");
            this.textDirtyRects= document.getElementById("textDirtyRects");
            this.textDiscardDR= document.getElementById("textDiscardDR");


            this.canDebug= true;

            return this;
        },

        debugInfo : function( statistics ) {
            this.statistics= statistics;

            var cc= CAAT;

            this.frameTimeAcc+= cc.FRAME_TIME;
            this.frameRAFAcc+= cc.REQUEST_ANIMATION_FRAME_TIME;

            /* Update the framerate counter */
            this.framerate.frames++;
            var tt= new Date().getTime() ;
            if ( tt> this.framerate.timeLastRefresh + this.framerate.refreshInterval ) {
                this.framerate.fps = ( ( this.framerate.frames * 1000 ) / ( tt - this.framerate.timeLastRefresh ) ) | 0;
                this.framerate.fpsMin = this.framerate.frames > 0 ? Math.min( this.framerate.fpsMin, this.framerate.fps ) : this.framerate.fpsMin;
                this.framerate.fpsMax = Math.max( this.framerate.fpsMax, this.framerate.fps );

                this.textFPS.innerHTML= this.framerate.fps;

                var value= ((this.frameTimeAcc*100/this.framerate.frames)|0)/100;
                this.frameTimeAcc=0;
                this.textDrawTime.innerHTML= value;

                var value2= ((this.frameRAFAcc*100/this.framerate.frames)|0)/100;
                this.frameRAFAcc=0;
                this.textRAFTime.innerHTML= value2;

                this.framerate.timeLastRefresh = tt;
                this.framerate.frames = 0;

                this.paint(value2);
            }

            this.textEntitiesTotal.innerHTML= this.statistics.size_total;
            this.textEntitiesActive.innerHTML= this.statistics.size_active;
            this.textDirtyRects.innerHTML= this.statistics.size_dirtyRects;
            this.textDraws.innerHTML= this.statistics.draws;
            this.textDiscardDR.innerHTML= this.statistics.size_discarded_by_dirty_rects;
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

            var fps = Math.min( this.height-(this.framerate.fps/this.SCALE*this.height), 59 );
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
    }

});
