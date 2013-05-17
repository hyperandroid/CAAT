/* Ported from http://buildnewgames.com/particle-systems/ */
// TODO: add start/stop/events
//  TODO: add particle rotation
CAAT.Module({

	/**
	 * @name Emitter
	 * @memberof CAAT.Module.Particle
	 * @constructor
	 */

	defines: "CAAT.Module.Particle.Emitter",
	extendsClass: "CAAT.Foundation.Actor",
	depends: [
		"CAAT.Foundation.Actor",
		"CAAT.Module.Particle.Particle"
	],
	extendsWith: function () {

		function isNumber(i) {
			return typeof i === 'number';
		}

		function isInteger(num) {
			return num === (num | 0);
		}

		function random(minOrMax, maxOrUndefined, dontFloor) {
			dontFloor = dontFloor || false;

			var min = isNumber(maxOrUndefined) ? minOrMax: 0;
			var max = isNumber(maxOrUndefined) ? maxOrUndefined: minOrMax;

			var range = max - min;

			var result = Math.random() * range + min;

			if (isInteger(min) && isInteger(max) && ! dontFloor) {
				return Math.floor(result);
			} else {
				return result;
			}
		}

		function random11() {
			return random(-1, 1, true);
		}


		function normalize(vector) {
			var length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);

			vector.x /= length;
			vector.y /= length;
		}

		function merge(obj, config) {
			for (var prop in config) {
				if (config.hasOwnProperty(prop)) {
					obj[prop] = config[prop];
				}
			}
		}

		function colorArrayToString(array, overrideAlpha) {
			var r = array[0] | 0;
			var g = array[1] | 0;
			var b = array[2] | 0;
			var a = overrideAlpha || array[3];

			return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
		}

		return {

			newY: 0, // reuseable var
			temp: null,
			deltaColor: 0, // change per piece of a second delta
			colors: null, // reusable array of intermediate colors

			configure: function(system) {
				this.system = system || {};

				this.totalParticles = 10;
				this.emissionRate = 1;

				this.active = false;
				this.totalDuration = 0;

				this.pos = this.pos || {};
				this.pos.x = 0;
				this.pos.y = 0;

				this.posVar = this.posVar || {};
				this.posVar.x = 0;
				this.posVar.y = 0;

				this.speed = 0;
				this.speedVar = 0;

				this.angle = 0;
				this.angleVar = 0;

				this.rotation = 0; // particle rotation

				this.life = 2;
				this.lifeVar = 0;

				this.radius = 0;
				this.radiusVar = 0;

				this.texture = null;
				this.textureEnabled = true;
				this.textureAdditive = true;

				this.startScale = 0;
				this.startScaleVar = 0;
				this.endScale = 0;
				this.endScaleVar = 0;

				this.startColor = this.startColor || [];
				this.startColor[0] = 0;
				this.startColor[1] = 0;
				this.startColor[2] = 0;
				this.startColor[3] = 0;

				this.startColorVar = this.startColorVar || [];
				this.startColorVar[0] = 0;
				this.startColorVar[1] = 0;
				this.startColorVar[2] = 0;
				this.startColorVar[3] = 0;

				this.endColor = this.endColor || [];
				this.endColor[0] = 0;
				this.endColor[1] = 0;
				this.endColor[2] = 0;
				this.endColor[3] = 0;

				this.endColorVar = this.endColorVar || [];
				this.endColorVar[0] = 0;
				this.endColorVar[1] = 0;
				this.endColorVar[2] = 0;
				this.endColorVar[3] = 0;

				this.gravity = this.gravity || {};
				this.gravity.x = 0;
				this.gravity.y = 0;

				this.radialAccel = 0; // in pixels per second
				this.radialAccelVar = 0;
				this.tangentialAccel = 0;
				this.tangentialAccelVar = 0;

				this.startTime = 0;
				this.lastTime = 0;

				this.angleFromPath = false; // If we specify a path with setPath, calculate the angle starting from the 

				merge(this, system);

				this.particleWidth = 2* this.radius;

				return this;
			},

			setTexture: function(texture) {
				if (texture) {
					this.texture = texture;
					this.particleWidth = texture.width;
					this.particleHeight = texture.height;
					return this;
				}

				// By default create a white dot with tranparent edges if a texture has not been provided
				this.texture = document.createElement('canvas');
				this.particleWidth = 2*this.radius;
				this.particleHeight = 2*this.radius;
				this.texture.width = this.particleWidth;
				this.texture.height = this.particleHeight;
				var ctx = this.texture.getContext('2d');

				// CocoonJS createRadialGradient does not work correct on cocoonjs
				if (navigator.isCocoonJS) {
					var grd = GAME.director.ctx.createRadialGradient(this.radius, this.radius, 0.8*this.radius, this.radius, this.radius, this.radius);
					grd.addColorStop(0, 'rgba(255, 255, 255, 1)');
					grd.addColorStop(1, 'rgba(255, 255, 255, 0.5)');
				} else {
					var grd = GAME.director.ctx.createRadialGradient(this.radius, this.radius, 0.1*this.radius, this.radius, this.radius, this.radius);
					grd.addColorStop(0, 'rgba(255, 255, 255, 1)');
					grd.addColorStop(1, 'rgba(255, 255, 255, 0)');
				}
				// var grd = 'rgba(255, 255, 255, 1)';

				ctx.fillStyle = grd;
				ctx.beginPath();
				ctx.arc(
					this.radius,
					this.radius,
					this.radius,
					0,
					2 * Math.PI,
					false
				);
				
				ctx.fill();

				return this;
			},

			// TODO: add alpha somewhere else

			// Create a re-usable array of colors or color sprites to use
			// TODO: make array of canvasses when we use textures
			buildColors: function() {
				var nrColors = 50; // TODO: make configurable
				this.colors = [];

				this.setTexture(this.texture);

				if (this.startColor) {
					var startColor = [
					this.startColor[0] + this.startColorVar[0] * random11(), this.startColor[1] + this.startColorVar[1] * random11(), this.startColor[2] + this.startColorVar[2] * random11(), this.startColor[3] + this.startColorVar[3] * random11()];

					// if there is no endColor, then the particle will end up staying at startColor the whole time
					var endColor = startColor;
					if (this.endColor) {
						endColor = [
						this.endColor[0] + this.endColorVar[0] * random11(), this.endColor[1] + this.endColorVar[1] * random11(), this.endColor[2] + this.endColorVar[2] * random11(), this.endColor[3] + this.endColorVar[3] * random11()];
					}

					// particle.color = startColor;
					this.deltaColor = [(endColor[0] - startColor[0]) / this.life, (endColor[1] - startColor[1]) / this.life, (endColor[2] - startColor[2]) / this.life, (endColor[3] - startColor[3]) / this.life];
				}

				for (var i=0;i<=nrColors;i++) {
					var color = startColor.slice();
					var alpha = startColor[3];
					var scale = this.startScale + (i/nrColors)*(this.endScale - this.startScale);
					color[0] += this.deltaColor[0] * (i/nrColors) * this.life;
					color[1] += this.deltaColor[1] * (i/nrColors) * this.life;
					color[2] += this.deltaColor[2] * (i/nrColors) * this.life;
					alpha += this.deltaColor[3] * (i/nrColors) * this.life;
					// this.colors.push(colorArrayToString(color));

					var colorCanvas = document.createElement('canvas');
					colorCanvas.width = this.particleWidth;
					colorCanvas.height = this.particleHeight;
					var ctx = colorCanvas.getContext('2d');
					ctx.globalAlpha = alpha;
					var centerX = (1-scale)*0.5*this.particleWidth;
					var centerY = (1-scale)*0.5*this.particleHeight;
					ctx.translate(1-scale,scale);
					ctx.scale(scale,scale);
					
					// ctx.clearRect(0, 0, particle.buffer.width, particle.buffer.height);
					ctx.drawImage(this.texture, 0, 0);

					// now use source-atop to "tint" the white texture, here we want the particle's pure color,
					// not including alpha. As we already used the particle's alpha to render the texture above -- RB: wel dus
					ctx.globalCompositeOperation = "source-atop";
					ctx.fillStyle = colorArrayToString(color);
					ctx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);

					this.colors.push(colorCanvas);
				}
				// console.log('COLORS:', this.colors);
			},

			__init: function (director, defaultTexture) {
				this.__super();

				this.director = director;
				this._particlePool = [];

				this._defaultTexture = defaultTexture;

				return this;
			},

			// sets a path along which particles are emitted
			setPath: function(path) {
				this.emitterPath = path;
				return this;
			},

			start: function() {
				this._particlePool = [];

				if (!this.system) {
					this.configure({
						totalParticles: 100,
						emissionRate: 100/2,
						gravity: {
							x: 0,//- 200,
							y: 0
						},
						angle: 0.5*Math.PI,
						angleVar: 0,
						speed: 25,
						speedVar: 0,
						life: 2, // in seconds
						lifeVar: 0.1,
						radialAccel: 0,
						radialAccelVar: 0,
						tangentialAccel: 0,
						tangentialAccelVar: 0,
						textureAdditive: false,
						radius: 5,
						radiusVar: 0.5,
						startScale: 1,
						endScale: 1,
						startColor: [255, 208, 0, 1],
						startColorVar: [0, 0, 0, 0],
						endColor: [255, 0, 0, 0],
						active: true,
						totalDuration: Infinity,
						angleFromPath: false
					});
				}

				this.buildColors();

				for (var i = 0; i < this.totalParticles; ++i) {
					this._particlePool.push(new CAAT.Module.Particle.Particle());
				}

				this._particleCount = 0;
				this._particleIndex = 0;
				this._elapsed = 0;
				this._emitCounter = 0;

				return this;
			},

			/*
			 * Returns whether all the particles in the pool are currently active
			 */
			_isFull: function() {
				return this._particleCount === this.totalParticles;
			},

			/*
			 * Takes a dormant particle out of the pool and makes it active.
			 * Does nothing if there is no free particle availabe
			 */
			_addParticle: function() {
				if (this._isFull()) {
					return false;
				}

				var p = this._particlePool[this._particleCount];
				this._initParticle(p); 
				++this._particleCount;

				return true;
			},

			/*
			 * Initializes the particle based on the current settings
			 * of the particle system
			 */
			_initParticle: function(particle) {
				var emitPoint;

				var angle = this.angle + this.angleVar * random11(); // default angle
				// particle.rotation = 0;//this.rotation;

				if (this.emitterPath) {
					var length = Math.random()*this.emitterPath.length;
					emitPoint = this.emitterPath.getPositionFromLength(length);
					particle.startPos.x = emitPoint.x;
					particle.startPos.y = emitPoint.y;

					if (this.angleFromPath) {
						var x = emitPoint.x, y=emitPoint.y;
						var prevPoint = this.emitterPath.getPositionFromLength(length-1);
						var pathAngle = Math.atan2(prevPoint.y - y, x - prevPoint.x); // y = positive down
						particle.startAngle = pathAngle;
						// particle.rotation = pathAngle;
						angle += pathAngle;
					}

				} else {
					emitPoint = {x:0,y:0};
				}

				particle.pos.x = emitPoint.x + this.posVar.x * random11();
				particle.pos.y = emitPoint.y + this.posVar.y * random11();

				var speed = this.speed + this.speedVar * random11();

				// it's easier to set speed and angle at this level
				// but once the particle is active and being updated, it's easier
				// to use a vector to indicate speed and angle. So particle.setVelocity
				// converts the angle and speed values to a velocity vector
				particle.setVelocity(angle, speed);

				particle.radialAccel = this.radialAccel + this.radialAccelVar * random11() || 0;
				particle.tangentialAccel = this.tangentialAccel + this.tangentialAccelVar * random11() || 0;

				var life = this.life + this.lifeVar * random11() || 0;
				particle.life = Math.max(0, life);

				particle.scale = isNumber(this.startScale) ? this.startScale: 1;
				particle.deltaScale = isNumber(this.endScale) ? (this.endScale - this.startScale) : 0;
				particle.deltaScale /= particle.life;

				particle.radius = isNumber(this.radius) ? this.radius + (this.radiusVar || 0) * random11() : 0;

				// color
				// note that colors are stored as arrays => [r,g,b,a],
				// this makes it easier to tweak the color every frame in _updateParticle
				// The renderer will take this array and turn it into a css rgba string
				if (this.startColor) {
					particle.color = this.colors[0];
				}
			},

			/*
			 * Updates a particle based on how much time has passed in delta
			 * Moves the particle using its velocity and all forces acting on it (gravity,
			 * radial and tangential acceleration), and updates all the properties of the
			 * particle like its size, color, etc
			 */
			_updateParticle: function(p, delta, i) {
				if (p.life > 0) {

					// these vectors are stored on the particle so we can reuse them, avoids
					// generating lots of unnecessary objects each frame
					p.forces = p.forces || {
						x: 0,
						y: 0
					};
					p.forces.x = 0;
					p.forces.y = 0;

					p.radial = p.radial || {
						x: 0,
						y: 0
					};
					p.radial.x = 0;
					p.radial.y = 0;

					// dont apply radial forces until moved away from the emitter
					if ((p.pos.x !== p.startPos.x || p.pos.y !== p.startPos.y) && (p.radialAccel || p.tangentialAccel)) {
						p.radial.x = p.pos.x - p.startPos.x;
						p.radial.y = p.pos.y - p.startPos.y;

						normalize(p.radial);
					}

					p.tangential = p.tangential || {
						x: 0,
						y: 0
					};
					p.tangential.x = p.radial.x;
					p.tangential.y = p.radial.y;

					p.radial.x *= p.radialAccel;
					p.radial.y *= p.radialAccel;

					this.newy = p.tangential.x;
					p.tangential.x = - p.tangential.y;
					p.tangential.y = this.newy;

					p.tangential.x *= p.tangentialAccel;
					p.tangential.y *= p.tangentialAccel;

					p.forces.x = p.radial.x + p.tangential.x + this.gravity.x;
					p.forces.y = p.radial.y + p.tangential.y + this.gravity.y;

					p.forces.x *= delta;
					p.forces.y *= delta;

					p.vel.x += p.forces.x;
					p.vel.y += p.forces.y;

					p.pos.x += p.vel.x * delta;
					p.pos.y += p.vel.y * delta;

					p.life -= delta;
					p.deltaLife = 1 - (p.life/this.life); // Math.max is EXPENSIVE
					// p.deltaLife = Math.max(1 - (p.life/this.life),0);
					if (p.deltaLife < 0)  {p.deltaLife = 0;}
					p.color = this.colors[(p.deltaLife * this.colors.length) | 0];
					// console.log(p.deltaLife, this.colors.length,p.deltaLife, (p.deltaLife * this.colors.length) | 0,p.color);

					p.scale += p.deltaScale * delta;

					// if (p.color) {
					// 	p.color[0] += p.deltaColor[0] * delta;
					// 	p.color[1] += p.deltaColor[1] * delta;
					// 	p.color[2] += p.deltaColor[2] * delta;
					// 	p.color[3] += p.deltaColor[3] * delta;
					// }

					++this._particleIndex;
				} else {
					// the particle has died, time to return it to the particle pool
					// take the particle at the current index
					this.temp = this._particlePool[i];

					// and move it to the end of the active particles, keeping all alive particles pushed
					// up to the front of the pool
					this._particlePool[i] = this._particlePool[this._particleCount - 1];
					this._particlePool[this._particleCount - 1] = this.temp;

					// decrease the count to indicate that one less particle in the pool is active.
					--this._particleCount;
				}
			},

			animate: function (director, time) {
				var i,l;

				CAAT.Module.Particle.Emitter.superclass.animate.call( this, director, time );
// return this;
				if (this.startTime === 0) {
					// Do nothing in the first frame, only set the start time
					this.startTime = this.lastTime = time;
					return this;
				}

				this._elapsed = time - this.startTime;
				var delta = (time - this.lastTime) / 1000;  // in seconds, used fo emission rate per second
				this.lastTime = time;
				this.active = this._elapsed < this.totalDuration;

				if (!this.active) {
					return this;
				}

				if (this.emissionRate) {
					// emit new particles based on how much time has passed and the emission rate
					var rate = 1.0 / this.emissionRate;
					this._emitCounter += delta;

					while (!this._isFull() && this._emitCounter > rate) {
						this._addParticle();
						this._emitCounter -= rate;
					}
				}

				this._particleIndex = 0;

				while (this._particleIndex < this._particleCount) {
					var p = this._particlePool[this._particleIndex];
					this._updateParticle(p, delta, this._particleIndex);
				}

				return this;
			},

			paint : function( director, time ) {
				CAAT.Module.Particle.Emitter.superclass.paint.call(this,director,time);

				var ctx = director.ctx;
				// var bufferContext = this.texture.getContext('2d');//particle.buffer.getContext('2d');

				if(this.textureAdditive) {
					ctx.globalCompositeOperation = 'lighter';
				} else {
					ctx.globalCompositeOperation = 'source-over';
				}
				// var ctx = director.canvas.getContext("2d", {antialias : true }); // Maakt niets uit voor performance

				var w, h;
				for(var i = 0; i < this._particlePool.length; ++i) {
					var p = this._particlePool[i];
					if (p.life > 0) {
						w = this.particleWidth*p.scale;//p.texture.width;// * p.scale;
						h = this.particleWidth*p.scale;//p.texture.height;// * p.scale;

						// figure out the x and y locations to render at, to center the texture in the buffer
						var x = p.pos.x - w / 2;
						var y = p.pos.y - h / 2;
						// ctx.save();
						// if (p.rotation) {
						// 	ctx.rotate(p.rotation);
						// }
						ctx.drawImage(p.color, x, y);
						// ctx.restore();
					}
				}
				// ctx.globalCompositeOperation = 'source-over';

				// if (this._showBones && this.skeleton) {
				//     this.worldModelViewMatrix.transformRenderingContextSet(director.ctx);
				//     this.skeleton.paint(this.worldModelViewMatrix, director.ctx);
				// }
			}



		};
	}
});