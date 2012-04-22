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

CAAT.modules.initialization= CAAT.modules.initialization || {};


CAAT.modules.initialization.init= function( width, height, runHere, imagesURL, onEndLoading )   {

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
        imagesURL,
        function on_load( counter, images ) {

            if ( counter==images.length ) {

                director.emptyScenes();
                director.setImagesCache(images);

                onEndLoading(director);

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

                CAAT.loop(60);

            }
        }
    );
};
