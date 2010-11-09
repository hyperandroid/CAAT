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

        row:        0,
        column:     0,

        /**
         *
         * @param row
         * @param column
         * @param context the HN.Context instance
         */
        initialize : function(row, column, context) {
            this.row= row;
            this.column= column;

            this.color= (Math.random()*context.getNumberColors())>>0;

            // favorecer los numeros 3..9
            if ( Math.random()>.3 ) {
                this.value= (Math.random()*6+3)>>0;
            } else {
                this.value= (Math.random()*3)>>0;
            }

            if ( this.value<0 ) {
                this.value=0;
            } else if ( this.value>8 ) {
                this.value=8;
            }
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
            this.selectedList= [];

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
        }
    };
})();