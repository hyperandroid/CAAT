/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 **/
function __scene5(director) {
	
	var scene= new CAAT.Scene();
	scene.create();
	

	// path
	var p= new CAAT.Path();
	p.beginPath(155,250);
	p.addCubicTo( 155,0,   535,0,   535,250 );
	p.addCubicTo( 535,500,  155,500,  155,250 );
	p.endPath();


	// actor de path para poder verlo y manipularlo
	var pa= new CAAT.PathActor();
	pa.setPath(p);
	pa.setBounds(0,0,director.canvas.width,director.canvas.height);
	pa.create();
	scene.addChild(pa);	

	var gradient= director.crc.createLinearGradient(0,0,0,-40);
	gradient.addColorStop(0,'#ffff00');
	gradient.addColorStop(0.5,'#00ffff');
	gradient.addColorStop(1,'blue');	
	
	var text= new CAAT.TextActor();
	text.setFont("40px sans-serif");
	text.setText("Text on path   :D");
	text.textAlign="left";
	text.create();
	text.fillStyle=gradient;
	text.textBaseline="bottom";
	text.setPath( p, new CAAT.Interpolator().createBounceInOutInterpolator() );
	scene.addChild(text);		

	var gradient2= director.crc.createLinearGradient(0,0,0,40);
	gradient2.addColorStop(0,'#0000ff');
	gradient2.addColorStop(0.5,'#ff0000');
	gradient2.addColorStop(1,'#ffff00');	
	
	var text2= new CAAT.TextActor();
	text2.setFont("40px sans-serif");
	text2.setText("Text under path   :D");
	text2.textAlign="left";
	text2.create();
	text2.fillStyle=gradient2;
	text2.textBaseline="top";
	text2.setPath( p, new CAAT.Interpolator().createExponentialInOutInterpolator(3) );
	text2.sign= -1;
	scene.addChild(text2);		
	
	
	__scene5_text(director,scene);
	
	return scene;
}

function __scene5_text(director,scene) {
	var cc1= new CAAT.ActorContainer();
	cc1.setBounds( 200,200, 280, 120 );
	cc1.create();
	cc1.mouseEnabled= false;
	scene.addChild(cc1);
	
	var rb= new CAAT.RotateBehaviour();
	rb.cycleBehaviour= true;
	rb.setFrameTime( 0, 4000 );
	rb.minAngle= -Math.PI/8;
	rb.maxAngle= Math.PI/8;
	rb.setInterpolator( new CAAT.Interpolator().createQubicBezierInterpolator( {x:0,y:0}, {x:1,y:0}, {x:0,y:1}, {x:1,y:1}, true ) );
	rb.anchor= CAAT.Actor.prototype.ANCHOR_TOP;
	cc1.addBehaviour(rb);
	
	var gradient= director.crc.createLinearGradient(0,0,0,30);
	gradient.addColorStop(0,'black');
	gradient.addColorStop(0.5,'gray');
	gradient.addColorStop(1,'#d0d0d0');	
	
	var text= new CAAT.TextActor();
	text.setFont("40px sans-serif");
	text.setText("Text on Path");
    text.calcTextSize(director);
	text.textAlign="center";
	text.setLocation((cc1.width-text.width)/2,0);
	text.create();
	text.fillStyle=gradient;
	text.outline= true;
	cc1.addChild(text);

	var text2= new CAAT.TextActor();
	text2.setFont("40px sans-serif");
	text2.textAlign="center";
	text2.setText("Interpolated");
    text2.calcTextSize(director);
	text2.setLocation((cc1.width-text2.width)/2,40);
	text2.create();
	text2.fillStyle=gradient;
	text2.outline= true;
	cc1.addChild(text2);

	var text4= new CAAT.TextActor();
	text4.setFont("40px sans-serif");
	text4.textAlign="center";
	text4.setText("As well");
    text4.calcTextSize(director);
	text4.setLocation((cc1.width-text4.width)/2,80);
	text4.create();
	text4.fillStyle=gradient;
	text4.outline= true;
	cc1.addChild(text4);
}