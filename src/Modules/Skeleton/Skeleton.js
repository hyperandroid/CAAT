CAAT.Module( {

    /**
     * @name Skeleton
     * @memberof CAAT.Module.Skeleton
     * @constructor
     */

    defines : "CAAT.Module.Skeleton.Skeleton",
    depends : [
        "CAAT.Module.Skeleton.Bone"
    ],
    extendsWith : {

        /**
         * @lends CAAT.Module.Skeleton.Skeleton.prototype
         */

        bones : null,
        bonesArray : null,
        animation : null,
        root  : null,
        currentAnimationName : null,
        skeletonDataFromFile : null,

        __init : function(skeletonDataFromFile) {
            this.bones= {};
            this.bonesArray= [];
            this.animations= {};

            // bones
            if (skeletonDataFromFile) {
                this.__setSkeleton( skeletonDataFromFile );
            }
        },

        getSkeletonDataFromFile : function() {
            return this.skeletonDataFromFile;
        },

        __setSkeleton : function( skeletonDataFromFile ) {
            this.skeletonDataFromFile= skeletonDataFromFile;
            for ( var i=0; i<skeletonDataFromFile.bones.length; i++ ) {
                var boneInfo= skeletonDataFromFile.bones[i];
                this.addBone(boneInfo);
            }
        },

        setSkeletonFromFile : function(url) {
            var me= this;
            new CAAT.Module.Preloader.XHR().load(
                    function( result, content ) {
                        if (result==="ok" ) {
                            me.__setSkeleton( JSON.parse(content) );
                        }
                    },
                    url,
                    false,
                    "GET"
            );

            return this;
        },

        addAnimationFromFile : function(name, url) {
            var me= this;
            new CAAT.Module.Preloader.XHR().load(
                    function( result, content ) {
                        if (result==="ok" ) {
                            me.addAnimation( name, JSON.parse(content) );
                        }
                    },
                    url,
                    false,
                    "GET"
            );

            return this;
        },

        addAnimation : function(name, animation) {

            // bones animation
            for( var bonename in animation.bones ) {

                var boneanimation= animation.bones[bonename];

                if ( boneanimation.rotate ) {

                    for( var i=0; i<boneanimation.rotate.length-1; i++ ) {
                        this.addRotationKeyframe(
                            name,
                            {
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

                        this.addTranslationKeyframe(
                            name,
                            {
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

                if ( boneanimation.scale ) {
                    for( var i=0; i<boneanimation.scale.length-1; i++ ) {
                        this.addScaleKeyframe(
                            name,
                            {
                                boneId : bonename,
                                startScaleX : boneanimation.rotate[i].x,
                                endScaleX : boneanimation.rotate[i+1].x,
                                startScaleY : boneanimation.rotate[i].y,
                                endScaleY : boneanimation.rotate[i+1].y,
                                timeStart : boneanimation.rotate[i].time*1000,
                                timeEnd : boneanimation.rotate[i+1].time*1000,
                                curve : boneanimation.rotate[i].curve
                            } );
                    }
                }

                this.endKeyframes( name, bonename );

            }

            if ( null===this.currentAnimationName ) {
                this.animations[name]= animation;
                this.setAnimation(name);
            }

            return this;
        },

        setAnimation : function(name) {
            this.root.setAnimation( name );
            this.currentAnimationName= name;
        },

        getCurrentAnimationData : function() {
            return this.animations[ this.currentAnimationName ];
        },

        getAnimationDataByName : function(name) {
            return this.animations[name];
        },

        getNumBones : function() {
            return this.bonesArray.length;
        },

        getRoot : function() {
            return this.root;
        },

        calculate : function(time, animationTime) {
            this.root.apply(time, animationTime);
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

        addRotationKeyframe : function( name, keyframeInfo ) {
            var bone= this.bones[ keyframeInfo.boneId ];
            if ( bone ) {
                bone.addRotationKeyframe(
                    name,
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

        addScaleKeyframe : function( name, keyframeInfo ) {
            var bone= this.bones[ keyframeInfo.boneId ];
            if ( bone ) {
                bone.addRotationKeyframe(
                    name,
                    keyframeInfo.startScaleX,
                    keyframeInfo.endScaleX,
                    keyframeInfo.startScaleY,
                    keyframeInfo.endScaleY,
                    keyframeInfo.timeStart,
                    keyframeInfo.timeEnd,
                    keyframeInfo.curve
                )
            } else {
                console.log("Scale Keyframe for non-existant bone: '"+keyframeInfo.boneId+"'" );
            }
        },

        addTranslationKeyframe : function( name, keyframeInfo ) {

            var bone= this.bones[ keyframeInfo.boneId ];
            if ( bone ) {

                bone.addTranslationKeyframe(
                    name,
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

        endKeyframes : function( name, boneId ) {
            var bone= this.bones[boneId];
            if (bone) {
                bone.endTranslationKeyframes(name);
                bone.endRotationKeyframes(name);
                bone.endScaleKeyframes(name);
            }
        },

        paint : function( actorMatrix, ctx ) {
            this.root.paint(actorMatrix,ctx);
        }

    }
});