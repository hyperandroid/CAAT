
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
TIME: 23:44:43
*/


(function(){CAAT.B2DBodyActor=function(){CAAT.B2DBodyActor.superclass.constructor.call(this);return this};CAAT.B2DBodyActor.prototype={restitution:0.5,friction:0.5,density:1,bodyType:Box2D.Dynamics.b2Body.b2_dynamicBody,worldBody:null,world:null,worldBodyFixture:null,bodyDef:null,fixtureDef:null,bodyData:null,recycle:false,setRecycle:function(){this.recycle=true;return this},destroy:function(){CAAT.B2DBodyActor.superclass.destroy.call(this);if(this.recycle)this.setLocation(-Number.MAX_VALUE,-Number.MAX_VALUE),
this.setAwake(false);else{var c=this.worldBody;c.DestroyFixture(this.worldBodyFixture);this.world.DestroyBody(c)}return this},setAwake:function(c){this.worldBody.SetAwake(c);return this},setSleepingAllowed:function(c){this.worldBody.SetSleepingAllowed(c);return this},setLocation:function(c,a){this.worldBody.SetPosition(new Box2D.Common.Math.b2Vec2((c+this.width/2)/CAAT.PMR,(a+this.height/2)/CAAT.PMR));return this},setDensity:function(c){this.density=c;return this},setFriction:function(c){this.friction=
c;return this},setRestitution:function(c){this.restitution=c;return this},setBodyType:function(c){this.bodyType=c;return this},check:function(c,a,b){c[a]||(c[a]=b)},createBody:function(c,a){if(a)this.check(a,"density",1),this.check(a,"friction",0.5),this.check(a,"restitution",0.2),this.check(a,"bodyType",Box2D.Dynamics.b2Body.b2_staticBody),this.check(a,"userData",{}),this.check(a,"image",null),this.density=a.density,this.friction=a.friction,this.restitution=a.restitution,this.bodyType=a.bodyType,
this.image=a.image;this.world=c;return this},getCenter:function(){return{x:0,y:0}},getDistanceJointLocalAnchor:function(){return{x:0,y:0}}};extend(CAAT.B2DBodyActor,CAAT.Actor)})();
(function(){CAAT.B2DPolygonBody=function(){CAAT.B2DPolygonBody.superclass.constructor.call(this);return this};CAAT.B2DPolygonBody.Type={EDGE:"edge",BOX:"box",POLYGON:"polygon"};CAAT.B2DPolygonBody.prototype={boundingBox:null,getDistanceJointLocalAnchor:function(){return this.worldBody.GetFixtureList().GetShape().m_centroid},getCenter:function(){var c=this.worldBody,a=c.m_xf,c=c.GetFixtureList().GetShape();return Box2D.Common.Math.b2Math.MulX(a,c.m_centroid)},animate:function(c,a){var b=this.worldBody,
d=b.m_xf,e=this.worldBodyFixture.GetShape();e&&(d=Box2D.Common.Math.b2Math.MulX(d,e.m_centroid),CAAT.Actor.prototype.setLocation.call(this,d.x*CAAT.PMR-this.width/2,d.y*CAAT.PMR-this.height/2),this.setRotation(b.GetAngle()));return CAAT.B2DPolygonBody.superclass.animate.call(this,c,a)},createBody:function(c,a){CAAT.B2DPolygonBody.superclass.createBody.call(this,c,a);var b=CAAT.B2DPolygonBody.createPolygonBody(c,a);a.userData.actor=this;this.worldBody=b.worldBody;this.worldBodyFixture=b.worldBodyFixture;
this.fixtureDef=b.fixDef;this.bodyDef=b.bodyDef;this.bodyData=a;this.boundingBox=b.boundingBox;this.setBackgroundImage(a.image).setSize(b.boundingBox[1].x-b.boundingBox[0].x+1,b.boundingBox[1].y-b.boundingBox[0].y+1).setFillStyle(b.worldBodyFixture.IsSensor()?"red":"green").setImageTransformation(CAAT.ImageActor.prototype.TR_FIXED_TO_SIZE);return this}};CAAT.B2DPolygonBody.createPolygonBody=function(c,a){var b=new Box2D.Dynamics.b2FixtureDef;b.density=a.density;b.friction=a.friction;b.restitution=
a.restitution;b.shape=new Box2D.Collision.Shapes.b2PolygonShape;var d=Number.MAX_VALUE,e=-Number.MAX_VALUE,g=Number.MAX_VALUE,j=-Number.MAX_VALUE,k=[],l=a.bodyDefScale||1;l+=(a.bodyDefScaleTolerance||0)*Math.random();for(var f=0;f<a.bodyDef.length;f++){var h=a.bodyDef[f].x*l,i=a.bodyDef[f].y*l;h<d&&(d=h);h>e&&(e=h);i<g&&(g=i);i>j&&(j=i);h+=a.x||0;i+=a.y||0;k.push(new Box2D.Common.Math.b2Vec2(h/CAAT.PMR,i/CAAT.PMR))}l=[{x:d,y:g},{x:e,y:j}];f=new Box2D.Dynamics.b2BodyDef;f.type=a.bodyType;if(a.polygonType===
CAAT.B2DPolygonBody.Type.EDGE)b.shape.SetAsEdge(k[0],k[1]);else if(a.polygonType===CAAT.B2DPolygonBody.Type.BOX)b.shape.SetAsBox((e-d)/2/CAAT.PMR,(j-g)/2/CAAT.PMR),f.position.x=((e-d)/2+(a.x||0))/CAAT.PMR,f.position.y=((j-g)/2+(a.y||0))/CAAT.PMR;else if(a.polygonType===CAAT.B2DPolygonBody.Type.POLYGON)b.shape.SetAsArray(k,k.length);else throw"Unkown bodyData polygonType: "+a.polygonType;b.userData=a.userData;f.userData=a.userData;d=c.CreateBody(f);e=d.CreateFixture(b);a.isSensor&&e.SetSensor(true);
return{worldBody:d,worldBodyFixture:e,fixDef:b,bodyDef:f,boundingBox:l}};extend(CAAT.B2DPolygonBody,CAAT.B2DBodyActor)})();
(function(){CAAT.B2DCircularBody=function(){CAAT.B2DCircularBody.superclass.constructor.call(this);return this};CAAT.B2DCircularBody.prototype={radius:1,getDistanceJointLocalAnchor:function(){return new Box2D.Common.Math.b2Vec2(0,0)},getCenter:function(){return this.worldBody.m_xf.position},animate:function(c,a){var b=this.worldBody,d=b.m_xf;CAAT.Actor.prototype.setLocation.call(this,CAAT.PMR*d.position.x-this.width/2,CAAT.PMR*d.position.y-this.height/2);this.setRotation(b.GetAngle());return CAAT.B2DCircularBody.superclass.animate.call(this,
c,a)},createBody:function(c,a){var b=a.radius||1;b+=(a.bodyDefScaleTolerance||0)*Math.random();a.radius=b;CAAT.B2DCircularBody.superclass.createBody.call(this,c,a);if(a.radius)this.radius=a.radius;b=new Box2D.Dynamics.b2FixtureDef;b.density=this.density;b.friction=this.friction;b.restitution=this.restitution;b.shape=new Box2D.Collision.Shapes.b2CircleShape(this.radius/CAAT.PMR);var d=new Box2D.Dynamics.b2BodyDef;d.type=this.bodyType;d.position.x=a.x/CAAT.PMR;d.position.y=a.y/CAAT.PMR;a.userData.actor=
this;b.userData=a.userData;d.userData=a.userData;var e=c.CreateBody(d),g=e.CreateFixture(b);a.isSensor&&g.SetSensor(true);this.worldBody=e;this.worldBodyFixture=g;this.fixtureDef=b;this.bodyDef=d;this.bodyData=a;this.setFillStyle(this.worldBodyFixture.IsSensor()?"red":"blue").setBackgroundImage(this.image).setSize(2*this.radius,2*this.radius).setImageTransformation(CAAT.ImageActor.prototype.TR_FIXED_TO_SIZE);return this}};extend(CAAT.B2DCircularBody,CAAT.B2DBodyActor)})();
