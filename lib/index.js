var url = require('url'),
    configuration = require('./configuration').configuration,
    crypto = require('crypto'),
    querystring= require('querystring'),
    OAuth2 = require('oauth_authorization').OAuth2;

ISSUER = "https://api.dev.miracl.net";//needs to be without slash at the end
SESSION_MIRACL_TOKEN_KEY = "miraclToken"
SESSION_MIRACL_NONCE_KEY = "miraclNonce"
SESSION_MIRACL_STATE_KEY = "miraclState"
SESSION_MIRACL_USERINFO_KEY = "miraclUserinfo"


function MiraclClient(options, cb) {
  self = this;
  this.options = options;
  configuration(ISSUER, function(err, config) {
    if(!err){
      self.config = config;
      cb(null, self.config);
    }
    else{
      cb(new MiraclError("Invalid ISSUER", err));
    }
  });
}

MiraclClient.prototype.getAuthorizationRequestUrl = function(session) {
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
  function generateRandomString() {
    return crypto.randomBytes(16).toString('hex');
  }
  if (session[SESSION_MIRACL_STATE_KEY] === undefined || session[SESSION_MIRACL_STATE_KEY].length == 0)
    session[SESSION_MIRACL_STATE_KEY] = generateRandomString();
  // session[SESSION_MIRACL_STATE_KEY] = generateRandomString(); //for errors
  // session[SESSION_MIRACL_NONCE_KEY] = generateRandomString();
  if (session[SESSION_MIRACL_NONCE_KEY] === undefined || session[SESSION_MIRACL_NONCE_KEY].length == 0)
    session[SESSION_MIRACL_NONCE_KEY] = generateRandomString();
  params.state = session[SESSION_MIRACL_STATE_KEY];
  params.nonce = session[SESSION_MIRACL_NONCE_KEY];
  return this.config.authorizationURL + '?' + querystring.stringify(params);
}

MiraclClient.prototype.validateAuthorization = function(params, session, cb) {
  if(!params.code || !params.state) return cb(new MiraclError("Code or state missing in response"));
  if(session[SESSION_MIRACL_STATE_KEY] !== params.state){
    return cb(new MiraclError("Session state differs from response state"));
  }
  var code = params.code;
  delete session[SESSION_MIRACL_STATE_KEY];
  delete session[SESSION_MIRACL_NONCE_KEY];
  this._getTokenAndUserinfo(code, 'authorization_code', session, cb);
}

MiraclClient.prototype.isAuthorized = function(session) {
  return session[SESSION_MIRACL_TOKEN_KEY];
}

MiraclClient.prototype.getEmail = function(session, cb) {
  var accessToken = session[SESSION_MIRACL_TOKEN_KEY];
  if(session[SESSION_MIRACL_USERINFO_KEY]){
    if(!session[SESSION_MIRACL_USERINFO_KEY].email)cb(null, 'None');
    else cb(null, session[SESSION_MIRACL_USERINFO_KEY].email);
  }
  else{
    this._getTokenAndUserinfo(accessToken, 'refresh', session, function(err, userinfo){
      if(err) return cb(err);
      if(!session[SESSION_MIRACL_USERINFO_KEY].email)cb(null, 'None');
      else cb(null, session[SESSION_MIRACL_USERINFO_KEY].email);
    });
  }
}

MiraclClient.prototype.getUserID = function(session, cb){
var accessToken = session[SESSION_MIRACL_TOKEN_KEY];
if(session[SESSION_MIRACL_USERINFO_KEY]){
  if(!session[SESSION_MIRACL_USERINFO_KEY].sub)cb(null, 'None');
  else cb(null, session[SESSION_MIRACL_USERINFO_KEY].sub);
}
else{
  this._getTokenAndUserinfo(accessToken, 'refresh', session, function(err, userinfo){
    if(err) return cb(err);
    if(!session[SESSION_MIRACL_USERINFO_KEY].sub)cb(null, 'None');
    else cb(null, session[SESSION_MIRACL_USERINFO_KEY].sub);
  });
}
}

MiraclClient.prototype.clearUserInfo = function(session, includingAuth) {
  includingAuth = typeof includingAuth !== 'undefined' ? includingAuth : false;
  if(includingAuth)session[SESSION_MIRACL_TOKEN_KEY] = "";
  session[SESSION_MIRACL_STATE_KEY] = "";
  session[SESSION_MIRACL_NONCE_KEY] = "";
  session[SESSION_MIRACL_USERINFO_KEY] = "";
  return true;
}

MiraclClient.prototype._getTokenAndUserinfo = function(code, grantType, session, cb) {
  var oauth2 = new OAuth2(this.options.clientID,  this.options.clientSecret,
                          '', this.config.authorizationURL, this.config.tokenURL);

  if(grantType === 'refresh'){
    oauth2._request("GET", this.config.userInfoURL,
                    { 'Authorization': "Bearer " + code, 'Accept': "application/json" },
                    null, null,
                    function (err, body, res) {
                      if(err){return cb(new MiraclError("Access token request failed", err.data))}
                      try {
                        var json = JSON.parse(body);
                        session[SESSION_MIRACL_USERINFO_KEY] = json;
                        cb(null, session[SESSION_MIRACL_USERINFO_KEY]);
                      } catch(ex) {
                        return cb(new MiraclError("Access token invalid, JSON parsing failed"),ex);
                      }
                    });
  } else {
    oauth2.getOAuthAccessToken(code, { grant_type: 'authorization_code',
                                       redirect_uri: this.options.callbackURL },
                                       function(err, accessToken, refreshToken, params) {
        if(err){return cb(new MiraclError("Access token request failed", err.data))}
        var idToken = params['id_token'];
        if (!idToken) { return self.error(new Error('ID Token not present in token response')); }
        var idTokenSegments = idToken.split('.')
        , jwtClaimsStr
        , jwtClaims;
        try {
          jwtClaimsStr = new Buffer(idTokenSegments[1], 'base64').toString();
          jwtClaims = JSON.parse(jwtClaimsStr);
        } catch (ex) {
          return cb(new MiraclError("Access token invalid, JSON parsing failed"),ex);
        }

        var iss = jwtClaims.iss;
        var sub = jwtClaims.sub;
        session[SESSION_MIRACL_USERINFO_KEY] = jwtClaims;
        session[SESSION_MIRACL_TOKEN_KEY] = accessToken;
        cb(null, accessToken);
    });
  }
}

function MiraclError(message, err){
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.name = 'MiraclError';
  this.message = message;
  this.error = err;
  var message = this.error ?
                this.message + ", original error: " + this.error :
                this.message;
  return message;
};

MiraclError.prototype.toString = function() {
  var message = this.error ?
                this.message + ", original error: " + this.error :
                this.message;
  return message;
}

module.exports = MiraclClient;
