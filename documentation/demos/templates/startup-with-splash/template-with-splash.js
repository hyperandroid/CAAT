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

CAAT.modules.splash= CAAT.modules.splash || {};

CAAT.modules.splash.createSplashScene= function (director, showTime, sceneCreationCallback) {

    var ladingImg=      director.getImage('lading');
    var ladingActor=    null;
    var oImg=           director.getImage('rueda');
    var oActor=         null;
    var scene=          director.createScene();
    var TIME=           showTime;
    var time=           new Date().getTime();

    scene.addChild(
            new CAAT.Actor().
                setBackgroundImage(
                    director.getImage('splash'))
            );

    scene.addChild(
            ladingActor= new CAAT.Actor().
                setBackgroundImage(ladingImg).
                setLocation(
                    director.width-ladingImg.width-10,
                    director.height-ladingImg.height-30 )
            );

    scene.addChild(
            oActor= new CAAT.Actor().
                setBackgroundImage(oImg).
                setLocation( ladingActor.x+20, ladingActor.y+10 ).
                addBehavior(
                    new CAAT.RotateBehavior().
                            setValues(0,2*Math.PI).
                            setFrameTime(0,1000).
                            setCycle(true)
                    )
            );

    scene.loadedImage = function(count, images) {

        if ( !images || count===images.length ) {

            var difftime= new Date().getTime()-time;
            if ( difftime<TIME ){
                difftime= Math.abs(TIME-difftime);
                if ( difftime>TIME ) {
                    difftime= TIME;
                }

                setTimeout(
                        function() {
                            CAAT.modules.splash.endSplash(director, images, sceneCreationCallback);
                        },
                        difftime );

            } else {
                CAAT.modules.splash.endSplash(director, images, sceneCreationCallback);
            }

        }
    };

    return scene;
};

CAAT.modules.splash.ShowDefaultSplash= function( width, height, runHere, minTime, imagesURL, onEndSplash )   {

    var canvascontainer= document.getElementById(runHere);
    var director;

    if ( CAAT.__CSS__ ) {   // css renderer
        if ( canvascontainer ) {
            if ( false===canvascontainer instanceof HTMLDivElement ) {
                canvascontainer= null;
            }
        }

        if ( canvascontainer===null ) {
            canvascontainer= document.createElement('div'); // create a new DIV
            document.body.appendChild(canvascontainer);
        }

        director= new CAAT.Director().
            initialize(
                width||800,
                height||600,
                canvascontainer);

    } else {

        if ( canvascontainer ) {
            if ( canvascontainer instanceof HTMLDivElement ) {
                var ncanvascontainer= document.createElement("canvas");
                canvascontainer.appendChild(ncanvascontainer);
                canvascontainer= ncanvascontainer;
            } else if ( false==canvascontainer instanceof HTMLCanvasElement ) {
                var ncanvascontainer= document.createElement("canvas");
                document.body.appendChild(ncanvascontainer);
                canvascontainer= ncanvascontainer;
            }
        } else {
            canvascontainer= document.createElement('canvas');
            document.body.appendChild(canvascontainer);
        }

        director= new CAAT.Director().
                initialize(
                    width||800,
                    height||600,
                    canvascontainer);
    }


    /**
     * Load splash images. It is supossed the splash has some images.
     */
    new CAAT.ImagePreloader().loadImages(
        [
            {id:'splash',   url:'splash/splash.jpg'},
            {id:'lading',   url:'splash/lading.png'},
            {id:'rueda',    url:'splash/rueda.png'}
        ],
        function on_load( counter, images ) {

            if ( counter==images.length ) {

                director.setImagesCache(images);
                var splashScene= CAAT.modules.splash.createSplashScene(director, minTime || 5000, onEndSplash);
                CAAT.loop(60);

                if ( imagesURL && imagesURL.length>0 ) {
                    /**
                     * Load resources for non splash screen
                     */
                    new CAAT.ImagePreloader().loadImages(
                            imagesURL,
                            splashScene.loadedImage
                    );
                } else {
                    splashScene.loadedImage(0,null);
                }
            }
        }
    );
};

/**
 * Finish splash process by either timeout or resources allocation end.
 * @param director {CAAT.Director}
 * @param images {Array<Object>}
 */
CAAT.modules.splash.endSplash= function(director, images, onEndSplashCallback) {

    director.emptyScenes();
    director.setImagesCache(images);
    director.setClear( true );

    onEndSplashCallback(director);

    /**
     * Change this sentence's parameters to play with different entering-scene
     * curtains.
     * just perform a director.setScene(0) to play first director's scene.
     */

    director.easeIn(
            0,
            CAAT.Scene.prototype.EASE_SCALE,
            2000,
            false,
            CAAT.Actor.prototype.ANCHOR_CENTER,
            new CAAT.Interpolator().createElasticOutInterpolator(2.5, .4) );

};
