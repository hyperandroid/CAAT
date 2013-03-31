CAAT.Module( {

    defines : "CAAT.Module.Skeleton.SkeletonActor",
    extendsClass : "CAAT.Foundation.ActorContainer",
    depends : [
        "CAAT.Module.Skeleton.Skeleton",
        "CAAT.Module.Skeleton.BoneActor",
        "CAAT.Foundation.ActorContainer"
    ],
    extendsWith : {

        skeleton : null,
        slotInfo : null,
        slotInfoArray : null,
        boneActorHash : null,


        __init : function( director, skeleton ) {
            this.__super();

            this.skeleton= skeleton;
            this.slotInfo= {};
            this.slotInfoArray= [];
            this.boneActorHash= {};

            // create an actor for each bone in the skeleton.
            for( var i=0, l=skeleton.getNumBones(); i<l; i++ ) {

                var boneActor= new CAAT.Skeleton.BoneActor();
                var bone= skeleton.getBoneByIndex( i );

                boneActor.id= bone.id;
                boneActor.setBone( bone );

                this.boneActorHash[ bone.id ]= boneActor;
                this.addChild( boneActor );
            }

            return this;
        },

        animate : function( director, time ) {
            this.skeleton.calculate(time);
            return CAAT.Module.Skeleton.SkeletonActor.superclass.animate.call(this, director, time);
        },

        paint : function( director, time ) {
            if (!this.skeleton) {
                return;
            }

            this.skeleton.paint(this.worldModelViewMatrix, director.ctx);

//            CAAT.Foundation.ActorContainer.superclass.paint.call( this, director, time );
        },

        setSkinInfo : function( skeleton, director ) {

            // slots info
            for( var slot=0; slot<skeleton.slots.length; slot++ ) {
                var slotInfo= skeleton.slots[slot];
                var bone= this.skeleton.getBoneById(slotInfo.bone);
                if (bone) {
                    var slotInfoData= {
                        sortId : slot,
                        attachment : slotInfo.attachment,
                        name: slotInfo.name,
                        bone : slotInfo.bone
                    };

                    this.slotInfo[ bone.id ]= slotInfoData;
                    this.slotInfoArray.push( slotInfoData );

                    var skinData= skeleton.skins["default"][slotInfo.name];
                    if (skinData){
                        for( var skinDef in skinData ) {
                            var boneActor= this.boneActorHash[ slotInfo.bone ];
                            var skinInfo= skinData[skinDef];
                            boneActor.addSkinInfo( {
                                angle   : -(skinInfo.rotation||0)*2*Math.PI/360,
                                x       : skinInfo.x,
                                y       :  -skinInfo.y,
                                width   : skinInfo.width,
                                height  : skinInfo.height,
                                image   : director.getImage(skinDef)
                            } );
                        }
                    }
                }
            }


            // set actors order.
            for( var i=0; i<this.slotInfoArray.length; i++ ) {
                var boneActor= this.findActorById( this.slotInfoArray[i].bone );
                this.removeChild(boneActor);
                boneActor.parent= null;
                this.addChildAt(boneActor, Number.MAX_VALUE );
            }

            return this;
        }

    }
});