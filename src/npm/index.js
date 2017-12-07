const npm = require('npm');
const process = require('process');
const path = require('path');
const { execSync } = require('child_process');
const td = require('testdouble');

const _load = () => {
  return new Promise((resolve, reject) => {
    npm.load((e) => {
      if (e) {
        reject(e);
        return;
      }
      resolve();
    });
  });
};

const _pack = (path = '.') => {
  return new Promise((resolve, reject) => {
    npm.pack(path, (err, res) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(res);
    });
  });
};

const pack = async modulePath => {
  await _load();
  const [packageName] = await _pack(modulePath);
  return path.resolve(process.cwd(), packageName);
};

const installFileToModule = (file, modulePath) => {
  execSync(`npm install ${file}`, {
    cwd: modulePath,
    stdio: 'inherit'
  });
};

module.exports = {
  pack,
  installFileToModule
};
