/**
 * from http://www.kevs3d.co.uk/dev/canvask3d/scripts/mathlib.js 
 */
function extend(subc, superc, overrides)
{
   var F = function() {}, i;
   F.prototype = superc.prototype;
   subc.prototype = new F();
   subc.prototype.constructor = subc;
   subc.superclass = superc.prototype;
   if (superc.prototype.constructor == Object.prototype.constructor)   {
      superc.prototype.constructor = superc;
   }
   
   if (overrides) {
      for (i in overrides) {
         if (overrides.hasOwnProperty(i)) {
            subc.prototype[i] = overrides[i];
         }
      }
   }
}