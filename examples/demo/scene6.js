/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 **/
function __scene6(director) {
	
	var scene= new CAAT.Scene();
	scene.create();

	var conpoundimage = new CAAT.CompoundImage();
	conpoundimage.initialize( director.getImage('fish'), 1, 3);
	
	var w= (director.canvas.width/conpoundimage.singleWidth)>>0;
	var h= (director.canvas.height/conpoundimage.singleWidth)>>0;
	var x= (director.canvas.width-w*conpoundimage.singleWidth)/2;
	var y= (director.canvas.height-h*conpoundimage.singleWidth)/2;
	
	var pezContainer= new CAAT.ActorContainer();
	pezContainer.create();
	pezContainer.setBounds(0,0,director.canvas.width,director.canvas.height);
	pezContainer.mouseEnabled= false;

	scene.addChild(pezContainer);
	
	
	for( var i=0; i<h; i++ ) {
		for( var j=0; j<w; j++ ) {
			var p2 = new CAAT.SpriteActor();
			p2.setAnimationImageIndex( [0,1,2,1] );
			p2.setSpriteImage(conpoundimage);
			p2.changeFPS= 250+250*Math.random();		
			p2.setLocation(
					x + j*conpoundimage.singleWidth, 
					y + i*conpoundimage.singleWidth );
			p2.create();
			
			pezContainer.addChild(p2);
		}
	}
	
	var circle= new CAAT.Actor();
	circle.create();
	circle.setBounds( director.canvas.width/2, director.canvas.height/2, 10, 10 );
	circle.__orgX= circle.x;
	circle.__orgY= circle.y;
	circle.fillStyle='blue';
	circle.mouseEnabled= false;
	circle.paint= function(director,time) {
		var canvas= director.crc;
		
		canvas.beginPath();
		canvas.globalAlpha=.75;
		canvas.fillStyle= this.fillStyle;
		canvas.arc(0,0,this.width,0,Math.PI*2,false);
		canvas.fill();
	};
	circle.animate= function(director,time) {

		if ( false==this.parent.pointed ) {		
			var angle= Math.PI*2*Math.sin(time*3E-4) + i*Math.PI/50;
			var radius= this.parent.width/8*Math.cos(time*3E-4);
		    this.setLocation( 

		    			this.__orgX + 
		    			this.parent.width/4*Math.cos(time*3E-4) +	// move horizontally with time 
		    			radius*Math.cos(angle)/2,
		    			
		    			this.__orgY +
		    			this.parent.height/4*Math.sin(time*3E-4) +	// move vertically with time 
		    			radius*Math.sin(angle)/2
		    );
	    	
	    
	    	this.parent.magneticField( this.x, this.y, this.parent.childrenList[0] );
	    }
	    
	    CAAT.Actor.prototype.animate.call(this,director,time);
	};
	scene.addChild(circle);
	
	scene.mouseMove= function(mouseEvent) {
		// 1 el circulo
		mouseEvent.source.childrenList[1].setLocation( mouseEvent.point.x, mouseEvent.point.y );
		// 0 el contenedor de peces
		scene.magneticField(
				mouseEvent.point.x, 
				mouseEvent.point.y,
				mouseEvent.source.childrenList[0]);
	};
	
	scene.magneticField= function(x,y,pezContainer) {
		for(var i=0; i<pezContainer.childrenList.length; i++ ) {
			var actor= pezContainer.childrenList[i];
			var angle= 	Math.atan2( 
					y - (actor.y + actor.height/2), 
					x - (actor.x + actor.width/2) );
			actor.setRotation( angle );
		}		
	};
	
	__scene6_text(director,scene);
	return scene;
}
	
function __scene6_text(director,scene) {
	var gradient= director.crc.createLinearGradient(0,0,0,50);
	gradient.addColorStop(0,'black');
	gradient.addColorStop(0.5,'gray');
	gradient.addColorStop(1,'#c0c0c0');
	
	var cc= new CAAT.ActorContainer();
	cc.setBounds( 380,30, 150, 100 );
	cc.create();
	scene.addChild(cc);
	cc.mouseEnabled= false;
	
	var rb= new CAAT.RotateBehavior();
	rb.cycleBehavior= true;
	rb.setFrameTime( 0, 4000 );
	rb.startAngle= -Math.PI/8;
	rb.endAngle= Math.PI/8;
	rb.setInterpolator( new CAAT.Interpolator().createQubicBezierInterpolator( {x:0,y:0}, {x:1,y:0}, {x:0,y:1}, {x:1,y:1}, true ) );
	rb.anchor= CAAT.Actor.prototype.ANCHOR_TOP;
	cc.addBehavior(rb);
	
	var text= new CAAT.TextActor();
	text.setFont("50px sans-serif");
	text.setText("Fish");
	text.textAlign="center";
    text.calcTextSize(director);
	text.setLocation((cc.width-text.width)/2,0);
	text.create();
	text.fillStyle=gradient;
	text.outline= true;
	cc.addChild(text);
	
	var text2= new CAAT.TextActor();
	text2.setFont("50px sans-serif");
	text2.setText("Field");
	text2.textAlign="center";
    text2.calcTextSize(director);
	text2.setLocation((cc.width-text2.width)/2,50);
	text2.create();
	text2.fillStyle=gradient;
	text2.outline= true;
	cc.addChild(text2);	
	
	scene.addChild(cc);
}