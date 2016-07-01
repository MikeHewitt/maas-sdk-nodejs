var expect = require("chai").expect;
var simple = require('simple-mock');
var miraclClient = require("../lib/maas-sdk-nodejs");
var miraclError = require("../lib/maas-sdk-nodejs");

describe("MiraclClient", function() {
  afterEach(function() {
    simple.restore();
  });

  var credentials = {
    clientID: "MOCK_CLIENT",
    clientSecret: "MOCK_SECRET",
    redirectURL: "http://empty"
  };

  it("returns openid configuration", function(done) {
    var miracl = new miraclClient(credentials, function (err, config){
      expect(config).to.not.be.empty;
      done();
    });
  });

  describe("#getAuthorizationRequestUrl", function(){
    it("returns valid auth url", function(done) {
      var session = {};
    var miracl = new miraclClient(credentials, function (){
        var url = miracl.getAuthorizationRequestUrl(session);
        expect(url).to.contain("MOCK_CLIENT");
        expect(url).to.contain("empty");
        done();
      });
    });

    it("saves state and nonce in session", function(done) {
      var session = {};
      var miracl = new miraclClient(credentials, function (){
        miracl.getAuthorizationRequestUrl(session);
        expect(session.miraclState).to.not.be.empty;
        expect(session.miraclNonce).to.not.be.empty;
        done();
      });
    });
  });

  describe("#validateAuthorization", function(){
    it("returns MiraclError if code or state are missing", function(done) {
      params = {code: "", state: "MOCK_STATE"};
      session = { miraclState: "MOCK_STATE"};
      var miracl = new miraclClient(credentials, function (){
        miracl.validateAuthorization(params, session, function(err) {
          expect(err.name).to.equal("MiraclError");
          expect(err.message).to.contain("Code or state missing");
          done();
        });
      });
    });

    it("returns MiraclError if session state differs from state in response", function(done) {
      params = {code: "MOCK_CODE", state: "MOCK_STATE"};
      session = { miraclState: "DIFFERENT_STATE"};
      var miracl = new miraclClient(credentials, function (){
        miracl.validateAuthorization(params, session, function(err) {
          expect(err.name).to.equal("MiraclError");
          expect(err.message).to.contain("Session state differs from response state");
          done();
        });
      });
    });

    it("returns access token when query string and session are valid", function(done) {
      params = {code: "MOCK_CODE", state: "MOCK_STATE"};
      session = { miraclState: "MOCK_STATE"};
      simple.mock(miraclClient.prototype, '_getTokenAndUserinfo').callbackWith(null, 'ACCESS_TOKEN');
      var miracl = new miraclClient(credentials, function (){
        miracl.validateAuthorization(params, session, function(err, accessToken) {
          expect(accessToken).to.equal("ACCESS_TOKEN");
          done();
        });
      });
    });
  });

  describe("#isAuthorized", function() {
    it("returns when access token in session", function(done) {
      session = { miraclToken: "ACCESS_TOKEN" }
      var miracl = new miraclClient(credentials, function (){
        expect(miracl.isAuthorized(session)).to.equal("ACCESS_TOKEN");
        done();
      });
    });

    it("returns false when access token not in session", function(done) {
      session = {};
      var miracl = new miraclClient(credentials, function (){
        expect(miracl.isAuthorized(session)).to.equal(false);
        done();
      });
    });
  });

  describe("#getEmail", function() {
    it("returns email if userinfo in session", function(done) {
      session = { miraclUserinfo: { email: "MOCK_EMAIL"} };
      var miracl = new miraclClient(credentials, function (){
        miracl.getEmail(session, function(err, email) {
          expect(email).to.equal("MOCK_EMAIL");
          done();
        });
      });
    });

    it("returns email if userinfo not in session", function(done) {
      session = {};
      simple.mock(miraclClient.prototype, '_getTokenAndUserinfo')
        .callFn( function() {
          session.miraclUserinfo = { email: "MOCK_EMAIL" };
          cb(null, { email: MOCK_EMAIL} );
        });
      var miracl = new miraclClient(credentials, function (){
        miracl.getEmail(session, function(err, email) {
          expect(email).to.equal("MOCK_EMAIL");
          done();
        });
      });
    });
  });

  describe("#getUserID", function() {
    it("returns UserID if userinfo in session", function(done) {
      session = { miraclUserinfo: { sub: "MOCK_USER_ID"} };
      var miracl = new miraclClient(credentials, function (){
        miracl.getUserID(session, function(err, sub) {
          expect(sub).to.equal("MOCK_USER_ID");
          done();
        });
      });
    });

    it("returns UserID if userinfo not in session", function(done) {
      session = {};
      simple.mock(miraclClient.prototype, '_getTokenAndUserinfo')
        .callFn( function() {
          session.miraclUserinfo = { sub: "MOCK_USER_ID" };
          cb(null, { sub: MOCK_USER_ID} );
        });
      var miracl = new miraclClient(credentials, function (){
        miracl.getUserID(session, function(err, sub) {
          expect(sub).to.equal("MOCK_USER_ID");
          done();
        });
      });
    });
  });

  describe("clearUserInfo", function() {
    it("clears only state, nonce and userinfo when second argument not passed", function(done) {
      session = { miraclState: "MOCK_STATE",
                  miraclNonce: "MOCK_NONCE",
                  miraclUserinfo: { email: "MOCK_EMAIL"},
                  miraclToken: "MOCK_TOKEN" }
      var miracl = new miraclClient(credentials, function (){
        miracl.clearUserInfo(session);
        expect(session.miraclState.length).to.equal(0);
        expect(session.miraclNonce.length).to.equal(0);
        expect(session.miraclUserinfo.length).to.equal(0);
        expect(session.miraclToken).to.equal("MOCK_TOKEN");
        done();
      });
    });

    it("clears every miracl variable in session when true is passed", function(done) {
      session = { miraclState: "MOCK_STATE",
                  miraclNonce: "MOCK_NONCE",
                  miraclUserinfo: { email: "MOCK_EMAIL"},
                  miraclToken: "MOCK_TOKEN" }
      var miracl = new miraclClient(credentials, function (){
        miracl.clearUserInfo(session, true);
        expect(session.miraclState.length).to.equal(0);
        expect(session.miraclNonce.length).to.equal(0);
        expect(session.miraclUserinfo.length).to.equal(0);
        expect(session.miraclToken.length).to.equal(0);
        done();
      });
    });
  });

});
