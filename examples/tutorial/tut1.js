function __CAAT_tut1_init() {

    var director = new CAAT.Director().initialize(100,100);
    var scene=     new CAAT.Scene().create();
    var circle=    new CAAT.ShapeActor().create().setLocation(20,20).setSize(60,60).setFillStyle('#ff0000').setStrokeStyle('#000000');

    scene.addChild(circle);
    director.addScene(scene);

    var canvasContainer= document.createElement('div');
    canvasContainer.appendChild( director.canvas );
    document.body.appendChild(canvasContainer);

    director.loop(1);
}

window.addEventListener('load', __CAAT_tut1_init, false);

