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

  });
