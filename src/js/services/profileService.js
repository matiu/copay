'use strict';
angular.module('copayApp.services')
  .factory('profileService', function profileServiceFactory($rootScope, $location, $timeout, $filter, $log, lodash, pluginManager, balanceService, applicationService, storageService, bwcService, configService, notificationService) {

    var root = {};

    root.profile = null;
    root.focusedClient = null;
    root.walletClients = {};

    root.getUtils = function() {
      return bwcService.getUtils();
    };

    root.formatAmount = function(amount) {
      var config = configService.getSync().wallet.settings;
      if (config.unitCode == 'sat') return amount;

      //TODO : now only works for english, specify opts to change thousand separator and decimal separator
      return this.getUtils().formatAmount(amount, config.unitCode);
    };

    root._setFocus = function(walletId, cb) {
      $log.debug('Set focus:', walletId);

      // Set local object
      root.focusedClient = root.walletClients[walletId];

      if (lodash.isEmpty(root.focusedClient)) {
        root.focusedClient = root.walletClients[lodash.keys(root.walletClients)[0]];
      }

      if (lodash.isEmpty(root.focusedClient)) {
        $rootScope.$emit('Local/NoWallets');
      }

      // set if completed
      if (!lodash.isEmpty(root.focusedClient)) {
        $rootScope.$emit('Local/NewFocusedWallet');
      }

      return cb();
    };

    root.setAndStoreFocus = function(walletId, cb) {
      root._setFocus(walletId, function() {
        storageService.storeFocusedWalletId(walletId, cb);
      });
    };

    root.setWalletClients = function() {
      lodash.each(root.profile.credentials, function(credentials) {

        if (root.walletClients[credentials.walletId] &&
          root.walletClients[credentials.walletId].started) {
          return;
        }

        var client = bwcService.getClient(JSON.stringify(credentials));
        root.walletClients[credentials.walletId] = client;
        client.removeAllListeners();

        client.on('notification', function(notification) {
          $log.debug('BWC Notification:', notification);
          notificationService.newBWCNotification(notification,
            client.credentials.walletId, client.credentials.walletName);

          // Actions for both focuses and unfocuses wallets...
          if (notification.type == 'ScanFinished') {
            client.scanning = false;
          }

          if (root.focusedClient.credentials.walletId == client.credentials.walletId) {
            $rootScope.$emit(notification.type);
          } else {
            $rootScope.$apply();
          }
        });

        client.on('walletCompleted', function() {
          $log.debug('Wallet completed');

          var newCredentials = lodash.reject(root.profile.credentials, {
            walletId: client.credentials.walletId
          });
          newCredentials.push(JSON.parse(client.export()));
          root.profile.credentials = newCredentials;

          storageService.storeProfile(root.profile, function(err) {
            $rootScope.$emit('Local/WalletCompleted')
          });
        });

        root.walletClients[credentials.walletId].started = true;
        client.initNotifications(function(err) {
          if (err) {
            $log.error('Could not init notifications err:', err);
            root.walletClients[credentials.walletId].started = false;
            return;
          }
        });
      });
      $rootScope.$emit('updateWalletList');
    };


    root.bindProfile = function(profile, cb) {
      root.profile = profile;

      configService.get(function(err) {
        if (err) return cb(err);
        root.setWalletClients();
        storageService.getFocusedWalletId(function(err, focusedWalletId) {
          if (err) return cb(err);
          root._setFocus(focusedWalletId, cb);
        });
      });
    };


    root.loadAndBindProfile = function(cb) {
      storageService.getProfile(function(err, profile) {
        if (err) return cb(err);
        if (!profile) return cb(new Error('NOPROFILE: No profile'));

        return root.bindProfile(profile, cb);
      });
    };

    root._createNewProfile = function(pin, cb) {
      var walletClient = bwcService.getClient();

      // TODO livenet
      walletClient.createWallet('Personal Wallet', 'me', 1, 1, {
        network: 'testnet'
      }, function(err) {
        if (err) return cb('Error creating wallet. Check your internet connection');
        var p = Profile.create({
          credentials: [JSON.parse(walletClient.export())],
        });
        return cb(null, p);
      })
    };

    // TODO copayer name
    root.createWallet = function(opts, cb) {
      var walletClient = bwcService.getClient();
      $log.debug('Creating Wallet:', opts);

      if (opts.extendedPrivateKey) {
        try {
          walletClient.seedFromExtendedPrivateKey(opts.extendedPrivateKey);
        } catch (ex) {
          return cb('Could not create using the specified extended private key');
        }
      }
      walletClient.createWallet(opts.name, opts.myName || 'me', opts.m, opts.n, {
        network: opts.networkName
      }, function(err, secret) {
        if (err) return cb('Error creating wallet');

        root.profile.credentials.push(JSON.parse(walletClient.export()));
        root.setWalletClients();

        root.setAndStoreFocus(walletClient.credentials.walletId, function() {
          storageService.storeProfile(root.profile, function(err) {
            return cb(null, secret);
          });
        });
      })
    };

    root.joinWallet = function(opts, cb) {
      var walletClient = bwcService.getClient();
      $log.debug('Joining Wallet:', opts);
      if (opts.extendedPrivateKey) {
        try {
          walletClient.seedFromExtendedPrivateKey(opts.extendedPrivateKey);
        } catch (ex) {
          return cb('Could not join using the specified extended private key');
        }
      }
      // TODO name
      walletClient.joinWallet(opts.secret, opts.myName || 'me', function(err) {
        // TODO: err
        if (err) return cb('Error joining wallet' + err);

        root.profile.credentials.push(JSON.parse(walletClient.export()));
        root.setWalletClients();

        root.setAndStoreFocus(walletClient.credentials.walletId, function() {
          storageService.storeProfile(root.profile, function(err) {
            return cb(null, secret);
          });
        });
      })
    };

    root.deleteWallet = function(opts, cb) {
      var fc = root.focusedClient;
      $log.debug('Deleting Wallet:', fc.credentials.walletName);

      fc.removeAllListeners();
      root.profile.credentials = lodash.reject(root.profile.credentials, {
        walletId: fc.credentials.walletId
      });

      delete root.walletClients[fc.credentials.walletId];
      root.focusedClient = null;

      $timeout(function() {
        root.setWalletClients();
        root.setAndStoreFocus(null, function() {
          storageService.storeProfile(root.profile, function(err) {
            if (err) return cb(err);
            return cb();
          });
        });
      });
    };

    root.importWallet = function(str, opts, cb) {
      var walletClient = bwcService.getClient();
      $log.debug('Importing Wallet:', opts);
      try {
        walletClient.import(str, {
          compressed: opts.compressed,
          password: opts.password
        });
      } catch (err) {
        return cb('Could not import. Check input file and password');
      }

      var walletId = walletClient.credentials.walletId;

      // check if exist
      if (lodash.find(root.profile.credentials, {
        'walletId': walletId
      })) {
        return cb('Wallet already exists');
      }

      root.profile.credentials.push(JSON.parse(walletClient.export()));
      root.setWalletClients();

      root.setAndStoreFocus(walletId, function() {
        storageService.storeProfile(root.profile, function(err) {
          $rootScope.$emit('Local/WalletImported', walletId);
          return cb(null, walletId);
        });
      });
    };



    root.create = function(pin, cb) {
      root._createNewProfile(pin, function(err, p) {
        if (err) return cb(err);
        root.bindProfile(p, function(err) {
          storageService.storeNewProfile(p, function(err) {
            return cb(err);
          });
        });
      });
    };

    root.importLegacyWallet = function(username, password, blob, cb) {
      var walletClient = bwcService.getClient();

      walletClient.createWalletFromOldCopay(username, password, blob, function(err, existed) {
        if (err) return cb('Error importing wallet: ' + err);

        if (root.walletClients[walletClient.credentials.walletId]) {
          $log.debug('Wallet:' + walletClient.credentials.walletName + ' already imported');
          return cb('Wallet Already Imported: ' + walletClient.credentials.walletName);
        };

        $log.debug('Creating Wallet:', walletClient.credentials.walletName);
        root.profile.credentials.push(JSON.parse(walletClient.export()));
        root.setWalletClients();
        root.setAndStoreFocus(walletClient.credentials.walletId, function() {
          storageService.storeProfile(root.profile, function(err) {
            return cb(null, walletClient.credentials.walletId, walletClient.credentials.walletName, existed);
          });
        });
      });
    };

    //
    // Up to here was refectored.
    // ===============================================================================
    //

    root.signout = function() {
      root.profile = null;
      root.lastFocusedWallet = null;
    };

    return root;
  });
