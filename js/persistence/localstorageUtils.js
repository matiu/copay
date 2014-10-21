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

  opts.db.allKeys(function(allKeys) {
    var keys = _.filter(allKeys, function(k) {
      if ((k === prefix) || k.indexOf(prefix) === 0) return true;
    });

    if (keys.length === 0) {
      return cb(new Error('not found'));
    }

    if (opts.onlyKey) {
      return cb(null, null, keys[0]);
    }

    read(keys[0], function(error, value) {
      if (_.isNull(v)) {
        return cb(new Error('Could not decrypt data'), null, keys[0]);
      }
      return cb(null, value, keys[0]);
    })
  });
}

/**
 * Read an encrypted element from the keystore
 *
 * @param {string} key
 * @param {RetrieveCallback} callback
 */
function read(key, secret, callback) {
  preconditions.checkArgument(callback);

  var self = this;
  this.db.getItem(k, function(ret) {
    if (!ret) {
      return cb(null);
    }
    ret = cryptoUtils.decrypt(secret, ret);
    if (!ret) {
      return cb(null);
    }
    return cb(ret);
  });
}

function write() {
}

module.exports = {
  getFirst: getFirst,
  read: read,
  write: write
};
