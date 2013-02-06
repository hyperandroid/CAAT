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
		var fs			= require('fs'),
			path		= require('path'),
			options		= grunt.task.current.options(),
			done		= grunt.task.current.async(),
			srcs		= grunt.task.current.filesSrc,
		    dest		= grunt.task.current.files[0].dest || 'doc',
		    config		= options.config,
			javaHome	= process.env.JAVA_HOME,
			timeout		= 60000,	//todo implement and move in options
			jsDoc;

		/**
		 * Build and execute a child process using the spawn function
		 * @memberOf module:tasks/jsdoc-plugin#registerJsdocTask
		 * @param {String} script the script to run
		 * @param {Array} sources the list of sources files 
		 * @param {String} destination the destination directory
		 * @param {String} [config] the path to a jsdoc config file
		 * @return {ChildProcess}  from the spawn 
		 */
		var buildSpawned = function(script, sources, destination, config){
			var isWin = process.platform === 'win32',
				cmd = (isWin) ? 'cmd' : script,
				args = (isWin) ? ['/c', script] : [],
				spawn = require('child_process').spawn;
			
			if (config !== undefined) {
				args.push('-c');
				args.push(config);
			}
			args.push('-d');
			args.push(destination);
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
		 * @memberOf module:tasks/jsdoc-plugin#registerJsdocTask
		 * @returns {String} the command absolute path
		 */
		var jsDocLookup = function(){
			
			var base = 'node_modules/jsdoc/jsdoc',
				paths = [ base, 'node_modules/grunt-contrib-jsdoc/' + base ],
				nodePath = process.env.NODE_PATH || '',
				_ = grunt.util._;

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
		jsDoc = jsDocLookup();

		//check if java is set
		if(!javaHome){
			grunt.log.error("JAVA_HOME is no set, but java is required by jsdoc to run.");
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
		if (config !== undefined && !fs.existsSync(config)){
			grunt.log.error('jsdoc config file path does not exist');
			grunt.fail.warn('Wrong configuration', errorCode.generic);
		}

		fs.exists(dest, function(exists){
			//if the destination don't exists, we create it
			if(!exists){
				grunt.file.mkdir(dest);
			}

			//execution of the jsdoc command
			var child = buildSpawned(jsDoc, srcs, dest, config);
			child.stdout.on('data', function (data) {
				grunt.log.debug('jsdoc output : ' + data);
			});
			child.stderr.on('data', function (data) {
				grunt.log.error('An error occurs in jsdoc process:\n' + data);
				grunt.fail.warn('jsdoc failure', errorCode.task);
			});	
			child.on('exit', function(code){
				if(code === 0){
					grunt.log.write('Documentation generated to ' + path.resolve(dest));
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
