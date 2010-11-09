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

            if ( this.brick.selected ) {
                return;
            }

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
        },
        mouseClick : function(mouseEvent) {
            this.brick.changeSelection();
        }

    });
})();

(function() {
    HN.SelectionPath= function() {
        HN.SelectionPath.superclass.constructor.call(this);
        this.coords= [];
        this.particles= [];
        this.fillStyle= null;
        return this;
    }

    extend( HN.SelectionPath, CAAT.Actor, {

        coords:                 null,   // an array of 2D positions on screen.
        path:                   null,
        pathMeasure:            null,
        particles:              null,   // an array of random time to position on path.
        particlesPerSegment:    20,
        traversingPathTime:     3000,

        initialize : function() {
            this.coords= [];
            this.path=           null;
            this.pathMeasure=    null;
        },
        setup : function( context, numberWidth, numberHeight ) {

            this.coords= [];

            // no bricks, no path
            if ( 0==context.selectedList.length ) {
                this.initialize();
            }

            var i;

            // get selected bricks screen coords.
            for( i=0; i<context.selectedList.length; i++ )  {
                var brick= context.selectedList[i];
                this.coords.push(
                    {
                        x: brick.column*numberWidth + numberWidth/2,
                        y: brick.row*numberHeight + numberHeight/2
                    });
            }

            // setup a path for the coordinates.
            this.path= new CAAT.Path();
            this.path.beginPath( this.coords[0].x, this.coords[0].y );
            for( i=1; i<context.selectedList.length; i++ ) {
                this.path.addLineTo( this.coords[i].x, this.coords[i].y );
            }
            this.path.closePath();


            this.pathMeasure= new CAAT.PathBehavior().
                    setPath(this.path).
                    setFrameTime(0, this.traversingPathTime*context.selectedList.length).
                    setCycle(true);

            var expectedParticleCount= this.particlesPerSegment*context.selectedList.length;
            if ( this.particles.length> expectedParticleCount ) {
                this.particles.splice( expectedParticleCount, this.particles.length-expectedParticleCount );
            } else {
                while( this.particles.length<expectedParticleCount ) {
                    this.particles.push( (context.selectedList.length-1)*this.traversingPathTime + this.traversingPathTime*Math.random() );
                }
            }
        },
        paint : function(director, time)    {
            if ( this.coords.length>0 ) {
                var ctx= director.ctx;

                ctx.beginPath();
                for( i=0; i<this.coords.length; i++ ) {
                    ctx.lineTo( this.coords[i].x, this.coords[i].y );
                }
                ctx.lineTo( this.coords[0].x, this.coords[0].y );
                ctx.closePath();

                ctx.strokeStyle=    '#ffff00';
                ctx.lineCap=        'round';
                ctx.lineJoin=       'round';

                ctx.lineWidth=      8;
                ctx.globalAlpha=    .33;
                ctx.stroke();

                ctx.lineWidth=      4;
                ctx.globalAlpha=    .66;
                ctx.stroke();

                ctx.globalAlpha=    1;
                ctx.lineWidth=      1;
                ctx.stroke();

                // draw particles.
                var i;
                for(i=0; i<this.particles.length; i++) {
                    var pos= this.pathMeasure.positionOnTime(this.particles[i]+time);
                    ctx.fillRect( pos.x, pos.y, 5, 5 );
                }
            }
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

        gap:            2,

        context:        null,
        directorScene:  null,

        selectionPath:  null,
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

            var bricksRoot= new CAAT.ActorContainer().
                    create().
                    setBounds(
                        0,
                        0,
                        this.gameColumns*this.getBrickWidth(),
                        this.gameRows*this.getBrickHeight());
            this.directorScene.addChild(bricksRoot);

            var i,j;
            for( i=0; i<this.gameRows; i++ ) {
                this.brickActors.push([]);
                for( j=0; j<this.gameColumns; j++ ) {
                    var brick= new HN.BrickActor().
                            create().
                            initialize( this.bricksImage, this.context.getBrick(i,j) ).
                            setLocation(-100,-100);

                    this.brickActors[i].push( brick );

                    bricksRoot.addChild(brick);
                }
            }


            /////////////////////// initialize selection path
            this.selectionPath= new HN.SelectionPath().
                    create().
                    setBounds(
                        0,
                        0,
                        this.gameColumns*this.getBrickWidth(),
                        this.gameRows*this.getBrickHeight());
            this.selectionPath.enableEvents(false);
            this.directorScene.addChild(this.selectionPath);

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
        getBrickWidth : function() {
            return this.bricksImage.singleWidth + this.gap;
        },
        getBrickHeight : function() {
            return this.bricksImage.singleHeight + this.gap;
        },
        initializeActors : function() {

            this.selectionPath.initialize();

            var i, j;
            var radius= Math.max(this.director.canvas.width,this.director.canvas.height );
            var angle=  Math.PI*2*Math.random();
            var me=     this;

            var p0= Math.random()*this.director.canvas.width;
            var p1= Math.random()*this.director.canvas.height;
            var p2= Math.random()*this.director.canvas.width;
            var p3= Math.random()*this.director.canvas.height;


            for( i=0; i<this.gameRows; i++ ) {
                for( j=0; j<this.gameColumns; j++ ) {
                    var brickActor= this.brickActors[i][j];
                    brickActor.
                            setFrameTime( this.directorScene.time, Number.MAX_VALUE ).
                            setAlpha(1);


                    var moveB= new CAAT.PathBehavior().
                            setFrameTime(this.directorScene.time , 1000+Math.random()*2000).
                            setPath(
/*
                                new CAAT.LinearPath().
                                    setInitialPosition(
                                        radius/2 + Math.cos(angle)*radius,
                                        radius/2 + Math.sin(angle)*radius ).
                                    setFinalPosition(
                                        j*this.getBrickWidth(),
                                        i*this.getBrickHeight() ) ).
*/

                                new CAAT.CurvePath().
                                        setCubic(
                                            radius/2 + Math.cos(angle)*radius,
                                            radius/2 + Math.sin(angle)*radius,
                                            p0, p1, p2, p3,
                                            j*this.bricksImage.singleWidth + j*2,
                                            i*this.bricksImage.singleHeight + i*2)
                                         ).

                            setInterpolator(
//                                new CAAT.Interpolator().createBounceOutInterpolator( false) );
                                new CAAT.Interpolator().createExponentialInOutInterpolator(3,false) );
                    var sb= new CAAT.ScaleBehavior().
                            setFrameTime(this.directorScene.time , 1000+Math.random()*2000).
                            setValues( .1, 1, .1 , 1).
                            setInterpolator(
//                                new CAAT.Interpolator().createBounceOutInterpolator( false) );
                                new CAAT.Interpolator().createExponentialInOutInterpolator(3,false) );


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
            } else if ( event.source='brick' ) {
                if ( event.type='selection' ) {

                    var brick= event.params;
                    var brickActor= this.brickActors[brick.row][brick.column];

                    if ( brick.selected ) {
                        brickActor.emptyBehaviorList();

                        var sb= new CAAT.ScaleBehavior().
                                setValues( 1, .5, 1, .5 ).
                                setFrameTime( 0, 1000 ).
                                setPingPong();
                        var ab= new CAAT.AlphaBehavior().
                                setValues( 1, .25 ).
                                setFrameTime( 0, 1000 ).
                                setPingPong();

                        var cb= new CAAT.ContainerBehavior().
                                setFrameTime( 0, 1000 ).
                                setCycle(true).
                                setPingPong().
                                addBehavior( sb ).
                                addBehavior( ab );

                        brickActor.addBehavior(cb);
                    }
                    else {
                        brickActor.resetTransform();
                        brickActor.emptyBehaviorList();
                        brickActor.alpha=1;
                    }
                }

                // rebuild selection path
                this.selectionPath.setup(
                        this.context,
                        this.getBrickWidth(),
                        this.getBrickHeight() );
            }
        },
        startGame : function() {
            this.context.initialize();
        }
    };
})();
