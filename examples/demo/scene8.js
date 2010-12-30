/**
 * Created by IntelliJ IDEA.
 * User: ibon
 * Date: 29-dic-2010
 * Time: 23:21:24
 * To change this template use File | Settings | File Templates.
 */

function __createShape(w,h) {
    return new CAAT.ShapeActor().create().setShape( CAAT.ShapeActor.prototype.SHAPE_CIRCLE ).setSize(w,h);
}

function __addPlanet(parent, rotationTime, pos, radius, color, startAngle ) {
    var planet= __createShape(radius,radius);

    var x= pos*Math.cos(startAngle);
    var y= pos*Math.sin(startAngle);

    planet.setFillStyle( color ).
            setLocation( x+parent.width/2, y+parent.height/2 ).
            addBehavior(
                new CAAT.RotateBehavior().
                    setFrameTime( 0, rotationTime ).
                    setValues( 0,2*Math.PI).
                    setCycle( true ).
                    setAnchor( CAAT.Actor.prototype.ANCHOR_CUSTOM, -x, -y )
            );

    parent.addChild(planet);

    return planet;
}

function __scene8(director) {

    var i;
    var scene= new CAAT.Scene();
    scene.create();

    var sun= __createShape( 50, 50 ).
            setFillStyle( 'red' ).
            setLocation( director.width/2, director.height/2 );

    var earth= __addPlanet( sun, 4000, 90, 15, 'blue', 0 );
        __addPlanet( earth, 4000, 15, 5, 'green', Math.PI/3 );
        __addPlanet( earth, 5000, 22, 5, 'rgb(32,255,192)', 0 );

    var mercury= __addPlanet( sun, 6000, 40, 10, 'rgb(255,64,128)', Math.PI/3 );
    var saturn=  __addPlanet( sun, 15000, 200, 30, 'rgb(255,64,128)', 0 );

        var io=     __addPlanet( saturn, 5000+5000*Math.random(), 20,  8, 'rgb(32,255,192)', 0 );
        var europe= __addPlanet( saturn, 5000+5000*Math.random(), 30,  5, 'rgb(255,32,192)', Math.PI*2/3 );
        var moon=   __addPlanet( saturn, 5000+5000*Math.random(), 70, 10, 'rgb(32,192,255)', 2*Math.PI*2/3 );

            __addPlanet( moon, 9000+4000*Math.random(), 15, 4, 'rgb(0,  0,255)', Math.random()*2*Math.PI );
            __addPlanet( moon, 6000+4000*Math.random(), 12, 4, 'rgb(0,255,255)', Math.random()*2*Math.PI );

    scene.addChild(sun);

    return scene;
}