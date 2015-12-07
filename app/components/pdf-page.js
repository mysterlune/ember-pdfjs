/* globals PDFJS Promise */
import Ember from 'ember';
const get = Ember.get;
const set = Ember.set;

export default Ember.Component.extend({

  /**
  * The element type for a component rendering a PDFJS page should be
  * a canvas. Actual text content from the document would need to be
  * into `div`s, and follow in the DOM as subsequent elements.
  *
  * @property
  * @default
  */
  tagName: 'canvas',

  /**
  * The `src` of the document being requested.
  *
  * @property
  * @default Empty string
  */
  src: '',

  /**
  * The number of pages for the given document. This should only get set
  * after the document has been introspected.
  *
  * @property
  * @default null
  */
  totalPages: null,

  /**
  * The property storing the document.
  *
  * @property
  * @default null
  */
  docObject: null,

  /**
  * Page number that should be prioritized for display.
  *
  * @property
  * @default
  */
  pageNumber: 1,

  /**
  * Runs as a hook in Ember when the element for this component
  * has been applied to the DOM.
  *
  * @method  didInsertElement
  * @return void
  */
  didInsertElement: function(){

    Ember.run.scheduleOnce('afterRender', this, function() {
      var self = this;

      // Move to host app?
      var token = Ember.$.cookie ? Ember.$.cookie('auth_token') : 'No Cookie!';

      var docInitParams = {
          url: get(this, 'src'),
          httpHeaders: { "Authorization": 'Basic %@1'.fmt(token)}
      }

      this._getDocument(docInitParams).then(
        this._didReceiveDocument.bind(this)
      ).then(
        this._renderDocument.bind(this)
      );

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
  _getDocument: function(docInitParams) {
    return new Promise(function(resolve, reject) {
      PDFJS.getDocument(docInitParams).then(function(submission) {
          resolve(submission);
      }.bind(this)).then(null, function(error){
          reject(error);
      }.bind(this));
    }.bind(this));
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
  _didReceiveDocument: function(submission) {
    var self = this;
    return new Promise(function(resolve, reject) {
      if(!submission) { reject('No submission'); }
      set(self, 'docObject', submission);
      resolve(submission);
    }.bind(this));
  },

  /**
  * This hook essentially calls for rendering a page. Here is a good location
  * to look at any routing information (the controller's/route's `queryParams`
  * or `params` flags to determine which page should render).
  *
  * @private
  * @method _renderDocument
  * @for Ember-PDFJS.PdfPage
  * @return void
  */
  _renderDocument: function(submission) {
    // TODO Promisify document/page APIs
    this._renderPage();
  },

  /**
  * This method is a pie thrown onto the wall in terms of page rendering:
  * it landed, but is not tidy. Essentially, this method touches the DOM
  * quite a bit, and should not.
  *
  * _TODO_: Ideally, the `TextLayerBuilder` should be a utility that exposes
  * hooks for building the text layer in components (while mapping the
  * components to the correct coordinate positions and scales that match
  * with the rasterized background).
  *
  * _TODO_: This is probably the best place to optimize. Frankly, "rendering
  * a page" really does mean _so much_.
  *
  * @private
  * @method _renderPage
  * @for Ember-PDFJS.PdfPage
  * @return void
  */
  _renderPage: function() {
    var pdf = get(this, 'docObject');

    if (!pdf) return;

    // when rendering first time, we want the current viewport width?
    // when debouncing from window resize, we want the current viewport width?
    var self=this,
      viewport,
      context,
      $canvas = this.$(),
      canvas = $canvas.get(0),
      parentWidth = this.$().parent().width();

    pdf.getPage(get(this,'pageNumber')).then(function(page) {

      viewport = page.getViewport(parentWidth / page.getViewport(1.0).width);
      context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      page.getTextContent().then(function (textContent) {

        var canvasOffset = $canvas.offset();
        var $textLayerDiv = self.$("<div />")
          .addClass("textLayer")
          .css("height", viewport.height + "px")
          .css("width", viewport.width + "px")
          .offset({
              top: canvasOffset.top,
              left: canvasOffset.left
          });

        self.$().after($textLayerDiv);

        var textLayer = new PDFJS.TextLayerBuilder({
          textLayerDiv: $textLayerDiv.get(0),
          pageIndex: get(self,'pageNumber')-1,
          viewport: viewport
        });

        textLayer.setTextContent(textContent);

        var renderTask = page.render({
          canvasContext: context,
          viewport: viewport,
          textLayer: textLayer
        });

        renderTask.promise.then(function() {
          textLayer.render();
        });

      });
    });

  }

});
