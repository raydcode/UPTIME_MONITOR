// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('../config');
const fs = require('fs');
const handlers = require('./handlers');
const helpers = require('./helpers');

const path = require('path');

// Server module Object Object

let server = {};

server.httpServer = http.createServer(function (req, res) {
  server.unifiedServer(req, res);
});

server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '/../https/cert.pem')),
};

server.httpsServer = https.createServer(
  server.httpsServerOptions,
  function (req, res) {
    server.unifiedServer(req, res);
  }
);

//Unified Server
server.unifiedServer = (req, res) => {
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
      typeof server.router[trimmedPath] != 'undefined'
        ? server.router[trimmedPath]
        : handlers.notFound;

    //Construct data Handler  Object

    var data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: helpers.parseJsonToObject(buffer),
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
      console.log(` ${method.toUpperCase()}`, status, payloadString);
    });
  });
};

server.router = {
  ping: handlers.ping,
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks,
};

server.init = () => {
  server.httpsServer.listen(config.httpsport, function () {
    console.log(
      '\x1b[35m%s\x1b[0m',
      `Server listening on port ${config.httpsport} in environment mode on "${config.envName}"`
    );
  });

  // Server Starting Point:
  server.httpServer.listen(config.httpport, function () {
    console.log(
      '\x1b[36m%s\x1b[0m',
      `Server listening on port ${config.httpport} in environment mode on "${config.envName}"`
    );
  });
};

module.exports = server;
