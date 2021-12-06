/* 

Create and export Configuration Variables :

*/

// Container for Environment

var environments = {};

// Staging (default ) Environment

environments.staging = {
  httpport: 3000,
  httpsport: 3001,
  envName: 'staging',
  secert: 'thisissecert',
};

// Production Environment

environments.production = {
  httpport: 5000,
  httpsport: 5001,
  envName: 'production',
  secert: 'thisissecert',
};

var currentEnvironment =
  typeof process.env.NODE_ENV === 'string'
    ? process.env.NODE_ENV.toLowerCase()
    : '';

var environmentToExport =
  typeof environments[currentEnvironment] == 'object'
    ? environments[currentEnvironment]
    : environments.staging;

module.exports = environmentToExport;
