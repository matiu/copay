'use strict';

angular.module('copayApp.controllers').controller('preferencesController',
  function($scope, $rootScope, $filter, $timeout, $modal, configService) {
    this.error = null;
    this.success = null;

    var config = configService.getSync();

    this.unitName = config.wallet.settings.unitName;
    this.bwsurl = config.bws.url;
    this.selectedAlternative = {
      name: config.wallet.settings.alternativeName,
      isoCode: config.wallet.settings.alternativeIsoCode
    };


    var unwatch = $scope.$watch('encrypt', function(val) {

console.log('[preferences.js.19] WATCH', val ); //TODO
      if (val)
      $rootScope.$emit('Local/NeedsPassword', true, function(err, password) {
console.log('[preferences.js.19:password:]',err, password); //TODO
        // fc.setPrivateKeyEncryption(password);
        // fc.lock();
      });
    });

    $scope.$on('$destroy', function() {
      unwatch();
      console.log('[preferences.js.24] DESTROY'); //TODO
    });
  });
