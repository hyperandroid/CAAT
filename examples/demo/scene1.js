/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 **/



function __scene1_generateInterpolators(director, scene, pathBehavior) {
    var lerps= CAAT.Interpolator.prototype.enumerateInterpolators();

    var cols= 20;
    var j=0, i=0;
    var rows= lerps.length/2/cols;
    var min= 20;
    var max= 45;
    var selectedInterpolatorActor= null;

    // generate interpolator actors.
    for( j=0; j<rows; j++ ) {

        var root= new CAAT.Dock().
                create().
                setBounds(
                    director.canvas.width-(j+1)*max,
                    0,
                    max,
                    director.canvas.height).
                setSizes(min, max).
                setApplicationRange( 3 ).
                setLayoutOp( CAAT.Dock.prototype.OP_LAYOUT_RIGHT );
        root.scene= scene;

        scene.addChild(root);

        for( i=0; i<cols; i++ ) {

            if ( j*cols+i>=lerps.length ) {
                break;
            }

            var actor= new CAAT.InterpolatorActor().
                 create().
                 setInterpolator( lerps[(j*cols+i)*2] ).
                 setBounds( 0, 0, min, min ).
                 setStrokeStyle( 'blue' );

            actor.mouseExit= function(mouseEvent) {
                if ( mouseEvent.source!=selectedInterpolatorActor ) {
                    mouseEvent.source.setFillStyle(null);
                }
            }
            actor.mouseEnter= function(mouseEvent) {
                if ( mouseEvent.source!=selectedInterpolatorActor ) {
                    mouseEvent.source.setFillStyle('#f0f0f0');
                }
            }
            actor.mouseClick= function(mouseEvent) {
                if ( null!=selectedInterpolatorActor ) {
                    selectedInterpolatorActor.setFillStyle(null);
                }
                selectedInterpolatorActor= mouseEvent.source;
                mouseEvent.source.setFillStyle('#00ff00');
                selectedInterpolatorActor= mouseEvent.source;

                pathBehavior.setInterpolator( mouseEvent.source.getInterpolator() );
            }

            root.addChild( actor );
        }

        root.layout();
    }
}

function __scene1(director) {
	
	var scene= new CAAT.Scene();
	scene.create();

	// path actor. to show the path and manipulate its control points.
	var pa= new CAAT.PathActor().
	    setBounds(0,0,600,director.canvas.height).
	    create().
        setPath(
            new CAAT.Path().
                beginPath(200,200).
                addRectangleTo(500,300,false,'#f00').

                addCubicTo( 300,15, 400,10, 550,250 ).

               addQuadricTo( 550,300, 450,350 ).
                addQuadricTo( 400,400, 350,200 ).
                addCubicTo( 100,300, 300,450, 10,400).
                addQuadricTo( 40,200, 200,200 ).

                endPath() );

    var fish = new CAAT.SpriteActor().
        create().
        setAnimationImageIndex( [0,1,2,1] ).
        setChangeFPS(300).
        setSpriteImage(
            new CAAT.CompoundImage().
	            initialize( director.getImage('fish'), 1, 3) ).
        enableEvents(false);

    // path measurer behaviour
    var pb= new CAAT.PathBehavior().
        setPath(pa.getPath()).
        setFrameTime(0,20000).
        setCycle(true).
        setAutoRotate(true).
        setTranslation( fish.width/2, fish.height/2 );

    fish.addBehavior( pb );


    scene.addChild(pa);
	scene1_text(director,scene);
    scene.addChild(fish);

    __scene1_generateInterpolators(director, scene, pb);

	return scene; 
}

function scene1_text(director,scene) {
	var cc1= new CAAT.ActorContainer().
	    setBounds( 0,30, 280, 110 ).
	    enableEvents(false).
        addBehavior(
            new CAAT.RotateBehavior().
                setCycle(true).
                setFrameTime( 0, 4000 ).
                setValues( -Math.PI/8, Math.PI/8, 50,0 ).
                setInterpolator(
                    new CAAT.Interpolator().createExponentialInOutInterpolator(3,true) )
        );
    scene.addChild(cc1);

	var gradient= director.crc.createLinearGradient(0,0,0,30);
	gradient.addColorStop(0,'#00ff00');
	gradient.addColorStop(0.5,'red');
	gradient.addColorStop(1,'blue');	
	
	var text= new CAAT.TextActor().
	    setFont("20px sans-serif").
	    setText("Conpound Path").
        calcTextSize(director).
	    setAlign( "center" ).
        setFillStyle(gradient).
        setOutline(true).
        cacheAsBitmap();
	cc1.addChild(text.setLocation((cc1.width-text.textWidth)/2,0));

	var text2= new CAAT.TextActor().
        setFont("20px sans-serif").
	    setTextAlign("center").
	    setText("Quadric,Cubic,Line segments").
        calcTextSize(director).
        setFillStyle(gradient).
        setOutline(true).
        cacheAsBitmap();
	cc1.addChild(text2.setLocation((cc1.width-text2.textWidth)/2,20));

	var text4= new CAAT.TextActor().
	    setFont("20px sans-serif").
	    setTextAlign("center").
	    setText("Fish Path").
        calcTextSize(director).
        setFillStyle(gradient).
        setOutline(true).
        cacheAsBitmap();
	cc1.addChild(text4.setLocation((cc1.width-text4.textWidth)/2,50));
	
	var text3= new CAAT.TextActor().
	    setFont("20px sans-serif").
	    setTextAlign("center").
	    setText("Interpolators").
        calcTextSize(director).
        setFillStyle(gradient).
        setOutline(true).
        cacheAsBitmap();
	cc1.addChild(text3.setLocation((cc1.width-text3.textWidth)/2,70));

	var text5= new CAAT.TextActor().
	    setFont("20px sans-serif").
	    setTextAlign("center").
	    setText("DblClick to Select").
        calcTextSize(director).
        setFillStyle(gradient).
        setOutline(true).
        cacheAsBitmap();
	cc1.addChild(text5.setLocation((cc1.width-text5.textWidth)/2,90));
	
}