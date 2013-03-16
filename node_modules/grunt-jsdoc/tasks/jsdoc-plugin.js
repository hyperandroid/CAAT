/**
 * @fileoverview This task helps you to run jsdoc3 to generate doc in your Grunt build sequence
 * @copyright Bertrand Chevrier 2012
 * @author Bertrand Chevrier <chevrier.bertrand@gmail.com>
 * @license MIT
 * 
 * @module tasks/jsdoc-plugin
 */

/**
 * Register the jsdoc task and helpers to Grunt
 * @constructor
 * @type GruntTask
 * @param {Object} grunt - the grunt context
 */
module.exports = function jsDocTask(grunt) {
	'use strict';

	var util = require('util'),
	    errorCode = {
			generic : 1,
			task	: 3	
		};

	/**
     * Register the jsdoc task to Grunt
     * @memberOf module:tasks/jsdoc-plugin
     */
	function registerJsdocTask() {
		var fs				= require('fs'),
			path			= require('path'),
			options			= grunt.task.current.options({'private': true}),
			done			= grunt.task.current.async(),
			srcs			= grunt.task.current.filesSrc,
			javaHome		= process.env.JAVA_HOME,
			jsDocPath		= grunt.task.current.data.jsdoc,
			jsDocNpmPath	= 'node_modules/jsdoc/jsdoc',  
			timeout			= 60000,	//todo implement and move in options
			jsDoc;

		if (!options.destination) {
			// Support for old syntax where destination was provided through 'dest' key
			options.destination = grunt.task.current.files[0].dest || 'doc';
		}

		/**
		 * Build and execute a child process using the spawn function
		 * @memberOf module:tasks/jsdoc-plugin
		 * @param {String} script - the script to run
		 * @param {Array} sources - the list of sources files 
		 * @param {Object} options - the list of JSDoc options
		 * @return {ChildProcess}  from the spawn
		 */
		var buildSpawned = function(script, sources, options){
			var isWin = process.platform === 'win32',
				cmd = (isWin) ? 'cmd' : script,
				args = (isWin) ? ['/c', script] : [],
				spawn = require('child_process').spawn;
			
			// Compute JSDoc options
			for (var optionName in options) {
				grunt.log.debug("Reading option: " + optionName);
				args.push('--' + optionName);
				if (options.hasOwnProperty(optionName) && typeof(options[optionName]) === 'string') {
					grunt.log.debug("                > " + options[optionName]);
					args.push(options[optionName]);
				}
			}

			if(!util.isArray(sources)){
				sources = [sources];
			} 
			args.push.apply(args, sources);
			
			grunt.log.debug("Running : "+ cmd + " " + args.join(' '));
			
			return spawn(cmd, args);
		};

		/**
		 * Lookup for the jsdoc executable throught the different configurations
		 * @todo find a more elegant way to do that...
		 * @memberOf module:tasks/jsdoc-plugin
		 * @param {String} base - the base path of jsdoc to look up in the different directories
		 * @param {String} [path] - a defined path to the jsdoc bin, in case of a non standard location
		 * @returns {String} the command absolute path
		 */
		var jsDocLookup = function(base, extPath){
			
			var paths = [],
				nodePath = process.env.NODE_PATH || '',
				_ = grunt.util._;

			if(extPath && typeof extPath === 'string'){
				paths.push(extPath);
			}
			paths.push(base);
			paths.push('node_modules/grunt-jsdoc/' + base);

			_.map(nodePath.split(':'), function(p){
				if(!/\/$/.test(p)){
					p += '/';
				}
				paths.push(p + base);
			});
		
			for(var i in paths){
				grunt.log.debug('look up jsdoc at ' + paths[i]);
				if(fs.existsSync(paths[i])){
					//get the absolute path
					return path.resolve(paths[i]);
				}
			}
		};
		jsDoc = jsDocLookup(jsDocNpmPath, jsDocPath);

		//check if java is set
		if(!javaHome){
			grunt.log.error("JAVA_HOME is not set, but java is required by jsdoc to run.");
			grunt.fail.warn('Wrong installation/environnement', errorCode.generic);
		} else {
			grunt.log.debug("JAVA_HOME : " + javaHome);
		}

		//check if jsdoc npm module is installedz
		if(jsDoc === undefined){
			grunt.log.error('Unable to locate jsdoc');
			grunt.fail.warn('Wrong installation/environnement', errorCode.generic);
		} else {
			grunt.log.debug("jsdoc found at : " + jsDoc);
		}

		//check if there is sources to generate the doc for
		if(srcs.length === 0){
			grunt.log.error('No source files defined');
			grunt.fail.warn('Wrong configuration', errorCode.generic);
		}

		//check if jsdoc config file path is provided and does exist
		if (options.config && !fs.existsSync(options.config)){
			grunt.log.error('jsdoc config file path does not exist');
			grunt.fail.warn('Wrong configuration', errorCode.generic);
		}

		fs.exists(options.destination, function(exists){
			//if the destination don't exists, we create it
			if(!exists){
				grunt.file.mkdir(options.destination);
			}

			//execution of the jsdoc command
			var child = buildSpawned(jsDoc, srcs, options);
			child.stdout.on('data', function (data) {
				grunt.log.debug('jsdoc output : ' + data);
			});
			child.stderr.on('data', function (data) {
				grunt.log.error('An error occurs in jsdoc process:\n' + data);
				grunt.fail.warn('jsdoc failure', errorCode.task);
			});	
			child.on('exit', function(code){
				if(code === 0){
					grunt.log.write('Documentation generated to ' + path.resolve(options.destination));
					done(true);
				} else {
					grunt.log.error('jsdoc terminated');
					grunt.fail.warn('jsdoc failure', errorCode.task);
				}
			});
		});
	}

	//bind the task to the grunt context
	grunt.registerMultiTask('jsdoc', 'Generates source documentation using jsdoc', registerJsdocTask);
};
