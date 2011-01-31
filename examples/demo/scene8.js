/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * Scene 8.
 * Shows hierarchycally applied transformations to Actors.
 *
 */

function __createShape(w,h) {
    return new CAAT.ShapeActor().create().setShape( CAAT.ShapeActor.prototype.SHAPE_CIRCLE ).setSize(w,h);
}

function __addPlanet(parent, rotationTime, pos, radius, color, startAngle ) {
    var planet= __createShape(radius,radius);

    var x= pos*Math.cos(startAngle);
    var y= pos*Math.sin(startAngle);

    planet.setFillStyle( color ).
            setLocation( x+parent.width/2, y+parent.height/2 ).
            addBehavior(
                new CAAT.RotateBehavior().
                    setFrameTime( 0, rotationTime ).
                    setValues( 0,2*Math.PI).
                    setCycle( true ).
                    setAnchor( CAAT.Actor.prototype.ANCHOR_CUSTOM, -x, -y )
            );

    parent.addChild(planet);

    return planet;
}

function __scene8(director) {

    var i;
    var scene= new CAAT.Scene();
    scene.create();

    __scene8_text(director,scene);    

    var sun= __createShape( 50, 50 ).
            setFillStyle( 'yellow' ).
            setLocation( director.width/2-25, director.height/2-25 );

    __createSunRays(director,scene);

    var earth= __addPlanet( sun, 4000, 90, 15, 'blue', 0 );
        __addPlanet( earth, 4000, 15, 5, 'green', Math.PI/3 );
        __addPlanet( earth, 5000, 22, 5, 'rgb(32,255,192)', 0 );

    var mercury= __addPlanet( sun, 6000, 40, 10, 'rgb(255,64,128)', Math.PI/3 );
    var saturn=  __addPlanet( sun, 15000, 200, 30, 'rgb(255,64,128)', 0 );

        var io=     __addPlanet( saturn, 5000+5000*Math.random(), 20,  8, 'rgb(32,255,192)', 0 );
        var europe= __addPlanet( saturn, 5000+5000*Math.random(), 35,  5, 'rgb(255,32,192)', Math.PI*2/3 );
        var moon=   __addPlanet( saturn, 5000+5000*Math.random(), 70, 10, 'rgb(32,192,255)', 2*Math.PI*2/3 );

            __addPlanet( moon, 9000+4000*Math.random(), 20, 4, 'rgb(0,  0,255)', Math.random()*2*Math.PI );
            __addPlanet( moon, 6000+4000*Math.random(), 12, 4, 'rgb(0,255,255)', Math.random()*2*Math.PI );

    scene.addChild(sun);

    return scene;
}

function __createSunRays(director, scene) {
    var root= new CAAT.ShapeActor().
            create().
            setShape( CAAT.ShapeActor.prototype.SHAPE_CIRCLE ).
            setBounds( director.width/2, director.height/2, 1, 1 ).
            setFillStyle( 'blue' ).
            addBehavior(
                new CAAT.RotateBehavior().
                    setFrameTime(0,20000).
                    setValues(0,2*Math.PI).
                    setCycle(true)
            );

    var NumSegments=20;
    __createStar(root, 16, NumSegments, 2, 20, Math.PI/NumSegments/2 );
    scene.addChild( root );
}

function __createStar(root, arms, armSegments, armSegmentSizeW, armSegmentSizeH, maxAngle) {

    var i;
    for( i=0; i<arms; i++ ) {
        __createArm( root, 2*Math.PI/arms * i, armSegments, armSegmentSizeW, armSegmentSizeH, i, maxAngle );
    }
}

function __createArm( root, angle, segments, armSegmentSizeW, armSegmentSizeH, armIndex, maxAngle ) {

    var i;
    var segment= root;

    for( i=0; i<segments; i++ ) {

        var color= CAAT.Color.prototype.interpolate(
                255,255,0,
                255,128,0,
                segments,
                i
        );

        var newSegment= new CAAT.ShapeActor().
                create().
                setShape( CAAT.ShapeActor.prototype.SHAPE_RECTANGLE ).
                setSize( armSegmentSizeW, armSegmentSizeH ).
                setFillStyle( 'rgb('+color.r+","+color.g+","+color.b+")" ).
                setLocation( 0,-armSegmentSizeH );
        if ( segment==root ) {
            newSegment.setRotationAnchored(angle, armSegmentSizeW/2, armSegmentSizeH);
            newSegment.oldAngle= angle;
        } else {
            newSegment.oldAngle= 0;
            newSegment.animate= function(director,time) {
                CAAT.ActorContainer.prototype.animate.call(this,director,time);
                this.setRotationAnchored(
                        this.oldAngle+
                        maxAngle*Math.sin(new Date().getTime()*.0005 + armIndex*Math.PI/segments/2
                        ),
                        armSegmentSizeW/2,
                        armSegmentSizeH
                );
            };
        }
        
        segment.addChild(newSegment);
        segment= newSegment;
    }
}

function __scene8_text(director,scene) {
	var gradient= director.crc.createLinearGradient(0,0,0,50);
	gradient.addColorStop(0,'orange');
	gradient.addColorStop(0.5,'red');
	gradient.addColorStop(1,'#3f00ff');

	var cc= new CAAT.ActorContainer().
            setBounds( 450,30, 150, 100 ).
	        create().
            enableEvents(false).
            addBehavior(
                new CAAT.RotateBehavior().
                        setCycle(true).
                        setFrameTime( 0, 4000 ).
                        setValues( -Math.PI/8, Math.PI/8 ).
                        setInterpolator(
                            new CAAT.Interpolator().createExponentialInOutInterpolator(3,true)
                        ).
                        setAnchor( CAAT.Actor.prototype.ANCHOR_TOP )
            );
	scene.addChild(cc);

	var text= new CAAT.TextActor().
            setFont("50px sans-serif").
            setText("Hierarchycal").
            create().
            setFillStyle(gradient).
            setOutline(true).
            calcTextSize(director);
    text.setLocation((cc.width-text.width)/2,0);
	cc.addChild(text);

	var text2= new CAAT.TextActor().
	        setFont("50px sans-serif").
            setText("Rotations").
            calcTextSize(director).
            create().
            setFillStyle(gradient).
	        setOutline(true);
    text2.setLocation((cc.width-text2.width)/2,50);
	cc.addChild(text2);

	scene.addChild(cc);
}