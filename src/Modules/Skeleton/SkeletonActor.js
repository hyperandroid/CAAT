CAAT.Module({

    /**
     * @name SkeletonActor
     * @memberof CAAT.Module.Skeleton.prototype
     * @constructor
     */

    defines: "CAAT.Module.Skeleton.SkeletonActor",
    extendsClass: "CAAT.Foundation.Actor",
    depends: [
        "CAAT.Module.Skeleton.Skeleton",
        "CAAT.Module.Skeleton.BoneActor",
        "CAAT.Foundation.Actor"
    ],
    extendsWith: function () {



        /**
         * Holder to keep animation slots information.
         */
        function SlotInfoData( sortId, attachment, name, bone ) {

            this.sortId= sortId;
            this.attachment= attachment;
            this.name= name;
            this.bone= bone;

            return this;
        }

        return {

            /**
             * @lends CAAT.Module.Skeleton.SkeletonActor
             */

            skeleton: null,

            /**
             * @type object
             * @map < boneId{string}, SlotInfoData >
             */
            slotInfo: null,

            /**
             * @type Array.<SlotInfoData>
             */
            slotInfoArray: null,

            /**
             * @type object
             * @map
             */
            skinByName: null,

            /**
             * @type CAAT.Foundation.Director
             */
            director: null,

            /**
             * @type boolean
             */
            _showBones: false,

            /**
             * Currently selected animation play time.
             * Zero to make it last for its default value.
             * @type number
             */
            animationDuration : 0,

            showAABB : false,
            bonesActor : null,

            __init: function (director, skeleton) {
                this.__super();

                this.director = director;
                this.skeleton = skeleton;
                this.slotInfo = {};
                this.slotInfoArray = [];
                this.bonesActor= [];
                this.skinByName = {};

                this.setSkin();
                this.setAnimation("default");

                return this;
            },

            showBones: function (show) {
                this._showBones = show;
                return this;
            },

            /**
             * build an sprite-sheet composed of numSprites elements and organized in rows x columns
             * @param numSprites {number}
             * @param rows {number=}
             * @param columns {number=}
             */
            buildSheet : function( numSprites, rows, columns ) {

                var i, j,l;
                var AABBs= [];
                var maxTime= 1000;  // BUGBUG search for animation time.
                var ssItemWidth, ssItemHeight;  // sprite sheet item width and height
                var ssItemMinX= Number.MAX_VALUE, ssItemMinY= Number.MAX_VALUE;
                var ssItemMaxOffsetY, ssItemMaxOffsetX;

                // prepare this actor's world model view matrix, but with no position.
                var px= this.x;
                var py= this.y;
                this.x= this.y= 0;
                this.setModelViewMatrix();


                rows= rows || 1;
                columns= columns || 1;

                // calculate all sprite sheet frames aabb.
                for( j=0; j<numSprites; j++ ) {
                    var aabb= new CAAT.Math.Rectangle();
                    var time= maxTime/numSprites*j;
                    AABBs.push( aabb );
                    this.skeleton.calculate( time, this.animationDuration );

                    for( i= 0, l= this.bonesActor.length; i<l; i+=1 ) {
                        var bone= this.bonesActor[i];
                        var boneAABB;
                        bone.setupAnimation(time);
                        boneAABB= bone.AABB;
                        aabb.unionRectangle(boneAABB);
                        if ( boneAABB.x < ssItemMinX ) {
                            ssItemMinX= boneAABB.x;
                        }
                    }
                }

                // calculate offsets for each aabb and sprite-sheet element size.
                ssItemWidth= 0;
                ssItemHeight= 0;
                ssItemMinX= Number.MAX_VALUE;
                ssItemMinY= Number.MAX_VALUE;
                for( i=0; i<AABBs.length; i++ ) {
                    if ( AABBs[i].x < ssItemMinX ) {
                        ssItemMinX= AABBs[i].x;
                    }
                    if ( AABBs[i].y < ssItemMinY ) {
                        ssItemMinY= AABBs[i].y;
                    }
                    if ( AABBs[i].width>ssItemWidth ) {
                        ssItemWidth= AABBs[i].width;
                    }
                    if ( AABBs[i].height>ssItemHeight ) {
                        ssItemHeight= AABBs[i].height;
                    }
                }
                ssItemWidth= (ssItemWidth|0)+1;
                ssItemHeight= (ssItemHeight|0)+1;

                // calculate every animation offset against biggest animation size.
                ssItemMaxOffsetY= -Number.MAX_VALUE;
                ssItemMaxOffsetX= -Number.MAX_VALUE;
                var offsetMinX=Number.MAX_VALUE, offsetMaxX=-Number.MAX_VALUE;
                for( i=0; i<AABBs.length; i++ ) {
                    var offsetX= (ssItemWidth - AABBs[i].width)/2;
                    var offsetY= (ssItemHeight - AABBs[i].height)/2;

                    if ( offsetY>ssItemMaxOffsetY ) {
                        ssItemMaxOffsetY= offsetY;
                    }

                    if ( offsetX>ssItemMaxOffsetX ) {
                        ssItemMaxOffsetX= offsetX;
                    }
                }


                // create a canvas of the neccessary size
                var canvas= document.createElement("canvas");
                canvas.width= ssItemWidth * numSprites;
                canvas.height= ssItemHeight;
                var ctx= canvas.getContext("2d");

                // draw animation into canvas.
                for( j=0; j<numSprites; j++ ) {

                    //this.x= j*ssItemWidth + offsetMaxX - ssItemMaxOffsetX ;
                    this.x= j*ssItemWidth - ssItemMinX;
                    this.y= ssItemHeight - ssItemMaxOffsetY/2 - 1;

                    this.setModelViewMatrix();

                    var time= maxTime/numSprites*j;
                    this.skeleton.calculate( time, this.animationDuration );

                    // prepare bones
                    for( i= 0, l= this.bonesActor.length; i<l; i+=1 ) {
                        this.bonesActor[i].setupAnimation(time);
                        this.bonesActor[i].paint( ctx, time );
                    }

                    ctx.restore();
                }

                this.x= px;
                this.y= py;

                return canvas;
            },

            animate: function (director, time) {
                var i,l;

                var ret= CAAT.Module.Skeleton.SkeletonActor.superclass.animate.call( this, director, time );

                this.skeleton.calculate( time, this.animationDuration );

                for( i= 0, l= this.bonesActor.length; i<l; i+=1 ) {
                    this.bonesActor[i].setupAnimation(time);
                }

                this.AABB.setEmpty();
                for( i= 0, l= this.bonesActor.length; i<l; i+=1 ) {
                    this.AABB.unionRectangle(this.bonesActor[i].AABB);
                }

                return ret;
            },

            paint : function( director, time ) {
                CAAT.Module.Skeleton.SkeletonActor.superclass.paint.call(this,director,time);
                for( var i= 0, l=this.bonesActor.length; i<l; i+=1 ) {
                    this.bonesActor[i].paint( director.ctx, time );
                }


                if (this._showBones && this.skeleton) {
                    this.worldModelViewMatrix.transformRenderingContextSet(director.ctx);
                    this.skeleton.paint(this.worldModelViewMatrix, director.ctx);
                }
            },

            __addBoneActor : function( boneActor ) {
                this.bonesActor.push( boneActor );
                boneActor.parent= this;
                return this;
            },

            setSkin: function (skin) {

                this.bonesActor= [];
                this.slotInfoArray = [];
                this.slotInfo = {};

                var skeletonData = this.skeleton.getSkeletonDataFromFile();

                // slots info
                for (var slot = 0; slot < skeletonData.slots.length; slot++) {
                    var slotInfo = skeletonData.slots[slot];
                    var bone = this.skeleton.getBoneById(slotInfo.bone);
                    if (bone) {
                        var slotInfoData = new SlotInfoData(
                                slot,
                                slotInfo.attachment,
                                slotInfo.name,
                                slotInfo.bone );

                        this.slotInfo[ bone.id ] = slotInfoData;
                        this.slotInfoArray.push(slotInfoData);


                        var skinData = null;
                        if (skin) {
                            skinData = skeletonData.skins[skin][slotInfo.name];
                        }
                        if (!skinData) {
                            skinData = skeletonData.skins["default"][slotInfo.name];
                        }
                        if (skinData) {

                            //create an actor for each slot data found.
                            var boneActorSkin = new CAAT.Module.Skeleton.BoneActor();
                            boneActorSkin.id = slotInfo.name;
                            boneActorSkin.setBone(bone);

                            this.__addBoneActor(boneActorSkin);
                            this.skinByName[slotInfo.name] = boneActorSkin;

                            // add skining info for each slot data.
                            for (var skinDef in skinData) {
                                var skinInfo = skinData[skinDef];
                                var angle= -(skinInfo.rotation || 0) * 2 * Math.PI / 360;
                                var x= skinInfo.x|0;
                                var y= -skinInfo.y|0;
                                var w= skinInfo.width|0;
                                var h= skinInfo.height|0;
                                var scaleX= skinInfo.scaleX|1;
                                var scaleY= skinInfo.scaleY|1;

                                var matrix= CAAT.Math.Matrix.translate( -skinInfo.width/2, -skinInfo.height/2 );
                                matrix.premultiply( CAAT.Math.Matrix.rotate( angle ) );
                                matrix.premultiply( CAAT.Math.Matrix.scale( scaleX, scaleY ) );
                                matrix.premultiply( CAAT.Math.Matrix.translate( x, y ) );

                                /*
                                only needed values are:
                                  + image
                                  + matrix
                                  + name

                                  all the rest are just to keep original values.
                                 */
                                boneActorSkin.addSkinInfo({
                                    angle: angle,
                                    x: x,
                                    y: y,
                                    width: w,
                                    height: h,
                                    image: this.director.getImage(skinData[skinDef].name ? skinData[skinDef].name : skinDef),
                                    matrix : matrix,
                                    scaleX : scaleX,
                                    scaleY : scaleY,
                                    name: skinDef
                                });
                            }

                            boneActorSkin.setDefaultSkinInfoByName(slotInfo.attachment);
                        }
                    } else {
                        console.log("Unknown bone to apply skin: " + slotInfo.bone);
                    }
                }

                return this;
            },

            setAnimation: function (name, animationDuration ) {

                this.animationDuration= animationDuration||0;

                var animationInfo = this.skeleton.getAnimationDataByName(name);
                if (!animationInfo) {
                    return;
                }

                var animationSlots = animationInfo.slots;
                for (var animationSlot in animationSlots) {
                    var attachments = animationSlots[animationSlot].attachment;
                    var boneActor = this.skinByName[ animationSlot ];
                    if (boneActor) {
                        boneActor.emptySkinDataKeyframe();
                        for (var i = 0, l = attachments.length - 1; i < l; i += 1) {
                            var start = attachments[i].time;
                            var len = attachments[i + 1].time - attachments[i].time;
                            boneActor.addSkinDataKeyframe(attachments[i].name, start, len);
                        }
                    } else {
                        console.log("Adding skinDataKeyframe to unkown boneActor: " + animationSlot);
                    }
                }

                return this;
            },

            getBoneActorById : function( id ) {
                return this.skinByName[id];
            },

            addAttachment : function( slotId, normalized_x, normalized_y, callback ) {
                var slotBoneActor= this.getBoneActorById(slotId);
                if ( slotBoneActor ) {
                    slotBoneActor.addAttachment(slotId,normalized_x,normalized_y,callback);
                }
            }
        }
    }
});