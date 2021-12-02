/* 

Create and export Configuration Variables :

*/

// Container for Environment

var environments = {};

// Staging (default ) Environment

environments.staging = {
  port: 3000,
  envName: 'staging',
};

// Production Environment

environments.production = {
  port: 5000,
  envName: 'production',
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
