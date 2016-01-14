/* globals PDFJS Promise */
import Ember from 'ember';
const get = Ember.get;
const set = Ember.set;
const bind = Ember.run.bind;
const $window = Ember.$(window);
const $document = Ember.$(document);

export default Ember.Component.extend({

  /**
  * The `classNames` of the document container.
  *
  * @property
  * @default
  */
  classNames: ['pdf-document-container'],

  /**
  * The `src` of the document being requested.
  *
  * @property
  * @default Empty string
  */
  src: '',

  /**
  * The property storing the document.
  *
  * @property
  * @default null
  */
  docObject: null,

  /**
  * Hook that tears down scroll binding
  *
  * @method  willDestroyElement
  * @return void
  */
  willDestroyElement() {
    $window.off('scroll.pdf');
  },

  /**
  * Binds scroll event on window with .pdf namespace so we don't
  * unbind other functions that bind on window scroll when we
  * tear down.
  *
  * @method  _onScroll
  * @return void
  */
  _onScroll() {
    $window.on('scroll.pdf', bind(this, this._didScroll));
  },

  /**
  * Runs as a hook in Ember when the element for this component
  * has been applied to the DOM.
  *
  * @method  didInsertElement
  * @return void
  */
  didInsertElement() {

    Ember.run.scheduleOnce('afterRender', this, () => {

      // Move to host app?
      var token = Ember.$.cookie ? Ember.$.cookie('auth_token') : 'No Cookie!';

      var docInitParams = {
          url: get(this, 'src'),
          httpHeaders: { "Authorization": `Basic ${token}` }
      }

      this._onScroll();

      this._getDocument(docInitParams)
        .then(this._didReceiveDocument.bind(this))
        .then(this._renderDocument.bind(this))
        .then(this._loadPages.bind(this));
    });

    // TODO: We need a way to hook into the PDFJS library to apply
    //   the same custom treatment as is given to the jqXHR object
    //   via `authorize`, etc... but for now, we need to set some
    //   parameters to give to the downstream xhr caller
    this._super();
  },

  /**
  * Given initialization parameters, try to load the document.
  *
  * @private
  * @method _getDocument
  @ @for Ember-PDFJS.PdfPage
  * @return {Promise} Resolves when document is initialized, rejects on fail
  */
  _getDocument(docInitParams) {

    return new Promise((resolve, reject) => {
      
      PDFJS.getDocument(docInitParams)
        .then((submission) => {
            resolve(submission);
        })
        .then(null, (error) => {
            reject(error);
        });
    });
  },

  /**
  * Once the document has been extracted, etc., this handler provides an
  * intermediary step to do additional work (send actions, store local props, etc.)
  *
  * @private
  * @method _didReceiveDocument
  * @for Ember-PDFJS.PdfPage
  * @return {Promise} Resolves when the document is received and set as a local
  */
  _didReceiveDocument(submission) {

    return new Promise((resolve, reject) => {
      
      if (!submission) { 
        reject('No submission'); 
      }
      
      set(this, 'docObject', submission);
      resolve(submission);

    });
  },

  /**
  * This hook essentially calls for rendering a document. It sets the pages property
  * to be used in pdf-document.hbs and it also returns the pages via promise resolve
  *
  * @private
  * @method _renderDocument
  * @for Ember-PDFJS.PdfPage
  * @return void
  */
  _renderDocument() {

    return new Promise((resolve, reject) => {

      var pdf = get(this, 'docObject');
      var numPages = pdf.numPages;
      var pages = [];

      for (var i = 1; i <= numPages; i++) {
        pages.push(pdf.getPage(i));
      }

      Ember.RSVP.all(pages).then((pages) => {
        resolve(pages);
      });

    });
  },

  /**
  * This gets called by a promise chain after _renderDocument
  *
  * @private
  * @method _loadPages
  * @for Ember-PDFJS.PdfPage
  * @return void
  */
  _loadPages(pages) {
    set(this, 'isLoading', false);
    set(this, 'pages', pages);
    this._addPages();
  },

  /**
  * Does the heavy lifting of moving pages from pages to content
  *
  * @private
  * @method _addPages
  * @for Ember-PDFJS.PdfPage
  * @return {Promise} Resolves when pages are added
  */
  _addPages() {

    return new Promise((resolve, reject) => {

      var content = get(this, 'content') || [],
          pages = get(this, 'pages') || [];

      var pagesLeft = pages.length < 4 ? pages.length : 4;

      for (var i = 0; i < pagesLeft; i++) {
        content.pushObject(pages.shift());
      }

      set(this, 'content', content);
      set(this, 'pages', pages);

      resolve();
    });

  },

  /**
  * Runs when the user scrolls
  *
  * @private
  * @method _didScroll
  * @for Ember-PDFJS.PdfPage
  * @return void
  */
  _didScroll() {
    if (this._isNearBottom() && !this.get('isLoading')) {
      set(this, 'isLoading', true);
      
      this._addPages().then(() => {
        set(this, 'isLoading', false);
      })
    }

  },

  /**
  * Checks to see whether we have reached near the bottom of the page
  *
  * @private
  * @method _isNearBottom
  * @for Ember-PDFJS.PdfPage
  * @return boolean
  */
  _isNearBottom() {
    var top = $document.scrollTop(),
        bottom = $document.height() - $window.height();

    return top && (bottom - top) < 150;
  }


});
