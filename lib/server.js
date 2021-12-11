// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('../config');
const fs = require('fs');
const handlers = require('./handlers');
const helpers = require('./helpers');
const util = require('util');
const debug = util.debuglog('request');

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
  let parsedUrl = url.parse(req.url, true);

  // Get the Path
  let path = parsedUrl.pathname;
  let trimmedPath = path.replace(/^\/+|\/+$/g, '');

  //Get the Query String  Object
  let queryStringObject = parsedUrl.query;

  // Get the HTTP Method :
  let method = req.method.toLowerCase();

  // Get the Header Object

  let headers = req.headers;

  //Payload
  let decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', function (data) {
    buffer += decoder.write(data);
  });

  req.on('end', function () {
    buffer += decoder.end();

    //Choose the Handler for request
    let chosenHandler =
      typeof server.router[trimmedPath] != 'undefined'
        ? server.router[trimmedPath]
        : handlers.notFound;


        chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler;

    //Construct data Handler  Object

    let data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: helpers.parseJsonToObject(buffer),
    };

    chosenHandler(data, (status, payload, contentType) => {




      // Default Status code and payload

      contentType = typeof contentType == 'string' ? contentType : 'json';

      status = typeof status == 'number' ? status : 200;

      let payloadString = '';

      if (contentType == 'json') {
        res.setHeader('Content-Type', 'application/json');
        payload = typeof payload == 'object' ? payload : {};

        payloadString = JSON.stringify(payload);
      }

      if (contentType == 'html') {
        res.setHeader('Content-Type', 'text/html');
        payload = typeof payload == 'string' ? payload : '';
        payloadString = payload;
      }

      if (contentType == 'favicon') {
        res.setHeader('Content-Type', 'image/x-icon');
        payloadString = typeof payload !== 'undefined' ? payload : '';
      }

      if (contentType == 'plain') {
        res.setHeader('Content-Type', 'text/plain');
        payloadString = typeof payload !== 'undefined' ? payload : '';
      }

      if (contentType == 'css') {
        res.setHeader('Content-Type', 'text/css');
        payloadString = typeof payload !== 'undefined' ? payload : '';
      }

      if (contentType == 'png') {
        res.setHeader('Content-Type', 'image/png');
        payloadString = typeof payload !== 'undefined' ? payload : '';
      }

      if (contentType == 'jpg') {
        res.setHeader('Content-Type', 'image/jpeg');
        payloadString = typeof payload !== 'undefined' ? payload : '';
      }

      res.writeHead(status);
      res.end(payloadString);

      if (status === 200) {
        debug(
          '\x1b[32m%s\x1b[0m',
          method.toUpperCase() + ' /' + trimmedPath + ' ' + status + ' ',
          payloadString
        );
      } else {
        debug(
          '\x1b[35m%s\x1b[0m',
          method.toUpperCase() + ' /' + trimmedPath + ' ' + status + ' ',
          payloadString
        );
      }

      //Server LOG :
    });
  });
};

server.router = {
  '': handlers.index,
  'account/create': handlers.createAccount,
  'account/edit': handlers.editAccount,
  'account/delete': handlers.deleteAccount,
  'session/create': handlers.createSession,
  'session/delete': handlers.deleteSession,
  'checks/all': handlers.checksList,
  'checks/create': handlers.checksCreate,
  'checks/edit': handlers.checksEdit,
  ping: handlers.ping,
  'api/users': handlers.users,
  'api/tokens': handlers.tokens,
  'api/checks': handlers.checks,
  'favicon.ico': handlers.favicon,
  'public': handlers.public,
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
