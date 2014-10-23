'use strict';

angular.module('copayApp.controllers').controller('HomeController', function(
  $scope, $rootScope, $location,
  async,
  notification, controllerUtils, pluginManager,
  persistence
) {
  controllerUtils.redirIfLogged();

  $scope.retreiving = false;

  persistence.getInstance('Profile', 'localstorage').doesAnyProfileExist(function(error, exists) {
    $scope.retreiving = false;
    if (exists) {
      alert('Autofill de profile?');
    }
  });

  $scope.openProfile = function(form) {
    if (form && form.$invalid) {
      notification.error('Error', 'Please enter the required fields');
      return;
    }
    $scope.loading = true;

    var identity = null;
    var identityConfig = {
      pluginManager: pluginManager,
      network: config.network,
      networkName: config.networkName,
      walletDefaults: config.wallet,
      passphraseConfig: config.passphraseConfig,
    };
    var email = form.email.$modelValue;
    var password = form.password.$modelValue;
    var identityCallback = function(callback) {
      return function(err, iden) {
        if (err) {
          return callback(err);
        } else {
          identity = iden;
          return callback();
        }
      }
    };
    async.series([
      function(callback) {
        persistence.getInstance('Profile', 'localstorage').retrieve(
          email, password, identityConfig, identityCallback(callback)
        );
      },
      function(callback) {
        /*
        persistence.insightIdentity.retrieve(
          username, email, identityConfig, identityCallback(callback)
        );
        */
        callback();
      },
    ], function(err) {
      if (err) {
        controllerUtils.onErrorDigest($scope, 'Profile not found');
      } else {
        var lastFocusedWallet = iden.profile.getLastFocusedWallet();
        controllerUtils.bindProfile($scope, iden, lastFocusedWallet);
      }
    });
  }
});
