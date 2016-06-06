var url = require('url'),
    querystring = require('querystring'),
    http = require('http'),
    https = require('https'),
    util = require('util');

function configuration (issuer, cb) {
  var parsed = url.parse(issuer),
      path,
      headers = {};

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
  var req;
  if(ISSUER.indexOf("https") > -1){
    req = https.request(options, discoveryResponse);
  }
  else{
    req = http.request(options, discoveryResponse);
  }
  function discoveryResponse(res) {
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
        config.scopes_supported = json.scopes_supported;
        config._raw = json;
        cb(null, config);
      } catch(ex) {
        return cb(ex);
      }
    });
  }

  req.on('error', function(err) {
    cb(err);
  });
  req.end();
}

exports.configuration = configuration;
