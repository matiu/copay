var Wallet = require('../../models/Wallet');

/**
 * TODO: Refactor and move Wallet.js and Storage.js code here
 */
function store(wallet, opts, callback) {
  return Wallet.store(callback);
}

/**
 * TODO: Refactor and move Wallet.js and Storage.js code here
 */
function retrieve(walletId, opts, callback) {
  return Wallet.read(walletId, opts, callback);
}

/**
 * TODO: Refactor and move Wallet.js and Storage.js code here
 */
function deleteWallet(walletId, callback) {
  return Wallet.deleteById(walletId, window.localStorage, callback);
}

module.exports = {
  store: store,
  retrieve: retrieve,
  deleteById: deleteWallet
};
