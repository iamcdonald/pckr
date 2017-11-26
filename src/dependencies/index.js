const path = require('path');
const fs = require('fs');

const isModule = modulePath => 
  fs.existsSync(path.resolve(modulePath, 'package.json'));

const getSubDirsOfFolder = folder => 
  fs.readdirSync(folder)
    .map(subdir => path.resolve(folder, subdir))
    .filter(isDirectory);

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

const isDirectory = src => 
  fs.statSync(src).isDirectory();

const getSymlinked = modulePath => {
  const nodeModulesPath = path.resolve(modulePath, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    return getNodeModules(nodeModulesPath)
      .filter(isSymlink);
  }
  return [];
};

module.exports = {
  getSymlinked
}
