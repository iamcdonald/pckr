const path = require('path');
const fs = require('fs');

const isModule = modulePath => 
  fs.existsSync(path.resolve(modulePath, 'package.json'));

const getSubDirsOfFolder = folder => 
  fs.readdirSync(folder)
    .map(subdir => path.resolve(folder, subdir));

const getNodeModules = folder => {
  const dirs = getSubDirsOfFolder(folder);
  const modules = dirs.filter(isModule);
  const subModules = dirs.filter(f => !isModule(f))
    .map(getNodeModules)
    .reduce((agg, modules) => agg.concat(modules), []);
  return modules.concat(subModules);
};

const isSymlink = module =>
  fs.lstatSync(module).isSymbolicLink();

const getSymlinked = modulePath =>
  getNodeModules(path.resolve(modulePath, 'node_modules'))
    .filter(isSymlink);

module.exports = {
  getSymlinked
}
