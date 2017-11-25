const npm = require('npm');
const process = require('process');
const path = require('path');

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

module.exports = {
  pack
};
