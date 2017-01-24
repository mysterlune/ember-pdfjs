/* global PDFJS */
import Ember from 'ember';

const { getOwner, Service } = Ember;

export default Service.extend({
  pdfLib: undefined,
  init () {
    this._super(...arguments);

    let appConfig = getOwner(this).resolveRegistration('config:environment');

    let addonConfig = appConfig.emberPdfjs;

    this.PDFJS = PDFJS;
    this.PDFJS.workerSrc = addonConfig.workerSrc;
  }
});