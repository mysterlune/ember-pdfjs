import hbs from 'htmlbars-inline-precompile';
import { moduleForComponent, test } from 'ember-qunit';
import wait from 'ember-test-helpers/wait';

moduleForComponent('pdf-document', {
  integration: true
});

test('should work!', function(assert) {
  assert.ok('shims should function properly');
});

test('loads pdf', function(assert) {
  assert.expect(1);

  this.render(hbs`{{pdf-document src=['/test.pdf'] }}`);

  var $textLayers = this.$('.textLayer');

  return wait().then(() => {
    assert.equal($textLayers.length, 4);
  });

});