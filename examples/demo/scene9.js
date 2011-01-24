/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * Scene 9.
 * Shows some image processing actors.
 * Heavy processor intensive.
 *
 */

function __scene9(director) {

    var i;
    var scene= new CAAT.Scene();
    scene.create();

    __scene9_text(director,scene);

    var ip0= new CAAT.IMActor().
            create().
            setBounds(100,100,100,100).
            setImageProcessor(
                new CAAT.IMPlasma().
                    initialize( 100,100, [0xffff0000, 0xffff7f00, 0xff7f00ff, 0xff0000ff ])
            );
    scene.addChild(ip0);

    var ip1= new CAAT.IMActor().
            create().
            setBounds(100,200,100,100).
            setImageProcessor(
                new CAAT.IMPlasma().
                    initialize( 100,100, [0xff00ff00, 0xff00ffff, 0xffffff00, 0xff000000, 0xffffffff ])
            );
    scene.addChild(ip1);

    var ip2= new CAAT.IMActor().
            create().
            setBounds(100,300,100,100).
            setImageProcessor(
                new CAAT.IMPlasma().
                    initialize( 100,100, [ 0xffff0000, 0xff00ff00, 0xff0000ff, 0xffffff ])
            );
    scene.addChild(ip2);

    var ip3= new CAAT.IMActor().
            create().
            setBounds( 250,150, 128, 128 ).
            setImageProcessor(
                new CAAT.IMBump().
                        initialize( director.getImage('bump'), 48 )
            );
    ip3.mouseMove= function(mouseEvent) {
        ip3.imageProcessor.lightPosition[0].x= mouseEvent.point.x;
        ip3.imageProcessor.lightPosition[0].y= mouseEvent.point.y;
    };

    var timer= __scene9_createtimer(scene, ip3);

    ip3.mouseEnter= function(mouseEvent) {
        timer.cancel();
    }
    ip3.mouseExit= function(mouseEvent) {
        timer= __scene9_createtimer(scene, ip3);
    }

    scene.addChild(ip3);

    return scene;
}

function __scene9_createtimer(scene,ip3) {
    return scene.createTimer(scene.time,Number.MAX_VALUE,
            null,
            function(time,ttime,timertask) {

                var r= ip3.imageProcessor.width-10;
                r/=2;

                ip3.imageProcessor.lightPosition[0].x= ip3.imageProcessor.width/2 + r*Math.cos(ttime*.001);
                ip3.imageProcessor.lightPosition[0].y= ip3.imageProcessor.height/2 - r*Math.sin(ttime*.001);

            },
            null);
}

function __scene9_text(director,scene) {
	var gradient= director.crc.createLinearGradient(0,0,0,50);
	gradient.addColorStop(0,'orange');
	gradient.addColorStop(0.5,'red');
	gradient.addColorStop(1,'#3f00ff');

	var cc= new CAAT.ActorContainer().
            setBounds( 450,30, 150, 100 ).
	        create().
            enableEvents(false).
            addBehavior(
                new CAAT.RotateBehavior().
                        setCycle(true).
                        setFrameTime( 0, 4000 ).
                        setValues( -Math.PI/8, Math.PI/8 ).
                        setInterpolator(
                            new CAAT.Interpolator().createExponentialInOutInterpolator(3,true)
                        ).
                        setAnchor( CAAT.Actor.prototype.ANCHOR_TOP )
            );
	scene.addChild(cc);

	var text= new CAAT.TextActor().
            setFont("50px sans-serif").
            setText("Image").
            create().
            setFillStyle(gradient).
            setOutline(true).
            calcTextSize(director);
    text.setLocation((cc.width-text.width)/2,0);
	cc.addChild(text);

	var text2= new CAAT.TextActor().
	        setFont("50px sans-serif").
            setText("Processing").
            calcTextSize(director).
            create().
            setFillStyle(gradient).
	        setOutline(true);
    text2.setLocation((cc.width-text2.width)/2,50);
	cc.addChild(text2);

	scene.addChild(cc);
}