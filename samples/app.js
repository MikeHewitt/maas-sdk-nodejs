var express = require('express');
var session = require('express-session');
var flash = require('connect-flash');
var miraclClient = require('maas-sdk-nodejs');
var config = require('config-json');
var app = express();

app.set('view engine', 'ejs');

app.use(session({
  secret: 'random_string',
  resave: false,
  saveUninitialized: true
}));

app.use(flash());
app.use(function(req, res, next){
    res.locals.success = req.flash('success');
    res.locals.danger = req.flash('danger');
    next();
});

app.use(function(req, res, next) {
  config.load('./sample.json');
  var configuration = config.get();
  req.miracl = new miraclClient(configuration, function(error, config) {
    if(!error){
      next();
    } else {
      res.send(error);
    }
  });
});

app.get('/', function (req, res) {
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
  } else {
    res.render('index', { is_authorized: false,
                            auth_url: req.miracl.getAuthorizationRequestUrl(req.session) });
  }
});

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

app.get('/refresh', function(req, res) {
  req.miracl.clearUserInfo(req.session);
  res.redirect('/');
});

app.get('/logout', function(req, res) {
  req.miracl.clearUserInfo(req.session, true);
  res.redirect('/');
});

app.listen(5000);
module.exports = app;
