import { test } from 'qunit';
import moduleForAcceptance from '../helpers/module-for-acceptance';

moduleForAcceptance('Acceptance | Main Index');

test('Visiting /', function(assert) {
  visit('/');

  andThen(function() {
    assert.equal(currentURL(), '/');
  });
});

// Acceptance test here requires interaction with the private container.
// Need to find another way to access the component and wait for the external
// dependencies to load and activate.
// test('scrolling causes new pages to render and old pages to expire from the DOM.', function(assert) {
//   visit('/');
//   andThen(function() {
//     var $container = find('.pdf-document-container');
//     assert.equal($container.children().length, 14); // 14 pdf-page components in DOM
//     assert.ok(!$container.children().first().is(':empty')); // make sure the first page has content
//      var lastPage = $container.children().last()[0];
//      lastPage.scrollIntoView();
//     var scrolled = application.__container__.lookup('component:pdf-document').get('componentScrolled');
//     waitForPromise(scrolled);
//     andThen(function() {
//       assert.ok($container.children().first().is(':empty')); // make sure the first page is empty
//       assert.ok(!$($container.children()[5]).is(':empty')); // make sure the 6th page has content
//     });
//   });
// });
