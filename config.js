/* 

Create and export Configuration Variables :

*/

// Container for Environment

const environments = {};

// Staging (default ) Environment

environments.staging = {
  httpport: 3000,
  httpsport: 3001,
  envName: 'staging',
  secert: 'thisissecert',
  maxChecks: 5,
  twilio: {
    accountSid: 'AC9b78629ee78ca0d0172130b17a31094a',
    authToken: '3139ac330b059746b5978aa6110548f0',
    fromPhone: '+18506053724',
  },
};

// Production Environment

environments.production = {
  httpport: 5000,
  httpsport: 5001,
  envName: 'production',
  secert: 'thisissecert',
  maxChecks: 5,
};

const currentEnvironment =
  typeof process.env.NODE_ENV === 'string'
    ? process.env.NODE_ENV.toLowerCase()
    : '';

const environmentToExport =
  typeof environments[currentEnvironment] == 'object'
    ? environments[currentEnvironment]
    : environments.staging;

module.exports = environmentToExport;
