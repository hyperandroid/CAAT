CAAT.Module({

    /**
     * @name SkeletonActor
     * @memberof CAAT.Module.Skeleton.prototype
     * @constructor
     */

    defines: "CAAT.Module.Skeleton.SkeletonActor",
    extendsClass: "CAAT.Foundation.ActorContainer",
    depends: [
        "CAAT.Module.Skeleton.Skeleton",
        "CAAT.Module.Skeleton.BoneActor",
        "CAAT.Foundation.ActorContainer"
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
             * @type CAAT.Math.BoundingBox
             */
            skeletonBoundingBox: null,

            /**
             * Currently selected animation play time.
             * Zero to make it last for its default value.
             * @type number
             */
            animationDuration : 0,

            __init: function (director, skeleton) {
                this.__super();

                this.director = director;
                this.skeleton = skeleton;
                this.slotInfo = {};
                this.slotInfoArray = [];
                this.skinByName = {};

                this.skeletonBoundingBox = new CAAT.Math.Rectangle();

                this.setSkin();
                this.setAnimation("default");

                return this;
            },

            showBones: function (show) {
                this._showBones = show;
                return this;
            },

            animate: function (director, time) {
                this.skeleton.calculate( time, this.animationDuration );
                return CAAT.Module.Skeleton.SkeletonActor.superclass.animate.call( this, director, time );
            },

            postPaint: function (director, time) {

                if (!this._showBones || !this.skeleton) {
                    return;
                }

                this.skeleton.paint(this.worldModelViewMatrix, director.ctx);
            },

            calculateBoundingBox: function () {
                this.skeletonBoundingBox.setEmpty();
            },

            setSkin: function (skin) {

                this.emptyChildren();
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
                            var boneActorSkin = new CAAT.Skeleton.BoneActor();
                            boneActorSkin.id = slotInfo.name;
                            boneActorSkin.setBone(bone);

                            this.addChild(boneActorSkin);
                            this.skinByName[slotInfo.name] = boneActorSkin;

                            // add skining info for each slot data.
                            for (var skinDef in skinData) {
                                var skinInfo = skinData[skinDef];
                                boneActorSkin.addSkinInfo({
                                    angle: -(skinInfo.rotation || 0) * 2 * Math.PI / 360,
                                    x: skinInfo.x,
                                    y: -skinInfo.y,
                                    width: skinInfo.width,
                                    height: skinInfo.height,
                                    image: this.director.getImage(skinData[skinDef].name ? skinData[skinDef].name : skinDef),
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
            }

        }
    }
});