/* 

Entry File For Upmonitor

*/

// Dependencies
const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

const server = http.createServer(function (req, res) {
  // Get URL and Parse
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

      res.writeHead(status);

      res.end(payloadString);

      //Server LOG :
      console.log('Request is Received ', status, payloadString);
    });
  });
});

// Server Starting Point:
server.listen(3000, function () {
  console.log('Server listening on port @3000 !!');
});

var handlers = {};

handlers.sample = (data, callback) => {
  // callback http status code and a Payload Object
  callback(406, { name: 'sample Handler' });
};

handlers.notFound = (data, callback) => {
  callback(404);
};

var router = {
  sample: handlers.sample,
};
