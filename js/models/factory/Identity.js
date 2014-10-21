var _ = require('underscore');
var Identity = require('../Identity');

/**
 * Builds an Identity from an extended private key
 */
function IdentityFactory(opts) {
  opts = opts || {};
  throw new Error('Not ready');
}

IdentityFactory.prototype.create = function (xprivkey, email, passphrase, callback) {

  var identity = new Identity(xprivkey, email, passphrase);

  // Append all event listeners
  _.each(this.listeners, function(listeners, event) {
    _.each(listeners, function(listener) { identity.on(event, listener, identity); });
  });
  this.stateProvider.retrieve(identity, callback);
};

IdentityFactory.listeners = {};

module.exports = IdentityFactory;
