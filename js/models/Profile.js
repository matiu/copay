'use strict';
var preconditions = require('preconditions').singleton();
var _ = require('underscore');
var log = require('../log');
var bitcore = require('bitcore');

function Profile(opts) {
  preconditions.checkArgument(opts.email);
  preconditions.checkArgument(opts.hash);

  this.hash = opts.hash;
  this.email = opts.email;
  this.extra = opts.extra || {};
  this.walletInfos = opts.walletInfos || {};

  this.key = Profile.key(this.hash);
};

Profile.create = function(email, password) {
  var p = new Profile({
    email: email,
    hash: Profile.hash(email, password),
  });
  return p;
};

Profile.hash = function(email, password) {
  return bitcore.util.sha256ripe160(email + password).toString('hex');
};

Profile.key = function(hash) {
  return 'profile::' + hash;
};

Profile.any = function(storage, cb) {
  storage.getFirst(Profile.key(''), { onlyKey: true}, function(err, v, k) {
    return cb(k ? true : false);
  });
};

Profile.prototype.toObj = function() {
  return _.clone(_.pick(this, 'hash', 'email', 'extra', 'walletInfos'));
};


/*
 * @desc Return a base64 encrypted version of the wallet
 * @return {string} base64 encoded string
 */
Profile.prototype.export = function() {
  var profObj = this.toObj();
  return this.storage.encrypt(profObj);
};

/*
 * @desc Return a base64 encrypted version of the wallet
 * @return {string} base64 encoded string
 */
Profile.import = function(str, password, storage) {
  var obj = storage.decrypt(str,password)
  return new Profile(obj, storage);
};

Profile.prototype.getWallet = function(walletId, cb) {
  return this.walletInfos[walletId];
};

Profile.prototype.listWallets = function() {
  return _.sortBy(this.walletInfos, function(winfo) {
    return winfo.createdTs;
  });
};


Profile.prototype.deleteWallet = function(walletId, cb) {
  if (!this.walletInfos[walletId])
    return cb(new Error('WNOEXIST: Wallet not on profile '));

  delete this.walletInfos[walletId];
  cb(null, this);
};

Profile.prototype.addToWallet = function(walletId, info, cb) {
  if (!this.walletInfos[walletId])
    return cb(new Error('WNOEXIST: Wallet not on profile '));

  this.walletInfos[walletId] = _.extend(this.walletInfos[walletId], info);
  cb(null, this);
};



Profile.prototype.addWallet = function(walletId, info, cb) {
  preconditions.checkArgument(cb);

  if (this.walletInfos[walletId])
    return cb(new Error('WEXIST: Wallet already on profile '));

  this.walletInfos[walletId] = _.extend(info, {
    createdTs: Date.now(),
    id: walletId
  });
  cb(null, this);
};


Profile.prototype.setLastFocusedTs = function(walletId, cb) {
  return this.addToWallet(walletId, {
    lastFocusedTs: Date.now()
  }, cb);
};

Profile.prototype.getLastFocusedWallet = function() {
  var self = this;
  var maxTs = _.max(_.pluck(self.walletInfos, 'lastFocusedTs'));
  var last = _.findWhere(_.values(self.walletInfos), {
    lastFocusedTs: maxTs
  });
  return last ? last.id : null;
};

Profile.prototype.store = function(opts, cb) {
  var self = this;
  var val = self.toObj();
  var key = self.key;

  self.storage.get(key, function(val2) {

    if (val2 && !opts.overwrite) {
      if (cb)
        return cb(new Error('PEXISTS: Profile already exist '))
    } else {
      self.storage.set(key, val, function(err) {
        log.debug('Profile stored');
        if (cb)
          cb(err);
      });
    }
  });
};


Profile.prototype.getName = function() {
  return this.extra.nickname || this.email;
};

module.exports = Profile;
