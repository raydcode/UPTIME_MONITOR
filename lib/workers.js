const _data = require('./data');
const https = require('https');
const http = require('http');
const helpers = require('./helpers');
const url = require('url');
const _logs = require('./logs');
const util = require('util');
const debug = util.debuglog('workers');
// Init workers Object

let workers = {};

workers.log = (logData) => {
  // Form log _data

  let logString = JSON.stringify(logData);

  let logFileName = logData.check.id;

  _logs.append(logFileName, logString, (err) => {
    if (!err) {
      debug('Logging file Succesfully');
    } else {
      debug('Logging file Failed');
    }
  });
};

workers.alertsUserToStateChange = (alertData) => {
  let msg =
    'Alert : Your check for ' +
    alertData.methods.toUpperCase() +
    ' ' +
    alertData.protocol +
    '://' +
    alertData.url +
    ' ' +
    'is currently' +
    ' ' +
    alertData.state;

  helpers.sendSms(alertData.userPhone, msg, (err) => {
    if (!err) {
      debug('Success: User was alerted via Sms' + msg);
    } else {
      debug('Error: Sms could not send Problem occured' + ' ' + err);
    }
  });
};

workers.processCheckOutcome = (checkData, checkOutome) => {
  //  Decide if check is up or down

  let state =
    !checkOutome.error &&
    checkOutome.responseCode &&
    checkData.successCodes.indexOf(checkOutome.responseCode) > -1
      ? 'up'
      : 'down';

  let alertWarranted =
    checkData.lastChecked && checkData.state !== state ? true : false;

  //  Update checkData

  let newCheckData = checkData;
  let timeOfCheck = Date.now();

  let logData = {
    check: checkData,
    outcome: checkOutome,
    state,
    Status: alertWarranted,
    time: timeOfCheck,
  };

  workers.log(logData);

  newCheckData.state = state;
  newCheckData.lastChecked = timeOfCheck;

  //  Log the Outcome

  // Save the Updates

  _data.update('checks', newCheckData.id, newCheckData, function (err) {
    if (!err) {
      if (alertWarranted) {
        workers.alertsUserToStateChange(newCheckData);
      } else {
        debug('Check outcome has not changed');
      }
    } else {
      debug('Error trying to update checks');
    }
  });
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
    typeof data.url === 'string' && data.url.trim().length > 0
      ? data.url.trim()
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
    debug('Checks not formatted properly....');
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
            debug('Error: Reading one of the checks data', err);
          }
        });
      });
    } else {
      debug('Error: Could not find any checks to process');
    }
  });
};

workers.rotateLogs = () => {
  _logs.list(false, (err, logs) => {
    if (!err && logs && logs.length > 0) {
      logs.forEach((log) => {
        let logId = log.replace('.log', '');
        let newFieldId = logId + '-' + Date.now();
        _logs.compress(logId, newFieldId, (err) => {
          if (!err) {
            _logs.truncate(logId, (err) => {
              if (!err) {
                debug('Success Truncate log Files');
              } else {
                debug('Error Truncate log Files', err);
              }
            });
          } else {
            debug('Error: Compressing log file failed', err);
          }
        });
      });
    } else {
      debug('Error : could not find any log files');
    }
  });
};

workers.loop = () => {
  setInterval(() => {
    workers.gatherAllchecks();
  }, 1000 * 60);
};

// Timer to execute Once per day;

workers.logRotationLoop = () => {
  setInterval(() => {
    workers.rotateLogs();
  }, 1000 * 60 * 60 * 24);
};

workers.init = () => {
  // Exec all the checks
  workers.gatherAllchecks();
  workers.loop();
  workers.rotateLogs();
  workers.logRotationLoop();

  // console log middleware
  console.log('\x1b[33m%s\x1b[0m', 'Background workers are Running');
};

module.exports = workers;
