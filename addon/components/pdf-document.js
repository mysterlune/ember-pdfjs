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

const { Promise } = Ember.RSVP;

/* jshint undef: false */
const {
  PDFLinkService,
  PDFViewer,
  PasswordResponses,
  PDFFindController
} = PDFJS;
/* jshint undef: true */

/*
  The following exports the values as of early 2017.

 var PasswordResponses = {
 NEED_PASSWORD: 1,
 INCORRECT_PASSWORD: 2
 };

 */

export { PasswordResponses };

// Probably will need something like this for window resize, debounce.
// const $window = Ember.$(window);


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
  viewerManager: Ember.inject.service('viewer-manager'),

  // Libs
  pdfLib: reads('pdfJs.PDFJS'),

  // Instance variables
  loadingTask: undefined,
  percentLoaded: 0,
  pdfDocument: undefined,
  pdfPage: undefined,
  pdfTotalPages: undefined,

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
  * Runs as a hook in Ember when the element for this component
  * has been applied to the DOM.
  *
  * @method  didInsertElement
  * @return void
  */
  didInsertElement: function() {

    let [container] = this.element.getElementsByClassName('pdfViewerContainer');
    set(this, '_container', container);

    let linkService = new PDFLinkService();
    set(this, 'viewerManager.linkService', linkService);
    let viewer = new PDFViewer({
      container,
      linkService: linkService
    });
    set(this, 'viewerManager.viewer', viewer);
    linkService.setViewer(viewer);
    let findController = new PDFFindController({
      pdfViewer: viewer
    });

    // PDFJS will send this event when the findController gets matches
    findController.onUpdateResultsCount = function(count) {
      set(this, 'viewerManager.searchData.matchCount', count);
    }.bind(this);

    set(this, 'viewerManager.findController', findController);

    // Two way street... Need to give the find controller to the viewer directly
    // ... it's not enough to just give the find controller to the viewer
    viewer.setFindController(findController);

    // findController.onUpdateState = function (state, previous, total) {
    //   console.log('hey there...');
    //   console.log(state);
    //   console.log(previous);
    //   console.log(total);
    // }
    // EventBus to the rescue... It's really hard to determine where
    // the DOM will be prepared in PDFJS's perspective such that code
    // can set `currentScaleValue`. So using EventBus allows code here
    // to wait until a PDFJS event fires.
    // There is no guarantee that this callback will execute in a particular
    // order with regard to other callbacks that may also be operating on
    // scale elsewhere in the code... So, last callback wins... Could be buggy.
    // TODO: Find an consitent means to set the view scale value
    viewer.eventBus.on('pagesloaded', function(/*evt*/) {
      // This should probably be some math on scale rather than "page-width"
      // depending on your viewport and layout needs.
      viewer.currentScaleValue = 'page-width';
    });

    // What to do otherwise...? What if there is no `src`...
    if (get(this, 'src')) {
      this.send('load');
    }


    // TODO: We need a way to hook into the PDFJS library to apply
    //   the same custom treatment as is given to the jqXHR object
    //   via `authorize`, etc... but for now, we need to set some
    //   parameters to give to the downstream xhr caller
    this._super(...arguments);
  },

  actions: {
    load () {

    // Move to host app?
    // Going to need some form of security for docs that require auth
    // let token = Ember.$.cookie ? Ember.$.cookie('auth_token') : 'No Cookie!';
    // let docInitParams = {
    //     url: get(this, 'src'),
    //     httpHeaders: { "Authorization": `Basic ${token}` }
    // };

      let uri = get(this, 'src');
      let loadingTask = get(this, 'pdfLib').getDocument(uri);

      loadingTask.onPassword = (updateCallback, reason) => {
          this.sendAction('onPassword', updateCallback, reason);
      };

      // TODO For some reason, this event gets fired after integration tests
      //  complete. So, an error shows up in the test output, like:
      // Uncaught Error: Assertion Failed: calling set on destroyed
      //  object: <dummy@component:pdf-document::ember361>.percentLoaded =
      //  38.69036666781461 at http://localhost:7357/assets/vendor.js
      // For now, just skip this event handler when testing... :/
      if (!testing) {
        loadingTask.onProgress = (progressData) => {
          let percentLoaded = (100 * progressData.loaded / progressData.total);
          set(this, 'percentLoaded', percentLoaded);
        };
      }

      loadingTask = loadingTask.then((pdfDocument) => {
        set(this, 'pdfDocument', pdfDocument);
        let viewer = get(this, 'viewerManager.viewer');
        viewer.setDocument(pdfDocument);
        let linkService = get(this, 'viewerManager.linkService');
        linkService.setDocument(pdfDocument);
        set(this, 'pdfTotalPages', linkService.pagesCount);
        set(this, 'pdfPage', linkService.page);
      });

      set(this, 'loadingTask', loadingTask);
      return loadingTask;
    }
  }
});
