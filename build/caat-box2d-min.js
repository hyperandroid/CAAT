
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

Version: 0.4 build: 96

Created on:
DATE: 2012-05-10
TIME: 18:35:04
*/


(function(){CAAT.enableBox2DDebug=function(b,a,c){if(b){b=new Box2D.Dynamics.b2DebugDraw;try{b.m_sprite.graphics.clear=function(){}}catch(d){}c.SetDebugDraw(b);b.SetSprite(a.ctx);b.SetDrawScale(CAAT.PMR);b.SetFillAlpha(0.5);b.SetLineThickness(1);b.SetFlags(3)}else c.setDebugDraw(null)}})();
(function(){CAAT.B2DBodyActor=function(){CAAT.B2DBodyActor.superclass.constructor.call(this);return this};CAAT.B2DBodyActor.prototype={restitution:0.5,friction:0.5,density:1,bodyType:Box2D.Dynamics.b2Body.b2_dynamicBody,worldBody:null,world:null,worldBodyFixture:null,bodyDef:null,fixtureDef:null,bodyData:null,recycle:false,setRecycle:function(){this.recycle=true;return this},destroy:function(){CAAT.B2DBodyActor.superclass.destroy.call(this);if(this.recycle)this.setLocation(-Number.MAX_VALUE,-Number.MAX_VALUE),
this.setAwake(false);else{var b=this.worldBody;b.DestroyFixture(this.worldBodyFixture);this.world.DestroyBody(b)}return this},setAwake:function(b){this.worldBody.SetAwake(b);return this},setSleepingAllowed:function(b){this.worldBody.SetSleepingAllowed(b);return this},setLocation:function(b,a){this.worldBody.SetPosition(new Box2D.Common.Math.b2Vec2((b+this.width/2)/CAAT.PMR,(a+this.height/2)/CAAT.PMR));return this},setDensity:function(b){this.density=b;return this},setFriction:function(b){this.friction=
b;return this},setRestitution:function(b){this.restitution=b;return this},setBodyType:function(b){this.bodyType=b;return this},check:function(b,a,c){b[a]||(b[a]=c)},createBody:function(b,a){if(a)this.check(a,"density",1),this.check(a,"friction",0.5),this.check(a,"restitution",0.2),this.check(a,"bodyType",Box2D.Dynamics.b2Body.b2_staticBody),this.check(a,"userData",{}),this.check(a,"image",null),this.density=a.density,this.friction=a.friction,this.restitution=a.restitution,this.bodyType=a.bodyType,
this.image=a.image;this.world=b;return this},getCenter:function(){return{x:0,y:0}},getDistanceJointLocalAnchor:function(){return{x:0,y:0}}};extend(CAAT.B2DBodyActor,CAAT.Actor)})();
(function(){CAAT.B2DPolygonBody=function(){CAAT.B2DPolygonBody.superclass.constructor.call(this);return this};CAAT.B2DPolygonBody.Type={EDGE:"edge",BOX:"box",POLYGON:"polygon"};CAAT.B2DPolygonBody.prototype={boundingBox:null,getDistanceJointLocalAnchor:function(){return this.worldBody.GetFixtureList().GetShape().m_centroid},getCenter:function(){var b=this.worldBody,a=b.m_xf,b=b.GetFixtureList().GetShape();return Box2D.Common.Math.b2Math.MulX(a,b.m_centroid)},animate:function(b,a){var c=this.worldBody,
d=c.m_xf,e=this.worldBodyFixture.GetShape();e&&(d=Box2D.Common.Math.b2Math.MulX(d,e.m_centroid),CAAT.Actor.prototype.setLocation.call(this,d.x*CAAT.PMR-this.width/2,d.y*CAAT.PMR-this.height/2),this.setRotation(c.GetAngle()));return CAAT.B2DPolygonBody.superclass.animate.call(this,b,a)},createBody:function(b,a){CAAT.B2DPolygonBody.superclass.createBody.call(this,b,a);var c=CAAT.B2DPolygonBody.createPolygonBody(b,a);a.userData.actor=this;this.worldBody=c.worldBody;this.worldBodyFixture=c.worldBodyFixture;
this.fixtureDef=c.fixDef;this.bodyDef=c.bodyDef;this.bodyData=a;this.boundingBox=c.boundingBox;this.setBackgroundImage(a.image).setSize(c.boundingBox[1].x-c.boundingBox[0].x+1,c.boundingBox[1].y-c.boundingBox[0].y+1).setFillStyle(c.worldBodyFixture.IsSensor()?"red":"green").setImageTransformation(CAAT.SpriteImage.prototype.TR_FIXED_TO_SIZE);return this}};CAAT.B2DPolygonBody.createPolygonBody=function(b,a){var c=new Box2D.Dynamics.b2FixtureDef;c.density=a.density;c.friction=a.friction;c.restitution=
a.restitution;c.shape=new Box2D.Collision.Shapes.b2PolygonShape;var d=Number.MAX_VALUE,e=-Number.MAX_VALUE,g=Number.MAX_VALUE,j=-Number.MAX_VALUE,k=[],l=a.bodyDefScale||1;l+=(a.bodyDefScaleTolerance||0)*Math.random();for(var f=0;f<a.bodyDef.length;f++){var h=a.bodyDef[f].x*l,i=a.bodyDef[f].y*l;h<d&&(d=h);h>e&&(e=h);i<g&&(g=i);i>j&&(j=i);h+=a.x||0;i+=a.y||0;k.push(new Box2D.Common.Math.b2Vec2(h/CAAT.PMR,i/CAAT.PMR))}l=[{x:d,y:g},{x:e,y:j}];f=new Box2D.Dynamics.b2BodyDef;f.type=a.bodyType;if(a.polygonType===
CAAT.B2DPolygonBody.Type.EDGE)c.shape.SetAsEdge(k[0],k[1]);else if(a.polygonType===CAAT.B2DPolygonBody.Type.BOX)c.shape.SetAsBox((e-d)/2/CAAT.PMR,(j-g)/2/CAAT.PMR),f.position.x=((e-d)/2+(a.x||0))/CAAT.PMR,f.position.y=((j-g)/2+(a.y||0))/CAAT.PMR;else if(a.polygonType===CAAT.B2DPolygonBody.Type.POLYGON)c.shape.SetAsArray(k,k.length);else throw"Unkown bodyData polygonType: "+a.polygonType;c.userData=a.userData;f.userData=a.userData;d=b.CreateBody(f);e=d.CreateFixture(c);a.isSensor&&e.SetSensor(true);
return{worldBody:d,worldBodyFixture:e,fixDef:c,bodyDef:f,boundingBox:l}};extend(CAAT.B2DPolygonBody,CAAT.B2DBodyActor)})();
(function(){CAAT.B2DCircularBody=function(){CAAT.B2DCircularBody.superclass.constructor.call(this);return this};CAAT.B2DCircularBody.prototype={radius:1,getDistanceJointLocalAnchor:function(){return new Box2D.Common.Math.b2Vec2(0,0)},getCenter:function(){return this.worldBody.m_xf.position},animate:function(b,a){var c=this.worldBody,d=c.m_xf;CAAT.Actor.prototype.setLocation.call(this,CAAT.PMR*d.position.x-this.width/2,CAAT.PMR*d.position.y-this.height/2);this.setRotation(c.GetAngle());return CAAT.B2DCircularBody.superclass.animate.call(this,
b,a)},createBody:function(b,a){var c=a.radius||1;c+=(a.bodyDefScaleTolerance||0)*Math.random();a.radius=c;CAAT.B2DCircularBody.superclass.createBody.call(this,b,a);if(a.radius)this.radius=a.radius;c=new Box2D.Dynamics.b2FixtureDef;c.density=this.density;c.friction=this.friction;c.restitution=this.restitution;c.shape=new Box2D.Collision.Shapes.b2CircleShape(this.radius/CAAT.PMR);var d=new Box2D.Dynamics.b2BodyDef;d.type=this.bodyType;d.position.x=a.x/CAAT.PMR;d.position.y=a.y/CAAT.PMR;a.userData.actor=
this;c.userData=a.userData;d.userData=a.userData;var e=b.CreateBody(d),g=e.CreateFixture(c);a.isSensor&&g.SetSensor(true);this.worldBody=e;this.worldBodyFixture=g;this.fixtureDef=c;this.bodyDef=d;this.bodyData=a;this.setFillStyle(this.worldBodyFixture.IsSensor()?"red":"blue").setBackgroundImage(this.image).setSize(2*this.radius,2*this.radius).setImageTransformation(CAAT.SpriteImage.prototype.TR_FIXED_TO_SIZE);return this}};extend(CAAT.B2DCircularBody,CAAT.B2DBodyActor)})();
