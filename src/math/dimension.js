(function() {

    CAAT.Dimension= function(w,h) {
        this.width= w;
        this.height= h;
        return this;
    };

    CAAT.Dimension.prototype= {
        width   : 0,
        height  : 0
    };

}());