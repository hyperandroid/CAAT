/**
 * @fileoverview NodeUnit test 
 * @copyright Bertrand Chevrier 2012
 * @author Bertrand Chevrier <chevrier.bertrand@gmail.com>
 * @license MIT
 * 
 * @module test/jsdoc-plugin_test
 */


/**
 * @requires grunt
 */
var grunt = require('grunt');


/**
 * This function enables you to extract 
 * the declared arguments from a function.
 * @param {function} fn - the function to extract the arguments for
 * @returns {array} the list of arguments
 * @throw {error} in case of wrong argument given
 */
var extractArgs = function(fn){
	'use strict';

	if(typeof fn !== 'function'){
		throw new Error('TypeError : The extractArgs function requires the fn argument to be a function!');
	}
	return fn.toString ().match (/function\s+\w*\s*\((.*?)\)/)[1].split (/\s*,\s*/);
};

/**
 * NodeUnit group of test that check the jsdoc Grunt task.
 * 
 * @see https://github.com/caolan/nodeunit/
 * 
 * @class JsdocTest
 */
exports.JsdocTest = {
	
	/**
	 * Set up the test by load the tasks/jsdoc-plugin module
	 * @memberOf JsdocTest
	 * @param {Function} done - to call once the setup is done.
	 */
	setUp: function(done) {
		'use strict';

		this.jsdocTask = require('../tasks/jsdoc-plugin');
		done();
	},

	/**
	 * Check the task is loaded and complies with the grunt requirements.
	 * @memberOf JsdocTest
	 * @param {Object} test - the node unit test context
	 */
	'taskCheck' : function(test){
		'use strict';	
	
		test.notStrictEqual(this.jsdocTask, undefined, 'the jsdoc task should be set up');
		test.equal(typeof this.jsdocTask, 'function', 'the task must be a function');	
		
		var taskArgs = extractArgs(this.jsdocTask);
		test.ok(taskArgs.length > 0 && taskArgs[0] === 'grunt', 'the task must declare the grunt context as 1st parameter');
		
		test.done();
	}
};
