/*global describe, it, beforeEach*/
// adapted from the Python argparse documentation
// section "args with -"

'use strict';

var assert = require('assert');

var ArgumentParser = require('../lib/argparse').ArgumentParser;
describe('ArgumentParser', function () {
  describe('base', function () {
    var parser;
    var args;
    beforeEach(function () {
      parser = new ArgumentParser({debug: true});
      //parser.addArgument([ '-f', '--foo' ]);
    });

    it("No negative number options; neg number is positional argument", function () {
      parser.addArgument(['-x'], {dest: 'x'});
      parser.addArgument(['foo'], {nargs: '?'});
      // no negative number options, so -1 is a positional argument
      args = parser.parseArgs(['-x', '-1']);
      // Namespace(foo=None, x='-1')
      assert.equal(args.x, '-1');
      // no negative number options, so -1 and -5 are positional arguments
      args = parser.parseArgs(['-x', '-1', '-5']);
      // Namespace(foo='-5', x='-1') order not determined
      assert.equal(args.x, '-1');
      assert.equal(args.foo, '-5');
    });
    it("negative number options present, so any neg number is an option", function () {
      parser.addArgument(['-1'], {dest: 'one'});
      parser.addArgument(['foo'], {nargs: '?'});
      // negative number options present, so -1 is an option
      args = parser.parseArgs(['-1', 'X']);
      // Namespace(foo=None, one='X')
      assert.equal(args.one, 'X');
      // negative number options present, so -2 is an option
      assert.throws(
        function () {
          parser.parseArgs(['-2']);
        },
        /Unrecognized arguments: -2/
      );
      // negative number options present, so both -1s are options
      assert.throws(
        function () {
          parser.parseArgs(['-1', '-1']);
        },
        /argument "-1": Expected one argument/
      );
      args = parser.parseArgs(['--', '-f']);
      // Namespace(foo='-f', one=None)
      assert.equal(args.foo, '-f');
    });
  });
});

