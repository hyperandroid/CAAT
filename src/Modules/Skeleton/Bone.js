/**
 * Created with JetBrains WebStorm.
 * User: ibon
 * Date: 3/21/13
 * Time: 7:51 PM
 * To change this template use File | Settings | File Templates.
 */
CAAT.Module({
    defines : "CAAT.Module.Skeleton.Bone",
    depends : [
        "CAAT.Behavior.Interpolator",
        "CAAT.Behavior.RotateBehavior",
        "CAAT.Behavior.PathBehavior",
        "CAAT.Behavior.ScaleBehavior",
        "CAAT.Behavior.ContainerBehavior"
    ],
    extendsWith : function() {

        var defPoint = { x: 0, y: 0 };
        var defScale = { scaleX: 1, scaleY: 1 };
        var defAngle = 0;

        var cangle;
        var cscale;
        var cpoint;

        return {
            id : null,

            wx : 0,
            wy : 0,
            wrotationAngle : 0,
            wscaleX : 0,
            wscaleY : 0,

            /**
             * Bone x position relative parent
             * @type number
             */
            x : 0,

            /**
             * Bone y position relative parent
             * @type {number}
             */
            y : 0,

            positionAnchorX : 0,
            positionAnchorY : 0,

            /**
             * Bone rotation angle
             * @type {number}
             */
            rotationAngle : 0,
            rotationAnchorX : 0,
            rotationAnchorY : 0.5,

            scaleX : 1,
            scaleY : 1,
            scaleAnchorX : .5,
            scaleAnchorY : .5,

            /**
             * Bone size.
             * @type number
             */
            size : 0,

            /**
             * @type CAAT.Math.Matrix
             */
            matrix : null,

            /**
             * @type CAAT.Math.Matrix
             */
            wmatrix : null,

            /**
             * @type CAAT.Skeleton.Bone
             */
            parent : null,

            /**
             * @type CAAT.Behavior.ContainerBehavior
             */
            keyframesTranslate : null,

            /**
             * @type CAAT.PathUtil.Path
             */
            keyframesTranslatePath : null,

            /**
             * @type CAAT.Behavior.ContainerBehavior
             */
            keyframesScale : null,

            /**
             * @type CAAT.Behavior.ContainerBehavior
             */
            keyframesRotate : null,

            /**
             * @type Array.<CAAT.Skeleton.Bone>
             */
            children : null,

            __init : function(id) {
                this.id= id;
                this.matrix= new CAAT.Math.Matrix();
                this.wmatrix= new CAAT.Math.Matrix();
                this.parent= null;
                this.children= [];
                this.keyframesTranslate= new CAAT.Behavior.ContainerBehavior(true).setCycle(true).setId("keyframes_tr");
                this.keyframesScale= new CAAT.Behavior.ContainerBehavior(true).setCycle(true).setId("keyframes_sc");
                this.keyframesRotate= new CAAT.Behavior.ContainerBehavior(true).setCycle(true).setId("keyframes_rt");

                function fntr(behavior, orgtime, time, actor, value) {
                    cpoint= value;
                }

                function fnsc(behavior, orgtime, time, actor, value) {
                    cscale= value;
                }

                function fnrt(behavior, orgtime, time, actor, value) {
                    cangle= value;
                }

                this.keyframesTranslate.addListener( { behaviorApplied : fntr });
                this.keyframesScale.addListener( { behaviorApplied : fnsc });
                this.keyframesRotate.addListener( { behaviorApplied : fnrt });

                return this;
            },

            /**
             *
             * @param parent {CAAT.Skeleton.Bone}
             * @returns {*}
             */
            __setParent : function( parent ) {
                this.parent= parent;
                return this;
            },

            addBone : function( bone ) {
                this.children.push(bone);
                bone.__setParent(this);
                return this;
            },

            __noValue : function( keyframes ) {
                keyframes.doValueApplication= false;
                if ( keyframes instanceof CAAT.Behavior.ContainerBehavior ) {
                    this.__noValue( keyframes );
                }
            },

            /**
             *
             * @param keyframes {CAAT.Behavior.ContainerBehavior}
             * @returns {*}
             */
            setTranslationKeyframes : function( keyframes ) {
                this.keyframesTranslate= keyframes;
                this.__noValue( keyframes );
                return this;
            },

            __setInterpolator : function(behavior, curve) {
                if (curve && curve!=="stepped") {
                    behavior.setInterpolator(
                            new CAAT.Behavior.Interpolator().createQuadricBezierInterpolator(
                                    new CAAT.Math.Point(0,0),
                                    new CAAT.Math.Point(curve[0], curve[1]),
                                    new CAAT.Math.Point(curve[2], curve[3])
                            )
                    );
                }
            },

            /**
             *
             * @param angleStart {number} rotation start angle
             * @param angleEnd {number} rotation end angle
             * @param timeStart {number} keyframe start time
             * @param timeEnd {number} keyframe end time
             * @param curve {Array.<number>=} 4 numbers definint a quadric bezier info. two first points
             *  assumed to be 0,0.
             */
            addRotationKeyframe : function( angleStart, angleEnd, timeStart, timeEnd, curve ) {

                var as= 2*Math.PI*angleStart/360;
                var ae= 2*Math.PI*angleEnd/360;

                if ( as<-Math.PI ) {
                    if (Math.abs(as+this.rotationAngle)>2*Math.PI) {
                        as= -(as+Math.PI);
                    } else {
                        as= (as+Math.PI);
                    }
                }

                if ( ae<-Math.PI ) {

                    if (Math.abs(ae+this.rotationAngle)>2*Math.PI) {
                        ae= -(ae+Math.PI);
                    } else {
                        ae= (ae+Math.PI);
                    }
                }

                angleStart= -as;
                angleEnd= -ae;


                var behavior= new CAAT.Behavior.RotateBehavior().
                        setFrameTime( timeStart, timeEnd-timeStart+1).
                        setValues( angleStart, angleEnd, 0, .5).
                        setValueApplication(false);

                this.__setInterpolator( behavior, curve );

                this.keyframesRotate.addBehavior(behavior);
            },

            endRotationKeyframes : function() {

            },

            addTranslationKeyframe : function( startX, startY, endX, endY, timeStart, timeEnd, curve ) {
                var behavior= new CAAT.Behavior.PathBehavior().
                    setFrameTime( timeStart, timeEnd-timeStart+1).
                    setValues( new CAAT.PathUtil.Path().
                        setLinear( startX, startY, endX, endY )
                    ).
                    setValueApplication(false);

                this.__setInterpolator( behavior, curve );

                this.keyframesTranslate.addBehavior( behavior );
            },

            endTranslationKeyframes : function() {

            },

            setSize : function(s) {
                this.width= s;
                this.height= 0;
            },

            endScaleKeyframes : function() {

            },

            /**
             *
             * @param keyframes {CAAT.Behavior.ContainerBehavior}
             * @returns {*}
             */
            setRotationKeyframes : function( keyframes ) {
                this.keyframesRotate= keyframes;
                this.__noValue( keyframes );
                return this;
            },

            /**
             *
             * @param keyframes {CAAT.Behavior.ContainerBehavior}
             * @returns {*}
             */
            setScaleKeyframes : function( keyframes ) {
                this.keyframesScale= keyframes;
                this.__noValue( keyframes );
                return this;
            },

            setPosition : function( x, y ) {
                this.x= x;
                this.y= -y;
                return this;
            } ,

            /**
             * default anchor values are for spine tool.
             * @param angle {number}
             * @param anchorX {number=}
             * @param anchorY {number=}
             * @returns {*}
             */
            setRotateTransform : function( angle, anchorX, anchorY ) {
                this.rotationAngle= -angle*2*Math.PI/360;
                this.rotationAnchorX= typeof anchorX!=="undefined" ? anchorX : 0;
                this.rotationAnchorY= typeof anchorY!=="undefined" ? anchorY : .5;
                return this;
            },

            /**
             *
             * @param sx {number}
             * @param sy {number}
             * @param anchorX {number=} anchorX: .5 by default
             * @param anchorY {number=} anchorY. .5 by default
             * @returns {*}
             */
            setScaleTransform : function( sx, sy, anchorX, anchorY ) {
                this.scaleX= sx;
                this.scaleY= sy;
                this.scaleAnchorX= typeof anchorX!=="undefined" ? anchorX : .5;
                this.scaleAnchorY= typeof anchorY!=="undefined" ? anchorY : .5;
                return this;
            },


            __setModelViewMatrix : function() {
                var c, s, _m00, _m01, _m10, _m11;
                var mm0, mm1, mm2, mm3, mm4, mm5;
                var mm;

                var mm = this.matrix.matrix;

                mm0 = 1;
                mm1 = 0;
                mm3 = 0;
                mm4 = 1;

                mm2 = this.wx - this.positionAnchorX * this.width;
                mm5 = this.wy - this.positionAnchorY * this.height;

                if (this.rotationAngle) {

                    var rx = this.rotationAnchorX * this.width;
                    var ry = this.rotationAnchorY * this.height;

                    mm2 += mm0 * rx + mm1 * ry;
                    mm5 += mm3 * rx + mm4 * ry;

                    c = Math.cos(this.wrotationAngle);
                    s = Math.sin(this.wrotationAngle);
                    _m00 = mm0;
                    _m01 = mm1;
                    _m10 = mm3;
                    _m11 = mm4;
                    mm0 = _m00 * c + _m01 * s;
                    mm1 = -_m00 * s + _m01 * c;
                    mm3 = _m10 * c + _m11 * s;
                    mm4 = -_m10 * s + _m11 * c;

                    mm2 += -mm0 * rx - mm1 * ry;
                    mm5 += -mm3 * rx - mm4 * ry;
                }
                if (this.wscaleX != 1 || this.wscaleY != 1) {

                    var sx = this.scaleAnchorX * this.width;
                    var sy = this.scaleAnchorY * this.height;

                    mm2 += mm0 * sx + mm1 * sy;
                    mm5 += mm3 * sx + mm4 * sy;

                    mm0 = mm0 * this.wscaleX;
                    mm1 = mm1 * this.wscaleY;
                    mm3 = mm3 * this.wscaleX;
                    mm4 = mm4 * this.wscaleY;

                    mm2 += -mm0 * sx - mm1 * sy;
                    mm5 += -mm3 * sx - mm4 * sy;
                }

                mm[0] = mm0;
                mm[1] = mm1;
                mm[2] = mm2;
                mm[3] = mm3;
                mm[4] = mm4;
                mm[5] = mm5;

                if (this.parent) {
                    this.wmatrix.copy(this.parent.wmatrix);
                    this.wmatrix.multiply(this.matrix);
                } else {
                    this.wmatrix.identity();
                }
            },

            /**
             * @param time {number}
             */
            apply : function( time ) {

                cpoint= defPoint;
                cangle= defAngle;
                cscale= defScale;

                this.keyframesTranslate.apply(time);
                this.keyframesRotate.apply(time);
                this.keyframesScale.apply(time);

                this.wx= cpoint.x + this.x;
                this.wy= cpoint.y + this.y;

                this.wrotationAngle = cangle + this.rotationAngle;

                this.wscaleX= cscale.scaleX * this.scaleX;
                this.wscaleY= cscale.scaleY * this.scaleY;

                this.__setModelViewMatrix();

                for( var i=0; i<this.children.length; i++ ) {
                    this.children[i].apply(time);
                }
            },

            transformContext : function(ctx) {
                var m= this.wmatrix.matrix;
                ctx.transform( m[0], m[3], m[1], m[4], m[2], m[5] );
            },

            paint : function( actorMatrix, ctx ) {
                ctx.save();
                    //actorMatrix.transformRenderingContextSet(ctx);
                    this.transformContext(ctx);

                    ctx.strokeStyle= 'red';
                    ctx.beginPath();
                    ctx.moveTo(0,0);
                    ctx.lineTo(this.width,this.height);
                    ctx.stroke();
                ctx.restore();

                for( var i=0; i<this.children.length; i++ ) {
                    this.children[i].paint(actorMatrix, ctx);
                }


            }
        }
    }
});