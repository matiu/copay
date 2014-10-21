'use strict';

angular.module('copayApp.controllers').controller('HomeController', function($scope, $rootScope, $location, notification, controllerUtils, pluginManager, persistence) {
  controllerUtils.redirIfLogged();

  $scope.retreiving = true;
  copay.Identity.anyProfile({
    pluginManager: pluginManager,
  }, function(any) {
    $scope.retreiving = false;
    if (!any)
      $location.path('/createProfile');
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
        persistence.localstorageIdentity.retrieve(
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
