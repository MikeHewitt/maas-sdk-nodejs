var url = require('url');
var querystring = require('querystring');
var http = require('http');
var https = require('https');
var util = require('util');

/**
  * Is the given string an HTTPS url?
  *
  * @name discovery
  * @method
  * @param {String} The URL.
*/
function isHttpsUrl(url) {
  return new RegExp("^https[:]//", "i").test(url);
}

/**
  * Make request to issuer endpoint for config data
  *
  * @example
  * var configuration = require('./discovery').discovery;
  * configuration(issuer, function(error, config) {
  *  if(!error) {
  *    self.config = config;
  *    callback(null, self.config);
  *  } else {
  *    callback(new MiraclError(messages.invalid_issuer, error));
  *  }
  * });
  *
  * @name discovery
  * @method
  * @param {String} issuer OpenID issuer
  * @param {Function} callback Callback function, returns error on unsuccessful request or config object otherwise
*/
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

  // Perform http or https request according to provided issuer string
  if(isHttpsUrl(issuer)) {
    req = https.request(options, discoveryResponse);
  } else {
    req = http.request(options, discoveryResponse);
  }

  // Callback function for http/https request
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
      // Parse returned json, return callback with exception if json invalid and parsing failed
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
exports.isHttpsUrl = isHttpsUrl;
