// globals PDFJS Promise window

import Ember from 'ember';
import layout from '../templates/components/pdf-page';

const {
  get,
  set,
  $,
  computed: { reads }
} = Ember;

const { Promise } = Ember.RSVP;

let testing = $('#ember-testing-container').length;

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
  classNames: ['pdf-page'],

  /**
  * The property storing a generic context object.
  *
  * @property
  * @default null
  */
  pdfContext: null,

  /**
  * Observer that sets the component height if it changes
  *
  * @method  _setHeight
  * @return void
  */
  _setHeight: Ember.observer('page.height', function() {
    this.$().height(get(this, 'page.height'));
  }),

  /**
  * Observer that will render or destroy a PDF page based on its page.isActive state
  *
  * @method  _changePage
  * @return void
  */
  _changePage: Ember.observer('page.isActive', function() {
    this._setupPage().then(() => {
      if (testing) {
        if (get(this, 'page.pageIndex') === 5) {
          this.sendAction('doneScrolling');
        }
      }
    });
  }),

  /**
  * Observer that resize pages if window size changes
  *
  * @method  _resizePage
  * @return void
  */
  _resizePage: Ember.observer('page.resize', function() {

    this.$().html('');

    this._setupPage().then(() => {

      var height = this.$('canvas').height();
      this.$().height(height);

      this.sendAction('setHeight',  this.parentView, height, true);

      set(this, 'page.resize', false);
    });
  }),

  /**
  * Runs as a hook in Ember when the element for this component
  * has been applied to the DOM.
  *
  * @method  didInsertElement
  * @return void
  */
  didInsertElement: function() {
    this._setupPage();
    // TODO: We need a way to hook into the PDFJS library to apply
    //   the same custom treatment as is given to the jqXHR object
    //   via `authorize`, etc... but for now, we need to set some
    //   parameters to give to the downstream xhr caller
    this._super();
  },

  /**
  * Gets called by _changePage and didInsertElement to render and unrender pages
  * as isActive gets set
  *
  * @method  _setupPage
  * @return void
  */
  _setupPage: function() {
    return new Promise((resolve/*, reject*/) => {
      if (get(this, 'page.isActive')) {
        this._renderPage(get(this, 'page')).then(() => {
          if (!this.$()) { return; }
          this.sendAction('setHeight',  this.parentView, this.$().height());
        });
      }
      else {
        this.$().html('');
      }
      resolve();
    });
  },

  /**
  * Renders the actual PDF and textLayer
  *
  * @method  _renderPage
  * @return void
  */
  _renderPage: function(page) {
    return new Promise((resolve/*, reject*/) => {

      if (!page) { return; }

      var viewport,
          context,
          canvas = document.createElement('canvas'),
          $canvas = $(canvas),
          $textLayerDiv = this.$('<div>'),
          $container = $('.pdf-document-container'),
          $parent = $container.parent();

      this.$().append($canvas);
      this.$().append($textLayerDiv);

      viewport = page.getViewport($parent.width() / page.getViewport(1.0).width - 0.01);
      context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      page.getTextContent().then((textContent) => {

        let canvasOffset = $canvas.offset();

        $textLayerDiv
          .addClass('textLayer')
          .css('height', viewport.height + 'px')
          .css('width', viewport.width + 'px')
          .offset({
              top: canvasOffset.top,
              left: canvasOffset.left
          });

        let TextLayerBuilder = get(this, 'pdfLib.TextLayerBuilder');

        let textLayer = new TextLayerBuilder({
          textLayerDiv: $textLayerDiv.get(0),
          pageIndex: get(this, 'page.pageIndex'),
          viewport: viewport,
          pdfContext: get(this, 'pdfContext')
        });

        textLayer.setTextContent(textContent);

        let renderTask = page.render({
          canvasContext: context,
          viewport: viewport,
          textLayer: textLayer
        });

        renderTask.promise.then(() => {
          textLayer.render();
          resolve();
        });
      });
    });
  }

});
