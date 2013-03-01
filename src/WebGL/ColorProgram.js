CAAT.Module( {

    /**
     * @name ColorProgram
     * @memberOf CAAT.WebGL
     * @extends CAAT.WebGL.Program
     * @constructor
     */

    defines : "CAAT.WebGL.ColorProgram",
    aliases : ["CAAT.ColorProgram"],
    extendsClass : "CAAT.WebGL.Program",
    depends : [
        "CAAT.WebGL.Program"
    ],
    extendsWith : {

        /**
         * @lends CAAT.WebGL.ColorProgram.prototype
         */


        __init : function(gl) {
            this.__super(gl);
            return this;
        },

        /**
         * int32 Array for color Buffer
         */
        colorBuffer:    null,

        /**
         * GLBuffer for vertex buffer.
         */
        vertexPositionBuffer:   null,

        /**
         * Float32 Array for vertex buffer.
         */
        vertexPositionArray:    null,

        getFragmentShader : function() {
            return this.getShader(this.gl, "x-shader/x-fragment",
                    "#ifdef GL_ES \n"+
                    "precision highp float; \n"+
                    "#endif \n"+

                    "varying vec4 color; \n"+
                            
                    "void main(void) { \n"+
                    "  gl_FragColor = color;\n"+
                    "}\n"
                    );

        },
        getVertexShader : function() {
            return this.getShader(this.gl, "x-shader/x-vertex",
                    "attribute vec3 aVertexPosition; \n"+
                    "attribute vec4 aColor; \n"+
                    "uniform mat4 uPMatrix; \n"+
                    "varying vec4 color; \n"+

                    "void main(void) { \n"+
                    "gl_Position = uPMatrix * vec4(aVertexPosition, 1.0); \n"+
                    "color= aColor; \n"+
                    "}\n"
                    );
        },
        initialize : function() {
            this.shaderProgram.vertexPositionAttribute =
                    this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
            this.gl.enableVertexAttribArray(
                    this.shaderProgram.vertexPositionAttribute);

            this.shaderProgram.vertexColorAttribute =
                    this.gl.getAttribLocation(this.shaderProgram, "aColor");
            this.gl.enableVertexAttribArray(
                    this.shaderProgram.vertexColorAttribute);

            this.shaderProgram.pMatrixUniform =
                    this.gl.getUniformLocation(this.shaderProgram, "uPMatrix");

            this.useProgram();

            this.colorBuffer= this.gl.createBuffer();
            this.setColor( [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1] );

            var maxTris=512, i;
            /// set vertex data
            this.vertexPositionBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer );
            this.vertexPositionArray= new Float32Array(maxTris*12);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexPositionArray, this.gl.DYNAMIC_DRAW);
            this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);

            return CAAT.ColorProgram.superclass.initialize.call(this);
        },
        setColor : function( colorArray ) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer );
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colorArray), this.gl.STATIC_DRAW);

            this.gl.vertexAttribPointer(
                    this.shaderProgram.vertexColorAttribute,
                    this.colorBuffer,
                    this.gl.FLOAT,
                    false,
                    0,
                    0);
        }
    }

});
