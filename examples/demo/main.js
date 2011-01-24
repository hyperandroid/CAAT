/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * Example CAAT library initialization. This file should not be used as the official startup code.
 * This file is used to add a navigator for each scene, and to build a concrete loading resources
 * scheme.
 *
 * 20101010 Hyperandroid
 *  + Refactored images loading.
 *  + Added Image loading feedback
 *
 **/
function setupTRButton(prev) {
	var sb= new CAAT.ScaleBehavior();
	sb.setPingPong();
	sb.anchor= CAAT.Actor.prototype.ANCHOR_CENTER;
	sb.startScaleX= 1;
	sb.endScaleX= 1.5;
	sb.startScaleY= 1;
	sb.endScaleY= 1.5;
	sb.expired= true;
	prev.addBehavior(sb);
	
	var ab= new CAAT.AlphaBehavior();
	ab.setPingPong();
	ab.startAlpha=1;
	ab.endAlpha=0.5;
	ab.setCycle(true);
	prev.addBehavior(ab);
	
	
	prev.mouseExit= function(mouseEvent) {
		var actor= mouseEvent.source;
		if( null==actor ) {
			return;
		}
		var behaviour= actor.behaviorList[0];
		if( null==behaviour ) {
			return;
		}
		
		actor.pointed= false;
		
		actor.behaviorList[0].setExpired(actor,mouseEvent.source.time);
		actor.behaviorList[1].setExpired(actor,mouseEvent.source.time);
	};
	
	prev.mouseEnter= function(mouseEvent) {
		var actor= mouseEvent.source;
		if( null==actor ) {
			return;
		}
		var behaviour= actor.behaviorList[0];
		if( null==behaviour ) {
			return;
		}
		
		actor.pointed= true;
		
		if ( behaviour.expired ) {
			actor.behaviorList[0].setFrameTime( mouseEvent.source.time, 1000 );
			actor.behaviorList[0].setCycle(true);
			actor.behaviorList[1].setFrameTime( mouseEvent.source.time, 1000 );
			actor.behaviorList[1].setCycle(true);
		}
	};
}

function setupTRButtonPaint(prev) {
	prev.fillStyle='#0000ff';
	prev.paint= function(director, time) {
		
		var canvas= director.crc;
		
		if ( null!=prev.parent && null!=prev.fillStyle ) {
			canvas.beginPath();
			canvas.fillStyle= prev.pointed ? 'orange' : (prev.fillStyle!=null ? prev.fillStyle : 'white'); //'white';
			canvas.arc(10,10,10,0,Math.PI*2,false );
			canvas.fill();
		}

		if ( prev.clip ) {
			canvas.beginPath();
			canvas.rect(0,0,prev.width,prev.height);
			canvas.clip();
		}
			
		canvas.strokeStyle= prev.pointed ? 'green' : '#ffff00';
		canvas.beginPath();

		canvas.moveTo(3,10);
		canvas.lineTo(17,10);
		canvas.lineTo(13,5);
		
		canvas.moveTo(17,10);
		canvas.lineTo(13,15);
		
		canvas.lineWidth=2;
		canvas.lineJoin='round';
		canvas.lineCap='round';

		canvas.stroke();
	};
}

function setupTRButtonPaintIndex(prev, index) {
	
	prev.paint= function(director, time) {
		
		var canvas= director.crc;
		
		if ( null!=prev.parent && null!=prev.fillStyle ) {
			canvas.beginPath();
			canvas.fillStyle= prev.pointed ? 'orange' : (prev.fillStyle!=null ? prev.fillStyle : 'white'); //'white';
			canvas.arc(10,10,10,0,Math.PI*2,false );
			canvas.fill();
		}

		if ( prev.clip ) {
			canvas.beginPath();
			canvas.rect(0,0,prev.width,prev.height);
			canvas.clip();
		}
			
		canvas.fillStyle= '#ffff00';
		canvas.textBaseline='top';
		canvas.font= "18px sans-serif";
		var str= ""+(prev.__sceneIndex+1);
		var w= canvas.measureText(str).width;
		canvas.fillText( str, (this.width-w)/2, 0 );

	};			
}

/**
 * This method will be called when the user presses the start button.
 * @param director
 */
function __CAAT_director_initialize(director) {

    director.emptyScenes();

	director.addScene(  __scene1(director) );
	director.addScene(  __scene2(director) );
	director.addScene(  __scene3(director) );
	director.addScene(  __scene4(director) );
	director.addScene(  __scene5(director) );
	director.addScene(  __scene6(director) );
    director.addScene(  __scene7(director) );
    director.addScene(  __scene8(director) );
    director.addScene(  __scene9(director) );
    __scene10(director);
    director.addScene(  __scene11(director) );

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
	

}

/**
 * Sample loading scene.
 * @param director
 */
function __CAAT__loadingScene(director) {

	var scene= new CAAT.Scene();
	scene.create();

    var root= new CAAT.ActorContainer();
    root.create();
    root.setBounds(0,0,director.canvas.width,director.canvas.height);
    scene.addChild( root );

    root.fillStyle='#000000';
    root.mouseEnter= function(mouseEvent) {}
    root.mouseExit= function(mouseEvent) {}

    var textLoading= new CAAT.TextActor();
    textLoading.setFont("20px sans-serif");
    textLoading.textAlign="center";
    textLoading.textBaseline="top";
    textLoading.setText("  Loading  ");
    textLoading.calcTextSize(director);
    textLoading.setSize( textLoading.textWidth, textLoading.textHeight );
    textLoading.create();
    textLoading.fillStyle='white';
    root.addChild(textLoading);
    textLoading.setLocation(
            (director.canvas.width-textLoading.width)/2,
            (director.canvas.height-textLoading.height)/2);

    scene.loading= textLoading;

    var rb= new CAAT.RotateBehavior();
    rb.cycleBehavior= true;
    rb.setFrameTime( 0, 5000 );
    rb.startAngle= -Math.PI/4;
    rb.endAngle= Math.PI/4;
    rb.setInterpolator( new CAAT.Interpolator().createCubicBezierInterpolator( {x:0,y:0}, {x:1,y:0}, {x:0,y:1}, {x:1,y:1}, true ) );
    rb.anchor= CAAT.Actor.prototype.ANCHOR_TOP;
    textLoading.addBehavior(rb);

    root.mouseMove= function(mouseEvent) {

        var burbuja= new CAAT.ShapeActor();
        burbuja.setLocation( mouseEvent.point.x, mouseEvent.point.y );
        burbuja.create();
        burbuja.mouseEnabled= false;
        burbuja.compositeOp='lighter';
        var r= 1+10*Math.random();
        burbuja.setSize( 5+r, 5+r );

        var r= 192 + (64*Math.random())>>0;
        var g= (64*Math.random())>>0;
        var b= (64*Math.random())>>0;
        var a= 255;

        burbuja.fillStyle="rgba("+r+","+g+","+b+","+a+")";

        root.addChild(burbuja);

        var cb= new CAAT.ContainerBehavior();

        cb.setFrameTime( scene.time+2000+1000*Math.random(), 500 );
		cb.addListener(
            {
                behaviorExpired : function(behaviour, time, actor) {
                    actor.discardable= true;
                    actor.setExpired(true);
                }
            });

            var ab= new CAAT.AlphaBehavior();
            ab.setFrameTime( 0, 500 );
            ab.startAlpha= 1;
            ab.endAlpha= 0;
            cb.addBehavior(ab);

            var tb= new CAAT.PathBehavior();
            tb.setFrameTime( 0, 500 );
            tb.setPath(
                    new CAAT.Path().setLinear(
                            burbuja.x, burbuja.y,
                            burbuja.x, burbuja.y-100-100*Math.random() ) );
            cb.addBehavior(tb);

        burbuja.addBehavior( cb );

    }

    /**
     * This method will be called after imagePreloader after loading each image resource.
     */
    scene.loadedImage= function(index,size) {
        textLoading.setText( 'Loading '+index+'/'+size );
    }

    /**
     * This method will be called after imagePreloader ends loading resources.
     */
    scene.finishedLoading= function() {
        this.loading.setText('Start');
        this.loading.emptyBehaviorList();

        var sb= new CAAT.ScaleBehavior();
        sb.setPingPong();
        sb.anchor= CAAT.Actor.prototype.ANCHOR_CENTER;
        sb.startScaleX= 1;
        sb.endScaleX= 4;
        sb.startScaleY= 1;
        sb.endScaleY= 4;
        sb.setCycle(true);
        sb.setFrameTime( scene.time, 1000 );

        this.loading.addBehavior(sb);

        // after changing the from 'loading' to 'start', set mouseclick function to initialize demo.
//        this.loading.mouseClick= function(event) {
            __CAAT_director_initialize(director);
//        }
    };

	return scene;
}

/**
 * Entry point from document loading.
 * @param images
 */
function __CAAT_init() {

    var canvascontainer= document.createElement('div');
	var director = new CAAT.Director().initialize(680,500);
    canvascontainer.appendChild( director.canvas );
    document.body.appendChild(canvascontainer);

    var scene_loading= __CAAT__loadingScene(director);
    director.addScene( scene_loading );
    director.setScene(0);

	new CAAT.ImagePreloader().loadImages(
        [
            {id:'fish',     url:'res/img/anim1.png'},
            {id:'fish2',    url:'res/img/anim2.png'},
            {id:'fish3',    url:'res/img/anim3.png'},
            {id:'fish4',    url:'res/img/anim4.png'},
            {id:'chapas',   url:'res/img/chapas.jpg'},
            {id:'buble1',   url:'res/img/burbu1.png'},
            {id:'buble2',   url:'res/img/burbu2.png'},
            {id:'buble3',   url:'res/img/burbu3.png'},
            {id:'buble4',   url:'res/img/burbu4.png'},
            {id:'plants',   url:'res/img/plants.jpg'},
            {id:'bump',     url:'res/img/3.jpg'}
        ],

        function( counter, images ) {
            scene_loading.loadedImage(counter, images.length);
            if ( counter==images.length ) {
                director.imagesCache= images;
                scene_loading.finishedLoading();
            }
        }
    );

    director.loop(60);
}

window.addEventListener('load', __CAAT_init, false);

