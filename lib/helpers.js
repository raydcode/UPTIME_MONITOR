const crypto = require('crypto');
const config = require('../config');

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

module.exports = helpers;
