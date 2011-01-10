/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 **/
function __scene4(director) {
	
	var scene= new CAAT.Scene();
	scene.create();

	var cc= new CAAT.ActorContainer();
	cc.setBounds( 0,0,director.canvas.width,director.canvas.height );
	cc.create();
	scene.addChild(cc);	
	
	var coords= new CAAT.TextActor();
	coords.setFont("20px sans-serif");
	coords.textAlign="left";
	coords.textBaseline="top";
	coords.setText("");
	coords.setLocation(15,20);
	coords.create();
	coords.fillStyle='black';
	coords.outlineColor= 'white';
	coords.ouline= true;
	scene.addChild(coords);

	var coords2= new CAAT.TextActor();
	coords2.setFont("20px sans-serif");
	coords2.textAlign="left";
	coords2.textBaseline="top";
	coords2.setText("");
	coords2.setLocation(15,42);
	coords2.create();
	coords2.fillStyle='black';
	coords2.outlineColor= 'white';
	coords2.ouline= true;
	scene.addChild(coords2);

	var coords3= new CAAT.TextActor();
	coords3.setFont("20px sans-serif");
	coords3.textAlign="left";
	coords3.textBaseline="top";
	coords3.setText("");
	coords3.setLocation(15,64);
	coords3.create();
	coords3.fillStyle='black';
	coords3.outlineColor= 'white';
	coords3.ouline= true;
	scene.addChild(coords3);
	
	// on doubleclick, zorder maximo.
	var dblclick= function(mouseEvent) {
		var actor= mouseEvent.source;
		if( null==actor ) {
			return;
		}

		var parent= actor.parent;
        parent.setZOrder(actor,Number.MAX_VALUE);
	};
	
	var np = 20;
	for ( var i = 0; i < np; i++) {
		var p = new CAAT.ActorContainer();
		var s = 80;
		p.setBounds(Math.random() * director.canvas.width, Math.random()* director.canvas.height, s, s);
		p.create();
		p.setRotation( Math.PI*2*Math.random() );
		var sc= 1+Math.random()*.25;
		p.setScale( sc, sc );
		p.fillStyle='#ff3fff';
		p.paint= function(director, time) {
			
			var canvas= director.crc;
			
			if ( null!=this.parent && null!=this.fillStyle ) {
				canvas.fillStyle= this.pointed ? 'orange' : (this.fillStyle!=null ? this.fillStyle : 'white'); //'white';
				canvas.fillRect(0,0,this.width,this.height );
			}
			
			canvas.strokeStyle= this.pointed ? 'red' : 'black';
			canvas.strokeRect(0,0,this.width,this.height );
				
            canvas.strokeStyle='white';
            canvas.beginPath();
            canvas.moveTo(5,10);
            canvas.lineTo(20,10);
            canvas.lineTo(15,5);

            canvas.moveTo(20,10);
            canvas.lineTo(15,15);

            canvas.lineWidth=2;
            canvas.lineJoin='round';
            canvas.lineCap='round';

            canvas.stroke();


		};
		p.mouseDblClick= dblclick;
		cc.addChild(p);

		var fpaint= function(director,time) {
			var canvas= director.crc;
			CAAT.Actor.prototype.paint.call(this,director,time);
			canvas.fillStyle='black';
			canvas.fillRect(1,1,5,5);
		};
		
		var p0= new CAAT.Actor();
		p0.setBounds( s/4, s/4, s/4, s/4 );
		p0.create();
		p0.setRotation( Math.PI*2*Math.random() );
		p0.fillStyle='#a03f00';
		p0.mouseDblClick= dblclick;
		p0.paint= fpaint;
		p.addChild(p0);

		var p1= new CAAT.Actor();
		p1.setBounds( s/2, s/2, s/4, s/4 );
		p1.create();
		p1.setRotation( Math.PI*2*Math.random() );
		p1.fillStyle='#ffff3f';
		p1.mouseDblClick= dblclick;
		p1.paint= fpaint;
		p.addChild(p1);
	
		p1.enableDrag();
		p0.enableDrag();
		p.enableDrag();
		
		p1.__mouseMove= p1.mouseMove;
		p0.__mouseMove= p0.mouseMove;
		p.__mouseMove= p.mouseMove;
		
		var mouseMoveHandler= function(mouseEvent) {
			var actor= mouseEvent.source;
			actor.__mouseMove.call(this,mouseEvent);
			// bugbug, subiendo hasta scena
			actor.parent.parent.childrenList[1].setText("Local Coord: ("+
					((mouseEvent.point.x*100)>>0)/100+","+
					((mouseEvent.point.y*100)>>0)/100+")");
			actor.parent.parent.childrenList[2].setText("Screen Coord: ("+
					mouseEvent.screenPoint.x+","+
					mouseEvent.screenPoint.y+")");
			actor.parent.parent.childrenList[3].setText(
					"Parent Pos: ("+((actor.x*100)>>0)/100+","+((actor.y*100)>>0)/100+")" );			
		};
		var mouseMoveHandler2= function(mouseEvent) {
			var actor= mouseEvent.source;
			actor.__mouseMove.call(this,mouseEvent);
			// bugbug, subiendo hasta scena
			actor.parent.parent.parent.childrenList[1].setText("Local Coord: ("+
					((mouseEvent.point.x*100)>>0)/100+","+
					((mouseEvent.point.y*100)>>0)/100+")");
			actor.parent.parent.parent.childrenList[2].setText("Screen Coord: ("+
					mouseEvent.screenPoint.x+","+
					mouseEvent.screenPoint.y+")");
			actor.parent.parent.parent.childrenList[3].setText(
					"Parent Pos: ("+((actor.x*100)>>0)/100+","+((actor.y*100)>>0)/100+")" );			
			
		};
		
		
		p.mouseMove= mouseMoveHandler;
		p0.mouseMove= mouseMoveHandler2;
		p1.mouseMove= mouseMoveHandler2;
	}		

	scene.__mouseMove= scene.mouseMove;
	scene.mouseMove= function(mouseEvent) {
		mouseEvent.source.__mouseMove.call(this,mouseEvent);
		mouseEvent.source.childrenList[1].setText("");
		mouseEvent.source.childrenList[2].setText("");
	};
	
	var gradient= director.crc.createLinearGradient(0,0,0,50);
	gradient.addColorStop(0,'green');
	gradient.addColorStop(0.5,'red');
	gradient.addColorStop(1,'yellow');	
	
	// texts
	var cc1= new CAAT.ActorContainer();
	cc1.setBounds( 380,30, 300, 140 );
	cc1.create();
	scene.addChild(cc1);
	cc1.mouseEnabled= false;

	
	var rb= new CAAT.RotateBehavior();
	rb.cycleBehavior= true;
	rb.setFrameTime( 0, 4000 );
	rb.startAngle= -Math.PI/8;
	rb.endAngle= Math.PI/8;
	rb.setInterpolator( new CAAT.Interpolator().createCubicBezierInterpolator( {x:0,y:0}, {x:1,y:0}, {x:0,y:1}, {x:1,y:1}, true ) );
	rb.anchor= CAAT.Actor.prototype.ANCHOR_TOP;
	cc1.addBehavior(rb);
	
	var text= new CAAT.TextActor();
	text.setFont("30px sans-serif");
	text.setText("Perfect Pixel");
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
	text2.setText("Collision detection");
    text2.calcTextSize(director);
	text2.setLocation((cc1.width-text2.width)/2,30);
	text2.create();
	text2.fillStyle=gradient;
	text2.outline= true;
	cc1.addChild(text2);

	var text3= new CAAT.TextActor();
	text3.setFont("30px sans-serif");
	text3.textAlign="center";
	text3.setText("Drag Enabled");
    text3.calcTextSize(director);
	text3.setLocation((cc1.width-text3.width)/2,60);
	text3.create();
	text3.fillStyle=gradient;
	text3.outline= true;
	cc1.addChild(text3);

	var text4= new CAAT.TextActor();
	text4.setFont("20px sans-serif");
	text4.textAlign="center";
	text4.setText("Drag + [Control,Shift,Alt]");
    text4.calcTextSize(director);
	text4.setLocation((cc1.width-text4.width)/2,100);
	text4.create();
	text4.fillStyle='black';
	cc1.addChild(text4);

	var text5= new CAAT.TextActor();
	text5.setFont("20px sans-serif");
	text5.textAlign="center";
	text5.setText("Double Click");
    text5.calcTextSize(director);
	text5.setLocation((cc1.width-text5.width)/2,120);
	text5.create();
	text5.fillStyle='black';
	cc1.addChild(text5);
	
	
	cc1.mouseEnabled= false;	
	
	return scene;
}