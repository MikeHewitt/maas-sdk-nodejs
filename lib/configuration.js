
var url = require('url'),
    querystring = require('querystring'),
    http = require('http'),
    https = require('https'),
    util = require('util');

function configuration (issuer, cb) {
  debugger;
  var parsed = url.parse(issuer),
      path,
      headers = {};

  path = parsed.pathname;
  path += '.well-known/openid-configuration';
  console.log(path); //to be removed

  headers['Host'] = parsed.host;
  headers['Accept'] = 'application/json';

  var options = {
    host: parsed.hostname,
    port: parsed.port,
    path: path,
    method: 'GET',
    headers: headers
  };

  var req = http.request(options, function(res) { // TODO: add option for https
    var data = '';

    res.on('data', function(chunk) {
      data += chunk;
    });
    res.on('end', function() {
      if (res.statusCode !== 200) {
        return cb(new Error("OpenID provider configuration request failed: " + res.statusCode));
      }

      var config = {};
      try {
        var json = JSON.parse(data);

        config.issuer = json.issuer;
        config.authorizationURL = json.authorization_endpoint;
        config.tokenURL = json.token_endpoint;
        config.userInfoURL = json.userinfo_endpoint;
        //config.registrationURL = json.registration_endpoint; //not required for mpin
        config._raw = json;

        cb(null, config);
      } catch(ex) {
        return cb(ex);
      }
    });
  });
  req.on('error', function(err) {
    cb(err);
  });
  req.end();
}

exports.configuration = configuration;
