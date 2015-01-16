'use strict';

module.exports = function(environment, appConfig) {
    if(!appConfig['PDFJS']) {
        appConfig['PDFJS'] = {}
    }
    appConfig['PDFJS'].workerSrc = '/pdf.worker.js';
};
