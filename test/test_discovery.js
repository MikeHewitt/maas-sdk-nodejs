var expect = require("chai").expect;
var isHttpsUrl = require("../lib/discovery").isHttpsUrl;

describe("discovery", function() {
  describe("#isHttpsUrl", function() {
    it("operates correctly", function() {
        expect(isHttpsUrl(null)).to.equal(false);
        expect(isHttpsUrl("")).to.equal(false);
        expect(isHttpsUrl("a")).to.equal(false);
        expect(isHttpsUrl("http://https.com")).to.equal(false);
        expect(isHttpsUrl("https://http.com")).to.equal(true);
        expect(isHttpsUrl("http://www.a.com/test")).to.equal(false);
        expect(isHttpsUrl("https://www.a.com/test")).to.equal(true);
        expect(isHttpsUrl("http://www.a.com/https/")).to.equal(false);
        expect(isHttpsUrl("https://www.a.com/http/")).to.equal(true);
    });
  });
});
