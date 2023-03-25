const fs = require('fs');

const readFile = (path, opts = 'utf8') => new Promise((resolve, reject) => require('fs').readFile(path, opts, (err, data) => (err ? reject(err) : resolve(data))));
const writeFile = (path, data, opts = 'utf8') => new Promise((resolve, reject) => require('fs').writeFile(path, data, opts, (err) => (err ? reject(err) : resolve(true))));

const createOperations = (command, NODE_ENV) => {
  let isShell = NODE_ENV!=='test' ? true : false;
  require('child_process').spawnSync("gqlg  "+command, { shell: isShell });
  return true;
};

function checkFileExists(filepath) {
  return new Promise((resolve, reject) => {
    fs.access(filepath, fs.constants.F_OK, (error) => {
      resolve(!error);
    });
  });
}
 
module.exports.createOperations = createOperations;
module.exports.writeFile = writeFile;
module.exports.readFile = readFile;
module.exports.checkFileExists = checkFileExists;