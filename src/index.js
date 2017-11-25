const npm = require('./npm');
const path = require('path');
const fs = require('fs');

const move = (file, toLocation) => {
  const newName = path.resolve(toLocation, path.basename(file));
  fs.renameSync(file, newName);
  return newName;
};


const pack = async (modulePath, toLocation) => {
  const packagePath = await npm.pack(modulePath);
  return move(packagePath, toLocation);
};

module.exports = {
  pack
};


