'use strict';
angular.module('copayApp.services')
  .factory('backupService', function backupServiceFactory($log, $timeout, notification, profileService, sjcl) {

    var root = {};

    var _download = function(ew, filename) {
      var NewBlob = function(data, datatype) {
        var out;

        try {
          out = new Blob([data], {
            type: datatype
          });
          $log.debug("case 1");
        } catch (e) {
          window.BlobBuilder = window.BlobBuilder ||
            window.WebKitBlobBuilder ||
            window.MozBlobBuilder ||
            window.MSBlobBuilder;

          if (e.name == 'TypeError' && window.BlobBuilder) {
            var bb = new BlobBuilder();
            bb.append(data);
            out = bb.getBlob(datatype);
            $log.debug("case 2");
          } else if (e.name == "InvalidStateError") {
            // InvalidStateError (tested on FF13 WinXP)
            out = new Blob([data], {
              type: datatype
            });
            $log.debug("case 3");
          } else {
            // We're screwed, blob constructor unsupported entirely   
            $log.debug("Errore");
          }
        }
        return out;
      };

      var a = document.createElement("a");
      document.body.appendChild(a);
      a.style = "display: none";

      var blob = new NewBlob(ew, 'text/plain;charset=utf-8');
      var url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = filename;
      a.click();
      $timeout(function() {
        window.URL.revokeObjectURL(url);
      }, 250);
      notification.success('Backup created', 'Encrypted backup file saved');
    };

    root.walletExport = function(password) {
      if (!password) {
        notification.error('Backup needs a password');
        throw ('Needs password');
      }
      var fc = profileService.focusedClient;
      try {
        var b = fc.export({});
        var e = sjcl.encrypt(password, b, {
          iter: 10000
        });
        return e;
      } catch (err) {
        $log.debug('Error exporting wallet: ', err);
      };
    };

    root.walletDownload = function(password) {
      var fc = profileService.focusedClient;
      var ew = root.walletExport(password);
      var walletName = fc.credentials.walletName;
      var filename = walletName + '-Copaybackup.aes.json';
      _download(ew, filename)
    };
    return root;
  });
