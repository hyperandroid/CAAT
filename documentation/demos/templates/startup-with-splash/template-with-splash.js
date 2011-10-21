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
            new CAAT.ImageActor().
                setImage(
                    director.getImage('splash'))
            );

    scene.addChild(
            ladingActor= new CAAT.ImageActor().
                setImage(ladingImg).
                setLocation(
                    director.width-ladingImg.width-10,
                    director.height-ladingImg.height-30 )
            );

    scene.addChild(
            oActor= new CAAT.ImageActor().
                setImage(oImg).
                setLocation( ladingActor.x+20, ladingActor.y+10 ).
                addBehavior(
                    new CAAT.RotateBehavior().
                            setValues(0,2*Math.PI).
                            setFrameTime(0,1000).
                            setCycle(true)
                    )
            );

    var percent= new CAAT.TextActor().create().setFont('15px sans-serif');
    scene.addChild(percent);

    scene.loadedImage = function(count, images) {
        percent.setText( (images ? parseInt((count/images.count*100)>>0) : 100) +' %' );
        percent.calcTextSize(director);
        percent.setFillStyle('white');
        percent.setLocation( 10, 10 );
        percent.setLocation(
                10+ladingActor.x + (ladingActor.width-percent.width)/2,
                ladingActor.y+ladingActor.height-10 );

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

    /**
     * infere whether runhere is on a DIV, canvas, or none at all.
     * If none at all, just append the created canvas to the document.
     */
    var isCanvas= false;
    var canvascontainer= document.getElementById(runHere);

    if ( canvascontainer ) {
        if ( canvascontainer instanceof HTMLDivElement ) {
            isCanvas= false;
        } else if ( canvascontainer instanceof HTMLCanvasElement ) {
            isCanvas= true;
        } else {
            canvascontainer= document.body;
        }
    } else {
        canvascontainer= document.createElement('div');
        document.body.appendChild(canvascontainer);
    }
    
    /**
     * create a director.
     */
    var director = new CAAT.Director().
            initialize(
                width||800,
                height||600,
                isCanvas?canvascontainer:undefined).
            setClear(false) // set director to NOT clearing the background
            ;

    if ( !isCanvas ) {
        canvascontainer.appendChild( director.canvas );
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
                            splashScene.loadedImage(counter, images)
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
