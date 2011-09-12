/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 **/
function __scene2(director) {
	
	var scene= new CAAT.Scene();
	scene.create();
	
	var conpoundimage = new CAAT.SpriteImage().
	        initialize( director.getImage('chapas'), 6, 6);
	var __index=0;
	var padding= 10;
	
	var cw= director.canvas.width-padding*2;
	var ch= director.canvas.height-padding*2;
	
	var cols= (cw/(conpoundimage.singleHeight))>>0;
	var rows= (ch/(conpoundimage.singleWidth))>>0;
	
	var w= cw/cols ;
	var h= ch/rows;
	
	var cc= new CAAT.ActorContainer().
	        setBounds(0,0,director.canvas.width,director.canvas.height);
	scene.addChild(cc);
	
	for( var i=0; i<rows; i++ ) {
		for( var j=0; j<cols; j++ ) {
			
			var actor= new CAAT.Actor().
			        setBounds( j*w + padding, i*h + padding, w, h).
			        setBackgroundImage( conpoundimage.getRef(), true ).
			        setAnimationImageIndex( [ (__index++)%conpoundimage.getNumImages() ] );
			cc.addChild(actor);
			
			var sb= new CAAT.ScaleBehavior().
			        setPingPong().
                    setValues(1,2, 1,2).
                    setInterpolator(
                            //new CAAT.Interpolator().createBounceOutInterpolator(true) );
                            //new CAAT.Interpolator().createElasticOutInterpolator(1.1, .4) );
                            new CAAT.Interpolator().createExponentialInOutInterpolator(3,true) );

			actor.addBehavior(sb);
			
			var rb= new CAAT.RotateBehavior().
                    setValues(0,Math.PI*2);
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
                    actor.parent.setZOrder(Number.MAX_VALUE);
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
                    actor.parent.setZOrder(actor, Number.MAX_VALUE);
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
	
	var cc1= new CAAT.ActorContainer().
	        setBounds( 380,30, 300, 150 ).
            enableEvents(false);
	
	
	var rb1= new CAAT.RotateBehavior().
	        setCycle(true).
	        setFrameTime( 0, 4000 ).
            setValues(-Math.PI/8, Math.PI/8, 50,0).
	        setInterpolator(
                new CAAT.Interpolator().createCubicBezierInterpolator(
                        {x:0,y:0}, {x:1,y:0}, {x:0,y:1}, {x:1,y:1}, true )
            );
	cc1.addBehavior(rb1);
	
	var text= new CAAT.TextActor().
	        setFont("50px sans-serif").
	        setText("One Image.").
            calcTextSize(director).
	        setTextAlign("center").
	        setFillStyle(gradient).
	        setOutline(true).
            cacheAsBitmap();
	cc1.addChild( text.setLocation((cc1.width-text.textWidth)/2,0) );

	var text2= new CAAT.TextActor().
	        setFont("30px sans-serif").
	        setTextAlign("center").
	        setText("Behaviors on").
            calcTextSize(director).
            setFillStyle(gradient).
            setOutline(true).
            cacheAsBitmap();
	cc1.addChild(text2.setLocation((cc1.width-text2.width)/2,50));
	
	var text3= new CAAT.TextActor().
	        setFont("30px sans-serif").
	        setTextAlign("center").
	        setText("MouseMove").
            calcTextSize(director).
            setFillStyle(gradient).
            setOutline(true).
            cacheAsBitmap();
	cc1.addChild(text3.setLocation((cc1.width-text3.textWidth)/2,80));

	var text4= new CAAT.TextActor().
	        setFont("10px sans-serif").
	        setTextAlign("center").
	        setText("and").
            calcTextSize(director).
            setFillStyle('black').
            setOutline(true).
            cacheAsBitmap();
	cc1.addChild(text4.setLocation((cc1.width-text4.textWidth)/2,110));
	
	var text5= new CAAT.TextActor().
	        setFont("30px sans-serif").
	        setTextAlign("center").
	        setText("MouseDblClick").
            calcTextSize(director).
            setFillStyle(gradient).
            setOutline(true).
            cacheAsBitmap();

	cc1.addChild(text5.setLocation((cc1.width-text5.textWidth)/2,120));
	cc1.enableEvents(false);

	scene.addChild(cc1);

	return scene;
}