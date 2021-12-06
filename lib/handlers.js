const _data = require('./data');
const helpers = require('./helpers');

const handlers = {};

handlers.ping = (data, callback) => {
  callback(200);
};

handlers.notFound = (data, callback) => {
  callback(404);
};

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
    _data.read('users', phone, function (err, data) {
      if (!err && data) {
        delete data.hashedPassword;
        callback(200, data);
      } else {
        callback(400);
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
    callback(400, { Error: 'User not found' });
  }
};

module.exports = handlers;
