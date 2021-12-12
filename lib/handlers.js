const _data = require('./data');
const helpers = require('./helpers');
const config = require('../config');

const handlers = {};

/**
 *  @HTML API Handlers
 *
 */

/****************************************INDEX HANDLERS***************************************************/

handlers.index = (data, callback) => {
  if (data.method == 'get') {
    let templateData = {
      'head.title': 'Up Time Monitor',
      'head.description': 'Up Time Monitor for Rest Api Services',
      'body.title': 'Up Time Monitor ',
      'body.class': 'index',
    };

    helpers.getTemplate('index', templateData, (err, str) => {
      if (!err && str) {
        helpers.addTemplates(str, templateData, (err, str) => {
          if (!err && str) {
            callback(200, str, 'html');
          } else {
            callback(500, undefined, 'html');
          }
        });
      } else {
        callback(500, undefined, 'html');
      }
    });
  } else {
    callback(405, undefined, 'html');
  }
};

/**
 * @Account Create Handler
 */

handlers.createAccount = (data, callback) => {
  // Reject any request that isn't a GET
  if (data.method == 'get') {
    // Prepare data for interpolation
    var templateData = {
      'head.title': 'Create an Account',
      'head.description': 'Signup is easy and only takes a few seconds.',
      'body.class': 'accountCreate',
    };
    // Read in a template as a string
    helpers.getTemplate('accountCreate', templateData,  (err, str)=> {
      if (!err && str) {
        // Add the universal header and footer
        helpers.addTemplates(str, templateData, (err, str)=> {
          if (!err && str) {
            // Return that page as HTML
            callback(200, str, 'html');
          } else {
            callback(500, undefined, 'html');
          }
        });
      } else {
        callback(500, undefined, 'html');
      }
    });
  } else {
    callback(405, undefined, 'html');
  }
};

/************************************************************************************************/
/**
 *  @JSON API Handlers
 *
 */

/** ** 

 @USER_HANDLERS
**/

handlers.users = (data, callback) => {
  const methods = ['get', 'post', 'put', 'delete'];

  if (methods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._users = {};

handlers._users.post = (data, callback) => {
  let firstName =
    typeof data.payload.firstName == 'string' &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;

  let lastName =
    typeof data.payload.lastName == 'string' &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  let phoneNumber =
    typeof data.payload.phoneNumber == 'string' &&
    data.payload.phoneNumber.trim().length == 10
      ? data.payload.phoneNumber.trim()
      : false;
  let password =
    typeof data.payload.password == 'string' &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  let tosAgreement =
    typeof data.payload.tosAgreement == 'boolean' &&
    data.payload.tosAgreement == true
      ? true
      : false;

  if (firstName && lastName && phoneNumber && password && tosAgreement) {
    //  User doesn't already Exist ********************************

    _data.read('users', phoneNumber, function (err) {
      if (err) {
        // Hash password

        let hashedPassword = helpers.hash(password);

        if (hashedPassword) {
          const userObject = {
            firstName,
            lastName,
            phoneNumber,
            hashedPassword,
            tosAgreement,
          };

          _data.create('users', phoneNumber, userObject, function (err) {
            if (!err) {
              callback(200, { success: true });
            } else {
              console.log(err);
              callback(500, { success: false });
            }
          });
        } else {
          callback(500, { error: 'password hashing failed' });
        }
      } else {
        console.log(err);
        callback(400, { error: 'User already Exist' });
      }
    });
  } else {
    callback(400, { error: 'Missing required fields' });
  }
};

handlers._users.get = (data, callback) => {
  let phone =
    typeof data.queryStringObject.phoneNumber === 'string' &&
    data.queryStringObject.phoneNumber.trim().length == 10
      ? data.queryStringObject.phoneNumber.trim()
      : false;

  if (phone) {
    //  Get token from Headers

    let token =
      typeof data.headers.token === 'string' ? data.headers.token : false;

    //  Verify Token

    handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
      if (tokenIsValid) {
        _data.read('users', phone, function (err, data) {
          if (!err && data) {
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(400);
          }
        });
      } else {
        callback(403, { error: 'Token is Invalid' });
      }
    });
  } else {
    callback(400, { Error: 'User not found' });
  }
};

handlers._users.put = (data, callback) => {
  let phone =
    typeof data.payload.phoneNumber === 'string' &&
    data.payload.phoneNumber.trim().length == 10
      ? data.payload.phoneNumber.trim()
      : false;

  let firstName =
    typeof data.payload.firstName == 'string' &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;

  let lastName =
    typeof data.payload.lastName == 'string' &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;

  let password =
    typeof data.payload.password == 'string' &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (phone) {
    if (firstName || lastName || password) {
      let token =
        typeof data.headers.token === 'string' ? data.headers.token : false;

      handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
        if (tokenIsValid) {
          _data.read('users', phone, function (err, data) {
            if (!err && data) {
              if (firstName) {
                data.firstName = firstName;
              }
              if (lastName) {
                data.lastName = lastName;
              }
              if (password) {
                data.hashedPassword = helpers.hash(password);
              }

              _data.update('users', phone, data, function (err) {
                if (!err) {
                  callback(200, { success: true });
                } else {
                  console.log(err);
                  callback(500, { error: 'Internal server Error' });
                }
              });
            } else {
              callback(400, { error: 'User doest not exists' });
            }
          });
        } else {
          callback(403, { error: 'Invalid token' });
        }
      });

      if (token) {
      } else {
        callback(403, { error: 'Invalid token' });
      }
    } else {
      callback(400, { error: 'Missing fiels to Update' });
    }
  } else {
    callback(400, { error: 'Missing required fields' });
  }
};

handlers._users.delete = (data, callback) => {
  let phone =
    typeof data.queryStringObject.phoneNumber === 'string' &&
    data.queryStringObject.phoneNumber.trim().length == 10
      ? data.queryStringObject.phoneNumber.trim()
      : false;

  if (phone) {
    let token =
      typeof data.headers.token === 'string' ? data.headers.token : false;

    handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
      if (tokenIsValid) {
        _data.read('users', phone, function (err, userData) {
          if (!err && userData) {
            _data.delete('users', phone, function (err) {
              if (!err) {
                let userChecks =
                  typeof userData.checks == 'object' &&
                  userData.checks instanceof Array
                    ? userData.checks
                    : [];

                let checksToDelete = userChecks.length;

                if (checksToDelete > 0) {
                  let checksDeleted = 0;
                  let deletionErrors = false;

                  userChecks.forEach((checkId) => {
                    _data.delete('checks', checkId, function (err) {
                      if (err) {
                        deletionErrors = true;
                      }
                      checksDeleted++;
                      if (checksDeleted == checksToDelete) {
                        if (!deletionErrors) {
                          callback(200);
                        } else {
                          callback(500, { error: 'Error occured in deletion' });
                        }
                      }
                    });
                  });
                } else {
                  callback(200);
                }
              } else {
                callback(500, { error: 'Could not delete user' });
              }
            });
          } else {
            callback(400, { error: 'Could not find user' });
          }
        });
      } else {
        callback(403, { error: 'Invalid token' });
      }
    });
  } else {
    callback(400, { Error: 'User not found' });
  }
};

/*****
 *
 *  @TOKEN_HANDLERS
 *
 * **/

handlers.tokens = (data, callback) => {
  const methods = ['get', 'post', 'put', 'delete'];

  if (methods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._tokens = {};

handlers._tokens.post = (data, callback) => {
  let phoneNumber =
    typeof data.payload.phoneNumber == 'string' &&
    data.payload.phoneNumber.trim().length == 10
      ? data.payload.phoneNumber.trim()
      : false;
  let password =
    typeof data.payload.password == 'string' &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (phoneNumber && password) {
    _data.read('users', phoneNumber, function (err, data) {
      if (!err && data) {
        let hashedPassword = helpers.hash(password);
        if (hashedPassword == data.hashedPassword) {
          let tokenId = helpers.createRandomToken(20);
          let expires = Date.now() + 1000 * 60 * 60;
          const tokenObject = {
            phoneNumber,
            tokenId,
            expires,
          };

          _data.create('tokens', tokenId, tokenObject, function (err) {
            if (!err) {
              callback(200, { success: true, tokenObject });
            } else {
              callback(500, { error: 'Creation failed' });
            }
          });
        } else {
          callback(400, { error: 'password did not matched' });
        }
      } else {
        callback(400, { error: 'Could not find Users' });
      }
    });
  } else {
    console.log(err);
    callback(400, { error: 'Missing Required Fileds' });
  }
};

handlers._tokens.get = (data, callback) => {
  let tokenId =
    typeof data.queryStringObject.id == 'string' &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (tokenId) {
    _data.read('tokens', tokenId, function (err, data) {
      if (!err && data) {
        callback(200, data);
      } else {
        callback(400);
      }
    });
  } else {
    callback(400, { Error: 'Data not found' });
  }
};

handlers._tokens.put = (data, callback) => {
  let tokenId =
    typeof data.payload.id == 'string' && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;

  let extend =
    typeof data.payload.extend == 'boolean' && data.payload.extend == true
      ? true
      : false;

  if (tokenId && extend) {
    _data.read('tokens', tokenId, function (err, data) {
      if (!err && data) {
        if (data.expires > Date.now()) {
          data.expires = Date.now() + 1000 * 60 * 60;
          _data.update('tokens', tokenId, data, function (err) {
            if (!err) {
              callback(200, { success: true });
            } else {
              callback(500, { error: 'Internal Server Error' });
            }
          });
        } else {
          callback(400, { error: 'Token has already expired' });
        }
      } else {
        callback(400, { error: 'Token not exists' });
      }
    });
  } else {
    callback(400, { error: 'Missing required fields' });
  }
};

handlers._tokens.delete = (data, callback) => {
  let tokenId =
    typeof data.queryStringObject.id === 'string' &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (tokenId) {
    _data.read('tokens', tokenId, function (err, data) {
      if (!err && data) {
        _data.delete('tokens', tokenId, function (err) {
          if (!err) {
            callback(200, { success: true });
          } else {
            callback(500, { error: 'Could not delete user' });
          }
        });
      } else {
        callback(400, { error: 'Could not find user' });
      }
    });
  } else {
    callback(400, { Error: 'User not found' });
  }
};

// Auth tokens

handlers._tokens.verifyToken = (id, phone, callback) => {
  _data.read('tokens', id, function (err, data) {
    if (!err && data) {
      if (data.phoneNumber === phone && data.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

/**
 *
 * @CHECKS_HANDLERS
 *
 * **/

handlers.checks = (data, callback) => {
  const methods = ['get', 'post', 'put', 'delete'];

  if (methods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._checks = {};

handlers._checks.post = (data, callback) => {
  let protocol =
    typeof data.payload.protocol == 'string' &&
    ['http', 'https'].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;
  let url =
    typeof data.payload.url == 'string' && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;

  let methods =
    typeof data.payload.methods == 'string' &&
    ['post', 'get', 'put', 'delete'].indexOf(data.payload.methods) > -1
      ? data.payload.methods
      : false;

  let successCodes =
    typeof data.payload.successCodes == 'object' &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;

  let timeoutSeconds =
    typeof data.payload.timeoutSeconds == 'number' &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds < 5
      ? data.payload.timeoutSeconds
      : false;

  if (protocol && url && methods && successCodes && timeoutSeconds) {
    //  Get token from Headers
    let token =
      typeof data.headers.token == 'string' ? data.headers.token : false;

    _data.read('tokens', token, function (err, data) {
      if (!err && data) {
        let userPhone = data.phoneNumber;

        _data.read('users', userPhone, function (err, data) {
          if (!err && data) {
            let userChecks =
              typeof data.checks == 'object' && data.checks instanceof Array
                ? data.checks
                : [];
            //  Verify checks per User

            if (userChecks.length < config.maxChecks) {
              let checkId = helpers.createRandomToken(20);
              let checkObject = {
                id: checkId,
                userPhone,
                protocol,
                url,
                methods,
                successCodes,
                timeoutSeconds,
              };

              _data.create('checks', checkId, checkObject, function (err) {
                if (!err) {
                  data.checks = userChecks;
                  data.checks.push(checkId);
                  _data.update('users', userPhone, data, function (err) {
                    if (!err) {
                      callback(200, checkObject);
                    } else {
                      callback(500, { error: 'Could update user check' });
                    }
                  });
                } else {
                  callback(500, { error: 'Could not create check' });
                }
              });
            } else {
              callback(400, {
                error: `limit exceed for checks each user have only ${config.maxChecks} checks`,
              });
            }
          } else {
            callback(403);
          }
        });
      } else {
        callback(403);
      }
    });
  } else {
    callback(400, { error: 'Invalid Inputs!' });
  }
};

handlers._checks.get = (data, callback) => {
  let Id =
    typeof data.queryStringObject.id === 'string' &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (Id) {
    _data.read('checks', Id, function (err, checkdata) {
      if (!err && checkdata) {
        //  Get token from Headers

        let token =
          typeof data.headers.token == 'string' ? data.headers.token : false;

        // //  Verify Token

        handlers._tokens.verifyToken(
          token,
          checkdata.userPhone,
          function (tokenIsValid) {
            if (tokenIsValid) {
              callback(200, checkdata);
            } else {
              callback(403, { error: 'Token is Invalid' });
            }
          }
        );
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: 'User not found' });
  }
};

handlers._checks.put = (data, callback) => {
  let id =
    typeof data.payload.id === 'string' && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;

  let protocol =
    typeof data.payload.protocol == 'string' &&
    ['http', 'https'].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;
  let url =
    typeof data.payload.url == 'string' && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;

  let methods =
    typeof data.payload.methods == 'string' &&
    ['post', 'get', 'put', 'delete'].indexOf(data.payload.methods) > -1
      ? data.payload.methods
      : false;

  let successCodes =
    typeof data.payload.successCodes == 'object' &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;

  let timeoutSeconds =
    typeof data.payload.timeoutSeconds == 'number' &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds < 5
      ? data.payload.timeoutSeconds
      : false;

  if (id) {
    if (protocol || url || methods || successCodes || timeoutSeconds) {
      _data.read('checks', id, function (err, checkData) {
        if (!err && checkData) {
          let token =
            typeof data.headers.token == 'string' ? data.headers.token : false;

          // //  Verify Token

          handlers._tokens.verifyToken(
            token,
            checkData.userPhone,
            function (tokenIsValid) {
              if (tokenIsValid) {
                if (protocol) {
                  checkData.protocol = protocol;
                }

                if (url) {
                  checkData.url = url;
                }

                if (methods) {
                  checkData.methods = methods;
                }

                if (successCodes) {
                  checkData.successCodes = successCodes;
                }

                if (timeoutSeconds) {
                  checkData.timeoutSeconds = timeoutSeconds;
                }

                _data.update('checks', id, checkData, function (err) {
                  if (!err) {
                    callback(200, checkData);
                  } else {
                    callback(500, { error: 'Could not Update' });
                  }
                });
              } else {
                callback(403, { error: 'Token is Invalid' });
              }
            }
          );
        } else {
          callback(400, { error: 'Check ID doest not exist' });
        }
      });
    } else {
      callback(400, { error: 'Missing  fileds to update' });
    }
  } else {
    callback(400, { error: 'Missing Required fileds' });
  }
};

handlers._checks.delete = (data, callback) => {
  //

  let id =
    typeof data.queryStringObject.id === 'string' &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    _data.read('checks', id, function (err, checkData) {
      if (!err && checkData) {
        let token =
          typeof data.headers.token === 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(
          token,
          checkData.userPhone,
          function (tokenIsValid) {
            if (tokenIsValid) {
              _data.delete('checks', id, function (err) {
                if (!err) {
                } else {
                  callback(500, { error: err });
                }
              });

              _data.read(
                'users',
                checkData.userPhone,
                function (err, userData) {
                  if (!err && userData) {
                    let userChecks =
                      typeof userData.checks == 'object' &&
                      userData.checks instanceof Array
                        ? userData.checks
                        : [];

                    let checkPosition = userChecks.indexOf(id);

                    if (checkPosition > -1) {
                      userChecks.splice(checkPosition, 1);

                      _data.update(
                        'users',
                        checkData.userPhone,
                        userData,
                        function (err) {
                          if (!err) {
                            callback(200);
                          } else {
                            callback(500, { error: 'Could not update user' });
                          }
                        }
                      );
                    } else {
                      callback(500, {
                        error: 'could find checks in user object',
                      });
                    }
                  } else {
                    callback(500, { error: 'Could not find user' });
                  }
                }
              );
            } else {
              callback(403, { error: 'Invalid token' });
            }
          }
        );
      } else {
        callback(400, { error: 'Check Id is not exist' });
      }
    });
  } else {
    callback(400, { Error: 'User not found' });
  }
};

/**
 *
 * @FAVICON handlers
 */

handlers.favicon = (data, callback) => {
  if (data.method == 'get') {
    helpers.getStaticAssests('favicon.ico', (err, data) => {
      if (!err && data) {
        callback(200, data, 'favicon');
      } else {
        callback(500);
      }
    });
  } else {
    callback(405, undefined, 'html');
  }
};

/**
 *
 * @PUBLIC Assests
 */

handlers.public = (data, callback) => {
  if (data.method == 'get') {
    let trimmedAssets = data.trimmedPath.replace('public/', '').trim();

    if (trimmedAssets.length > 0) {
      helpers.getStaticAssests(trimmedAssets, (err, data) => {
        if (!err && data) {
          let contentType = 'plain';
          if (trimmedAssets.indexOf('.css') > -1) {
            contentType = 'css';
          }

          if (trimmedAssets.indexOf('.png') > -1) {
            contentType = 'png';
          }

          if (trimmedAssets.indexOf('.jpg') > -1) {
            contentType = 'jpg';
          }

          if (trimmedAssets.indexOf('.ico') > -1) {
            contentType = 'favicon';
          }

          // Callback the data
          callback(200, data, contentType);
        } else {
          callback(404);
        }
      });
    } else {
      callback(404);
    }
  } else {
    callback(405);
  }
};

/**
 *
 * @COMMON_HANDLERS
 *
 */

handlers.ping = (data, callback) => {
  callback(200);
};

handlers.notFound = (data, callback) => {
  callback(404);
};

module.exports = handlers;
