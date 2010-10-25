(function() {

    BUBBLES.GameScene = function() {
        return this;
    };

    BUBBLES.GameScene.prototype= {
        context:        null,
        directorScene:  null,
        actorBubbles:   null,
        bubbleLayer:    null,
        backgroundLayer:null,

        bubbleWidth:    30,
        bubbleHeight:   30,

        create : function(director) {
            this.context= new BUBBLES.Context();
            this.context.create( 10,15,4 );
            this.context.addContextListener(this);

            this.directorScene= new CAAT.Scene();
            this.directorScene.create();

            this.createBackground(director);

            this.bubbleLayer= new CAAT.ActorContainer();
            this.bubbleLayer.setBounds( 0,0,director.canvas.width,director.canvas.height );
            this.bubbleLayer.create();

            var me= this;
            this.bubbleLayer.mouseEnter= function(mouseEvent) {
                me.context.releaseConnectedBubbleSet();
            };
	        this.directorScene.addChild(this.bubbleLayer);

            this.initialize();

        },
        createBackground: function(director) {
            var conpoundimagefish = [];
            conpoundimagefish.push( new CAAT.CompoundImage().initialize( director.getImage('fish'),  1, 3) );
            conpoundimagefish.push( new CAAT.CompoundImage().initialize( director.getImage('fish2'), 1, 3) );
            conpoundimagefish.push( new CAAT.CompoundImage().initialize( director.getImage('fish3'), 1, 3) );
            conpoundimagefish.push( new CAAT.CompoundImage().initialize( director.getImage('fish4'), 1, 3) );

            this.backgroundLayer= new CAAT.ActorContainer();
            this.backgroundLayer.setBounds(0,0,director.canvas.width,director.canvas.height);
            this.backgroundLayer.create();
            this.backgroundLayer.mouseEnabled= false;
            this.backgroundLayer.paint= function( director, time ) {
                director.ctx.drawImage( director.getImage('plants'), 0, 0, this.width, this.height );
            };

            this.directorScene.addChild(this.backgroundLayer);

            for( var j=0; j<20; j++ ) {
                var fish = new CAAT.SpriteActor();
                fish.create();
                fish.setAnimationImageIndex( [0,1,2,1] );
                fish.changeFPS= 300;
                fish.setSpriteImage(conpoundimagefish[j%4]);
                fish.mouseEnabled= false;
                this.backgroundLayer.addChild(fish);

                var pbfish= new CAAT.PathBehavior();
                pbfish.autoRotate= true;
                pbfish.setPath( new CAAT.Path().setLinear(
                        Math.random()*director.width,
                        Math.random()*director.height,
                        Math.random()*director.width,
                        Math.random()*director.height) );
                pbfish.setInterpolator( new CAAT.Interpolator().createExponentialInOutInterpolator(2,false) );
                pbfish.setFrameTime( 0, 2500+2500*Math.random() );


                pbfish.addListener( {
                    behaviorExpired : function(behaviour,time) {
                        var endCoord= behaviour.path.endCurvePosition();
                        behaviour.setPath(
                                new CAAT.Path().setCubic(
                                    endCoord.x,
                                    endCoord.y,
                                    Math.random()*director.width,
                                    Math.random()*director.height,
                                    Math.random()*director.width,
                                    Math.random()*director.height,
                                    Math.random()*director.width,
                                    Math.random()*director.height) );
                        behaviour.setFrameTime( time, 3000+Math.random()*3000 );
                    }
                });

                fish.addBehavior( pbfish );
            }

        },
        /**
         *
         * @param event JSON of the form: {source: string, event: string, params: JSON}
         */
        contextEvent : function( event ) {
            if ( event.source == 'bubble' ) {
                var connectedSet= event.params;
                for( var i=0; i<connectedSet.length; i++ ) {
                    this.actorBubbles[connectedSet[i].row][connectedSet[i].column].setPointed( event.event == 'pointed', i );
                }
            } else if ( event.source=='board') {
                if ( event.event =='initialize' ) {
                    this.createActorBubbles()
                }
            }
        },
        initialize : function() {
            this.context.initialize();
        },
        destroy : function() {
            
        },

        createActorBubbles : function()    {
            var i,j;

            this.bubbleLayer.emptyChildren();

            this.actorBubbles= [];
            for( i=0; i<this.context.iRows; i++ ) {
                this.actorBubbles.push( [] );
                for( j=0; j<this.context.iColumns; j++ ) {
                    var bubble= new BUBBLES.GameBubbleActor();
                    bubble.create();
                    bubble.setBounds(
                            (this.bubbleLayer.width-this.context.iColumns*this.bubbleWidth)/2 + j*this.bubbleWidth,
                            (this.bubbleLayer.height-this.context.iRows*this.bubbleHeight)/2  + i*this.bubbleHeight - Math.sin(j*Math.PI/this.context.iColumns)*30,
                            this.bubbleWidth,
                            this.bubbleHeight );
                    bubble.setContextData( i, j, this.context );

                    this.actorBubbles[i].push( bubble );
                    this.bubbleLayer.addChild(bubble);
                }
            }
        }
    };

})();

(function() {
    BUBBLES.GameBubbleActor= function() {
        BUBBLES.GameBubbleActor.superclass.constructor.call(this);
        return this;
    };

    extend( BUBBLES.GameBubbleActor, CAAT.Actor, {
        iRow:       -1,
        iColumn:    -1,
        context:    null,

        pointedBubble:  false,

        setContextData : function( iRow, iColumn, context ) {
            this.iRow=      iRow;
            this.iColumn=   iColumn;
            this.context=   context;

            var sb= new CAAT.ScaleBehavior();
            sb.setPingPong();
            sb.anchor= CAAT.Actor.prototype.ANCHOR_CENTER;
            sb.startScaleX= 1;
            sb.endScaleX= 1.5;
            sb.startScaleY= 1;
            sb.endScaleY= 1.5;
            sb.setCycle(true);
            this.addBehavior(sb);

            var ab= new CAAT.AlphaBehavior();
            ab.setPingPong();
            ab.startAlpha=1;
            ab.endAlpha=0.5;
            ab.setCycle(true);
            this.addBehavior(ab);
            
        },
        paint : function( director, time ) {
            var bubble= this.context.getBubbleAt( this.iRow, this.iColumn );
            if ( bubble.getStatus()!=BUBBLES.Bubble.prototype.ST_SPIKED ) {
                var colorIndex= bubble.getType();
                var color= '#ffff00';

                switch( colorIndex ) {
                    case 0:
                    color='#ff0000';
                    break;
                    case 1:
                    color='#00ff00';
                    break;
                    case 2:
                    color='#0000ff';
                    break;
                    case 3:
                    color='#ff00ff';
                    break;
                    case 4:
                    color='#00ffff';
                    break;
                }

                var ctx= director.crc;
                ctx.fillStyle= color;

                ctx.beginPath();
                ctx.arc(
                        this.width/2,
                        this.height/2,
                        this.width/2 - 2,
                        0,
                        2*Math.PI,
                        false);
                ctx.fill();
            }
        },
        mouseMove : function(mouseEvent) {
            this.context.getConnectedBubbleSet( this.iRow, this.iColumn );
        },
        mouseClick : function(mouseEvent) {
            this.context.explode( this.iRow, this.iColumn );
        },
        setPointed : function(bPointed, iPointedIndex) {
            this.pointedBubble= bPointed;

            if ( bPointed ) {
                this.behaviorList[0].setFrameTime( this.time + iPointedIndex*30 , 1000 );
                this.behaviorList[1].setFrameTime( this.time, 1000 );
            } else {
		        this.behaviorList[0].setExpired(this,this.time);
		        this.behaviorList[1].setExpired(this,this.time);
            }
        }
    });
})();

(function() {
    BUBBLES.BackgroundBubble = function() {
        BUBBLES.BackgroundBubble.superclass.constructor.call(this);
        return this;
    };

    extend(BUBBLES.BackgroundBubble, CAAT.SpriteActor, {

        verticalSpeed:          0,
        horizontalDisplacement: 0,
        displacementAmplitude:  0,
        bubbleX:                0,
        bubbleY:                0,
        bubbleRange:            0,

        initialize : function(director) {
            BUBBLES.BackgroundBubble.superclass.initialize.call(this);
            this.verticalSpeed=          Math.random()*1000 + 1000;
            this.horizontalDisplacement= Math.random()*10+5;
            this.displacementAmplitude=  Math.random()*20+20;
            this.bubbleX=                Math.random()*(director.width-20) + 10;
            this.bubbleY=                Math.random()*50;
            this.bubbleRange=            Math.random()*50 + director.height;
        },
        animate : function(director,time) {
            BUBBLES.BackgroundBubble.superclass.animate.call(this,director,time);
            this.y= this.bubbleRange - (time%this.verticalSpeed)/this.verticalSpeed * this.bubbleRange;
            this.x= this.bubbleX + Math.cos( Math.PI/(this.y%this.displacementAmplitude) )*this.horizontalDisplacement;
        }
    });
})();