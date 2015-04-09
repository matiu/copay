'use strict';

angular.module('copayApp.controllers').controller('preferencesController',
  function($scope, $rootScope, $filter, $timeout, $modal, configService, profileService) {
    this.error = null;
    this.success = null;

    var config = configService.getSync();

    this.unitName = config.wallet.settings.unitName;
    this.bwsurl = config.bws.url;
    this.selectedAlternative = {
      name: config.wallet.settings.alternativeName,
      isoCode: config.wallet.settings.alternativeIsoCode
    };
    var fc = profileService.focusedClient;
    $scope.encrypt = fc.hasPrivKeyEncrypted();
    console.log('[preferences.js.17:encrypt:]', $scope.encrypt); //TODO

    var unwatch = $scope.$watch('encrypt', function(val) {
      if (val) {
        $rootScope.$emit('Local/NeedsPassword', true, function(err, password) {
          if (err || !password) {
            $scope.encrypt = false;
            return;
          }
          profileService.setPrivateKeyEncryption(password, function() {
            $scope.encrypt = true;
          });
        });
      }
    });

    $scope.$on('$destroy', function() {
      unwatch();
    });
  });
