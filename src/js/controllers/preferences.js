'use strict';

angular.module('copayApp.controllers').controller('preferencesController',
  function($scope, $rootScope, $filter, $timeout, $modal, balanceService, notification, backupService, profileService, configService, isMobile, isCordova, go, rateService, applicationService, bwcService) {
    this.isSafari = isMobile.Safari();
    this.isCordova = isCordova;
    this.hideAdv = true;
    this.hidePriv = true;
    this.hideSecret = true;
    this.error = null;
    this.success = null;

    var config = configService.getSync();

    this.unitName = config.wallet.settings.unitName;
    this.bwsurl = config.bws.url;


    this.selectedAlternative = {
      name: config.wallet.settings.alternativeName,
      isoCode: config.wallet.settings.alternativeIsoCode
    };

    console.log('this.unitName ', this.unitName);
    console.log('this.selectedAlternative  ', this.selectedAlternative);




    // var self = this;
    // rateService.whenAvailable(function() {
    //   self.alternativeOpts = rateService.listAlternatives();
    //   for (var ii in self.alternativeOpts) {
    //     if (config.wallet.settings.alternativeIsoCode === self.alternativeOpts[ii].isoCode) {
    //       self.selectedAlternative = self.alternativeOpts[ii];
    //     }
    //   }
    //   $scope.$digest();
    // });


    // this.save = function() {
    //   var opts = {
    //     wallet: {
    //       settings: {
    //         unitName: this.selectedUnit.shortName,
    //         unitToSatoshi: this.selectedUnit.value,
    //         unitDecimals: this.selectedUnit.decimals,
    //         unitCode: this.selectedUnit.code,
    //         alternativeName: this.selectedAlternative.name,
    //         alternativeIsoCode: this.selectedAlternative.isoCode,
    //       }
    //     },
    //     bws: {
    //       url: this.bwsurl,
    //     }
    //   };

    //   configService.set(opts, function(err) {
    //     if (err) console.log(err);
    //     var hardRestart = !$scope.settingsForm.bwsurl.$pristine;
    //     applicationService.restart(hardRestart);
    //     go.walletHome();
    //     $scope.$emit('Local/ConfigurationUpdated');
    //     notification.success('Success', $filter('translate')('settings successfully updated'));
    //   });
    // };

    var _modalDeleteWallet = function() {
      var ModalInstanceCtrl = function($scope, $modalInstance) {
        $scope.title = 'Are you sure you want to delete this wallet?';
        $scope.loading = false;

        $scope.ok = function() {
          $scope.loading = true;
          $modalInstance.close('ok');

        };
        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
        };
      };

      var modalInstance = $modal.open({
        templateUrl: 'views/modals/confirmation.html',
        windowClass: 'full',
        controller: ModalInstanceCtrl
      });
      modalInstance.result.then(function(ok) {
        if (ok) {
          _deleteWallet();
        }
      });
    };

    var _deleteWallet = function() {
      $timeout(function() {
        var fc = profileService.focusedClient;
        var walletName = fc.credentials.walletName;

        profileService.deleteWallet({}, function(err) {
          if (err) {
            this.error = err.message || err;
            console.log(err);
            $timeout(function() {
              $scope.$digest();
            });
          } else {
            go.walletHome();
            $timeout(function() {
              notification.success('Success', 'The wallet "' + walletName + '" was deleted');
            });
          }
        });
      }, 100);
    };

    this.deleteWallet = function() {
      if (isCordova) {
        navigator.notification.confirm(
          'Are you sure you want to delete this wallet?',
          function(buttonIndex) {
            if (buttonIndex == 2) {
              _deleteWallet();
            }
          },
          'Confirm', ['Cancel', 'OK']
        );
      } else {
        _modalDeleteWallet();
      }
    };
  });
