(function() {
    CAAT.Button= function() {
        CAAT.Button.superclass.constructor.call(this);
        return this;
    };

    extend( CAAT.Button, CAAT.Actor, {
        buttonImage:    null,   // a CompoundImage object instance
        iNormal:        0,
        iOver:          0,
        iPress:         0,
        iDisabled:      0,
        iCurrent:       0,
        fnOnClick:      null,

        initialize : function( buttonImage, iNormal, iOver, iPress, iDisabled, fn) {
            this.buttonImage=   buttonImage;
            this.iNormal=       iNormal || 0;
            this.iOver=         iOver || this.iNormal;
            this.iPress=        iPress || this.iNormal;
            this.iDisabled=     iDisabled || this.iNormal;
            this.iCurrent=      this.iNormal;
            this.width=         buttonImage.singleWidth;
            this.height=        buttonImage.singleHeight;
            this.fnOnClick=     fn;
            return this;
        },
        paint : function(director,time) {
            this.buttonImage.paint( director.ctx,  this.iCurrent, 0, 0 );
        },
        mouseEnter : function(mouseEvent) {
            this.iCurrent= this.iOver;
            document.body.style.cursor = 'hand';
        },
        mouseExit : function(mouseEvent) {
            this.iCurrent= this.iNormal;
            document.body.style.cursor = 'default';
        },
        mouseDown : function(mouseEvent) {
            this.iCurrent= this.iPress;
        },
        mouseUp : function(mouseEvent) {
            this.iCurrent= this.iNormal;
        },
        mouseClick : function(mouseEvent) {
            if ( null!=this.fnOnClick ) {
                this.fnOnClick();
            }
        },
        toString : function() {
            return 'CAAT.Button '+this.iNormal;
        }
    });
})();

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
            if ( this.brick.value<=0 ) {
                return;
            }
            // el ladrillo en el modelo es de 1 a 9
            // la imagen tiene indices de 0 a 8.
            // restamos 1 al valor del ladrillo para acceder a la imagen.
            this.compoundImage.paint(
                    director.ctx,
                    (this.brick.value-1) + 9*this.brick.color,
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
                    setValues( 1, 1.2, 1, 1.2 ).
                    setPingPong();

            this.addBehavior( sb );
        },
        mouseDown : function(mouseEvent) {
            this.brick.changeSelection();
        },
        reset : function() {
            this.resetTransform();
            this.emptyBehaviorList();
            this.alpha=1;
        },
        toString : function() {
            return 'HN.Brick '+this.brick.row+','+this.brick.column;
        }

    });
})();

(function() {
    HN.GuessNumberActor= function() {
        HN.GuessNumberActor.superclass.constructor.call(this);
        return this;
    };

    extend( HN.GuessNumberActor, CAAT.TextActor, {

        guessNumber:    0,

        contextEvent : function( event ) {
            if ( event.source=='context' && event.event=='guessnumber' ) {
                this.guessNumber=   event.params.guessNumber;
                this.setText( ''+this.guessNumber );
            }
        }
    });

})();

(function() {
    HN.Chrono= function() {
        HN.Chrono.superclass.constructor.call(this);
        return this;
    };

    extend( HN.Chrono, CAAT.Actor, {

        gradient:   null,
        maxTime:    0,
        elapsedTime:0,
        method: '_paint',

        paint : function( director, time ) {
            var ctx= director.ctx;

            if ( null==this.gradient ) {
                this.gradient= ctx.createLinearGradient(0,0,this.width,0);
                this.gradient.addColorStop(0,'red');
                this.gradient.addColorStop(0.3,'yellow');
                this.gradient.addColorStop(1,'green');
            }

            ctx.fillStyle= this.gradient;
            var size=
                    this.maxTime!=0 ?
                            this.width - this.elapsedTime/this.maxTime * this.width :
                            this.width;
            
            ctx.fillRect(0,0,size,this.height);

            ctx.strokeStyle='black';
            ctx.strokeRect(0,0,this.width,this.height);
        },
        tick : function( iElapsedTime, maxTime ) {
            this.maxTime= maxTime;
            this.elapsedTime= iElapsedTime;
        },
        contextEvent : function(event) {
            if ( event.source=='context' && event.event=='status') {
                if ( event.params==HN.Context.prototype.ST_ENDGAME ) {
                    this.maxTime=0;
                    this.elapsedTime= 1000;
                }
            }
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
    };

    extend( HN.SelectionPath, CAAT.Actor, {

        coords:                 null,   // an array of 2D positions on screen.
        path:                   null,
        pathMeasure:            null,
        particles:              null,   // an array of random time to position on path.
        particlesPerSegment:    10,
        traversingPathTime:     3000,
        multiplier:             1,

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
                return;
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
            this.path.endPath();

            this.pathMeasure= new CAAT.PathBehavior().
                    setPath(this.path).
                    setFrameTime(0, this.traversingPathTime*context.selectedList.length).
                    setCycle(true);

            var expectedParticleCount= this.particlesPerSegment*(context.selectedList.length-1);
            if ( this.particles.length> expectedParticleCount ) {
                this.particles.splice( expectedParticleCount, this.particles.length-expectedParticleCount );
            } else {
                while( this.particles.length<expectedParticleCount ) {
                    this.particles.push( (context.selectedList.length)*this.traversingPathTime + this.traversingPathTime*Math.random() );
                }
            }
        },
        paint : function(director, time)    {
            if ( this.coords.length>0 ) {
                var ctx= director.ctx;

                ctx.beginPath();
                var i;
                for( i=0; i<this.coords.length; i++ ) {
                    ctx.lineTo( this.coords[i].x, this.coords[i].y );
                }

                ctx.strokeStyle=    '#ffff00';
                ctx.lineCap=        'round';
                ctx.lineJoin=       'round';

                for( i=2; i<=8; i+=2 ) {

                    ctx.lineWidth=  i;
                    ctx.globalAlpha= .5 - i/8/3;
                    ctx.stroke();
                }

                // draw particles.
                ctx.fillStyle= '#ffffff';
                var s= 8;
                var pos;

                for(i=0; i<this.particles.length; i++) {
                    pos= this.pathMeasure.positionOnTime( (this.particles[i]+time)*(1+(i%3)*.33) );
                    ctx.beginPath();
                    ctx.arc( pos.x, pos.y, s/2, 0, Math.PI*2, false );
                    ctx.fill();
//                    ctx.fillRect( pos.x-s/2, pos.y-s/2, s, s );
                }


                if ( this.multiplier>1 ) {
                    ctx.globalAlpha= 1;
                    pos= this.pathMeasure.positionOnTime( 0 );

                    ctx.fillStyle='#ffff00';
                    ctx.beginPath();
                    ctx.font= '40px sans-serif';
                    ctx.fillText( 'x'+this.multiplier, pos.x, pos.y );

                    ctx.lineWidth=2;
                    ctx.strokeStyle='7f7f00';
                    ctx.strokeText('x'+this.multiplier, pos.x, pos.y );
                }
            }

        },
        contextEvent : function( event ) {
            if ( event.source=='context' && event.event=='multiplier' ) {
                this.multiplier=   event.params.multiplier;
            }
        }
    });
})();

(function() {
    HN.ScoreActor= function() {
        HN.ScoreActor.superclass.constructor.call(this);

        this.interpolator= new CAAT.Interpolator().createExponentialInOutInterpolator(2,false);
        return this;
    };

    extend( HN.ScoreActor, CAAT.TextActor, {

        incrementScore: 0,
        maxScore:       0,
        minScore:       0,
        currentScore:   0,

        startTime:      0,
        interpolator:   null,
        scoreDuration:  2000,


        reset : function() {
            this.currentScore= 0;
            this.maxScore= 0;
            this.minScore= 0;
            this.setText('');
        },
        contextEvent : function( event ) {
            if ( event.source=='context' ) {
                if ( event.event=='score' ) {
                    this.maxScore= event.params.score;
                    this.minScore= this.currentScore;
                    this.incrementScore= this.maxScore- this.minScore;
                    this.startTime= this.time;
                } else if ( event.event=='status') {
                    if ( event.params==HN.Context.prototype.ST_STARTGAME ) {
                        this.reset();
                    }
                }
            }
        },
        setScore: function(director) {
            this.currentScore>>=0;
            var str= ''+this.currentScore;
            while( str.length<6 ) {
                str='0'+str;
            }
            this.setText( str );
            this.calcTextSize(director);
            this.x= this.parent.width-this.textWidth;
        },
        animate : function(director, time) {
            if ( time>= this.startTime && time<this.startTime+this.scoreDuration ) {
                this.currentScore=
                        this.minScore +
                            this.incrementScore *
                            this.interpolator.getPosition( (time-this.startTime)/this.scoreDuration ).y;
                this.setScore(director);
                
            } else {
                if ( this.currentScore!=this.maxScore ) {
                    this.currentScore= this.maxScore;
                    this.setScore(director);
                }
            }

            HN.ScoreActor.superclass.animate.call(this,director,time);
        }
    });
})();

(function() {
    HN.GameScene= function() {
        return this;
    };

    HN.GameScene.prototype= {

        imageBricksW:               9,
        imageBricksH:               7,

        gameRows:                   15,
        gameColumns:                20,

        gap:                        2,

        context:                    null,
        directorScene:              null,

        selectionPath:              null,
        bricksContainer:            null,
        fallingBricksContainer:     null,
        brickActors:                null,
        bricksImage:                null,
        buttonImage:                null,

        levelActor:                 null,
        chronoActor:                null,
        timer:                      null,

        scoreActor:                 null,
        endGameActor:               null,

        director:                   null,


        actorInitializationCount:   0,  // flag indicating how many actors have finished initializing.

        backgroundContainer:        null,

        /**
         * Creates the main game Scene.
         * @param director a CAAT.Director instance.
         */
        create : function(director, rows, columns) {

            var me= this;

            this.gameRows= rows;
            this.gameColumns= columns;

            this.director= director;

            this.bricksImage= new CAAT.CompoundImage().initialize(
                    director.getImage('bricks'),
                    this.imageBricksH,
                    this.imageBricksW );
            this.buttonImage= new CAAT.CompoundImage().initialize(
                    director.getImage('buttons'), 6,4 );


            this.context= new HN.Context().
                    create( this.gameRows, this.gameColumns, this.imageBricksH ).
                    addContextListener(this);

            this.directorScene= director.createScene();
            this.directorScene.activated= function() {
                // cada vez que la escena se prepare para empezar partida, inicializar el contexto.
                me.context.initialize();
            };

            var dw= director.canvas.width;
            var dh= director.canvas.height;

            this.backgroundContainer= new CAAT.ActorContainer().
                    create().
                    setBounds(0,0,dw,dh);

            this.backgroundContainer.addChild(
                    new HN.Garden().
                            create().
                            setBounds(0,0,dw,dh).
                            initialize( director.ctx, 120, dh/2 )
                    );
            this.backgroundContainer.addChild(
                    new HN.RotoZoomActor().
                            create().
                            setBounds(0,0,dw,dh).
                            initialize(director, director.getImage('space') ) );
            this.backgroundContainer.addChild(
                    new HN.PlasmaActor().
                            create().
                            setBounds(0,0,dw,dh).
                            initialize(dw/8, dh/8) );

            this.directorScene.addChild(
                    this.backgroundContainer );

            this.brickActors= [];

            //////////////////////// Number Bricks
            this.bricksContainer= new CAAT.ActorContainer().
                    create().
                    setSize(
                        this.gameColumns*this.getBrickWidth(),
                        this.gameRows*this.getBrickHeight() );

            var bricksCY= (dh-this.bricksContainer.height)/2;
            var bricksCX= bricksCY;
            this.bricksContainer.setLocation( bricksCX, bricksCY );
            
            this.directorScene.addChild(this.bricksContainer);

            var i,j;
            for( i=0; i<this.gameRows; i++ ) {
                this.brickActors.push([]);
                for( j=0; j<this.gameColumns; j++ ) {
                    var brick= new HN.BrickActor().
                            create().
                            initialize( this.bricksImage, this.context.getBrick(i,j) ).
                            setLocation(-100,-100);

                    this.brickActors[i].push( brick );

                    this.bricksContainer.addChild(brick);
                }
            }

            /////////////////////// game indicators.
            var controls= new CAAT.ActorContainer().
                    create().
                    setBounds(
                        this.bricksContainer.x + this.bricksContainer.width + bricksCX,
                        this.bricksContainer.x,
                        dw - bricksCX - (this.bricksContainer.x + this.bricksContainer.width) - bricksCX,
                        this.bricksContainer.height );
            this.directorScene.addChild( controls );

            /////////////////////// initialize selection path
            this.selectionPath= new HN.SelectionPath().
                    create().
                    setBounds(
                        this.bricksContainer.x,
                        this.bricksContainer.y,
                        this.gameColumns*this.getBrickWidth(),
                        this.gameRows*this.getBrickHeight());
            this.selectionPath.enableEvents(false);
            this.directorScene.addChild(this.selectionPath);
            this.context.addContextListener(this.selectionPath);

            /////////////////////// initialize button
            var restart= new CAAT.Button().
                    create().
                    initialize( this.buttonImage, 20,21,22,23 ).
                    setLocation(
                        (controls.width-this.buttonImage.singleWidth)/2,
                        controls.height - this.buttonImage.singleHeight );

            restart.mouseClick= function(mouseEvent) {
                me.endGame();
            };
            controls.addChild(restart);

            ///////////////////// Level indicator
	        var gradient= director.ctx.createLinearGradient(0,0,0,40);
	            gradient.addColorStop(0,'#00ff00');
	            gradient.addColorStop(0.5,'#ffff00');
	            gradient.addColorStop(1,'#3f3f3f');

	        this.levelActor= new CAAT.TextActor().
                    create().
	                setFont("40px sans-serif").
	                setText('').
                    setFillStyle( gradient ).
                    setOutline(true).
                    calcTextSize(director);

		    this.levelActor.setLocation((controls.width-this.levelActor.textWidth)/2,5);
	        controls.addChild(this.levelActor);

            ///////////////////// Guess Number
            var guess= new HN.GuessNumberActor().
                    create().
                    setBounds( (controls.width-80)/2, 50, 80, 30 ).
                    setFont("80px sans-serif").
	                setText("").
                    setFillStyle('#000000').
                    setOutline(true).
                    setOutlineColor('#ffff00');

            this.context.addContextListener(guess);
            controls.addChild(guess);

            ///////////////////// chronometer
            this.chronoActor= new HN.Chrono().
                    create().
                    setBounds( 2, 140, controls.width-4, 20 );
            this.context.addContextListener(this.chronoActor);
            controls.addChild(this.chronoActor);

            ///////////////////// score
            this.scoreActor= new HN.ScoreActor().
                    create().
                    setBounds( 2, 180, controls.width-4, 30 ).
                    setFont( '40px sans-serif' ).
                    setFillStyle( gradient ).
                    setOutline( true ).
                    setOutlineColor( '0x7f7f00' );
            controls.addChild( this.scoreActor );
            this.context.addContextListener(this.scoreActor);

            ////////////////////////////////////////////////
            this.create_EndGame(director);

            return this;
        },
        create_EndGame : function(director, go_to_menu_callback ) {
            var me= this;

            this.endGameActor= new CAAT.ImageActor().
                    create().
                    setImage( director.getImage('background') ).
                    setAlpha( .9 ).
                    setGlobalAlpha(false);

            var menu= new CAAT.Button().
                    create().
                    initialize( this.buttonImage, 20,21,22,23 );
            menu.mouseClick= function(mouseEvent) {
                var a0;
                var a1;

                switch( me.context.difficulty ) {
                    case 0:
                        a0= CAAT.Actor.prototype.ANCHOR_LEFT;
                        a1= CAAT.Actor.prototype.ANCHOR_RIGHT;
                    break;
                    case 1:
                        a0= CAAT.Actor.prototype.ANCHOR_BOTTOM;
                        a1= CAAT.Actor.prototype.ANCHOR_TOP;
                    break;
                    case 2:
                        a0= CAAT.Actor.prototype.ANCHOR_TOP;
                        a1= CAAT.Actor.prototype.ANCHOR_BOTTOM;
                    break;
                }

                director.easeInOut(
                    0,
                    CAAT.Scene.EASE_TRANSLATE,
                    a0,
                    1,
                    CAAT.Scene.EASE_TRANSLATE,
                    a1,
                    1000,
                    false,
                    new CAAT.Interpolator().createExponentialInOutInterpolator(3,false),
                    new CAAT.Interpolator().createExponentialInOutInterpolator(3,false) );
            }

            var restart= new CAAT.Button().
                    create().
                    initialize( this.buttonImage, 0,1,2,3 );
            restart.mouseClick= function(mouseEvent) {
                me.prepareSceneIn();
                me.context.initialize();
            }

            var x= (this.endGameActor.width - 2*menu.width - 30)/2;
            var y= this.endGameActor.height-20-menu.height;

            menu.setLocation( x, y );
            restart.setLocation( x+menu.width+30, y );

            this.endGameActor.addChild(menu);
            this.endGameActor.addChild(restart);

            this.endGameActor.setFrameTime(-1,0);

            this.directorScene.addChild(this.endGameActor);
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
                            setAlpha(1).
                            enableEvents(true).
                            resetTransform();

                    var random= Math.random()*1000;

                    var moveB= new CAAT.PathBehavior().
                            setFrameTime(this.directorScene.time, 1000+random).
                            setPath(
                                new CAAT.CurvePath().
                                        setCubic(
                                            radius/2 + Math.cos(angle)*radius,
                                            radius/2 + Math.sin(angle)*radius,
                                            p0, p1, p2, p3,
                                            j*this.bricksImage.singleWidth + j*2,
                                            i*this.bricksImage.singleHeight + i*2)
                                         ).

                            setInterpolator(
                                new CAAT.Interpolator().createExponentialInOutInterpolator(3,false) );
                    var sb= new CAAT.ScaleBehavior().
                            setFrameTime(this.directorScene.time , 1000+random).
                            setValues( .1, 1, .1 , 1).
                            setInterpolator(
                                new CAAT.Interpolator().createExponentialInOutInterpolator(3,false) );


                    brickActor.emptyBehaviorList().
                        addBehavior(moveB).
                        addBehavior(sb).
                        enableEvents(false);

                    
                    var actorCount=0;
                    moveB.addListener( {
                        behaviorExpired : function( behavior, time, actor ) {
                            actorCount++;
                            if ( actorCount==me.gameRows*me.gameColumns ) {
                                if ( me.context==me.context.ST_INITIALIZING ) {
                                    me.context.setStatus( me.context.ST_RUNNNING );
                                }
                            }
                        }
                    });
                }
            }

            this.actorInitializationCount=0;
        },
        contextEvent : function( event ) {

            var i, j;
            var brickActor;
            var me= this;

            if ( event.source=='context' ) {
                if ( event.event=='status') {
                    if ( event.params==this.context.ST_INITIALIZING ) {
                        this.initializeActors();
                    } else if ( event.params==this.context.ST_RUNNNING) {
                        for( i=0; i<this.gameRows; i++ ) {
                            for( j=0; j<this.gameColumns; j++ ) {
                                brickActor= this.brickActors[i][j];
                                brickActor.enableEvents(true);
                            }
                        }

                        this.cancelTimer();
                        this.enableTimer();

                    } else if ( event.params==this.context.ST_LEVEL_RESULT ) {
                        this.cancelTimer();
                        this.context.nextLevel();
                    } else if ( event.params==this.context.ST_ENDGAME ) {
                        this.endGame();
                    }
                } else if ( event.event=='levelchange') {
                    this.levelActor.setText( "Level "+this.context.level );
                    this.levelActor.calcTextSize( this.director );
                    this.levelActor.x= (this.levelActor.parent.width-this.levelActor.width)/2;
                }
            } else if ( event.source=='brick' ) {
                if ( event.event=='selection' ) {   // des/marcar un elemento.
                    this.brickSelectionEvent(event);
                } else if ( event.event=='selectionoverflow') {  // seleccion error.
                    this.selectionOverflowEvent(event);
                } else if ( event.event=='selection-cleared') {  // seleccion error.
                    this.selectionClearedEvent(event);
                }

                // rebuild selection path
                this.selectionPath.setup(
                        this.context,
                        this.getBrickWidth(),
                        this.getBrickHeight() );
            }
        },
        brickSelectionEvent : function(event) {
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
                brickActor.reset();
            }
        },
        selectionOverflowEvent : function(event) {
            var i,j;
            var selectedContextBricks= event.params;
            var actor;

            for( i=0; i<selectedContextBricks.length; i++ ) {
                this.brickActors[ selectedContextBricks[i].row ][ selectedContextBricks[i].column ].reset();
            }

            this.bricksContainer.enableEvents(false);

            // get all active actors on board
            var activeActors= [];
            for( i=0; i<this.gameRows; i++ ) {
                for( j=0; j<this.gameColumns; j++ ) {
                    actor= this.brickActors[i][j];
                    if ( !actor.brick.removed ) {
                        activeActors.push(actor);
                    }
                }
            }

            // define animation callback
            var count=0;
            var maxCount= activeActors.length;
            var me= this;
            var callback= {
                behaviorExpired : function(behavior, time, actor) {
                    count++;
                    if ( count==maxCount ) {
                        me.bricksContainer.enableEvents(true);
                    }
                }
            };

            // for each active actor, play a wrong-path.
            for( i=0; i<activeActors.length; i++ ) {
                actor= activeActors[i];

                var signo= Math.random()<.5 ? 1: -1;
                actor.emptyBehaviorList().
                    addBehavior(
                        new CAAT.PathBehavior().
                            setFrameTime(this.directorScene.time, 200).
                            setPath(
                                new CAAT.Path().
                                    beginPath( actor.x, actor.y ).
                                    addLineTo(
                                        actor.x + signo*(5+5*Math.random()),
                                        actor.y ).
                                    addLineTo(
                                        actor.x - signo*(10+5*Math.random()),
                                        actor.y ).
                                    closePath() ).
                            addListener(callback).
                            setPingPong() );
            }
        },
        selectionClearedEvent : function(event) {
            var selectedContextBricks= event.params;
            var me= this;
            var i,j;

            for( i=0; i<selectedContextBricks.length; i++ ) {

                var actor= this.brickActors[ selectedContextBricks[i].row ][ selectedContextBricks[i].column ];

                var signo= Math.random()<.5 ? 1 : -1;
                var offset= 50+Math.random()*30;
                var offsetY= 60+Math.random()*30;

                actor.parent.setZOrder(actor,Number.MAX_VALUE);
                actor.enableEvents(false).
                    emptyBehaviorList().
                    addBehavior(
                        new CAAT.PathBehavior().
                            setFrameTime( this.directorScene.time, 800 ).
                            setPath(
                                new CAAT.Path().
                                    beginPath( actor.x, actor.y ).
                                    addQuadricTo(
                                        actor.x+offset*signo,   actor.y-300,
                                        actor.x+offset*signo*2, actor.y+this.director.canvas.height+20).
                                    endPath() ).
                            addListener( {

                                colors: ['#00ff00','#ffff00','#00ffff'],
                                behaviorExpired : function(behavior, time, actor) {
                                    actor.setExpired(true);
                                },
                                behaviorApplied : function(behavior, time, normalizedTime, actor, value) {

                                    for( i=0; i<3; i++ ) {
                                        var offset0= Math.random()*10*(Math.random()<.5?1:-1);
                                        var offset1= Math.random()*10*(Math.random()<.5?1:-1);
                                        me.directorScene.addChild(
                                            new CAAT.ShapeActor().
                                                create().
                                                setBounds( offset0+actor.x-3, offset1+actor.y-3, 6, 6 ).
                                                setShape( CAAT.ShapeActor.prototype.SHAPE_CIRCLE).
                                                setFillStyle( this.colors[i%3] ).
                                                setDiscardable(true).
                                                setFrameTime(me.directorScene.time, 400).
                                                addBehavior(
                                                    new CAAT.AlphaBehavior().
                                                        setFrameTime(me.directorScene.time, 300).
                                                        setValues( .6, .1 ).
                                                        setInterpolator(
                                                            new CAAT.Interpolator().createExponentialInInterpolator(
                                                                    2,
                                                                    false))
                                                ) );
                                    }
                                }
                            })
                    ).addBehavior(
                        new CAAT.RotateBehavior().
                            setFrameTime( this.directorScene.time, 800 ).
                            setAngles( 0, (Math.PI + Math.random()*Math.PI*2)*(Math.random()<.5?1:-1) )
                    ).addBehavior(
                        new CAAT.AlphaBehavior().
                            setFrameTime( this.directorScene.time, 800 ).
                            setValues( 1, .25 )
                    ).setScale( 1.5, 1.5 );
            }

            this.timer.reset(this.directorScene.time);
        },
        showLevelInfo : function() {

        },
        prepareSceneIn : function() {
            // setup de actores
            var i,j;

                this.bricksContainer.enableEvents(true);

                // fuera de pantalla
                for( i=0; i<this.gameRows; i++ ) {
                    for( j=0; j<this.gameColumns; j++ ) {
                        this.brickActors[i][j].setLocation(-100,-100);
                    }
                }

                this.selectionPath.initialize();

                this.chronoActor.tick(0,0);
                this.scoreActor.reset();

                this.endGameActor.setFrameTime(-1,0);
        },
        endGame : function() {
            // parar y eliminar cronometro.
            this.directorScene.cancelTimer( this.timer );
            this.timer= null;

            // quitar contorl de mouse.
            this.bricksContainer.enableEvents(false);

            // mostrar endgameactor.

            var x= (this.directorScene.width - this.endGameActor.width)/2;
            var y= (this.directorScene.height - this.endGameActor.height)/2;

            var me_endGameActor= this.endGameActor;
            this.endGameActor.emptyBehaviorList().
                setFrameTime(this.directorScene.time, Number.MAX_VALUE).
                enableEvents(false).
                addBehavior(
                    new CAAT.PathBehavior().
                        setFrameTime( this.directorScene.time, 800 ).
                        setPath(
                            new CAAT.LinearPath().
                                setInitialPosition( x, this.directorScene.height ).
                                setFinalPosition( x, y ) ).
                setInterpolator(
                    new CAAT.Interpolator().createBounceOutInterpolator(false) ).
                addListener( {
                    behaviorExpired : function(behavior, time, actor) {
                        me_endGameActor.enableEvents(true);
                    },
                    behaviorApplied : function(behavior, time, normalizedTime, actor, value) {
                    }
                } )
            );
        },
        setDifficulty : function(level) {
            this.context.difficulty=level;

            this.backgroundContainer.childrenList[0].setExpired(true);
            this.backgroundContainer.childrenList[1].setExpired(true);
            this.backgroundContainer.childrenList[2].setExpired(true);

            this.backgroundContainer.childrenList[level].setFrameTime(
                    this.directorScene.time,
                    Number.MAX_VALUE );

        },
        cancelTimer : function(){
            if ( this.timer!=null ) {
                this.directorScene.cancelTimer(this.timer);
            }
            this.timer= null;
        },
        enableTimer : function() {
            var me= this;
            
            this.timer= this.directorScene.createTimer(
                this.directorScene.time,
                this.context.turnTime,
                function timeout(time, timerTask) {
                    me.context.timeUp();
                },
                function tick(time, timerTask) {
                    me.chronoActor.tick(time, timerTask.duration);
                });

        }

    };
})();
