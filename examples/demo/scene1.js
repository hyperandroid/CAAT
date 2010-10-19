/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 **/
function __scene1_makePath(interpolator) {
	var p= new CAAT.Path();
	p.interpolator= interpolator;
	p.beginPath(200,200);
	p.addCubicTo( 300,15, 400,10, 500,200 );
	p.addQuadricTo( 550,300, 450,350 );
	p.addQuadricTo( 400,400, 350,200 );
	p.addCubicTo( 100,300, 300,450, 10,400);
	p.addQuadricTo( 40,200, 200,200 );
/*
    p.addCubicTo( 100,100, 300,100, 300,200 );
    p.addCubicTo( 300,300, 500,300, 500,200 );
    p.addCubicTo( 500,100, 200,100, 200,200 );
*/
	p.endPath();

	return p;
}

function __scene1_makeInterpolatorActor(scene, x, y, S, interpolatorReal, pez) {

    // here i'm using paths (concretely curvepath with cubic bezier) as an interpolator.
    // as far as the target object has a method getContour(numSamples), this will work.
    var ia= new CAAT.InterpolatorActor();
    ia.create();
    ia.setInterpolator( interpolatorReal );
    ia.setBounds( x, y, S, S );
    ia.fillStyle= '#c0c0c0';

    ia.interpolatorReal= interpolatorReal;

    ia.mouseDblClick= function(mouseEvent) {
        pez.pathMeasure.interpolator= this.interpolatorReal;
    };

    ia.oldPaint= ia.paint;
    ia.paint= function( director, time ) {
        this.fillStyle= ( pez.pathMeasure.interpolator==this.interpolatorReal ) ? '#00ff7f' : '#c0c0c0';
        this.oldPaint(director,time);
    };
    
    ia.mouseDown= ia.mouseUp= ia.mouseDrag= function(mouseEvent) {};

    scene.addChild(ia);

}

function __scene1(director) {
	
	var scene= new CAAT.Scene();
	scene.create();

    var lerps= [
        new CAAT.Interpolator().createLinearInterpolator(true),
        new CAAT.Interpolator().createLinearInterpolator(false),
        new CAAT.Interpolator().createQubicBezierInterpolator({x:0,y:0}, {x:0,y:0}, {x:1,y:0}, {x:1,y:1} ),
        new CAAT.Interpolator().createQubicBezierInterpolator({x:0,y:0}, {x:0,y:1}, {x:1,y:0}, {x:1,y:1} ),
        new CAAT.Interpolator().createQubicBezierInterpolator({x:0,y:0}, {x:1,y:0}, {x:0,y:1}, {x:1,y:1} ),
        new CAAT.Interpolator().createQubicBezierInterpolator({x:0,y:0}, {x:0,y:1}, {x:0,y:1}, {x:1,y:1} ),
        new CAAT.Interpolator().createExponentialInOutInterpolator(3),
        new CAAT.Interpolator().createBounceInOutInterpolator()
    ];

	// camino del pez unico
	var path = __scene1_makePath(lerps[0]);

	// path actor. to show the path and manipulate its control points.
	var pa= new CAAT.PathActor();
	pa.setBounds(0,0,director.canvas.width,director.canvas.height);
	pa.create();
    pa.setPath(path);
	scene.addChild(pa);

    // sprites images
	conpoundimage = new CAAT.CompoundImage();
	conpoundimage.initialize( director.getImage('fish'), 1, 3);

    var fish = new CAAT.SpriteActor();
    fish.create();
    fish.setAnimationImageIndex( [0,1,2,1] );
    fish.changeFPS= 300;
    fish.setSpriteImage(conpoundimage);
    fish.mouseEnabled= false;
    scene.addChild(fish);

    // path measurer behaviour
    var pb= new CAAT.PathBehavior();
    pb.setPath(path);
    pb.setInterpolator( lerps[0] );
    pb.setFrameTime(0,10000);
    pb.setCycle(true);
    pb.autoRotate= true;

    fish.pathMeasure= pb;
    fish.addBehavior( pb );

    for( var i=0; i<lerps.length; i++ ) {
	    __scene1_makeInterpolatorActor(
                scene,
                director.canvas.width-90,
                10+i*65 ,
                60,
                lerps[i],
                fish);
    }

	scene1_text(director,scene);
	
	return scene; 
}

function scene1_text(director,scene) {
	var cc1= new CAAT.ActorContainer();
	cc1.setBounds( 0,30, 280, 110 );
	cc1.create();
	cc1.mouseEnabled= false;
	scene.addChild(cc1);
	
	var rb= new CAAT.RotateBehavior();
	rb.cycleBehavior= true;
	rb.setFrameTime( 0, 4000 );
	rb.startAngle= -Math.PI/8;
	rb.endAngle= Math.PI/8;
	rb.setInterpolator( new CAAT.Interpolator().createExponentialInOutInterpolator(3,true) );
	rb.anchor= CAAT.Actor.prototype.ANCHOR_TOP;
	cc1.addBehavior(rb);
	
	var gradient= director.crc.createLinearGradient(0,0,0,30);
	gradient.addColorStop(0,'#00ff00');
	gradient.addColorStop(0.5,'red');
	gradient.addColorStop(1,'blue');	
	
	var text= new CAAT.TextActor();
	text.setFont("20px sans-serif");
	text.setText("Conpound Path");
    text.calcTextSize(director);
	text.textAlign="center";
	text.setLocation((cc1.width-text.textWidth)/2,0);
	text.create();
	text.fillStyle=gradient;
	text.outline= true;
	cc1.addChild(text);

	var text2= new CAAT.TextActor();
	text2.setFont("20px sans-serif");
	text2.textAlign="center";
	text2.setText("Quadric,Cubic,Line segments");
    text2.calcTextSize(director);
	text2.setLocation((cc1.width-text2.textWidth)/2,20);
	text2.create();
	text2.fillStyle=gradient;
	text2.outline= true;
	cc1.addChild(text2);

	var text4= new CAAT.TextActor();
	text4.setFont("20px sans-serif");
	text4.textAlign="center";
	text4.setText("Fish Path");
    text4.calcTextSize(director);
	text4.setLocation((cc1.width-text4.textWidth)/2,50);
	text4.create();
	text4.fillStyle=gradient;
	text4.outline= true;
	cc1.addChild(text4);
	
	var text3= new CAAT.TextActor();
	text3.setFont("20px sans-serif");
	text3.textAlign="center";
	text3.setText("Interpolators");
    text3.calcTextSize(director);
	text3.setLocation((cc1.width-text3.textWidth)/2,70);
	text3.create();
	text3.fillStyle=gradient;
	text3.outline= true;
	cc1.addChild(text3);

	var text5= new CAAT.TextActor();
	text5.setFont("20px sans-serif");
	text5.textAlign="center";
	text5.setText("DblClick to Select");
    text5.calcTextSize(director);
	text5.setLocation((cc1.width-text5.textWidth)/2,90);
	text5.create();
	text5.fillStyle=gradient;
	text5.outline= true;
	cc1.addChild(text5);
	
}