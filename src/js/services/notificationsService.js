'use strict';
angular.module('copayApp.services')
  .factory('notificationService', function profileServiceFactory($filter, notification, lodash) {

    var root = {};

    var groupingTime = 2000;
    var lastNotificationOnWallet = {};

    root.getLast = function(walletId) {
      var last = lastNotificationOnWallet[walletId];
      if (!last) return null;

      return Date.now() - last.ts < groupingTime ? last : null;
    };

    root.storeLast = function(notificationData, walletId) {
      lastNotificationOnWallet[walletId] = {
        creatorId: notificationData.creatorId,
        type: notificationData.type,
        ts: Date.now(),
      };
    };

    root.shouldSkip = function(notificationData, last) {
      if (!last) return false;

      // rules...
      if (last.type === 'NewTxProposal' 
          && notificationData.type === 'TxProposalAcceptedBy')
        return true;

      if (last.type === 'TxProposalFinallyAccepted' 
          && notificationData.type === 'NewOutgoingTx')
        return true;

      if (last.type === 'TxProposalRejectedBy' 
          && notificationData.type === 'TxProposalFinallyRejected')
        return true;


      return false;
    };


    root.newBWCNotification = function(notificationData, walletId, walletName) {
      var last = root.getLast(walletId);
      root.storeLast(notificationData, walletId);

      if (root.shouldSkip(notificationData, last))
        return;

      switch (notificationData.type) {
        case 'NewTxProposal':
          notification.info('[' + walletName + '] New Transaction',
            $filter('translate')('You received a transaction proposal from') + ' ' + notificationData.creatorId);
          break;
        case 'TxProposalAcceptedBy':
          notification.success('[' + walletName + '] Transaction Signed',
            $filter('translate')('A transaction was signed by') + ' ' + notificationData.creatorId);
          break;
        case 'TxProposalRejectedBy':
          notification.warning('[' + walletName + '] Transaction Rejected',
            $filter('translate')('A transaction was rejected by') + ' ' + notificationData.creatorId);
          break;
        case 'TxProposalFinallyRejected':
          notification.success('[' + walletName + '] Transaction Rejected',
            $filter('translate')('A transaction was finally rejected'));
        case 'NewOutgoingTx':
          notification.success('[' + walletName + '] Transaction Sent',
            $filter('translate')('A transaction was broadcasted by') + ' ' + notificationData.creatorId);
          break;
        case 'NewIncomingTx':
          notification.success('[' + walletName + '] Funds Received',
            $filter('translate')('Received funds on address ') + notificationData.data.address);
          break;
        case 'ScanFinished':
          notification.success('[' + walletName + '] Scan Finished',
            $filter('translate')('Funds scanning has finished. Balance is updated.'));
          break;

        case 'NewCopayer':
          // No UX notification
          break;
      }
    };

    return root;
  });
