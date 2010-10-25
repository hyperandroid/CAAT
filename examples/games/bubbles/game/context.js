(function() {
    BUBBLES.Bubble = function() {
        return this;
    };

    BUBBLES.Bubble.prototype = {
        iBubbleType:    null,
        iBubbleStatus:  null,

        ST_ONBOARD:     0,
        ST_SPIKED:      1,

        /**
         * Initialize a model bubble.
         * Set status to default and type as a random max value.
         * @param iMaxBubbleTypes Maximum different types of bubbles.
         */
        initialize : function( iMaxBubbleTypes ) {
            this.iBubbleType=   ((Math.random()*1000)>>0) % iMaxBubbleTypes;
            this.iBubbleStatus= this.ST_ONBOARD;
        },
        getStatus : function() {
            return this.iBubbleStatus;
        },
        getType : function() {
            return this.iBubbleType;
        }
    };

})();

(function() {
    BUBBLES.Context = function() {
        this.eventListener= [];
        return this;
    };

    BUBBLES.Context.prototype= {

        // 2d array of BUBBLES.Bubble
        board:              null,
        // 2d array of booleans indicating whether the bubble has already been explored for connections.
        connectBoard:       null,
        // 2d array of JSON elements of the form { row: integer, column: integer }. Contains last connected buble set.
        connectedSet:       null,

        eventListener:      null,

        // board size: rows x columns
        iRows:              0,
        iColumns:           0,

        // number of different kind of bubbles
        iMaxBubbleTypes:    0,

        MIN_CONNECTED_SET_SIZE :    2,

        create : function(iRows, iColumns, iMaxBubbleTypes) {

            this.iRows=             iRows;
            this.iColumns=          iColumns;
            this.iMaxBubbleTypes=   iMaxBubbleTypes;
            this.board=             [];
            this.connectBoard=      [];

            var i,j;

            for( i=0; i<this.iRows; i++ ) {
                this.board.push( [] );
                this.connectBoard.push( [] );
                for( j=0; j<this.iColumns; j++ ) {
                    this.board[i].push( new BUBBLES.Bubble() );
                    this.connectBoard[i].push(false);
                }
            }

            this.initialize();
        },
        initialize : function() {

            this.connectedSet= [];

            var i,j;

            for( i=0; i<this.iRows; i++ ) {
                for( j=0; j<this.iColumns; j++ ) {
                    this.board[i][j].initialize( this.iMaxBubbleTypes );
                    this.connectBoard[i][j]= false;
                }
            }

            this.fireEvent('board','initialize',null);
        },
        getBubbleAt : function( iRow, iColumn ) {
            return this.board[iRow][iColumn];
        },
        releaseConnectedBubbleSet : function() {
            this.fireEvent('bubble','notpointed',this.connectedSet);
            this.connectedSet= [];
        },
        getConnectedBubbleSet : function( iRow, iColumn ) {

            if ( this.isPositionInBubbleConnectedSet( iRow, iColumn ) ) {
                return this.connectedSet;
            }

            var i;

            for( i=0; i<this.iRows; i++ ) {
                for( j=0; j<this.iColumns; j++ ) {
                    this.connectBoard[i][j]= false;
                }
            }

            this.releaseConnectedBubbleSet();

            this.generateBubbleConnections( iRow, iColumn, this.board[iRow][iColumn].iBubbleType, this.connectedSet );

            if ( this.connectedSet.length<=this.MIN_CONNECTED_SET_SIZE ) {
                this.releaseConnectedBubbleSet();
            } else {
                this.fireEvent('bubble','pointed',this.connectedSet);
            }

            return this.connectedSet;
        },
        /**
         * Private method.
         * generate the bubbles connections for a target bubble type.
         * @param iRow
         * @param iColumn
         * @param iType
         * @param aSet
         */
        generateBubbleConnections : function( iRow, iColumn, iType, aSet ) {

            // check bubble bounds.
            if ( iRow<0 || iColumn<0 || iRow>=this.iRows || iColumn>=this.iColumns ) {
                return;
            }

            // if the bubble is not in the board, stop checking.
            if ( this.board[iRow][iColumn].iBubbleStatus==BUBBLES.Bubble.prototype.ST_SPIKED ) {
                return;
            }

            // bubble already checked for connections.
            if ( this.connectBoard[iRow][iColumn] ) {
                return;
            }

            // and this bubble and try to add its connections, only if bubble type is the desired one.
            if ( this.board[iRow][iColumn].iBubbleType==iType ) {
                aSet.push( {row: iRow, column: iColumn} );
                this.connectBoard[iRow][iColumn]= true;

                this.generateBubbleConnections( iRow-1, iColumn,   iType, aSet );
                this.generateBubbleConnections( iRow+1, iColumn,   iType, aSet );
                this.generateBubbleConnections( iRow  , iColumn+1, iType, aSet );
                this.generateBubbleConnections( iRow  , iColumn-1, iType, aSet );
            }
        },
        /**
         * find whether a position on board has already been checked for connections.
         * @param iRow
         * @param iColumn
         */
        isPositionInBubbleConnectedSet : function( iRow, iColumn ) {
            for( var i=0; i<this.connectedSet.length; i++ ) {
                if ( this.connectedSet[i].row==iRow && this.connectedSet[i].column==iColumn ) {
                    return true;
                }
            }

            return false;
        },
        fireEvent : function( sSource, sEvent, params ) {
            var i;
            for( i=0; i<this.eventListener.length; i++ ) {
                this.eventListener[i].contextEvent( {
                    source: sSource,
                    event:  sEvent,
                    params: params
                });
            }
        },
        addContextListener : function( listener ) {
            this.eventListener.push(listener);
        },
        explode : function( iRow, iColumn ) {

            if( this.connectedSet.length<=this.MIN_CONNECTED_SET_SIZE ) {
                return;
            }

            // the exploding position is not in connected bubble set (dunno how !!!)
            if ( !this.isPositionInBubbleConnectedSet(iRow, iColumn) ) {
                return;
            }

            // quitar el comportamiento de seleccionado de las burbujas.
            this.fireEvent('bubble','notpointed',this.connectedSet);

            var i,j;

            for( i=0; i<this.connectedSet.length; i++ ) {
                var column= this.connectedSet[i].column;
                var row=    this.connectedSet[i].row;

                var bubble= this.board[row][column];
                for( j= row+1; j<this.iRows; j++ ) {
                    this.board[j-1][column]= this.board[j][column];
                }

                this.board[this.iRows-1][column]= bubble;

                // como hemos bajado a la ultima posicion de fila del modelo la burbuja conectada
                // que estamos tratando, tenemos que poner en el modelo en una fila por encima de
                // la que se encuentran a las burbujas que se encontraban por debajo de la la burbuja
                // tratada (y en la misma columna)
                for( j=i; j<this.connectedSet.length; j++ ) {
                    if ( this.connectedSet[j].column==column && this.connectedSet[j].row>row) {
                        this.connectedSet[j].row--;
                    }
                }
            }

            // eliminar el cache de burbujas conectadas.
            this.connectedSet= [];

        }
    };
})();