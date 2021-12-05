// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');
const _data = require('./lib/data');
const handlers = require('./lib/handlers');

_data.delete('test', 'newFile',function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log("deletd");
  }
});



const httpServer = http.createServer(function (req, res) {
  unifiedServer(req, res);
});

// Server Starting Point:
httpServer.listen(config.httpport, function () {
  console.log(
    `Server listening on port ${config.httpport} in environment mode on "${config.envName}"`
  );
});

const httpsServerOptions = {
  key: fs.readFileSync('./https/key.pem'),
  cert: fs.readFileSync('./https/cert.pem'),
};

const httpsServer = https.createServer(httpsServerOptions, function (req, res) {
  unifiedServer(req, res);
});

httpsServer.listen(config.httpsport, function () {
  console.log(
    `Server listening on port ${config.httpsport} in environment mode on "${config.envName}"`
  );
});

//Unified Server
var unifiedServer = (req, res) => {
  var parsedUrl = url.parse(req.url, true);

  // Get the Path
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, '');

  //Get the Query String  Object
  var queryStringObject = parsedUrl.query;

  // Get the HTTP Method :
  var method = req.method.toLowerCase();

  // Get the Header Object

  var headers = req.headers;

  //Payload
  var decoder = new StringDecoder('utf-8');
  var buffer = '';
  req.on('data', function (data) {
    buffer += decoder.write(data);
  });

  req.on('end', function () {
    buffer += decoder.end();

    //Choose the Handler for request
    var chosenHandler =
      typeof router[trimmedPath] != 'undefined'
        ? router[trimmedPath]
        : handlers.notFound;

    //Construct data Handler  Object

    var data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: buffer,
    };

    chosenHandler(data, (status, payload) => {
      // Default Status code and payload
      status = typeof status == 'number' ? status : 200;

      payload = typeof payload == 'object' ? payload : {};

      var payloadString = JSON.stringify(payload);

      res.setHeader('Content-Type', 'application/json');
      res.writeHead(status);

      res.end(payloadString);

      //Server LOG :
      console.log('Request is Received ', status, payloadString);
    });
  });
};

var router = {
  ping: handlers.ping,
  users: handlers.users,
};
