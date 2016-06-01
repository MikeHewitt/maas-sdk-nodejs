var url = require('url'),
    configuration = require('./configuration').configuration;

ISSUER = "http://mpinaas-demo.miracl.net:8001";//needs to be without slash at the end

function MiraclClient() {
  debugger;
  console.log("works!");
  configuration(ISSUER, function(err, config) {
    if(!err){
      console.log("successful!");
      console.log(config);
    }
    else console.log("Discovery failed");
  });
}



module.exports = MiraclClient;
//exports.MiraclClient;
