/**
 * See LICENSE file.
 */

(function() {
    CAAT.modules.LayoutUtils= {};

    CAAT.modules.LayoutUtils.row= function( dst, what_to_layout_array, constraint_object ) {
        var actors= what_to_layout_array;
        var co= constraint_object;

        var width= dst.width;
        var x=0, y=0, i=0, l=0;
        var actor_max_h= Number.MIN_VALUE, actor_max_w= Number.MAX_VALUE;

        // compute max/min actor list size.
        for( i=actors.length-1; i; i-=1 ) {
            if ( actor_max_w<actors[i].width ) {
                actor_max_w= actors[i].width;
            }
            if ( actor_max_h<actors[i].height ) {
                actor_max_h= actors[i].height;
            }
        }

        if ( co.padding_left ) {
            x= co.padding_left;
            width-= x;
        }
        if ( co.padding_right ) {
            width-= co.padding_right;
        }

        if ( co.top ) {
            var top= parseInt(co.top, 10);
            if ( !isNaN(top) ) {
                y= top;
            } else {
                // not number
                switch(co.top) {
                    case 'center':
                        y= (dst.height-actor_max_h)/2;
                        break;
                    case 'top':
                        y=0;
                        break;
                    case 'bottom':
                        y= dst.height-actor_max_h;
                        break;
                    defatul:
                        y= 0;
                }
            }
        }

        // space for each actor
        var actor_area= width / actors.length;

        for( i=0, l=actors.length; i<l; i++ ) {
            actors[i].setLocation(
                x + i * actor_area + (actor_area - actors[i].width) / 2,
                y);
        }

    };
})();