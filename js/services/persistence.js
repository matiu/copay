'use strict';
var _ = require('underscore');

var providers = {};
providers.localstorageIdentity = require('../persistence/identity/localstorage');
providers.localstorageProfile = require('../persistence/profile/localstorage');
providers.localstorageWallet = require('../persistence/wallet/localstorage');

providers.insightIdentity = require('../persistence/identity/insight');
providers.insightProfile = require('../persistence/profile/insight');
providers.insightWallet = require('../persistence/wallet/insight');

var Persistence = function() { };

Persistence.prototype.getInstance = function(type, provider, opts) {
  // TODO: Create different instances if opts changes
  var name = provider + type;
  if (!this[name]) {
    if (!providers[name]) {
      throw new Error('Invalid type or service received! Requested: ' + name
                      + ', availables: ' + JSON.stringify(_.keys(provider)));
    }
    this[name] = providers[name];
  }
  return this[name];
};

angular.module('copayApp.services').service('persistence', Persistence);
