/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * Scene 9.
 * Shows some image processing actors.
 *
 */

function __scene11(director) {

    var i;
    var scene= new CAAT.Scene();
    scene.create();

    __scene11_text(director,scene);

    var text= new CAAT.TextActor().
            setFont("100px sans-serif").
            setText("Rotate Device").
            create().
            setFillStyle('red').
            setOutline(true).
            calcTextSize(director);
    text.setLocation((director.canvas.width-text.width)/2,
            (director.canvas.height-text.height)/2);
	scene.addChild(text);

    scene.endAnimate= function(director, time) {
        var rx= window.innerWidth/window.innerHeight > 1 ? CAAT.accelerationIncludingGravity.y : CAAT.accelerationIncludingGravity.x;

        var signo= rx<0 ? 1 : -1;
        rx/=10; // 9.8 m/s^2

        text.setRotation( -rx*Math.PI/3.3 );
    };

    return scene;
}

function __scene11_text(director,scene) {
	var gradient= director.crc.createLinearGradient(0,0,0,50);
	gradient.addColorStop(0,'orange');
	gradient.addColorStop(0.5,'yellow');
	gradient.addColorStop(1,'#7f00ff');

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
            setText("Accelerometer").
            create().
            setFillStyle(gradient).
            setOutline(true).
            calcTextSize(director);
    text.setLocation((cc.width-text.width)/2,0);
	cc.addChild(text);

	var text2= new CAAT.TextActor().
	        setFont("50px sans-serif").
            setText("Enabled").
            calcTextSize(director).
            create().
            setFillStyle(gradient).
	        setOutline(true);
    text2.setLocation((cc.width-text2.width)/2,50);
	cc.addChild(text2);

	scene.addChild(cc);
}