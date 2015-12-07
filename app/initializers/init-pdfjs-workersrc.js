/* globals PDFJS */
export default {
    name: 'init-pdfjs-workersrc',

    initialize: function() {
        PDFJS.workerSrc = '/assets/pdf.worker.js';
    }
}