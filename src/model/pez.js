/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * An special Actor. This will be deleted, and changed code into a PathBehaviour.
 *
 **/
(function() {

	CAAT.Pez= function() {
		CAAT.Pez.superclass.constructor.call(this);
		
		this.setAnimationImageIndex( [0,1,2,1] );
		this.changeFPS= 300;
		
		return this;
	};
	
	extend( CAAT.Pez, CAAT.SpriteActor, {

		path:		null,
		prevX:		-1,
		prevY:		-1,
		animate : function( director, time )	{

			var point= this.pathMeasure.positionOnTime(time);
			point.x-=this.width/2;

            /**
             * -.5, -.5, path por el centro.
             * 0, -1     por dentro de curva
             * -1, 0     por encima de curva
             */
			var signo=1;
			if ( this.x<=point.x )	{	// por encima de curva
				signo=-1;
			} else {					// por debajo de la curva
				signo=0;
			}

			point.y+=this.height * signo;


			if ( -1==this.prevX && -1==this.prevY )	{
				this.prevX= point.x;
				this.prevY= point.y;
			}
			else	{
				var ax= point.x-this.x;
				var ay= point.y-this.y;

				var angle= Math.atan2( ay, ax );

				/* eliminar este bloque para hacer que siga toda la curva. */
				if ( this.x<=point.x )	{
					this.transformation= CAAT.SpriteActor.prototype.TR_NONE;
				}
				else	{
					this.transformation= CAAT.SpriteActor.prototype.TR_FLIP_HORIZONTAL;
					angle+=Math.PI;
				}

                this.setRotationAnchored( angle, this.width/2, -this.height*signo );
			}

			this.prevX= point.x;
			this.prevY= point.y;

			this.setLocation(point.x, point.y);
			CAAT.Pez.superclass.animate.call(this, director, time);
		}		
	});
})();