import Ember from 'ember';
import layout from '../templates/components/pdf-toolbar';

const {
  get,
  set,
  run,
  computed
} = Ember;

export default Ember.Component.extend({
  layout,
  viewerManager: Ember.inject.service('viewerManager'),
  terms: '',
  matchCount: computed('viewerManager.searchData.matchCount', function() {
    return get(this, 'viewerManager.searchData.matchCount');
  }),
  actions: {
    zoomIn () {
      let viewer = get(this, 'viewerManager.viewer');
      let scale = parseFloat(viewer.currentScale);
      let scaleIncrement = scale/10;
      viewer.currentScale += scaleIncrement;
    },
    zoomOut () {
      let viewer = get(this, 'viewerManager.viewer');
      let scale = parseFloat(viewer.currentScale);
      let scaleIncrement = scale/10;
      viewer.currentScale -= scaleIncrement;
    },
    search () {
      let highlightAll = get(this, 'viewerManager.searchData.highlightAll');
      let caseSensitive = get(this, 'viewerManager.searchData.caseSensitive');
      let phraseOfTerms = get(this, 'viewerManager.searchData.phraseOfTerms');
      let findController = get(this, 'viewerManager.findController');

      run.debounce(this, function() {
        let terms = get(this, 'terms');
        findController.executeCommand('find', {
          query: terms,
          highlightAll: highlightAll,
          caseSensitive: caseSensitive,
          phraseSearch: phraseOfTerms
        });
      }, 200);
    },
    searchUpdate (terms) {
      set(this, 'terms', terms);
      this.send('search');
    },
    changePage (/*changePage*/) {
      throw new Error('not implemented yet');
    }
  }
});
