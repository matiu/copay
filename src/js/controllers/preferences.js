'use strict';

angular.module('copayApp.controllers').controller('preferencesController',
  function($scope, $rootScope, $timeout, $log, $stateParams, configService, profileService, fingerprintService, walletService) {

    var wallet = profileService.getWallet($stateParams.walletId);
    var walletId = wallet.credentials.walletId;
    $scope.wallet = wallet;

    $scope.init = function() {
      $scope.externalSource = null;

      if (wallet) {
        walletService.updateStatus(wallet, {}, function(err, status) {});
        var config = configService.getSync();
        config.aliasFor = config.aliasFor || {};
        $scope.alias = config.aliasFor[walletId] || wallet.credentials.walletName;
        $scope.color = config.colorFor[walletId] || '#4A90E2';

        $scope.isFc = true;
        $scope.canSign = fc.credentials.canSign();

        if (wallet.isPrivKeyExternal)
          $scope.externalSource = wallet.getPrivKeyExternalSourceName() == 'ledger' ? 'Ledger' : 'Trezor';

        $scope.spendingPassword = walletService.isEncrypted(fc);
        $scope.deleted = false;
        if (wallet.credentials && !wallet.credentials.mnemonicEncrypted && !wallet.credentials.mnemonic) {
          $scope.deleted = true;
        }
      }

      $scope.touchidAvailable = fingerprintService.isAvailable();
      $scope.touchidEnabled = config.touchIdFor ? config.touchIdFor[walletId] : null;
    };

    var handleEncryptedWallet = function(cb) {
      $rootScope.$emit('Local/NeedsPassword', false, function(err, password) {
        if (err) return cb(err);
        return cb(walletService.unlock(wallet, password));
      });
    };

    $scope.encryptChange = function() {
      if (!wallet) return;
      var val = $scope.spendingPassword.enabled;

      var setPrivateKeyEncryption = function(password, cb) {
        $log.debug('Encrypting private key for', wallet.credentials.walletName);

        wallet.setPrivateKeyEncryption(password);
        wallet.lock();
        profileService.updateCredentials(JSON.parse(wallet.export()), function() {
          $log.debug('Wallet encrypted');
          return cb();
        });
      };

      var disablePrivateKeyEncryption = function(cb) {
        $log.debug('Disabling private key encryption for', wallet.credentials.walletName);

        try {
          wallet.disablePrivateKeyEncryption();
        } catch (e) {
          return cb(e);
        }
        profileService.updateCredentials(JSON.parse(wallet.export()), function() {
          $log.debug('Wallet encryption disabled');
          return cb();
        });
      };

      if (val && !walletService.isEncrypted(wallet)) {
        $rootScope.$emit('Local/NeedsPassword', true, function(err, password) {
          if (err || !password) {
            $scope.spendingPassword = false;
            return;
          }
          setPrivateKeyEncryption(password, function() {
            $rootScope.$emit('Local/NewEncryptionSetting');
            $scope.spendingPassword = true;
          });
        });
      } else {
        if (!val && walletService.isEncrypted(wallet)) {
          handleEncryptedWallet(function(err) {
            if (err) {
              $scope.spendingPassword = true;
              return;
            }
            disablePrivateKeyEncryption(function(err) {
              $rootScope.$emit('Local/NewEncryptionSetting');
              if (err) {
                $scope.spendingPassword = true;
                $log.error(err);
                return;
              }
              $scope.spendingPassword = false;
            });
          });
        }
      }
    };

    $scope.touchidChange = function() {

      var opts = {
        touchIdFor: {}
      };
      opts.touchIdFor[walletId] = $scope.touchidEnabled;

      fingerprintService.check(wallet, function(err) {
        if (err) {
          $log.debug(err);
          $timeout(function() {
            $scope.touchidError = true;
            $scope.touchidEnabled = true;
          }, 100);
          return;
        }
        configService.set(opts, function(err) {
          if (err) {
            $log.debug(err);
            $scope.touchidError = true;
            $scope.touchidEnabled = false;
          }
        });
      });
    };
  });
