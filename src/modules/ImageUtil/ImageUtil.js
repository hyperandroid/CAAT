(function() {

    CAAT.modules.ImageUtil= function() {
        return this;
    };

    CAAT.modules.ImageUtil.prototype= {
        createAlphaSpriteSheet: function(maxAlpha, minAlpha, sheetSize, image ) {

            if ( maxAlpha<minAlpha ) {
                var t= maxAlpha;
                maxAlpha= minAlpha;
                minAlpha= t;
            }

            var canvas= document.createElement('canvas');
            canvas.width= image.width;
            canvas.height= image.height*sheetSize;
            var ctx= canvas.getContext('2d');
            ctx.fillStyle = 'rgba(255,255,255,0)';
            ctx.clearRect(0,0,image.width,image.height*sheetSize);

            var i;
            for( i=0; i<sheetSize; i++ ) {
                ctx.globalAlpha= 1-(maxAlpha-minAlpha)/sheetSize*i;
                ctx.drawImage(image, 0, i*image.height);
            }

            return canvas;
        }
    }
})();