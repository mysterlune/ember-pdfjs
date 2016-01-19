/* globals PDFJS Promise window */
import Ember from 'ember';
const get = Ember.get;
const set = Ember.set;

export default Ember.Component.extend({

  /**
  * Runs as a hook that sets the component height if it changes
  *
  * @method  didChangeDimensions
  * @return void
  */
  didChangeDimensions: Ember.observer('page.height', function() {
    this.$().height(get(this, 'page.height'));
  }),

  /**
  * Runs as a hook that will render or destroy a PDF page based on its page.isActive state
  *
  * @method  pageChange
  * @return void
  */
  pageChange: Ember.observer('page.isActive', function() {

    if (get(this, 'page.isActive')) {
      this.$().removeClass('blank-page');
      this._renderPage(get(this, 'page'))
    }
    else {
      this.$().addClass('blank-page');
      this.$().html('');  // remove canvas and textLayer
    }

    return get(this, 'page');
  }),
  
  /**
  * Runs as a hook in Ember when the element for this component
  * has been applied to the DOM.
  *
  * @method  didInsertElement
  * @return void
  */
  didInsertElement() {

    if (get(this, 'page.isActive')) {
      this._renderPage(get(this, 'page')).then(() => {
        this.sendAction('setDimensions',  this.parentView, this.$().height());
      });
    }
    else {
      this.$().addClass('blank-page');
    }

    // TODO: We need a way to hook into the PDFJS library to apply
    //   the same custom treatment as is given to the jqXHR object
    //   via `authorize`, etc... but for now, we need to set some
    //   parameters to give to the downstream xhr caller
    this._super();
  },

  /**
  * Called from didInsertElement and pageChange, renders the PDF page
  *
  * @method  _renderPage
  * @return void
  */
  _renderPage(page) {

    return new Promise((resolve, reject) => {

      if (!page) return;

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

        var canvasOffset = $canvas.offset();

        $textLayerDiv
          .addClass("textLayer")
          .css("height", viewport.height + "px")
          .css("width", viewport.width + "px")
          .offset({
              top: canvasOffset.top, 
              left: canvasOffset.left 
          });

        var textLayer = new PDFJS.TextLayerBuilder({
          textLayerDiv: $textLayerDiv.get(0),
          pageIndex: get(this, 'page').pageIndex,
          viewport: viewport
        });

        textLayer.setTextContent(textContent);

        var renderTask = page.render({
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
