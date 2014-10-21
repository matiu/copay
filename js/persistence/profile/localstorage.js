var Profile = require('../../models/Profile');

function retrieve(email, password, opts, callback) {

  preconditions.checkArgument(callback);

  var storage = opts.storage || window.localStorage;
  var key = Profile.key(Profile.hash(email, password));

  storage.get(key, function(err, profileOpts) {
    if (err) {
      return cb(new Error('Unexpected error fetching the profile'));
    }

    if (profileOpts && !profileOpts.email) {
      return cb(new Error('Could not open profile'));
    }

    return cb(null, new Profile(profileOpts));
  });
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

module.exports = {
  retrieve: retrieve,
  store: store
};
