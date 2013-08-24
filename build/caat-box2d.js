/*
The MIT License

Copyright (c) 2010-2011-2012 Ibon Tolosana [@hyperandroid]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

Version: 0.6 build: 5

Created on:
DATE: 2013-07-01
TIME: 04:58:33
*/


CAAT.Module({

    /**
     * @name Box2D
     * @memberOf CAAT.Foundation
     * @namespace
     */

    /**
     * @name B2DBodyActor
     * @memberOf CAAT.Foundation.Box2D
     * @extends CAAT.Foundation.Actor
     * @constructor
     */

    defines:"CAAT.Foundation.Box2D.B2DBodyActor",
    depends:[
        "CAAT.Foundation.Actor"
    ],
    aliases : ["CAAT.B2DBodyActor"],
    extendsClass:"CAAT.Foundation.Actor",
    extendsWith:function () {

        /**
         * @lends CAAT
         */

        /**
         * Points to Meter ratio value.
         * @type {Number}
         */
        CAAT.PMR = 64;

        /**
         * (As Eemeli Kelokorpi suggested)
         *
         * Enable Box2D debug renderer.
         *
         * @param set {boolean} enable or disable
         * @param director {CAAT.Foundation.Director}
         * @param world {object} box2d world
         * @param scale {numner} a scale value.
         */
        CAAT.enableBox2DDebug = function (set, director, world, scale) {

            if (set) {
                var debugDraw = new Box2D.Dynamics.b2DebugDraw();
                try {
                    debugDraw.m_sprite.graphics.clear = function () {
                    };
                } catch (e) {
                }

                world.SetDebugDraw(debugDraw);

                debugDraw.SetSprite(director.ctx);
                debugDraw.SetDrawScale(scale || CAAT.PMR);
                debugDraw.SetFillAlpha(.5);
                debugDraw.SetLineThickness(1.0);
                debugDraw.SetFlags(0x0001 | 0x0002);

            } else {
                world.SetDebugDraw(null);
            }
        };

        return {

            /**
             * @lends CAAT.Foundation.Box2D.B2DBodyActor.prototype
             */

            /**
             * Body restitution.
             */
            restitution:.5,

            /**
             * Body friction.
             */
            friction:.5,

            /**
             * Body dentisy
             */
            density:1,

            /**
             * Dynamic bodies by default
             */
            bodyType:Box2D.Dynamics.b2Body.b2_dynamicBody,

            /**
             * Box2D body
             */
            worldBody:null,

            /**
             * Box2D world reference.
             */
            world:null,

            /**
             * Box2d fixture
             */
            worldBodyFixture:null,

            /**
             * Box2D body definition.
             */
            bodyDef:null,

            /**
             * Box2D fixture definition.
             */
            fixtureDef:null,

            /**
             * BodyData object linked to the box2D body.
             */
            bodyData:null,

            /**
             * Recycle this actor when the body is not needed anymore ??
             */
            recycle:false,

            __init : function() {
                this.__super();
                this.setPositionAnchor(.5,.5);

                return this;
            },

            setPositionAnchor : function( ax, ay ) {
                this.tAnchorX= .5;
                this.tAnchorY= .5;
            },

            setPositionAnchored : function(x,y,ax,ay) {
                this.x= x;
                this.y= y;
                this.tAnchorX= .5;
                this.tAnchorY= .5;
            },

            /**
             * set this actor to recycle its body, that is, do not destroy it.
             */
            setRecycle:function () {
                this.recycle = true;
                return this;
            },
            destroy:function () {

                CAAT.Foundation.Box2D.B2DBodyActor.superclass.destroy.call(this);
                if (this.recycle) {
                    this.setLocation(-Number.MAX_VALUE, -Number.MAX_VALUE);
                    this.setAwake(false);
                } else {
                    var body = this.worldBody;
                    body.DestroyFixture(this.worldBodyFixture);
                    this.world.DestroyBody(body);
                }

                return this;
            },
            setAwake:function (bool) {
                this.worldBody.SetAwake(bool);
                return this;
            },
            setSleepingAllowed:function (bool) {
                this.worldBody.SetSleepingAllowed(bool);
                return this;
            },
            setLocation:function (x, y) {
                this.worldBody.SetPosition(
                    new Box2D.Common.Math.b2Vec2(
                        x / CAAT.PMR,
                        y / CAAT.PMR));
                return this;
            },
            /**
             * Set this body's
             * density.
             * @param d {number}
             */
            setDensity:function (d) {
                this.density = d;
                return this;
            },

            /**
             * Set this body's friction.
             * @param f {number}
             */
            setFriction:function (f) {
                this.friction = f;
                return this;
            },

            /**
             * Set this body's restitution coeficient.
             * @param r {number}
             */
            setRestitution:function (r) {
                this.restitution = r;
                return this;
            },

            /**
             * Set this body's type:
             * @param bodyType {Box2D.Dynamics.b2Body.b2_*}
             */
            setBodyType:function (bodyType) {
                this.bodyType = bodyType;
                return this;
            },

            /**
             * Helper method to check whether this js object contains a given property and if it doesn't exist
             * create and set it to def value.
             * @param obj {object}
             * @param prop {string}
             * @param def {object}
             */
            check:function (obj, prop, def) {
                if (!obj[prop]) {
                    obj[prop] = def;
                }
            },

            /**
             * Create an actor as a box2D body binding, create it on the given world and with
             * the initialization data set in bodyData object.
             * @param world {Box2D.Dynamics.b2World} a Box2D world instance
             * @param bodyData {object} An object with body info.
             */
            createBody:function (world, bodyData) {

                if (bodyData) {
                    this.check(bodyData, 'density', 1);
                    this.check(bodyData, 'friction', .5);
                    this.check(bodyData, 'restitution', .2);
                    this.check(bodyData, 'bodyType', Box2D.Dynamics.b2Body.b2_staticBody);
                    this.check(bodyData, 'userData', {});
                    this.check(bodyData, 'image', null);

                    this.density = bodyData.density;
                    this.friction = bodyData.friction;
                    this.restitution = bodyData.restitution;
                    this.bodyType = bodyData.bodyType;
                    this.image = bodyData.image;

                }

                this.world = world;

                return this;
            },

            /**
             * Get this body's center on screen regardless of its shape.
             * This method will return box2d body's centroid.
             */
            getCenter:function () {
                return this.worldBody.GetPosition();
            },

            /**
             * Get a distance joint's position on pixels.
             */
            getDistanceJointLocalAnchor:function () {
                return new Box2D.Common.Math.b2Vec2(0,0);
            },

            /**
             * Method override to get position and rotation angle from box2d body.
             * @param director {CAAT.Director}
             * @param time {number}
             */
            animate: function(director, time) {

                var pos= this.worldBody.GetPosition();

                CAAT.Foundation.Actor.prototype.setLocation.call(
                        this,
                        CAAT.PMR*pos.x,
                        CAAT.PMR*pos.y);

                this.setRotation( this.worldBody.GetAngle() );

                return CAAT.Foundation.Box2D.B2DBodyActor.superclass.animate.call(this,director,time);
            }
        }
    }
});
CAAT.Module( {

    /**
     * @name B2DCircularBody
     * @memberOf CAAT.Foundation.Box2D
     * @extends CAAT.Foundation.Box2D.B2DBodyActor
     * @constructor
     */

    defines : "CAAT.Foundation.Box2D.B2DCircularBody",
    depends : [
        "CAAT.Foundation.Box2D.B2DBodyActor"
    ],
    aliases : ["CAAT.B2DCircularBody"],
    extendsClass : "CAAT.Foundation.Box2D.B2DBodyActor",
    constants : {

        /**
         * @lends CAAT.Foundation.Box2D.B2DCircularBody
         */

        createCircularBody : function(world, bodyData) {
            if ( bodyData.radius )  this.radius= bodyData.radius;

            var fixDef=             new Box2D.Dynamics.b2FixtureDef();
            fixDef.density=         bodyData.density;
            fixDef.friction=        bodyData.friction;
            fixDef.restitution=     bodyData.restitution;
            fixDef.shape =          new Box2D.Collision.Shapes.b2CircleShape(bodyData.radius/CAAT.PMR);

            var bodyDef =           new Box2D.Dynamics.b2BodyDef();
            bodyDef.type =          bodyData.bodyType;
            bodyDef.position.Set( bodyData.x/CAAT.PMR, bodyData.y/CAAT.PMR );

            // link entre cuerpo fisico box2d y caat.
            fixDef.userData=        bodyData.userData;
            bodyDef.userData=       bodyData.userData;

            var worldBody=          world.CreateBody(bodyDef);
            var worldBodyFixture=   worldBody.CreateFixture(fixDef);

            if ( bodyData.isSensor ) {
                worldBodyFixture.SetSensor(true);
            }

            return {
                worldBody:          worldBody,
                worldBodyFixture:   worldBodyFixture,
                fixDef:             fixDef,
                bodyDef:            bodyDef
            };
        }
    },
    extendsWith : {

        /**
         * @lends CAAT.Foundation.Box2D.B2DCircularBody.prototype
         */


        /**
         * Default radius.
         */
        radius: 1,

        /**
         * Create a box2d body and link it to this CAAT.Actor instance.
         * @param world {Box2D.Dynamics.b2World} a Box2D world instance
         * @param bodyData {object}
         */
        createBody : function(world, bodyData) {

            var scale= (bodyData.radius || 1);
            scale= scale+ (bodyData.bodyDefScaleTolerance || 0)*Math.random();
            bodyData.radius= scale;

            CAAT.Foundation.Box2D.B2DCircularBody.superclass.createBody.call(this,world,bodyData);
            var box2D_data= CAAT.Foundation.Box2D.B2DCircularBody.createCircularBody(world,bodyData);

            bodyData.userData.actor=         this;

            this.worldBody=         box2D_data.worldBody;
            this.worldBodyFixture=  box2D_data.worldBodyFixture;
            this.fixtureDef=        box2D_data.fixDef;
            this.bodyDef=           box2D_data.bodyDef;
            this.bodyData=          bodyData;

            this.setFillStyle(this.worldBodyFixture.IsSensor() ? 'red' : 'green').
                    setBackgroundImage(this.image).
                    setSize(2*bodyData.radius,2*bodyData.radius).
                    setImageTransformation(CAAT.Foundation.SpriteImage.TR_FIXED_TO_SIZE);


            return this;
        }
    }

});
CAAT.Module( {

    /**
     * @name B2DPolygonBody
     * @memberOf CAAT.Foundation.Box2D
     * @extends CAAT.Foundation.Box2D.B2DBodyActor
     * @constructor
     */

    defines : "CAAT.Foundation.Box2D.B2DPolygonBody",
    depends : [
        "CAAT.Foundation.Box2D.B2DBodyActor",
        "CAAT.Foundation.SpriteImage"
    ],
    aliases : ["CAAT.B2DPolygonBody"],
    constants: {

        /**
         * @lends CAAT.Foundation.Box2D.B2DPolygonBody
         */

        TYPE: {
            EDGE:   'edge',
            BOX:    'box',
            POLYGON:'polygon'
        },

        /**
         * Helper function to aid in box2d polygon shaped bodies.
         * @param world
         * @param bodyData
         */
        createPolygonBody : function(world, bodyData) {
            var fixDef = new Box2D.Dynamics.b2FixtureDef();
            fixDef.density = bodyData.density;
            fixDef.friction = bodyData.friction;
            fixDef.restitution = bodyData.restitution;
            fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();

            var minx = Number.MAX_VALUE;
            var maxx = -Number.MAX_VALUE;
            var miny = Number.MAX_VALUE;
            var maxy = -Number.MAX_VALUE;

            var vec = [];

            var scale = (bodyData.bodyDefScale || 1);
            scale = scale + (bodyData.bodyDefScaleTolerance || 0) * Math.random();

            for (var i = 0; i < bodyData.bodyDef.length; i++) {
                var x = bodyData.bodyDef[i].x * scale;
                var y = bodyData.bodyDef[i].y * scale;
                if (x < minx) {
                    minx = x;
                }
                if (x > maxx) {
                    maxx = x;
                }
                if (y < miny) {
                    miny = y;
                }
                if (y > maxy) {
                    maxy = y;
                }
/*
                x += bodyData.x || 0;
                y += bodyData.y || 0;
                */
                vec.push(new Box2D.Common.Math.b2Vec2(x / CAAT.PMR, y / CAAT.PMR));
            }

            var boundingBox = [
                {x:minx, y:miny},
                {x:maxx, y:maxy}
            ];

            var bodyDef = new Box2D.Dynamics.b2BodyDef();
            bodyDef.type = bodyData.bodyType;
            bodyDef.position.Set(
                ((maxx - minx) / 2 + (bodyData.x || 0)) / CAAT.PMR,
                ((maxy - miny) / 2 + (bodyData.y || 0)) / CAAT.PMR );

            if (bodyData.polygonType === CAAT.Foundation.Box2D.B2DPolygonBody.TYPE.EDGE) {

                var v0= new Box2D.Common.Math.b2Vec2(vec[0].x, vec[0].y );
                var v1= new Box2D.Common.Math.b2Vec2(vec[1].x-vec[0].x, vec[1].y-vec[0].y );

                bodyDef.position.Set(v0.x, v0.y);
                fixDef.shape.SetAsEdge(new Box2D.Common.Math.b2Vec2(0,0), v1);


            } else if (bodyData.polygonType === CAAT.Foundation.Box2D.B2DPolygonBody.TYPE.BOX) {

                fixDef.shape.SetAsBox(
                    (maxx - minx) / 2 / CAAT.PMR,
                    (maxy - miny) / 2 / CAAT.PMR);

            } else if (bodyData.polygonType === CAAT.Foundation.Box2D.B2DPolygonBody.TYPE.POLYGON ) {

                fixDef.shape.SetAsArray(vec, vec.length);

            } else {
                throw 'Unkown bodyData polygonType: '+bodyData.polygonType;
            }

            // link entre cuerpo fisico box2d y caat.
            fixDef.userData = bodyData.userData;
            bodyDef.userData = bodyData.userData;

            var worldBody = world.CreateBody(bodyDef);
            var worldBodyFixture = worldBody.CreateFixture(fixDef);


            if (bodyData.isSensor) {
                worldBodyFixture.SetSensor(true);
            }

            return {
                worldBody:          worldBody,
                worldBodyFixture:   worldBodyFixture,
                fixDef:             fixDef,
                bodyDef:            bodyDef,
                boundingBox:        boundingBox
            };
        }
    },
    extendsClass : "CAAT.Foundation.Box2D.B2DBodyActor",
    extendsWith : {

        /**
         * @lends CAAT.Foundation.Box2D.B2DPolygonBody.prototype
         */

        /**
         * Measured body's bounding box.
         */
        boundingBox: null,

        /**
         * Get on-screen distance joint coordinate.
         */
        getDistanceJointLocalAnchor : function() {
            var b= this.worldBody;
            var poly= b.GetFixtureList().GetShape().GetLocalCenter();
            return poly;
        },

        /**
         * Create a box2d body and link it to this CAAT.Actor.
         * @param world {Box2D.Dynamics.b2World}
         * @param bodyData {object}
         */
        createBody : function(world, bodyData) {
            CAAT.Foundation.Box2D.B2DPolygonBody.superclass.createBody.call(this,world,bodyData);

            var box2D_data= CAAT.Foundation.Box2D.B2DPolygonBody.createPolygonBody(world,bodyData);

            bodyData.userData.actor = this;

            this.worldBody=         box2D_data.worldBody;
            this.worldBodyFixture=  box2D_data.worldBodyFixture;
            this.fixtureDef=        box2D_data.fixDef;
            this.bodyDef=           box2D_data.bodyDef;
            this.bodyData=          bodyData;
            this.boundingBox=       box2D_data.boundingBox;

            this.setBackgroundImage( bodyData.image ).
                setSize(
                    box2D_data.boundingBox[1].x-box2D_data.boundingBox[0].x+1,
                    box2D_data.boundingBox[1].y-box2D_data.boundingBox[0].y+1 ).
                setFillStyle( box2D_data.worldBodyFixture.IsSensor() ? '#0f0' : '#f00').
                setImageTransformation(CAAT.Foundation.SpriteImage.TR_FIXED_TO_SIZE);

            return this;
        }
    }

});
CAAT.ModuleManager.solveAll();
