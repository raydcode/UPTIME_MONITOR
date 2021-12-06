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

module.exports = helpers;
