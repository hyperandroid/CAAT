/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 **/
function __scene3(director) {
	
	var scene= new CAAT.Scene();
	scene.create();

	var gradient= director.crc.createLinearGradient(0,0,0,50);
	gradient.addColorStop(0,'blue');
	gradient.addColorStop(0.5,'orange');
	gradient.addColorStop(1,'yellow');
	
	var cc= new CAAT.ActorContainer();
	cc.setBounds( 380,30, 300, 150 );
	cc.create();
	scene.addChild(cc);
	cc.mouseEnabled= false;
	
	var rb= new CAAT.RotateBehavior();
	rb.cycleBehavior= true;
	rb.setFrameTime( 0, 4000 );
	rb.minAngle= -Math.PI/8;
	rb.maxAngle= Math.PI/8;
	rb.setInterpolator( new CAAT.Interpolator().createQubicBezierInterpolator( {x:0,y:0}, {x:1,y:0}, {x:0,y:1}, {x:1,y:1}, true ) );
	rb.anchor= CAAT.Actor.prototype.ANCHOR_TOP;
	cc.addBehavior(rb);
	
	var text= new CAAT.TextActor();
	text.setFont("50px sans-serif");
	text.setText("Anchored");
    text.calcTextSize(director);
	text.textAlign="center";
	text.setLocation((cc.width-text.width)/2,0);
	text.create();
	text.fillStyle=gradient;
	text.outline= true;
	cc.addChild(text);
	
	var text2= new CAAT.TextActor();
	text2.setFont("50px sans-serif");
	text2.textAlign="center";
	text2.setText("Affine");
    text2.calcTextSize(director);
	text2.setLocation((cc.width-text2.width)/2,50);
	text2.create();
	text2.fillStyle=gradient;
	text2.outline= true;
	cc.addChild(text2);

	var text3= new CAAT.TextActor();
	text3.setFont("50px sans-serif");
	text3.textAlign="center";
	text3.setText("Transforms");
    text3.calcTextSize(director);
	text3.setLocation((cc.width-text3.width)/2,100);
	text3.create();
	text3.fillStyle=gradient;
	text3.outline= true;
	cc.addChild(text3);
	
	
	var conpoundimage = new CAAT.CompoundImage();
	conpoundimage.initialize( director.getImage('fish'), 1, 3);
	
	var anchor= [5,1,6, 3,0,4, 7,2,8], i;
	// 10 peces con rotation y escalado. fijos sin path.
	for( i=0; i<9; i++ ) {
		var p2 = new CAAT.SpriteActor();
		p2.setAnimationImageIndex( [0,1,2,1] );
		p2.setSpriteImage(conpoundimage);
		p2.changeFPS= 350;		
		p2.setLocation(60+(conpoundimage.singleWidth*2)*(i%3), 60+(conpoundimage.singleWidth)*((i/3)>>0) );
		p2.create();
		
		var rb= new CAAT.RotateBehavior();
		rb.cycleBehavior= true;
		rb.setFrameTime( 0, 2000 );
		rb.minAngle= 0;
		rb.maxAngle= Math.PI*2;
		rb.anchor= anchor[i];
		p2.addBehavior(rb);
		
		scene.addChild(p2);
	}
	
	var offset= 40+conpoundimage.singleWidth*3+40;
	for( i=0; i<9; i++ ) {
		var p2 = new CAAT.SpriteActor();
		p2.setAnimationImageIndex( [0,1,2,1] );
		p2.setSpriteImage(conpoundimage);
		p2.changeFPS= 350;		
		p2.setLocation(60+(conpoundimage.singleWidth*2)*(i%3), 60+(conpoundimage.singleWidth)*((i/3)>>0)+offset );
		p2.create();
		
		var sb= new CAAT.ScaleBehavior();
		sb.cycleBehavior= true;
		sb.setFrameTime( 0, 2000 );
		sb.minScaleX= .5;
		sb.minScaleY= .5;
		sb.maxScaleX= 1.5;
		sb.maxScaleY= 1.5;
		sb.setPingPong();
		sb.anchor= anchor[i];
		p2.addBehavior(sb);
		
		scene.addChild(p2);
	}	

	var N=16;
	var R=100;
	
	for( i=0; i<N; i++ ) {
		var p2 = new CAAT.SpriteActor();
		p2.setAnimationImageIndex( [0,1,2,1] );
		p2.setSpriteImage(conpoundimage);
		p2.changeFPS= 350;		
		var angle= i/N*Math.PI*2;
		p2.setLocation(525+R*Math.cos(angle), 300+R*Math.sin(angle) );
		p2.create();
		p2.setRotation(angle);

		var sb= new CAAT.ScaleBehavior();
		sb.setPingPong();
		sb.anchor= CAAT.Actor.prototype.ANCHOR_CENTER;
		sb.minScaleX= 1;
		sb.maxScaleX= 3;
		sb.minScaleY= 1;
		sb.maxScaleY= 1;
		sb.expired= true;
		sb.anchor= CAAT.Actor.prototype.ANCHOR_LEFT;
		p2.addBehavior(sb);
		
		var ab= new CAAT.AlphaBehavior();
		ab.setPingPong();
		ab.startAlpha=1;
		ab.endAlpha=0;
		ab.setFrameTime( i*250, 2000 );
		ab.setCycle(true);
		p2.addBehavior(ab);
		
		p2.mouseEnter= function(mouseEvent) {
			var actor= mouseEvent.source;
			if( null==actor ) {
				return;
			}
			var behaviour= actor.behaviorList[0];
			if( null==behaviour ) {
				return;
			}
			
			if ( behaviour.expired ) {
				actor.behaviorList[0].setFrameTime( mouseEvent.source.time, 1000 );
			}
		};		
		
		scene.addChild(p2);
	}	

	scene.paint = function(director, time) {
		
		var canvas= director.crc;
		
		canvas.strokeStyle='black';
		
		for( var i=0; i<9; i++ ) {
			canvas.strokeRect(
					60+(conpoundimage.singleWidth*2)*(i%3), 
					60+(conpoundimage.singleWidth)*((i/3)>>0),
					48,
					27);
			
			canvas.strokeRect(
					60+(conpoundimage.singleWidth*2)*(i%3), 
					60+(conpoundimage.singleWidth)*((i/3)>>0)+ 40+conpoundimage.singleWidth*3+40,
					48,
					27 );
					
		}
	};
	
	return scene; 	
}