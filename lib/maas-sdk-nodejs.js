var url = require('url');
var configuration = require('./discovery').discovery;
var crypto = require('crypto');
var querystring= require('querystring');
var OAuth2 = require('oauth_authorization').OAuth2;
var issuer = require('./config').issuer;
var messages = require('./messages').messages;

var SESSION_MIRACL_TOKEN_KEY = "miraclToken";
var SESSION_MIRACL_NONCE_KEY = "miraclNonce";
var SESSION_MIRACL_STATE_KEY = "miraclState";
var SESSION_MIRACL_USERINFO_KEY = "miraclUserinfo";

/**
  * MiraclClient constructor
  *
  * @example
  * var miraclClient = require('maas-sdk-nodejs');
  * var miracl = new MiraclClient(
  *  {clientID: "CLIENT_ID",
  *  clientSecret: "CLIENT_SECRET",
  *  callbackURL: "REDIRECT_URI",
  *  issuer: "http://sample"},
  *  cbFunction(error, config) {}
  * );
  *
  * @class MiraclClient
  * @param {Object} options Configuration options
  * @param {Function} cb Callback function
  * @throws {MiraclError} If ISSUER is not valid
*/
function MiraclClient(options, callback) {
  var self = this;
  this.options = options;

  if(options.issuer) {
    issuer = options.issuer;
  }
  configuration(issuer, function(error, config) {
    if(!error) {
      self.config = config;
      callback(null, self.config);
    } else {
      callback(new MiraclError(messages.invalid_issuer, error));
    }
  });
}

/**
  *Get authorization url to pass it to x-authurl
  *
  * @example
  * var miraclClient = require('maas-sdk-nodejs');
  * var miracl = new MiraclClient(
  *  {clientID: "CLIENT_ID",
  *  clientSecret: "CLIENT_SECRET",
  *  callbackURL: "REDIRECT_URI"},
  *  function(error, config) {
  *   var auth_url = miracl.getAuthorizationRequestUrl(session);
  *  }
  * );
  *
  * @name MiraclClient#getAuthorizationRequestUrl
  * @method
  * @param {Object} session, see compatible session stores here https://github.com/expressjs/session#compatible-session-stores
  *  if session store in use is not listed and does not work properly with this package,
  *  sync your app's session with session object passed and modified by function
  * @return {string} url to send authorization request
*/
MiraclClient.prototype.getAuthorizationRequestUrl = function(session) {
  var params = { response_type: 'code', client_id: this.options.clientID, redirect_uri: this.options.redirectURL };
  var scope = this.config.scopes_supported;

  if(Array.isArray(scope)) {
    scope = this.config.scopes_supported.join(' ');
  }

  if(scope) {
    params.scope = scope;
  } else {
    params.scope = 'openid';
  }

  function generateRandomString() {
    return crypto.randomBytes(16).toString('hex');
  }
  if(session[SESSION_MIRACL_STATE_KEY] === undefined || session[SESSION_MIRACL_STATE_KEY].length == 0) {
    session[SESSION_MIRACL_STATE_KEY] = generateRandomString();
  }
  if(session[SESSION_MIRACL_NONCE_KEY] === undefined || session[SESSION_MIRACL_NONCE_KEY].length == 0) {
    session[SESSION_MIRACL_NONCE_KEY] = generateRandomString();
  }

  params.state = session[SESSION_MIRACL_STATE_KEY];
  params.nonce = session[SESSION_MIRACL_NONCE_KEY];

  return this.config.authorizationURL + '?' + querystring.stringify(params);
}

/**
  *Validate authorization when authorization server makes request to your app
  *
  * @example
  * var miraclClient = require('maas-sdk-nodejs');
  * var miracl = new MiraclClient(
  *  {clientID: "CLIENT_ID",
  *  clientSecret: "CLIENT_SECRET",
  *  callbackURL: "REDIRECT_URI"},
  *  function(error, config) {
  *   miracl.validateAuthorization(params, session, function(error, accessToken) {
  *
  *   });
  *  }
  * );
  *
  * @name MiraclClient#validateAuthorization
  * @method
  * @param {Object} params Pass state and code as keys in params object
  * @param {Object} session See compatible session stores here https://github.com/expressjs/session#compatible-session-stores
  *  if session store in use is not listed and does not work properly with this package
  *  sync your app's session with session object passed and modified by function
  * @param {Function} cb Callback function, returns error on unsuccessful request or accessToken otherwise
  * @throws {MiraclError} If query does not contain code or state or
  *                       query state differs from state in session or
  *                       access token request failed or
  *                       access token is invalid
*/
MiraclClient.prototype.validateAuthorization = function(params, session, callback) {
  var code = params.code;

  if(!params.code || !params.state) {
    return callback(new MiraclError(messages.code_state_missing));
  }

  if(session[SESSION_MIRACL_STATE_KEY] !== params.state) {
    return callback(new MiraclError(messages.state_differs));
  }

  delete session[SESSION_MIRACL_STATE_KEY];
  delete session[SESSION_MIRACL_NONCE_KEY];

  this._getTokenAndUserinfo(code, 'authorization_code', session, callback);
}

/**
  *Returns access token if it is in session or false otherwise
  *
  * @example
  * var miraclClient = require('maas-sdk-nodejs');
  * var miracl = new MiraclClient(
  *  {clientID: "CLIENT_ID",
  *  clientSecret: "CLIENT_SECRET",
  *  callbackURL: "REDIRECT_URI"},
  *  function(error, config) {
  *   miracl.isAuthorized(session);
  *  }
  * );
  *
  * @name MiraclClient#isAuthorized
  * @method
  * @param {Object} session See compatible session stores here https://github.com/expressjs/session#compatible-session-stores
  *  if session store in use is not listed and does not work properly with this package,
  *  sync your app's session with session object passed and modified by function
  * @return {string} returns access token or false if access token not in session
*/
MiraclClient.prototype.isAuthorized = function(session) {
  if(session[SESSION_MIRACL_TOKEN_KEY]) {
    return session[SESSION_MIRACL_TOKEN_KEY];
  } else {
    return false;
  }
}

/**
  *Returns email
  *
  * @example
  * var miraclClient = require('maas-sdk-nodejs');
  * var miracl = new MiraclClient(
  *  {clientID: "CLIENT_ID",
  *  clientSecret: "CLIENT_SECRET",
  *  callbackURL: "REDIRECT_URI"},
  *  function(error, config) {
  *   miracl.getEmail(session);
  *  }
  * );
  *
  * @name MiraclClient#getEmail
  * @method
  * @param {Object} session See compatible session stores here https://github.com/expressjs/session#compatible-session-stores
  *  if session store in use is not listed and does not work properly with this package
  *  sync your app's session with session object passed and modified by function
  * @throws {MiraclError} If access token request failed or it is invalid
  * @return {String} returns email or 'None' if email is not provided by Mpad
*/
MiraclClient.prototype.getEmail = function(session, callback) {
  var accessToken = session[SESSION_MIRACL_TOKEN_KEY];

  if(session[SESSION_MIRACL_USERINFO_KEY]){
    if(!session[SESSION_MIRACL_USERINFO_KEY].email) {
      callback(null, 'None');
    } else {
      callback(null, session[SESSION_MIRACL_USERINFO_KEY].email);
    }
  } else {

    this._getTokenAndUserinfo(accessToken, 'refresh', session, function(error, userinfo) {
      if(error) {
        return callback(error);
      }

      if(!session[SESSION_MIRACL_USERINFO_KEY].email) {
        callback(null, 'None');
      } else {
        callback(null, session[SESSION_MIRACL_USERINFO_KEY].email);
      }
    });
  }
}

/**
  *Returns userid
  *
  * @example
  * var miraclClient = require('maas-sdk-nodejs');
  * var miracl = new MiraclClient(
  *  {clientID: "CLIENT_ID",
  *  clientSecret: "CLIENT_SECRET",
  *  callbackURL: "REDIRECT_URI"},
  *  function(error, config) {
  *   miracl.getUserID(session);
  *  }
  * );
  *
  * @name MiraclClient#getUserID
  * @method
  * @param {Object} session See compatible session stores here https://github.com/expressjs/session#compatible-session-stores
  *  if session store in use is not listed and does not work properly with this package
  *  sync your app's session with session object passed and modified by function
  * @throws {MiraclError} If access token request failed or it is invalid
  * @return {string} returns userid or 'None' if userid is not provided by Mpad
*/
MiraclClient.prototype.getUserID = function(session, callback) {
  var accessToken = session[SESSION_MIRACL_TOKEN_KEY];

  if(session[SESSION_MIRACL_USERINFO_KEY]) {
    if(!session[SESSION_MIRACL_USERINFO_KEY].sub) {
      callback(null, 'None');
    } else {
      callback(null, session[SESSION_MIRACL_USERINFO_KEY].sub);
    }
  } else {
    this._getTokenAndUserinfo(accessToken, 'refresh', session, function(error, userinfo) {
      if(error) {
        return callback(error);
      }

      if(!session[SESSION_MIRACL_USERINFO_KEY].sub) {
        callback(null, 'None');
      } else {
        callback(null, session[SESSION_MIRACL_USERINFO_KEY].sub);
      }
    });
  }
}

/**
  *Clears userinfo and access token from session
  *
  * @example
  * var miraclClient = require('maas-sdk-nodejs');
  * var miracl = new MiraclClient(
  *  {clientID: "CLIENT_ID",
  *  clientSecret: "CLIENT_SECRET",
  *  callbackURL: "REDIRECT_URI"},
  *  function(error, config) {
  *   miracl.clearUserInfo(session, true);
  *  }
  * );
  *
  * @name MiraclClient#clearUserInfo
  * @method
  * @param {Object} session See compatible session stores here https://github.com/expressjs/session#compatible-session-stores
  *  if session store in use is not listed and does not work properly with this package
  *  sync your app's session with session object passed and modified by function
  * @param {Boolean} includingAuth, pass true if access token has to be cleared from session, false by default
*/
MiraclClient.prototype.clearUserInfo = function(session, includingAuth) {
  includingAuth = typeof includingAuth !== 'undefined' ? includingAuth : false;

  if(includingAuth) {
    session[SESSION_MIRACL_TOKEN_KEY] = "";
  }
  session[SESSION_MIRACL_STATE_KEY] = "";
  session[SESSION_MIRACL_NONCE_KEY] = "";
  session[SESSION_MIRACL_USERINFO_KEY] = "";

  return true;
}

MiraclClient.prototype._getTokenAndUserinfo = function(code, grantType, session, callback) {
  var oauth2 = new OAuth2(this.options.clientID,  this.options.clientSecret, '', this.config.authorizationURL, this.config.tokenURL);

  if(grantType === 'refresh') {

    oauth2._request("GET", this.config.userInfoURL, { 'Authorization': "Bearer " + code, 'Accept': "application/json" }, null, null, function (error, body, res) {
      if(error) {
        return callback(new MiraclError(messages.access_token_failed, error.data));
      }

      try {
        var json = JSON.parse(body);
        session[SESSION_MIRACL_USERINFO_KEY] = json;

        callback(null, session[SESSION_MIRACL_USERINFO_KEY]);
      } catch(exception) {
        return callback(new MiraclError(messages.access_token_json_parsing_error), exception);
      }
    });

  } else {

    oauth2.getOAuthAccessToken(code, { grant_type: 'authorization_code', redirect_uri: this.options.redirectURL }, function(error, accessToken, refreshToken, params) {
      if(error) {
        return callback(new MiraclError(messages.access_token_failed, error.data));
      }

      var idToken = params['id_token'];
      if (!idToken) {
        return callback(new MiraclError(messages.id_token_present));
      }

      var idTokenSegments = idToken.split('.');
      var jwtClaimsStr;
      var jwtClaims;

      try {
        jwtClaimsStr = new Buffer(idTokenSegments[1], 'base64').toString();
        jwtClaims = JSON.parse(jwtClaimsStr);
      } catch (exception) {
        return callback(new MiraclError(messages.access_token_json_parsing_error),exception);
      }

      var iss = jwtClaims.iss;
      var sub = jwtClaims.sub;

      session[SESSION_MIRACL_USERINFO_KEY] = jwtClaims;
      session[SESSION_MIRACL_TOKEN_KEY] = accessToken;

      callback(null, accessToken);
    });
  }
}

/**
 * MiraclError wrapper for possible errors using this package or those covered in OAuth2 package
 *
 * @private
 * @param {String} mesage
 * @param  {Error} error Original error text
 * @return {String} error message
 */
function MiraclError(message, error){
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.name = 'MiraclError';
  this.message = message;
  this.error = error;
  var message = this.error ?
                this.message + ", original error: " + this.error :
                this.message;
  return message;
};

module.exports = MiraclClient;
