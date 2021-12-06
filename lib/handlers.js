const _data = require('./data');
const helpers = require('./helpers');

const handlers = {};

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
        _data.read('users', phone, function (err, data) {
          if (!err && data) {
            _data.delete('users', phone, function (err) {
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
        callback(403, { error: 'Invalid token' });
      }
    });
  } else {
    callback(400, { Error: 'User not found' });
  }
};

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

handlers.ping = (data, callback) => {
  callback(200);
};

handlers.notFound = (data, callback) => {
  callback(404);
};

module.exports = handlers;
