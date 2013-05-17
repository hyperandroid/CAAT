CAAT.Module({
	/**
	 * @name Particle
	 * @memberof CAAT.Module.Particle
	 * @constructor
	 */

	defines : "CAAT.Module.Particle.Particle",
	extendsWith : function() {

		function toRad(deg) {
			return Math.PI * deg / 180;
		}

		return {
			__init : function() {
				this.pos = {
					x: 0,
					y: 0
				};

				this.startPos = {
					x: 0,
					y: 0
				};

				this.tangential = {
					x: 0,
					y: 0
				};

				this.forces = {
					x: 0,
					y: 0
				};

				this.radial = {
					x: 0,
					y: 0
				};

				this.setVelocity(0, 0);
				this.life = 0;

				return this;
			},

			setVelocity: function(angle, speed) {
				this.vel = {
					x: Math.cos(angle) * speed,
					y: -Math.sin(angle) * speed
				};
			},

			paint : function( ctx, time ) {
				console.log('particle paint');

			}

		};
	}
});