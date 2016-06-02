var url = require('url'),
    configuration = require('./configuration').configuration,
    crypto = require('crypto'),
    querystring= require('querystring');

ISSUER = "https://api.dev.miracl.net";//needs to be without slash at the end

function MiraclClient(options, cb) {
  self = this;
  this.options = options;
  configuration(ISSUER, function(err, config) {
    if(!err){
      self.config = config;
      cb(null, self.config);
    }
    else{
      console.log(err);
    }
  });
}

MiraclClient.prototype.get_authorization_request_url = function() {
    var params = {};
    params['response_type'] = 'code';
    params['client_id'] = this.options.clientID;
    params['redirect_uri'] = this.options.callbackURL;
    var scope = this.config.scopes_supported;
    if (Array.isArray(scope)) { scope = this.config.scopes_supported.join(' '); }
    if (scope) {
      params.scope = scope;
    } else {
      params.scope = 'openid';
    }
    var state = crypto.randomBytes(16).toString('hex');
    if (state) { params.state = state; }
    return this.config.authorizationURL + '?' + querystring.stringify(params);

  }



module.exports = MiraclClient;
//exports.MiraclClient;
