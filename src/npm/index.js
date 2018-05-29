const { execSync } = require('child_process');
const process = require('process');

const pack = (modulePath) => {
  const res = execSync('npm pack', {
    cwd: modulePath,
    env: process.env
  });
  return res.toString().replace(/\n/, '');
};

const installFileToModule = (file, modulePath) => {
  execSync(`npm install ${file}`, {
    cwd: modulePath,
    env: process.env
  });
};

module.exports = {
  pack,
  installFileToModule
};
