'use strict';

angular.module('copayApp.controllers').controller('preferencesAltCurrencyController',
  function($scope, $rootScope, $filter, $timeout, $modal, balanceService, notification, backupService, profileService, configService, isMobile, isCordova, go, rateService, applicationService, bwcService, lodash) {
    this.isSafari = isMobile.Safari();
    this.isCordova = isCordova;
    this.hideAdv = true;
    this.hidePriv = true;
    this.hideSecret = true;
    this.error = null;
    this.success = null;

    var config = configService.getSync();

    this.selectedAlternative = {
      name: config.wallet.settings.alternativeName,
      isoCode: config.wallet.settings.alternativeIsoCode
    };

    this.alternativeOpts = [this.selectedAlternative]; //default value

    var self = this;
    rateService.whenAvailable(function() {
      self.alternativeOpts = rateService.listAlternatives();
      lodash.remove(self.alternativeOpts, function(n) {
        return n.isoCode == 'BTC';
      });

      for (var ii in self.alternativeOpts) {
        if (config.wallet.settings.alternativeIsoCode === self.alternativeOpts[ii].isoCode) {
          self.selectedAlternative = self.alternativeOpts[ii];
        }
      }
      $scope.$digest();
    });


    this.save = function(newAltCurrency) {
      var opts = {
        wallet: {
          settings: {
            alternativeName: newAltCurrency.name,
            alternativeIsoCode: newAltCurrency.isoCode,
          }
        }
      };

      configService.set(opts, function(err) {
        if (err) console.log(err);
        go.preferences();
        $scope.$emit('Local/ConfigurationUpdated');
      });
    };


  });
