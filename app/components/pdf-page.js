/* globals PDFJS Promise */
import Ember from 'ember';
const get = Ember.get;
const set = Ember.set;

export default Ember.Component.extend({

  /**
  * Hook that removes the element from the DOM if it has been destroyed
  *
  * @method  willDestroyElement
  * @return void
  */
  willDestroyElement() {
    this.$().remove();
  },

  /**
  * Runs as a hook in Ember when the element for this component
  * has been applied to the DOM.
  *
  * @method  didInsertElement
  * @return void
  */
  didInsertElement() {

    this._renderPage(this.get('page'));

    // TODO: We need a way to hook into the PDFJS library to apply
    //   the same custom treatment as is given to the jqXHR object
    //   via `authorize`, etc... but for now, we need to set some
    //   parameters to give to the downstream xhr caller
    this._super();
  },

  _renderPage(page) {

    return new Promise((resolve, reject) => {

      if (!page) return;

      // when rendering first time, we want the current viewport width?
      // when debouncing from window resize, we want the current viewport width?
      var viewport,
          context,
          canvas = document.createElement('canvas'),
          $canvas = $(canvas),
          $container = $('.pdf-document-container'),
          $parent = $container.parent();

      this.$().append($canvas);

      viewport = page.getViewport($parent.width() / page.getViewport(1.0).width);
      context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      page.getTextContent().then((textContent) => {

        var canvasOffset = $canvas.offset();

        var $textLayerDiv = this.$("<div />")
          .addClass("textLayer")
          .css("height", viewport.height + "px")
          .css("width", viewport.width + "px")
          .offset({
              top: canvasOffset.top,
              left: canvasOffset.left
          });


        this.$().append($textLayerDiv);

        var textLayer = new PDFJS.TextLayerBuilder({
          textLayerDiv: $textLayerDiv.get(0),
          pageIndex: get(this, 'pageNumber')-1,
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

    }.bind(this));
  }

});
