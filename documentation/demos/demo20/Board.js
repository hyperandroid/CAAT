CAAT.Module({

    defines : "CAAT.FC.Board",
    depends : [
        "CAAT.Foundation.Actor",
        "CAAT.Foundation.ActorContainer",
        "CAAT.Foundation.UI.PathActor",
        "CAAT.Behavior.PathBehavior",
        "CAAT.PathUtil.Path",
        "CAAT.Math.Point",

        "CAAT.FC.Ship"
    ],
    extendsClass : "CAAT.Foundation.ActorContainer",
    extendsWith : {

        points          : null,
        inPlane         : false,
        currentPlane    : null,
        pathActor       : null,
        lx              : null,
        ly              : null,
        tl              : null,
        MT              : 50,
        DT              : 20,
        __index         : 0,


        create : function( director, scene ) {

            var me= this;

            this.setBounds(0,0,director.width,director.height);
            scene.addChild( this );

            this.pathActor= new CAAT.Foundation.UI.PathActor().
                    setBounds(0,0,director.width,director.height).
                    enableEvents(false).
                    setInteractive(false);

            this.pathActor.paint= function( director, time ) {
                CAAT.Foundation.UI.PathActor.prototype.paint.call(this,director,time);

                for( i=0; i<me.childrenList.length; i++ ) {
                    var el= this[me.childrenList[i].id];
                    if ( el ) {
                        el.paint( director );
                    }
                }
            };

            scene.addChild( this.pathActor );

            var N=6;
            for( var i=0; i<N; i++ ) {
                var i0= N>>1;
                this.addFlight(
                        Math.random() * director.width,
                        i<i0 ? 0 : director.height,
                        Math.random() * director.width,
                        i<i0 ? director.height : 0 );
            }

            return this;
        },

        addFlight : function( x, y, x1, y1 ) {
            var f= new CAAT.FC.Ship().
                    setLocation( x, y ).
                    setSize( 30,30 ).
                    setPositionAnchor(.5,.5).
                    addBehavior(
                        new CAAT.Behavior.PathBehavior().
                            setValues( new CAAT.PathUtil.Path().setLinear( x,y,x1,y1).setInteractive(false) ).
                            setDelayTime(0,30000).
                            setAutoRotate(true, CAAT.Behavior.PathBehavior.autorotate.FREE)
                    ).
                    enableEvents( false ).
                    setId('__plane'+this.__index++);

            this.addChild( f );
        },

        mouseDown : function(e) {
            var x= e.x;
            var y= e.y;

            var point= new CAAT.Math.Point();
            for( var i=0; i<this.childrenList.length; i++ ) {
                point.set( x, y );

                var modelViewMatrixI= this.childrenList[i].modelViewMatrix.getInverse();
                modelViewMatrixI.transformCoord(point);

                if (this.childrenList[i].contains(point.x, point.y)) {
                    this.inPlane= true;
                    this.currentPlane= this.childrenList[i];
                    this.currentPlane.fillStyle='#ff0';

                    this.points= [];
                    this.points.push( new CAAT.Math.Point(x,y) );
                    this.lx= x;
                    this.ly= y;
                    this.tl= this.time;
                    return;
                }
            }
        },

        mouseUp : function(e) {
            if ( !this.inPlane ) {
                return;
            }

            this.points.shift();
            this.points.unshift( new CAAT.Math.Point( this.currentPlane.x, this.currentPlane.y ) );
            this.points.unshift( new CAAT.Math.Point( this.currentPlane.x, this.currentPlane.y ) );   // yes twice

            this.points.push( new CAAT.Math.Point( e.x, e.y ) );

            var p= new CAAT.PathUtil.Path().
                setCatmullRom(this.points, false).
                endPath().
                flatten(20, false);


            var pp= [];
            for( var i=0; i<p.getNumSegments(); i++ ) {
                pp.push( p.getSegment(i).startCurvePosition() );
            }
            pp.push( new CAAT.Math.Point( e.x, e.y ) );
            pp.push( new CAAT.Math.Point( e.x, e.y ) );

            this.points= pp;
            p= new CAAT.PathUtil.Path().setCatmullRom( pp, false ).endPath();

            this.pathActor[this.currentPlane.id]= p.setInteractive(false);

            this.currentPlane.
                emptyBehaviorList().
                addBehavior(
                new CAAT.Behavior.PathBehavior().
                        setValues( p ).
                        setDelayTime(0,30000).
                        setAutoRotate(true, CAAT.Behavior.PathBehavior.autorotate.FREE)
            );

            this.inPlane= false;
            this.currentPlane.fillStyle='#00f';
            this.points= [];
            this.pathActor.setPath( null );
        },

        mouseDrag : function(e) {
            if ( !this.inPlane ) {
                return;
            }

            var ps= this.points;

            var x= e.x - this.lx;
            var y= e.y - this.ly;

            if ( Math.sqrt(x*x+y*y)<this.DT ) { // distancia peque�a, promediar puntos.
                ps[ ps.length-1 ].x= e.x;
                ps[ ps.length-1 ].y= e.y;
                if ( this.pathActor.path ) {
                    var ppp= this.pathActor.path.getLastPathSegment().endCurvePosition();
                    ppp.x= e.x;
                    ppp.y= e.y;
                }
                return;
            }


            if ( this.time-this.tl< this.MT ) {
                return;
            }


            this.lx= e.x;
            this.ly= e.y;

            ps.push( new CAAT.Math.Point( e.x, e.y ) );

            var p= new CAAT.PathUtil.Path().
                    beginPath( ps[0].x, ps[0].y );
            for( var i=1, l=ps.length; i<l; i++ ) {
                p.addLineTo( ps[i].x, ps[i].y );
            }
            p.endPath().setInteractive(false);
            this.pathActor.setPath( p );

        }

    }
});