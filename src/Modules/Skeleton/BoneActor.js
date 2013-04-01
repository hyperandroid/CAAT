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
            skinInfoByName : null,
            currentSkinInfo : null,
            skinDataKeyframes : null,

            __init : function() {
                this.__super();
                this.skinInfo= [];
                this.skinInfoByName= {};
                this.skinDataKeyframes= [];
                this.setSize(1,1);
            },

            setBone : function(bone) {
                this.bone= bone;
                return this;
            },

            addSkinInfo : function( si ) {
                if (null===this.currentSkinInfo) {
                    this.currentSkinInfo= si;
                }
                this.skinInfo.push( si );
                this.skinInfoByName[ si.name ]= si;
                return this;
            },

            setDefaultSkinInfoByName : function( name ) {
                var v= this.skinInfoByName[name];
                if (v) {
                    this.currentSkinInfo= v;
                }

                return this;
            },

            addSkinDataKeyframe : function( name, start, duration ) {
                this.skinDataKeyframes.push( {
                    name : name,
                    start : start,
                    duration : duration
                });
            },

            __getCurrentSkinInfo : function(time) {
                if ( this.skinDataKeyframes.length ) {
                    time=(time%1000)/1000;

                    for( var i=0, l=this.skinDataKeyframes.length; i<l; i+=1 ) {
                        var sdkf= this.skinDataKeyframes[i];
                        if ( time>=sdkf.start && time<=sdkf.start+sdkf.duration ) {
                            this.currentSkinInfo= this.skinInfoByName[ sdkf.name ];
                            break;
                        }
                    }
                }

                return this.currentSkinInfo;
            },

            paint : function( director, time ) {
                var ctx= director.ctx;

                    var skinInfo= this.__getCurrentSkinInfo(time);

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