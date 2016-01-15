/* globals PDFJS Promise */
import Ember from 'ember';
const get = Ember.get;
const set = Ember.set;
const bind = Ember.run.bind;
const $window = Ember.$(window);

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
    $window.on('scroll.pdf', bind(this, this._whenUserScrolls));
  },

  /**
  * Runs when the user scrolls
  *
  * @private
  * @method _whenUserScrolls
  * @for Ember-PDFJS.PdfPage
  * @return void
  */
  _whenUserScrolls(event) {
    
    var target = event.currentTarget,
      scrollTop = window.pageYOffset || target.scrollTop || 0,
      pageHeight = get(this, 'pageHeight') + 5 // .blank-page margin-bottom
      currentIndex = scrollTop / pageHeight,
      pages = get(this, 'pages');

    pages = pages.map((page, index) => {
      // if this pages index is 2 above or 2 below the currentIndex
      // then we will set isActive so the pdf-page renders its pdf
      // content, and will set false if not so pdf-page removes its
      // pdf content from the DOM
      if (currentIndex +2 >= index && currentIndex -2 <= index) {
        set(page, 'isActive', true);
        console.log('page isActive', page.pageIndex);
      }
      else {
        set(page, 'isActive', false);
      }

      return page;        
    });

    set(this, 'pages', pages);
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
        .then(this._receiveDocument.bind(this))
        .then(this._createDocument.bind(this))
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
  _receiveDocument(submission) {

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
  * @method _createDocument
  * @for Ember-PDFJS.PdfPage
  * @return void
  */
  _createDocument() {

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
  * This gets called by a promise chain after _createDocument
  *
  * @private
  * @method _loadPages
  * @for Ember-PDFJS.PdfPage
  * @return void
  */
  _loadPages(pages) {
    return new Promise((resolve, reject) => {
      set(this, 'isLoading', false);

      // set initial pages to render
      pages = pages.map((page, index) => {
        if (index < 4) set(page, 'isActive', true);
        return page;
      });

      set(this, 'pages', pages);

      resolve();
    });
  },

  /**
  * This gets called by this.sendAction in pdf-page and sets the pageHeight property
  * on pdf-document
  *
  * TODO: figure out why this is set wrong inside this function, had to pass that in
  * because this gets called by this.sendAction inside pdf-page
  *
  * @public
  * @method setDimensions
  * @for Ember-PDFJS.PdfPage
  * @return void
  */
  setDimensions: function(that, height, width) {
    // only set once so other observers, etc, don't fire multiple times
    if (!get(that, 'pageHeight')) {
      set(that, 'pageHeight', height);
    }
  },

  /**
  * This gets called when the pdf-document pageHeight property gets set, it then goes and
  * sets the height property of all pages to the height of the first rendered page to check
  * in.
  *
  * @public
  * @method _setBlankPageDimensions
  * @for Ember-PDFJS.PdfPage
  * @return void
  */
  _setBlankPageDimensions: Ember.observer('pageHeight', function() {

    var pages = get(this, 'pages');

    pages = pages.map((page) => {
      set(page, 'height', get(this, 'pageHeight'));
      return page;
    });

    set(this, 'pages', pages);
  })

});
