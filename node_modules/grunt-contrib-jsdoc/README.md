# grunt-jsdoc-plugin

This plugin enables you to integrate the generation of comments based documentation into your Grunt build.


## Install

You need [grunt >= 0.4][grunt] as well as [node] and [npm] installed and running on your system.

You also need `java` installed and a valid `JAVA_HOME` environment variable set.

Install this grunt plugin next to your project's [Gruntfile.js][getting_started] with: 

```bash
npm install grunt-contrib-jsdoc
```

## Documentation

### Configuration

Configure the plugin to your project's [Gruntfile.js][getting_started].

First, add the `jsdoc` entry to the options of the `initConfig` method :

```javascript
grunt.initConfig({
    jsdoc : {
        dist : {
            src: ['src/*.js', 'test/*.js'], 
            dest: 'doc'
        }
    }
});
```

The only supported options are 

 * `src` : an array of pattern that matches the files to extract the documentation from. You can also add the pattern to a README.md file to include it in your doc as described [there](http://usejsdoc.org/about-including-readme.html).
 * `dest`: the directory where the documentation will be generated (it will be created if needed).
 * `config` : (optional) a path to a jsdoc config file (refer the [usejsdoc] documentation below for more information).

Then, load the plugin 

```javascript
grunt.loadNpmTasks('grunt-contrib-jsdoc');
```

### Documentation

The current version supports only [jsdoc3] documentation style. The sources configured 
must contains valid [jsdoc3] tags. Consult the [usejsdoc] website for the details.

### Build

To generate the documentation, you need to call the `jsdoc` task :

```bash
$> grunt jsdoc
```

or integrate it to your build sequence : 

```javascript
grunt.registerTask('default', ['lint', 'test', 'jsdoc']);
```

## Contributing

Any contribution is welcome! Please check the [issues](https://github.com/krampstudio/grunt-jsdoc-plugin/issues).

## Release History


 * _0.1.0_ First release, includes basic support of [jsdoc3]
   * _0.1.1_ Fix [bug #2](https://github.com/krampstudio/grunt-jsdoc-plugin/issues/2)
   * _0.1.2_ Fix [bug #4](https://github.com/krampstudio/grunt-jsdoc-plugin/issues/4) 
   * _0.1.3_ Fix [bug #7](https://github.com/krampstudio/grunt-jsdoc-plugin/pull/7), Add [feature #8](https://github.com/krampstudio/grunt-jsdoc-plugin/pull/8)
   * _0.1.4_ Use `child_process.spawn` instead of `exec` to run the command
 * _0.2.0_ Migrate to grunt 0.4
   * _0.2.1_ Fix [bug #10](https://github.com/krampstudio/grunt-jsdoc-plugin/issues/10)
   * _0.2.2_ Fix [bug #11](https://github.com/krampstudio/grunt-jsdoc-plugin/issues/11)

[jsdoc3]: https://github.com/jsdoc3/jsdoc

## License
Copyright (c) 2012 Bertrand Chevrier  
Licensed under the MIT license.


[grunt]: https://gruntjs.com
[node]: http://nodejs.org
[npm]: http://npmjs.org
[getting_started]: https://github.com/gruntjs/grunt/wiki/Getting-started
[usejsdoc]: http://usejsdoc.org
