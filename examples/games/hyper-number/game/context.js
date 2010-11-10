/**
 */
(function() {

    HN.Brick= function() {
        return this;
    };

    HN.Brick.prototype= {

        value:      0,
        color:      0,
        selected:   false,
        removed:    false,

        row:        0,
        column:     0,

        context:    null,

        /**
         *
         * @param row
         * @param column
         * @param context the HN.Context instance
         */
        initialize : function(row, column, context) {
            this.row=       row;
            this.column=    column;
            this.selected=  false;
            this.removed=   false;
            this.color=     (Math.random()*context.getNumberColors())>>0;
            this.context=   context;

            // favorecer los numeros 3..9
            if ( Math.random()>.3 ) {
                this.value= 4 + (Math.random()*6)>>0;
            } else {
                this.value= 1 + (Math.random()*3)>>0;
            }

            if ( this.value<1 ) {
                this.value=1;
            } else if ( this.value>9 ) {
                this.value=9;
            }
        },
        changeSelection : function() {
            this.selected= !this.selected;
            this.context.selectionChanged(this);
        }
    };

})();

(function() {

    HN.Context= function() {
        this.eventListener= [];
        return this;
    };

    HN.Context.prototype= {

        eventListener:  null,   // context listeners

        rows:           0,      // model size in
        columns:        0,      //  rows x columns
        numNumberColors:0,

        data:           null,   // context model. Bricks.

        guessNumber:    0,      // number to sum up with bricks.
        time:           0,      // maximum time to take to guess an adding number sequence.

        selectedList:   null,   // selected bricks.

        status:         0,      // <-- control logic -->
        level:          0,

        ST_INITIALIZING:    0,
        ST_RUNNNING:        1,


        /**
         * Called once on game startup.
         * @param rows an integer indicating game model rows.
         * @param columns an integer indicating game model columns.
         *
         * @return nothing.
         */
        create : function( rows, columns, numNumberColors  ) {
            this.rows=              rows;
            this.columns=           columns;
            this.numNumberColors=   numNumberColors;
            this.data=              [];

            var i,j;

            for( i=0; i<rows; i++ ) {
                this.data.push( [] );
                for( j=0; j<columns; j++ ) {
                    this.data[i].push( new HN.Brick() );
                }
            }

            return this;
        },
        getNumberColors : function()  {
            return this.numNumberColors;
        },
        initialize : function() {

            this.level=         1;
            this.selectedList=  [];

            for( i=0; i<this.rows; i++ ) {
                for( j=0; j<this.columns; j++ ) {
                    this.data[i][j].initialize(i,j,this);
                }
            }

            this.setStatus( this.ST_INITIALIZING );

            return this;
        },
        /**
         * Notify listeners of a context event
         * @param sSource event source object
         * @param sEvent an string indicating the event type
         * @param params an object with event parameters. Each event type will have its own parameter set.
         */
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
            return this;
        },
        getBrick : function( row, column ) {
            return this.data[row][column];
        },
        setStatus : function( status ) {
            this.status= status;
            this.fireEvent( 'context', 'status', this.status );

            if ( this.status==this.ST_RUNNNING ) {
                this.setGuessNumber();
            }
        },
        selectionChanged : function(brick) {

            // si ya estaba en la lista de seleccionados, quitarlo.
            var i;
            for( i=0; i<this.selectedList.length; i++ ) {
                // esta en la lista.
                // eliminar y salir del metodo
                if ( this.selectedList[i]==brick ) {
                    this.selectedList.splice( i, 1 );
                    this.fireEvent('brick','selection',brick);
                    return;
                }
            }

            // chequear que la suma de los elementos seleccionados es igual al numero magico.
            var sum=0;
            for( i=0; i<this.selectedList.length; i++ ) {
                sum+= this.selectedList[i].value;
            }

            sum+= brick.value;

            if ( sum>this.guessNumber ) {

                brick.selected= false;
                var selected= this.selectedList.slice(0);
                for( i=0; i<this.selectedList.length; i++ ) {
                    this.selectedList[i].selected= false;
                }
                this.selectedList= [];

                // quitar marca de seleccion al ladrillo.
                this.fireEvent('brick','selectionoverflow', selected );


            } else if ( sum==this.guessNumber ) {
                this.selectedList.push(brick);
                var selected= this.selectedList.slice(0);
                for( i=0; i<this.selectedList.length; i++ ) {
                    this.selectedList[i].selected= false;
                    this.selectedList[i].removed= true;
                }
                this.selectedList= [];

                this.fireEvent('brick','selection-cleared', selected );
                
                this.setGuessNumber();
                
            } else {
                // todavia podemos sumar numeros.
                this.selectedList.push(brick);
                this.fireEvent('brick','selection',brick);
            }
        },
        setGuessNumber : function() {

            // first get all available board numbers.
            var activeBricks= [];
            var i,j;
            for( i=0; i<this.rows; i++ ) {
                for( j=0; j<this.columns; j++ ) {
                    if ( !this.data[i][j].removed ) {
                        activeBricks.push(this.data[i][j]);
                    }
                }
            }

            // scramble elements.
            if ( activeBricks.length>1 ) {
                for( i=0; i<activeBricks.length; i++ ) {
                    var rpos0=              (Math.random()*activeBricks.length)>>0;
                    var tmp=                activeBricks[i];

                    activeBricks[i]=        activeBricks[rpos0];
                    activeBricks[rpos0]=    tmp;
                }
            }

            var sum=0;
            for( i=0; i<activeBricks.length; i++ ) {
                if ( sum+activeBricks[i].value >= (this.level+1)*10 ) {
                    break;
                }
                sum+= activeBricks[i].value;
            }

            this.guessNumber= sum;
            this.fireEvent( 'context','guessnumber',this );
        }
    };
})();