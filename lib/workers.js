const path = require('path');
const fs = require('fs');
const _data = require('./data');
const https = require('https');
const http = require('http');
const helpers = require('./helpers');
const url = require('url');

// Init workers Object

let workers = {};

workers.processCheckOutcome = (checkData, checkOutome) => {

  

};

//Perform Checks data

workers.performCheck = (checkData) => {
  //prepare initial check Outcome:

  let checkOutome = {
    error: false,
    responseCode: false,
  };

  let outcomeSent = false;

  // Parse the Hostname and path out of the data:

  let parsedUrl = url.parse(checkData.protocol + '://' + checkData.url, true);

  let hostname = parsedUrl.hostname;

  let path = parsedUrl.path; // using path !pathname

  let requestDetails = {
    protocol: checkData.protocol + ':',
    hostname,
    method: checkData.methods.toUpperCase(),
    path,
    timeout: checkData.timeoutSeconds * 1000,
  };

  let _moduleTouse = checkData.protocol == 'http' ? http : https;

  let req = _moduleTouse.request(requestDetails, (res) => {
    let status = res.statusCode;

    checkOutome.responseCode = status;
    if (!outcomeSent) {
      workers.processCheckOutcome(checkData, checkOutome);
      outcomeSent = true;
    }
  });

  req.on('error', (err) => {
    //  Update checkOutcome
    checkOutome.error = {
      error: true,
      value: err,
    };
    if (!outcomeSent) {
      workers.processCheckOutcome(checkData, checkOutome);
      outcomeSent = true;
    }
  });

  req.on('timeout', (err) => {
    //  Update checkOutcome
    checkOutome.error = {
      error: true,
      value: 'timeout',
    };
    if (!outcomeSent) {
      workers.processCheckOutcome(checkData, checkOutome);
      outcomeSent = true;
    }
  });

  req.end();
};

// Sanity check data

workers.validateCheckData = (data) => {
  data = typeof data === 'object' && data !== null ? data : {};

  data.id =
    typeof data.id === 'string' && data.id.trim().length == 20
      ? data.id.trim()
      : false;

  data.userPhone =
    typeof data.userPhone === 'string' && data.userPhone.trim().length == 10
      ? data.userPhone.trim()
      : false;

  data.protocol =
    typeof data.protocol === 'string' &&
    ['http', 'https'].indexOf(data.protocol) > -1
      ? data.protocol
      : false;

  data.url =
    typeof data.url === 'string' && data.url.trim().length == 10
      ? data.userPhone.trim()
      : false;

  data.methods =
    typeof data.methods === 'string' &&
    ['post', 'get', 'put', 'delete'].indexOf(data.methods) > -1
      ? data.methods
      : false;

  data.successCodes =
    typeof data.successCodes === 'object' &&
    data.successCodes instanceof Array &&
    data.successCodes.length > 0
      ? data.successCodes
      : false;

  data.timeoutSeconds =
    typeof data.timeoutSeconds == 'number' &&
    data.timeoutSeconds % 1 === 0 &&
    data.timeoutSeconds >= 1 &&
    data.timeoutSeconds <= 5
      ? data.timeoutSeconds
      : false;
  // New keys
  data.state =
    typeof data.state === 'string' && ['up', 'down'].indexOf(data.state) > -1
      ? data.state
      : 'down';

  data.lastChecked =
    typeof data.lastChecked == 'number' && data.lastChecked > 0
      ? data.lastChecked
      : false;

  // pass the data along process

  if (
    data.id &&
    data.userPhone &&
    data.protocol &&
    data.url &&
    data.methods &&
    data.successCodes &&
    data.timeoutSeconds
  ) {
    workers.performCheck(data);
  } else {
    console.log('Checks not formatted properly....');
  }
};

workers.gatherAllchecks = () => {
  _data.list('checks', function (err, checks) {
    if (!err && checks && checks.length > 0) {
      checks.forEach(function (check) {
        _data.read('checks', check, function (err, originalCheck) {
          if (!err && originalCheck) {
            workers.validateCheckData(originalCheck);
          } else {
            console.log('Error: Reading one of the checks data');
          }
        });
      });
    } else {
      console.log('Error: Could not find any checks to process');
    }
  });
};

workers.loop = () => {
  setInterval(() => {
    workers.gatherAllchecks();
  }, 1000 * 60);
};

workers.init = () => {
  // Exec all the checks
  workers.gatherAllchecks();
  workers.loop();
};

module.exports = workers;