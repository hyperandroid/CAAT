function __CAAT_tut2_init() {

    var director = new CAAT.Director().initialize(100,300);
    var scene=     new CAAT.Scene().create();

    var circle_1=  new CAAT.ShapeActor().create().setLocation(10,10).setSize(60,60).setFillStyle('#ff0000').setStrokeStyle('#000000');
    var circle_2=  new CAAT.ShapeActor().create().setLocation(10,80).setSize(60,60).setFillStyle('#ff0000').setStrokeStyle('#000000');
    var circle_3=  new CAAT.ShapeActor().create().initialize( {
        x:              10,
        y:              150,
        width:          60,
        height:         60,
        fillStyle:      '#ff0000',
        strokeStyle:    '#000000'} );


    scene.addChild(circle_1);
    scene.addChild(circle_2);
    scene.addChild(circle_3);

    director.addScene(scene);

    var alpha_1= new CAAT.AlphaBehaviour();
    alpha_1.startAlpha= 0;
    alpha_1.endAlpha= .5;
    alpha_1.setFrameTime( 2000, 5000 );
        circle_1.addBehaviour(alpha_1);

    var alpha_2= new CAAT.AlphaBehaviour();
    alpha_2.startAlpha= 0;
    alpha_2.endAlpha= 1;
    alpha_2.setCycle(true);
    alpha_2.setFrameTime( 2000, 5000 );
        circle_2.addBehaviour(alpha_2);

    var alpha_3= new CAAT.AlphaBehaviour();
    alpha_3.startAlpha= 0;
    alpha_3.setPingPong();
    alpha_3.endAlpha= 1;
    alpha_3.setCycle(true);
    alpha_3.setFrameTime( 2000, 5000 );
        circle_3.addBehaviour(alpha_3);


    var canvasContainer= document.createElement('div');
    canvasContainer.appendChild( director.canvas );
    document.body.appendChild(canvasContainer);

    director.loop(10);
}

window.addEventListener('load', __CAAT_tut2_init, false);
