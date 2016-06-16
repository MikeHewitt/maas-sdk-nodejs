var url = require('url');
var querystring = require('querystring');
var http = require('http');
var https = require('https');
var util = require('util');

function discovery (issuer, callback) {
  var parsed = url.parse(issuer);
  var path;
  var headers = {};
  var req;

  path = parsed.pathname;
  path += '.well-known/openid-configuration';

  headers['Host'] = parsed.host;
  headers['Accept'] = 'application/json';

  var options = {
    host: parsed.hostname,
    port: parsed.port,
    path: path,
    method: 'GET',
    headers: headers
  };

  if(issuer.indexOf("https") > -1) {
    req = https.request(options, discoveryResponse);
  } else {
    req = http.request(options, discoveryResponse);
  }

  function discoveryResponse(res) {
    var data = '';

    res.on('data', function(chunk) {
      data += chunk;
    });

    res.on('end', function() {
      if (res.statusCode !== 200) {
        return callback(new Error("OpenID provider configuration request failed: " + res.statusCode));
      }

      var config = {};
      try {
        var json = JSON.parse(data);
        config.issuer = json.issuer;
        config.authorizationURL = json.authorization_endpoint;
        config.tokenURL = json.token_endpoint;
        config.userInfoURL = json.userinfo_endpoint;
        config.scopes_supported = json.scopes_supported;
        config._raw = json;

        callback(null, config);
      } catch(exception) {
        return callback(exception);
      }
    });
  }

  req.on('error', function(error) {
    callback(error);
  });
  req.end();
}

exports.discovery = discovery;
