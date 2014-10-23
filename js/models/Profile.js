'use strict';
var preconditions = require('preconditions').singleton();
var _ = require('underscore');
var log = require('../log');
var bitcore = require('bitcore');

function Profile(info, storage) {
  preconditions.checkArgument(info.email);
  preconditions.checkArgument(info.hash);
  preconditions.checkArgument(storage);
  preconditions.checkArgument(storage.setPassword, 'bad storage');

  this.password = info.password;
  this.hash = info.hash;
  this.email = info.email;
  this.extra = info.extra || {};
  this.walletInfos = info.walletInfos || {};

  this.key = Profile.key(this.hash);
  this.storage = storage;
};

Profile.hash = function(email) {
  return bitcore.util.sha256ripe160(email).toString('hex');
};

Profile.key = function(hash) {
  return 'profile::' + hash;
};


Profile.create = function(email, password, storage, cb) {
  preconditions.checkArgument(cb);
  preconditions.checkArgument(storage.setPassword);

  preconditions.checkState(storage.hasPassphrase());

  var p = new Profile({
    email: email,
    password: password,
    hash: Profile.hash(email, password),
  }, storage);
  p.store({}, function(err) {
    return cb(err, p);
  });
};


Profile.any = function(storage, cb) {
  storage.getFirst(Profile.key(''), { onlyKey: true}, function(err, v, k) {
    return cb(k ? true : false);
  });
};

Profile.open = function(email, password, storage, cb) {
  preconditions.checkArgument(cb);
  preconditions.checkState(storage.hasPassphrase());

  var key = Profile.key(Profile.hash(email, password));
  storage.get(key, function(err, val) {
    if (err || !val)
      return cb(new Error('PNOTFOUND: Profile not found'));

    if (!val.email)
      return cb(new Error('PERROR: Could not open profile'));

    return cb(null, new Profile(val, storage));
  });
};

Profile.prototype.toObj = function() {
  return _.clone(_.pick(this, 'password', 'hash', 'email', 'extra', 'walletInfos'));
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
  this.store({
    overwrite: true
  }, cb);
};

Profile.prototype.addToWallet = function(walletId, info, cb) {
  if (!this.walletInfos[walletId])
    return cb(new Error('WNOEXIST: Wallet not on profile '));

  this.walletInfos[walletId] = _.extend(this.walletInfos[walletId], info);

  this.store({
    overwrite: true
  }, cb);
};



Profile.prototype.addWallet = function(walletId, info, cb) {
  preconditions.checkArgument(cb);

  if (this.walletInfos[walletId])
    return cb(new Error('WEXIST: Wallet already on profile '));

  this.walletInfos[walletId] = _.extend(info, {
    createdTs: Date.now(),
    id: walletId
  });

  this.store({
    overwrite: true
  }, cb);
};


Profile.prototype.setLastFocusedTs = function(walletId, cb) {
  return this.addToWallet(walletId, {
    lastFocusedTs: Date.now()
  }, cb);
};

Profile.prototype.getLastFocusedWallet = function() {
  var self = this;
  var last;
  var maxTs = _.max(_.pluck(self.walletInfos, 'lastFocusedTs'));
  var wallets = _.values(self.walletInfos);

  last = _.findWhere(wallets, {
    lastFocusedTs: maxTs
  });

  if (!last) {
    last = _.last(wallets);
  }

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
