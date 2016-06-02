var express = require('express');
var MiraclClient = require('./node_modules/maas-sdk-nodejs/lib/index'); // TODO: to be changed after pushing to git repo
var app = express();

app.set('view engine', 'ejs');


app.get('/', function (req, res) {
  var miracl = new MiraclClient({
    clientID: "sflyuimq3wcxk",
    clientSecret: "50cc-Gr-n71uftgJ3XwiJ0lXyq2Yqhbw2f4AAP_3Q6Q",
    callbackURL: "http://127.0.0.1:5000/c2id"
  }, done);

  function done(err, config){
    res.render('index', { auth_url: miracl.get_authorization_request_url() });
  }
});

app.get('/c2id', function(req, res) {
  console.log(req.query);
  res.send("success!");
});

app.listen(5000);
module.exports = app;
