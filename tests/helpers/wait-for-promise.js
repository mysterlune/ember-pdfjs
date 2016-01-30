import Ember from 'ember';

Ember.Test.registerAsyncHelper('waitForPromise', (app, promise) => {
  return new Ember.Test.promise((resolve) => {

    Ember.Test.adapter.asyncStart();
    // console.log('waitForPromise');

 		promise.then(() => {
 			// console.log('waitForPromise resolve');
 		  Ember.run.schedule('afterRender', null, resolve);
 		  Ember.Test.adapter.asyncEnd();
 		});
  });
});
