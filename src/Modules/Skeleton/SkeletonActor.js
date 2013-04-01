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
        skinByName : null,

        __init : function( director, skeleton ) {
            this.__super();

            this.skeleton= skeleton;
            this.slotInfo= {};
            this.slotInfoArray= [];
            this.skinByName= {};

            this.__setSkinInfo( skeleton.getSkeletonDataFromFile(), director );

            this.setAnimation("default");

            return this;
        },

        animate : function( director, time ) {
            this.skeleton.calculate(time, this.childrenList);
            return CAAT.Module.Skeleton.SkeletonActor.superclass.animate.call(this, director, time);
        },
/*
        paint : function( director, time ) {
            if (!this.skeleton) {
                return;
            }

            this.skeleton.paint(this.worldModelViewMatrix, director.ctx);
        },
*/
        __setSkinInfo : function( skeletonData, director ) {

            // slots info
            for( var slot=0; slot<skeletonData.slots.length; slot++ ) {
                var slotInfo= skeletonData.slots[slot];
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

                    var skinData= skeletonData.skins["default"][slotInfo.name];
                    if (skinData){

                        //create an actor for each slot data found.
                        var boneActorSkin= new CAAT.Skeleton.BoneActor();
                        var bone= this.skeleton.getBoneById( slotInfo.bone );

                        boneActorSkin.id= slotInfo.name;
                        boneActorSkin.setBone( bone );

                        this.addChild( boneActorSkin );
                        this.skinByName[slotInfo.name]= boneActorSkin;

                        // add skining info for each slot data.
                        for( var skinDef in skinData ) {
                            var skinInfo= skinData[skinDef];
                            boneActorSkin.addSkinInfo( {
                                angle   : -(skinInfo.rotation||0)*2*Math.PI/360,
                                x       : skinInfo.x,
                                y       :  -skinInfo.y,
                                width   : skinInfo.width,
                                height  : skinInfo.height,
                                image   : director.getImage(skinDef),
                                name    : skinDef
                            } );
                        }

                        boneActorSkin.setDefaultSkinInfoByName( slotInfo.attachment );
                    }
                }
            }

            return this;
        },

        setAnimation : function(name) {
            var animationInfo= this.skeleton.getAnimationDataByName(name);
            if (!animationInfo) {
                return;
            }

            var animationSlots= animationInfo.slots;
            for( var animationSlot in animationSlots ) {
                var attachments= animationSlots[animationSlot].attachment;
                var boneActor= this.skinByName[ animationSlot ];
                for( var i=0, l=attachments.length-1; i<l; i+=1 ) {
                    var start= attachments[i].time;
                    var len=   attachments[i+1].time-attachments[i].time;
                    boneActor.addSkinDataKeyframe( attachments[i].name, start, len );
                }
            }
        }

    }
});