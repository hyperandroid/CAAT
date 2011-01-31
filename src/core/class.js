/**
 * based on http://www.kevs3d.co.uk/dev/canvask3d/scripts/mathlib.js 
 */
function extend(subc, superc, overrides)
{
   /**
    * @constructor
    */
   var F = function() {};
   var i;

    /*
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
    */

    if (overrides) {
        F.prototype = superc.prototype;
        subc.prototype = new F();
        subc.prototype.constructor = subc;
        subc.superclass = superc.prototype;
        if (superc.prototype.constructor == Object.prototype.constructor)   {
           superc.prototype.constructor = superc;
        }
       for (i in overrides) {
          if (overrides.hasOwnProperty(i)) {
             subc.prototype[i] = overrides[i];
          }
       }
    } else {

        subc.prototype.constructor = subc;
        subc.superclass= superc.prototype;
        if (superc.prototype.constructor == Object.prototype.constructor)   {
           superc.prototype.constructor = superc;
        }
        for( i in superc.prototype ) {
            if ( false==subc.prototype.hasOwnProperty(i)) {
                subc.prototype[i]= superc.prototype[i];
            }
        }

    }

}