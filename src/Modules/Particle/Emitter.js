CAAT.Module({

	/**
	 * @name Emitter
	 * @memberof CAAT.Module.Particle
	 * @constructor
	 * Ported from http://buildnewgames.com/particle-systems/
	 */

	// TODO: add start/stop/events
	// TODO: add particle rotation

	defines: "CAAT.Module.Particle.Emitter",
	extendsClass: "CAAT.Foundation.Actor",
	depends: [
		"CAAT.Foundation.Actor",
		"CAAT.Module.Particle.Particle"
	],
	extendsWith: function () {

		/* internal utility functions */
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
			deltaColor: 0, // change per piece of a second delta
			colors: null, // reusable array of intermediate colors
			particleWidth: 0,
			particleHeight: 0,
			active: false,
			started: false,

			configure: function(system) {
				this.system = system || {};

				var texture = this.texture || null,
					emitterPath = this.emitterPath || null;

				// Setup defaults
				merge(this, {
					totalParticles: 10,				// Total particles in life
					emissionRate: 10/2,				// Amount of particles to emit per second
					gravity: {						// Gravity force in x and y direction
						x: 0,
						y: 0
					},
					posVar: {						// Variance in emit point position, whether on path or single point
						x: 0,
						y: 0
					},
					angle: 0.5*Math.PI,				// angle at which an emitted particle is fired
					angleVar: 0,					// variance in radians at which a particle is emitted
					emitterPath: this.emitterPath || null,	// it's possible to use a path along which a particle is randomly emitted.
					angleFromPath: false,			// if true, calculate the emit angle from the path, 0 rad = direction of path
					speed: 25,						// initial speed of emitted particle
					speedVar: 0,					// variance in speed of emitted particles
					life: 2,						// total life time per particle in seconds
					lifeVar: 0.1,					// variance of life per particle in seconds
					radialAccel: 0,					// accelleration in direction of movement of particle in pixels per second^2
					radialAccelVar: 0,				// variance in radial acceleration per particle in pixels per second^2
					tangentialAccel: 0,				// accelleration perpendicular to movement of particle in pixels per second^2
					tangentialAccelVar: 0,			// variance in tangential acceleration per particle in pixels per second^2
					texture: this.texture || null,	// sprite image for particles, all coordinates are centered on the particle
					radius: 5,						// if texture is not available, a round particle with radial gradient will be created
					textureAdditive: false,			// true to set blending mode to 'lighter', adding colors written at same location
					startScale: 1,					// initial scale of emitted particle
					endScale: 1,					// final scale of particle at end of life
					startColor: [255, 208, 0, 1],	// [R,B,G,A] array of initial color of emitted particle
					endColor: [255, 0, 0, 0],		// [R,B,G,A] array of final color of emitted particle at end of life
					colorSteps: 20,					// the sprite image is tinted from the startcolor to end color in colorSteps steps
					totalDuration: Infinity			// total duration of particle emitter, emission needs to be restarted after
				});

				// Now merge the entered configuration on top of the defaults
				merge(this, system);

				// Particle size defaults
				this.particleWidth = 2* this.radius;
				this.particleHeight = 2* this.radius;
				this.started = false;

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
				var grd;

				// CocoonJS createRadialGradient does not work correct
				if (navigator.isCocoonJS) {
					grd = GAME.director.ctx.createRadialGradient(this.radius, this.radius, 0.8*this.radius, this.radius, this.radius, this.radius);
					grd.addColorStop(0, 'rgba(255, 255, 255, 1)');
					grd.addColorStop(1, 'rgba(255, 255, 255, 0.5)');
				} else {
					grd = GAME.director.ctx.createRadialGradient(this.radius, this.radius, 0.1*this.radius, this.radius, this.radius, this.radius);
					grd.addColorStop(0, 'rgba(255, 255, 255, 1)');
					grd.addColorStop(1, 'rgba(255, 255, 255, 0)');
				}

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

			buildColors: function() {
				this.colors = [];

				this.setTexture(this.texture);

				var startColor = this.startColor;

				// if there is no endColor, then the particle will end up staying at startColor the whole time
				var endColor = startColor;
				if (this.endColor) {
					endColor = this.endColor;
				}

				this.deltaColor = [(endColor[0] - startColor[0]) / this.life, (endColor[1] - startColor[1]) / this.life, (endColor[2] - startColor[2]) / this.life, (endColor[3] - startColor[3]) / this.life];

				for (var i=0;i<=this.colorSteps;i++) {
					var color = startColor.slice();
					var alpha = startColor[3];
					var scale = this.startScale + (i/this.colorSteps)*(this.endScale - this.startScale);
					color[0] += this.deltaColor[0] * (i/this.colorSteps) * this.life;
					color[1] += this.deltaColor[1] * (i/this.colorSteps) * this.life;
					color[2] += this.deltaColor[2] * (i/this.colorSteps) * this.life;
					alpha += this.deltaColor[3] * (i/this.colorSteps) * this.life; // Use the color alpha as global alpha for the sprite image

					var colorCanvas = document.createElement('canvas');
					colorCanvas.width = this.particleWidth;
					colorCanvas.height = this.particleHeight;
					var ctx = colorCanvas.getContext('2d');
					ctx.globalAlpha = alpha;
					var centerX = (1-scale)*0.5*this.particleWidth;
					var centerY = (1-scale)*0.5*this.particleHeight;
					ctx.translate(1-scale,scale);
					ctx.scale(scale,scale);
					
					ctx.drawImage(this.texture, 0, 0);

					// now use source-atop to "tint" the texture
					ctx.globalCompositeOperation = "source-atop";
					ctx.fillStyle = colorArrayToString(color);
					ctx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);

					this.colors.push(colorCanvas);
				}
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
				this.emitPoints = [];
				var emitPoint;

				if (path) {
					path.updatePath();
					var length = path.getLength();
					for (var i=0;i<length;i++) {
						emitPoint = path.getPositionFromLength(i);
						this.emitPoints.push([emitPoint.x, emitPoint.y]);
					}
				}

				return this;
			},

			start: function() {
				this._particlePool = [];

				this.buildColors();

				for (var i = 0; i < this.totalParticles; ++i) {
					this._particlePool.push(new CAAT.Module.Particle.Particle());
				}

				this._particleCount = 0;
				this._particleIndex = 0;
				this._elapsed = 0;
				this._emitCounter = 0;

				this.started = true;

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

				if (this.emitterPath) {
					var emitIndex = (Math.random()*(this.emitPoints.length-1)+1)|0;
					emitPoint = this.emitPoints[emitIndex];
					particle.startPos.x = emitPoint[0];
					particle.startPos.y = emitPoint[1];

					if (this.angleFromPath) {
						var x = emitPoint[0], y=emitPoint[1];
						var prevPoint = this.emitPoints[emitIndex-1];
						var pathAngle = Math.atan2(prevPoint[1] - y, x - prevPoint[0]); // y = positive down
						particle.startAngle = pathAngle;
						angle += pathAngle;
					}

				} else {
					emitPoint = [0,0];
				}

				particle.pos.x = emitPoint[0] + this.posVar.x * random11();
				particle.pos.y = emitPoint[1] + this.posVar.y * random11();

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

				particle.scale = this.startScale || 1;
				particle.deltaScale = typeof this.endScale != 'undefined' ? (this.endScale - this.startScale) : 0;
				particle.deltaScale /= particle.life;

				particle.radius = typeof this.radius != 'undefined' ? this.radius + (this.radiusVar || 0) * random11() : 0;

				particle.color = this.colors[0];
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

					p.forces.x = 0;
					p.forces.y = 0;

					p.radial.x = 0;
					p.radial.y = 0;

					// dont apply radial forces until moved away from the emitter
					if ((p.pos.x !== p.startPos.x || p.pos.y !== p.startPos.y) && (p.radialAccel || p.tangentialAccel)) {
						p.radial.x = p.pos.x - p.startPos.x;
						p.radial.y = p.pos.y - p.startPos.y;

						normalize(p.radial);
					}

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
					p.deltaLife = 1 - (p.life/this.life); 

					if (p.deltaLife < 0)  {p.deltaLife = 0;} // Math.max is EXPENSIVE
					p.color = this.colors[(p.deltaLife * this.colors.length) | 0];

					++this._particleIndex;
				} else {
					// the particle has died, time to return it to the particle pool
					// take the particle at the current index
					var temp = this._particlePool[i];

					// and move it to the end of the active particles, keeping all alive particles pushed
					// up to the front of the pool
					this._particlePool[i] = this._particlePool[this._particleCount - 1];
					this._particlePool[this._particleCount - 1] = temp;

					// decrease the count to indicate that one less particle in the pool is active.
					--this._particleCount;
				}
			},

			animate: function (director, time) {
				var i,l;

				if (!this.started) {
					return this;
				}

				if (!this.startTime) {
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

				CAAT.Module.Particle.Emitter.superclass.animate.call( this, director, time );

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

				if(this.textureAdditive) {
					ctx.globalCompositeOperation = 'lighter';
				} else {
					ctx.globalCompositeOperation = 'source-over';
				}

				var w, h;
				for(var i = 0; i < this._particlePool.length; ++i) {
					var p = this._particlePool[i];
					if (p.life > 0) {
						w = this.particleWidth*p.scale;
						h = this.particleHeight*p.scale;

						// figure out the x and y locations to render at, to center the texture in the buffer
						var x = p.pos.x - w / 2;
						var y = p.pos.y - h / 2;
						ctx.drawImage(p.color, x, y);
					}
				}
			}
		};
	}
});