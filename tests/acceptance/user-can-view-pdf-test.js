import { test } from 'qunit';
import Ember from 'ember';
import moduleForAcceptance from '../../tests/helpers/module-for-acceptance';
import startApp from "../../tests/helpers/start-app";

var application;

moduleForAcceptance('Acceptance | PDF', {

  beforeEach: function() {
    application = startApp();
  },

  afterEach: function() {
    Ember.run(application, 'destroy');
  }
});


test('scrolling causes new pages to render and old pages to expire from the DOM.', function(assert) {
  visit('/');

  var loaded = application.__container__.lookup('component:pdf-document').get('componentLoaded');

  waitForPromise(loaded);
  andThen(function() {
    var $container = find('.pdf-document-container');

    assert.equal($container.children().length, 14); // 14 pdf-page components in DOM
    assert.ok(!$container.children().first().is(':empty')); // make sure the first page has content

    var lastPage = $container.children().last()[0];
    lastPage.scrollIntoView();

    var scrolled = application.__container__.lookup('component:pdf-document').get('componentScrolled');

    waitForPromise(scrolled);
    andThen(function() {
      assert.ok($container.children().first().is(':empty')); // make sure the first page is empty
      assert.ok(!$($container.children()[5]).is(':empty')); // make sure the 6th page has content
    });
  });
});
