/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// use to process several content types for restful interaction
var bodyParser = require('body-parser');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// setup post post processing
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

app.post( "/gameserver/rwpl", function (req, res) {
	json_return_data = {
                          'command'     : req.body.content.command,                  // on, off, or other new ones
                          'participant' : req.body.content.unit,
                          'resource'    : req.body.content.resource,
                          'host'        : req.headers.host
                     };

    console.log('new invocation');
    console.dir(req.body);                     
    console.log("Event Emitter Data reource: " + req.body.content.resource + " transacation: " + 
    	        req.body.content.command + " return data: " + JSON.stringify(json_return_data));                    
	res.json(json_return_data);
});

port = 8756;  // see configuration.json file

// start server on the specified port and binding host
app.listen(port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on port " + port);
});