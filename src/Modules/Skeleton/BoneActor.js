CAAT.Module({
    defines : "CAAT.Skeleton.BoneActor",
    depends : [
        "CAAT.Foundation.Actor"
    ],
    extendsClass : "CAAT.Foundation.Actor",
    extendsWith : function() {
        return {
            bone    : null,
            skinInfo : null,

            __init : function() {
                this.__super();
                this.skinInfo= [];
                this.setSize(1,1);
            },

            setBone : function(bone) {
                this.bone= bone;
                return this;
            },

            addSkinInfo : function( si ) {
                this.skinInfo.push( si );
                return this;
            },

            paint : function( director, time ) {
                var ctx= director.ctx;

                for( var i= 0, l=this.skinInfo.length; i<l; i+=1 ) {
                    var skinInfo= this.skinInfo[i];

                    if (!skinInfo.image) {
                        return;
                    }

                    var w= skinInfo.width*.5;
                    var h= skinInfo.height*.5;

                    ctx.save();
                        ctx.translate(-w+skinInfo.x, -h+skinInfo.y );

                        ctx.translate(w, h);
                        ctx.rotate(skinInfo.angle);
                        ctx.translate( -w, -h);

                        ctx.drawImage( skinInfo.image, 0, 0, skinInfo.image.width, skinInfo.image.height );
                    ctx.restore();
                }

            },

            setModelViewMatrix : function() {
                this.modelViewMatrix.copy( this.bone.wmatrix );

                if (this.parent) {

                    this.isAA = false;
                    this.worldModelViewMatrix.copy(this.parent.worldModelViewMatrix);
                    this.worldModelViewMatrix.multiply(this.modelViewMatrix);
                    this.wdirty = true;

                } else {
                    if (this.dirty) {
                        this.wdirty = true;
                    }

                    this.worldModelViewMatrix.identity();
                    this.isAA = this.rotationAngle === 0 && this.scaleX === 1 && this.scaleY === 1;
                }

            }
        }
    }
});