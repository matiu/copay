'use strict';

angular.module('copayApp.controllers').controller('preferencesColorController',
  function($scope, configService, profileService, go) {
    var config = configService.getSync();
    this.colorOpts = [
      '#1ABC9C',
      '#4A1ABC',
      '#BC1A3B',
      '#8CBC1A',
      '#666666',
      '#000000',
    ];

    var fc = profileService.focusedClient;
    var walletId = fc.credentials.walletId;

    var config = configService.getSync();
    config.colorFor = config.colorFor || {};
    this.color = config.colorFor[walletId] || '#1ABC9C';

    this.save = function(color) {
      var self = this;
      var opts = {
        colorFor: {}
      };
      opts.colorFor[walletId] = color;

      configService.set(opts, function(err) {
        if (err) console.log(err);
        self.color = color;
        $scope.$emit('Local/ColorUpdated');
      });

    };
  });
