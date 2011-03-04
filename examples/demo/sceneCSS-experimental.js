/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * Scene 11-experimental.
 * Shows some css actors.
 *
 */

function __scene12(director) {

    var i, j;
    var scene= new CAAT.Scene();
    scene.create();

    for( j=0; j<2; j++ ) {

        var ww= 400;
        var hh= 600;

        var container= new CAAT.CSSActor().
                create().
                setBounds( j*ww, 0, ww, hh )/*.
                addBehavior(
                    new CAAT.RotateBehavior().
                            setFrameTime(0,10000).
                            setCycle(true).
                            setValues(0,Math.PI*2)
                ).
                addBehavior(
                    new CAAT.ScaleBehavior().
                            setFrameTime(0,5000).
                            setCycle(true).
                            setPingPong().
                            setValues(.5,1, .5,1)
                )*/;
        
        scene.addChild(container);

        for( i=0; i<49; i++ ) {
            var x,y;
            x= (i%7)*(container.width/5);
            y= ((i/7)>>0)*(container.height/5);
            var css= new CAAT.CSSActor().
                    create().
                    setBounds( x, y, 50, 26 ).
                    setBackground('res/img/anim1.png').
                    addBehavior(
                        new CAAT.RotateBehavior().
                                setFrameTime(0,2000).
                                setCycle(true).
                                setValues(0,Math.PI*2)
                    ).
                    addBehavior(
                        new CAAT.PathBehavior().
                            setAutoRotate(true).
                            setPath(
                                new CAAT.Path().setCubic(
                                    x,
                                    y,
                                    Math.random()*ww,
                                    Math.random()*hh,
                                    Math.random()*ww,
                                    Math.random()*hh,
                                    Math.random()*ww,
                                    Math.random()*hh) ).
                            setFrameTime( scene.time, 3000+Math.random()*3000 ).
                            addListener( {
                                behaviorExpired : function(behaviour,time) {
                                    var endCoord= behaviour.path.endCurvePosition();
                                    behaviour.setPath(
                                            new CAAT.Path().setCubic(
                                                endCoord.x,
                                                endCoord.y,
                                                Math.random()*ww,
                                                Math.random()*hh,
                                                Math.random()*ww,
                                                Math.random()*hh,
                                                Math.random()*ww,
                                                Math.random()*hh) );
                                    behaviour.setFrameTime( scene.time, 3000+Math.random()*3000 )
                                }
                            })
                    );
            container.addChild(css);
        }
    }

    __scene12_text(director,scene);

    return scene;
}

function __scene12_text(director,scene) {

	var cc= new CAAT.CSSActor().
            create().
            setBounds( 450,30, 150, 100 ).
            enableEvents(false).
            addBehavior(
                new CAAT.RotateBehavior().
                        setCycle(true).
                        setFrameTime( 0, 4000 ).
                        setValues( -Math.PI/8, Math.PI/8 ).
                        setInterpolator(
                            new CAAT.Interpolator().createExponentialInOutInterpolator(3,true)
                        ).
                        setAnchor( CAAT.Actor.prototype.ANCHOR_BOTTOM )
            );
	scene.addChild(cc);

	var text= new CAAT.CSSActor().
            create().
            setInnerHTML('<b>Just CSS').
            setSize(80,40);
    text.setLocation( (cc.width-80)/2, 0 );
	cc.addChild(text);

	var text2= new CAAT.CSSActor().
            create().
            setInnerHTML('<b>Actors').
            setSize(80,40);
    text2.setLocation( (cc.width-80)/2, 40 );
	cc.addChild(text2);

	scene.addChild(cc);
}