/**
 * Created by Ibon Tolosana - @hyperandroid
 * User: ibon
 * Date: 02/02/12
 * Time: 19:29
 */

(function() {

    CAAT.QuadTree= function() {
        return this;
    };

    var QT_MAX_ELEMENTS=    1;
    var QT_MIN_WIDTH=       32;

    CAAT.QuadTree.prototype= {

        bgActors      :   null,

        quadData    :   null,

        create : function( l,t, r,b, backgroundElements ) {

            var cx= (l+r)/2;
            var cy= (t+b)/2;

            this.x=         l;
            this.y=         t;
            this.x1=        r;
            this.y1=        b;
            this.width=     r-l;
            this.height=    b-t;

            this.bgActors= this.__getOverlappingActorList( backgroundElements );

            if ( this.bgActors.length <= QT_MAX_ELEMENTS || this.width <= QT_MIN_WIDTH  ) {
                return this;
            }

            this.quadData= new Array(4);
            this.quadData[0]= new CAAT.QuadTree().create( l,t,cx,cy, this.bgActors );  // TL
            this.quadData[1]= new CAAT.QuadTree().create( cx,t,r,cy, this.bgActors );  // TR
            this.quadData[2]= new CAAT.QuadTree().create( l,cy,cx,b, this.bgActors );  // BL
            this.quadData[3]= new CAAT.QuadTree().create( cx,cy,r,b, this.bgActors );

            return this;
        },

        __getOverlappingActorList : function( actorList ) {
            var tmpList= [];
            for( var i=0, l=actorList.length; i<l; i++ ) {
                var actor= actorList[i];
                if ( this.intersects( actor.AABB ) ) {
                    tmpList.push( actor );
                }
            }
            return tmpList;
        },

        getOverlappingActors : function( rectangle ) {
            var i,j,l;
            var overlappingActors= [];
            var qoverlappingActors;
            var actors= this.bgActors;
            var actor;

            if ( this.quadData ) {
                for( i=0; i<4; i++ ) {
                    if ( this.quadData[i].intersects( rectangle ) ) {
                        qoverlappingActors= this.quadData[i].getOverlappingActors(rectangle);
                        for( j=0,l=qoverlappingActors.length; j<l; j++ ) {
                            overlappingActors.push( qoverlappingActors[j] );
                        }
                    }
                }
            } else {
                for( i=0, l=actors.length; i<l; i++ ) {
                    actor= actors[i];
                    if ( rectangle.intersects( actor.AABB ) ) {
                        overlappingActors.push( actor );
                    }
                }
            }

            return overlappingActors;
        }
    };

    extend( CAAT.QuadTree, CAAT.Rectangle );
})();