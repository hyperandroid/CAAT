CAAT.Module( {
    defines : "CAAT.Event.TouchInfo",
    aliases : ["CAAT.TouchInfo"],
    extendsWith : {
        __init : function( id, x, y, target ) {

            this.identifier= id;
            this.clientX= x;
            this.pageX= x;
            this.clientY= y;
            this.pageY= y;
            this.target= target;
            this.time= new Date().getTime();

            return this;
        }
    }
});
