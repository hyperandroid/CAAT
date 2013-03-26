CAAT.Module( {
    defines : "CAAT.Module.Skeleton.Skeleton",
    depends : [
        "CAAT.Module.Skeleton.Bone"
    ],
    extendsWith : {

        bones : null,
        bonesArray : null,
        root  : null,

        __init : function(skeleton, animation) {
            this.bones= {};
            this.bonesArray= [];

            // bones
            for ( var i=0; i<skeleton.bones.length; i++ ) {
                var boneInfo= skeleton.bones[i];
                this.addBone(boneInfo);
            }

            // bones animation
            for( var bonename in animation.bones ) {

                var boneanimation= animation.bones[bonename];

                if ( boneanimation.rotate ) {

                    for( var i=0; i<boneanimation.rotate.length-1; i++ ) {
                        this.addRotationKeyframe( {
                            boneId : bonename,
                            angleStart : boneanimation.rotate[i].angle,
                            angleEnd : boneanimation.rotate[i+1].angle,
                            timeStart : boneanimation.rotate[i].time*1000,
                            timeEnd : boneanimation.rotate[i+1].time*1000,
                            curve : boneanimation.rotate[i].curve
                        } );
                    }
                }

                if (boneanimation.translate) {

                    for( var i=0; i<boneanimation.translate.length-1; i++ ) {

                        this.addTranslationKeyframe( {
                            boneId      : bonename,
                            startX      : boneanimation.translate[i].x,
                            startY      : -boneanimation.translate[i].y,
                            endX        : boneanimation.translate[i+1].x,
                            endY        : -boneanimation.translate[i+1].y,
                            timeStart   : boneanimation.translate[i].time * 1000,
                            timeEnd     : boneanimation.translate[i+1].time * 1000,
                            curve       : "stepped" //boneanimation.translate[i].curve

                        });
                    }
                }

                this.endKeyframes( bonename );

            }


            return this;
        },

        getNumBones : function() {
            return this.bonesArray.length;
        },

        getRoot : function() {
            return this.root;
        },

        calculate : function(time) {
            this.root.apply(time);
        },

        getBoneById : function(id) {
            return this.bones[id];
        },

        getBoneByIndex : function(index) {
            return this.bonesArray[ index ];
        },

        addBone : function( boneInfo ) {
            var bone= new CAAT.Module.Skeleton.Bone(boneInfo.name);

            bone.setPosition(
                typeof boneInfo.x!=="undefined" ? boneInfo.x : 0,
                typeof boneInfo.y!=="undefined" ? boneInfo.y : 0 );
            bone.setRotateTransform( boneInfo.rotation ? boneInfo.rotation : 0 );
            bone.setSize( boneInfo.length ? boneInfo.length : 0, 0 );

            this.bones[boneInfo.name]= bone;

            if (boneInfo.parent) {

                var parent= this.bones[boneInfo.parent];
                if ( parent ) {
                    parent.addBone(bone);
                } else {
                    console.log("Referenced parent Bone '"+boneInfo.parent+"' which does not exist");
                }
            }

            this.bonesArray.push(bone);

            // BUGBUG should be an explicit root bone identification.
            if (!this.root) {
                this.root= bone;
            }
        },

        addRotationKeyframe : function( keyframeInfo ) {
            var bone= this.bones[ keyframeInfo.boneId ];
            if ( bone ) {
                bone.addRotationKeyframe(
                    keyframeInfo.angleStart,
                    keyframeInfo.angleEnd,
                    keyframeInfo.timeStart,
                    keyframeInfo.timeEnd,
                    keyframeInfo.curve
                )
            } else {
                console.log("Rotation Keyframe for non-existant bone: '"+keyframeInfo.boneId+"'" );
            }
        },

        addTranslationKeyframe : function( keyframeInfo ) {

            var bone= this.bones[ keyframeInfo.boneId ];
            if ( bone ) {

                bone.addTranslationKeyframe(
                    keyframeInfo.startX,
                    keyframeInfo.startY,
                    keyframeInfo.endX,
                    keyframeInfo.endY,
                    keyframeInfo.timeStart,
                    keyframeInfo.timeEnd,
                    keyframeInfo.curve
                )
            } else {
                console.log("Translation Keyframe for non-existant bone: '"+keyframeInfo.boneId+"'" );
            }
        },

        endKeyframes : function( boneId ) {
            var bone= this.bones[boneId];
            if (bone) {
                bone.endTranslationKeyframes();
                bone.endRotationKeyframes();
                bone.endScaleKeyframes();
            }
        },

        paint : function( actorMatrix, ctx ) {
            this.root.paint(actorMatrix,ctx);
        }

    }
});