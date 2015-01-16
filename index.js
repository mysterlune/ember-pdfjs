'use strict';

module.exports = {
  name: 'ember-pdfjs',

  included: function(app, parentAddon) {

    this._super.included(app, parentAddon);

    var target = (parentAddon || app);

    target.import(target.bowerDirectory + '/pdfjs-dist/build/pdf.js');
    target.import(target.bowerDirectory + '/pdfjs-dist/build/pdf.worker.js');

  }
}
