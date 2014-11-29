'use strict';

angular.module('copayApp.controllers').controller('SidebarController', function($scope, $rootScope, $location, $timeout, identityService) {

  $scope.menu = [{
    'title': 'Home',
    'icon': 'fi-home',
    'link': 'homeWallet'
  }, {
    'title': 'Receive',
    'icon': 'fi-download',
    'link': 'receive'
  }, {
    'title': 'Send',
    'icon': 'fi-arrow-right',
    'link': 'send'
  }, {
    'title': 'History',
    'icon': 'fi-clipboard-pencil',
    'link': 'history'
  }, {
    'title': 'Settings',
    'icon': 'fi-widget',
    'link': 'more'
  }];

  $scope.signout = function() {
    $scope.$emit('signout');
  };

  $scope.isActive = function(item) {
    return item.link && item.link == $location.path().split('/')[1];
  };

  $scope.switchWallet = function(wid) {
    identityService.setFocusedWallet(wid);
  };

  $scope.toggleWalletSelection = function() {
    $scope.walletSelection = !$scope.walletSelection;
    if (!$scope.walletSelection) return;
    $scope.setWallets();
  };


  $scope.init = function() {
    if ($rootScope.wallet) {
      $rootScope.$watch('wallet', function() {
        $scope.walletSelection = false;
        $scope.setWallets();
      });
    }
  };


  $scope.setWallets = function() {
    if (!$rootScope.iden) return;
    var ret = _.filter($rootScope.iden.listWallets(), function(w) {
      return !identityService.isFocused(w.getId());
    });
    $scope.wallets = ret;
  };
});
