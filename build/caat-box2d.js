/*
The MIT License

Copyright (c) 2010-2011 Ibon Tolosana [@hyperandroid]

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

Version: 0.1 build: 54

Created on:
DATE: 2011-10-27
TIME: 23:45:04
*/


/**
 * See LICENSE file.
 *
 * Box2D actors.
 */

(function() {

    /**
     *
     * Define a binding beween a box2D Body instance and a CAAT.Actor.
     * This function object should not be directly instantiated.
     * By now, one Box2D body can contain one single fixture and shape.
     *
     * @constructor
     */
    CAAT.B2DBodyActor= function() {
        CAAT.B2DBodyActor.superclass.constructor.call(this);
        return this;
    };

    CAAT.B2DBodyActor.prototype= {

        /**
         * Body restitution.
         */
        restitution:        .5,

        /**
         * Body friction.
         */
        friction:           .5,

        /**
         * Body dentisy
         */
        density:            1,

        /**
         * Dynamic bodies by default
         */
        bodyType:           Box2D.Dynamics.b2Body.b2_dynamicBody,

        /**
         * Box2D body
         */
        worldBody:          null,

        world:              null,

        /**
         * Box2d fixture
         */
        worldBodyFixture:   null,
        bodyDef:            null,
        fixtureDef:         null,

        /**
         * BodyData object linked to the box2D body.
         */
        bodyData:           null,

        recycle:            false,

        /**
         * set this actor to recycle its body, that is, do not destroy it.
         */
        setRecycle : function() {
            this.recycle= true;
            return this;
        },
        destroy : function() {

            CAAT.B2DBodyActor.superclass.destroy.call(this);
            if ( this.recycle ) {
                this.setLocation(-Number.MAX_VALUE, -Number.MAX_VALUE);
                this.setAwake(false);
            } else {
                var body= this.worldBody;
                body.DestroyFixture( this.worldBodyFixture );
                this.world.DestroyBody(body);
            }

            return this;
        },
        setAwake : function( bool ) {
            this.worldBody.SetAwake(bool);
            return this;
        },
        setSleepingAllowed : function(bool) {
            this.worldBody.SetSleepingAllowed(bool);
            return this;
        },
        setLocation : function(x,y) {
            this.worldBody.SetPosition(
                new Box2D.Common.Math.b2Vec2(
                    (x+this.width/2)/CAAT.PMR,
                    (y+this.height/2)/CAAT.PMR) );
            return this;
        },
        /**
         * Set this body's
         * density.
         * @param d {number}
         */
        setDensity : function(d) {
            this.density= d;
            return this;
        },

        /**
         * Set this body's friction.
         * @param f {number}
         */
        setFriction : function(f) {
            this.friction= f;
            return this;
        },

        /**
         * Set this body's restitution coeficient.
         * @param r {number}
         */
        setRestitution : function(r) {
            this.restitution= r;
            return this;
        },

        /**
         * Set this body's type:
         * @param bodyType {Box2D.Dynamics.b2Body.b2_*}
         */
        setBodyType : function(bodyType) {
            this.bodyType= bodyType;
            return this;
        },

        /**
         * Helper method to check whether this js object contains a given property and if it doesn't exist
         * create and set it to def value.
         * @param obj {object}
         * @param prop {string}
         * @param def {object}
         */
        check : function(obj, prop, def) {
            if ( !obj[prop] ) {
                obj[prop]= def;
            }
        },

        /**
         * Create an actor as a box2D body binding, create it on the given world and with
         * the initialization data set in bodyData object.
         * @param world {Box2D.Dynamics.b2World} a Box2D world instance
         * @param bodyData {object} An object with body info.
         */
        createBody : function(world, bodyData) {

            if ( bodyData ) {
                this.check( bodyData, 'density', 1 );
                this.check( bodyData, 'friction', .5 );
                this.check( bodyData, 'restitution', .2 );
                this.check( bodyData, 'bodyType', Box2D.Dynamics.b2Body.b2_staticBody );
                this.check( bodyData, 'userData', {} );
                this.check( bodyData, 'image', null );

                this.density=       bodyData.density;
                this.friction=      bodyData.friction;
                this.restitution=   bodyData.restitution;
                this.bodyType=      bodyData.bodyType;
                this.image=         bodyData.image;

            }

            this.world= world;

            return this;
        },

        /**
         * Get this body's center on screen regardless of its shape.
         * This method will return box2d body's centroid.
         */
        getCenter : function() {
            return {x:0, y:0};
        },

        /**
         * Get a distance joint's position on pixels.
         */
        getDistanceJointLocalAnchor : function() {
            return {x:0, y:0};
        }
    };

    extend( CAAT.B2DBodyActor, CAAT.Actor );

})();

(function() {

    /**
     *
     * Create a polygon shaped body in box2D and its CAAT.Actor counterpart.
     *
     * @constructor
     */
    CAAT.B2DPolygonBody= function() {
        CAAT.B2DPolygonBody.superclass.constructor.call(this);
        return this;
    };

    /**
     *
     * Define different types of polygon body types.
     *
     * @enum
     */
    CAAT.B2DPolygonBody.Type= {
        EDGE:   'edge',
        BOX:    'box',
        POLYGON:'polygon'
    };

    CAAT.B2DPolygonBody.prototype= {

        /**
         * Measured body's bounding box.
         */
        boundingBox: null,

        /**
         * Get on-screen distance joint coordinate.
         */
        getDistanceJointLocalAnchor : function() {
            var b= this.worldBody;
            var xf= b.m_xf;
            var poly= b.GetFixtureList().GetShape();
            return poly.m_centroid;
        },

        /**
         * Get this polygon's centroid on screen coordinates.
         */
        getCenter : function() {
            var b= this.worldBody;
            var xf= b.m_xf;
            var poly= b.GetFixtureList().GetShape();
            return Box2D.Common.Math.b2Math.MulX(xf, poly.m_centroid);
        },

        /**
         * Method override to get position and rotation angle from box2d body.
         * @param director {CAAT.Director}
         * @param time {number}
         */
        animate: function(director, time) {

            var b= this.worldBody;
            var xf= b.m_xf;

            var poly= this.worldBodyFixture.GetShape();
            if ( poly ) {
                var v= Box2D.Common.Math.b2Math.MulX(xf, poly.m_centroid);
                //this.setLocation(
                CAAT.Actor.prototype.setLocation.call( this,
                        v.x*CAAT.PMR - this.width/2,
                        v.y*CAAT.PMR - this.height/2 );
                this.setRotation( b.GetAngle() );
            }
            
            return CAAT.B2DPolygonBody.superclass.animate.call(this,director,time);
        },

        /**
         * Create a box2d body and link it to this CAAT.Actor.
         * @param world {Box2D.Dynamics.b2World}
         * @param bodyData {object}
         */
        createBody : function(world, bodyData) {
            CAAT.B2DPolygonBody.superclass.createBody.call(this,world,bodyData);

            var box2D_data= CAAT.B2DPolygonBody.createPolygonBody(world,bodyData);

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
                setFillStyle( box2D_data.worldBodyFixture.IsSensor() ? 'red' : 'green').
                setImageTransformation(CAAT.ImageActor.prototype.TR_FIXED_TO_SIZE);

            return this;
        }
    };

    /**
     * Helper function to aid in box2d polygon shaped bodies.
     * @param world
     * @param bodyData
     */
    CAAT.B2DPolygonBody.createPolygonBody= function(world, bodyData) {
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

            x += bodyData.x || 0;
            y += bodyData.y || 0;
            vec.push(new Box2D.Common.Math.b2Vec2(x / CAAT.PMR, y / CAAT.PMR));
        }

        var boundingBox = [
            {x:minx, y:miny},
            {x:maxx, y:maxy}
        ];

        var bodyDef = new Box2D.Dynamics.b2BodyDef();
        bodyDef.type = bodyData.bodyType;

        if (bodyData.polygonType === CAAT.B2DPolygonBody.Type.EDGE) {

            fixDef.shape.SetAsEdge(vec[0], vec[1]);

        } else if (bodyData.polygonType === CAAT.B2DPolygonBody.Type.BOX) {

            fixDef.shape.SetAsBox(
                (maxx - minx) / 2 / CAAT.PMR,
                (maxy - miny) / 2 / CAAT.PMR);
            bodyDef.position.x = ((maxx - minx) / 2 + (bodyData.x || 0)) / CAAT.PMR;
            bodyDef.position.y = ((maxy - miny) / 2 + (bodyData.y || 0)) / CAAT.PMR;

        } else if (bodyData.polygonType === CAAT.B2DPolygonBody.Type.POLYGON ) {

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
    };

    extend( CAAT.B2DPolygonBody, CAAT.B2DBodyActor );
})();

(function() {

    /**
     *
     * Create a box2d circular body.
     *
     * @constructor
     */
    CAAT.B2DCircularBody= function() {
        CAAT.B2DCircularBody.superclass.constructor.call(this);
        return this;
    };

    CAAT.B2DCircularBody.prototype= {

        /**
         * Default radius.
         */
        radius: 1,

        /**
         * Get a given dinstance joint's local anchor position.
         * For a circular body, it is its center.
         */
        getDistanceJointLocalAnchor : function() {
            return new Box2D.Common.Math.b2Vec2(0,0);
        },

        /**
         * Get this box2d body's center position on screen.
         */
        getCenter : function() {
            return this.worldBody.m_xf.position;
        },

        /**
         * Method override to get position and rotation angle from box2d body.
         * @param director {CAAT.Director}
         * @param time {number}
         */
        animate: function(director, time) {

            var b= this.worldBody;
            var xf= b.m_xf;
            //this.setLocation(
            CAAT.Actor.prototype.setLocation.call( this,
                    CAAT.PMR*xf.position.x - this.width/2,
                    CAAT.PMR*xf.position.y - this.height/2 );
            this.setRotation( b.GetAngle() );

            return CAAT.B2DCircularBody.superclass.animate.call(this,director,time);
        },

        /**
         * Create a box2d body and link it to this CAAT.Actor instance.
         * @param world {Box2D.Dynamics.b2World} a Box2D world instance
         * @param bodyData {object}
         */
        createBody : function(world, bodyData) {

            var scale= (bodyData.radius || 1);
            scale= scale+ (bodyData.bodyDefScaleTolerance || 0)*Math.random();
            bodyData.radius= scale;

            CAAT.B2DCircularBody.superclass.createBody.call(this,world,bodyData);

            if ( bodyData.radius )  this.radius= bodyData.radius;

            var fixDef=             new Box2D.Dynamics.b2FixtureDef();
            fixDef.density=         this.density;
            fixDef.friction=        this.friction;
            fixDef.restitution=     this.restitution;
            fixDef.shape =          new Box2D.Collision.Shapes.b2CircleShape(this.radius/CAAT.PMR);

            var bodyDef =           new Box2D.Dynamics.b2BodyDef();
            bodyDef.type =          this.bodyType;
            bodyDef.position.x=     bodyData.x/CAAT.PMR;
            bodyDef.position.y=     bodyData.y/CAAT.PMR;

            // link entre cuerpo fisico box2d y caat.
            bodyData.userData.actor=         this;
            fixDef.userData=        bodyData.userData;
            bodyDef.userData=       bodyData.userData;

            var worldBody=          world.CreateBody(bodyDef);
            var worldBodyFixture=   worldBody.CreateFixture(fixDef);

            if ( bodyData.isSensor ) {
                worldBodyFixture.SetSensor(true);
            }

            this.worldBody=         worldBody;
            this.worldBodyFixture=  worldBodyFixture;
            this.fixtureDef=        fixDef;
            this.bodyDef=           bodyDef;
            this.bodyData=          bodyData;


            this.setFillStyle(this.worldBodyFixture.IsSensor() ? 'red' : 'blue').
                    setBackgroundImage(this.image).
                    setSize(2*this.radius,2*this.radius).
                    setImageTransformation(CAAT.ImageActor.prototype.TR_FIXED_TO_SIZE);


            return this;
        }
    };

    extend( CAAT.B2DCircularBody, CAAT.B2DBodyActor );
})();


