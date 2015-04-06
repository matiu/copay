'use strict';

angular.module('copayApp.controllers').controller('copayersController',
  function($scope, $rootScope, $timeout, $log, $modal, profileService, go, notification, isCordova) {
    var self = this;
    var fc = profileService.focusedClient;


    self.init = function() {

      console.log('[copayers.js.10]', fc.isComplete()); //TODO
      if (fc.isComplete()) {
        $log.debug('Wallet Complete...redirecting')
        go.walletHome();
        return;
      }

      $rootScope.title = 'Share this secret with your copayers';
      self.loading = false;
      self.isCordova = isCordova;
      // TODO
      // w.on('publicKeyRingUpdated', self.updateList);
      // w.on('ready', self.updateList);
      //
      self.updateList();
    };

    self.updateList = function() {
      return;

      // TODO
      var w = $rootScope.wallet;

      self.copayers = $rootScope.wallet.getRegisteredPeerIds();
      if (fc.isComplete()) {

        w.removeListener('publicKeyRingUpdated', self.updateList);
        w.removeListener('ready', self.updateList);
        go.walletHome();
      }
      $timeout(function() {
        $rootScope.$digest();
      }, 1);
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

    self.deleteWallet = function() {
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

    self.copySecret = function(secret) {
      if (isCordova) {
        window.cordova.plugins.clipboard.copy(secret);
        window.plugins.toast.showShortCenter('Copied to clipboard');
      }
    };

    self.shareSecret = function(secret) {
      if (isCordova) {
        if (isMobile.Android() || isMobile.Windows()) {
          window.ignoreMobilePause = true;
        }
        window.plugins.socialsharing.share(secret, null, null, null);
      }
    };

  });
