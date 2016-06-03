var url = require('url'),
    configuration = require('./configuration').configuration,
    crypto = require('crypto'),
    querystring= require('querystring'),
    OAuth2 = require('oauth_authorization').OAuth2;

ISSUER = "https://api.dev.miracl.net";//needs to be without slash at the end
SESSION_MIRACL_TOKEN_KEY = "miraclToken"
SESSION_MIRACL_NONCE_KEY = "miraclNonce"
SESSION_MIRACL_STATE_KEY = "miraclState"
SESSION_MIRACL_REFRESH_KEY = "miraclRefreshToken"
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
      console.log(err);
      // TODO: add exception here
    }
  });
}

// TODO: pass session through parameter
MiraclClient.prototype.getAuthorizationRequestUrl = function(session) {
  var params = {};
  params['response_type'] = 'code';
  params['client_id'] = this.options.clientID;
  params['redirect_uri'] = this.options.callbackURL;
  var scope = this.config.scopes_supported;
  if (Array.isArray(scope)) { scope = this.config.scopes_supported.join(' '); }
  if (scope) {
    params.scope = scope;
    // TODO: check whether opeind is included
  } else {
    params.scope = 'openid';
  }
  var state = crypto.randomBytes(16).toString('hex');
  session[SESSION_MIRACL_STATE_KEY] = state;
  console.log("generated state: " + state);
  // TODO: send nonce as well
  if (state) { params.state = state; }
  return this.config.authorizationURL + '?' + querystring.stringify(params);
}

// TODO: pass session through parameter
MiraclClient.prototype.validateAuthorization = function(params, session, cb) {
  if(!params.code || !params.state) return false;
  // TODO: raise exception if states differ

  if(session[SESSION_MIRACL_STATE_KEY] !== params.state)console.error("States differ!");
  // console.log(params.state);
  var code = params.code;
  this._getTokenAndUserinfo(code, 'authorization_code', session, cb);
}

MiraclClient.prototype.isAuthorized = function(session) {
  return session[SESSION_MIRACL_TOKEN_KEY];
}

MiraclClient.prototype.getEmail = function(session, cb) {
  var accessToken = session[SESSION_MIRACL_TOKEN_KEY];
  console.log("2");
  if(session[SESSION_MIRACL_USERINFO_KEY]){
    console.log("this");
    cb(null, session[SESSION_MIRACL_USERINFO_KEY].sub);
  }
  else{
    console.log("3");
    debugger;
    var refreshToken = session[SESSION_MIRACL_REFRESH_KEY];
    this._getTokenAndUserinfo(refreshToken, 'refresh_token', session, function(){
      cb(null, session[SESSION_MIRACL_USERINFO_KEY].sub);
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
  oauth2.getOAuthAccessToken(code, { grant_type: grantType,
                                     redirect_uri: this.options.callbackURL },
                                     function(err, accessToken, refreshToken, params) {
     console.log(err);
      if (err) { return self.error(new InternalOAuthError('failed to obtain access token', err)); }
      var idToken = params['id_token'];
      if (!idToken) { return self.error(new Error('ID Token not present in token response')); }
      // console.log("AT: " + accessToken);
      // console.log("RT: " + refreshToken);
      var idTokenSegments = idToken.split('.')
        , jwtClaimsStr
        , jwtClaims;

      // TODO: Try catch this to trap JSON parse errors. not mine todo
      try {
        jwtClaimsStr = new Buffer(idTokenSegments[1], 'base64').toString();
        jwtClaims = JSON.parse(jwtClaimsStr);
      } catch (ex) {
        return self.error(ex);
      }

      // console.log(jwtClaims); // {exp, sub, iss, aud, iat, acr, amr}


      var iss = jwtClaims.iss;
      var sub = jwtClaims.sub;
      session[SESSION_MIRACL_USERINFO_KEY] = jwtClaims;
      session[SESSION_MIRACL_TOKEN_KEY] = accessToken;
      session[SESSION_MIRACL_REFRESH_KEY] = refreshToken;
      cb(null, accessToken);
      // TODO: save accesstoken, refreshToken? and userinfo in session
  });
}




module.exports = MiraclClient;
//exports.MiraclClient;
