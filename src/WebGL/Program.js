/**
 * See LICENSE file.
 */

CAAT.Module( {


    /**
     * @name WebGL
     * @memberOf CAAT
     * @namespace
     */

    /**
     * @name Program
     * @memberOf CAAT.WebGL
     * @constructor
     */


    defines : "CAAT.WebGL.Program",
    extendsWith : {

        /**
         * @lends CAAT.WebGL.Program.prototype
         */

        __init : function(gl) {
            this.gl= gl;
            return this;
        },

        /**
         *
         */
        shaderProgram:  null,

        /**
         * Canvas 3D context.
         */
        gl:             null,

        /**
         * Set fragment shader's alpha composite value.
         * @param alpha {number} float value 0..1.
         */
        setAlpha : function( alpha ) {

        },
        getShader : function (gl,type,str) {
            var shader;
            if (type === "x-shader/x-fragment") {
                shader = gl.createShader(gl.FRAGMENT_SHADER);
            } else if (type === "x-shader/x-vertex") {
                shader = gl.createShader(gl.VERTEX_SHADER);
            } else {
                return null;
            }

            gl.shaderSource(shader, str);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                alert(gl.getShaderInfoLog(shader));
                return null;
            }

            return shader;

        },
        getDomShader : function(gl, id) {
            var shaderScript = document.getElementById(id);
            if (!shaderScript) {
                return null;
            }

            var str = "";
            var k = shaderScript.firstChild;
            while (k) {
                if (k.nodeType === 3) {
                    str += k.textContent;
                }
                k = k.nextSibling;
            }

            var shader;
            if (shaderScript.type === "x-shader/x-fragment") {
                shader = gl.createShader(gl.FRAGMENT_SHADER);
            } else if (shaderScript.type === "x-shader/x-vertex") {
                shader = gl.createShader(gl.VERTEX_SHADER);
            } else {
                return null;
            }

            gl.shaderSource(shader, str);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                alert(gl.getShaderInfoLog(shader));
                return null;
            }

            return shader;
        },
        initialize : function() {
            return this;
        },
        getFragmentShader : function() {
            return null;
        },
        getVertexShader : function() {
            return null;
        },
        create : function() {
            var gl= this.gl;

            this.shaderProgram = gl.createProgram();
            gl.attachShader(this.shaderProgram, this.getVertexShader());
            gl.attachShader(this.shaderProgram, this.getFragmentShader());
            gl.linkProgram(this.shaderProgram);
            gl.useProgram(this.shaderProgram);
            return this;
        },
        setMatrixUniform : function( caatMatrix4 ) {
            this.gl.uniformMatrix4fv(
                    this.shaderProgram.pMatrixUniform,
                    false,
                    new Float32Array(caatMatrix4.flatten()));

        },
        useProgram : function() {
            this.gl.useProgram(this.shaderProgram);
            return this;
        }
    }
});
