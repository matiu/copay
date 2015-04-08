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
