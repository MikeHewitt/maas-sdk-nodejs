var express = require('express');
var session = require('express-session');
var flash = require('connect-flash');
var miraclClient = require('./node_modules/maas-sdk-nodejs/lib/index'); // TODO: to be changed after pushing to git repo
var app = express();

app.set('view engine', 'ejs');
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))

app.use(flash());
app.use(function(req, res, next){
    res.locals.success = req.flash('success');
    res.locals.danger = req.flash('danger');
    next();
});


app.use(function(req, res, next) {
  req.miracl = new miraclClient({ // TODO: initialize this before each req
    clientID: "sflyuimq3wcxk",
    clientSecret: "50cc-Gr-n71uftgJ3XwiJ0lXyq2Yqhbw2f4AAP_3Q6Q",
    callbackURL: "http://127.0.0.1:5000/c2id"
  }, next);
});


app.get('/', function (req, res) {
  if(req.miracl.isAuthorized(req.session)){
    req.miracl.getEmail(req.session, function(err, email) {
      req.miracl.getUserID(req.session, function(err, user_id) {
        res.render('index', { is_authorized: true,
                              user_id: user_id,
                              email: email });
      });
    });
  }
  else res.render('index', {is_authorized: false,
                            auth_url: req.miracl.getAuthorizationRequestUrl(req.session) });
});

app.get('/c2id', function(req, res) {
  req.miracl.validateAuthorization(req.query, req.session, function (err, accessToken) {
    if(err){
      req.flash('danger','Login failed!');
    }
    else{
      req.flash('success','Successfully logged in!');
    }
    res.redirect('/');
  });
});

app.get('/refresh', function(req, res) {
  req.miracl.clearUserInfo(req.session);
  res.redirect('/');
});

app.get('/logout', function(req, res){
  req.miracl.clearUserInfo(req.session, true);
  res.redirect('/');
});

app.listen(5000);
module.exports = app;
