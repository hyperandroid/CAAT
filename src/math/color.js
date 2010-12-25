/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * Rectangle Class.
 * Needed to compute Curve bounding box.
 * Needed to compute Actor affected area on change.
 *
 **/
(function() {
	CAAT.Color = function() {
		return this;
	};
	CAAT.Color.prototype= {
		/**
		 * HSV to RGB color conversion
		 *
		 * H runs from 0 to 360 degrees
		 * S and V run from 0 to 100
		 *
		 * Ported from the excellent java algorithm by Eugene Vishnevsky at:
		 * http://www.cs.rit.edu/~ncs/color/t_convert.html
		 */
		hsvToRgb: function(h, s, v)
		{
			var r, g, b;
			var i;
			var f, p, q, t;

			// Make sure our arguments stay in-range
			h = Math.max(0, Math.min(360, h));
			s = Math.max(0, Math.min(100, s));
			v = Math.max(0, Math.min(100, v));

			// We accept saturation and value arguments from 0 to 100 because that's
			// how Photoshop represents those values. Internally, however, the
			// saturation and value are calculated from a range of 0 to 1. We make
			// That conversion here.
			s /= 100;
			v /= 100;

			if(s == 0) {
				// Achromatic (grey)
				r = g = b = v;
				return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
			}

			h /= 60; // sector 0 to 5
			i = Math.floor(h);
			f = h - i; // factorial part of h
			p = v * (1 - s);
			q = v * (1 - s * f);
			t = v * (1 - s * (1 - f));

			switch(i) {
				case 0:
					r = v;
					g = t;
					b = p;
					break;

				case 1:
					r = q;
					g = v;
					b = p;
					break;

				case 2:
					r = p;
					g = v;
					b = t;
					break;

				case 3:
					r = p;
					g = q;
					b = v;
					break;

				case 4:
					r = t;
					g = p;
					b = v;
					break;

				default: // case 5:
					r = v;
					g = p;
					b = q;
			}

			return new CAAT.Color.RGB(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
		}
	};
})();

(function() {
	CAAT.Color.RGB = function(r, g, b) {
		this.r = r || 255;
		this.g = g || 255;
		this.b = b || 255;
		return this;
	};
	CAAT.Color.RGB.prototype= {
		r: 255,
		g: 255,
		b: 255,

		toHex: function() {
			// See: http://jsperf.com/rgb-decimal-to-hex/5
			return ('000000' + ((this.r << 16) + (this.g << 8) + this.b).toString(16)).slice(-6);
		}
	};
})();
