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
