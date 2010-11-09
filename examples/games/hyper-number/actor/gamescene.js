(function() {
    HN.BrickActor= function() {
        HN.BrickActor.superclass.constructor.call(this);
        return this;
    };

    extend( HN.BrickActor, CAAT.Actor, {

        brick:          null,
        compoundImage:  null,

        /**
         *
         * @param compoundImage
         * @param brick a HN.Brick instance.
         */
        initialize : function( compoundImage, brick ) {
            this.compoundImage= compoundImage;
            this.brick= brick;
            this.setSize(
                    compoundImage.singleWidth,
                    compoundImage.singleHeight);

            return this;
        },
        paint : function(director, time) {
            this.compoundImage.paint(
                    director.ctx,
                    this.brick.value + 9*this.brick.color, 
                    0,
                    0);
        },
        mouseEnter : function(mouseEvent) {
            this.emptyBehaviorList();

            this.parent.setZOrder( this, Number.MAX_VALUE );

            var sb= new CAAT.ScaleBehavior().
                    setFrameTime( mouseEvent.source.time, 250 ).
                    setValues( 1, 2, 1, 2 ).
                    setPingPong();

            this.addBehavior( sb );
        },
        mouseExit : function(mouseEvent) {
/*
            this.emptyBehaviorList();

            var sb= new CAAT.ScaleBehavior().
                    setFrameTime( mouseEvent.source.time, 1500 ).
                    setValues( this.scaleX, 1, this.scaleY, 1 );

            this.addBehavior( sb );
*/
        }

    });
})();

(function() {
    HN.GameScene= function() {
        return this;
    };

    HN.GameScene.prototype= {

        imageBricksW:   9,
        imageBricksH:   7,

        gameRows:       15,
        gameColumns:    20,

        context:        null,
        directorScene:  null,

        brickActors:    null,
        bricksImage:    null,

        director:       null,

        actorInitializationCount:   0,  // flag indicating how many actors have finished initializing.


        /**
         * Creates the main game Scene.
         * @param director a CAAT.Director instance.
         */
        create : function(director, rows, columns) {
            this.gameRows= rows;
            this.gameColumns= columns;

            this.director= director;

            this.bricksImage= new CAAT.CompoundImage().initialize(
                    director.getImage('bricks'),
                    this.imageBricksH,
                    this.imageBricksW );

            this.context= new HN.Context().
                    create( this.gameRows, this.gameColumns, this.imageBricksH ).
                    addContextListener(this);

            this.directorScene= director.createScene();

            this.brickActors= [];

            var i,j;
            for( i=0; i<this.gameRows; i++ ) {
                this.brickActors.push([]);
                for( j=0; j<this.gameColumns; j++ ) {
                    var brick= new HN.BrickActor().
                            create().
                            initialize( this.bricksImage, this.context.getBrick(i,j) ).
                            setLocation(-100,-100);

                    this.brickActors[i].push( brick );

                    this.directorScene.addChild(brick);
                }
            }

            /////////////////////// initialize button
            var restart= new CAAT.ShapeActor().
                    create().
                    setBounds( director.canvas.width-100, 10, 80, 30 ).
                    setShape( CAAT.ShapeActor.prototype.SHAPE_RECTANGLE ).
                    setFillStyle('red');

            var me= this;
            restart.mouseClick= function(mouseEvent) {
                me.context.initialize();
            }
            this.directorScene.addChild(restart);

            return this;
        },
        initializeActors : function() {
            var i, j;

            var radius= Math.max(
                    this.director.canvas.width,
                    this.director.canvas.height );

            var angle= Math.PI*2*Math.random();

            var me= this;

            for( i=0; i<this.gameRows; i++ ) {
                for( j=0; j<this.gameColumns; j++ ) {
                    var brickActor= this.brickActors[i][j];
                    brickActor.setFrameTime( this.directorScene.time, Number.MAX_VALUE );


                    var moveB= new CAAT.PathBehavior().
                            setFrameTime(this.directorScene.time , 1000+Math.random()*2000).
                            setPath(
                                new CAAT.LinearPath().
                                    setInitialPosition(
                                        radius/2 + Math.cos(angle)*radius,
                                        radius/2 + Math.sin(angle)*radius ).
                                    setFinalPosition(
                                        j*this.bricksImage.singleWidth + j*2,
                                        i*this.bricksImage.singleHeight + i*2 ) ).
/*
                                new CAAT.CurvePath().
                                        setCubic(
                                            radius/2 + Math.cos(angle)*radius,
                                            radius/2 + Math.sin(angle)*radius,
                                            Math.random()*this.director.canvas.width,
                                            Math.random()*this.director.canvas.height,
                                        Math.random()*this.director.canvas.width,
                                        Math.random()*this.director.canvas.height,
                                        
                                            j*this.bricksImage.singleWidth + j*2,
                                            i*this.bricksImage.singleHeight + i*2)
                                         ).
*/
                            setInterpolator(
                                new CAAT.Interpolator().createBounceOutInterpolator( false) );
                    var sb= new CAAT.ScaleBehavior().
                            setFrameTime(this.directorScene.time , 1000+Math.random()*2000).
                            setValues( .1, 1, .1 , 1).
                            setInterpolator(
                                new CAAT.Interpolator().createBounceOutInterpolator( false) );


                    brickActor.emptyBehaviorList();
                    brickActor.addBehavior(moveB);
                    brickActor.addBehavior(sb);
                    brickActor.enableEvents(false);

                    moveB.addListener( {
                        behaviorExpired : function( behavior, time, actor ) {
                            me.endInitializeActors();
                        }
                    });
                }
            }

            this.actorInitializationCount=0;
        },
        endInitializeActors : function() {
            this.actorInitializationCount++;
            if ( this.actorInitializationCount==this.gameRows*this.gameColumns ) {
                this.context.setStatus( this.context.ST_RUNNNING );
            }
        },
        contextEvent : function( event ) {
            if ( event.source=='context' ) {
                if ( event.type='status') {
                    if ( event.params==this.context.ST_INITIALIZING ) {
                        this.initializeActors();
                    } else if ( event.params==this.context.ST_RUNNNING) {
                        var i, j;
                        for( i=0; i<this.gameRows; i++ ) {
                            for( j=0; j<this.gameColumns; j++ ) {
                                var brickActor= this.brickActors[i][j];
                                brickActor.enableEvents(true);
                            }
                        }
                    }
                }
            }
        },
        startGame : function() {
            this.context.initialize();
        }
    };
})();
