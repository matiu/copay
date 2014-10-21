var Profile = require('../../models/Profile');
var localstorageUtils = require('../../util/localstorage');

function retrieve(email, password, opts, callback) {

  preconditions.checkArgument(callback);
  var key = Profile.key(Profile.hash(email, password));

  var retrieved = localstorageUtil.retrieve(key, password, opts, function(err, retrieved) {
    if (!retrieved) {
      return callback(new Error('Could not open profile'));
    }
    if (!retrieved.email) {
      return callback(new Error('Unable to read profile'));
    }

    return callback(null, new Profile(retrieved));
  });
}

function store(profile, password, opts, callback) {

  preconditions.checkArgument(callback);
  var self = profile;
  var val = self.toObj();
  var key = self.key;

  localstorageUtil.save(key, val, password, opts, callback);
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
