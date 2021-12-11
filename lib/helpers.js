const crypto = require('crypto');
const config = require('../config');
const querystring = require('querystring');
const https = require('https');

const path = require('path');
const fs = require('fs');

const helpers = {};

helpers.hash = (string) => {
  if (typeof string == 'string' && string.length > 0) {
    let hash = crypto
      .createHmac('sha256', config.secert)
      .update(string)
      .digest('hex');

    return hash;
  } else {
    return false;
  }
};

// Parse json to Object

helpers.parseJsonToObject = (json) => {
  try {
    let object = JSON.parse(json);
    return object;
  } catch (error) {
    return {};
  }
};

helpers.createRandomToken = (strLength) => {
  strLength = typeof strLength == 'number' && strLength > 0 ? strLength : false;
  if (strLength) {
    let possibleCharacters = '0123456789abcdef';

    let str = '';

    for (let index = 0; index < strLength; index++) {
      str += possibleCharacters.charAt(
        Math.floor(Math.random() * possibleCharacters.length)
      );
    }
    return str;
  } else {
    return false;
  }
};

// send sms (Twilio)

helpers.sendSms = (phone, msg, callback) => {
  phone =
    typeof phone == 'string' && phone.trim().length == 10
      ? phone.trim()
      : false;
  msg =
    typeof msg == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600
      ? msg.trim()
      : false;

  if (phone && msg) {
    // Configuration Twilio sms
    let payload = {
      From: config.twilio.fromPhone,
      To: '+91' + phone,
      Body: msg,
    };

    let stringPayload = querystring.stringify(payload);

    let requestDetails = {
      protocol: 'https:',
      hostname: 'api.twilio.com',
      method: 'POST',
      path:
        '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
      auth: config.twilio.accountSid + ':' + config.twilio.authToken,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload),
      },
    };

    let req = https.request(requestDetails, (res) => {
      let status = res.statusCode;

      if (status == 200 || status == 201) {
        callback(false);
      } else {
        callback('StatusCode:' + status);
      }
    });

    req.on('error', function (e) {
      callback(e);
    });

    req.write(stringPayload);

    req.end();
  } else {
    callback('Given parameters were missing');
  }
};

/***
 *
 * **/








helpers.addTemplates = (str, data, callback) => {
  str = typeof str === 'string' && str.length > 0 ? str : '';
  data = typeof data == 'object' && data !== null ? data : {};

  helpers.getTemplate('_header', data, (err, headerString) => {
    if (!err && headerString) {
      helpers.getTemplate('_footer', data, (err, footerString) => {
        if (!err && footerString) {
          let fullString = headerString + str + footerString;

          callback(false, fullString);
        } else {
          callback('Error Fetching footer Template');
        }
      });
    } else {
      callback('Error Fetching Header Template');
    }
  });
};

helpers.dynamicTemplate = (str, data) => {
  str = typeof str === 'string' && str.length > 0 ? str : '';
  data = typeof data == 'object' && data !== null ? data : {};

  for (let keyName in config.templateGlobals) {
    if (config.templateGlobals.hasOwnProperty(keyName)) {
      data['global.' + keyName] = config.templateGlobals[keyName];
    }
  }

  for (let key in data) {
    if (data.hasOwnProperty(key) && typeof (data[key] == 'string')) {
      let replace = data[key];
      let find = '{' + key + '}';
      str = str.replace(find, replace);
    }
  }

  return str;
};

helpers.getTemplate = (templateName, data, callback) => {
  templateName =
    typeof templateName == 'string' && templateName.length > 0
      ? templateName
      : false;

  data = typeof data == 'object' && data !== null ? data : {};

  if (templateName) {
    let templateDir = path.join(__dirname, '/../templates/');

    fs.readFile(templateDir + templateName + '.html', 'utf8', (err, str) => {
      if (!err && str && str.length > 0) {
        let includes = helpers.dynamicTemplate(str, data);
        callback(false, includes);
      } else {
        callback('No templates found');
      }
    });
  } else {
    callback('InValid templateName', templateName);
  }
};



helpers.getStaticAssests = (fileName,callback)=>{
  fileName = typeof(fileName) == 'string' && fileName.length > 0 ? fileName : false;
  if(fileName){
    let publicDir = path.join(__dirname,'/../public/');
    fs.readFile(publicDir+fileName, function(err,data){
      if(!err && data){
        callback(false,data);
      } else {
        callback('No file could be found');
      }
    });
  } else {
    callback('A valid file name was not specified');
  }
};




module.exports = helpers;
