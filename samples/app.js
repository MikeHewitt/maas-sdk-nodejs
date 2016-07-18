var express = require('express');
var session = require('express-session');
var flash = require('connect-flash');
var miraclClient = require('maas-sdk-nodejs');
var config = require('config-json');
var app = express();

app.set('view engine', 'ejs');

/**
 * Setting up Express session
 * 'session' object is saved in req object and available to all route methods
**/
app.use(session({
  secret: 'random_string',
  resave: false,
  saveUninitialized: true
}));

// Using connect-flash so flash messages can be stored and retrieved from req obejct
app.use(flash());

// Making flash messages available to view
app.use(function(req, res, next){
    res.locals.success = req.flash('success');
    res.locals.danger = req.flash('danger');
    next();
});

app.use(function(req, res, next) {
  // Retrieving credentials from 'sample.json'
  config.load('./sample.json');
  var configuration = config.get();

  // Initialization of miraclClient and storing it in req obejct so it is available to route methods
  req.miracl = new miraclClient(configuration, function(error, config) {
    if(!error){
      next();
    } else {
      res.send(error);
    }
  });
});

app.get('/', function (req, res) {
  /**
   * If miracl.isAuthorized() returns access token,
   * then user info can be obtained by calling miracl.getEmail() and miracl.getUserID()
   * Second parameter of these functions is callaback
   * containing error on unsuccessful request
   * or email and user_id strings otherwise
  **/
  if(req.miracl.isAuthorized(req.session)) {
    req.miracl.getEmail(req.session, function(error, email) {
      req.miracl.getUserID(req.session, function(error, user_id) {
        if(error) {
          res.send(error);
        } else {
          res.render('index', { is_authorized: true,
                              user_id: user_id,
                              email: email }
          );
        }
      });
    });
  /**
   * If miracl.isAuthorized() returns false,
   * then miracl.getAuthorizationRequestUrl() has to be called
   * to construct authorization url
  **/
  } else {
    res.render('index', { is_authorized: false,
                            auth_url: req.miracl.getAuthorizationRequestUrl(req.session) });
  }
});

/**
 * Authorization has to be validated by calling miracl.validateAuthorization()
 * Request query, containg state and code, and session objects has to be passed to function
 * so states can be compared and access token saved in session object
 * accessToken is returned on successful validation and saved in the session variable
 * along with the obtained userinfo
**/
app.get('/c2id', function(req, res) {
  req.miracl.validateAuthorization(req.query, req.session, function (err, accessToken) {
    if(err){
      console.log(err.toString());
      req.flash('danger','Login failed!');
    } else {
      req.flash('success','Successfully logged in!');
    }

    res.redirect('/');
  });
});

/**
 * In order to refresh userinfo, call miracl.clearUserInfo()
 * It clears userinfo from session but accessToken remains unchanged
 * so userinfo can be requested without performing fresh authorization.
**/
app.get('/refresh', function(req, res) {
  req.miracl.clearUserInfo(req.session);
  res.redirect('/');
});

/**
 * If 'true' is passed to miracl.clearUserInfo() as second parameter,
 * then not only userinfo is cleared from session but also accessToken
 * so fresh authorization is required to retrieve userinfo
**/
app.get('/logout', function(req, res) {
  req.miracl.clearUserInfo(req.session, true);
  res.redirect('/');
});

app.listen(5000);
module.exports = app;
