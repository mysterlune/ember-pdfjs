import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('pdf-document', 'Integration | Component | pdf-document', {
  integration: true
});

test('Should be the correct element type', function(assert) {
  this.render(hbs`{{pdf-document src="/assets/test.pdf"}}`);
  assert.ok(this.$('div').attr('class').includes('ember-view'), 'Component is a view container');
  assert.ok(this.$('div').attr('class').includes('pdf-document-container'), 'Component is a PDF document container');
});
