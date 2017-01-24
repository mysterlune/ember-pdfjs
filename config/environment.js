/*jshint node:true*/
'use strict';

module.exports = function(/* environment, appConfig */) {
  return {
    emberPdfjs: {
      workerSrc: '/pdf.worker.js'
    }
  }
};
