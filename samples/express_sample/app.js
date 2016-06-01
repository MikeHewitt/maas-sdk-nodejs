var express = require('express');
var MiraclClient = require('./node_modules/maas-sdk-nodejs/lib/index'); // TODO: to be changed after pushing to git repo
var app = express();

app.get('/', function (req, res) {
  res.send(MiraclClient());
});

app.listen(3000);
module.exports = app;
