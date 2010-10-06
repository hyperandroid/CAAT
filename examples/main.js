/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * Example CAAT library initialization. 
 *
 **/
function setupTRButton(prev) {
	var sb= new CAAT.ScaleBehaviour();
	sb.setPingPong();
	sb.anchor= CAAT.Actor.prototype.ANCHOR_CENTER;
	sb.minScaleX= 1;
	sb.maxScaleX= 1.5;
	sb.minScaleY= 1;
	sb.maxScaleY= 1.5;
	sb.expired= true;
	prev.addBehaviour(sb);
	
	var ab= new CAAT.AlphaBehaviour();
	ab.setPingPong();
	ab.startAlpha=1;
	ab.endAlpha=0.5;
	ab.setCycle(true);
	prev.addBehaviour(ab);
	
	
	prev.mouseExit= function(mouseEvent) {
		var actor= mouseEvent.source;
		if( null==actor ) {
			return;
		}
		var behaviour= actor.behaviourList[0];
		if( null==behaviour ) {
			return;
		}
		
		actor.pointed= false;
		
		actor.behaviourList[0].setExpired(actor,mouseEvent.source.time);
		actor.behaviourList[1].setExpired(actor,mouseEvent.source.time);
	};
	
	prev.mouseEnter= function(mouseEvent) {
		var actor= mouseEvent.source;
		if( null==actor ) {
			return;
		}
		var behaviour= actor.behaviourList[0];
		if( null==behaviour ) {
			return;
		}
		
		actor.pointed= true;
		
		if ( behaviour.expired ) {
			actor.behaviourList[0].setFrameTime( mouseEvent.source.time, 1000 );
			actor.behaviourList[0].setCycle(true);
			actor.behaviourList[1].setFrameTime( mouseEvent.source.time, 1000 );
			actor.behaviourList[1].setCycle(true);
		}
	};
}

function setupTRButtonPaint(prev) {
	prev.fillStyle='#0000ff';
	prev.paint= function(director, time) {
		
		var canvas= director.crc;
		
		if ( null!=this.parent && null!=this.fillStyle ) {
			canvas.beginPath();
			canvas.fillStyle= this.pointed ? 'orange' : (this.fillStyle!=null ? this.fillStyle : 'white'); //'white';
			canvas.arc(10,10,10,0,Math.PI*2,false );
			canvas.fill();
		}

		if ( this.clip ) {
			canvas.beginPath();
			canvas.rect(0,0,this.width,this.height);
			canvas.clip();
		}
			
		canvas.strokeStyle= this.pointed ? 'green' : '#ffff00';
		canvas.beginPath();
//			canvas.save();

		canvas.moveTo(3,10);
		canvas.lineTo(17,10);
		canvas.lineTo(13,5);
		
		canvas.moveTo(17,10);
		canvas.lineTo(13,15);
		
		canvas.lineWidth=2;
		canvas.lineJoin='round';
		canvas.lineCap='round';

		canvas.stroke();
//			canvas.restore();
	};			
}

function setupTRButtonPaintIndex(prev, index) {
	
	prev.paint= function(director, time) {
		
		var canvas= director.crc;
		
		if ( null!=this.parent && null!=this.fillStyle ) {
			canvas.beginPath();
			canvas.fillStyle= this.pointed ? 'orange' : (this.fillStyle!=null ? this.fillStyle : 'white'); //'white';
			canvas.arc(10,10,10,0,Math.PI*2,false );
			canvas.fill();
		}

		if ( this.clip ) {
			canvas.beginPath();
			canvas.rect(0,0,this.width,this.height);
			canvas.clip();
		}
			
		canvas.fillStyle= '#ffff00';
		canvas.textBaseline='top';
		canvas.font= "18px sans-serif";
		var str= ""+(this.__sceneIndex+1);
		var w= canvas.measureText(str).width;
		canvas.fillText( str, (this.width-w)/2, 0 );

	};			
}

function __init(images) {

	var director = new CAAT.Director();
    director.initialize(680,500);
	director.addScene( __scene1(director,images) );
	director.addScene( __scene2(director,images) );
	director.addScene( __scene3(director,images) );
	director.addScene( __scene4(director,images) );
	director.addScene( __scene5(director,images) );
	director.addScene( __scene6(director,images) );
    director.addScene( __scene7(director,images) );

	director.easeIn(
            0,
            CAAT.Scene.prototype.EASE_SCALE,
            2000,
            false,
            CAAT.Actor.prototype.ANCHOR_CENTER,
            new CAAT.Interpolator().createElasticOutInterpolator(2.5, .4) );

	var buttonW= 22.5;
	var buttonX= (director.width - buttonW*director.getNumScenes())/2;
	for( var i=0; i<director.getNumScenes(); i++ ) {

		if ( i!=0 ) {
			var prev= new CAAT.Actor();
			prev.create();
			prev.setBounds(5,470,20,20);
			prev.setRotation( Math.PI );
			prev.fillStyle='#0000ff';
			
			prev.mouseClick = function(mouseEvent) {
				director.switchToPrevScene(1000,false,true);
			};
			director.scenes[i].addChild(prev);
			
			setupTRButton(prev);
			setupTRButtonPaint(prev);
		}
		if ( i!=director.getNumScenes()-1 ) {
			var next= new CAAT.Actor();
			next.create();
			next.setBounds(director.width-20-5,470,20,20);
			next.fillStyle='#0000ff';
			next.mouseClick = function(mouseEvent) {
				director.switchToNextScene(1000,false,true);
			};
			director.scenes[i].addChild(next);
			
			setupTRButton(next);
			setupTRButtonPaint(next);
		}
		
		for( var j=0; j<director.getNumScenes(); j++ ) {
			var idx= new CAAT.Actor();
			idx.__sceneIndex=j;
			idx.create();
			idx.setBounds(buttonX+j*buttonW,470,20,20);
			if ( j!=i ) {
				idx.mouseClick = function(mouseEvent) {
					director.switchToScene(mouseEvent.source.__sceneIndex,1000,false,true);
				};
				setupTRButton(idx);
				idx.fillStyle='#0000ff';
			} else {
				idx.mouseEnabled= false;
				idx.fillStyle= '#c07f00';
			}
			director.scenes[i].addChild(idx);
			
			setupTRButtonPaintIndex(idx, j+1);
					
		}
	}
	
	setInterval(
            function loop() {
	            CAAT.director.render( new Date().getTime() - CAAT.time );
            },
            30);

}

window.addEventListener('load', function() {
    // FIX: show loading callback info.
	var il = new CAAT.ImagePreloader().loadImages(
            [
                'res/img/anim1.png',
                'res/img/chapas.jpg',
                    
                'res/img/burbu1.png',
                'res/img/burbu2.png',
                'res/img/burbu3.png',
                'res/img/burbu4.png'
            ],
            __init
            );
}, false);
