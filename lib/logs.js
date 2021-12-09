const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

let lib = {};

lib.baseDir = path.join(__dirname, '/../.logs/');

lib.append = (fileName, data, callback) => {
  fs.open(lib.baseDir + fileName + '.log', 'a', function (err, fileDescriptor) {
    if (!err && fileDescriptor) {
      fs.appendFile(fileDescriptor, data + '/n', function (err) {
        if (!err) {
          fs.close(fileDescriptor, function (err) {
            if (!err) {
              callback(false);
            } else {
              callback('Error close log file ' + fileName);
            }
          });
        } else {
          callback('Error appending log file');
        }
      });
    } else {
      callback('Could not open file appended');
    }
  });
};

//List all the Logs

lib.list = (includeCompressedLogs, callback) => {
  fs.readdir(lib.baseDir, (err, data) => {
    if (!err && data && data.length > 0) {
      let trimmedFileNames = [];

      data.forEach((fileName) => {
        if (fileName.indexOf('.log') > -1) {
          trimmedFileNames.push(fileName.replace('.log', ''));
        }
        if (fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs) {
          trimmedFileNames.push(fileName.replace('.gz.b64', ''));
        }
      });

      callback(false, trimmedFileNames);
    } else {
      callback(err, data);
    }
  });
};

lib.compress = (logId, newFileId, callback) => {
  let sourceFile = logId + '.log';
  let targetFile = newFileId + '.gz.b64';

  fs.readFile(lib.baseDir + sourceFile, 'utf-8', (err, inputString) => {
    if (!err && inputString) {
      zlib.gzip(inputString, (err, buffer) => {
        if (!err && buffer) {
          fs.open(lib.baseDir + targetFile, 'wx', (err, fileDescriptor) => {
            if (!err && fileDescriptor) {
              fs.writeFile(fileDescriptor, buffer.toString('base64'), (err) => {
                if (!err) {
                  fs.close(fileDescriptor, (err) => {
                    if (!err) {
                      callback(false);
                    } else {
                      callback(err);
                    }
                  });
                } else {
                  callback(err);
                }
              });
            } else {
              callback(err);
            }
          });
        } else {
          callback(err);
        }
      });
    } else {
      callback(err);
    }
  });
};

lib.decompress = (fileId, callback) => {
  let fileName = fileId + '.gz.b64';

  fs.readFile(lib.baseDir + fileName, 'utf8', (err, str) => {
    if (!err && str) {
      let inputBuffer = Buffer.from(str, 'base64');

      zlib.unzip(inputBuffer, (err, outputBuffer) => {
        if (!err && outputBuffer) {
          let str = outputBuffer.toString();
          callback(false, str);
        } else {
          callback(err);
        }
      });
    } else {
      callback(err);
    }
  });
};

lib.truncate = (logId, callback) => {
  fs.truncate(lib.baseDir + logId + '.log', 0, (err) => {
    if (!err) {
      callback(false);
    } else {
      callback(err);
    }
  });
};

module.exports = lib;
