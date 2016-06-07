var expect = require("chai").expect;
var miracl = require("../lib/index.js");

describe('hooks', function() {
  beforeEach(function() {
    miracl = newMiraclClient({
      clientID: "MOCK_CLIENT",
      clientSecret: "MOCK_SECRET",
      callbackURL: "http://empty"
    });
  });
});
describe("MiraclClient#getAuthorizationRequestUrl", function(){

});
