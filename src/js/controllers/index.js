'use strict';

angular.module('copayApp.controllers').controller('indexController', function($rootScope, $log, $filter, lodash, go, profileService, configService, isCordova, rateService) {
  var self = this;

  function strip(number) {
    return (parseFloat(number.toPrecision(12)));
  };

  self.isCordova = isCordova;

  $rootScope.$on('updateStatus', function(event) {
    var fc = profileService.focusedClient;
    self.hasProfile = true;

    // Credentials Shortcuts 
    self.m = fc.m;
    self.n = fc.n;
    self.network = fc.network;
    self.myCopayerId = fc.copayerId;
    self.requiresMultipleSignatures = fc.m > 1;
    self.isShared = fc.n > 1;
    self.walletName = fc.credentials.walletName;
    self.walletId = fc.credentials.walletId;
    self.isComplete = fc.isComplete;

    // Clear history
    self.txHistory = null;

    self.updatingStatus = true;
    $log.debug('Updating Status:', fc);
    fc.getStatus(function(err, walletStatus) {
      console.log('[index.js.27:walletStatus:]', walletStatus); //TODO
      self.updateBalance(walletStatus.balance);
      self.updateTxps(walletStatus.pendingTxps);

      // Status Shortcuts
      self.walletName = walletStatus.wallet.name;
      self.walletSecret = walletStatus.wallet.secret;
      self.walletStatus = walletStatus.wallet.status;
      $log.debug('Index: ', self);
      self.updatingStatus = false;
      $rootScope.$apply();
    });
  });

  $rootScope.$on('walletWasCompleted', function(event) {
    go.walletHome();
  });

  $rootScope.$on('updateBalance', function(event) {
    self.updatingBalance = true;
    profileService.focusedClient.getBalance(function(err, balance) {
      self.updateBalance(balance);
      self.updatingBalance = false;
      $rootScope.$apply();
    });
  });

  $rootScope.$on('updatePendingTxps', function(event) {
    self.updatingPendingTxps = true;
    profileService.focusedClient.getTxProposals({}, function(err, txps) {
      self.updateTxps(txps);
      self.updatingPendingTxps = false;
      $rootScope.$apply();
    });
  });

  self.updateTxps = function(txps) {
    self.txps = txps;
    var config = configService.getSync().wallet.settings;
    self.pendingTxProposalsCountForUs = 0;
    lodash.each(txps, function(tx) {
      var amount = tx.amount * self.satToUnit;
      tx.amountStr = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' ' + config.unitName;
      tx.alternativeAmount = rateService.toFiat(tx.amount, config.alternativeIsoCode).toFixed(2);
      tx.alternativeAmountStr = tx.alternativeAmount + " " + config.alternativeIsoCode;
      tx.alternativeIsoCode = config.alternativeIsoCode;

      var action = lodash.find(tx.actions, {
        copayerId: self.copayerId
      });
      if (!action && tx.status == 'pending')
        tx.pendingForUs = true;

      if (tx.creatorId != self.myCopayerId) {
        self.pendingTxProposalsCountForUs = self.pendingTxProposalsCountForUs + 1;
      }
    });
  };

  self.updateBalance = function(balance) {
    console.log('[index.js.48:balance:]', balance); //TODO
    var config = configService.getSync().wallet.settings;
    var COIN = 1e8;

    // Address with Balance
    self.balanceByAddress = balance.byAddress;

    // SAT
    self.totalBalanceSat = balance.totalAmount;
    self.lockedBalanceSat = balance.lockedAmount;
    self.availableBalanceSat = self.totalBalanceSat - self.lockedBalanceSat;

    // Selected unit
    self.unitToSatoshi = config.unitToSatoshi;
    self.satToUnit = 1 / self.unitToSatoshi;
    self.unitName = config.unitName;

    self.totalBalance = strip(self.totalBalanceSat * self.satToUnit);
    self.lockedBalance = strip(self.lockedBalanceSat * self.satToUnit);
    self.availableBalance = strip(self.availableBalanceSat * self.satToUnit);

    // BTC
    self.totalBalanceBTC = strip(self.totalBalanceSat / COIN);
    self.lockedBalanceBTC = strip(self.lockedBalanceSat / COIN);
    self.availableBalanceBTC = strip(self.availableBalanceBTC / COIN);

    //STR
    self.totalBalanceStr = self.totalBalance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' ' + self.unitName;
    self.lockedBalanceStr = self.lockedBalance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' ' + self.unitName;
    self.availableBalanceStr = self.availableBalance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' ' + self.unitName;

    // var availableBalanceNr = safeBalanceSat * satToUnit;
    // r.safeUnspentCount = safeUnspentCount;



    // if (r.safeUnspentCount) {
    //   var estimatedFee = copay.Wallet.estimatedFee(r.safeUnspentCount);
    //   r.topAmount = (((availableBalanceNr * w.settings.unitToSatoshi).toFixed(0) - estimatedFee) / w.settings.unitToSatoshi);
    // }
    //

    rateService.whenAvailable(function() {

      var config = configService.getSync().wallet.settings;
      self.alternativeName = config.alternativeName;
      self.alternativeIsoCode = config.alternativeIsoCode;

      var totalBalanceAlternative = rateService.toFiat(self.totalBalance * self.unitToSatoshi, config.alternativeIsoCode);
      var lockedBalanceAlternative = rateService.toFiat(self.lockedBalance * self.unitToSatoshi, config.alternativeIsoCode);
      var alternativeConversionRate = rateService.toFiat(100000000, config.alternativeIsoCode);

      self.totalBalanceAlternative = $filter('noFractionNumber')(totalBalanceAlternative, 2);
      self.lockedBalanceAlternative = $filter('noFractionNumber')(lockedBalanceAlternative, 2);
      self.alternativeConversionRate = $filter('noFractionNumber')(alternativeConversionRate, 2);

      self.alternativeBalanceAvailable = true;
      self.alternativeIsoCode = config.alternativeIsoCode;

      self.alternativeBalanceAvailable = true;
      self.updatingBalance = false;

      self.isRateAvailable = true;
      $rootScope.$apply();

    });
  };

  self.openMenu = function() {
    go.swipe(true);
  }

  self.closeMenu = function() {
    go.swipe();
  }


});
