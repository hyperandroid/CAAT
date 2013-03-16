module.exports = function(grunt) {
	'use strict';

  // Project configuration.
  grunt.initConfig({
	jsdoc : {
		dist: {
			src: ['tasks/*.js', 'test/*_test.js'],
			options: {
				destination: 'doc'
			}
		}
	},
	nodeunit : {
		files : ['test/*_test.js']
	},
	jshint : {
		files : ['grunt.js', 'tasks/*.js', 'test/*.js'],
		options: {
			node : true,
			smarttabs : true
		}
	}
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Load local tasks.
  grunt.loadTasks('tasks');

  // Default task.
  grunt.registerTask('default', ['jshint', 'nodeunit']);

};
