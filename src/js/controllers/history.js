'use strict';

angular.module('copayApp.controllers').controller('historyController',
  function($scope, $rootScope, $filter, $timeout, $modal, $log, profileService, notification, go, configService, rateService, lodash, storageService) {

    function strip(number) {
      return (parseFloat(number.toPrecision(12)));
    }

    var fc = profileService.focusedClient;
    var config = configService.getSync().wallet.settings;
    var formatAmount = profileService.formatAmount;
    this.unitToSatoshi = config.unitToSatoshi;
    this.satToUnit = 1 / this.unitToSatoshi;
    this.unitName = config.unitName;
    this.alternativeIsoCode = config.alternativeIsoCode;

    this.skip = 0;
    this.limit = 5;
    this.loadMore = false;
    this.txHistory = [];

    this.getUnitName = function() {
      return this.unitName;
    };

    this.getAlternativeIsoCode = function() {
      return this.alternativeIsoCode;
    };

    this.checkCacheTxHistory = function() {
      var self = this;
      storageService.getLastTransactions(fc.credentials.walletId, function(err, data) {
        if (err) {
          $log.debug('Error: ', err);
          return;
        }
        self.txHistory = JSON.parse(data);
      })
    };

    this.storeCacheTxHistory = function(txps) { 
      storageService.storeLastTransactions(fc.credentials.walletId, txps, function(err) {
        if (err) $log.debug('Error: ', err);
      });
    };

    this.getTxHistory = function(firstTime) {
      var self = this;
      if (firstTime) {
        self.checkCacheTxHistory();
      }
      self.updatingTxHistory = true;
      self.loadMore = false;
      $timeout(function() {
        fc.getTxHistory({
          skip: self.skip,
          limit: self.limit + 1
        }, function(err, txs) {
          if (err) {
            $log.debug('Creating address ERROR:', err);
            $scope.$emit('Local/ClientError', err);
          }
          else {

            if (firstTime) {
              self.txHistory = [];
            }
            var now = new Date();
            var c = 0;
            lodash.each(txs, function(tx) {
              tx.ts = tx.minedTs || tx.sentTs;
              tx.rateTs = Math.floor((tx.ts || now) / 1000);
              tx.amountStr = profileService.formatAmount(tx.amount); //$filter('noFractionNumber')(
              if (c < self.limit) {
                self.txHistory.push(tx);
                c++;
              }
            });

            if (firstTime) {
              self.storeCacheTxHistory(JSON.stringify(self.txHistory));
            }

            self.updatingTxHistory = false;
            self.skip = self.skip + self.limit;
            
            if (txs[self.limit]) {
              self.loadMore = true;
            }
            $scope.$apply();
          }
        });
      }, 100);
    };

    this._addRates = function(txs, cb) {
      if (!txs || txs.length == 0) return cb();
      var index = lodash.groupBy(txs, 'rateTs');

      rateService.getHistoricRates(config.alternativeIsoCode, lodash.keys(index), function(err, res) {
        if (err || !res) return cb(err);
        lodash.each(res, function(r) {
          lodash.each(index[r.ts], function(tx) {
            var alternativeAmount = (r.rate != null ? tx.amount * rateService.SAT_TO_BTC * r.rate : null);
            tx.alternativeAmount = alternativeAmount ? $filter('noFractionNumber')(alternativeAmount, 2) : null;
          });
        });
        return cb();
      });
    };

    this.openTxModal = function(btx) {
      var self = this;
      var ModalInstanceCtrl = function($scope, $modalInstance, profileService) {
        $scope.btx = btx;
        $scope.settings = config;
        $scope.btx.amountStr = profileService.formatAmount(btx.amount);

        $scope.getAmount = function(amount) {
          return self.getAmount(amount);
        };

        $scope.getUnitName = function() {
          return self.getUnitName();
        };

        $scope.getShortNetworkName = function() {
          var n = fc.credentials.network;
          return n.substring(0, 4);
        };

        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
        };
      };

      $modal.open({
        templateUrl: 'views/modals/tx-details.html',
        windowClass: 'full',
        controller: ModalInstanceCtrl,
      });
    };


    this.formatAmount = function(amount) {
      return profileService.formatAmount(amount);
    };

    this.hasAction = function(actions, action) {
      return actions.hasOwnProperty('create');
    };

  });
