CAAT.Module( {
    defines : "CAAT.Foundation.Box2D.B2DPolygonBody",
    depends : [
        "CAAT.Foundation.Box2D.B2DBodyActor",
        "CAAT.Foundation.SpriteImage"
    ],
    constants: {
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

            if (bodyData.polygonType === CAAT.Foundation.Box2D.B2DPolygonBody.TYPE.EDGE) {

                fixDef.shape.SetAsEdge(vec[0], vec[1]);

            } else if (bodyData.polygonType === CAAT.Foundation.Box2D.B2DPolygonBody.TYPE.BOX) {

                fixDef.shape.SetAsBox(
                    (maxx - minx) / 2 / CAAT.PMR,
                    (maxy - miny) / 2 / CAAT.PMR);
                bodyDef.position.x = ((maxx - minx) / 2 + (bodyData.x || 0)) / CAAT.PMR;
                bodyDef.position.y = ((maxy - miny) / 2 + (bodyData.y || 0)) / CAAT.PMR;

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
                CAAT.Foundation.Actor.prototype.setLocation.call( this,
                        v.x*CAAT.PMR - this.width/2,
                        v.y*CAAT.PMR - this.height/2 );
                this.setRotation( b.GetAngle() );
            }
            
            return CAAT.Foundation.Box2D.B2DPolygonBody.superclass.animate.call(this,director,time);
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
                setFillStyle( box2D_data.worldBodyFixture.IsSensor() ? 'red' : 'green').
                setImageTransformation(CAAT.Foundation.SpriteImage.TR_FIXED_TO_SIZE);

            return this;
        }
    }

});
