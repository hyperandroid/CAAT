CAAT.Module({
    defines:"CAAT.Module.LayoutUtils.RowLayout",
    constants:{
        Row:function (dst, what_to_layout_array, constraint_object) {

            var width = dst.width;
            var x = 0, y = 0, i = 0, l = 0;
            var actor_max_h = -Number.MAX_VALUE, actor_max_w = Number.MAX_VALUE;

            // compute max/min actor list size.
            for (i = what_to_layout_array.length - 1; i; i -= 1) {
                if (actor_max_w < what_to_layout_array[i].width) {
                    actor_max_w = what_to_layout_array[i].width;
                }
                if (actor_max_h < what_to_layout_array[i].height) {
                    actor_max_h = what_to_layout_array[i].height;
                }
            }

            if (constraint_object.padding_left) {
                x = constraint_object.padding_left;
                width -= x;
            }
            if (constraint_object.padding_right) {
                width -= constraint_object.padding_right;
            }

            if (constraint_object.top) {
                var top = parseInt(constraint_object.top, 10);
                if (!isNaN(top)) {
                    y = top;
                } else {
                    // not number
                    switch (constraint_object.top) {
                        case 'center':
                            y = (dst.height - actor_max_h) / 2;
                            break;
                        case 'top':
                            y = 0;
                            break;
                        case 'bottom':
                            y = dst.height - actor_max_h;
                            break;
                        default:
                            y = 0;
                    }
                }
            }

            // space for each actor
            var actor_area = width / what_to_layout_array.length;

            for (i = 0, l = what_to_layout_array.length; i < l; i++) {
                what_to_layout_array[i].setLocation(
                    x + i * actor_area + (actor_area - what_to_layout_array[i].width) / 2,
                    y);
            }

        }
    }
});