'use strict';


var _ = require('underscore');
var chai = chai || require('chai');
var should = chai.should();


var FakeBlockchain = requireMock('FakeBlockchain');
var FakeStorage = function FakeStorage() {};
var Identity = copay.Identity;
var Passphrase = copay.Passphrase;
var mockLocalStorage = requireMock('FakeLocalStorage');
var mockSessionStorage = requireMock('FakeLocalStorage');



var PERSISTED_PROPERTIES = (copay.Wallet || require('../js/models/Wallet')).PERSISTED_PROPERTIES;

function assertObjectEqual(a, b) {
  PERSISTED_PROPERTIES.forEach(function(k) {
    if (a[k] && b[k]) {
      _.omit(a[k], 'name').should.be.deep.equal(b[k], k + ' differs');
    }
  })
}


describe('Identity model', function() {
  var iden, storage, wallet, profile;

  beforeEach(function(done) {
    storage = sinon.stub();
    storage.getItem = sinon.stub();
    storage.setPassword = sinon.spy();
    storage.hasPassphrase = sinon.stub().returns(true);
    storage.getSessionId = sinon.spy();
    storage.setFromObj = sinon.spy();
    storage.deletePrefix = sinon.stub().yields(null);
    Identity._newStorage = sinon.stub().returns(storage);


    wallet = sinon.stub();
    wallet.store = sinon.stub().yields(null);
    wallet.getId = sinon.stub().returns('wid:123');
    Identity._newWallet = sinon.stub().returns(wallet);

    profile = sinon.stub();
    profile.addWallet = sinon.stub().yields(null);;
    profile.deleteWallet = sinon.stub().yields(null);;
    profile.listWallets = sinon.stub().returns([]);
    profile.setLastOpenedTs = sinon.stub().yields(null);;
    profile.store = sinon.stub().yields(null);;
    Identity._createProfile = sinon.stub().callsArgWith(3,null,profile);



    Identity.create(email, password, config, function(err,i){
      iden = i;
      done();
    });
  });


  afterEach(function() {
    iden = storage = wallet = profile = undefined;
  });


  var email = 'hola@hola.com';
  var password = 'password';

  var config = {
    walletDefaults: {
      requiredCopayers: 3,
      totalCopayers: 5,
      spendUnconfirmed: 1,
      reconnectDelay: 100,

    },
    blockchain: {
      host: 'test.insight.is',
      port: 80,
      schema: 'https'
    },
    networkName: 'testnet',
    passphrase: {
      iterations: 100,
      storageSalt: 'mjuBtGybi/4=',
    },

    // network layer config
    network: {
      testnet: {
        url: 'https://test-insight.bitpay.com:443'
      },
      livenet: {
        url: 'https://insight.bitpay.com:443'
      },
    },
    version: '0.0.1',
  };

  describe('#constructors', function() {
    describe('#new', function() {
      it('should create an identity', function() {
        var iden = new Identity(email, password, config);
        should.exist(iden);
        iden.walletDefaults.should.deep.equal(config.walletDefaults);
      });
    });

    describe('#create', function(done) {
      it('should call .store', function(done) {
        Identity.create(email, password, config, function(err, iden) {

          should.not.exist(err);
          should.exist(iden.profile.addWallet);

          Identity._createProfile.getCall(0).args[0].should.deep.equal(email);
          Identity._createProfile.getCall(0).args[1].should.deep.equal(password);
          done();
        });
      });
    });

    describe('#open', function(done) {
      beforeEach(function() {
        storage.getFirst = sinon.stub().yields('wallet1234');
        profile.listWallets = sinon.stub().returns([{id:'walletid'}]);
        Identity._openProfile = sinon.stub().callsArgWith(3, null, profile);
          Identity._walletRead = sinon.stub().callsArgWith(5, null, wallet);
      });

      it('should call ._openProfile', function(done) {
        Identity.open(email, password, config, function(err, iden, w) {
          Identity._openProfile.calledOnce.should.equal(true);
          should.not.exist(err);
          iden.profile.should.equal(profile);
          done();
        });
      });
    });
  });
  describe('#store', function() {

    it('should call .store from profile and no wallets', function(done) {
      profile.store = sinon.stub().yields(null);
      iden.wallets = [];
      iden.store({}, function(err) {
        should.not.exist(err);
        profile.store.calledOnce.should.equal(true);
        done();
      });
    });

    it('should call .store from profile and wallets (2)', function(done) {
      iden.profile.store = sinon.stub().yields(null);
      iden.openWallets = [{
        store: sinon.stub().yields(null)
      }, {
        store: sinon.stub().yields(null)
      }];
      iden.store({}, function(err) {
        should.not.exist(err);
        iden.profile.store.calledOnce.should.equal(true);
        iden.openWallets[0].store.calledOnce.should.equal(true);
        iden.openWallets[1].store.calledOnce.should.equal(true);
        done();
      });
    });
  });

  describe('#createWallet', function() {
    it('should create wallet', function(done) {
      iden.createWallet(null, function(err, w) {
        should.exist(w);
        should.not.exist(err);
        done();
      });
    });

    it('should add wallet to profile', function(done) {
      iden.createWallet(null, function(err, w) {
        profile.addWallet.getCall(0).args[0].should.contain('wid:123');
        done();
      });
    });


    it('should be able to create wallets with given pk', function(done) {
      var priv = 'tprv8ZgxMBicQKsPdEqHcA7RjJTayxA3gSSqeRTttS1JjVbgmNDZdSk9EHZK5pc52GY5xFmwcakmUeKWUDzGoMLGAhrfr5b3MovMUZUTPqisL2m';
      iden.createWallet({
        privateKeyHex: priv,
      }, function(err, w) {
        Identity._newWallet.getCall(1).args[0].privateKey.toObj().extendedPrivateKeyString.should.equal(priv);
        should.not.exist(err);
        done();
      });
    });

    it('should be able to create wallets with random pk', function(done) {
      iden.createWallet(null, function(err, w1) {
        iden.createWallet(null, function(err, w2) {
          Identity._newWallet.getCall(0).args[0].privateKey.toObj().extendedPrivateKeyString.should.not.equal(
            Identity._newWallet.getCall(1).args[0].privateKey.toObj().extendedPrivateKeyString
          );
          done();
        });
      });
    });
  });


  describe('#deleteWallet', function() {
    it('should call profile and wallet', function(done) {
      iden.createWallet(null, function(err, w) {
        iden.deleteWallet(w.id, function(err) {
          should.not.exist(err);
          done();
        });
      });
    });
  });


  describe('#openWallet', function() {

    beforeEach(function() {
      iden.migrateWallet = sinon.stub().yields(null);
      storage.setPassword = sinon.spy();
      storage.getFirst = sinon.stub().yields('wallet1234');

      var wallet = sinon.stub();
      wallet.store = sinon.stub().yields(null);

      Identity._walletRead = sinon.stub().callsArgWith(5, null, wallet);
    });

    it('should return wallet and call .store, .setLastOpenedTs & .migrateWallet', function(done) {

      iden.openWallet('dummy', function(err, w) {
        should.not.exist(err);
        w.store.calledOnce.should.equal(true);
        iden.profile.setLastOpenedTs.calledTwice.should.equal(true);
        // iden.migrateWallet.calledOnce.should.equal(true);
        done();
      });
    });
  });



  describe('#importWallet', function() {

    beforeEach(function() {
      iden.migrateWallet = sinon.stub().yields(null);
    });

    it('should create wallet from encrypted object', function(done) {
      iden.storage.setPassphrase = sinon.spy();
      iden.storage.decrypt = sinon.stub().withArgs('base64').returns({
        networkName: 'testnet'
      });

      wallet.getId = sinon.stub().returns('ID123');
      Identity._walletFromObj = sinon.stub().returns(wallet);

      iden.importWallet("encrypted object", "xxx", [], function(err) {
        iden.openWallet('ID123', function(err, w) {
          should.not.exist(err);
          should.exist(w);
          done();
        });
      });
    });


    it('should import and update indexes', function() {
      var wallet = {
        id: "fake wallet",
        updateIndexes: function(cb) {
          cb();
        }
      };
      iden.fromEncryptedObj = sinon.stub().returns(wallet);

      var w = iden.fromEncryptedObj("encrypted", "password");

      should.exist(w);
      wallet.should.equal(w);
    });
    it('should import with a wrong password', function() {
      iden.fromEncryptedObj = sinon.stub().returns(null);
      var w = iden.fromEncryptedObj("encrypted", "passwordasdfasdf");
      should.not.exist(w);
    });
  });

  describe('#listWallets', function() {
    it('should return empty array if no wallets', function() {
      iden.listWallets();
      iden.profile.listWallets.calledOnce.should.equal(true);
    });
  });


  describe('#deleteWallet', function() {
    Identity._walletDelete = sinon.stub().callsArgWith(2, null);

    it('should call Profile deleteWallet', function(done) {
      iden.profile.deleteWallet = sinon.stub().yields(null);
      iden.deleteWallet('xxx', function() {
        iden.profile.deleteWallet.getCall(0).args[0].should.equal('xxx');
        done();
      });
    });
  });

  describe('#joinWallet', function() {
    var opts = {
      secret: '8WtTuiFTkhP5ao7AF2QErSwV39Cbur6pdMebKzQXFqL59RscXM',
      nickname: 'test',
      password: 'pass'
    };

    it('should yield bad network error', function(done) {
      var net = sinon.stub();

      net.greet = sinon.stub();
      net.cleanUp = sinon.stub();
      net.start = sinon.stub().yields(null);
      net.on = sinon.stub();
      net.on.withArgs('data').yields('senderId', {
        type: 'walletId',
        networkName: 'aWeirdNetworkName',
        opts: {},
      });
      Identity._newAsync = function() { return net; };

      opts.privHex = undefined;
      iden.joinWallet(opts, function(err, w) {
        err.should.equal('badNetwork');
        done();
      });
    });


    it('should yield to join error', function(done) {
      opts.privHex = undefined;
      var net = sinon.stub();
      net.greet = sinon.stub();
      net.cleanUp = sinon.stub();
      net.start = sinon.stub().yields(null);

      net.on = sinon.stub();
      net.on.withArgs('serverError').yields(null);
      net.on.withArgs('data').yields('senderId', {
        type: 'walletId',
        networkName: iden.networkName,
      });
      Identity._newAsync = function() { return net; };

      iden.joinWallet(opts, function(err, w) {
        err.should.equal('joinError');
        done();
      });
    });


    it('should call network.start / create', function(done) {
      opts.privHex = undefined;
      var net = sinon.stub();
      net.cleanUp = sinon.spy();
      net.greet = sinon.spy();
      net.start = sinon.stub().yields(null);

      net.on = sinon.stub();
      net.on.withArgs('connected').yields(null);
      net.on.withArgs('data').yields('senderId', {
        type: 'walletId',
        networkName: 'testnet',
        opts: {},
      });
      Identity._newAsync = function() { return net; };

      var w = sinon.stub();
      w.sendWalletReady = sinon.spy();
      iden.createWallet = sinon.stub().yields(null, w);
      iden.joinWallet(opts, function(err, w) {
        net.start.calledOnce.should.equal(true);
        iden.createWallet.calledOnce.should.equal(true);
        iden.createWallet.calledOnce.should.equal(true);

        w.sendWalletReady.calledOnce.should.equal(true);
        w.sendWalletReady.getCall(0).args[0].should.equal('03ddbc4711534bc62ccf576ab05f2a0afd11f9e2f4016781f3f5a88de9543a229a');
        done();
      });
    });

    it('should return walletFull', function(done) {
      opts.privHex = undefined;
      var net = sinon.stub();
      net.cleanUp = sinon.spy();
      net.greet = sinon.spy();
      net.start = sinon.stub().yields(null);

      net.on = sinon.stub();
      net.on.withArgs('connected').yields(null);
      net.on.withArgs('data').yields('senderId', {
        type: 'walletId',
        networkName: 'testnet',
        opts: {},
      });
      Identity._newAsync = function() { return net; };
      iden.createWallet = sinon.stub().yields(null, null);
      iden.joinWallet(opts, function(err, w) {
        err.should.equal('walletFull');
        done();
      });
    });

    it('should accept a priv key a input', function() {
      opts.privHex = 'tprv8ZgxMBicQKsPf7MCvCjnhnr4uiR2Z2gyNC27vgd9KUu98F9mM1tbaRrWMyddVju36GxLbeyntuSadBAttriwGGMWUkRgVmUUCg5nFioGZsd';
      var net = sinon.stub();
      Identity._newAsync = function() { return net; };
      net.on = sinon.stub();

      net.cleanUp = sinon.spy();
      net.start = sinon.spy();
      iden.joinWallet(opts, function(err, w) {
        net.start.getCall(0).args[0].privkey.should.equal('ddc2fa8c583a73c4b2a24630ec7c283df4e7c230a02c4e48bc36ec61687afd7d');
      });
    });
    it('should call network.start with private key', function() {
      opts.privHex = undefined;
      var net = sinon.stub();
      net.cleanUp = sinon.spy();
      net.on = sinon.stub();
      net.start = sinon.spy();
      Identity._newAsync = function() { return net; };
      iden.joinWallet(opts, function(err, w) {
        net.start.getCall(0).args[0].privkey.length.should.equal(64); //privkey is hex of private key buffer
      });
    });
  });
});


