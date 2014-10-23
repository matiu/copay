var _ = require('underscore');
var cryptoUtils = require('../util/crypto');

/**
 * @type RetrieveCallback
 * @param {Error} error
 * @param {?} value
 * @param {string} key
 */

/**
 * Retrieve the first element in localstorage that matches a certain preffix
 *
 * @param {string} prefix
 * @param {Object*} opts
 * @param {?} opts.db - to mock localStorage if needed
 * @param {RetrieveCallback} callback (error, value, key)
 */
function getFirst(prefix, opts, callback) {
  opts = _.extend({}, opts);
  opts.db = opts.db || window.localStorage;

  for (var key in opts.db) {
    if (key !== prefix && key.indexOf(prefix) !== 0) continue;

    read(key, function(error, value) {
      if (_.isNull(v)) {
        return callback(new Error('Could not decrypt data'), null, keys[0]);
      }
      return callback(null, value, keys[0]);
    });
  };
  return callback(new Error('not found'));
}

/**
 * Read an encrypted element from the keystore
 *
 * @param {string} key
 * @param {RetrieveCallback} callback
 */
function read(key, secret, opts, callback) {
  preconditions.checkArgument(callback);
  var storage = opts.storage || window.localStorage;

  storage.getItem(k, function(ret) {
    if (!ret) {
      return callback(null);
    }
    ret = cryptoUtils.decrypt(secret, ret);
    if (!ret) {
      return callback(null);
    }
    return callback(ret);
  });
}

function write(key, value, password, opts, callback) {

  var storage = opts.storage || window.localStorage;
  var cypher = cryptoUtils.encrypt(password, value);
  if (storage.getItem(key && !opts.overwrite)) {
    return cb(new Error('PEXISTS: Profile already exists'))
  }
  storage.setItem(key, cypher);
  log.debug('Profile stored');
  return callback();
}

module.exports = {
  getFirst: getFirst,
  read: read,
  write: write,
  retrieve: read,
  save: write
};
