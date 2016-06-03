var express = require('express');
var session = require('express-session');
var MiraclClient = require('./node_modules/maas-sdk-nodejs/lib/index'); // TODO: to be changed after pushing to git repo
var app = express();

app.set('view engine', 'ejs');

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))


app.get('/', function (req, res) {
  var session = req.session;
  var miracl = new MiraclClient({ // TODO: initialize this before each req
    clientID: "sflyuimq3wcxk",
    clientSecret: "50cc-Gr-n71uftgJ3XwiJ0lXyq2Yqhbw2f4AAP_3Q6Q",
    callbackURL: "http://127.0.0.1:5000/c2id"
  }, done);

  function done(err, config){
    if(miracl.isAuthorized(session)){
      console.log("1");
      miracl.getEmail(session, function(err, email) {
        console.log(email);
        res.render('index', { is_authorized: true, email: session.miraclUserinfo.sub });
      });
    }


    else res.render('index', { is_authorized: false,
                          auth_url: miracl.getAuthorizationRequestUrl(session) });
  }
});

app.get('/c2id', function(req, res) {
  var session = req.session;
  var miracl = new MiraclClient({ // TODO: initialize this before each req
    clientID: "sflyuimq3wcxk",
    clientSecret: "50cc-Gr-n71uftgJ3XwiJ0lXyq2Yqhbw2f4AAP_3Q6Q",
    callbackURL: "http://127.0.0.1:5000/c2id"
  }, done);

  function done(err, config){
    miracl.validateAuthorization(req.query, session, function (err, accessToken) {
      if(err) res.send("There was an error");
      else res.redirect('/');
    });
  }
});

app.get('/refresh', function(req, res) {
  var session = req.session;
  var miracl = new MiraclClient({ // TODO: initialize this before each req
    clientID: "sflyuimq3wcxk",
    clientSecret: "50cc-Gr-n71uftgJ3XwiJ0lXyq2Yqhbw2f4AAP_3Q6Q",
    callbackURL: "http://127.0.0.1:5000/c2id"
  }, done);

  function done(err, config){
    miracl.clearUserInfo(session);
    res.redirect('/');
  }
});

app.listen(5000);
module.exports = app;
