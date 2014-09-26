var cryptoUtil = require('../../util/crypto');

/**
 * Service to store an Identity into localstorage and retrieve it.
 *
 * @param {Object} opts
 * @param {Object} opts.storage - the localstorage object (defaults to window.LocalStorage)
 */
function LocalStorageIdentityProvider(opts) {
  this.storage = opts.storage || window.LocalStorage;
  this.walletFactory = opts.walletFactory || new WalletFactory(opts.walletFactoryOpts);
}

/**
 * Retrieve an Identity from local storage
 */
LocalStorageIdentityProvider.prototype.retrieve = function(email, password, opts, callback) {


  var iden = new Identity(email, password, opts);


  Identity._openProfile(email, password, iden.storage, function(err, profile) {
    if (err) return cb(err);
    iden.profile = profile;

    var wids = _.pluck(iden.listWallets(), 'id');
    if (!wids || !wids.length)
      return cb(new Error('Could not open any wallet from profile'), iden);

    // Open All wallets from profile
    //This could be optional, or opts.onlyOpen = wid
    var wallets = [];
    var remaining = wids.length;
    _.each(wids, function(wid) {
      iden.openWallet(wid, function(err, w) {
        if (err) {
          log.error('Cound not open wallet id:' + wid + '. Skipping')
          iden.profile.deleteWallet(wid, function() {});
        } else {
          log.info('Open wallet id:' + wid + ' opened');
          wallets.push(w);
        }
        if (--remaining == 0) {
          var firstWallet = _.findWhere(wallets, {
            id: wids[0]
          });
          return cb(err, iden, firstWallet);
        }
      })
    });
  });
};

/**
 * Check if any profile exists on storage
 *
 * @param {Function(boolean)} cb - callback
 */
LocalStorageIdentityProvider.prototype.containsAny = function(cb) {
  this.storage.getFirst(Profile.key(''), function(err, v, k) {
    return cb(k ? true : false);
  });
};

/**
 * Check if any wallet exists on storage
 *
 * @param {Function(boolean)} cb - callback
 */
Identity.anyWallet = function(cb) {
  Wallet.any(this.storage, cb);
};

