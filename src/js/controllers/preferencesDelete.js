'use strict';

angular.module('copayApp.controllers').controller('preferencesDeleteWalletController',
  function($scope, $ionicPopup, $stateParams, notification, profileService, go, gettextCatalog, ongoingProcess) {
    var wallet = profileService.getWallet($stateParams.walletId);
    var name = wallet.credentials.walletName;
    var walletName = (wallet.alias || '') + ' [' + name + ']';
    $scope.walletName = walletName;
    $scope.error = null;

    $scope.showDeletePopup = function() {
      var popup = $ionicPopup.show({
        template: '<span>' + gettextCatalog.getString('Are you sure you want to delete this wallet?') + '</span>',
        title: gettextCatalog.getString('Confirm'),
        buttons: [
          {
            text: gettextCatalog.getString('Cancel'),
            onTap: function(e) {
              popup.close();
            }
          },
          {
            text: gettextCatalog.getString('Accept'),
            type: 'button-positive',
            onTap: function(e) {
              deleteWallet();
              popup.close();
            }
          }
        ]
      });
    };

    var deleteWallet = function() {
      ongoingProcess.set('deletingWallet', true);
      profileService.deleteWalletClient(wallet, function(err) {
        ongoingProcess.set('deletingWallet', false);
        if (err) {
          $scope.error = err.message || err;
        } else {
          go.path('tabs.home');
          notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('The wallet "{{walletName}}" was deleted', {
            walletName: walletName
          }));
        }
      });
    };
  });
