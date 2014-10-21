var Profile = require('../../models/Profile');
var localstorageUtils = require('../localstorageUtils.js');

function retrieve(email, password, opts, callback) {

  preconditions.checkArgument(callback);

  var storage = opts.storage || window.localStorage;
  var key = Profile.key(Profile.hash(email, password));

  var retrieved = storage.getItem(key);
  if (!retrieved) {
    return callback(new Error('Could not open profile'));
  }
  if (!retrieved.email) {
    return callback(new Error('Unable to read profile'));
  }

  return callback(null, new Profile(retrieved));
}

function store(profile, opts, callback) {

  preconditions.checkArgument(callback);
  var self = profile;
  var val = self.toObj();
  var key = self.key;
  var storage = opts.storage || window.localStorage;

  storage.get(key, function(val2) {

    if (val2 && !opts.overwrite) {
      return cb(new Error('PEXISTS: Profile already exists'))
    } else {
      storage.set(key, val, function(err) {
        log.debug('Profile stored');
        return cb(err);
      });
    }
  });
}

function any(callback) {
  localstorageUtils.getFirst(Profile.key(''), { onlyKey: true }, function(err, _, element) {
    return callback(err, !!element);
  });
}

module.exports = {
  retrieve: retrieve,
  store: store,
  doesAnyProfileExist: any
};
