/* globals PDFJS Promise window */
import Ember from 'ember';
const get = Ember.get;
const set = Ember.set;
const bind = Ember.run.bind;
const $window = Ember.$(window);
const { Promise } = Ember.RSVP;


/**
*  Test hooks so tests know when all the async calls in this component have 
*  been resolved.
*/
let testing = $('#ember-testing-container').length;

let componentLoaded;
let componentScrolled;
let finishedLoading;
let finishedScrolling;

if (testing) {
  componentLoaded = new Promise((resolve, reject) => {
    finishedLoading = resolve;
  });

  componentScrolled = new Promise((resolve, reject) => {
    finishedScrolling = resolve;
  });
}


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
  * Hook that runs when component initializes
  *
  * @method  init
  * @return void
  */
  init() {
    if (testing) {
      set(this, 'componentLoaded', componentLoaded);
      set(this, 'componentScrolled', componentScrolled);      
    }

    this._super();
  },

  /**
  * Hook that tears down scroll binding
  *
  * @method  willDestroyElement
  * @return void
  */
  willDestroyElement() {
    var $scrollElement = testing ? $('#ember-testing-container') : $window;
    $scrollElement.off('scroll.' + get(this, 'elementId'));
    $scrollElement.off('resize.' + get(this, 'elementId'));
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
    var $scrollElement = testing ? $('#ember-testing-container') : $window;
    $scrollElement.on('scroll.' + get(this, 'elementId'), bind(this, this._whenUserScrolls));
    $scrollElement.on('resize.' + get(this, 'elementId'), bind(this, this._whenWindowResizes));
  },

  /**
  * Runs when the user resizes the browser window.  This will re-render the active
  * pages and resize all the blank pages
  *
  * @method _whenWindowResizes
  * @for Ember-PDFJS.PdfPage
  * @return void
  */
  _whenWindowResizes() {
    var pages = get(this, 'pages');

    pages = pages.map((page, index) => {
      if (get(page, 'isActive')) {
        set(page, 'rerender', true);
      }
      return page;
    });

    set(this, 'pages', pages);
  },

  /**
  * Runs when the user scrolls and sets 4 pages active at a time as the user
  * scrolls through the document
  *
  * @method _whenUserScrolls
  * @for Ember-PDFJS.PdfPage
  * @return void
  */
  _whenUserScrolls(event) {
    var target = event && event.currentTarget,
      scrollTop = window.pageYOffset || target && target.scrollTop || 0,
      pageHeight = get(this, 'pageHeight') + 5, // 5px margin-bottomd
      currentIndex = scrollTop / pageHeight,
      pages = get(this, 'pages');

    pages = pages.map((page, index) => {
      // if this pages index is 2 above or 2 below the currentIndex
      // then we will set isActive so the pdf-page renders its pdf
      // content, and will set false if not so pdf-page removes its
      // pdf content from the DOM
      if (currentIndex +2 >= index && currentIndex -2 <= index) {
        set(page, 'isActive', true);
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
        .then(this._loadPages.bind(this))
        .catch((error) => {
          console.log('catch this._getDocument', error);
        });

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
        .catch(function(error) {
          console.log(error);
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
  * This gets called by a promise chain after _createDocument. This sets the
  * initial active pages (i.e. the first 4)
  *
  * @private
  * @method _loadPages
  * @for Ember-PDFJS.PdfPage
  * @return void
  */
  _loadPages(pages) {
    return new Promise((resolve, reject) => {
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
  * Action Hook
  * This gets called by this.sendAction in pdf-page and sets the pageHeight property
  * on pdf-document
  *
  * TODO: figure out why this is set wrong inside this function, had to pass that in
  * because this gets called by this.sendAction inside pdf-page
  *
  * @public
  * @method setHeight
  * @for Ember-PDFJS.PdfPage
  * @return void
  */
  setHeight: function(that, height, rerender) {
    set(that, 'pageHeight', height);

    if (rerender) {
      set(that, 'rerender', rerender);
    }
  },

  /**
  * Action Hook
  * This gets called by this.sendAction in pdf-page and lets pdf-document know when a
  * new page loads after being scrolled
  *
  * TODO: figure out why this is set wrong inside this function, had to pass that in
  * because this gets called by this.sendAction inside pdf-page
  *
  * @public
  * @method pageChanged
  * @for Ember-PDFJS.PdfPage
  * @return void
  */
  pageChanged: function() {
    if (testing) {
      finishedScrolling();
    }
  },

  /**
  * This gets called when the pdf-document pageHeight property gets set, it then goes and
  * sets the height property of all pages to the height of the first rendered page to check
  * in.  It also resolves the componentLoaded promise with finishedLoading() so acceptance
  * testing knows when the component is done loading.
  *
  * @public
  * @method _setPageHeight
  * @for Ember-PDFJS.PdfPage
  * @return void
  */
  _setPageHeight: Ember.observer('pageHeight', function() {
    Ember.run(() => {
      var pages = get(this, 'pages');

      pages = pages.map((page) => {
        set(page, 'height', get(this, 'pageHeight'));
        return page;
      });

      set(this, 'pages', pages);

      if (get(this, 'rerender')) {
        this._whenUserScrolls();
      }

      if (testing) {
        finishedLoading();
      }
    });
  })

});
