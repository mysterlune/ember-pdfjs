// globals PDFJS Promise window

/**
* This program has 3 basic workflows.
*
* First is the loading of the document and generation of the individual pages.
* This happens using methods on the PDFJS global and is a promise chain. It
* populates the get(this, 'pages') array and renders the initial pages.
*
* The second workflow is the sizing of the pages and blank pages. This happens
* through communication with pdf-page. pdf-page lets pdf-document know the height
* of the first canvas rendered. pdf-document observes this and then sets the
* height property on all pages. All pdf-pages then resize themselves.
*
* The third workflows are the scroll and resize bindings. The addon will only
* render 3-5 pages at a time. When the user scrolls new pages will become rendered
* and old pages will be removed from the DOM. Resizing the width of the page will
* cause the pages to be re-rendered and all the page sizes will change. It also
* makes its best effort at snapping the page to what it was before resizing. This
* can get a little wonky when resizing really small and huge.
*
* It also has testing hooks built in that will notify acceptance tests when certain
* promises have been resolved. If it finds the #ember-testing-container then it will
* activate these hooks.
*/

import Ember from 'ember';
import layout from '../templates/components/pdf-document';

const {
  get,
  set,
  $,
  computed: { reads }
} = Ember;

const bind = Ember.run.bind;
const { Promise } = Ember.RSVP;

const $window = Ember.$(window);

const getCurrentIndex = function(event, pageHeight) {
  let target = event && event.currentTarget;
  let scrollTop = window.pageYOffset || target && target.scrollTop || 0;
  let currentIndex = Math.round(scrollTop / (pageHeight + 5));

  return currentIndex;
};

let lastScrollTop;
const getDirection = function() {
  let scrollTop = window.pageYOffset;
  let direction;

  if (scrollTop > lastScrollTop) {
    direction = 'down';
  }
  else {
    direction = 'up';
  }

  lastScrollTop = scrollTop;

  return  direction;
};

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
  componentLoaded = new Promise((resolve/*, reject*/) => {
    finishedLoading = resolve;
  });

  componentScrolled = new Promise((resolve/*, reject*/) => {
    finishedScrolling = resolve;
  });
}


export default Ember.Component.extend({

  pdfJs: Ember.inject.service('pdfjs-lib'),

  pdfLib: reads('pdfJs.PDFJS'),

  /**
  * The {{template}} needs to be imported and added in here
  * since this is an addon.
  *
  * @property
  * @default
  */
  layout,

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
  * The property storing a generic context object.
  *
  * @property
  * @default null
  */
  pdfContext: null,

  /**
  * Hook that runs when component initializes
  *
  * @method  init
  * @return void
  */
  init: function() {

    if (testing) {
      set(this, 'componentLoaded', componentLoaded);
      set(this, 'componentScrolled', componentScrolled);
    }

    this._super();
  },

  /**
  * Event Binding
  * Hook that tears down scroll binding
  *
  * @method  willDestroyElement
  * @return void
  */
  willDestroyElement: function() {
    var $scrollElement = testing ? $('#ember-testing-container') : $window;
    $scrollElement.off('scroll.' + get(this, 'elementId'));
    $scrollElement.off('resize.' + get(this, 'elementId'));
  },

  /**
  * Event Binding
  * Binds scroll event on window with .pdf namespace so we don't
  * unbind other functions that bind on window scroll when we
  * tear down.
  *
  * @method  _onScroll
  * @return void
  */
  _onScroll: function() {
    var $scrollElement = testing ? $('#ember-testing-container') : $window;
    $scrollElement.on('scroll.' + get(this, 'elementId'), bind(this, this._whenUserScrolls));
    $scrollElement.on('resize.' + get(this, 'elementId'), bind(this, this._whenWindowResizes));
  },

  /**
  * Event
  * Runs when the user scrolls and sets 5 pages active at a time as the user
  * scrolls through the document
  *
  * @method _whenUserScrolls
  * @for Ember-PDFJS.PdfPage
  * @return void
  */
  _whenUserScrolls: function(event) {

    var currentIndex, direction, lowerPages, upperPages;

    currentIndex = getCurrentIndex(event, get(this, 'pageHeight'));

    // here we are saying that if the user is scrolling upward, then
    // we will load 5 pages above where the user is scrolling so they
    // can experience a seemless rendering when scrolling quickly. Vise
    // versa for scrolling downward.
    direction = getDirection();
    switch(direction) {
      case 'up':
        lowerPages = 2;
        upperPages = 5;
        break;
      case 'down':
        lowerPages = 5;
        upperPages = 2;
    }

    var pages = get(this, 'pages');

    pages = pages.map((page, index) => {
      // if this pages index is 5 above or 2 below the currentIndex
      // then we will set isActive so the pdf-page renders its pdf
      // content, and will set false if not so pdf-page removes its
      // pdf content from the DOM
      if (currentIndex + lowerPages >= index && currentIndex - upperPages <= index) {
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
  * Event
  * Runs when the user resizes the browser window.  This will re-render the active
  * pages and resize all the blank pages
  *
  * @method _whenWindowResizes
  * @for Ember-PDFJS.PdfPage
  * @return void
  */
  _whenWindowResizes: function() {

    var pageIndex = getCurrentIndex(null, get(this, 'pageHeight'));
    set(this, 'pageIndex', pageIndex);

    var pages = get(this, 'pages');

    pages = pages.map((page) => {
      if (get(page, 'isActive')) {
        set(page, 'resize', true);
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
  didInsertElement: function() {

    Ember.run.scheduleOnce('afterRender', this, () => {

      // Move to host app?
      var token = Ember.$.cookie ? Ember.$.cookie('auth_token') : 'No Cookie!';

      var docInitParams = {
          url: get(this, 'src'),
          httpHeaders: { "Authorization": `Basic ${token}` }
      };

      this._onScroll();

      this._getDocument(docInitParams)
        .then(this._receiveDocument.bind(this))
        .then(this._createDocument.bind(this))
        .then(this._loadPages.bind(this))
        .catch((error) => {
          console.log('Catching error in this._getDocument', error);
          throw new Error(error);
        });

    });

    // TODO: We need a way to hook into the PDFJS library to apply
    //   the same custom treatment as is given to the jqXHR object
    //   via `authorize`, etc... but for now, we need to set some
    //   parameters to give to the downstream xhr caller
    this._super(...arguments);
  },

  /**
  * Promise
  * Given initialization parameters, try to load the document.
  *
  * @private
  * @method _getDocument
  @ @for Ember-PDFJS.PdfPage
  * @return {Promise} Resolves when document is initialized, rejects on fail
  */
  _getDocument: function(docInitParams) {
    return new Promise((resolve, reject) => {

      get(this, 'pdfLib').getDocument(docInitParams)
        .then((initializedDocument) => {
          console.log('Got initialized document', initializedDocument);
          resolve(initializedDocument);
        })
        .catch(function(error) {
          reject(error);
        });

    });
  },

  /**
  * Promise
  * Once the document has been extracted, etc., this handler provides an
  * intermediary step to do additional work (send actions, store local props, etc.)
  *
  * @private
  * @method _didReceiveDocument
  * @for Ember-PDFJS.PdfPage
  * @return {Promise} Resolves when the document is received and set as a local
  */
  _receiveDocument: function(initializedDocument) {
    return new Promise((resolve, reject) => {

      if (!initializedDocument) {
        reject('No submission');
      }

      set(this, 'docObject', initializedDocument);
      resolve(initializedDocument);
    });
  },

  /**
  * Promise
  * This hook essentially calls for rendering a document. It sets the pages property
  * to be used in pdf-document.hbs and it also returns the pages via promise resolve
  *
  * @private
  * @method _createDocument
  * @for Ember-PDFJS.PdfPage
  * @return void
  */
  _createDocument: function() {
    return new Promise((resolve/*, reject*/) => {

      var pdf = get(this, 'docObject');

      var numPages = pdf.numPages;
      var pages = [];

      for (var i = 1; i <= numPages; i++) {
        pages.push(pdf.getPage(i));
      }

      Promise.all(pages).then((pages) => {
        resolve(pages);
      });
    });
  },


  /**
  * Promise
  * This gets called by a promise chain after _createDocument. This sets the
  * initial active pages (i.e. the first 3)
  *
  * @private
  * @method _loadPages
  * @for Ember-PDFJS.PdfPage
  * @return void
  */
  _loadPages: function(pages) {
    return new Promise((resolve/*, reject*/) => {
      // set initial pages to render

      pages = pages.map((page, index) => {
        if (index < 3) { set(page, 'isActive', true); }
        return page;
      });

      set(this, 'pages', pages);

      resolve(pages);
    });
  },

  /**
  * Action Hook
  * This gets called by this.sendAction in pdf-page and lets pdf-document know when a
  * new page loads after being scrolled
  *
  * @public
  * @method doneScrolling
  * @for Ember-PDFJS.PdfPage
  * @return void
  */
  doneScrolling: function() {
    if (testing) {
      finishedScrolling();
    }
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
  setHeight: function(that, height, resize) {
    set(that, 'pageHeight', height);

    if (resize) {
      set(that, 'resize', true);
    }
  },

  /**
  * Observer
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

      if (get(this, 'resize')) {
        var pageIndex = get(this, 'pageIndex');
        var page = this.$().children()[pageIndex];
        page.scrollIntoView();
      }

      set(this, 'pages', pages);

      if (testing) {
        finishedLoading();
      }
    });
  })

});
