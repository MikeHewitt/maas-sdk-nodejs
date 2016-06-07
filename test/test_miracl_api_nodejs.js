var expect = require("chai").expect;
var miraclClient = require("../lib/index.js");
var miraclError = require("../lib/index.js");

describe("hooks", function() {
  before(function() {

  });
});

describe("MiraclClient", function() {
  var credentials = {
    clientID: "MOCK_CLIENT",
    clientSecret: "MOCK_SECRET",
    callbackURL: "http://empty"
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
  });

});
