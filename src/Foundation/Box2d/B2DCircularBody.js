CAAT.Module( {
    defines : "CAAT.Foundation.Box2D.B2DCircularBody",
    depends : [
        "CAAT.Foundation.Box2D.B2DBodyActor"
    ],
    extendsClass : "CAAT.Foundation.Box2D.B2DBodyActor",
    extendsWith : {

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
            CAAT.Foundation.Actor.prototype.setLocation.call( this,
                    CAAT.PMR*xf.position.x - this.width/2,
                    CAAT.PMR*xf.position.y - this.height/2 );
            this.setRotation( b.GetAngle() );

            return CAAT.Foundation.Box2D.B2DCircularBody.superclass.animate.call(this,director,time);
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

            CAAT.Foundation.Box2D.B2DCircularBody.superclass.createBody.call(this,world,bodyData);

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
                    setImageTransformation(CAAT.Foundation.SpriteImage.TR_FIXED_TO_SIZE);


            return this;
        }
    }

});
