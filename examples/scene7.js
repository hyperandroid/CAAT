/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 **/
function __scene7(director, images) {

	var scene= new CAAT.Scene();
	scene.create();

    var root= new CAAT.ActorContainer();
    root.create();
    root.setBounds(0,0,director.canvas.width,director.canvas.height);
    scene.addChild( root );
    

    conpoundimagefish = new CAAT.ConpoundBitmap();
    conpoundimagefish.initialize(images[0], 1, 3);

    for( var j=0; j<20; j++ ) {
        var fish = new CAAT.SpriteActor();
        fish.create();
        fish.setAnimationImageIndex( [0,1,2,1] );
        fish.changeFPS= 300;
        fish.setSpriteImage(conpoundimagefish);
        fish.mouseEnabled= false;
        scene.addChild(fish);

        var pbfish= new CAAT.PathBehaviour();
        pbfish.autoRotate= true;
        pbfish.setPath( new CAAT.Path().setLinear(
                Math.random()*director.width,
                Math.random()*director.height,
                Math.random()*director.width,
                Math.random()*director.height) );
        pbfish.setInterpolator( new CAAT.Interpolator().createExponentialInOutInterpolator(2,false) );
        pbfish.setFrameTime( 0, 2500+2500*Math.random() );
        pbfish.addListener( {
            behaviourExpired : function(behaviour,time) {
                var endCoord= behaviour.path.endCurvePosition();
                behaviour.setPath( new CAAT.Path().setLinear(
                    endCoord.x,
                    endCoord.y,
                    Math.random()*director.width,
                    Math.random()*director.height) );
                behaviour.setFrameTime( scene.time, 1000+Math.random()*5000 );
            }
        });

        fish.addBehaviour( pbfish );
    }


    root.fillStyle='#3f3fff';
    root.mouseEnter= function(mouseEvent) {}
    root.mouseExit= function(mouseEvent) {}

    var children= new CAAT.TextActor();
    children.font="20px sans-serif";
    children.textAlign="left";
    children.textBaseline="top";
    children.setText("");
    children.setLocation(15,20);
    children.create();
    children.fillStyle='black';
    children.outlineColor= 'white';
    children.ouline= true;
    scene.addChild(children);

    scene.__animate= scene.animate;
    scene.animate =function(director,time) {
        children.setText( "Bubles: "+root.childList.length );
        this.__animate(director,time);
    }

    root.mouseMove= function(mouseEvent) {

        var img= images[2 + (Math.random()*3.99) >> 0];

        var conpoundimage = new CAAT.ConpoundBitmap();
        conpoundimage.initialize(img,1,1);

        var burbuja= new CAAT.SpriteActor();
        burbuja.setAnimationImageIndex( [0] );
        burbuja.setSpriteImage( conpoundimage );
        burbuja.setLocation( mouseEvent.point.x, mouseEvent.point.y );
        burbuja.create();
        burbuja.mouseEnabled= false;
/*
        var burbuja= new CAAT.ShapeActor();
        burbuja.create();
        var s= 3+20*Math.random();
        burbuja.setBounds( mouseEvent.point.x, mouseEvent.point.y, s ,s );
        burbuja.compositeOp= 'lighter';
        burbuja.fillStyle= '#003f7f';
        burbuja.mouseEnabled= false;
*/
        root.addChild(burbuja);

        var cb= new CAAT.ContainerBehaviour();
        cb.actor= burbuja;

        cb.setFrameTime( scene.time+2000+1000*Math.random(), 500 );
		cb.addListener(
            {
                behaviourExpired : function(behaviour, time) {
                    behaviour.actor.discardable= true;
                    behaviour.actor.setExpired(true);
                }
            });

            var ab= new CAAT.AlphaBehaviour();
            ab.setFrameTime( 0, 500 );
            ab.startAlpha= 1;
            ab.endAlpha= 0;
            cb.addBehaviour(ab);

            var tb= new CAAT.PathBehaviour();
            tb.setFrameTime( 0, 500 );
            tb.setPath( new CAAT.Path().setLinear( burbuja.x, burbuja.y, burbuja.x, burbuja.y-100-100*Math.random() ) );
            cb.addBehaviour(tb);
        
        burbuja.addBehaviour( cb );

    }


	return scene;
}
