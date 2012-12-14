
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

Version: 0.5 build: 46

Created on:
DATE: 2012-12-13
TIME: 21:30:18
*/


CAAT.Module({defines:"CAAT.Foundation.Box2D.B2DBodyActor",depends:["CAAT.Foundation.Actor"],aliases:["CAAT.B2DBodyActor"],extendsClass:"CAAT.Foundation.Actor",extendsWith:function(){CAAT.PMR=64;CAAT.enableBox2DDebug=function(c,a,b,d){if(c){c=new Box2D.Dynamics.b2DebugDraw;try{c.m_sprite.graphics.clear=function(){}}catch(g){}b.SetDebugDraw(c);c.SetSprite(a.ctx);c.SetDrawScale(d||CAAT.PMR);c.SetFillAlpha(0.5);c.SetLineThickness(1);c.SetFlags(3)}else b.SetDebugDraw(null)};return{restitution:0.5,friction:0.5,
density:1,bodyType:Box2D.Dynamics.b2Body.b2_dynamicBody,worldBody:null,world:null,worldBodyFixture:null,bodyDef:null,fixtureDef:null,bodyData:null,recycle:false,setRecycle:function(){this.recycle=true;return this},destroy:function(){CAAT.Foundation.Box2D.B2DBodyActor.superclass.destroy.call(this);if(this.recycle)this.setLocation(-Number.MAX_VALUE,-Number.MAX_VALUE),this.setAwake(false);else{var c=this.worldBody;c.DestroyFixture(this.worldBodyFixture);this.world.DestroyBody(c)}return this},setAwake:function(c){this.worldBody.SetAwake(c);
return this},setSleepingAllowed:function(c){this.worldBody.SetSleepingAllowed(c);return this},setLocation:function(c,a){this.worldBody.SetPosition(new Box2D.Common.Math.b2Vec2((c+this.width/2)/CAAT.PMR,(a+this.height/2)/CAAT.PMR));return this},setDensity:function(c){this.density=c;return this},setFriction:function(c){this.friction=c;return this},setRestitution:function(c){this.restitution=c;return this},setBodyType:function(c){this.bodyType=c;return this},check:function(c,a,b){c[a]||(c[a]=b)},createBody:function(c,
a){if(a)this.check(a,"density",1),this.check(a,"friction",0.5),this.check(a,"restitution",0.2),this.check(a,"bodyType",Box2D.Dynamics.b2Body.b2_staticBody),this.check(a,"userData",{}),this.check(a,"image",null),this.density=a.density,this.friction=a.friction,this.restitution=a.restitution,this.bodyType=a.bodyType,this.image=a.image;this.world=c;return this},getCenter:function(){return this.worldBody.GetPosition()},getDistanceJointLocalAnchor:function(){return new Box2D.Common.Math.b2Vec2(0,0)},animate:function(c,
a){var b=this.worldBody.GetPosition();this.bodyData.polygonType===CAAT.Foundation.Box2D.B2DPolygonBody.TYPE.EDGE?CAAT.Foundation.Actor.prototype.setLocation.call(this,CAAT.PMR*b.x,CAAT.PMR*b.y):CAAT.Foundation.Actor.prototype.setLocation.call(this,CAAT.PMR*b.x-this.width/2,CAAT.PMR*b.y-this.height/2);this.setRotation(this.worldBody.GetAngle());return CAAT.Foundation.Box2D.B2DBodyActor.superclass.animate.call(this,c,a)}}}});
CAAT.Module({defines:"CAAT.Foundation.Box2D.B2DCircularBody",depends:["CAAT.Foundation.Box2D.B2DBodyActor"],aliases:["CAAT.B2DCircularBody"],extendsClass:"CAAT.Foundation.Box2D.B2DBodyActor",constants:{createCircularBody:function(c,a){if(a.radius)this.radius=a.radius;var b=new Box2D.Dynamics.b2FixtureDef;b.density=a.density;b.friction=a.friction;b.restitution=a.restitution;b.shape=new Box2D.Collision.Shapes.b2CircleShape(a.radius/CAAT.PMR);var d=new Box2D.Dynamics.b2BodyDef;d.type=a.bodyType;d.position.Set(a.x/
CAAT.PMR,a.y/CAAT.PMR);b.userData=a.userData;d.userData=a.userData;var g=c.CreateBody(d),h=g.CreateFixture(b);a.isSensor&&h.SetSensor(true);return{worldBody:g,worldBodyFixture:h,fixDef:b,bodyDef:d}}},extendsWith:{radius:1,createBody:function(c,a){var b=a.radius||1;b+=(a.bodyDefScaleTolerance||0)*Math.random();a.radius=b;CAAT.Foundation.Box2D.B2DCircularBody.superclass.createBody.call(this,c,a);b=CAAT.Foundation.Box2D.B2DCircularBody.createCircularBody(c,a);a.userData.actor=this;this.worldBody=b.worldBody;
this.worldBodyFixture=b.worldBodyFixture;this.fixtureDef=b.fixDef;this.bodyDef=b.bodyDef;this.bodyData=a;this.setFillStyle(this.worldBodyFixture.IsSensor()?"red":"green").setBackgroundImage(this.image).setSize(2*a.radius,2*a.radius).setImageTransformation(CAAT.Foundation.SpriteImage.TR_FIXED_TO_SIZE);return this}}});
CAAT.Module({defines:"CAAT.Foundation.Box2D.B2DPolygonBody",depends:["CAAT.Foundation.Box2D.B2DBodyActor","CAAT.Foundation.SpriteImage"],aliases:["CAAT.B2DPolygonBody"],constants:{TYPE:{EDGE:"edge",BOX:"box",POLYGON:"polygon"},createPolygonBody:function(c,a){var b=new Box2D.Dynamics.b2FixtureDef;b.density=a.density;b.friction=a.friction;b.restitution=a.restitution;b.shape=new Box2D.Collision.Shapes.b2PolygonShape;var d=Number.MAX_VALUE,g=-Number.MAX_VALUE,h=Number.MAX_VALUE,i=-Number.MAX_VALUE,e=
[],j=a.bodyDefScale||1;j+=(a.bodyDefScaleTolerance||0)*Math.random();for(var f=0;f<a.bodyDef.length;f++){var k=a.bodyDef[f].x*j,l=a.bodyDef[f].y*j;k<d&&(d=k);k>g&&(g=k);l<h&&(h=l);l>i&&(i=l);e.push(new Box2D.Common.Math.b2Vec2(k/CAAT.PMR,l/CAAT.PMR))}j=[{x:d,y:h},{x:g,y:i}];f=new Box2D.Dynamics.b2BodyDef;f.type=a.bodyType;f.position.Set(((g-d)/2+(a.x||0))/CAAT.PMR,((i-h)/2+(a.y||0))/CAAT.PMR);if(a.polygonType===CAAT.Foundation.Box2D.B2DPolygonBody.TYPE.EDGE)d=new Box2D.Common.Math.b2Vec2(e[0].x,e[0].y),
e=new Box2D.Common.Math.b2Vec2(e[1].x-e[0].x,e[1].y-e[0].y),f.position.Set(d.x,d.y),b.shape.SetAsEdge(new Box2D.Common.Math.b2Vec2(0,0),e);else if(a.polygonType===CAAT.Foundation.Box2D.B2DPolygonBody.TYPE.BOX)b.shape.SetAsBox((g-d)/2/CAAT.PMR,(i-h)/2/CAAT.PMR);else if(a.polygonType===CAAT.Foundation.Box2D.B2DPolygonBody.TYPE.POLYGON)b.shape.SetAsArray(e,e.length);else throw"Unkown bodyData polygonType: "+a.polygonType;b.userData=a.userData;f.userData=a.userData;e=c.CreateBody(f);d=e.CreateFixture(b);
a.isSensor&&d.SetSensor(true);return{worldBody:e,worldBodyFixture:d,fixDef:b,bodyDef:f,boundingBox:j}}},extendsClass:"CAAT.Foundation.Box2D.B2DBodyActor",extendsWith:{boundingBox:null,getDistanceJointLocalAnchor:function(){return this.worldBody.GetFixtureList().GetShape().GetLocalCenter()},createBody:function(c,a){CAAT.Foundation.Box2D.B2DPolygonBody.superclass.createBody.call(this,c,a);var b=CAAT.Foundation.Box2D.B2DPolygonBody.createPolygonBody(c,a);a.userData.actor=this;this.worldBody=b.worldBody;
this.worldBodyFixture=b.worldBodyFixture;this.fixtureDef=b.fixDef;this.bodyDef=b.bodyDef;this.bodyData=a;this.boundingBox=b.boundingBox;this.setBackgroundImage(a.image).setSize(b.boundingBox[1].x-b.boundingBox[0].x+1,b.boundingBox[1].y-b.boundingBox[0].y+1).setFillStyle(b.worldBodyFixture.IsSensor()?"#0f0":"#f00").setImageTransformation(CAAT.Foundation.SpriteImage.TR_FIXED_TO_SIZE);return this}}});CAAT.ModuleManager.solveAll();
