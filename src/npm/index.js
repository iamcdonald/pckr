const { execSync } = require('child_process');

const pack = (modulePath) => {
  const res = execSync('npm pack', {
    cwd: modulePath
  });
  return res.toString().replace(/\n/, '');
};

const installFileToModule = (file, modulePath) => {
  execSync(`npm install ${file}`, {
    cwd: modulePath
  });
};

module.exports = {
  pack,
  installFileToModule
};
