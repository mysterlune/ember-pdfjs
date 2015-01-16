'use strict';

module.exports = {
  name: 'ember-pdfjs-component'

  included: function(app, parentAddon) {

    this._super.included(app, parentAddon);

    var target = (parentAddon || app);

    target.import(target.bowerDirectory + '/ember-cli-pdfjs/build/pdfjs.js');

    debugger;
  }
}
