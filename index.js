'use strict';

var pickFiles = require('broccoli-static-compiler');
var mergeTrees = require('broccoli-merge-trees');

module.exports = {
  name: 'ember-pdfjs',

  treeFor: function(/* tree? */) {

    var trees = [];

    trees.push(this._super.treeFor.apply(this, arguments));

    var PDFJS = pickFiles('bower_components/pdfjs-dist/build',{
        srcDir: '/',
        files: ['pdf.js','pdf.worker.js'],
        destDir: '/assets'
    });

    trees.push(PDFJS);

    var PDFJSExtras = pickFiles('bower_components/pdfjs-dist/web',{
        srcDir: '/',
        files: ['compatibility.js'],
        destDir: '/assets'
    });

    trees.push(PDFJSExtras)

    var PDFJSCmaps = pickFiles('bower_components/pdfjs-dist/cmaps',{
        srcDir: '/',
        files: ['**/*.bcmap'],
        destDir: '/assets/web/cmaps'
    });

    trees.push(PDFJSCmaps);

    return mergeTrees(trees);
  },

  treeForPublic: function(tree) {
    var trees = [];
    trees.push(this._super.treeForPublic.apply(this, arguments));

    var publicFiles = pickFiles(tree, {
        srcDir: '/',
        files: ['test.pdf'],
        destDir: '/assets'
    });

    trees.push(publicFiles);

    return mergeTrees(trees);
  },

  included: function(app, parentAddon) {

    this._super.included.apply(this, arguments);

    var target = (parentAddon || app);

    target.import(target.bowerDirectory + '/pdfjs-dist/web/pdf_viewer.js');
    target.import(target.bowerDirectory + '/pdfjs-dist/build/pdf.js');
    target.import(target.bowerDirectory + '/pdfjs-dist/build/pdf.worker.js');

  }
}
