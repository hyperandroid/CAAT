/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 **/
function __scene7(director) {

	var scene= new CAAT.Scene();
	scene.create();

    var root= new CAAT.ActorContainer();
    root.create();
    root.setBounds(0,0,director.canvas.width,director.canvas.height);
    scene.addChild( root );
    

    conpoundimagefish = [];
    conpoundimagefish.push( new CAAT.CompoundImage().initialize( director.getImage('fish'),  1, 3) );
    conpoundimagefish.push( new CAAT.CompoundImage().initialize( director.getImage('fish2'), 1, 3) );
    conpoundimagefish.push( new CAAT.CompoundImage().initialize( director.getImage('fish3'), 1, 3) );
    conpoundimagefish.push( new CAAT.CompoundImage().initialize( director.getImage('fish4'), 1, 3) );

    for( var j=0; j<20; j++ ) {
        var fish = new CAAT.SpriteActor();
        fish.create();
        fish.setAnimationImageIndex( [0,1,2,1] );
        fish.changeFPS= 300;
        fish.setSpriteImage(conpoundimagefish[j%4]);
        fish.mouseEnabled= false;
        scene.addChild(fish);

        var pbfish= new CAAT.PathBehavior();
        pbfish.autoRotate= true;
        pbfish.setPath( new CAAT.Path().setLinear(
                Math.random()*director.width,
                Math.random()*director.height,
                Math.random()*director.width,
                Math.random()*director.height) );
        pbfish.setInterpolator( new CAAT.Interpolator().createExponentialInOutInterpolator(2,false) );
        pbfish.setFrameTime( 0, 2500+2500*Math.random() );

        pbfish.addListener( {
            behaviorExpired : function(behaviour,time) {
                var endCoord= behaviour.path.endCurvePosition();
                behaviour.setPath(
                        new CAAT.Path().setCubic(
                            endCoord.x,
                            endCoord.y,
                            Math.random()*director.width,
                            Math.random()*director.height,
                            Math.random()*director.width,
                            Math.random()*director.height,
                            Math.random()*director.width,
                            Math.random()*director.height) );
                behaviour.setFrameTime( scene.time, 3000+Math.random()*3000 );
            }
        });

        fish.addBehavior( pbfish );
    }

    root.paint= function( director, time ) {
        director.crc.drawImage( director.getImage('plants'), 0, 0, this.width, this.height );
    }
    root.mouseEnter= function(mouseEvent) {}
    root.mouseExit= function(mouseEvent) {}

    var children= new CAAT.TextActor();
    children.setFont("20px sans-serif");
    children.textAlign="left";
    children.textBaseline="top";
    children.setText("");
    children.setLocation(15,20);
    children.create();
    children.fillStyle='white';
    children.outlineColor= 'red';
    children.ouline= true;
    scene.addChild(children);

    scene.__animate= scene.animate;
    scene.animate =function(director,time) {
        children.setText( "Bubles: "+root.childList.length );
        this.__animate(director,time);
    }

    root.mouseMove= function(mouseEvent) {

        var imgIndex= ((Math.random()*3.99) >> 0)+1;

        var conpoundimage = new CAAT.CompoundImage();
        conpoundimage.initialize( director.getImage('buble'+imgIndex) ,1,1);

        var burbuja= new CAAT.SpriteActor();
        burbuja.setAnimationImageIndex( [0] );
        burbuja.setSpriteImage( conpoundimage );
        burbuja.setLocation( mouseEvent.point.x, mouseEvent.point.y );
        burbuja.create();
        burbuja.mouseEnabled= false;

        root.addChild(burbuja);

        var cb= new CAAT.ContainerBehavior();
        cb.actor= burbuja;

        cb.setFrameTime( scene.time+2000+1000*Math.random(), 500 );
		cb.addListener(
            {
                behaviorExpired : function(behaviour, time) {
                    behaviour.actor.discardable= true;
                    behaviour.actor.setExpired(true);
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


	return scene;
}
