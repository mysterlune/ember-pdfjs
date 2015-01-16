module.exports = {
  normalizeEntityName: function() {},

  afterInstall: function() {
    return this.addBowerPackageToProject('ember-cli-pdfjs', '>=1.0.0');
  }
};
