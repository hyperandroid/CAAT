CAAT.Module( {

    /**
     * @name TextureProgram
     * @memberOf CAAT.WebGL
     * @extends CAAT.WebGL.Program
     * @constructor
     */

    defines : "CAAT.WebGL.TextureProgram",
    aliases : ["CAAT.TextureProgram"],
    extendsClass : "CAAT.WebGL.Program",
    depends : [
        "CAAT.WebGL.Program"
    ],
    extendsWith : {

        /**
         * @lends CAAT.WebGL.TextureProgram.prototype
         */

        __init : function(gl) {
            this.__super(gl);
            return this;
        },

        /**
         * VertextBuffer GLBuffer
         */
        vertexPositionBuffer:   null,

        /**
         * VertextBuffer Float32 Array
         */
        vertexPositionArray:    null,

        /**
         * UVBuffer GLBuffer
         */
        vertexUVBuffer:         null,

        /**
         * VertexBuffer Float32 Array
         */
        vertexUVArray:          null,

        /**
         * VertexIndex GLBuffer.
         */
        vertexIndexBuffer:      null,

        /**
         * Lines GLBuffer
         */
        linesBuffer:            null,

        /**
         *
         */
        prevAlpha:              -1,

        /**
         *
         */
        prevR:                  -1,

        /**
         *
         */
        prevG:                  -1,

        /**
         *
         */
        prevB:                  -1,

        /**
         *
         */
        prevA:                  -1,

        /**
         *
         */
        prevTexture:            null,

        getFragmentShader : function() {
            return this.getShader( this.gl, "x-shader/x-fragment",
                    "#ifdef GL_ES \n"+
                    "precision highp float; \n"+
                    "#endif \n"+

                    "varying vec2 vTextureCoord; \n"+
                    "uniform sampler2D uSampler; \n"+
                    "uniform float alpha; \n"+
                    "uniform bool uUseColor;\n"+
                    "uniform vec4 uColor;\n"+

                    "void main(void) { \n"+

                    "if ( uUseColor ) {\n"+
                    "  gl_FragColor= vec4(uColor.r*alpha, uColor.g*alpha, uColor.b*alpha, uColor.a*alpha);\n"+
                    "} else { \n"+
                    "  vec4 textureColor= texture2D(uSampler, vec2(vTextureCoord)); \n"+
// Fix FF   "  gl_FragColor = vec4(textureColor.rgb, textureColor.a * alpha); \n"+
                    "  gl_FragColor = vec4(textureColor.r*alpha, textureColor.g*alpha, textureColor.b*alpha, textureColor.a * alpha ); \n"+
                    "}\n"+

                    "}\n"
                    );
        },
        getVertexShader : function() {
            return this.getShader(this.gl, "x-shader/x-vertex",
                    "attribute vec3 aVertexPosition; \n"+
                    "attribute vec2 aTextureCoord; \n"+

                    "uniform mat4 uPMatrix; \n"+

                    "varying vec2 vTextureCoord; \n"+

                    "void main(void) { \n"+
                    "gl_Position = uPMatrix * vec4(aVertexPosition, 1.0); \n"+
                    "vTextureCoord = aTextureCoord;\n"+
                    "}\n"
                    );
        },
        useProgram : function() {
            CAAT.TextureProgram.superclass.useProgram.call(this);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer );
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexUVBuffer);
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
        },
        initialize : function() {

            var i;

            this.linesBuffer= this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.linesBuffer );
            var arr= [];
            for( i=0; i<1024; i++ ) {
                arr[i]= i;
            }
            this.linesBufferArray= new Uint16Array(arr);
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.linesBufferArray, this.gl.DYNAMIC_DRAW);


            this.shaderProgram.vertexPositionAttribute =
                    this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
            this.gl.enableVertexAttribArray(
                    this.shaderProgram.vertexPositionAttribute);

            this.shaderProgram.textureCoordAttribute =
                    this.gl.getAttribLocation(this.shaderProgram, "aTextureCoord");
            this.gl.enableVertexAttribArray(
                    this.shaderProgram.textureCoordAttribute);

            this.shaderProgram.pMatrixUniform =
                    this.gl.getUniformLocation(this.shaderProgram, "uPMatrix");
            this.shaderProgram.samplerUniform =
                    this.gl.getUniformLocation(this.shaderProgram, "uSampler");
            this.shaderProgram.alphaUniform   =
                    this.gl.getUniformLocation(this.shaderProgram, "alpha");
            this.shaderProgram.useColor =
                    this.gl.getUniformLocation(this.shaderProgram, "uUseColor");
            this.shaderProgram.color =
                    this.gl.getUniformLocation(this.shaderProgram, "uColor");

            this.setAlpha(1);
            this.setUseColor(false);

            var maxTris=4096;
            /// set vertex data
            this.vertexPositionBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer );
            this.vertexPositionArray= new Float32Array(maxTris*12);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexPositionArray, this.gl.DYNAMIC_DRAW);
            this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);

            // uv info
            this.vertexUVBuffer= this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexUVBuffer);
            this.vertexUVArray= new Float32Array(maxTris*8);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexUVArray, this.gl.DYNAMIC_DRAW);
            this.gl.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, 2, this.gl.FLOAT, false, 0, 0);

            // vertex index
            this.vertexIndexBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);            
            var vertexIndex = [];
            for( i=0; i<maxTris; i++ ) {
                vertexIndex.push(0 + i*4); vertexIndex.push(1 + i*4); vertexIndex.push(2 + i*4);
                vertexIndex.push(0 + i*4); vertexIndex.push(2 + i*4); vertexIndex.push(3 + i*4);
            }
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndex), this.gl.DYNAMIC_DRAW);

            return CAAT.TextureProgram.superclass.initialize.call(this);
        },
        setUseColor : function( use,r,g,b,a ) {
            this.gl.uniform1i(this.shaderProgram.useColor, use?1:0);
            if ( use ) {
                if ( this.prevA!==a || this.prevR!==r || this.prevG!==g || this.prevB!==b ) {
                    this.gl.uniform4f(this.shaderProgram.color, r,g,b,a );
                    this.prevA= a;
                    this.prevR= r;
                    this.prevG= g;
                    this.prevB= b;
                }
            }
        },
        setTexture : function( glTexture ) {
            if ( this.prevTexture!==glTexture ) {
                var gl= this.gl;

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, glTexture);
                gl.uniform1i(this.shaderProgram.samplerUniform, 0);

                this.prevTexture= glTexture;
            }

            return this;
        },
        updateVertexBuffer : function(vertexArray) {
            var gl= this.gl;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer );
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertexArray);
            return this;
        },
        updateUVBuffer : function(uvArray) {
            var gl= this.gl;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexUVBuffer );
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, uvArray);
            return this;
        },
        setAlpha : function(alpha) {
            if ( this.prevAlpha !== alpha ) {
                this.gl.uniform1f(
                    this.shaderProgram.alphaUniform, alpha);
                this.prevAlpha= alpha;
            }
            return this;
        },
        /**
         *
         * @param lines_data {Float32Array} array of number with x,y,z coords for each line point.
         * @param size {number} number of lines to draw.
         * @param r
         * @param g
         * @param b
         * @param a
         * @param lineWidth {number} drawing line size.
         */
        drawLines : function( lines_data, size, r,g,b,a, lineWidth ) {
            var gl= this.gl;

            this.setAlpha( a );

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.linesBuffer );
            gl.lineWidth(lineWidth);

            this.updateVertexBuffer(lines_data);
            this.setUseColor(true, r,g,b,1 );
            gl.drawElements(gl.LINES, size, gl.UNSIGNED_SHORT, 0);

            /// restore
            this.setAlpha( 1 );
            this.setUseColor(false);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);

        },
        /**
         * 
         * @param polyline_data
         * @param size
         * @param r
         * @param g
         * @param b
         * @param a
         * @param lineWidth
         */
        drawPolylines : function( polyline_data, size, r,g,b,a, lineWidth ) {
            var gl= this.gl;

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.linesBuffer );
            gl.lineWidth(lineWidth);

            this.setAlpha(a);

            this.updateVertexBuffer(polyline_data);
            this.setUseColor(true, r,g,b,1 );
            gl.drawElements(gl.LINE_STRIP, size, gl.UNSIGNED_SHORT, 0);

            /// restore
            this.setAlpha( 1 );
            this.setUseColor(false);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);

        }
    }
});
