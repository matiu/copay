
'use strict';

angular.module('copayApp.controllers').controller('backupController',
  function($scope, $timeout, backupService, profileService, isMobile, isCordova) {
    this.isSafari = isMobile.Safari();
    this.isCordova = isCordova;
    this.error = null;
    this.success = null;

    this.copyText = function(text) {
      if (isCordova) {
        window.cordova.plugins.clipboard.copy(text);
        window.plugins.toast.showShortCenter('Copied to clipboard');
      }
    };

    this.downloadWalletBackup = function() {
      backupService.walletDownload(this.password);
    };

    this.getBackup = function() {
      var b = backupService.walletExport(this.password);
    };

    this.viewWalletBackup = function() {
      var self = this;
      this.loading = true;
      $timeout(function() {
        self.backupWalletPlainText = self.getBackup();
      }, 100);
    };

    this.copyWalletBackup = function() {
      var ew = this.getBackup();
      window.cordova.plugins.clipboard.copy(ew);
      window.plugins.toast.showShortCenter('Copied to clipboard');
    };

    this.sendWalletBackup = function() {
      var fc = profileService.focusedClient;
      if (isMobile.Android() || isMobile.Windows()) {
        window.ignoreMobilePause = true;
      }
      window.plugins.toast.showShortCenter('Preparing backup...');
      var name = (fc.credentials.walletName || fc.credentials.walletId);
      var ew = this.getBackup();
      var properties = {
        subject: 'Copay Wallet Backup: ' + name,
        body: 'Here is the encrypted backup of the wallet ' + name + ': \n\n' + ew + '\n\n To import this backup, copy all text between {...}, including the symbols {}',
        isHtml: false
      };
      window.plugin.email.open(properties);
    };

  });
