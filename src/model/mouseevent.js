/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * MouseEvent is a class to hold necessary information of every mouse event related to concrete
 * scene graph Actors.
 *
 * Here it is also the logic to on mouse events, pump the correct event to the appropiate scene
 * graph Actor.
 *
 * 20101008 Hyperandroid. changed event scope from CAAT.director.canvas to window. Works under
 *          al major browsers on linux and win7. Thanks @alteredq for this tip.
 *
 * TODO: add events for event pumping:
 *  + cancelBubling
 *
 **/
(function() {
	CAAT.MouseEvent = function() {
		this.point= new CAAT.Point();
		this.screenPoint= new CAAT.Point();
		return this;
	};
	
	CAAT.MouseEvent.prototype= {
		screenPoint:	null,
		point:			null,
		modifiers:		0,
		time:			0,
		source:			null,
		
		SHIFT:			16,
		CONTROL:		17,
		ALT:			18,

		SHIFT_MASK:		1,
		CONTROL_MASK:	2,
		ALT_MASK:		4,
		
		init : function( x,y,modifiers,source,screenPoint ) {
			this.point.set(x,y);
			this.modifiers= modifiers;
			this.source= source;
			this.screenPoint= screenPoint;
			return this;
		},
		isAltDown : function() {
			return this.modifiers&this.ALT_MASK;
		},
		isControlDown : function() {
			return this.modifiers&this.CONTROL_MASK;
		},
		isShiftDown : function() {
			return this.modifiers&this.SHIFT_MASK;
		}
	};
})();


// BUG: do not polute global namespace.
var __lastSelectedActor=  null;
var __mousePoint=         null;
var __prevMousePoint=     null;
var __screenMousePoint=   null;
var __mouseDown=          false;
var __modifiers=          0;
var __dragging=           false;
var __targetDirector=     null;
var __DRAG_THRESHOLD_X=   2;
var __DRAG_THRESHOLD_Y=   2;

function __getCanvasCoord(point, e) {
	var posx = 0;
	var posy = 0;
	if (!e) e = window.event;
	if (e.pageX || e.pageY) 	{
		posx = e.pageX;
		posy = e.pageY;
	}
	else if (e.clientX || e.clientY) 	{
		posx = e.clientX + document.body.scrollLeft
			+ document.documentElement.scrollLeft;
		posy = e.clientY + document.body.scrollTop
			+ document.documentElement.scrollTop;
	}

    var pposx;
    var pposy;
    var i;

    for( i=0; i<CAAT.director.length; i++ ) {
        pposx= posx;
        pposy= posy;

    	pposx-= CAAT.director[i].canvas.offsetLeft;
    	pposy-= CAAT.director[i].canvas.offsetTop;

        if ( CAAT.director[i].contains(pposx, pposy) ) {
            __targetDirector= CAAT.director[i];
            point.set(pposx,pposy);
            __screenMousePoint.set(pposx, pposy);
            return;
        }
    }

    __targetDirector=null;
    
//	point.set(posx,posy);
//	__screenMousePoint.set(posx, posy);
}

function __GlobalEnableEvents() {

    __mousePoint=         new CAAT.Point();
    __prevMousePoint=     new CAAT.Point();
    __screenMousePoint=   new CAAT.Point();

    window.addEventListener('keydown',
        function(evt,c) {
            var key = (evt.which) ? evt.which : event.keyCode;
            switch( key ) {
            case CAAT.MouseEvent.prototype.SHIFT:
                __modifiers|=CAAT.MouseEvent.prototype.SHIFT_MASK;
                break;
            case CAAT.MouseEvent.prototype.CONTROL:
                __modifiers|=CAAT.MouseEvent.prototype.CONTROL_MASK;
                break;
            case CAAT.MouseEvent.prototype.ALT:
                __modifiers|=CAAT.MouseEvent.prototype.ALT_MASK;
                break;
            }
        },
        false);

    window.addEventListener('keyup',
        function(evt,c) {
            var key = (evt.which) ? evt.which : event.keyCode;
            switch( key ) {
            case CAAT.MouseEvent.prototype.SHIFT:
                __modifiers&=~CAAT.MouseEvent.prototype.SHIFT_MASK;
                break;
            case CAAT.MouseEvent.prototype.CONTROL:
                __modifiers&=~CAAT.MouseEvent.prototype.CONTROL_MASK;
                break;
            case CAAT.MouseEvent.prototype.ALT:
                __modifiers&=~CAAT.MouseEvent.prototype.ALT_MASK;
                break;
            case 68:    // D
                if ( null!=__targetDirector ) {
                    __targetDirector.debug= !__targetDirector.debug;
                }
                break;
            }
        },
        false );


    window.addEventListener('mouseup',
            function(e) {
                __mouseDown = false;
                if (null != __lastSelectedActor) {
                    __lastSelectedActor.mouseUp(
                            new CAAT.MouseEvent().init(
                                    __lastSelectedActor.rpoint.x,
                                    __lastSelectedActor.rpoint.y,
                                    __modifiers,
                                    __lastSelectedActor,
                                    __screenMousePoint));
                }

                if (!__dragging) {
                    if (null != __lastSelectedActor) {
                        __lastSelectedActor.mouseClick(
                                new CAAT.MouseEvent().init(
                                        __lastSelectedActor.rpoint.x,
                                        __lastSelectedActor.rpoint.y,
                                        __modifiers,
                                        __lastSelectedActor,
                                        __screenMousePoint));
                    }
                } else {
                    __dragging = false;
                }
            },
            false);

    window.addEventListener('mousedown',
            function(e) {

                __getCanvasCoord(__mousePoint, e);

                if ( null==__targetDirector ) {
                    return;
                }
                __mouseDown = true;
                __lastSelectedActor = __targetDirector.findActorAtPosition(__mousePoint);
                var px= __mousePoint.x;
                var py= __mousePoint.y;
                
                if (null != __lastSelectedActor) {
                    // to calculate mouse drag threshold
                    __prevMousePoint.x= px;
                    __prevMousePoint.y= py;
                    __lastSelectedActor.mouseDown(
                            new CAAT.MouseEvent().init(
                                    __lastSelectedActor.rpoint.x,
                                    __lastSelectedActor.rpoint.y,
                                    __modifiers,
                                    __lastSelectedActor,
                                    __screenMousePoint));
                }
            },
            false);

    window.addEventListener('mouseover',
            function(e) {
                __getCanvasCoord(__mousePoint, e);

                if ( null==__targetDirector ) {
                    return;
                }

                __lastSelectedActor = __targetDirector.findActorAtPosition(__mousePoint);
                if (null != __lastSelectedActor) {
                    __lastSelectedActor.mouseEnter(
                            new CAAT.MouseEvent().init(
                                    __lastSelectedActor.rpoint.x,
                                    __lastSelectedActor.rpoint.y,
                                    __modifiers,
                                    __lastSelectedActor,
                                    __screenMousePoint));
                }
            },
            false);

    window.addEventListener('mouseout',
            function(e) {
                if (null != __lastSelectedActor) {
                    __lastSelectedActor.mouseExit(new CAAT.MouseEvent().init(0, 0, __modifiers, __lastSelectedActor, __screenMousePoint));
                    __lastSelectedActor = null;
                }
                __mouseDown = false;
            },
            false);

    window.addEventListener('mousemove',
            function(e) {

                __getCanvasCoord(__mousePoint, e);
                if ( null==__targetDirector ) {
                    return;
                }

                // drag
                if (__mouseDown && null != __lastSelectedActor) {

                    // check for mouse move threshold.
                    if ( !__dragging ) {
                        if ( Math.abs(__prevMousePoint.x-__mousePoint.x)< __DRAG_THRESHOLD_X &&
                             Math.abs(__prevMousePoint.y-__mousePoint.y)< __DRAG_THRESHOLD_Y ) {
                            return;
                        }
                    }

                    __dragging = true;
                    if (null != __lastSelectedActor.parent) {
                        __lastSelectedActor.parent.inverseTransformCoord(__mousePoint);
                    }
                    __lastSelectedActor.mouseDrag(
                            new CAAT.MouseEvent().init(
                                    __mousePoint.x,
                                    __mousePoint.y,
                                    __modifiers,
                                    __lastSelectedActor,
                                    __screenMousePoint));
                    return;
                }

                var lactor = __targetDirector.findActorAtPosition(__mousePoint);

                // cambiamos de actor.
                if (lactor != __lastSelectedActor) {
                    if (null != __lastSelectedActor) {
                        __lastSelectedActor.mouseExit(
                                new CAAT.MouseEvent().init(
                                        __mousePoint.x,
                                        __mousePoint.y,
                                        __modifiers,
                                        __lastSelectedActor,
                                        __screenMousePoint));
                    }
                    if (null != lactor) {
                        lactor.mouseEnter(
                                new CAAT.MouseEvent().init(
                                        lactor.rpoint.x,
                                        lactor.rpoint.y,
                                        __modifiers,
                                        lactor,
                                        __screenMousePoint));
                    }
                }
                __lastSelectedActor = lactor;
                if (null != lactor) {
                    __lastSelectedActor.mouseMove(
                            new CAAT.MouseEvent().init(
                                    __lastSelectedActor.rpoint.x,
                                    __lastSelectedActor.rpoint.y,
                                    __modifiers,
                                    __lastSelectedActor,
                                    __screenMousePoint));
                }
            },
            false);

    window.addEventListener("dblclick", function(e) {
        __getCanvasCoord(__mousePoint, e);
        if (null != __lastSelectedActor) {
            __lastSelectedActor.mouseDblClick(
                    new CAAT.MouseEvent().init(
                            __lastSelectedActor.rpoint.x,
                            __lastSelectedActor.rpoint.y,
                            __modifiers,
                            __lastSelectedActor,
                            __screenMousePoint));
        }
    }, false);
}