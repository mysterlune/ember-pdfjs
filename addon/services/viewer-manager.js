import Ember from 'ember';

/*

The point here is to develop the connective tissue between PDFJS
and the possible plethora of components that all need centralized
access to the "viewer" (aka the PDFViewer), as this object is
central to PDFJS.

This application service may support communication between components
that inject this service, notably `pdf-docuemnt` and `pdf-toolbar`...
Furthermore, additional components (e.g. `pdf-thumbnail-list`, etc.,
which are to-be-developed) can all have a centralized access point to
the PDFViewer instance.

TODO This is also perhaps the place to centralize any "teardown" kinds of
activities.

*/

export default Ember.Service.extend({
  viewer: undefined,
  findController: undefined,
  searchData: {
    matchCount: 0,
    terms: '',
    highlightAll: true,
    caseSensitive: false,
    phraseOfTerms: true
  }
});
