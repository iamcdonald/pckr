const npm = require('./npm');
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');
const dependencies = require('./dependencies');

const SYM_DEP_DIR = 'sym-deps';

const getSymlinkDepFolder = modulePath => 
  path.resolve(modulePath, SYM_DEP_DIR);

const addSymlinkFolder = modulePath => {
  const symlinkFolder = getSymlinkDepFolder(modulePath);
  fs.mkdirSync(symlinkFolder);
  return symlinkFolder;
};

const move = (file, toLocation) => {
  const newName = path.resolve(toLocation, path.basename(file));
  fs.renameSync(file, newName);
  return newName;
};

const packageSymlinkDependencies = async modulePath => {
  const symDepFolder = addSymlinkFolder(modulePath);
  const symlinkedDeps = dependencies.getSymlinked(modulePath);
  const packed = symlinkedDeps.map(d => pack(d, symDepFolder));
  return Promise.all(packed);
};

const removeSymlinkFolder = modulePath => {
  return new Promise((resolve, reject) => { 
    rimraf(getSymlinkDepFolder(modulePath), err => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    }); 
  });
};

const cleanup = async modulePath => {
  await removeSymlinkFolder(modulePath);
};

const pack = async (modulePath, toLocation) => {
  await packageSymlinkDependencies(modulePath)
  const packagePath = await npm.pack(modulePath);
  await cleanup(modulePath);
  return move(packagePath, toLocation);
};

module.exports = {
  pack
};


