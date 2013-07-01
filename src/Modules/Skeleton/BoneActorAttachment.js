CAAT.Module({


    /**
     * @name BoneActorAttachment
     * @memberof CAAT.Module.Skeleton
     * @constructor
     */

    defines : "CAAT.Module.Skeleton.BoneActorAttachment",
    extendsWith : function() {

        var sp= new CAAT.Math.Point();

        return {

            id : null,
            _x : 0, // normalized x position of the attachment point x.
            _y : 0, // normalized x position of the attachment point y.
            x : 0,
            y: 0,
            matrix : null,

            __init : function(id, x, y, callback) {
                this.id= id;
                this._x= x;
                this._y= y;
                this.callback= callback;

                return this;
            },

            /**
             * @param matrix {CAAT.Math.Matrix}
             * @param w
             * @param h
             */
            transform : function( matrix, w, h ) {
                var tm= matrix.matrix;

                w= this._x * w;
                h= this._y * h;

                var x = w * tm[0] + h * tm[1] + tm[2];
                var y = w * tm[3] + h * tm[4] + tm[5];

                this.x= x;
                this.y= y;

                this.matrix= matrix;

                if ( this.callback) {
                    this.callback(this);
                }

                return this;
            },

            getMatrixData : function() {
                var m= this.matrix.matrix;
                return {
                    translation : {
                        x : m[2],
                        y : m[5]
                    },
                    angle : -Math.atan(m[1]/m[0]),
                    scale : {
                        x : Math.sqrt( m[1]*m[1] + m[0]*m[0] ),
                        y : Math.sqrt( m[3]*m[3] + m[4]*m[4] )
                    }
                }
            },

            getScreenAttachmentPos : function(  ) {
                sp.x= this.x;
                sp.y= this.y;
                return sp;
            }
        }
    }
});