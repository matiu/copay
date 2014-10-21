var _ = require('underscore');
var async = require('async');
var cryptoUtil = require('../../util/crypto');
var localStorageProfileProvider = require('../profile/localstorage');
var localStorageWalletProvider = require('../wallet/localstorage');

function retrieve(email, password, opts, callback) {

  var storage = opts.storage || window.LocalStorage;
  var profileProvider = opts.profileProvider || localStorageProfileProvider;

  profileProvider.retrieve(email, password, opts, function(err, profile) {
    if (err) {
      return callback(err);
    }
    var iden = new Identity(email, password, opts);
    iden.profile = profile;

    var walletIds = _.pluck(iden.listWallets(), 'id');
    if (!walletIds || !walletIds.length) {
      return cb(new Error('Could not open any wallet from profile'), iden);
    }

    // Open All wallets from profile
    // This could be optional, or opts.onlyOpen = wid
    var wallets = [];
    var remaining = walletIds.length;
    _.each(walletIds, function(wid) {
      iden.openWallet(wid, function(err, w) {
        if (err) {
          log.error('Cound not open wallet id:' + wid + '. Skipping')
          iden.profile.deleteWallet(wid);
          // TODO: This shouldn't be needed, deletewallet should trigger an event and
          // that should be catched by a profileprovider
          profileProvider.store(iden.profile, {}, _.noop);
        } else {
          log.info('Open wallet id:' + wid + ' opened');
          wallets.push(w);
        }
        if (--remaining == 0) {
          return cb(err, iden);
        }
      })
    });
  });
}

function store(identity, opts, callback) {
  var storage = opts.storage || window.localStorage;
  var profileProvider = opts.profileProvider || localStorageProfileProvider;
  var walletProvider = opts.walletProvider || localStorageWalletProvider;

  profileProvider.store(identity.profile, opts, function(err) {
    if (err) {
      return callback(err);
    }
    async.each(self.openWallets, function(wallet, callback) {
      return walletProvider.store(wallet, opts, callback);
    }, callback);
  });
}

/**
 * Check if any profile exists on storage
 *
 * @param {Function(boolean)} cb - callback
 */
function containsAny = function(cb) {
  window.localStorage.getFirst(Profile.key(''), function(err, v, k) {
    return cb(k ? true : false);
  });
}

/**
 * Check if any wallet exists on storage
 *
 * @param {Function(boolean)} cb - callback
 */
function anyWallet = function(cb) {
  Wallet.any(window.localStorage, cb);
}

module.exports = {
  retrieve: retrieve,
  store: store,
  containsAny: containsAny,
  anyWallet: anyWallet
};
