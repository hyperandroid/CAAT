/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 **/
function __scene2(director) {
	
	var scene= new CAAT.Scene();
	scene.create();
	
	conpoundimage = new CAAT.CompoundImage();
	conpoundimage.initialize( director.getImage('chapas'), 6, 6);
	var __index=0;
	
	var padding= 10;
	
	var cw= director.canvas.width-padding*2;
	var ch= director.canvas.height-padding*2;
	
	var cols= (cw/(conpoundimage.singleHeight))>>0;
	var rows= (ch/(conpoundimage.singleWidth))>>0;
	
	var w= cw/cols ;
	var h= ch/rows;

	
	var cc= new CAAT.ActorContainer();
	cc.setBounds(0,0,director.canvas.width,director.canvas.height);
	cc.create();
	scene.addChild(cc);
	
	for( var i=0; i<rows; i++ ) {
		for( var j=0; j<cols; j++ ) {
			

			var actor= new CAAT.SpriteActor();
			actor.setBounds( j*w + padding, i*h + padding, w, h);
			actor.create();
			actor.setSpriteImage( conpoundimage );
			actor.setAnimationImageIndex( [ (__index++)%conpoundimage.getNumImages() ] );
			cc.addChild(actor);
			
			var sb= new CAAT.ScaleBehavior();
			sb.setPingPong();
			sb.anchor= CAAT.Actor.prototype.ANCHOR_CENTER;
			sb.startScaleX= 1;
			sb.endScaleX= 2;
			sb.startScaleY= 1;
			sb.endScaleY= 2;
			sb.expired= true;
            /*
            sb.setInterpolator( new CAAT.Interpolator().createQubicBezierInterpolator(
            {x:0,y:0}, {x:1,y:0}, {x:0,y:1}, {x:1,y:1}, true ) );
                        */
            sb.setInterpolator(
                    //new CAAT.Interpolator().createBounceOutInterpolator(true) );
                    //new CAAT.Interpolator().createElasticOutInterpolator(1.1, .4) );
                    new CAAT.Interpolator().createExponentialInOutInterpolator(3,true) );

			actor.addBehavior(sb);
			
			var rb= new CAAT.RotateBehavior();
			rb.anchor= CAAT.Actor.prototype.ANCHOR_CENTER;
			rb.startAngle=0;
			rb.endAngle=Math.PI*2;
			rb.expired= true;
			actor.addBehavior(rb);
			
			actor.mouseDblClick= function(mouseEvent) {
				var actor= mouseEvent.source;
				if( null==actor ) {
					return;
				}
				var behaviour= actor.behaviorList[0];
				if( null==behaviour ) {
					return;
				}
				
				if ( behaviour.expired ) {
					// remove from parent.
					actor.parent.removeChild(actor);
					// add last on parent
					actor.parent.addChild(actor);
					actor.behaviorList[0].setFrameTime(	mouseEvent.source.time,	1000 );
				}				
			};
			
			actor.mouseEnter= function(mouseEvent) {
				var actor= mouseEvent.source;
				if( null==actor ) {
					return;
				}
				var behaviour= actor.behaviorList[0];
				if( null==behaviour ) {
					return;
				}
				
				if ( behaviour.expired ) {
					
					// remove from parent.
					actor.parent.removeChild(actor);
					// add last on parent
					actor.parent.addChild(actor);
					
					actor.behaviorList[0].setFrameTime(	mouseEvent.source.time,	500 );
					actor.behaviorList[1].setFrameTime(	mouseEvent.source.time,	500 );
				}
			};
		}
	}
	
	var gradient= director.crc.createLinearGradient(0,0,0,30);
	gradient.addColorStop(0,'#ffff00');
	gradient.addColorStop(0.5,'#ff00ff');
	gradient.addColorStop(1,'blue');	
	
	var cc1= new CAAT.ActorContainer();
	cc1.setBounds( 380,30, 300, 150 );
	cc1.create();
	scene.addChild(cc1);
	cc1.mouseEnabled= false;
	
	var rb1= new CAAT.RotateBehavior();
	rb1.cycleBehavior= true;
	rb1.setFrameTime( 0, 4000 );
	rb1.startAngle= -Math.PI/8;
	rb1.endAngle= Math.PI/8;
	rb1.setInterpolator( new CAAT.Interpolator().createQubicBezierInterpolator( {x:0,y:0}, {x:1,y:0}, {x:0,y:1}, {x:1,y:1}, true ) );
	rb1.anchor= CAAT.Actor.prototype.ANCHOR_TOP;
	cc1.addBehavior(rb1);
	
	var text= new CAAT.TextActor();
	text.setFont("50px sans-serif");
	text.setText("One Image.");
    text.calcTextSize(director);
	text.textAlign="center";
	text.setLocation((cc1.width-text.width)/2,0);
	text.create();
	text.fillStyle=gradient;
	text.outline= true;
	cc1.addChild(text);

	var text2= new CAAT.TextActor();
	text2.setFont("30px sans-serif");
	text2.textAlign="center";
	text2.setText("Behaviors on");
    text2.calcTextSize(director);
	text2.setLocation((cc1.width-text2.width)/2,50);
	text2.create();
	text2.fillStyle=gradient;
	text2.outline= true;
	cc1.addChild(text2);
	
	var text3= new CAAT.TextActor();
	text3.setFont("30px sans-serif");
	text3.textAlign="center";
	text3.setText("MouseMove");
    text3.calcTextSize(director);
	text3.setLocation((cc1.width-text3.width)/2,80);
	text3.create();
	text3.fillStyle=gradient;
	text3.outline= true;
	cc1.addChild(text3);

	var text4= new CAAT.TextActor();
	text4.setFont("10px sans-serif");
	text4.textAlign="center";
	text4.setText("and");
    text4.calcTextSize(director);
	text4.setLocation((cc1.width-text4.width)/2,110);
	text4.create();
	text4.fillStyle='black';
	text4.outline= true;
	cc1.addChild(text4);
	
	var text5= new CAAT.TextActor();
	text5.setFont("30px sans-serif");
	text5.textAlign="center";
	text5.setText("MouseDblClick");
    text5.calcTextSize(director);
	text5.setLocation((cc1.width-text5.width)/2,120);
	text5.create();
	text5.fillStyle=gradient;
	text5.outline= true;
	cc1.addChild(text5);
	
	
	cc1.mouseEnabled= false;
	
	scene.addChild(cc1);
	
	return scene;
}