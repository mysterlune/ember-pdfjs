import resolver from './helpers/resolver';
import Ember from 'ember';

import {
  setResolver
} from 'ember-qunit';

setResolver(resolver);

Ember.Test.adapter = Ember.Test.QUnitAdapter.create();

import startApp from "./helpers/start-app";
window.startApp = startApp;