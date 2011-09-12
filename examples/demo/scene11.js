/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * Scene 11.
 * Shows some accelerometer based demo.
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
	scene.addChild(text.
            cacheAsBitmap().
            setLocation(
                (director.canvas.width-text.width)/2,
                (director.canvas.height-text.height)/2) );

    var alpha= new CAAT.TextActor().
            setFont("15px sans-serif").
            setText("Alpha: ").
            create().
            setLocation(10,80);
    var beta= new CAAT.TextActor().
            setFont("15px sans-serif").
            setText("Beta: ").
            create().
            setLocation(10,100);
    var gamma= new CAAT.TextActor().
            setFont("15px sans-serif").
            setText("Gamma: ").
            create().
            setLocation(10,120);
    scene.addChild(alpha);
    scene.addChild(beta);
    scene.addChild(gamma);


    scene.onRenderEnd= function(director, time) {
        var rx= CAAT.rotationRate.gamma;

        //rx/=10; // 9.8 m/s^2

        text.setRotation( -rx*Math.PI/180 );

        alpha.setText('Alpha: '+CAAT.rotationRate.alpha);
        beta.setText( 'Beta:  '+CAAT.rotationRate.beta);
        gamma.setText('Gamma: '+CAAT.rotationRate.gamma);
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
                        setValues( -Math.PI/8, Math.PI/8, 50, 0 ).
                        setInterpolator(
                            new CAAT.Interpolator().createExponentialInOutInterpolator(3,true)
                        )
            );
	scene.addChild(cc);

	var text= new CAAT.TextActor().
            setFont("50px sans-serif").
            setText("Accelerometer").
            setFillStyle(gradient).
            setOutline(true).
            calcTextSize(director);
	cc.addChild(text.cacheAsBitmap().setLocation((cc.width-text.textWidth)/2,0));


	var text2= new CAAT.TextActor().
	        setFont("50px sans-serif").
            setText("Enabled").
            calcTextSize(director).
            setFillStyle(gradient).
	        setOutline(true);
	cc.addChild(text2.cacheAsBitmap().setLocation((cc.width-text2.textWidth)/2,50));

}