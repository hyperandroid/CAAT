/**
 * See LICENSE file.
 *
 * This file contains the definition for objects QuadTree and HashMap.
 * Quadtree offers an exact list of collisioning areas, while HashMap offers a list of potentially colliding elements.
 *
 **/
(function() {

    CAAT.QuadTree= function() {
        return this;
    };

    var QT_MAX_ELEMENTS=    1;
    var QT_MIN_WIDTH=       32;

    CAAT.QuadTree.prototype= {

        bgActors      :   null,

        quadData    :   null,

        create : function( l,t, r,b, backgroundElements, minWidth, maxElements ) {

            if ( typeof minWidth==='undefined' ) {
                minWidth= QT_MIN_WIDTH;
            }
            if ( typeof maxElements==='undefined' ) {
                maxElements= QT_MAX_ELEMENTS;
            }

            var cx= (l+r)/2;
            var cy= (t+b)/2;

            this.x=         l;
            this.y=         t;
            this.x1=        r;
            this.y1=        b;
            this.width=     r-l;
            this.height=    b-t;

            this.bgActors= this.__getOverlappingActorList( backgroundElements );

            if ( this.bgActors.length <= maxElements || this.width <= minWidth ) {
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

(function() {

    CAAT.SpatialHash= function() {
        return this;
    };

    CAAT.SpatialHash.prototype= {

        elements    :   null,

        width       :   null,
        height      :   null,

        rows        :   null,
        columns     :   null,

        xcache      :   null,
        ycache      :   null,
        xycache     :   null,

        rectangle   :   null,
        r0          :   null,
        r1          :   null,

        initialize : function( w,h, rows,columns ) {

            var i, j;

            this.elements= [];
            for( i=0; i<rows*columns; i++ ) {
                this.elements.push( [] );
            }

            this.width=     w;
            this.height=    h;

            this.rows=      rows;
            this.columns=   columns;

            this.xcache= [];
            for( i=0; i<w; i++ ) {
                this.xcache.push( (i/(w/columns))>>0 );
            }

            this.ycache= [];
            for( i=0; i<h; i++ ) {
                this.ycache.push( (i/(h/rows))>>0 );
            }

            this.xycache=[];
            for( i=0; i<this.rows; i++ ) {

                this.xycache.push( [] );
                for( j=0; j<this.columns; j++ ) {
                    this.xycache[i].push( j + i*columns  );
                }
            }

            this.rectangle= new CAAT.Rectangle().setBounds( 0, 0, w, h );
            this.r0=        new CAAT.Rectangle();
            this.r1=        new CAAT.Rectangle();

            return this;
        },

        clearObject : function() {
            var i;

            for( i=0; i<this.rows*this.columns; i++ ) {
                this.elements[i]= [];
            }

            return this;
        },

        /**
         * Add an element of the form { id, x,y,width,height, rectangular }
         */
        addObject : function( obj  ) {
            var x= obj.x|0;
            var y= obj.y|0;
            var width= obj.width|0;
            var height= obj.height|0;

            var cells= this.__getCells( x,y,width,height );
            for( var i=0; i<cells.length; i++ ) {
                this.elements[ cells[i] ].push( obj );
            }
        },

        __getCells : function( x,y,width,height ) {

            var cells= [];
            var i;

            if ( this.rectangle.contains(x,y) ) {
                cells.push( this.xycache[ this.ycache[y] ][ this.xcache[x] ] );
            }

            /**
             * if both squares lay inside the same cell, it is not crossing a boundary.
             */
            if ( this.rectangle.contains(x+width-1,y+height-1) ) {
                var c= this.xycache[ this.ycache[y+height-1] ][ this.xcache[x+width-1] ];
                if ( c===cells[0] ) {
                    return cells;
                }
                cells.push( c );
            }

            /**
             * the other two AABB points lie inside the screen as well.
             */
            if ( this.rectangle.contains(x+width-1,y) ) {
                var c= this.xycache[ this.ycache[y] ][ this.xcache[x+width-1] ];
                if ( c===cells[0] || c===cells[1] ) {
                    return cells;
                }
                cells.push(c);
            }

            // worst case, touching 4 screen cells.
            if ( this.rectangle.contains(x+width-1,y+height-1) ) {
                var c= this.xycache[ this.ycache[y+height-1] ][ this.xcache[x] ];
                cells.push(c);
            }

            return cells;
        },

        solveCollision : function( callback ) {
            var i,j,k;

            for( i=0; i<this.elements.length; i++ ) {
                var cell= this.elements[i];

                if ( cell.length>1 ) {  // at least 2 elements could collide
                    this._solveCollisionCell( cell, callback );
                }
            }
        },

        _solveCollisionCell : function( cell, callback ) {
            var i,j;

            for( i=0; i<cell.length; i++ ) {

                var pivot= cell[i];
                this.r0.setBounds( pivot.x, pivot.y, pivot.width, pivot.height );

                for( j=i+1; j<cell.length; j++ ) {
                    var c= cell[j];

                    if ( this.r0.intersects( this.r1.setBounds( c.x, c.y, c.width, c.height ) ) ) {
                        callback( pivot, c );
                    }
                }
            }
        },

        /**
         *
         * @param x
         * @param y
         * @param w
         * @param h
         * @param oncollide function that returns boolean. if returns true, stop testing collision.
         */
        collide : function( x,y,w,h, oncollide ) {
            x|=0;
            y|=0;
            w|=0;
            h|=0;

            var cells= this.__getCells( x,y,w,h );
            var i,j,l;
            var el= this.elements;

            this.r0.setBounds( x,y,w,h );

            for( i=0; i<cells.length; i++ ) {
                var cell= cells[i];

                var elcell= el[cell];
                for( j=0, l=elcell.length; j<l; j++ ) {
                    var obj= elcell[j];

                    this.r1.setBounds( obj.x, obj.y, obj.width, obj.height );

                    // collides
                    if ( this.r0.intersects( this.r1 ) ) {
                        if ( oncollide(obj) ) {
                            return;
                        }
                    }
                }
            }
        }

    };
})();