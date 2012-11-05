CAAT.Module({
    defines : "CAAT.Module.Initialization.TemplateWithSplash",
    depends : [
        "CAAT.Foundation.Director",
        "CAAT.Module.Preloader.ImagePreloader"
    ],
    constants: {

        init : function( width, height, runHere, minTime, imagesURL, onEndSplash, splash_path, spinner_path )   {

            function createSplashScene(director, showTime, sceneCreationCallback) {

                var spinnerImg= director.getImage('spinner');
                var splashImg=  director.getImage('splash');
                var scene=      director.createScene();
                var TIME=       showTime;
                var time=       new Date().getTime();

                if ( splashImg ) {
                    scene.addChild(
                            new CAAT.Foundation.Actor().
                                setBackgroundImage(splashImg, false).
                                setBounds(0,0,director.width,director.height).
                                setImageTransformation( CAAT.Foundation.SpriteImage.TR_FIXED_TO_SIZE )
                            );
                }

                if ( spinnerImg ) {
                    scene.addChild(
                            new CAAT.Foundation.Actor().
                                setBackgroundImage(spinnerImg).
                                centerAt( scene.width/2, scene.height/2).
                                addBehavior(
                                    new CAAT.Behavior.RotateBehavior().
                                            setValues(0,2*Math.PI).
                                            setFrameTime(0,1000).
                                            setCycle(true)
                                    )
                            );
                }

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
                                        endSplash(director, images, sceneCreationCallback);
                                    },
                                    difftime );

                        } else {
                            endSplash(director, images, sceneCreationCallback);
                        }

                    }
                };

                return scene;
            }
            /**
             * Finish splash process by either timeout or resources allocation end.
             */
            function endSplash(director, images, onEndSplashCallback) {

                director.emptyScenes();
                director.setImagesCache(images);
                director.setClear( true );

                onEndSplashCallback(director);

                /**
                 * Change this sentence's parameters to play with different entering-scene
                 * curtains.
                 * just perform a director.setScene(0) to play first director's scene.
                 */

                director.setClear( CAAT.Foundation.Director.CLEAR_ALL );
                director.easeIn(
                        0,
                        CAAT.Foundation.Scene.EASE_SCALE,
                        2000,
                        false,
                        CAAT.Foundation.Actor.ANCHOR_CENTER,
                        new CAAT.Behavior.Interpolator().createElasticOutInterpolator(2.5, .4) );

            }

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

                director= new CAAT.Foundation.Director().
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

                director= new CAAT.Foundation.Director().
                        initialize(
                            width||800,
                            height||600,
                            canvascontainer);
            }


            /**
             * Load splash images. It is supossed the splash has some images.
             */
            var imgs= [];
            if ( splash_path ) {
                imgs.push( {id:'splash',   url: splash_path } );
            }
            if ( spinner_path ) {
                imgs.push( {id:'spinner',  url: spinner_path } );
            }

            director.setClear( CAAT.Foundation.Director.CLEAR_DIRTY_RECTS );

            new CAAT.Module.Preloader.ImagePreloader().loadImages(
                imgs,
                function on_load( counter, images ) {

                    if ( counter===images.length ) {

                        director.setImagesCache(images);
                        var splashScene= createSplashScene(director, minTime || 5000, onEndSplash);
                        CAAT.loop(60);

                        if ( imagesURL && imagesURL.length>0 ) {
                            /**
                             * Load resources for non splash screen
                             */
                            new CAAT.Module.Preloader.ImagePreloader().loadImages(
                                    imagesURL,
                                    splashScene.loadedImage
                            );
                        } else {
                            splashScene.loadedImage(0,null);
                        }
                    }
                }
            );
        }

    }
});