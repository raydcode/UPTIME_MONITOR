const fs = require('fs');

const path = require('path');

const lib = {};

lib.baseDir = path.join(__dirname, '/../.data/');

lib.create = function (dir, file, data, callback) {
  fs.open(
    lib.baseDir + dir + '/' + file + '.json',
    'wx',
    function (err, fileDescriptor) {
      if (!err && fileDescriptor) {
        let stringData = JSON.stringify(data);

        fs.writeFile(fileDescriptor, stringData, function (err) {
          if (!err) {
            fs.close(fileDescriptor, function (err) {
              if (!err) {
                callback(false);
              } else {
                callback('Closing file failed ');
              }
            });
          } else {
            callback('Error Writing JSON');
          }
        });
      } else {
        callback("Could n't create new file already exists");
      }
    }
  );
};

lib.read = function (dir, file, callback) {
  fs.readFile(
    lib.baseDir + dir + '/' + file + '.json',
    'utf-8',
    function (err, data) {
      callback(err, data);
    }
  );
};

lib.update = function (dir, file, data, callback) {
  fs.open(
    lib.baseDir + dir + '/' + file + '.json',
    'r+',
    function (err, fileDescriptor) {
      if (!err && fileDescriptor) {
        let stringData = JSON.stringify(data);

        fs.ftruncate(fileDescriptor, function (err) {
          if (!err) {
            fs.writeFile(fileDescriptor, stringData, function (err) {
              if (!err) {
                fs.close(fileDescriptor, function (err) {
                  if (!err) {
                    callback(false);
                  } else {
                    callback('Closing file failed ');
                  }
                });
              } else {
                callback('Error : writing to exising file');
              }
            });
          } else {
            callback('ERROR Truncating a file');
          }
        });
      } else {
        callback('Could open a file ,it may not existing');
      }
    }
  );
};

lib.delete = function (dir, file, callback) {
  fs.unlink(lib.baseDir + dir + '/' + file + '.json', function (err) {
    if (!err) {
      callback(false);
    } else {
      callback('Could not delete a file');
    }
  });
};

module.exports = lib;
